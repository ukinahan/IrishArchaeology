// src/components/SiteMarker.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArchSite, PERIOD_COLORS, PERIOD_ICONS } from '../data/sites';
import { RADII, SHADOWS } from '../utils/theme';

interface Props {
  site: ArchSite;
  onPress: () => void;
}

export function SiteMarker({ site, onPress }: Props) {
  const color = PERIOD_COLORS[site.period];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.wrapper}
      accessibilityLabel={`${site.name}, ${site.type}`}
    >
      <View style={[styles.pin, { backgroundColor: color, borderColor: color + 'aa' }, SHADOWS.button]}>
        <Text style={styles.icon}>{PERIOD_ICONS[site.period]}</Text>
      </View>
      <View style={[styles.tail, { borderTopColor: color }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  pin: {
    width: 36,
    height: 36,
    borderRadius: RADII.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  icon: { fontSize: 18 },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
