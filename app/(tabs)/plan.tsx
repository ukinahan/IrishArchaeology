// app/(tabs)/plan.tsx — Trip Planner wizard + results
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  FlatList,
  Pressable,
  Linking,
  Platform,
  Share,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

import { Period, PERIOD_LABELS, PERIOD_ICONS, PERIOD_COLORS } from '@/data/sites';
import { useSiteStore } from '@/store/useSiteStore';
import { fetchSitesByCounty } from '@/services/siteService';
import {
  planTrip,
  TripPlan,
  TripDay,
  TripStop,
  PlannerPeriod,
  SUGGESTED_THEMES,
  SuggestedTheme,
  StartPoint,
} from '@/utils/tripPlanner';
import { buildGoogleDirectionsUrl, buildItineraryIcs, formatMins } from '@/utils/tripExport';
import { usePlansStore, SavedPlan } from '@/store/usePlansStore';
import { geocodePlace } from '@/services/geocodeService';
import { useLocation } from '@/hooks/useLocation';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';
import { tapLight, notifySuccess } from '@/utils/haptics';
import { track } from '@/utils/telemetry';
import { IRISH_COUNTIES } from '@/data/counties';

const ALL_PERIODS: Period[] = [
  'mesolithic', 'neolithic', 'bronze_age', 'iron_age', 'early_christian',
  'early_medieval', 'medieval', 'post_medieval',
];

// Special pseudo-periods for the wizard. 'suggested' biases the planner
// toward curated marquee sites; 'all' lets every period mix in.
const SPECIAL_OPTIONS: Array<{ key: PlannerPeriod; label: string; icon: string; color: string }> = [
  { key: 'suggested', label: 'Suggested', icon: '★', color: '#d4a017' },
  { key: 'all',       label: 'All Periods', icon: '☘', color: COLORS.gold },
];

function periodLabel(p: PlannerPeriod): string {
  if (p === 'all') return 'All periods';
  if (p === 'suggested') return 'Suggested route';
  return PERIOD_LABELS[p];
}

function periodColor(p: PlannerPeriod): string {
  if (p === 'all' || p === 'suggested') return COLORS.gold;
  return PERIOD_COLORS[p];
}

const DAY_OPTIONS = [1, 2, 3];

type Phase = 'wizard' | 'building' | 'result';

