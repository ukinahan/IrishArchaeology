// app/(tabs)/index.tsx  —  Nearby Map screen
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Modal, FlatList, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocation } from '@/hooks/useLocation';
import { useSiteStore, getAvailableCounties } from '@/store/useSiteStore';
import { PeriodFilterBar } from '@/components/PeriodFilterBar';
import { PulsingOrbs } from '@/components/PulsingOrbs';
import { Period, PERIOD_COLORS } from '@/data/sites';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';

const RADIUS_OPTIONS: (number | null)[] = [null, 0.25, 0.5, 1, 5, 10, 50];

// Cap markers rendered on the map for performance. Counties can have thousands of
// sites; rendering all of them as custom views causes severe lag.
const MAX_MARKERS = 250;

function radiusLabel(r: number | null): string {
  if (r === null) return 'All';
  if (r < 1) return `${r * 1000}m`;
  return `${r}km`;
}

export default function NearbyScreen() {
  const router = useRouter();
  const { lat, lng, loading, error, refresh } = useLocation();
  const mapRef = useRef<MapView>(null);
  const { radiusKm, setRadiusKm, activePeriodFilter, setActivePeriodFilter,
          activeCountyFilter, setActiveCountyFilter, getSitesNear,
          loadSitesNear, loadSitesByCounty, initFromCache, isLoading: sitesLoading, allSites } = useSiteStore();

  const AVAILABLE_COUNTIES = getAvailableCounties(allSites);
  const [countyPickerOpen, setCountyPickerOpen] = useState(false);
  const [countyLoading, setCountyLoading] = useState(false);

  // Load cached sites on mount, then fetch from API when location is available
  useEffect(() => { initFromCache(); }, []);
  useEffect(() => {
    if (lat && lng) {
      loadSitesNear(lat, lng, radiusKm ?? 50);
    }
  }, [lat, lng]);

  const handleCountySelect = useCallback(
    async (county: string | null) => {
      setCountyPickerOpen(false);
      if (county === activeCountyFilter) return;
      setActiveCountyFilter(county);
      if (county) {
        setCountyLoading(true);
        await loadSitesByCounty(county);
        // Auto-focus map onto the newly loaded county
        const countySites = useSiteStore
          .getState()
          .allSites.filter((s) => s.county === county);
        if (countySites.length > 0 && mapRef.current) {
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
        }
        setCountyLoading(false);
      } else {
        setCountyLoading(false);
      }
    },
    [setActiveCountyFilter, loadSitesByCounty, activeCountyFilter],
  );

  // Memoize filtered list and cap displayed markers for performance
  const allFilteredSites = useMemo(
    () => (lat && lng ? getSitesNear(lat, lng) : []),
    [lat, lng, allSites, radiusKm, activePeriodFilter, activeCountyFilter, getSitesNear],
  );

  const sites = useMemo(() => {
    if (allFilteredSites.length <= MAX_MARKERS) return allFilteredSites;
    if (!lat || !lng) return allFilteredSites.slice(0, MAX_MARKERS);
    // Show the MAX_MARKERS sites closest to the user
    return [...allFilteredSites]
      .sort((a, b) => {
        const da = (a.lat - lat) ** 2 + (a.lng - lng) ** 2;
        const db = (b.lat - lat) ** 2 + (b.lng - lng) ** 2;
        return da - db;
      })
      .slice(0, MAX_MARKERS);
  }, [allFilteredSites, lat, lng]);

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
        <Text style={styles.headerTitle}>Nearby</Text>
        <Text style={styles.headerSub}>
          {sites.length === allFilteredSites.length
            ? `${sites.length} ${sites.length === 1 ? 'site' : 'sites'}`
            : `Showing ${sites.length} of ${allFilteredSites.length} sites`}
          {activeCountyFilter
            ? ` in Co. ${activeCountyFilter}`
            : radiusKm === null
            ? ' across all counties'
            : ` within ${radiusKm < 1 ? radiusKm * 1000 + 'm' : radiusKm + 'km'}`}
        </Text>
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

      {/* Radius selector */}
      <View style={styles.radiusRow}>
        <Text style={styles.radiusLabel}>Radius:</Text>
        {RADIUS_OPTIONS.map((r) => (
          <TouchableOpacity
            key={String(r)}
            style={[styles.radiusChip, radiusKm === r && styles.radiusChipActive]}
            onPress={() => setRadiusKm(r)}
            accessibilityLabel={`Set radius to ${radiusLabel(r)}`}
          >
            <Text style={[styles.radiusChipText, radiusKm === r && styles.radiusChipTextActive]}>
              {radiusLabel(r)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Map or state */}
      <View style={styles.mapContainer}>
        {loading && (
          <View style={styles.overlay}>
            <ActivityIndicator color={COLORS.gold} size="large" />
            <Text style={styles.overlayText}>Finding your location…</Text>
          </View>
        )}

        {countyLoading && (
          <View style={styles.overlay}>
            <PulsingOrbs size={20} />
            <Text style={[styles.overlayText, { marginTop: 16 }]}>Loading county sites…</Text>
          </View>
        )}

        {error && !loading && (
          <View style={styles.overlay}>
            <Ionicons name="location-outline" size={40} color={COLORS.stoneLight} />
            <Text style={styles.overlayTitle}>Location needed</Text>
            <Text style={styles.overlayText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}

        {lat && lng && (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: lat,
              longitude: lng,
              latitudeDelta: (radiusKm ?? 1) * 0.02,
              longitudeDelta: (radiusKm ?? 1) * 0.02,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            mapType="satellite"
          >
            {/* Radius circle — hidden when All */}
            {radiusKm !== null && lat && lng && (
              <Circle
                center={{ latitude: lat, longitude: lng }}
                radius={radiusKm * 1000}
                strokeColor={COLORS.gold + '66'}
                fillColor={COLORS.gold + '11'}
                strokeWidth={1}
              />
            )}

            {/* Site markers */}
            {sites.map((site) => (
              <Marker
                key={site.id}
                coordinate={{ latitude: site.lat, longitude: site.lng }}
                onPress={() => handleSitePress(site.id)}
                anchor={{ x: 0.5, y: 1 }}
                tracksViewChanges={false}
              >
                <View style={styles.markerWrapper}>
                  <View style={styles.markerOuter}>
                    <View style={[styles.markerInner, { backgroundColor: PERIOD_COLORS[site.period] }]}>
                      <Text style={styles.markerIcon}>
                        {site.period === 'stone_age' ? '🪨'
                          : site.period === 'bronze_age' ? '🥉'
                          : site.period === 'early_medieval' || site.period === 'medieval' ? '🏰'
                          : site.period === 'early_christian' ? '✝️'
                          : site.period === 'post_medieval' ? '🧱'
                          : '⚔️'}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.markerTail, { borderTopColor: PERIOD_COLORS[site.period] }]} />
                  <View style={styles.markerLabel}>
                    <Text style={styles.markerLabelText} numberOfLines={1}>{site.name}</Text>
                  </View>
                </View>
              </Marker>
            ))}
          </MapView>
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
                latitudeDelta: (radiusKm ?? 1) * 0.02,
                longitudeDelta: (radiusKm ?? 1) * 0.02,
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
