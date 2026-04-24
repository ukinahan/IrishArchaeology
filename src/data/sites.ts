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
