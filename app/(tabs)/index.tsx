// app/(tabs)/index.tsx  —  Explorer Map screen
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Modal, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocation } from '@/hooks/useLocation';
import { useSiteStore, getAvailableCounties } from '@/store/useSiteStore';
import { PeriodFilterBar } from '@/components/PeriodFilterBar';
import { PulsingOrbs } from '@/components/PulsingOrbs';
import { Period, PERIOD_COLORS } from '@/data/sites';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';

// Cap markers rendered on the map for performance. Native pins are cheap so
// we can show more than custom-view markers.
const MAX_MARKERS = 400;
// Debounce dynamic bbox fetches as user pans/zooms.
const BBOX_FETCH_DEBOUNCE_MS = 600;
// Don't bother fetching when zoomed too far out (slow + low value).
const MAX_BBOX_DELTA_DEG = 1.5;

// Map period -> a hex pinColor for the native MapKit pin. Using native pins
// (instead of custom child views) avoids a known react-native-maps crash
// where AIRMap.insertReactSubview can be called with a nil subview when the
// markers array changes rapidly.
const PIN_COLOR: Record<string, string> = {
  stone_age: '#8a7a5f',
  bronze_age: '#cd7f32',
  iron_age: '#6b5d3f',
  early_christian: '#c0a060',
  early_medieval: '#a85a3a',
  medieval: '#7a3a3a',
  post_medieval: '#5c5c8a',
};

// All 26 counties of the Republic of Ireland—shown in the picker even before
// their sites have been loaded.
const ALL_IRISH_COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
];

// Approximate geographic centres + zoom deltas for each county. Used as the
// map's initialRegion when a county is preselected but its sites haven't
// loaded yet (otherwise the map opens on a wide Ireland view that often
// drifts into the Atlantic depending on screen aspect ratio).
const COUNTY_CENTROIDS: Record<string, { lat: number; lng: number; latDelta: number; lngDelta: number }> = {
  Carlow:    { lat: 52.7210, lng: -6.8340, latDelta: 0.50, lngDelta: 0.50 },
  Cavan:     { lat: 53.9900, lng: -7.3600, latDelta: 0.80, lngDelta: 0.90 },
  Clare:     { lat: 52.9050, lng: -9.0000, latDelta: 0.90, lngDelta: 1.10 },
  Cork:      { lat: 51.9000, lng: -8.7000, latDelta: 1.20, lngDelta: 1.60 },
  Donegal:   { lat: 54.9200, lng: -8.0000, latDelta: 1.40, lngDelta: 1.60 },
  Dublin:    { lat: 53.4000, lng: -6.2700, latDelta: 0.55, lngDelta: 0.50 },
  Galway:    { lat: 53.3000, lng: -8.9500, latDelta: 1.20, lngDelta: 1.80 },
  Kerry:     { lat: 52.1500, lng: -9.7000, latDelta: 1.20, lngDelta: 1.40 },
  Kildare:   { lat: 53.1500, lng: -6.8000, latDelta: 0.65, lngDelta: 0.55 },
  Kilkenny:  { lat: 52.5400, lng: -7.2500, latDelta: 0.75, lngDelta: 0.65 },
  Laois:     { lat: 52.9940, lng: -7.3320, latDelta: 0.65, lngDelta: 0.65 },
  Leitrim:   { lat: 54.1240, lng: -8.0000, latDelta: 0.75, lngDelta: 0.55 },
  Limerick:  { lat: 52.5200, lng: -8.7500, latDelta: 0.70, lngDelta: 0.95 },
  Longford:  { lat: 53.7270, lng: -7.7930, latDelta: 0.55, lngDelta: 0.55 },
  Louth:     { lat: 53.9250, lng: -6.4900, latDelta: 0.50, lngDelta: 0.45 },
  Mayo:      { lat: 53.9000, lng: -9.3000, latDelta: 1.20, lngDelta: 1.60 },
  Meath:     { lat: 53.6050, lng: -6.6560, latDelta: 0.75, lngDelta: 0.85 },
  Monaghan:  { lat: 54.2490, lng: -6.9680, latDelta: 0.55, lngDelta: 0.55 },
  Offaly:    { lat: 53.2350, lng: -7.7120, latDelta: 0.70, lngDelta: 0.85 },
  Roscommon: { lat: 53.7570, lng: -8.2680, latDelta: 0.95, lngDelta: 0.75 },
  Sligo:     { lat: 54.2700, lng: -8.4760, latDelta: 0.70, lngDelta: 0.85 },
  Tipperary: { lat: 52.6000, lng: -7.9000, latDelta: 1.10, lngDelta: 0.95 },
  Waterford: { lat: 52.2500, lng: -7.4500, latDelta: 0.55, lngDelta: 0.95 },
  Westmeath: { lat: 53.5350, lng: -7.4650, latDelta: 0.65, lngDelta: 0.85 },
  Wexford:   { lat: 52.4500, lng: -6.5800, latDelta: 0.85, lngDelta: 0.75 },
  Wicklow:   { lat: 52.9800, lng: -6.4400, latDelta: 0.75, lngDelta: 0.55 },
};

