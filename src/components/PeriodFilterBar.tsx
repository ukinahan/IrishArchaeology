// src/components/PeriodFilterBar.tsx
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Period, PERIOD_ICONS, PERIOD_LABELS } from '../data/sites';
import { COLORS, FONTS, RADII } from '../utils/theme';

const PERIODS: Period[] = [
  'stone_age',
  'bronze_age',
  'iron_age',
  'early_christian',
  'early_medieval',
  'medieval',
  'post_medieval',
];

interface Props {
  active: Period | null;
  onChange: (period: Period | null) => void;
}

export function PeriodFilterBar({ active, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      style={styles.scroll}
    >
      <TouchableOpacity
        style={[styles.chip, active === null && styles.chipActive]}
        onPress={() => onChange(null)}
        accessibilityLabel="Show all periods"
      >
        <Text style={[styles.chipText, active === null && styles.chipTextActive]}>All</Text>
      </TouchableOpacity>
      {PERIODS.map((p) => (
        <TouchableOpacity
          key={p}
          style={[styles.chip, active === p && styles.chipActive]}
          onPress={() => onChange(active === p ? null : p)}
          accessibilityLabel={`Filter by ${PERIOD_LABELS[p]}`}
        >
          <Text style={styles.icon}>{PERIOD_ICONS[p]}</Text>
          <Text style={[styles.chipText, active === p && styles.chipTextActive]}>
            {PERIOD_LABELS[p]}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 0 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADII.full,
    backgroundColor: COLORS.forestMid,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
  },
  chipActive: {
    backgroundColor: COLORS.gold,
    borderColor: COLORS.goldLight,
  },
  icon: { fontSize: 14 },
  chipText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    color: COLORS.stoneLight,
  },
  chipTextActive: { color: COLORS.forestDark },
});
