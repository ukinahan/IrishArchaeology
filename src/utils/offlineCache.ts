// src/utils/offlineCache.ts
// MVP offline: cache site data to AsyncStorage on first load.
// County / road-trip pack downloads can be added in v2.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArchSite } from '../data/sites';
import { MEATH_SITES } from '../data/meathSites';

const CACHE_KEY = 'arch_sites_v1';
const CACHE_TS_KEY = 'arch_sites_ts_v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week

/**
 * Returns sites from cache if fresh, otherwise caches the bundled data and returns it.
 * This ensures the app works fully offline after first launch.
 */
export async function getCachedSites(): Promise<ArchSite[]> {
  try {
    const ts = await AsyncStorage.getItem(CACHE_TS_KEY);
    const now = Date.now();
    if (ts && now - parseInt(ts, 10) < CACHE_TTL_MS) {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (raw) return JSON.parse(raw) as ArchSite[];
    }
  } catch {
    // Fall through to bundled data
  }

  // Cache the bundled pilot dataset
  await cacheSites(MEATH_SITES);
  return MEATH_SITES;
}

export async function cacheSites(sites: ArchSite[]): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [CACHE_KEY, JSON.stringify(sites)],
      [CACHE_TS_KEY, Date.now().toString()],
    ]);
  } catch {
    // Non-fatal: offline caching is best-effort in MVP
  }
}
