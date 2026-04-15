// src/hooks/useLocation.ts
import { useState, useEffect, useCallback } from 'react';
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

  const requestLocation = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setState({ lat: null, lng: null, heading: null, loading: false, error: 'Location permission denied.' });
      return;
    }

    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setState({
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        heading: loc.coords.heading ?? null,
        error: null,
        loading: false,
      });
    } catch {
      setState((s) => ({ ...s, loading: false, error: 'Could not get location. Are you outdoors?' }));
    }
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  return { ...state, refresh: requestLocation };
}
