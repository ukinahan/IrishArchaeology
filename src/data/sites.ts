// src/data/sites.ts
export type Period =
  | 'stone_age'
  | 'bronze_age'
  | 'iron_age'
  | 'early_christian'
  | 'early_medieval'
  | 'medieval'
  | 'post_medieval';

export type AccessStatus = 'protected' | 'private' | 'accessible' | 'restricted';

export interface ArchSite {
  id: string;
  name: string;
  irishName?: string;
  type: string;
  period: Period;
  lat: number;
  lng: number;
  // Card content
  whatItIs: string;
  whyItMatters?: string;
  whenUsed?: { start: number; end: number }; // approximate years (negative = BC)
  whatToLookFor?: string;
  // Trust & safety
  accessStatus: AccessStatus;
  accessNote: string;
  isMonument: boolean;
  // Optional
  imageUrl?: string;
  smrRef?: string;
  nmsLink?: string; // Official Archaeological Survey of Ireland record URL
  county: string;
}

export const PERIOD_LABELS: Record<Period, string> = {
  stone_age: 'Stone Age',
  bronze_age: 'Bronze Age',
  iron_age: 'Iron Age',
  early_christian: 'Early Christian',
  early_medieval: 'Early Medieval',
  medieval: 'Medieval',
  post_medieval: 'Post-Medieval',
};

export const PERIOD_ICONS: Record<Period, string> = {
  stone_age: '🪨',
  bronze_age: '🥉',
  iron_age: '⚔️',
  early_christian: '✝️',
  early_medieval: '🏯',
  medieval: '🏰',
  post_medieval: '🧱',
};

export const PERIOD_COLORS: Record<Period, string> = {
  stone_age: '#8B4513',
  bronze_age: '#CD7F32',
  iron_age: '#708090',
  early_christian: '#F57F17',
  early_medieval: '#2E7D32',
  medieval: '#1565C0',
  post_medieval: '#6A1B9A',
};

/**
 * Approximate calendar-year ranges for each archaeological period in
 * Ireland. Used by the Time Machine timeline slider to filter sites by year
 * and to render a continuous timeline. Negative values are BC.
 */
export const PERIOD_YEARS: Record<Period, { start: number; end: number }> = {
  stone_age:       { start: -8000, end: -2500 }, // Mesolithic + Neolithic
  bronze_age:      { start: -2500, end: -500 },
  iron_age:        { start: -500,  end: 400 },
  early_christian: { start: 400,   end: 800 },
  early_medieval:  { start: 800,   end: 1170 },
  medieval:        { start: 1170,  end: 1540 },
  post_medieval:   { start: 1540,  end: 1900 },
};

export const TIMELINE_MIN_YEAR = -8000;
export const TIMELINE_MAX_YEAR = 1900;
