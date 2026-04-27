// src/components/TimeMachineSlider.tsx
// Draggable horizontal timeline that lets the user scrub through Irish
// prehistory + history. Shows the current year, the active period name and
// color, and the count of sites that fall within that period. Tapping the
// "off" pill collapses the slider so the map shows everything again.
import { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, LayoutChangeEvent, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Period, PERIOD_COLORS, PERIOD_LABELS, PERIOD_YEARS, TIMELINE_MIN_YEAR, TIMELINE_MAX_YEAR } from '@/data/sites';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';
import { tapLight } from '@/utils/haptics';

const PERIOD_ORDER: Period[] = [
  'stone_age', 'bronze_age', 'iron_age', 'early_christian',
  'early_medieval', 'medieval', 'post_medieval',
];

const TOTAL_YEARS = TIMELINE_MAX_YEAR - TIMELINE_MIN_YEAR;

export function periodAtYear(year: number): Period | null {
  for (const p of PERIOD_ORDER) {
    const r = PERIOD_YEARS[p];
    if (year >= r.start && year < r.end) return p;
  }
  return null;
}

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year).toLocaleString()} BC`;
  if (year < 1000) return `AD ${year}`;
  return `${year}`;
}

export interface TimeMachineSliderProps {
  /** Current selected year, or null when the slider is "off" / unfiltered. */
  year: number | null;
  onYearChange: (year: number | null) => void;
  /** Total site count per period, used to label the active segment. */
  countsByPeriod?: Partial<Record<Period, number>>;
}

export function TimeMachineSlider({ year, onYearChange, countsByPeriod }: TimeMachineSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackWidthRef = useRef(0);
  const onTrackLayout = useCallback((e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    trackWidthRef.current = w;
    setTrackWidth(w);
  }, []);

  const setFromX = useCallback((x: number) => {
    const w = trackWidthRef.current;
    if (w <= 0) return;
    const clamped = Math.max(0, Math.min(w, x));
    const ratio = clamped / w;
    const y = Math.round(TIMELINE_MIN_YEAR + ratio * TOTAL_YEARS);
    onYearChange(y);
  }, [onYearChange]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        tapLight();
        setFromX(evt.nativeEvent.locationX);
      },
      onPanResponderMove: (evt) => {
        setFromX(evt.nativeEvent.locationX);
      },
    }),
  ).current;

  const activePeriod = year !== null ? periodAtYear(year) : null;
  const thumbX = useMemo(() => {
    if (year === null || trackWidth === 0) return 0;
    const ratio = (year - TIMELINE_MIN_YEAR) / TOTAL_YEARS;
    return Math.max(0, Math.min(trackWidth, ratio * trackWidth));
  }, [year, trackWidth]);

  // Off / collapsed state
  if (year === null) {
    return (
      <TouchableOpacity
        style={styles.offPill}
        onPress={() => { tapLight(); onYearChange(0); }}
        accessibilityRole="button"
        accessibilityLabel="Activate Time Machine timeline filter"
      >
        <Ionicons name="time-outline" size={16} color={COLORS.forestDark} />
        <Text style={styles.offPillText}>Time Machine</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.year}>{formatYear(year)}</Text>
          {activePeriod && (
            <View style={[styles.periodPill, { backgroundColor: PERIOD_COLORS[activePeriod] }]}>
              <Text style={styles.periodPillText}>
                {PERIOD_LABELS[activePeriod]}
                {countsByPeriod?.[activePeriod] ? `  ·  ${countsByPeriod[activePeriod]} sites` : ''}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => { tapLight(); onYearChange(null); }}
          accessibilityRole="button"
          accessibilityLabel="Turn off Time Machine"
          hitSlop={10}
          style={styles.closeBtn}
        >
          <Ionicons name="close" size={18} color={COLORS.parchment} />
        </TouchableOpacity>
      </View>

      <View style={styles.trackOuter} onLayout={onTrackLayout} {...pan.panHandlers}>
        <View style={styles.track}>
          {PERIOD_ORDER.map((p) => {
            const r = PERIOD_YEARS[p];
            const left = ((r.start - TIMELINE_MIN_YEAR) / TOTAL_YEARS) * 100;
            const widthPct = ((r.end - r.start) / TOTAL_YEARS) * 100;
            return (
              <View
                key={p}
                style={[
                  styles.segment,
                  {
                    left: `${left}%`,
                    width: `${widthPct}%`,
                    backgroundColor: PERIOD_COLORS[p],
                    opacity: activePeriod === p ? 1 : 0.45,
                  },
                ]}
              />
            );
          })}
          {trackWidth > 0 && (
            <View style={[styles.thumb, { left: thumbX - THUMB_SIZE / 2 }]} pointerEvents="none">
              <View style={styles.thumbInner} />
            </View>
          )}
        </View>
        <View style={styles.scaleRow}>
          <Text style={styles.scaleText}>8000 BC</Text>
          <Text style={styles.scaleText}>1 AD</Text>
          <Text style={styles.scaleText}>1900</Text>
        </View>
      </View>
    </View>
  );
}

const THUMB_SIZE = 20;
const TRACK_HEIGHT = 12;

const styles = StyleSheet.create({
  offPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADII.full,
    backgroundColor: COLORS.gold,
    alignSelf: 'flex-start',
    ...SHADOWS.card,
  },
  offPillText: { color: COLORS.forestDark, fontWeight: '800', fontSize: FONTS.sizes.sm },

  wrap: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    ...SHADOWS.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' },
  year: { color: COLORS.parchment, fontWeight: '800', fontSize: FONTS.sizes.lg },
  periodPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADII.full },
  periodPillText: { color: '#fff', fontWeight: '700', fontSize: FONTS.sizes.xs },
  closeBtn: { padding: 4 },

  trackOuter: { paddingVertical: 12 },
  track: {
    position: 'relative',
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    backgroundColor: COLORS.forestDark,
    overflow: 'visible',
  },
  segment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    height: TRACK_HEIGHT,
  },
  thumb: {
    position: 'absolute',
    top: -((THUMB_SIZE - TRACK_HEIGHT) / 2),
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: COLORS.parchment,
    borderWidth: 2,
    borderColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.card,
  },
  thumbInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.gold,
  },
  scaleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  scaleText: { color: COLORS.stoneLight, fontSize: 10, fontWeight: '600' },
});
