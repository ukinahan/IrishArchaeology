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
  end?: StartPoint;         // optional finishing point (round-trip vs one-way)
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

/**
 * Detour cost for visiting `p` between `a` and `b`.
 *   detour = dist(a,p) + dist(p,b) - dist(a,b)
 * Zero when p is on the straight line, large when it's far off-corridor.
 * For round trips (b == a), this collapses to 2 * dist(a,p).
 */
function detourKm(
  p: { lat: number; lng: number },
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  return haversineKm(a, p) + haversineKm(p, b) - haversineKm(a, b);
}

/**
 * Filter and re-rank candidate stops so that ones close to the user's
 * start → end corridor float to the top, and ones requiring an absurd
 * detour are removed entirely. Without this the planner happily picks
 * Skellig Michael when you start in Dublin for a 1-day trip.
 */
function applyGeoBias(
  stops: TripStop[],
  start: StartPoint | null | undefined,
  end: StartPoint | null | undefined,
  days: number,
): TripStop[] {
  if (!start) return stops;
  const a = start;
  const b = end ?? start;
  // Hard cap on per-site detour; scales with days. ~80 km/day extra mileage
  // tolerated, so a 2-day trip from Dublin can reach Galway but not Kerry.
  const maxDetour = Math.max(60, 80 * Math.max(1, days));
  const adjusted: TripStop[] = [];
  for (const s of stops) {
    const d = detourKm(s.site, a, b);
    if (d > maxDetour) continue;
    // Penalty: 1 score-point per 25 km of detour. The marquee bonus is +20
    // so a curated site stays preferred up to ~500 km of detour, while
    // ordinary sites are quickly out-ranked by closer alternatives.
    adjusted.push({ ...s, score: s.score - d / 25 });
  }
  return adjusted.sort((x, y) => y.score - x.score);
}

/**
 * Brute-force TSP over cluster centroids. Returns clusters reordered to
 * minimise total km from `start` through every cluster to `end`. Caller
 * guarantees clusters.length ≤ 7 so 7! = 5040 perms is trivial.
 */
