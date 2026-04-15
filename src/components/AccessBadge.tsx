// src/components/AccessBadge.tsx
import { View, Text, StyleSheet } from 'react-native';
import { AccessStatus } from '../data/sites';
import { COLORS, FONTS, RADII } from '../utils/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  status: AccessStatus;
  note: string;
  isMonument?: boolean;
}

const STATUS_CONFIG: Record<
  AccessStatus,
  { label: string; color: string; icon: React.ComponentProps<typeof Ionicons>['name'] }
> = {
  accessible: { label: 'Accessible', color: COLORS.accessible, icon: 'checkmark-circle' },
  restricted: { label: 'Restricted access', color: COLORS.caution, icon: 'warning' },
  protected: { label: 'Protected monument', color: COLORS.protected, icon: 'shield' },
  private: { label: 'Private land', color: COLORS.caution, icon: 'eye-off' },
};

export function AccessBadge({ status, note, isMonument }: Props) {
  const config = STATUS_CONFIG[status];

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor: config.color + '22', borderColor: config.color }]}>
        <Ionicons name={config.icon} size={13} color={config.color} />
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
      </View>
      {isMonument && (
        <View style={[styles.badge, { backgroundColor: COLORS.protected + '22', borderColor: COLORS.protected }]}>
          <Ionicons name="shield-checkmark" size={13} color={COLORS.protected} />
          <Text style={[styles.label, { color: COLORS.protected }]}>Protected monument</Text>
        </View>
      )}
      <Text style={styles.note}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADII.full,
    borderWidth: 1,
    gap: 5,
  },
  label: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  note: { fontSize: FONTS.sizes.sm, color: COLORS.stoneLight, lineHeight: 18 },
});
