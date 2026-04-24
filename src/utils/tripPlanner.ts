// src/utils/tripPlanner.ts
// Builds a multi-day archaeological road-trip from a pool of sites.
//
// Pipeline:
//   1. Filter input sites by period (and optionally county / radius).
//   2. Score each site by significance (curated marquee boost + NMS-derived
//      signals: well-known monument classes, presence of WEB_NOTES,
//      WEBSITE_LINK on the original record).
//   3. Pick the top-K candidates, where K is sized to the requested number
//      of days (≈ 4 stops per day).
//   4. k-means cluster the candidates by lat/lng with k = days, so each
//      day's stops are geographically coherent.
//   5. Within each day, order stops with a cheap nearest-neighbour TSP
//      starting from the cluster centroid (good enough for ≤8 stops).

import { ArchSite, Period } from '../data/sites';
import { matchMarquee, MarqueeSite } from '../data/marqueeSites';

export interface TripStop {
  site: ArchSite;
  marquee?: MarqueeSite;
  score: number;
}

export interface TripDay {
  index: number;            // 0-based day index
  stops: TripStop[];
  totalKm: number;          // sum of leg distances (great-circle)
}

export type PlannerPeriod = Period | 'all' | 'suggested';

export interface StartPoint {
  lat: number;
  lng: number;
  label: string;
}

export interface TripPlan {
  period: PlannerPeriod;
  county: string | null;
  themeKey?: string;        // suggested-mode theme used to build this plan
  start?: StartPoint;
  days: TripDay[];
  totalSites: number;
  totalKm: number;
}

/**
 * Curated suggested-route themes. Each theme is a hand-picked set of
 * marquee site names. When the user picks a theme, the planner restricts
 * itself to those marquees (in priority order) so the route is recognisable
 * and well-paced rather than a generic "top scored" mix.
 */
export interface SuggestedTheme {
  key: string;
  label: string;
  description: string;
  county?: string;          // primary county for context / fetch
  marqueeNames: string[];   // ordered list of marquee site names
}

export const SUGGESTED_THEMES: SuggestedTheme[] = [
  {
    key: 'boyne_valley',
    label: 'Brú na Bóinne & the Royal Boyne',
    description: 'Newgrange, Knowth, Tara, Trim Castle and the Hill of Slane — the heart of mythic Ireland.',
    county: 'Meath',
    marqueeNames: ['Newgrange Passage Tomb', 'Knowth', 'Dowth', 'Hill of Tara', 'Loughcrew Cairns', 'Kells Monastic Site', 'Trim Castle', 'Monasterboice', 'Mellifont Abbey'],
  },
  {
    key: 'burren_aran',
    label: 'The Burren & Aran Forts',
    description: 'Poulnabrone, Kilmacduagh and the Iron Age cliff-forts of the Aran Islands.',
    county: 'Clare',
    marqueeNames: ['Poulnabrone Dolmen', 'Quin Abbey', 'Inis Cealtra (Holy Island)', 'Kilmacduagh', 'Dún Aonghasa', 'Dún Conchúir', 'Dún Eochla'],
  },
  {
    key: 'wicklow_monastic',
    label: 'Wicklow & Kildare Monastic',
    description: 'Glendalough monastic city plus Dún Ailinne, the royal hill of the Kings of Leinster.',
    county: 'Wicklow',
    marqueeNames: ['Glendalough', 'Dún Ailinne'],
  },
  {
    key: 'cashel_tipperary',
    label: 'Cashel & Tipperary Castles',
    description: 'The Rock of Cashel, Cahir Castle and Athassel Priory — medieval Munster at its grandest.',
    county: 'Tipperary',
    marqueeNames: ['Rock of Cashel', 'Cahir Castle', 'Athassel Priory'],
  },
  {
    key: 'sligo_megalithic',
    label: 'Sligo Megalithic Heartland',
    description: 'Carrowmore, Carrowkeel and Creevykeel — 5,000 years of Atlantic tomb-builders.',
    county: 'Sligo',
    marqueeNames: ['Carrowmore Megalithic Cemetery', 'Carrowkeel Cairns', 'Creevykeel Court Tomb'],
  },
  {
    key: 'kerry_dingle',
    label: 'Kerry & Dingle Coast',
    description: 'Skellig Michael, Gallarus Oratory and the Iron Age forts of the Dingle Peninsula.',
    county: 'Kerry',
    marqueeNames: ['Skellig Michael', 'Gallarus Oratory', 'Dun Beag Promontory Fort'],
  },
  {
    key: 'cork_munster',
    label: 'West Cork Stones & Forts',
    description: 'Drombeg Stone Circle and the star-forts of Kinsale and Cork.',
    county: 'Cork',
    marqueeNames: ['Drombeg Stone Circle', 'Charles Fort', 'Elizabeth Fort'],
  },
  {
    key: 'donegal_north',
    label: 'Donegal Headlands',
    description: 'Grianan of Aileach — a stone ringfort on a 244 m hilltop with panoramic Atlantic views.',
    county: 'Donegal',
    marqueeNames: ['Grianan of Aileach'],
  },
  {
    key: 'shannon_monastic',
    label: 'Shannon Monastic Trail',
    description: 'Clonmacnoise on the Shannon plus Lough Gur and the Grange Stone Circle.',
    county: 'Offaly',
    marqueeNames: ['Clonmacnoise', 'Grange Stone Circle', 'Lough Gur'],
  },
  {
    key: 'connacht_royal',
    label: 'Connacht Royal Sites',
    description: 'Rathcroghan, Boyle Abbey and the Céide Fields Neolithic landscape.',
    county: 'Roscommon',
    marqueeNames: ['Rathcroghan', 'Boyle Abbey', 'Ceide Fields'],
  },
];

