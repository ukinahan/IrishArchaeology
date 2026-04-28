// src/store/useSiteStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArchSite, Period } from '../data/sites';
import { fetchSitesNear as apiFetchNear, fetchSitesByCounty, fetchSitesInBounds, fetchCountrySample } from '../services/siteService';
import {
  fetchNISitesNear,
  fetchNISitesByCounty,
  fetchNISitesInBounds,
  fetchNICountrySample,
  NI_COUNTIES,
} from '../services/niSiteService';
import { getCachedSites, cacheSites } from '../utils/offlineCache';

const SAVED_KEY = 'saved_site_ids_v1';

async function loadSavedIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SAVED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function persistSavedIds(ids: Set<string>): void {
  AsyncStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(ids))).catch(() => {});
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface SiteStore {
  allSites: ArchSite[];
  isLoading: boolean;
  bboxLoading: boolean;
  loadError: string | null;
  savedSiteIds: Set<string>;
  activePeriodFilter: Period | null;
  activeCountyFilter: string | null;
  radiusKm: number | null; // null = show all
  countrySampleLoaded: boolean;

  // Actions
  loadSitesNear: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  loadSitesByCounty: (county: string) => Promise<void>;
  loadSitesInBounds: (minLat: number, minLng: number, maxLat: number, maxLng: number) => Promise<void>;
  loadCountrySample: () => Promise<void>;
  initFromCache: () => Promise<void>;
  toggleSaved: (siteId: string) => void;
  isSaved: (siteId: string) => boolean;
  setRadiusKm: (km: number | null) => void;
  setActivePeriodFilter: (period: Period | null) => void;
  setActiveCountyFilter: (county: string | null) => void;
  getSitesNear: (lat: number, lng: number) => ArchSite[];
  getSavedSites: () => ArchSite[];
  addSites: (sites: ArchSite[]) => void;
}

/** Merge new sites into existing array, deduplicating by id. */
function mergeSites(existing: ArchSite[], incoming: ArchSite[]): ArchSite[] {
  const seen = new Set(existing.map((s) => s.id));
  const merged = [...existing];
  for (const s of incoming) {
    if (!seen.has(s.id)) {
      merged.push(s);
      seen.add(s.id);
    }
  }
  return merged;
}

export function getAvailableCounties(sites: ArchSite[]): string[] {
  return ['All', ...Array.from(new Set(sites.map((s) => s.county))).sort()];
}

export const useSiteStore = create<SiteStore>((set, get) => ({
  allSites: [],
  isLoading: false,
  bboxLoading: false,
  loadError: null,
  savedSiteIds: new Set(),
  activePeriodFilter: null,
  activeCountyFilter: null,
  radiusKm: 10 as number | null,
  countrySampleLoaded: false,

  loadCountrySample: async () => {
    if (get().countrySampleLoaded) return;
    try {
      const [roi, ni] = await Promise.all([
        fetchCountrySample(80).catch(() => [] as ArchSite[]),
        fetchNICountrySample(600).catch(() => [] as ArchSite[]),
      ]);
      const sites = [...roi, ...ni];
      if (sites.length === 0) return;
      set((s) => {
        const merged = mergeSites(s.allSites, sites);
        cacheSites(merged).catch(() => {});
        return { allSites: merged, countrySampleLoaded: true };
      });
    } catch {
      // Non-fatal — leaves flag false so a later attempt can retry
    }
  },

  initFromCache: async () => {
    try {
      const [cached, savedIds] = await Promise.all([getCachedSites(), loadSavedIds()]);
      set((s) => ({
        allSites: cached.length > 0 ? mergeSites(s.allSites, cached) : s.allSites,
        savedSiteIds: savedIds.length > 0 ? new Set([...s.savedSiteIds, ...savedIds]) : s.savedSiteIds,
      }));
    } catch {
      // Non-fatal
    }
  },

  loadSitesNear: async (lat, lng, radius) => {
    const r = radius ?? get().radiusKm ?? 10;
    set({ isLoading: true, loadError: null });
    try {
      const [roi, ni] = await Promise.all([
        apiFetchNear(lat, lng, r).catch(() => [] as ArchSite[]),
        fetchNISitesNear(lat, lng, r).catch(() => [] as ArchSite[]),
      ]);
      const sites = [...roi, ...ni];
      set((s) => {
        const merged = mergeSites(s.allSites, sites);
        // Fire-and-forget cache update
        cacheSites(merged).catch(() => {});
        return { allSites: merged, isLoading: false };
      });
    } catch (err) {
      // If API fails, keep whatever we already have (cached)
      set({ isLoading: false, loadError: err instanceof Error ? err.message : 'Network error' });
    }
  },

  loadSitesByCounty: async (county) => {
    set({ isLoading: true, loadError: null });
    try {
      const isNI = (NI_COUNTIES as readonly string[]).includes(county);
      const sites = isNI
        ? await fetchNISitesByCounty(county)
        : await fetchSitesByCounty(county);
      set((s) => {
        const merged = mergeSites(s.allSites, sites);
        cacheSites(merged).catch(() => {});
        return { allSites: merged, isLoading: false };
      });
    } catch (err) {
      set({ isLoading: false, loadError: err instanceof Error ? err.message : 'Network error' });
    }
  },

  toggleSaved: (siteId) =>
    set((state) => {
      const next = new Set(state.savedSiteIds);
      if (next.has(siteId)) {
        next.delete(siteId);
      } else {
        next.add(siteId);
      }
      persistSavedIds(next);
      return { savedSiteIds: next };
    }),

  isSaved: (siteId) => get().savedSiteIds.has(siteId),

  setRadiusKm: (km) => set({ radiusKm: km }),

  setActivePeriodFilter: (period) => set({ activePeriodFilter: period }),

  setActiveCountyFilter: (county) => set({ activeCountyFilter: county }),

  loadSitesInBounds: async (minLat, minLng, maxLat, maxLng) => {
    set({ bboxLoading: true });
    try {
      const [roi, ni] = await Promise.all([
        fetchSitesInBounds(minLat, minLng, maxLat, maxLng).catch(() => [] as ArchSite[]),
        fetchNISitesInBounds(minLat, minLng, maxLat, maxLng).catch(() => [] as ArchSite[]),
      ]);
      const sites = [...roi, ...ni];
      if (sites.length === 0) {
        set({ bboxLoading: false });
        return;
      }
      set((s) => {
        const merged = mergeSites(s.allSites, sites);
        cacheSites(merged).catch(() => {});
        return { allSites: merged, bboxLoading: false };
      });
    } catch {
      // Silent fail — background fetch, don't surface errors
      set({ bboxLoading: false });
    }
  },

  getSitesNear: (lat, lng) => {
    const { allSites, activePeriodFilter, activeCountyFilter } = get();
    return allSites.filter((site) => {
      const inPeriod = activePeriodFilter === null || site.period === activePeriodFilter;
      const inCounty = activeCountyFilter === null || site.county === activeCountyFilter;
      return inPeriod && inCounty;
    });
  },

  getSavedSites: () => {
    const { allSites, savedSiteIds } = get();
    return allSites.filter((s) => savedSiteIds.has(s.id));
  },

  addSites: (sites) => {
    if (!sites || sites.length === 0) return;
    set((s) => ({ allSites: mergeSites(s.allSites, sites) }));
  },
}));