export default function PlanScreen() {
  const router = useRouter();
  const { allSites, addSites } = useSiteStore();
  const userLocation = useLocation();

  const [period, setPeriod] = useState<PlannerPeriod | null>(null);
  const [themeKey, setThemeKey] = useState<string | null>(null);
  const [county, setCounty] = useState<string | null>(null);
  const [days, setDays] = useState<number>(2);
  const [countyOpen, setCountyOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('wizard');
  const [plan, setPlan] = useState<TripPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Starting point: free-text address that we geocode on Build.
  const [startInput, setStartInput] = useState<string>('');
  const [usingGps, setUsingGps] = useState<boolean>(false);

  // Optional ending point. When `endsAtStart` is true (default once a start
  // is provided), we treat it as a round-trip and don't ask for a separate
  // end. The user can flip the switch to enter a different end point.
  const [endInput, setEndInput] = useState<string>('');
  const [endsAtStart, setEndsAtStart] = useState<boolean>(true);

  // Saved plans
  const { plans: savedPlans, hydrate: hydratePlans, savePlan, deletePlan } = usePlansStore();
  const [savedOpen, setSavedOpen] = useState(false);
  useEffect(() => { hydratePlans(); }, [hydratePlans]);

  const canBuild = period !== null;

  // When the user picks a theme, auto-fill the county for context. They can
  // still override it by opening the county picker.
  const handlePickTheme = useCallback((theme: SuggestedTheme) => {
    setThemeKey(theme.key);
    if (theme.county) setCounty(theme.county);
  }, []);

  const useMyLocation = useCallback(() => {
    if (userLocation.lat == null || userLocation.lng == null) {
      userLocation.refresh();
      return;
    }
    setUsingGps(true);
    setStartInput('');
  }, [userLocation]);

  const handleBuild = useCallback(async () => {
    if (!period) return;
    setError(null);
    setPhase('building');
    try {
      // Resolve starting point: GPS toggle wins, otherwise geocode the text.
      let start: StartPoint | null = null;
      if (usingGps && userLocation.lat != null && userLocation.lng != null) {
        start = { lat: userLocation.lat, lng: userLocation.lng, label: 'My location' };
      } else if (startInput.trim().length >= 2) {
        const g = await geocodePlace(startInput);
        if (!g) {
          setError(`Couldn't find "${startInput}". Try a town or address.`);
          setPhase('wizard');
          return;
        }
        start = { lat: g.lat, lng: g.lng, label: startInput.trim() };
      }

      // Resolve end point. If "ends at start" is on (default) we mirror the
      // start point so the planner closes the loop. Otherwise we geocode the
      // typed end address. If neither start nor end is given, leave it null.
      let end: StartPoint | null = null;
      if (start && endsAtStart) {
        end = { ...start, label: `Return to ${start.label}` };
      } else if (!endsAtStart && endInput.trim().length >= 2) {
        const g = await geocodePlace(endInput);
        if (!g) {
          setError(`Couldn't find "${endInput}". Try a town or address.`);
          setPhase('wizard');
          return;
        }
        end = { lat: g.lat, lng: g.lng, label: endInput.trim() };
      }

      // If a county is chosen, make sure we have its sites in the store.
      // Otherwise plan from whatever is loaded — typically the country sample
      // plus any counties the user has browsed this session.
      let pool = allSites;
      if (county) {
        const have = allSites.some((s) => s.county === county);
        if (!have) {
          const fetched = await fetchSitesByCounty(county);
          if (fetched.length > 0) {
            addSites(fetched);
            pool = [...allSites, ...fetched];
          }
        }
      }
      const built = planTrip({ sites: pool, period, county, days, themeKey, start, end });
      if (built.totalSites === 0) {
        const where = county ? `Co. ${county}` : 'this area';
        setError(
          period === 'suggested'
            ? `No suggested sites loaded for ${where} yet. Try picking a county.`
            : period === 'all'
            ? `No sites loaded for ${where} yet. Try picking a county.`
            : county
            ? `No ${PERIOD_LABELS[period]} sites found in Co. ${county}. Try another period or county.`
            : `No ${PERIOD_LABELS[period]} sites loaded yet. Try selecting a county.`,
        );
        setPhase('wizard');
        return;
      }
      setPlan(built);
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build trip');
      setPhase('wizard');
    }
  }, [period, county, days, themeKey, startInput, usingGps, endsAtStart, endInput, userLocation, allSites, addSites]);

  const handleReset = useCallback(() => {
    setPlan(null);
    setPhase('wizard');
  }, []);

  const openInMaps = useCallback(async (stop: TripStop) => {
    const { lat, lng } = stop.site;
    const label = encodeURIComponent(stop.site.name);

    // Prefer the Google Maps app, then web Google Maps, then Apple Maps as a
    // last resort. Always pin by coordinates (with the site name as a label)
    // — if we use the name as `q=`, Google Maps treats it as a free-text
    // search and often lands on the wrong site of the same name in another
    // county.
    const coordQ = `${lat},${lng}(${label})`;
    const googleAppUrl = `comgooglemaps://?q=${coordQ}&center=${lat},${lng}&zoom=15`;
    const googleWebUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    const appleUrl = `http://maps.apple.com/?ll=${lat},${lng}&q=${label}`;
    const androidGeoUrl = `geo:${lat},${lng}?q=${lat},${lng}(${label})`;

    try {
      if (Platform.OS === 'ios') {
        const canOpenGoogle = await Linking.canOpenURL(googleAppUrl).catch(() => false);
        if (canOpenGoogle) {
          await Linking.openURL(googleAppUrl);
          return;
        }
        // Fall back to the Google Maps website (still Google, no native app)
        const canOpenWeb = await Linking.canOpenURL(googleWebUrl).catch(() => false);
        if (canOpenWeb) {
          await Linking.openURL(googleWebUrl);
          return;
        }
        await Linking.openURL(appleUrl);
      } else {
        // Android: geo: intent will offer Google Maps if installed
        const canOpenGeo = await Linking.canOpenURL(androidGeoUrl).catch(() => false);
        if (canOpenGeo) {
          await Linking.openURL(androidGeoUrl);
          return;
        }
        await Linking.openURL(googleWebUrl);
      }
    } catch {
      // Final fallback
      Linking.openURL(googleWebUrl).catch(() => {});
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!plan) return;
    tapLight();
    const message = formatItinerary(plan);
    try {
      await Share.share({
        title: `Evin Cairn — ${periodLabel(plan.period)} trip`,
        message,
      });
      track('plan_shared', { days: plan.days.length, sites: plan.totalSites });
    } catch {
      // User cancelled or share unavailable; nothing to do
    }
  }, [plan]);

  const handleSave = useCallback(() => {
    if (!plan) return;
    const defaultName = plan.themeKey
      ? SUGGESTED_THEMES.find((t) => t.key === plan.themeKey)?.label ?? 'My trip'
      : `${periodLabel(plan.period)}${plan.county ? ` · Co. ${plan.county}` : ''}`;
    Alert.prompt(
      'Save trip',
      'Give this plan a name so you can come back to it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (value?: string) => {
            const saved = await savePlan(value || defaultName, plan);
            notifySuccess();
            track('plan_saved', { id: saved.id, days: plan.days.length });
          },
        },
      ],
      'plain-text',
      defaultName,
    );
  }, [plan, savePlan]);

  const handleExportIcs = useCallback(async () => {
    if (!plan) return;
    tapLight();
    try {
      // expo-file-system v19 moved documentDirectory + writeAsStringAsync to
      // the /legacy subpath. Use that here — the new File/Paths API would
      // also work but the legacy surface is the simplest stable path.
      const FileSystem = await import('expo-file-system/legacy');
      const Sharing = await import('expo-sharing');
      const ics = buildItineraryIcs(plan);
      const dir = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
      if (!dir) throw new Error('No filesystem available');
      const uri = `${dir}irish-archaeology-trip.ics`;
      await FileSystem.writeAsStringAsync(uri, ics);
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'text/calendar', UTI: 'com.apple.ical.ics' });
        track('plan_exported_ics', { days: plan.days.length });
      } else {
        Alert.alert('Export', 'Calendar sharing is not available on this device.');
      }
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Could not export calendar file.');
    }
  }, [plan]);

  const openDayInMaps = useCallback(async (day: TripDay) => {
    const url = buildGoogleDirectionsUrl(day, plan?.start);
    if (!url) return;
    tapLight();
    track('plan_open_day_route', { day: day.index, stops: day.stops.length });
    Linking.openURL(url).catch(() => {});
  }, [plan]);

  const handleLoadSaved = useCallback((sp: SavedPlan) => {
    setSavedOpen(false);
    setPlan(sp.plan);
    setPhase('result');
    track('plan_loaded_saved', { id: sp.id });
  }, []);

  // ---------- Result view ----------
  if (phase === 'result' && plan) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Your Trip</Text>
              <Text style={styles.headerSub}>
                {periodLabel(plan.period)} {plan.county ? `· Co. ${plan.county}` : '· Ireland'}
                {' · '}{plan.days.length} {plan.days.length === 1 ? 'day' : 'days'}
                {' · '}{plan.totalSites} stops
              </Text>
              <Text style={styles.headerSub}>
                ~{plan.totalKm.toFixed(0)} km · Drive {formatMins(plan.totalDriveMinutes)} · Visit {formatMins(plan.totalVisitMinutes)}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleSave}
              accessibilityLabel="Save itinerary"
              accessibilityRole="button"
            >
              <Ionicons name="bookmark-outline" size={18} color={COLORS.forestDark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleExportIcs}
              accessibilityLabel="Add itinerary to calendar"
              accessibilityRole="button"
            >
              <Ionicons name="calendar-outline" size={18} color={COLORS.forestDark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleShare}
              accessibilityLabel="Share itinerary"
              accessibilityRole="button"
            >
              <Ionicons name="share-outline" size={18} color={COLORS.forestDark} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={handleReset}
              accessibilityLabel="Plan a new trip"
              accessibilityRole="button"
            >
              <Ionicons name="refresh" size={18} color={COLORS.forestDark} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.resultList}>
          {plan.overAmbitious && (
            <View style={styles.warnBanner} accessibilityRole="alert">
              <Ionicons name="warning-outline" size={18} color={COLORS.forestDark} />
              <Text style={styles.warnText}>
                {plan.trimmedStops
                  ? `This trip is ambitious — we trimmed ${plan.trimmedStops} stop${plan.trimmedStops === 1 ? '' : 's'} to keep each day under ~250 km.`
                  : `Some days exceed ~250 km of driving.`}{' '}
                Try adding a day or narrowing the county for a more relaxed pace.
              </Text>
            </View>
          )}
          {plan.days.map((day) => (
            <DayCard
              key={day.index}
              day={day}
              periodColor={periodColor(plan.period)}
              onOpenMaps={openInMaps}
              onOpenSite={(s) => router.push(`/site/${s.site.id}`)}
              onOpenDayRoute={() => openDayInMaps(day)}
            />
          ))}
          <Text style={styles.footnote}>
            Distances are straight-line estimates between sites. Always check access and parking before
            visiting — many sites are on private farmland.
          </Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- Building state ----------
  if (phase === 'building') {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.gold} size="large" />
          <Text style={styles.buildingText}>Planning your route…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ---------- Wizard ----------
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Plan a Trip</Text>
            <Text style={styles.headerSub}>
              Pick a period and a place — we'll build a day-by-day route through the highlights.
            </Text>
          </View>
          {savedPlans.length > 0 && (
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => { tapLight(); setSavedOpen(true); }}
              accessibilityLabel={`Open saved trips (${savedPlans.length})`}
              accessibilityRole="button"
            >
              <Ionicons name="bookmark" size={18} color={COLORS.forestDark} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.wizardContent} keyboardShouldPersistTaps="handled">
        {/* Period */}
        <Text style={styles.sectionLabel}>1. Choose a period</Text>
        <View style={styles.periodGrid}>
          {SPECIAL_OPTIONS.map((opt) => {
            const active = period === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.periodChip,
                  styles.specialChip,
                  active && { backgroundColor: opt.color, borderColor: opt.color },
                ]}
                onPress={() => setPeriod(opt.key)}
              >
                <Text style={[styles.periodChipIcon, active && { color: COLORS.forestDark }]}>
                  {opt.icon}
                </Text>
                <Text
                  style={[
                    styles.periodChipText,
                    active && { color: COLORS.forestDark, fontWeight: '800' },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          {ALL_PERIODS.map((p) => {
            const active = period === p;
            return (
              <TouchableOpacity
                key={p}
                style={[
                  styles.periodChip,
                  active && { backgroundColor: PERIOD_COLORS[p], borderColor: PERIOD_COLORS[p] },
                ]}
                onPress={() => setPeriod(p)}
              >
                <Text style={[styles.periodChipIcon, active && { color: '#fff' }]}>{PERIOD_ICONS[p]}</Text>
                <Text style={[styles.periodChipText, active && { color: '#fff' }]}>
                  {PERIOD_LABELS[p]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {period === 'suggested' && (
          <Text style={styles.helpText}>
            ★ Hand-picked landmark sites — the best of what to see in your chosen county across every period.
          </Text>
        )}
        {period === 'all' && (
          <Text style={styles.helpText}>
            Mix of sites from every period, ranked by significance.
          </Text>
        )}

        {/* Themed routes (Suggested only) */}
        {period === 'suggested' && (
          <>
            <Text style={styles.sectionLabel}>Choose a route theme (optional)</Text>
            <View style={styles.themeList}>
              <TouchableOpacity
                style={[styles.themeCard, themeKey === null && styles.themeCardActive]}
                onPress={() => setThemeKey(null)}
              >
                <Text style={[styles.themeTitle, themeKey === null && styles.themeTitleActive]}>
                  Auto — best of the county
                </Text>
                <Text style={styles.themeDesc}>
                  Let the planner pick the highest-rated sites for the county and days you choose.
                </Text>
              </TouchableOpacity>
              {SUGGESTED_THEMES.map((theme) => {
                const active = themeKey === theme.key;
                return (
                  <TouchableOpacity
                    key={theme.key}
                    style={[styles.themeCard, active && styles.themeCardActive]}
                    onPress={() => handlePickTheme(theme)}
                  >
                    <View style={styles.themeHeaderRow}>
                      <Text style={[styles.themeTitle, active && styles.themeTitleActive]}>
                        {theme.label}
                      </Text>
                      {theme.county && (
                        <Text style={styles.themeCounty}>Co. {theme.county}</Text>
                      )}
                    </View>
                    <Text style={styles.themeDesc}>{theme.description}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {/* Starting point */}
        <Text style={styles.sectionLabel}>Where are you starting from? (optional)</Text>
        <View style={styles.startRow}>
          <TextInput
            style={styles.startInput}
            value={usingGps ? 'My current location' : startInput}
            onChangeText={(t) => { setStartInput(t); if (usingGps) setUsingGps(false); }}
            placeholder="e.g. Dublin, Galway, Sligo town"
            placeholderTextColor={COLORS.stoneLight}
            editable={!usingGps}
            autoCorrect={false}
            autoCapitalize="words"
          />
          <TouchableOpacity
            style={[styles.gpsBtn, usingGps && styles.gpsBtnActive]}
            onPress={useMyLocation}
            accessibilityLabel="Use my current location"
          >
            <Ionicons
              name={usingGps ? 'navigate' : 'navigate-outline'}
              size={18}
              color={usingGps ? COLORS.forestDark : COLORS.parchment}
            />
          </TouchableOpacity>
        </View>
        <Text style={styles.helpText}>
          We'll order the days so you start nearest your location.
        </Text>

        {/* End point */}
        {(usingGps || startInput.trim().length >= 2) && (
          <>
            <View style={styles.endHeaderRow}>
              <Text style={[styles.sectionLabel, { marginTop: 16, marginBottom: 0, flex: 1 }]}>
                Where does your trip end?
              </Text>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setEndsAtStart((v) => !v)}
                accessibilityLabel="Toggle round trip"
              >
                <Ionicons
                  name={endsAtStart ? 'checkbox' : 'square-outline'}
                  size={18}
                  color={endsAtStart ? COLORS.gold : COLORS.stoneLight}
                />
                <Text style={styles.toggleText}>Round trip</Text>
              </TouchableOpacity>
            </View>
            {endsAtStart ? (
              <Text style={styles.helpText}>
                Trip will return to your starting point. Uncheck to set a different end.
              </Text>
            ) : (
              <>
                <View style={styles.startRow}>
                  <TextInput
                    style={styles.startInput}
                    value={endInput}
                    onChangeText={setEndInput}
                    placeholder="e.g. Shannon Airport, Belfast"
                    placeholderTextColor={COLORS.stoneLight}
                    autoCorrect={false}
                    autoCapitalize="words"
                  />
                </View>
                <Text style={styles.helpText}>
                  We'll route the last day so it ends nearest here.
                </Text>
              </>
            )}
          </>
        )}

        {/* County */}
        <Text style={styles.sectionLabel}>2. Anywhere in Ireland — or pick a county</Text>
        <TouchableOpacity
          style={styles.countyDropdown}
          onPress={() => setCountyOpen(true)}
        >
          <Text style={styles.countyDropdownText}>
            {county ? `Co. ${county}` : 'All of Ireland'}
          </Text>
          <Ionicons name="chevron-down" size={16} color={COLORS.stoneLight} />
        </TouchableOpacity>

        {/* Days */}
        <Text style={styles.sectionLabel}>3. How many days?</Text>
        <View style={styles.daysRow}>
          {DAY_OPTIONS.map((d) => {
            const active = days === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => setDays(d)}
              >
                <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                  {d} {d === 1 ? 'day' : 'days'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity
          style={[styles.buildBtn, !canBuild && styles.buildBtnDisabled]}
          disabled={!canBuild}
          onPress={handleBuild}
        >
          <Ionicons name="map" size={18} color={COLORS.forestDark} />
          <Text style={styles.buildBtnText}>Build my trip</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* County picker */}
      <Modal visible={countyOpen} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setCountyOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select County</Text>
              <TouchableOpacity onPress={() => setCountyOpen(false)}>
                <Ionicons name="close" size={24} color={COLORS.parchment} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={['All', ...IRISH_COUNTIES]}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isActive = item === 'All' ? county === null : county === item;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isActive && styles.modalItemActive]}
                    onPress={() => {
                      setCounty(item === 'All' ? null : item);
                      setCountyOpen(false);
                    }}
                  >
                    <Text style={[styles.modalItemText, isActive && styles.modalItemTextActive]}>
                      {item === 'All' ? 'All of Ireland' : `Co. ${item}`}
                    </Text>
                    {isActive && <Ionicons name="checkmark" size={18} color={COLORS.forestDark} />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Saved trips modal */}
      <Modal visible={savedOpen} transparent animationType="fade" onRequestClose={() => setSavedOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSavedOpen(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Saved trips</Text>
              <TouchableOpacity onPress={() => setSavedOpen(false)} hitSlop={12}>
                <Ionicons name="close" size={22} color={COLORS.stoneLight} />
              </TouchableOpacity>
            </View>
            {savedPlans.length === 0 ? (
              <Text style={styles.helpText}>No saved trips yet.</Text>
            ) : (
              <FlatList
                data={savedPlans}
                keyExtractor={(item) => item.id}
                ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
                renderItem={({ item }) => (
                  <View style={styles.savedRow}>
                    <Pressable style={{ flex: 1 }} onPress={() => handleLoadSaved(item)}>
                      <Text style={styles.savedName} numberOfLines={1}>{item.name}</Text>
                      <Text style={styles.savedMeta} numberOfLines={1}>
                        {item.plan.days.length}d · {item.plan.totalSites} stops · {item.plan.totalKm.toFixed(0)} km
                      </Text>
                    </Pressable>
                    <TouchableOpacity
                      hitSlop={12}
                      onPress={() => {
                        Alert.alert('Delete trip', `Remove "${item.name}"?`, [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete', style: 'destructive', onPress: () => deletePlan(item.id) },
                        ]);
                      }}
                      accessibilityLabel={`Delete ${item.name}`}
                      accessibilityRole="button"
                    >
                      <Ionicons name="trash-outline" size={18} color={COLORS.stoneLight} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

// ---------- Itinerary text formatter (used by Share) ----------
function formatItinerary(plan: TripPlan): string {
  const header = `Evin Cairn — ${periodLabel(plan.period)} trip`;
  const sub = `${plan.county ? `Co. ${plan.county}` : 'Ireland'} · ${plan.days.length} ${plan.days.length === 1 ? 'day' : 'days'} · ${plan.totalSites} stops · ~${plan.totalKm.toFixed(0)} km`;
  const startLine = plan.start ? `Starting from: ${plan.start.label}` : '';
  const endLine = plan.end
    ? plan.end.label.startsWith('Return to')
      ? `Round trip — returns to start`
      : `Ending at: ${plan.end.label}`
    : '';
  const dayBlocks = plan.days.map((day) => {
    const lines = day.stops.map((stop, i) => {
      const name = stop.marquee?.name ?? stop.site.name;
      const mapsLink = `https://www.google.com/maps/search/?api=1&query=${stop.site.lat},${stop.site.lng}`;
      const info = stop.site.nmsLink
        ? `\n     Info: ${stop.site.nmsLink}`
        : `\n     Info: ${wikipediaSearchUrl(stop)}`;
      const blurb = stop.marquee?.blurb ? `\n     ${stop.marquee.blurb}` : '';
      return `  ${i + 1}. ${name} (Co. ${stop.site.county})${blurb}\n     ${mapsLink}${info}`;
    });
    const route = buildGoogleDirectionsUrl(day, plan.start);
    const routeLine = route ? `\n  Day route: ${route}` : '';
    return `Day ${day.index + 1} — ${day.stops.length} stops · ~${day.totalKm.toFixed(0)} km · Drive ${formatMins(day.driveMinutes)}${routeLine}\n${lines.join('\n')}`;
  });
  const footer = '\nPlanned with Evin Cairn — Irish Archaeology';
  return [header, sub, startLine, endLine, '', ...dayBlocks, footer].filter(Boolean).join('\n');
}

// Wikipedia search link for sites without an NMS info URL.
function wikipediaSearchUrl(stop: TripStop): string {
  const q = encodeURIComponent(
    stop.marquee?.name ?? `${stop.site.type} ${stop.site.county} Ireland`,
  );
  return `https://en.wikipedia.org/wiki/Special:Search?search=${q}`;
}

// ---------- Day card ----------
function DayCard({
  day,
  periodColor,
  onOpenMaps,
  onOpenSite,
  onOpenDayRoute,
}: {
  day: TripDay;
  periodColor: string;
  onOpenMaps: (s: TripStop) => void;
  onOpenSite: (s: TripStop) => void;
  onOpenDayRoute: () => void;
}) {
  return (
    <View style={styles.dayCard}>
      <View style={styles.dayHeader}>
        <View style={[styles.dayBadge, { backgroundColor: periodColor }]}>
          <Text style={styles.dayBadgeText}>Day {day.index + 1}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.dayMeta}>
            {day.stops.length} stops · {day.totalKm.toFixed(0)} km
          </Text>
          <Text style={styles.dayMeta}>
            Drive {formatMins(day.driveMinutes)} · Visit {formatMins(day.visitMinutes)}
          </Text>
        </View>
        {day.stops.length > 0 && (
          <TouchableOpacity
            style={styles.dayRouteBtn}
            onPress={onOpenDayRoute}
            accessibilityLabel={`Open Day ${day.index + 1} route in Google Maps`}
            accessibilityRole="button"
          >
            <Ionicons name="map-outline" size={14} color={COLORS.forestDark} />
            <Text style={styles.dayRouteBtnText}>Route</Text>
          </TouchableOpacity>
        )}
      </View>
      {day.stops.map((stop, i) => (
        <View key={stop.site.id}>
          {i > 0 && <View style={styles.legLine} />}
          <Pressable style={styles.stopRow} onPress={() => onOpenSite(stop)}>
            <View style={[styles.stopIndex, { borderColor: periodColor }]}>
              <Text style={[styles.stopIndexText, { color: periodColor }]}>{i + 1}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stopName} numberOfLines={2}>
                {stop.marquee?.name ?? stop.site.name}
              </Text>
              <Text style={styles.stopMeta} numberOfLines={1}>
                Co. {stop.site.county}
                {stop.marquee && ' · ★ Marquee site'}
              </Text>
              {stop.marquee?.blurb && (
                <Text style={styles.stopBlurb} numberOfLines={3}>
                  {stop.marquee.blurb}
                </Text>
              )}
              <View style={styles.stopLinksRow}>
                {stop.site.nmsLink ? (
                  <TouchableOpacity
                    style={styles.stopLinkBtn}
                    onPress={() => Linking.openURL(stop.site.nmsLink!).catch(() => {})}
                  >
                    <Ionicons name="document-text-outline" size={12} color={COLORS.gold} />
                    <Text style={styles.stopLinkText}>NMS record</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  style={styles.stopLinkBtn}
                  onPress={() => Linking.openURL(wikipediaSearchUrl(stop)).catch(() => {})}
                >
                  <Ionicons name="book-outline" size={12} color={COLORS.gold} />
                  <Text style={styles.stopLinkText}>Wikipedia</Text>
                </TouchableOpacity>
              </View>
            </View>
            <TouchableOpacity
              style={styles.mapsBtn}
              onPress={() => onOpenMaps(stop)}
              accessibilityLabel={`Open ${stop.site.name} in Maps`}
            >
              <Ionicons name="navigate" size={18} color={COLORS.forestDark} />
            </TouchableOpacity>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.forestDark },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.parchment },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.stoneLight, marginTop: 4 },
  resetBtn: {
    width: 38, height: 38, borderRadius: RADII.full,
    backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.card,
  },
  headerActionBtn: {
    width: 38, height: 38, borderRadius: RADII.full,
    backgroundColor: COLORS.gold,
    alignItems: 'center', justifyContent: 'center',
    ...SHADOWS.card,
  },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  buildingText: { color: COLORS.parchment, fontSize: FONTS.sizes.md },

  wizardContent: { padding: 16, paddingBottom: 48, gap: 8 },
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.gold,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 6,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.full,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
  },
  specialChip: {
    borderColor: COLORS.gold,
  },
  helpText: {
    color: COLORS.stoneLight,
    fontSize: FONTS.sizes.xs,
    fontStyle: 'italic',
    marginTop: 8,
  },
  periodChipIcon: { fontSize: 14, color: COLORS.parchment },
  periodChipText: { color: COLORS.parchment, fontWeight: '600', fontSize: FONTS.sizes.sm },

  countyDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
  },
  countyDropdownText: { color: COLORS.parchment, fontWeight: '600', fontSize: FONTS.sizes.md },

  daysRow: { flexDirection: 'row', gap: 8 },
  dayChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
  },
  dayChipActive: { backgroundColor: COLORS.gold, borderColor: COLORS.goldLight },
  dayChipText: { color: COLORS.parchment, fontWeight: '600' },
  dayChipTextActive: { color: COLORS.forestDark },

  errorText: { color: '#ff8a8a', marginTop: 12, textAlign: 'center' },

  buildBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: RADII.full,
    ...SHADOWS.card,
  },
  buildBtnDisabled: { opacity: 0.4 },
  buildBtnText: { color: COLORS.forestDark, fontWeight: '800', fontSize: FONTS.sizes.md },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: COLORS.forestDark,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '70%',
    padding: 16,
    borderTopWidth: 1,
    borderColor: COLORS.forestLight,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: COLORS.forestMid,
  },
  modalTitle: { color: COLORS.parchment, fontWeight: '700', fontSize: FONTS.sizes.lg },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderColor: COLORS.forestMid,
  },
  modalItemActive: { backgroundColor: COLORS.gold },
  modalItemText: { color: COLORS.parchment, fontSize: FONTS.sizes.md },
  modalItemTextActive: { color: COLORS.forestDark, fontWeight: '700' },
  modalSeparator: {
    height: 1,
    backgroundColor: COLORS.forestMid,
  },
  savedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    gap: 12,
  },
  savedName: {
    color: COLORS.parchment,
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
  },
  savedMeta: {
    color: COLORS.stoneLight,
    fontSize: FONTS.sizes.xs,
    marginTop: 2,
  },

  // Result
  resultList: { padding: 16, paddingBottom: 40, gap: 16 },
  dayCard: {
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    ...SHADOWS.card,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.full,
  },
  dayBadgeText: { color: '#fff', fontWeight: '800', fontSize: FONTS.sizes.sm },
  dayMeta: { color: COLORS.stoneLight, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  dayRouteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADII.full,
    backgroundColor: COLORS.gold,
  },
  dayRouteBtnText: {
    color: COLORS.forestDark,
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
  },
  legLine: {
    height: 16,
    width: 2,
    backgroundColor: COLORS.forestLight,
    marginLeft: 16,
  },
  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stopIndex: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.forestDark,
  },
  stopIndexText: { fontWeight: '800', fontSize: FONTS.sizes.sm },
  stopName: { color: COLORS.parchment, fontSize: FONTS.sizes.md, fontWeight: '700' },
  stopMeta: { color: COLORS.stoneLight, fontSize: FONTS.sizes.xs, marginTop: 2 },
  stopBlurb: { color: COLORS.parchment, fontSize: FONTS.sizes.sm, marginTop: 6, opacity: 0.85 },
  stopLinksRow: { flexDirection: 'row', gap: 12, marginTop: 8, flexWrap: 'wrap' },
  stopLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.forestDark,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
  },
  stopLinkText: { color: COLORS.gold, fontSize: 11, fontWeight: '600' },
  // Themes
  themeList: { gap: 8, marginTop: 4 },
  themeCard: {
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    padding: 12,
  },
  themeCardActive: { borderColor: COLORS.gold, backgroundColor: COLORS.bgCard },
  themeHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  themeTitle: { color: COLORS.parchment, fontWeight: '700', fontSize: FONTS.sizes.md, flex: 1 },
  themeTitleActive: { color: COLORS.gold },
  themeCounty: { color: COLORS.stoneLight, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  themeDesc: { color: COLORS.stoneLight, fontSize: FONTS.sizes.xs, marginTop: 4, lineHeight: 16 },
  // Starting point
  startRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  startInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    color: COLORS.parchment,
    fontSize: FONTS.sizes.md,
  },
  gpsBtn: {
    width: 44,
    height: 44,
    borderRadius: RADII.md,
    backgroundColor: COLORS.forestMid,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsBtnActive: { backgroundColor: COLORS.gold, borderColor: COLORS.goldLight },
  endHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  toggleText: { color: COLORS.parchment, fontSize: FONTS.sizes.xs, fontWeight: '600' },
  mapsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: {
    color: COLORS.stoneLight,
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  warnBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff4d6',
    borderColor: '#e0b84a',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  warnText: {
    flex: 1,
    color: COLORS.forestDark,
    fontSize: FONTS.sizes.sm,
    lineHeight: 18,
  },
});
