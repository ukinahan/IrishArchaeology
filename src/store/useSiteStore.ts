// src/store/useSiteStore.ts
import { create } from 'zustand';
import { ArchSite, Period } from '../data/sites';
import { MEATH_SITES } from '../data/meathSites';
import { WEXFORD_SITES } from '../data/wexfordSites';

const ALL_SITES: ArchSite[] = [...MEATH_SITES, ...WEXFORD_SITES];

export const AVAILABLE_COUNTIES = ['All', ...Array.from(new Set(ALL_SITES.map((s) => s.county))).sort()];

interface SiteStore {
  allSites: ArchSite[];
  savedSiteIds: Set<string>;
  activePeriodFilter: Period | null;
  activeCountyFilter: string | null;
  radiusKm: number | null; // null = show all

  // Actions
  toggleSaved: (siteId: string) => void;
  isSaved: (siteId: string) => boolean;
  setRadiusKm: (km: number | null) => void;
  setActivePeriodFilter: (period: Period | null) => void;
  setActiveCountyFilter: (county: string | null) => void;
  getSitesNear: (lat: number, lng: number) => ArchSite[];
  getSavedSites: () => ArchSite[];
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

export const useSiteStore = create<SiteStore>((set, get) => ({
  allSites: ALL_SITES,
  savedSiteIds: new Set(),
  activePeriodFilter: null,
  activeCountyFilter: null,
  radiusKm: 10 as number | null,

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
      // null radius = show all; county filter also bypasses radius
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
