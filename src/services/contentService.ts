// src/services/contentService.ts
// Fetches the remote ContentManifest (stories + per-site enrichments) from
// a CDN URL configured via app.config.js -> extra.CONTENT_BASE_URL.
//
// Strategy:
//   1) Try AsyncStorage cache (24 h TTL). Fast first paint.
//   2) In the background, fetch /content.json from the CDN. If newer than
//      the cached version, replace the cache.
//   3) If we never have a remote manifest (offline first run, no CDN
//      configured), the bundled fallback content is used by callers.
//
// The bundled stories live in src/data/stories.ts and bundled enrichments
// in src/data/enrichments.ts. Remote content always wins on id collision.
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { ContentManifest } from '../data/content';

const CACHE_KEY = 'content_manifest_v1';
const CACHE_TS_KEY = 'content_manifest_ts_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;

function getBaseUrl(): string | null {
  const extra = (Constants.expoConfig?.extra as any) ?? {};
  const url = extra.CONTENT_BASE_URL as string | undefined;
  if (!url) return null;
  return url.replace(/\/$/, '');
}

function isManifest(value: unknown): value is ContentManifest {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === 'number' &&
    Array.isArray(v.stories) &&
    Array.isArray(v.enrichments)
  );
}

/**
 * Read the cached manifest if it's still within TTL.
 * Returns null on miss, expired, or parse error.
 */
export async function getCachedManifest(): Promise<ContentManifest | null> {
  try {
    const ts = await AsyncStorage.getItem(CACHE_TS_KEY);
    if (!ts) return null;
    if (Date.now() - parseInt(ts, 10) > CACHE_TTL_MS) return null;
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isManifest(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

async function writeCache(manifest: ContentManifest): Promise<void> {
  try {
    await AsyncStorage.multiSet([
      [CACHE_KEY, JSON.stringify(manifest)],
      [CACHE_TS_KEY, Date.now().toString()],
    ]);
  } catch {
    // Non-fatal
  }
}

/**
 * Fetch the manifest from the configured CDN. Resolves to null on any
 * failure (no URL configured, network error, timeout, malformed JSON).
 */
export async function fetchRemoteManifest(): Promise<ContentManifest | null> {
  const base = getBaseUrl();
  if (!base) return null;

  const controller =
    typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller
    ? setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    : null;

  try {
    const res = await fetch(`${base}/content.json`, {
      signal: controller?.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!isManifest(data)) return null;
    await writeCache(data);
    return data;
  } catch {
    return null;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Returns the freshest manifest available: cached if fresh, then a
 * background refresh fires regardless. Callers should treat the response
 * as a snapshot — the store layer subscribes to refreshes separately.
 */
export async function loadManifest(): Promise<ContentManifest | null> {
  const cached = await getCachedManifest();
  if (cached) {
    // Fire-and-forget background refresh.
    fetchRemoteManifest().catch(() => {});
    return cached;
  }
  return fetchRemoteManifest();
}
