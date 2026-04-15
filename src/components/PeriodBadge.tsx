// src/components/PeriodBadge.tsx
import { View, Text, StyleSheet } from 'react-native';
import { Period, PERIOD_COLORS, PERIOD_ICONS, PERIOD_LABELS } from '../data/sites';
import { COLORS, FONTS, RADII } from '../utils/theme';

interface Props {
  period: Period;
  size?: 'sm' | 'md';
}

export function PeriodBadge({ period, size = 'md' }: Props) {
  const color = PERIOD_COLORS[period];
  const icon = PERIOD_ICONS[period];
  const label = PERIOD_LABELS[period];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: color + '33', borderColor: color }, isSmall && styles.small]}>
      <Text style={[styles.icon, isSmall && styles.iconSmall]}>{icon}</Text>
      <Text style={[styles.label, { color }, isSmall && styles.labelSmall]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.full,
    borderWidth: 1,
    gap: 4,
  },
  small: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  icon: { fontSize: 14 },
  iconSmall: { fontSize: 11 },
  label: { fontSize: FONTS.sizes.xs, fontWeight: '700', letterSpacing: 0.3 },
  labelSmall: { fontSize: 9 },
});