export function findTheme(key: string | null | undefined): SuggestedTheme | undefined {
  if (!key) return undefined;
  return SUGGESTED_THEMES.find((t) => t.key === key);
}

const STOPS_PER_DAY = 4;

// Monument classes that historically draw visitors. Bonus added to score
// when the NMS MONUMENT_CLASS contains any of these substrings.
const NOTABLE_CLASS_BONUS: Array<{ needle: string; bonus: number }> = [
  { needle: 'passage tomb', bonus: 5 },
  { needle: 'court tomb', bonus: 4 },
  { needle: 'portal tomb', bonus: 4 },
  { needle: 'wedge tomb', bonus: 3 },
  { needle: 'stone circle', bonus: 4 },
  { needle: 'standing stone', bonus: 1 },
  { needle: 'cashel', bonus: 3 },
  { needle: 'hillfort', bonus: 4 },
  { needle: 'promontory fort', bonus: 3 },
  { needle: 'round tower', bonus: 5 },
  { needle: 'high cross', bonus: 4 },
  { needle: 'monastic', bonus: 3 },
  { needle: 'cathedral', bonus: 4 },
  { needle: 'abbey', bonus: 4 },
  { needle: 'castle', bonus: 3 },
  { needle: 'tower house', bonus: 1 },
  { needle: 'ringfort', bonus: 1 },
  { needle: 'crannog', bonus: 3 },
  { needle: 'ogham stone', bonus: 3 },
  { needle: 'rock art', bonus: 3 },
];

export function scoreSite(site: ArchSite): number {
  let score = 1; // base

  const m = matchMarquee(site);
  if (m) score += 20; // curated landmark — heavy boost

  const cls = (site.type ?? '').toLowerCase();
  for (const { needle, bonus } of NOTABLE_CLASS_BONUS) {
    if (cls.includes(needle)) {
      score += bonus;
      break; // only the strongest match
    }
  }

  // WEB_NOTES is mapped into whatItIs by the service. Long, real notes are a
  // strong signal that the site is documented enough to visit; the fallback
  // text generated by the service starts with "A " which we filter out.
  const notes = site.whatItIs ?? '';
  if (notes.length > 80 && !notes.startsWith('A ')) score += 2;
  if (notes.length > 300 && !notes.startsWith('A ')) score += 1;

  return score;
}

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

interface Centroid {
  lat: number;
  lng: number;
}

/**
 * Lloyd's algorithm k-means clustering on lat/lng. Deterministic seeding by
 * picking points spread across the input (k-means++ would be marginally
 * better but this is fine for ≤30 points).
 */
function kMeans(points: TripStop[], k: number, iterations = 12): TripStop[][] {
  if (k <= 1 || points.length <= k) {
    return points.length === 0 ? [] : k === 1 ? [points] : points.map((p) => [p]);
  }

  // Seed: pick k points evenly spaced through the (already score-sorted) input.
  const step = points.length / k;
  const centroids: Centroid[] = [];
  for (let i = 0; i < k; i++) {
    const seed = points[Math.floor(i * step)];
    centroids.push({ lat: seed.site.lat, lng: seed.site.lng });
  }

  let assignments = new Array<number>(points.length).fill(0);

  for (let iter = 0; iter < iterations; iter++) {
    let changed = false;
    for (let i = 0; i < points.length; i++) {
      let bestK = 0;
      let bestD = Infinity;
      for (let c = 0; c < centroids.length; c++) {
        const d = haversineKm(points[i].site, centroids[c]);
        if (d < bestD) {
          bestD = d;
          bestK = c;
        }
      }
      if (assignments[i] !== bestK) {
        assignments[i] = bestK;
        changed = true;
      }
    }
    if (!changed) break;

    // Recompute centroids
    const sumLat = new Array<number>(k).fill(0);
    const sumLng = new Array<number>(k).fill(0);
    const counts = new Array<number>(k).fill(0);
    for (let i = 0; i < points.length; i++) {
      const c = assignments[i];
      sumLat[c] += points[i].site.lat;
      sumLng[c] += points[i].site.lng;
      counts[c] += 1;
    }
    for (let c = 0; c < k; c++) {
      if (counts[c] > 0) {
        centroids[c] = { lat: sumLat[c] / counts[c], lng: sumLng[c] / counts[c] };
      }
    }
  }

  const clusters: TripStop[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < points.length; i++) {
    clusters[assignments[i]].push(points[i]);
  }
  return clusters.filter((c) => c.length > 0);
}