function orderClustersTsp(
  clusters: TripStop[][],
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
): TripStop[][] {
  if (clusters.length <= 1) return clusters;
  const centroids = clusters.map((c) => ({
    lat: c.reduce((s, p) => s + p.site.lat, 0) / c.length,
    lng: c.reduce((s, p) => s + p.site.lng, 0) / c.length,
  }));

  const indices = clusters.map((_, i) => i);

  const permute = (arr: number[]): number[][] => {
    if (arr.length <= 1) return [arr];
    const out: number[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (const p of permute(rest)) out.push([arr[i], ...p]);
    }
    return out;
  };

  let bestOrder = indices;
  let bestCost = Infinity;
  for (const perm of permute(indices)) {
    let cost = haversineKm(start, centroids[perm[0]]);
    for (let i = 0; i < perm.length - 1; i++) {
      cost += haversineKm(centroids[perm[i]], centroids[perm[i + 1]]);
    }
    cost += haversineKm(centroids[perm[perm.length - 1]], end);
    if (cost < bestCost) {
      bestCost = cost;
      bestOrder = perm;
    }
  }
  return bestOrder.map((i) => clusters[i]);
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

/** Nearest-neighbour ordering, optionally anchored at a start and/or end point. */
function orderStops(
  stops: TripStop[],
  startAnchor: { lat: number; lng: number } | null = null,
  endAnchor: { lat: number; lng: number } | null = null,
): { ordered: TripStop[]; totalKm: number } {
  if (stops.length === 0) return { ordered: [], totalKm: 0 };
  if (stops.length === 1) {
    const only = stops[0];
    let totalKm = 0;
    if (startAnchor) totalKm += haversineKm(startAnchor, only.site);
    if (endAnchor) totalKm += haversineKm(only.site, endAnchor);
    return { ordered: [only], totalKm };
  }

  let working = stops.slice();
  let finalStop: TripStop | null = null;

  // If an end anchor exists, reserve the stop closest to it for last.
  if (endAnchor) {
    let bestI = 0;
    let bestD = Infinity;
    for (let i = 0; i < working.length; i++) {
      const d = haversineKm(working[i].site, endAnchor);
      if (d < bestD) { bestD = d; bestI = i; }
    }
    finalStop = working.splice(bestI, 1)[0];
  }

  const seed: Centroid = startAnchor ?? {
    lat: working.reduce((s, p) => s + p.site.lat, 0) / Math.max(1, working.length),
    lng: working.reduce((s, p) => s + p.site.lng, 0) / Math.max(1, working.length),
  };

  const ordered: TripStop[] = [];
  let totalKm = 0;

  if (working.length > 0) {
    // Start at the stop closest to the seed point (anchor or centroid)
    let startIdx = 0;
    let startDist = Infinity;
    for (let i = 0; i < working.length; i++) {
      const d = haversineKm(working[i].site, seed);
      if (d < startDist) { startDist = d; startIdx = i; }
    }
    let current = working.splice(startIdx, 1)[0];
    ordered.push(current);
    if (startAnchor) totalKm += startDist;

    while (working.length > 0) {
      let nextIdx = 0;
      let nextDist = Infinity;
      for (let i = 0; i < working.length; i++) {
        const d = haversineKm(current.site, working[i].site);
        if (d < nextDist) { nextDist = d; nextIdx = i; }
      }
      totalKm += nextDist;
      current = working.splice(nextIdx, 1)[0];
      ordered.push(current);
    }
  }

  if (finalStop) {
    if (ordered.length > 0) {
      totalKm += haversineKm(ordered[ordered.length - 1].site, finalStop.site);
    } else if (startAnchor) {
      totalKm += haversineKm(startAnchor, finalStop.site);
    }
    ordered.push(finalStop);
    if (endAnchor) totalKm += haversineKm(finalStop.site, endAnchor);
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
  end?: StartPoint | null;    // optional ending location (defaults to start = round trip)
}

export function planTrip({ sites, period, county, days, themeKey, start, end }: PlanTripInput): TripPlan {
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

  // Apply geo-bias only when the user provided a start point AND we aren't
  // building a themed route (themed routes are by definition geographically
  // coherent already — don't strip Newgrange because the user lives in Cork).
  if (start && !theme) {
    scored = applyGeoBias(scored, start, end, safeDays);
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

  // Order the clusters into days.
  //   - start present: brute-force TSP from start → (end | start) for an
  //     optimal day order. Handles round-trips and one-ways uniformly.
  //   - neither: west-to-east for a natural visual flow.
  let orderedClusters: TripStop[][];
  if (start) {
    const finishAt = end ?? start;
    orderedClusters = orderClustersTsp(clusters, start, finishAt);
  } else {
    orderedClusters = clusters.slice().sort((a, b) => {
      const ax = a.reduce((s, p) => s + p.site.lng, 0) / a.length;
      const bx = b.reduce((s, p) => s + p.site.lng, 0) / b.length;
      return ax - bx;
    });
  }

  const lastDayIndex = orderedClusters.length - 1;
  const tripDays: TripDay[] = orderedClusters.map((cluster, i) => {
    // Day 1 anchors at the start point; the last day anchors at the end
    // point (if given) so the final stop lands closest to the user's
    // destination. Intermediate days fall back to the centroid heuristic.
    const startAnchor = i === 0 && start ? start : null;
    const endAnchor = i === lastDayIndex && end ? end : null;
    const { ordered, totalKm } = orderStops(cluster, startAnchor, endAnchor);
    return { index: i, stops: ordered, totalKm };
  });

  const totalSites = tripDays.reduce((s, d) => s + d.stops.length, 0);
  const totalKm = tripDays.reduce((s, d) => s + d.totalKm, 0);

  return {
    period,
    county,
    themeKey: theme?.key,
    start: start ?? undefined,
    end: end ?? undefined,
    days: tripDays,
    totalSites,
    totalKm,
  };
}
