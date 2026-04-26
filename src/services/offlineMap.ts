// src/services/offlineMap.ts
// Mapbox offline pack management for low-zoom Ireland basemap caching.
//
// Mapbox's RN SDK exposes `offlineManager` for downloading vector tile
// packs that work without a network connection. We keep a single named
// pack covering the whole island at the zoom levels useful in the field
// (z6 — country-level overview, z11 — county detail). Higher zooms are
// best fetched live to avoid runaway download sizes (>200 MB).
//
// Per-county packs (Sprint 6 / Premium tier) can build on this same API.
import { offlineManager, StyleURL } from '@rnmapbox/maps';

// Bounding box covering the island of Ireland (Mizen Head to Malin, Galway
// Bay to the Irish Sea), with a small buffer for offshore islands.
const IRELAND_BOUNDS: [[number, number], [number, number]] = [
  [-10.7, 51.3], // SW (lng, lat)
  [-5.3, 55.5],  // NE
];

const PACK_NAME = 'ireland-overview-v1';
const MIN_ZOOM = 6;
const MAX_ZOOM = 11;

export interface OfflinePackStatus {
  name: string;
  percentage: number;
  completedResourceCount: number;
  requiredResourceCount: number;
  state: 'inactive' | 'active' | 'complete' | 'unknown';
}

/** Returns the status of the Ireland overview pack, or null if not present. */
export async function getIrelandPackStatus(): Promise<OfflinePackStatus | null> {
  try {
    const pack = await offlineManager.getPack(PACK_NAME);
    if (!pack) return null;
    const status = await pack.status();
    return {
      name: PACK_NAME,
      percentage: status.percentage ?? 0,
      completedResourceCount: status.completedResourceCount ?? 0,
      requiredResourceCount: status.requiredResourceCount ?? 0,
      state: (status.state as unknown as OfflinePackStatus['state']) ?? 'unknown',
    };
  } catch {
    return null;
  }
}

/**
 * Downloads (or resumes) the Ireland overview pack. Calls `onProgress`
 * with percentage updates during the download.
 *
 * Safe to call repeatedly — Mapbox no-ops if the pack is already complete.
 */
export async function downloadIrelandPack(
  onProgress?: (pct: number) => void,
): Promise<void> {
  const existing = await getIrelandPackStatus();
  if (existing && existing.state === 'complete') {
    onProgress?.(100);
    return;
  }

  await offlineManager.createPack(
    {
      name: PACK_NAME,
      styleURL: StyleURL.Outdoors,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      bounds: IRELAND_BOUNDS,
      metadata: { createdAt: new Date().toISOString() },
    },
    (_pack, status) => {
      if (typeof status?.percentage === 'number') {
        onProgress?.(status.percentage);
      }
    },
    (_pack, error) => {
      // eslint-disable-next-line no-console
      console.warn('[offlineMap] pack error', error);
    },
  );
}

/** Removes the Ireland overview pack and frees its disk space. */
export async function deleteIrelandPack(): Promise<void> {
  try {
    await offlineManager.deletePack(PACK_NAME);
  } catch {
    /* ignore */
  }
}
