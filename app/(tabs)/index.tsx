// app/(tabs)/index.tsx  —  Nearby Map screen
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocation } from '@/hooks/useLocation';
import { useSiteStore, AVAILABLE_COUNTIES } from '@/store/useSiteStore';
import { PeriodFilterBar } from '@/components/PeriodFilterBar';
import { Period, PERIOD_COLORS } from '@/data/sites';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';

const RADIUS_OPTIONS: (number | null)[] = [null, 0.25, 0.5, 1, 5, 10, 50];

function radiusLabel(r: number | null): string {
  if (r === null) return 'All';
  if (r < 1) return `${r * 1000}m`;
  return `${r}km`;
}

export default function NearbyScreen() {
  const router = useRouter();
  const { lat, lng, loading, error, refresh } = useLocation();
  const { radiusKm, setRadiusKm, activePeriodFilter, setActivePeriodFilter,
          activeCountyFilter, setActiveCountyFilter, getSitesNear } = useSiteStore();

  const sites = lat && lng ? getSitesNear(lat, lng) : [];

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
          {sites.length} {sites.length === 1 ? 'site' : 'sites'}
          {activeCountyFilter
            ? ` in Co. ${activeCountyFilter}`
            : radiusKm === null
            ? ' across all counties'
            : ` within ${radiusKm < 1 ? radiusKm * 1000 + 'm' : radiusKm + 'km'}`}
        </Text>
      </View>

      {/* Period filter */}
      <PeriodFilterBar active={activePeriodFilter} onChange={setActivePeriodFilter} />

      {/* County filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.countyRow} style={styles.countyScroll}>
        {AVAILABLE_COUNTIES.map((c) => {
          const isActive = c === 'All' ? activeCountyFilter === null : activeCountyFilter === c;
          return (
            <TouchableOpacity
              key={c}
              style={[styles.radiusChip, isActive && styles.radiusChipActive]}
              onPress={() => setActiveCountyFilter(c === 'All' ? null : c)}
            >
              <Text style={[styles.radiusChipText, isActive && styles.radiusChipTextActive]}>Co. {c === 'All' ? 'All' : c}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

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
            style={styles.map}
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            initialRegion={{
              latitude: lat,
              longitude: lng,
              latitudeDelta: radiusKm * 0.02,
              longitudeDelta: radiusKm * 0.02,
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
        <TouchableOpacity style={styles.fab} onPress={refresh} accessibilityLabel="Refresh location">
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
  countyScroll: { flexGrow: 0 },
  countyRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 8 },
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
