// src/store/usePlansStore.ts
// Persisted store of saved trip plans. Each plan gets an id + name + created
// timestamp on save so users can come back to it later.
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TripPlan } from '../utils/tripPlanner';

const STORAGE_KEY = 'saved_plans_v1';
const MAX_PLANS = 20;

export interface SavedPlan {
  id: string;
  name: string;
  createdAt: string; // ISO
  plan: TripPlan;
}

interface PlansState {
  plans: SavedPlan[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  savePlan: (name: string, plan: TripPlan) => Promise<SavedPlan>;
  deletePlan: (id: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
}

async function persist(plans: SavedPlan[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    /* ignore */
  }
}

function genId(): string {
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const usePlansStore = create<PlansState>((set, get) => ({
  plans: [],
  hydrated: false,

  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          set({ plans: parsed as SavedPlan[], hydrated: true });
          return;
        }
      }
    } catch {
      /* ignore */
    }
    set({ hydrated: true });
  },

  savePlan: async (name, plan) => {
    const saved: SavedPlan = {
      id: genId(),
      name: name.trim() || 'Unnamed trip',
      createdAt: new Date().toISOString(),
      plan,
    };
    const next = [saved, ...get().plans].slice(0, MAX_PLANS);
    set({ plans: next });
    await persist(next);
    return saved;
  },

  deletePlan: async (id) => {
    const next = get().plans.filter((p) => p.id !== id);
    set({ plans: next });
    await persist(next);
  },

  rename: async (id, name) => {
    const next = get().plans.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
    set({ plans: next });
    await persist(next);
  },
}));
