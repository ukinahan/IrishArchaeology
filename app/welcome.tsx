import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing, TextInput, ActivityIndicator, Keyboard, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PulsingOrbs } from '@/components/PulsingOrbs';
import { TodayCard } from '@/components/TodayCard';
import { Period, PERIOD_LABELS, PERIOD_ICONS, PERIOD_COLORS, ArchSite } from '@/data/sites';
import { useSiteStore } from '@/store/useSiteStore';
import { searchSites } from '@/services/siteService';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';
import { IRISH_COUNTIES } from '@/data/counties';

const ALL_PERIODS: Period[] = [
  'mesolithic', 'neolithic', 'bronze_age', 'iron_age', 'early_christian',
  'early_medieval', 'medieval', 'post_medieval',
];

type Phase = 'loading' | 'selection' | 'transition';

export default function Index() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [countyOpen, setCountyOpen] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const { setActivePeriodFilter, setActiveCountyFilter, loadSitesByCounty, addSites } = useSiteStore();

  // ---------- Search ----------
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ArchSite[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastQueryRef = useRef('');

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      lastQueryRef.current = q;
      try {
        const results = await searchSites(q, 30);
        // Drop if user has typed something newer in the meantime
        if (lastQueryRef.current !== q) return;
        setSearchResults(results);
      } catch {
        if (lastQueryRef.current !== q) return;
        setSearchResults([]);
      } finally {
        if (lastQueryRef.current === q) setSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  const handleSelectResult = useCallback(
    (site: ArchSite) => {
      // Push the result into the store so the detail screen can find it.
      addSites([site]);
      router.push(`/site/${site.id}`);
    },
    [router, addSites],
  );

  // Phase 1: Loading with pulsing orbs for 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('selection');
      Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, 3000);
    return () => clearTimeout(timer);
  }, [fadeIn]);

  // Phase 3: Transition pulse then navigate
  const handleExplore = useCallback(() => {
    setActivePeriodFilter(selectedPeriod);
    setActiveCountyFilter(selectedCounty);
    if (selectedCounty) loadSitesByCounty(selectedCounty);
    setPhase('transition');
    setTimeout(() => {
      router.replace('/(tabs)');
    }, 1800);
  }, [selectedPeriod, selectedCounty, router, setActivePeriodFilter, setActiveCountyFilter, loadSitesByCounty]);

  // ---------- LOADING ----------
  if (phase === 'loading') {
    return (
      <View style={styles.center}>
        <Text style={styles.appName}>Evin Cairn</Text>
        <Text style={styles.tagline}>Discover Ireland's Ancient Past</Text>
        <View style={styles.orbWrap}>
          <PulsingOrbs size={18} />
        </View>
      </View>
    );
  }

  // ---------- TRANSITION ----------
  if (phase === 'transition') {
    return (
      <View style={styles.center}>
        <Text style={styles.appName}>
          {selectedCounty ? `Co. ${selectedCounty}` : 'All Ireland'}
        </Text>
        <Text style={styles.tagline}>
          {selectedPeriod ? PERIOD_LABELS[selectedPeriod] : 'All Periods'}
        </Text>
        <View style={styles.orbWrap}>
          <PulsingOrbs size={18} />
        </View>
        <Text style={[styles.tagline, { marginTop: 20 }]}>Loading sites…</Text>
      </View>
    );
  }

  // ---------- SELECTION ----------
  return (
    <SafeAreaView style={styles.safe}>
      <Pressable style={{ flex: 1 }} onPress={Keyboard.dismiss} accessible={false}>
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>  
        <ScrollView
          contentContainerStyle={{ paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        <Text style={styles.selTitle}>What are you looking for?</Text>
        <Text style={styles.selSub}>Choose a period and county, or search for a site or town.</Text>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={COLORS.stoneLight} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by site or townland…"
            placeholderTextColor={COLORS.stoneLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
          />
          {searching ? (
            <ActivityIndicator size="small" color={COLORS.gold} />
          ) : searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={COLORS.stoneLight} />
            </TouchableOpacity>
          ) : null}
        </View>

        {searchQuery.trim().length >= 2 && (
          <View style={styles.searchResults}>
            {searching && searchResults.length === 0 ? (
              <Text style={styles.searchEmpty}>Searching…</Text>
            ) : searchResults.length === 0 ? (
              <Text style={styles.searchEmpty}>No matches found.</Text>
            ) : (
              <ScrollView style={styles.searchScroll} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                {searchResults.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.searchItem}
                    onPress={() => handleSelectResult(s)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.searchItemTitle} numberOfLines={1}>{s.name}</Text>
                      <Text style={styles.searchItemSub} numberOfLines={1}>
                        {s.county ? `Co. ${s.county}` : 'Ireland'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={COLORS.stoneLight} />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* On this day in Irish history */}
        <TodayCard />

        {/* Period grid */}
        <Text style={styles.sectionLabel}>Period</Text>
        <View style={styles.periodGrid}>
          {ALL_PERIODS.map((p) => {
            const active = selectedPeriod === p;
            return (
              <TouchableOpacity
                key={p}
                style={[styles.periodCard, active && { borderColor: PERIOD_COLORS[p], borderWidth: 2, backgroundColor: PERIOD_COLORS[p] + '22' }]}
                onPress={() => setSelectedPeriod(active ? null : p)}
              >
                <Text style={styles.periodEmoji}>{PERIOD_ICONS[p]}</Text>
                <Text style={[styles.periodLabel, active && { color: COLORS.parchment }]}>{PERIOD_LABELS[p]}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* County dropdown */}
        <Text style={styles.sectionLabel}>County</Text>
        <TouchableOpacity style={styles.dropdown} onPress={() => setCountyOpen(!countyOpen)}>
          <Text style={styles.dropdownText}>
            {selectedCounty ? `Co. ${selectedCounty}` : 'All Counties'}
          </Text>
          <Ionicons name={countyOpen ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.stoneLight} />
        </TouchableOpacity>

        {countyOpen && (
          <View style={styles.dropdownList}>
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setSelectedCounty(null); setCountyOpen(false); }}>
                <Text style={[styles.dropdownItemText, !selectedCounty && styles.dropdownItemActive]}>All Counties</Text>
              </TouchableOpacity>
              {IRISH_COUNTIES.map((c) => (
                <TouchableOpacity key={c} style={styles.dropdownItem} onPress={() => { setSelectedCounty(c); setCountyOpen(false); }}>
                  <Text style={[styles.dropdownItemText, selectedCounty === c && styles.dropdownItemActive]}>Co. {c}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.exploreBtn} onPress={handleExplore}>
            <Text style={styles.exploreBtnText}>Explore</Text>
            <Ionicons name="arrow-forward" size={18} color={COLORS.forestDark} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setActivePeriodFilter(null); setActiveCountyFilter(null); router.replace('/(tabs)'); }}>
            <Text style={styles.skipText}>Skip — show me everything</Text>
          </TouchableOpacity>

          <Text style={styles.attribution}>
            Site data © Sites and Monuments Record, National Monuments Service of Ireland (CC BY 4.0).
          </Text>
        </View>
        </ScrollView>
      </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.forestDark,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    color: COLORS.gold,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: FONTS.sizes.md,
    color: COLORS.stoneLight,
    marginTop: 8,
  },
  orbWrap: { marginTop: 40 },
  safe: { flex: 1, backgroundColor: COLORS.forestDark },
  content: { flex: 1, padding: 24 },
  selTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.parchment,
    marginBottom: 6,
  },
  selSub: {
    fontSize: FONTS.sizes.md,
    color: COLORS.stoneLight,
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 4,
  },
  periodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  periodCard: {
    width: '30%',
    paddingVertical: 14,
    borderRadius: RADII.md,
    backgroundColor: COLORS.forestMid,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    alignItems: 'center',
    gap: 4,
  },
  periodEmoji: { fontSize: 22 },
  periodLabel: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.stoneLight,
    textAlign: 'center',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.parchment,
    fontWeight: '600',
  },
  dropdownList: {
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    marginTop: 4,
    maxHeight: 200,
  },
  dropdownScroll: { paddingVertical: 4 },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownItemText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.stoneLight,
  },
  dropdownItemActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  actions: {
    marginTop: 'auto',
    paddingTop: 20,
    gap: 16,
    alignItems: 'center',
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.gold,
    borderRadius: RADII.full,
    paddingVertical: 16,
    paddingHorizontal: 40,
    width: '100%',
    ...SHADOWS.card,
  },
  exploreBtnText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '800',
    color: COLORS.forestDark,
  },
  skipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.stoneLight,
    textDecorationLine: 'underline',
  },
  attribution: {
    fontSize: 11,
    color: COLORS.stoneLight,
    textAlign: 'center',
    marginTop: 14,
    paddingHorizontal: 12,
    opacity: 0.7,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.parchment,
    paddingVertical: 0,
  },
  searchResults: {
    backgroundColor: COLORS.forestMid,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    maxHeight: 220,
    marginBottom: 18,
  },
  searchScroll: { paddingVertical: 4 },
  searchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.forestLight,
  },
  searchItemTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.parchment,
  },
  searchItemSub: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.stoneLight,
    marginTop: 2,
  },
  searchEmpty: {
    padding: 14,
    fontSize: FONTS.sizes.sm,
    color: COLORS.stoneLight,
    textAlign: 'center',
  },
});