/**
 * Cap each cluster at roughly `total / k` stops by moving overflow points
 * (the ones furthest from their cluster centroid) into the nearest cluster
 * that still has room. Prevents the "Day 1 has 1 stop, Day 3 has 7" pattern
 * when k-means assigns most points to a single dense city cluster.
 */
function balanceClusters(clusters: TripStop[][], total: number, k: number): void {
  if (clusters.length <= 1) return;
  const cap = Math.ceil(total / k);

  const centroidOf = (cluster: TripStop[]) => ({
    lat: cluster.reduce((s, p) => s + p.site.lat, 0) / cluster.length,
    lng: cluster.reduce((s, p) => s + p.site.lng, 0) / cluster.length,
  });

  // Up to a few passes — each pass shifts the worst overflow point.
  for (let pass = 0; pass < total; pass++) {
    const overflow = clusters.findIndex((c) => c.length > cap);
    if (overflow === -1) return;

    const src = clusters[overflow];
    const srcCentroid = centroidOf(src);

    // Pick the point furthest from its own centroid — that's the most
    // disposable member of the cluster.
    let worstIdx = 0;
    let worstDist = -Infinity;
    for (let i = 0; i < src.length; i++) {
      const d = haversineKm(src[i].site, srcCentroid);
      if (d > worstDist) {
        worstDist = d;
        worstIdx = i;
      }
    }
    const moved = src[worstIdx];

    // Find the nearest cluster that still has room.
    let bestK = -1;
    let bestD = Infinity;
    for (let c = 0; c < clusters.length; c++) {
      if (c === overflow) continue;
      if (clusters[c].length >= cap) continue;
      const d = haversineKm(moved.site, centroidOf(clusters[c]));
      if (d < bestD) {
        bestD = d;
        bestK = c;
      }
    }
    if (bestK === -1) return; // every cluster is full — give up
    src.splice(worstIdx, 1);
    clusters[bestK].push(moved);
  }
}

/** Nearest-neighbour ordering, optionally starting from an anchor point. */
function orderStops(stops: TripStop[], anchor: { lat: number; lng: number } | null = null): { ordered: TripStop[]; totalKm: number } {
  if (stops.length <= 1) return { ordered: stops.slice(), totalKm: 0 };
  const seed: Centroid = anchor ?? {
    lat: stops.reduce((s, p) => s + p.site.lat, 0) / stops.length,
    lng: stops.reduce((s, p) => s + p.site.lng, 0) / stops.length,
  };

  const remaining = stops.slice();
  const ordered: TripStop[] = [];
  // Start at the stop closest to the seed point (anchor or centroid)
  let startIdx = 0;
  let startDist = Infinity;
  for (let i = 0; i < remaining.length; i++) {
    const d = haversineKm(remaining[i].site, seed);
    if (d < startDist) {
      startDist = d;
      startIdx = i;
    }
  }
  let current = remaining.splice(startIdx, 1)[0];
  ordered.push(current);

  let totalKm = anchor ? startDist : 0;
  while (remaining.length > 0) {
    let nextIdx = 0;
    let nextDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversineKm(current.site, remaining[i].site);
      if (d < nextDist) {
        nextDist = d;
        nextIdx = i;
      }
    }
    totalKm += nextDist;
    current = remaining.splice(nextIdx, 1)[0];
    ordered.push(current);
  }
  return { ordered, totalKm };
}

export interface PlanTripInput {
  sites: ArchSite[];
  period: PlannerPeriod;
  county: string | null;
  days: number;
  themeKey?: string | null;   // suggested-mode preset (see SUGGESTED_THEMES)
  start?: StartPoint | null;  // optional starting location
}

