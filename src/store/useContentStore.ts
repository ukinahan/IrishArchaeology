// src/store/useContentStore.ts
// Holds the merged stories + enrichment overlays. Boots from bundled
// fallbacks (instant, offline) and replaces them with remote content when
// the manifest finishes loading.
import { create } from 'zustand';
import { RemoteStory, SiteEnrichment } from '../data/content';
import { STORIES as BUNDLED_STORIES } from '../data/stories';
import { BUNDLED_ENRICHMENTS } from '../data/enrichments';
import { loadManifest, fetchRemoteManifest } from '../services/contentService';

interface ContentStore {
  stories: RemoteStory[];
  enrichmentsById: Record<string, SiteEnrichment>;
  loaded: boolean;
  refreshing: boolean;

  init: () => Promise<void>;
  refresh: () => Promise<void>;
  getEnrichment: (siteId: string, smrRef?: string) => SiteEnrichment | null;
}

function indexEnrichments(items: SiteEnrichment[]): Record<string, SiteEnrichment> {
  const out: Record<string, SiteEnrichment> = {};
  for (const e of items) {
    if (e.id) out[e.id] = e;
  }
  return out;
}

function mergeById<T extends { id: string }>(base: T[], over: T[]): T[] {
  const map = new Map<string, T>();
  for (const b of base) map.set(b.id, b);
  for (const o of over) map.set(o.id, o); // remote wins
  return Array.from(map.values());
}

export const useContentStore = create<ContentStore>((set, get) => ({
  stories: BUNDLED_STORIES as RemoteStory[],
  enrichmentsById: indexEnrichments(BUNDLED_ENRICHMENTS),
  loaded: false,
  refreshing: false,

  init: async () => {
    if (get().loaded) return;
    set({ refreshing: true });
    try {
      const manifest = await loadManifest();
      if (manifest) {
        set({
          stories: mergeById(BUNDLED_STORIES as RemoteStory[], manifest.stories),
          enrichmentsById: indexEnrichments(
            mergeById(BUNDLED_ENRICHMENTS, manifest.enrichments),
          ),
        });
      }
    } finally {
      set({ loaded: true, refreshing: false });
    }
  },

  refresh: async () => {
    set({ refreshing: true });
    try {
      const manifest = await fetchRemoteManifest();
      if (manifest) {
        set({
          stories: mergeById(BUNDLED_STORIES as RemoteStory[], manifest.stories),
          enrichmentsById: indexEnrichments(
            mergeById(BUNDLED_ENRICHMENTS, manifest.enrichments),
          ),
        });
      }
    } finally {
      set({ refreshing: false });
    }
  },

  getEnrichment: (siteId, smrRef) => {
    const map = get().enrichmentsById;
    return map[siteId] ?? (smrRef ? map[smrRef] : undefined) ?? null;
  },
}));
