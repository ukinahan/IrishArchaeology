// src/services/geocodeService.ts
// Forward-geocode a place name to lat/lng using OpenStreetMap's Nominatim.
// Free + no API key; we cache results so we don't hammer their servers.
import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_AGENT =
  'EvinCairn/1.0 (https://irisharchaeology.app; contact via app store listing)';
const CACHE_PREFIX = 'geo_v1_';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export interface GeocodeResult {
  lat: number;
  lng: number;
  label: string;
}

interface NominatimItem {
  lat: string;
  lon: string;
  display_name: string;
}

/**
 * Forward-geocode a free-text place. Biased to Ireland.
 * Returns null if no result or on error.
 */
export async function geocodePlace(query: string): Promise<GeocodeResult | null> {
  const q = query.trim();
  if (q.length < 2) return null;

  const key = CACHE_PREFIX + q.toLowerCase();
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const cached: { ts: number; result: GeocodeResult | null } = JSON.parse(raw);
      if (Date.now() - cached.ts < CACHE_TTL_MS) return cached.result;
    }
  } catch {
    /* fall through */
  }

  try {
    // countrycodes=ie,gb biases to Ireland + Northern Ireland (UK)
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1` +
      `&countrycodes=ie,gb&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as NominatimItem[];
    const first = data[0];
    if (!first) {
      await AsyncStorage.setItem(
        key,
        JSON.stringify({ ts: Date.now(), result: null }),
      ).catch(() => {});
      return null;
    }
    const result: GeocodeResult = {
      lat: parseFloat(first.lat),
      lng: parseFloat(first.lon),
      label: first.display_name,
    };
    await AsyncStorage.setItem(
      key,
      JSON.stringify({ ts: Date.now(), result }),
    ).catch(() => {});
    return result;
  } catch {
    return null;
  }
}
