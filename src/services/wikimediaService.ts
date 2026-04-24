// src/services/wikimediaService.ts
// Looks up a Creative Commons photo for an archaeological site from
// Wikimedia Commons / Wikipedia using GeoSearch + PageImages.
//
// Strategy:
//   1) Geosearch Wikipedia around the site's lat/lng (radius 500 m).
//   2) Pick the best candidate page (prefer titles mentioning the
//      monument class or townland; skip obviously-unrelated pages).
//   3) Fetch a thumbnail + image metadata (artist, licence, file page).
//
// Returns null when no suitable photo is found — caller should show a
// graceful placeholder.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ArchSite } from '../data/sites';

const USER_AGENT =
  'EvinCairn/1.0 (https://irisharchaeology.app; contact via app store listing)';

const CACHE_PREFIX = 'wm_photo_v1_';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const NEG_TTL_MS = 7 * 24 * 60 * 60 * 1000;    // 7 days for "no photo"

export interface SitePhoto {
  url: string;            // direct thumbnail URL (~600 px wide)
  pageUrl: string;        // Wikipedia/Commons page for attribution link
  artist: string;         // plain-text author
  licenseShort: string;   // e.g. "CC BY-SA 4.0"
}

interface CacheEntry {
  ts: number;
  photo: SitePhoto | null;
}

interface GeoSearchResponse {
  query?: { geosearch?: Array<{ pageid: number; title: string; dist: number }> };
}

interface PageImagesResponse {
  query?: {
    pages?: Record<
      string,
      {
        title: string;
        thumbnail?: { source: string; width: number; height: number };
        pageimage?: string;
        fullurl?: string;
        canonicalurl?: string;
      }
    >;
  };
}

interface ImageInfoResponse {
  query?: {
    pages?: Record<
      string,
      {
        imageinfo?: Array<{
          extmetadata?: {
            Artist?: { value?: string };
            LicenseShortName?: { value?: string };
          };
          descriptionurl?: string;
        }>;
      }
    >;
  };
}

async function wmFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Api-User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Wikimedia ${res.status}`);
  return (await res.json()) as T;
}

// Strip HTML tags out of the Artist field (often a wrapped <a> link).
function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Score candidate pages — higher is better. Negative = reject.
function scoreCandidate(
  title: string,
  site: ArchSite,
): number {
  const t = title.toLowerCase();
  const monumentWords = site.type
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((w) => w.length > 3);
  const townland = (site.name.split(',')[1] ?? '').trim().toLowerCase();
  const county = site.county.toLowerCase();

  // Hard rejects: obvious non-archaeology pages
  const REJECT = ['gaa', 'football', 'school', 'hotel', 'pub', 'restaurant',
    'parish', 'townland', 'civil parish', 'electoral', 'railway station'];
  if (REJECT.some((w) => t.includes(w))) return -1;

  let score = 0;
  if (monumentWords.some((w) => t.includes(w))) score += 5;
  if (townland && t.includes(townland)) score += 4;
  if (t.includes(county)) score += 1;

  // Generic boosts for archaeology-flavoured titles
  ['cairn', 'tomb', 'dolmen', 'ringfort', 'castle', 'abbey', 'tower',
    'cross', 'monastery', 'church', 'standing stone', 'stone circle',
    'megalithic', 'passage', 'wedge tomb', 'henge', 'cashel'].forEach((w) => {
    if (t.includes(w)) score += 2;
  });

  return score;
}

async function readCache(id: string): Promise<SitePhoto | null | undefined> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_PREFIX + id);
    if (!raw) return undefined;
    const entry: CacheEntry = JSON.parse(raw);
    const ttl = entry.photo ? CACHE_TTL_MS : NEG_TTL_MS;
    if (Date.now() - entry.ts > ttl) return undefined;
    return entry.photo;
  } catch {
    return undefined;
  }
}

async function writeCache(id: string, photo: SitePhoto | null): Promise<void> {
  try {
    const entry: CacheEntry = { ts: Date.now(), photo };
    await AsyncStorage.setItem(CACHE_PREFIX + id, JSON.stringify(entry));
  } catch {
    /* best-effort */
  }
}

async function fetchPhotoForPage(pageid: number): Promise<SitePhoto | null> {
  // 1) Get thumbnail + canonical url + the underlying image filename
  const piUrl =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&prop=pageimages|info&inprop=url&piprop=thumbnail|name&pithumbsize=600` +
    `&pageids=${pageid}`;
  const pi = await wmFetch<PageImagesResponse>(piUrl);
  const page = pi.query?.pages?.[String(pageid)];
  const thumb = page?.thumbnail?.source;
  const filename = page?.pageimage;
  const pageUrl = page?.canonicalurl ?? page?.fullurl ?? '';
  if (!thumb || !filename) return null;

  // 2) Get licence + author from the file's imageinfo on Commons
  const iiUrl =
    `https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*` +
    `&prop=imageinfo&iiprop=extmetadata|url` +
    `&titles=File:${encodeURIComponent(filename)}`;
  const ii = await wmFetch<ImageInfoResponse>(iiUrl);
  const pages = ii.query?.pages ?? {};
  const first = Object.values(pages)[0];
  const info = first?.imageinfo?.[0];
  const meta = info?.extmetadata ?? {};
  const artist = stripHtml(meta.Artist?.value ?? 'Unknown');
  const licenseShort = stripHtml(meta.LicenseShortName?.value ?? 'See file page');

  return {
    url: thumb,
    pageUrl: info?.descriptionurl ?? pageUrl,
    artist,
    licenseShort,
  };
}

/**
 * Look up a Wikimedia Commons photo for the given site.
 * Result is cached in AsyncStorage (positive 30 d, negative 7 d).
 */
export async function fetchSitePhoto(site: ArchSite): Promise<SitePhoto | null> {
  // Cache hit (including cached null)
  const cached = await readCache(site.id);
  if (cached !== undefined) return cached;

  try {
    const gsUrl =
      `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
      `&list=geosearch&gsradius=500&gslimit=10` +
      `&gscoord=${site.lat}|${site.lng}`;
    const gs = await wmFetch<GeoSearchResponse>(gsUrl);
    const candidates = gs.query?.geosearch ?? [];

    // Score and sort
    const ranked = candidates
      .map((c) => ({ ...c, score: scoreCandidate(c.title, site) }))
      .filter((c) => c.score >= 0)
      .sort((a, b) => b.score - a.score || a.dist - b.dist);

    for (const cand of ranked) {
      const photo = await fetchPhotoForPage(cand.pageid);
      if (photo) {
        await writeCache(site.id, photo);
        return photo;
      }
    }

    await writeCache(site.id, null);
    return null;
  } catch {
    // Network/API hiccup — don't cache, just return null this time
    return null;
  }
}