export default function NearbyScreen() {
  const router = useRouter();
  const { lat, lng, loading, error, refresh } = useLocation();
  const mapRef = useRef<MapView>(null);
  const { activePeriodFilter, setActivePeriodFilter,
          activeCountyFilter, setActiveCountyFilter, getSitesNear,
          loadSitesNear, loadSitesByCounty, loadSitesInBounds, initFromCache, allSites } = useSiteStore();

  const AVAILABLE_COUNTIES = useMemo(() => {
    // Merge full Irish county list with any extras discovered in loaded sites,
    // dedupe and sort. Keep 'All' first.
    const fromSites = getAvailableCounties(allSites).filter((c) => c !== 'All');
    const set = new Set<string>([...ALL_IRISH_COUNTIES, ...fromSites]);
    return ['All', ...Array.from(set).sort()];
  }, [allSites]);
  const [countyPickerOpen, setCountyPickerOpen] = useState(false);
  const [countyLoading, setCountyLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [visibleRegion, setVisibleRegion] = useState<Region | null>(null);
  const bboxFetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const didInitialCountyFocus = useRef(false);
  const pendingCountyFocus = useRef<string | null>(activeCountyFilter);

  // Helper: animate map to fit a county's site bounding box
  const focusCounty = useCallback((county: string) => {
    try {
      const countySites = useSiteStore
        .getState()
        .allSites.filter((s) => s.county === county);
      if (countySites.length === 0 || !mapRef.current) return;
      let minLat = countySites[0].lat;
      let maxLat = countySites[0].lat;
      let minLng = countySites[0].lng;
      let maxLng = countySites[0].lng;
      for (const s of countySites) {
        if (s.lat < minLat) minLat = s.lat;
        if (s.lat > maxLat) maxLat = s.lat;
        if (s.lng < minLng) minLng = s.lng;
        if (s.lng > maxLng) maxLng = s.lng;
      }
      const latPad = Math.max((maxLat - minLat) * 0.15, 0.02);
      const lngPad = Math.max((maxLng - minLng) * 0.15, 0.02);
      mapRef.current.animateToRegion(
        {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: maxLat - minLat + latPad,
          longitudeDelta: maxLng - minLng + lngPad,
        },
        700,
      );
    } catch (e) {
      console.warn('focusCounty failed', e);
    }
  }, []);

  // Load cached sites on mount
  useEffect(() => { initFromCache(); }, []);

  // When location available with NO county selected, fetch nearby sites
  useEffect(() => {
    if (lat && lng && !activeCountyFilter) {
      loadSitesNear(lat, lng, 10);
    }
  }, [lat, lng, activeCountyFilter]);

  // If we entered the screen with a pre-selected county (from intro screen),
  // load it. The actual map focus is handled by the effect below which waits
  // for both the map to be ready AND the county's sites to be in the store.
  useEffect(() => {
    if (didInitialCountyFocus.current) return;
    if (!activeCountyFilter) return;
    didInitialCountyFocus.current = true;
    pendingCountyFocus.current = activeCountyFilter;
    (async () => {
      try {
        setCountyLoading(true);
        const existing = useSiteStore
          .getState()
          .allSites.some((s) => s.county === activeCountyFilter);
        if (!existing) {
          await loadSitesByCounty(activeCountyFilter);
        }
      } catch (e) {
        // Swallow — don't let unhandled rejection crash the screen
        console.warn('Initial county load failed', e);
      } finally {
        setCountyLoading(false);
      }
    })();
  }, [activeCountyFilter, loadSitesByCounty]);

  // Drain pending county focus once BOTH the map is mounted AND we have sites.
  // This handles either order of completion: map-ready-first or sites-first.
  useEffect(() => {
    const pending = pendingCountyFocus.current;
    if (!pending || !mapReady) return;
    const hasSites = allSites.some((s) => s.county === pending);
    if (!hasSites) return;
    // Tiny delay so the map can settle before animating
    const t = setTimeout(() => {
      focusCounty(pending);
      pendingCountyFocus.current = null;
    }, 150);
    return () => clearTimeout(t);
  }, [mapReady, allSites, focusCounty]);

  // When the map finishes mounting, mark it ready so the focus effect can run.
  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);

  const handleCountySelect = useCallback(
    async (county: string | null) => {
      setCountyPickerOpen(false);
      if (county === activeCountyFilter) return;
      setActiveCountyFilter(county);
      if (county) {
        try {
          setCountyLoading(true);
          await loadSitesByCounty(county);
          focusCounty(county);
        } catch (e) {
          console.warn('County change failed', e);
        } finally {
          setCountyLoading(false);
        }
      } else {
        setCountyLoading(false);
        if (lat && lng && mapRef.current) {
          try {
            mapRef.current.animateToRegion(
              { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 },
              500,
            );
          } catch {}
        }
      }
    },
    [setActiveCountyFilter, loadSitesByCounty, activeCountyFilter, focusCounty, lat, lng],
  );

  // Dynamically load additional sites when the user pans/zooms the map.
  // Skipped while a county filter is active (sites already fully loaded) and
  // while we're still animating into a focus, to avoid fetch storms / crashes.
  const handleRegionChangeComplete = useCallback(
    (region: Region) => {
      setVisibleRegion(region);
      if (activeCountyFilter) return;
      if (pendingCountyFocus.current) return;
      if (region.latitudeDelta > MAX_BBOX_DELTA_DEG || region.longitudeDelta > MAX_BBOX_DELTA_DEG) {
        return;
      }
      if (bboxFetchTimer.current) clearTimeout(bboxFetchTimer.current);
      bboxFetchTimer.current = setTimeout(() => {
        const minLat = region.latitude - region.latitudeDelta / 2;
        const maxLat = region.latitude + region.latitudeDelta / 2;
        const minLng = region.longitude - region.longitudeDelta / 2;
        const maxLng = region.longitude + region.longitudeDelta / 2;
        loadSitesInBounds(minLat, minLng, maxLat, maxLng).catch(() => {});
      }, BBOX_FETCH_DEBOUNCE_MS);
    },
    [loadSitesInBounds, activeCountyFilter],
  );

  useEffect(() => {
    return () => {
      if (bboxFetchTimer.current) clearTimeout(bboxFetchTimer.current);
    };
  }, []);

  // Compute the map's initial region. If a county is preselected and we
  // already have its sites loaded, open the map directly on that county.
  // Otherwise default to the user's location, or a wide Ireland view.
  const initialRegion = useMemo(() => {
    if (activeCountyFilter) {
      const countySites = allSites.filter((s) => s.county === activeCountyFilter);
      if (countySites.length > 0) {
        let minLat = countySites[0].lat;
        let maxLat = countySites[0].lat;
        let minLng = countySites[0].lng;
        let maxLng = countySites[0].lng;
        for (const s of countySites) {
          if (s.lat < minLat) minLat = s.lat;
          if (s.lat > maxLat) maxLat = s.lat;
          if (s.lng < minLng) minLng = s.lng;
          if (s.lng > maxLng) maxLng = s.lng;
        }
        const latPad = Math.max((maxLat - minLat) * 0.15, 0.02);
        const lngPad = Math.max((maxLng - minLng) * 0.15, 0.02);
        return {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: maxLat - minLat + latPad,
          longitudeDelta: maxLng - minLng + lngPad,
        };
      }
      // Sites for the county aren't loaded yet — fall back to a static
      // centroid so the map opens roughly on the right place rather than
      // the middle of Ireland (often the Atlantic on portrait phones).
      const centroid = COUNTY_CENTROIDS[activeCountyFilter];
      if (centroid) {
        return {
          latitude: centroid.lat,
          longitude: centroid.lng,
          latitudeDelta: centroid.latDelta,
          longitudeDelta: centroid.lngDelta,
        };
      }
    }
    if (lat && lng) {
      return { latitude: lat, longitude: lng, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    }
    return { latitude: 53.4, longitude: -8.0, latitudeDelta: 2.5, longitudeDelta: 2.5 };
    // We intentionally only recompute when the county filter changes or the
    // first time sites load. initialRegion only applies on map mount anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCountyFilter, allSites.length === 0]);

  // Memoize filtered list and cap displayed markers for performance
  const allFilteredSites = useMemo(
    () => (lat && lng ? getSitesNear(lat, lng) : getSitesNear(53.4, -8.0)),
    [lat, lng, allSites, activePeriodFilter, activeCountyFilter, getSitesNear],
  );

  const sites = useMemo(() => {
    if (allFilteredSites.length <= MAX_MARKERS) return allFilteredSites;

    // Prefer markers within the currently visible map region. Without this
    // we'd just slice the first MAX_MARKERS of the array — which after
    // zooming into a single town often shows nothing because the visible
    // tiles fall outside that arbitrary first slice.
    if (visibleRegion) {
      const minLat = visibleRegion.latitude - visibleRegion.latitudeDelta / 2;
      const maxLat = visibleRegion.latitude + visibleRegion.latitudeDelta / 2;
      const minLng = visibleRegion.longitude - visibleRegion.longitudeDelta / 2;
      const maxLng = visibleRegion.longitude + visibleRegion.longitudeDelta / 2;
      const inView = allFilteredSites.filter(
        (s) => s.lat >= minLat && s.lat <= maxLat && s.lng >= minLng && s.lng <= maxLng,
      );
      if (inView.length > 0) {
        if (inView.length <= MAX_MARKERS) return inView;
        // Too many in view — keep those closest to the centre of the viewport.
        const cLat = visibleRegion.latitude;
        const cLng = visibleRegion.longitude;
        return [...inView]
          .sort((a, b) => {
            const da = (a.lat - cLat) ** 2 + (a.lng - cLng) ** 2;
            const db = (b.lat - cLat) ** 2 + (b.lng - cLng) ** 2;
            return da - db;
          })
          .slice(0, MAX_MARKERS);
      }
      // Nothing in view — fall through to the default behaviour below.
    }

    // When a county is selected, show first MAX_MARKERS (already focused on bbox)
    // Otherwise, show those closest to the user
    if (activeCountyFilter || !lat || !lng) return allFilteredSites.slice(0, MAX_MARKERS);
    return [...allFilteredSites]
      .sort((a, b) => {
        const da = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
        const db = (b.lat - lat) ** 2 + (b.lng - lng) ** 2;
        return da - db;
      })
      .slice(0, MAX_MARKERS);
  }, [allFilteredSites, lat, lng, activeCountyFilter, visibleRegion]);

  const handleSitePress = useCallback(
    (siteId: string) => {
      router.push(`/site/${siteId}`);
    },
    [router],
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Explorer</Text>
            <Text style={styles.headerSub}>
              {sites.length === allFilteredSites.length
                ? `${sites.length} ${sites.length === 1 ? 'site' : 'sites'}`
                : `Showing ${sites.length} of ${allFilteredSites.length} sites`}
              {activeCountyFilter ? ` in Co. ${activeCountyFilter}` : ' nearby'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => {
              setActiveCountyFilter(null);
              setActivePeriodFilter(null);
              router.replace('/');
            }}
            accessibilityLabel="Back to start"
            accessibilityRole="button"
          >
            <Ionicons name="home" size={18} color={COLORS.forestDark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Period filter */}
      <PeriodFilterBar active={activePeriodFilter} onChange={setActivePeriodFilter} />

      {/* County dropdown */}
      <View style={styles.countyDropdownRow}>
        <Text style={styles.radiusLabel}>County:</Text>
        <TouchableOpacity
          style={styles.countyDropdown}
          onPress={() => setCountyPickerOpen(true)}
          accessibilityLabel="Select county"
          accessibilityRole="button"
        >
          <Text style={styles.countyDropdownText}>
            {activeCountyFilter ? `Co. ${activeCountyFilter}` : 'All Counties'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.stoneLight} />
        </TouchableOpacity>
      </View>

      {/* County picker modal */}
      <Modal visible={countyPickerOpen} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setCountyPickerOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select County</Text>
              <TouchableOpacity onPress={() => setCountyPickerOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.parchment} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={AVAILABLE_COUNTIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isActive = item === 'All' ? activeCountyFilter === null : activeCountyFilter === item;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => handleCountySelect(item === 'All' ? null : item)}
                  >
                    <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                      {item === 'All' ? 'All Counties' : `Co. ${item}`}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color={COLORS.forestDark} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Map or state */}
      <View style={styles.mapContainer}>
        {(lat && lng) || activeCountyFilter ? (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={initialRegion}
            showsUserLocation={!!(lat && lng)}
            showsMyLocationButton={false}
            mapType="hybrid"
            onMapReady={handleMapReady}
            onRegionChangeComplete={handleRegionChangeComplete}
          >
            {/* Site markers — only render after the native map is ready to
                avoid the AIRMap insertReactSubview nil crash that occurs
                when subviews are mounted in the same transaction. */}
            {mapReady && sites
              .filter(
                (site) =>
                  typeof site.lat === 'number' &&
                  typeof site.lng === 'number' &&
                  Number.isFinite(site.lat) &&
                  Number.isFinite(site.lng),
              )
              .map((site) => (
              <Marker
                key={site.id}
                coordinate={{ latitude: site.lat, longitude: site.lng }}
                title={site.name}
                description={site.type}
                pinColor={PIN_COLOR[site.period] ?? '#cd7f32'}
                onCalloutPress={() => handleSitePress(site.id)}
                tracksViewChanges={false}
              />
            ))}
          </MapView>
        ) : null}

        {/* Loading overlays — rendered AFTER the map so they paint on top. */}
        {loading && !activeCountyFilter && (
          <View style={styles.overlay} pointerEvents="none">
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={styles.overlayText}>Finding your location…</Text>
          </View>
        )}

        {countyLoading && (
          <View style={styles.overlay} pointerEvents="none">
            <PulsingOrbs size={20} />
            <Text style={[styles.overlayText, { marginTop: 16 }]}>Loading county sites…</Text>
          </View>
        )}

        {error && !loading && !activeCountyFilter && (
          <View style={styles.overlay}>
            <Ionicons name="location-outline" size={40} color={COLORS.stoneLight} />
            <Text style={styles.overlayTitle}>Location needed</Text>
            <Text style={styles.overlayText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Location refresh FAB */}
      {lat && lng && (
        <TouchableOpacity
          style={styles.fab}
          onPress={async () => {
            await refresh();
            const loc = await import('expo-location').then((m) =>
              m.getCurrentPositionAsync({ accuracy: m.Accuracy.Balanced }),
            );
            mapRef.current?.animateToRegion(
              {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              },
              600,
            );
          }}
          accessibilityLabel="Centre map on my location"
        >
          <Ionicons name="locate" size={22} color={COLORS.forestDark} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.forestDark },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  homeBtn: {
    width: 38,
    height: 38,
    borderRadius: RADII.full,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.parchment },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.stoneLight },
  radiusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  radiusLabel: { fontSize: FONTS.sizes.xs, color: COLORS.stoneLight, fontWeight: '600' },
  radiusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.full,
    backgroundColor: COLORS.forestMid,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
  },
  radiusChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.goldLight },
  radiusChipText: { fontSize: FONTS.sizes.xs, color: COLORS.stoneLight, fontWeight: '600' },
  radiusChipTextActive: { color: COLORS.forestDark },
  mapContainer: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forestDark,
    gap: 12,
    padding: 32,
    zIndex: 10,
    elevation: 10,
  },
  overlayTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.parchment },
  overlayText: { fontSize: FONTS.sizes.md, color: COLORS.stoneLight, textAlign: 'center' },
  retryBtn: {
    marginTop: 8,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADII.full,
  },
  retryText: { color: COLORS.forestDark, fontWeight: '700', fontSize: FONTS.sizes.md },
  countyDropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  countyDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.forestMid,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    borderRadius: RADII.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  countyDropdownText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.parchment,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.forestDark,
    borderTopLeftRadius: RADII.lg,
    borderTopRightRadius: RADII.lg,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.forestLight,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.parchment,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.forestLight,
  },
  modalItemActive: {
    backgroundColor: COLORS.gold,
  },
  modalItemText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.parchment,
  },
  modalItemTextActive: {
    color: COLORS.forestDark,
    fontWeight: '700',
  },
  markerWrapper: { alignItems: 'center' },
  markerOuter: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 8,
  },
  markerInner: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerIcon: { fontSize: 20 },
  markerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  markerLabel: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginTop: 2,
    maxWidth: 100,
  },
  markerLabelText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: RADII.full,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
});
