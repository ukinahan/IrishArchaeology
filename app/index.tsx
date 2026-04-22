import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PulsingOrbs } from '@/components/PulsingOrbs';
import { Period, PERIOD_LABELS, PERIOD_ICONS, PERIOD_COLORS } from '@/data/sites';
import { useSiteStore } from '@/store/useSiteStore';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';

const ALL_PERIODS: Period[] = [
  'stone_age', 'bronze_age', 'iron_age', 'early_christian',
  'early_medieval', 'medieval', 'post_medieval',
];

const IRISH_COUNTIES = [
  'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway',
  'Kerry', 'Kildare', 'Kilkenny', 'Laois', 'Leitrim', 'Limerick',
  'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
  'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath',
  'Wexford', 'Wicklow',
];

type Phase = 'loading' | 'selection' | 'transition';

export default function Index() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>(null);
  const [selectedCounty, setSelectedCounty] = useState<string | null>(null);
  const [countyOpen, setCountyOpen] = useState(false);
  const fadeIn = useRef(new Animated.Value(0)).current;
  const { setActivePeriodFilter, setActiveCountyFilter, loadSitesByCounty } = useSiteStore();

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
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>  
        <Text style={styles.selTitle}>What are you looking for?</Text>
        <Text style={styles.selSub}>Choose a period and county, or skip to explore everything.</Text>

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
        </View>
      </Animated.View>
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
});

