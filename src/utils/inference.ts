// src/utils/inference.ts
// "What am I looking at?" probabilistic engine
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

export interface Inference {
  confidence: 'high' | 'moderate' | 'low';
  headline: string;
  detail: string;
  site: ArchSite | null;
}

const PERIOD_DENSITY_IRELAND: Record<Period, number> = {
  stone_age: 0.08,
  bronze_age: 0.10,
  iron_age: 0.06,
  early_christian: 0.09,
  early_medieval: 0.25, // ringforts are the most common monument type
  medieval: 0.18,
  post_medieval: 0.14,
};

const GENERAL_DESCRIPTIONS: {
  type: string;
  period: string;
  description: string;
}[] = [
  {
    type: 'Ringfort',
    period: 'early_medieval',
    description:
      'A circular earthen bank — once home to an early medieval farming family. Ireland has over 40,000 of these.',
  },
  {
    type: 'Passage Tomb',
    period: 'stone_age',
    description:
      'A Neolithic burial mound — built before the pyramids, aligned to the sun at solstice or equinox.',
  },
  {
    type: 'Holy Well',
    period: 'early_christian',
    description:
      'A sacred spring — venerated since pre-Christian times and absorbed into early Christian devotion.',
  },
  {
    type: 'Tower House',
    period: 'medieval',
    description:
      'A small, defended tower built by Gaelic or Anglo-Norman lords for security and status from the 14th century onward.',
  },
  {
    type: 'Enclosure',
    period: 'iron_age',
    description: 'An Iron Age enclosure — possibly a hillfort, ceremonial site, or defended farmstead.',
  },
];

export function inferFromLocation(
  lat: number,
  lng: number,
  sites: ArchSite[],
  heading?: number | null,
): Inference {
  // Step 1: find the nearest known site
  let nearest: ArchSite | null = null;
  let nearestDist = Infinity;

  for (const site of sites) {
    const d = haversineKm(lat, lng, site.lat, site.lng);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = site;
    }
  }

  // If within 500m of a known site, give a confident specific answer
  if (nearest && nearestDist < 0.5) {
    return {
      confidence: 'high',
      headline: `You're very close to ${nearest.name}`,
      detail: nearest.whatItIs,
      site: nearest,
    };
  }

  // If within 2km, give a moderate suggestion
  if (nearest && nearestDist < 2) {
    return {
      confidence: 'moderate',
      headline: `There may be a ${nearest.type} nearby`,
      detail: `${nearest.name} is about ${(nearestDist * 1000).toFixed(0)}m from here. ${nearest.whatItIs}`,
      site: nearest,
    };
  }

  // Probabilistic fallback — use the most common monument type for Ireland
  const fallback = GENERAL_DESCRIPTIONS[0]; // ringfort
  return {
    confidence: 'low',
    headline: 'This area may contain a ringfort',
    detail:
      'Early medieval ringforts are the most common field monument in Ireland — roughly one every square kilometre. If you see a circular raised area with a bank, especially with old hawthorn trees, it may well be one.',
    site: null,
  };
}
