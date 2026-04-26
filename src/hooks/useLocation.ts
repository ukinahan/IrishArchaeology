// src/hooks/useLocation.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import * as Location from 'expo-location';

export interface LocationState {
  lat: number | null;
  lng: number | null;
  heading: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation(): LocationState & { refresh: () => void } {
  const [state, setState] = useState<LocationState>({
    lat: null,
    lng: null,
    heading: null,
    error: null,
    loading: true,
  });

  const positionSub = useRef<Location.LocationSubscription | null>(null);
  const headingSub = useRef<Location.LocationSubscription | null>(null);

  const stopWatchers = useCallback(() => {
    positionSub.current?.remove();
    positionSub.current = null;
    headingSub.current?.remove();
    headingSub.current = null;
  }, []);

  const requestLocation = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setState({ lat: null, lng: null, heading: null, loading: false, error: 'Location permission denied.' });
      return;
    }

    try {
      // First fix — quick, reasonable accuracy.
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState((s) => ({
        ...s,
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        // heading from a single fix is usually null on iOS; we'll get real
        // values from watchHeadingAsync below.
        heading: loc.coords.heading ?? s.heading,
        error: null,
        loading: false,
      }));
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Could not get location. Are you outdoors?' }));
      return;
    }

    // Continuous watchers — replace any previous ones.
    stopWatchers();
    try {
      positionSub.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (loc) => {
          setState((s) => ({
            ...s,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          }));
        },
      );
    } catch {
      /* ignore — first fix already set */
    }

    try {
      headingSub.current = await Location.watchHeadingAsync((h) => {
        // trueHeading is preferred; fall back to magHeading.
        const value = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
        if (typeof value === 'number' && !Number.isNaN(value)) {
          setState((s) => ({ ...s, heading: value }));
        }
      });
    } catch {
      /* heading not supported on this device */
    }
  }, [stopWatchers]);

  useEffect(() => {
    requestLocation();
    return () => {
      stopWatchers();
    };
  }, [requestLocation, stopWatchers]);

  return { ...state, refresh: requestLocation };
}
