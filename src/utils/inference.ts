// src/utils/inference.ts
// "What am I looking at?" probabilistic engine.
//
// The engine combines three signals:
//   1) Distance to the nearest known SMR site.
//   2) Compass heading (when available) — bias toward sites in a forward
//      cone so "I'm pointing at a mound" works better than just "nearest".
//   3) Period density biased by location — fallback varies by what's
//      common in this corner of Ireland.
//
// All numbers are heuristics — the surface always advertises this as
// probabilistic, never authoritative.
import { ArchSite, Period } from '../data/sites';

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

/** Initial bearing from point 1 to point 2 in degrees [0, 360). */
function bearingDeg(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dl = ((lng2 - lng1) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

/** Smallest unsigned angular delta between two bearings, in degrees. */
function angularDelta(a: number, b: number): number {
  const d = ((a - b + 540) % 360) - 180;
  return Math.abs(d);
}

export interface Inference {
  confidence: 'high' | 'moderate' | 'low';
  headline: string;
  detail: string;
  site: ArchSite | null;
}

interface FallbackTemplate {
  type: string;
  period: Period;
  headline: string;
  detail: string;
}

const FALLBACKS: FallbackTemplate[] = [
  {
    type: 'Ringfort',
    period: 'early_medieval',
    headline: 'This area likely contains a ringfort',
    detail:
      'Early medieval ringforts are the most common field monument in Ireland — roughly one per square kilometre. Look for a circular raised area with a bank, often crowned with old hawthorn or whitethorn trees.',
  },
  {
    type: 'Enclosure',
    period: 'iron_age',
    headline: 'This may be an Iron Age enclosure',
    detail:
      'Iron Age enclosures often sit on rises with commanding views. Look for a low circular bank, sometimes with traces of a ditch, and frequently re-used in later periods.',
  },
  {
    type: 'Fulacht Fia',
    period: 'bronze_age',
    headline: 'Watch for a fulacht fia near water',
    detail:
      'Bronze Age cooking sites — low horseshoe-shaped mounds of fire-cracked stone, almost always within 100m of a stream or boggy ground.',
  },
  {
    type: 'Holy Well',
    period: 'early_christian',
    headline: 'A holy well may be nearby',
    detail:
      'Sacred springs venerated since pre-Christian times and absorbed into early Christian devotion. Look for a small stone surround, often with votive offerings on adjacent trees.',
  },
  {
    type: 'Tower House',
    period: 'medieval',
    headline: 'You may be near a tower house',
    detail:
      'Small defended towers built by Gaelic and Anglo-Norman lords from the 14th century. Look for a tall rectangular stone ruin, often near a river bend or townland boundary.',
  },
  {
    type: 'Passage Tomb',
    period: 'neolithic',
    headline: 'A passage tomb may lie on this rise',
    detail:
      'Neolithic burial mounds, often set on prominent hilltops with sweeping views. Look for a kerb of large stones at the base of a turfed mound.',
  },
];

function isLikelyCoastal(lng: number): boolean {
  // Crude proxy for the western seaboard / island fringes — favoured for
  // fulachta fia and coastal monument types.
  return lng < -9.5 || lng > -6.0;
}

function pickFallback(lat: number, lng: number, sites: ArchSite[]): FallbackTemplate {
  // Tally periods of any sites within ~10 km; whichever is most common is
  // our best guess for an unknown spot in this neighbourhood.
  const tally: Partial<Record<Period, number>> = {};
  for (const s of sites) {
    if (haversineKm(lat, lng, s.lat, s.lng) <= 10) {
      tally[s.period] = (tally[s.period] ?? 0) + 1;
    }
  }
  const top = (Object.entries(tally) as [Period, number][])
    .sort((a, b) => b[1] - a[1])[0];

  if (top) {
    const match = FALLBACKS.find((f) => f.period === top[0]);
    if (match) return match;
  }
  if (isLikelyCoastal(lng)) {
    const match = FALLBACKS.find((f) => f.type === 'Fulacht Fia');
    if (match) return match;
  }
  return FALLBACKS[0];
}

export function inferFromLocation(
  lat: number,
  lng: number,
  sites: ArchSite[],
  heading?: number | null,
): Inference {
  let nearest: ArchSite | null = null;
  let nearestDist = Infinity;
  let bestSite: ArchSite | null = null;
  let bestScore = Infinity;
  let bestRealDist = Infinity;

  const haveHeading = typeof heading === 'number' && Number.isFinite(heading);

  for (const site of sites) {
    const d = haversineKm(lat, lng, site.lat, site.lng);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = site;
    }

    let score = d;
    if (haveHeading) {
      const b = bearingDeg(lat, lng, site.lat, site.lng);
      const delta = angularDelta(b, heading as number);
      if (delta <= 30) score = d * 0.5;       // strong forward cone (60°)
      else if (delta <= 60) score = d * 0.75; // soft forward cone (120°)
      else if (delta >= 150) score = d * 1.5; // explicitly behind us
    }

    if (score < bestScore) {
      bestScore = score;
      bestSite = site;
      bestRealDist = d;
    }
  }

  // High confidence: very close to a known site.
  if (nearest && nearestDist < 0.5) {
    const useDirectional =
      haveHeading && bestSite && bestRealDist < 0.6 && bestSite.id !== nearest.id;
    const target = useDirectional && bestSite ? bestSite : nearest;
    const headline = useDirectional
      ? `You may be looking at ${target.name}`
      : `You're very close to ${target.name}`;
    return { confidence: 'high', headline, detail: target.whatItIs, site: target };
  }

  // Moderate: prefer a forward-aligned site if we have a heading and one is in range.
  if (haveHeading && bestSite && bestRealDist < 2) {
    return {
      confidence: 'moderate',
      headline: `There may be a ${bestSite.type} ahead`,
      detail: `${bestSite.name} is about ${(bestRealDist * 1000).toFixed(0)}m in your facing direction. ${bestSite.whatItIs}`,
      site: bestSite,
    };
  }
  if (nearest && nearestDist < 2) {
    return {
      confidence: 'moderate',
      headline: `There may be a ${nearest.type} nearby`,
      detail: `${nearest.name} is about ${(nearestDist * 1000).toFixed(0)}m from here. ${nearest.whatItIs}`,
      site: nearest,
    };
  }

  // Low confidence fallback — varies by local period density.
  const fb = pickFallback(lat, lng, sites);
  return { confidence: 'low', headline: fb.headline, detail: fb.detail, site: null };
}

// Exported for unit tests.
export const __testing__ = { bearingDeg, angularDelta, pickFallback, FALLBACKS };
