// src/utils/offlineCache.ts
// Caches API-fetched site data to AsyncStorage for offline use.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArchSite } from '../data/sites';

const CACHE_KEY = 'arch_sites_v2';
const CACHE_TS_KEY = 'arch_sites_ts_v2';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 1 week
// Upper bound on how many sites we keep on disk. Browsing several large
// counties can push allSites past 50k records — serialising all of that
// to AsyncStorage on every fetch is both slow and a real memory pressure
// point on lower-end Android devices. Keep the most recent N.
const CACHE_MAX_SITES = 8000;

/**
 * Returns cached sites if fresh, otherwise an empty array.
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
    // Fall through
  }
  return [];
}

export async function cacheSites(sites: ArchSite[]): Promise<void> {
  try {
    // Trim to the most recent N entries (callers append, so the tail is
    // the most-recently-fetched data).
    const trimmed =
      sites.length > CACHE_MAX_SITES ? sites.slice(sites.length - CACHE_MAX_SITES) : sites;
    await AsyncStorage.multiSet([
      [CACHE_KEY, JSON.stringify(trimmed)],
      [CACHE_TS_KEY, Date.now().toString()],
    ]);
  } catch {
    // Non-fatal: offline caching is best-effort
  }
}
