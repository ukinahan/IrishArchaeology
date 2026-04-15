// src/components/TimelineBar.tsx
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS } from '../utils/theme';

interface Props {
  start: number; // year, negative = BC
  end: number;
}

function formatYear(y: number): string {
  if (y < 0) return `${Math.abs(y)} BC`;
  if (y === 0) return 'AD 1';
  return `AD ${y}`;
}

function yearLabel(y: number): string {
  const abs = Math.abs(y);
  if (abs >= 1000) return `${(abs / 1000).toFixed(1).replace('.0', '')}K ${y < 0 ? 'BC' : 'AD'}`;
  return formatYear(y);
}

// Timeline spans 4000 BC to present (2026)
const TIMELINE_START = -4000;
const TIMELINE_END = 2026;
const TIMELINE_RANGE = TIMELINE_END - TIMELINE_START;

export function TimelineBar({ start, end }: Props) {
  const leftPct = ((start - TIMELINE_START) / TIMELINE_RANGE) * 100;
  const widthPct = ((end - start) / TIMELINE_RANGE) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.track}>
        {/* Tick marks */}
        {[-3000, -2000, -1000, 0, 500, 1000, 1500, 2000].map((tick) => (
          <View
            key={tick}
            style={[styles.tick, { left: `${((tick - TIMELINE_START) / TIMELINE_RANGE) * 100}%` }]}
          />
        ))}
        <View
          style={[
            styles.fill,
            { left: `${leftPct}%`, width: `${Math.max(widthPct, 1.5)}%` },
          ]}
        />
      </View>
      <View style={styles.labels}>
        <Text style={styles.labelText}>4000 BC</Text>
        <Text style={styles.labelText}>Today</Text>
      </View>
      <Text style={styles.range}>
        {yearLabel(start)} – {yearLabel(end)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  track: {
    height: 8,
    backgroundColor: COLORS.forestLight,
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  tick: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: COLORS.forestDark + '66',
  },
  fill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.gold,
    borderRadius: 4,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: { fontSize: 10, color: COLORS.textLight },
  range: { fontSize: FONTS.sizes.sm, color: COLORS.goldLight, fontWeight: '600' },
});
