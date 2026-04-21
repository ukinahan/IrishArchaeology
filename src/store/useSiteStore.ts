// src/store/useSiteStore.ts
import { create } from 'zustand';
import { ArchSite, Period } from '../data/sites';
import { fetchSitesNear as apiFetchNear, fetchSitesByCounty } from '../services/siteService';
import { getCachedSites, cacheSites } from '../utils/offlineCache';

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
  loadError: string | null;
  savedSiteIds: Set<string>;
  activePeriodFilter: Period | null;
  activeCountyFilter: string | null;
  radiusKm: number | null; // null = show all

  // Actions
  loadSitesNear: (lat: number, lng: number, radiusKm?: number) => Promise<void>;
  loadSitesByCounty: (county: string) => Promise<void>;
  initFromCache: () => Promise<void>;
  toggleSaved: (siteId: string) => void;
  isSaved: (siteId: string) => boolean;
  setRadiusKm: (km: number | null) => void;
  setActivePeriodFilter: (period: Period | null) => void;
  setActiveCountyFilter: (county: string | null) => void;
  getSitesNear: (lat: number, lng: number) => ArchSite[];
  getSavedSites: () => ArchSite[];
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
  loadError: null,
  savedSiteIds: new Set(),
  activePeriodFilter: null,
  activeCountyFilter: null,
  radiusKm: 10 as number | null,

  initFromCache: async () => {
    try {
      const cached = await getCachedSites();
      if (cached.length > 0) {
        set((s) => ({ allSites: mergeSites(s.allSites, cached) }));
      }
    } catch {
      // Non-fatal
    }
  },

  loadSitesNear: async (lat, lng, radius) => {
    const r = radius ?? get().radiusKm ?? 10;
    set({ isLoading: true, loadError: null });
    try {
      const sites = await apiFetchNear(lat, lng, r);
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
      const sites = await fetchSitesByCounty(county);
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
      return { savedSiteIds: next };
    }),

  isSaved: (siteId) => get().savedSiteIds.has(siteId),

  setRadiusKm: (km) => set({ radiusKm: km }),

  setActivePeriodFilter: (period) => set({ activePeriodFilter: period }),

  setActiveCountyFilter: (county) => set({ activeCountyFilter: county }),

  getSitesNear: (lat, lng) => {
    const { allSites, radiusKm, activePeriodFilter, activeCountyFilter } = get();
    return allSites.filter((site) => {
      const inRadius = radiusKm === null || activeCountyFilter !== null ||
        haversineKm(lat, lng, site.lat, site.lng) <= radiusKm;
      const inPeriod = activePeriodFilter === null || site.period === activePeriodFilter;
      const inCounty = activeCountyFilter === null || site.county === activeCountyFilter;
      return inRadius && inPeriod && inCounty;
    });
  },

  getSavedSites: () => {
    const { allSites, savedSiteIds } = get();
    return allSites.filter((s) => savedSiteIds.has(s.id));
  },
}));
