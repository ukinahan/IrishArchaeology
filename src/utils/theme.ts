// src/utils/theme.ts
export const COLORS = {
  // Primary palette
  forestDark: '#0f2318',
  forestMid: '#1a3a2a',
  forestLight: '#2d5a3d',
  gold: '#c8a84b',
  goldLight: '#e8c870',
  parchment: '#f5ead0',
  parchmentDark: '#e8d5a8',

  // Stone palette
  stone: '#8b7355',
  stoneLight: '#b0987a',
  stoneDark: '#5a4a32',

  // UI
  white: '#ffffff',
  black: '#000000',
  textPrimary: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textLight: '#9a9a9a',

  // Period colours
  prehistoric: '#8B4513',
  earlyMedieval: '#2E7D32',
  medieval: '#1565C0',
  postMedieval: '#6A1B9A',
  earlyChristian: '#F57F17',

  // Status
  protected: '#c0392b',
  caution: '#e67e22',
  accessible: '#27ae60',

  // Backgrounds
  bgDark: '#0f2318',
  bgCard: '#1e3d2a',
  bgCardAlt: '#243b2e',
  overlay: 'rgba(15, 35, 24, 0.85)',
};

export const FONTS = {
  heading: 'System',
  body: 'System',
  sizes: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 17,
    xl: 20,
    xxl: 26,
    xxxl: 32,
  },
};

export const RADII = {
  sm: 6,
  md: 12,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
};
