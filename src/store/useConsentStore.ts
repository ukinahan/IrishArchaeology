// src/store/useConsentStore.ts
// Persisted GDPR / privacy consent state. The app shows a one-time consent
// dialog on first launch (and again if CONSENT_VERSION is bumped) so EU
// users can opt in or out of analytics and crash reporting before any
// telemetry payload leaves the device.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CONSENT_VERSION = 1;
const STORAGE_KEY = 'consent_v1';

export type ConsentChoice = 'unset' | 'granted' | 'denied';

interface PersistedConsent {
  version: number;
  analytics: ConsentChoice;
  crash: ConsentChoice;
  acceptedAt: string | null;
}

interface ConsentState {
  hydrated: boolean;
  version: number;
  analytics: ConsentChoice;
  crash: ConsentChoice;
  acceptedAt: string | null;
  hydrate: () => Promise<void>;
  /** True when no choice has been recorded for the current version. */
  needsPrompt: () => boolean;
  setAll: (choice: 'granted' | 'denied') => Promise<void>;
  setAnalytics: (choice: 'granted' | 'denied') => Promise<void>;
  setCrash: (choice: 'granted' | 'denied') => Promise<void>;
}

async function persist(s: PersistedConsent): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export const useConsentStore = create<ConsentState>((set, get) => ({
  hydrated: false,
  version: CONSENT_VERSION,
  analytics: 'unset',
  crash: 'unset',
  acceptedAt: null,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedConsent;
        if (parsed.version === CONSENT_VERSION) {
          set({
            hydrated: true,
            version: parsed.version,
            analytics: parsed.analytics ?? 'unset',
            crash: parsed.crash ?? 'unset',
            acceptedAt: parsed.acceptedAt ?? null,
          });
          return;
        }
      }
    } catch {
      /* ignore */
    }
    set({ hydrated: true });
  },

  needsPrompt: () => {
    const s = get();
    return s.hydrated && (s.analytics === 'unset' || s.crash === 'unset');
  },

  setAll: async (choice) => {
    const next: PersistedConsent = {
      version: CONSENT_VERSION,
      analytics: choice,
      crash: choice,
      acceptedAt: new Date().toISOString(),
    };
    set({ ...next, hydrated: true });
    await persist(next);
  },

  setAnalytics: async (choice) => {
    const next: PersistedConsent = {
      version: CONSENT_VERSION,
      analytics: choice,
      crash: get().crash === 'unset' ? choice : get().crash,
      acceptedAt: new Date().toISOString(),
    };
    set({ ...next, hydrated: true });
    await persist(next);
  },

  setCrash: async (choice) => {
    const next: PersistedConsent = {
      version: CONSENT_VERSION,
      analytics: get().analytics === 'unset' ? choice : get().analytics,
      crash: choice,
      acceptedAt: new Date().toISOString(),
    };
    set({ ...next, hydrated: true });
    await persist(next);
  },
}));

/** Synchronous accessor for non-React modules (e.g. telemetry facade). */
export function getConsentSnapshot(): { analytics: ConsentChoice; crash: ConsentChoice } {
  const s = useConsentStore.getState();
  return { analytics: s.analytics, crash: s.crash };
}