export function planTrip({ sites, period, county, days, themeKey, start }: PlanTripInput): TripPlan {
  const safeDays = Math.max(1, Math.min(7, Math.floor(days)));
  const theme = period === 'suggested' ? findTheme(themeKey) : undefined;

  const filtered = sites.filter((s) => {
    if (period !== 'all' && period !== 'suggested' && s.period !== period) return false;
    if (county && s.county !== county) return false;
    return Number.isFinite(s.lat) && Number.isFinite(s.lng);
  });

  // 'suggested' mode: only consider curated marquee sites (best-of). If too
  // few marquee sites match, fall back to top-scored sites overall so we
  // always return something useful. If a theme is supplied, restrict to
  // marquee names listed in the theme.
  let scored: TripStop[];
  if (period === 'suggested') {
    const themeNames = theme ? new Set(theme.marqueeNames.map((n) => n.toLowerCase())) : null;
    const marqueeOnly = filtered
      .map((site) => ({ site, score: scoreSite(site), marquee: matchMarquee(site) }))
      .filter((s) => {
        if (s.marquee === undefined) return false;
        if (themeNames && !themeNames.has(s.marquee.name.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);

    if (theme) {
      // For themed routes, surface every matching marquee even if it's only one.
      scored = marqueeOnly;
    } else if (marqueeOnly.length >= safeDays * 2) {
      scored = marqueeOnly;
    } else {
      // Not enough curated picks for this county — augment with the next
      // best-scoring sites overall.
      const rest = filtered
        .map((site) => ({ site, score: scoreSite(site), marquee: matchMarquee(site) }))
        .filter((s) => s.marquee === undefined)
        .sort((a, b) => b.score - a.score);
      scored = [...marqueeOnly, ...rest];
    }
  } else {
    scored = filtered
      .map((site) => ({ site, score: scoreSite(site), marquee: matchMarquee(site) }))
      .sort((a, b) => b.score - a.score);
  }

  const targetCount = Math.min(scored.length, safeDays * STOPS_PER_DAY);
  const picked: TripStop[] = [];
  const usedMarquee = new Set<string>();
  const usedNameKey = new Set<string>();

  const nameKey = (s: TripStop) =>
    `${(s.site.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')}|${(s.site.county ?? '').toLowerCase()}`;

  for (const s of scored) {
    if (picked.length >= targetCount) break;

    // Dedupe 1: only one stop per curated marquee record. Multiple NMS rows
    // (e.g. Elizabeth Fort has several SMR sub-features) all match the same
    // marquee entry and would otherwise eat every slot with the same blurb.
    if (s.marquee) {
      if (usedMarquee.has(s.marquee.name)) continue;
    }

    // Dedupe 2: same display name + county is almost certainly the same
    // monument under a different SMR ref.
    const nk = nameKey(s);
    if (usedNameKey.has(nk)) continue;

    // Dedupe 3: anything within 500 m of an already-picked site.
    const tooClose = picked.some((p) => haversineKm(p.site, s.site) < 0.5);
    if (tooClose) continue;

    picked.push(s);
    if (s.marquee) usedMarquee.add(s.marquee.name);
    usedNameKey.add(nk);
  }

  const clusters = kMeans(picked, safeDays);
  balanceClusters(clusters, picked.length, safeDays);

  // If a start point was given, sort clusters by proximity to start so day 1
  // begins nearest the user. Otherwise order west-to-east for a natural flow.
  if (start) {
    clusters.sort((a, b) => {
      const ac = { lat: a.reduce((s, p) => s + p.site.lat, 0) / a.length, lng: a.reduce((s, p) => s + p.site.lng, 0) / a.length };
      const bc = { lat: b.reduce((s, p) => s + p.site.lat, 0) / b.length, lng: b.reduce((s, p) => s + p.site.lng, 0) / b.length };
      return haversineKm(start, ac) - haversineKm(start, bc);
    });
  } else {
    clusters.sort((a, b) => {
      const ax = a.reduce((s, p) => s + p.site.lng, 0) / a.length;
      const bx = b.reduce((s, p) => s + p.site.lng, 0) / b.length;
      return ax - bx;
    });
  }

  const tripDays: TripDay[] = clusters.map((cluster, i) => {
    // Day 1 starts from the user's start point (if any) instead of the
    // cluster centroid so the first leg flows out from where they are.
    const seedFrom = i === 0 && start ? start : null;
    const { ordered, totalKm } = orderStops(cluster, seedFrom);
    return { index: i, stops: ordered, totalKm };
  });

  const totalSites = tripDays.reduce((s, d) => s + d.stops.length, 0);
  const totalKm = tripDays.reduce((s, d) => s + d.totalKm, 0);

  return { period, county, themeKey: theme?.key, start: start ?? undefined, days: tripDays, totalSites, totalKm };
}
