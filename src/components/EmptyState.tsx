// src/components/EmptyState.tsx
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, RADII } from '@/utils/theme';

interface Props {
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  body?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon = 'leaf-outline', title, body, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container} accessibilityRole="text" accessibilityLabel={`${title}. ${body ?? ''}`}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={36} color={COLORS.forestDark} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={styles.button}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: RADII.full,
    backgroundColor: COLORS.parchment,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.parchment,
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: FONTS.sizes.md,
    color: COLORS.parchment,
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADII.full,
    backgroundColor: COLORS.gold,
  },
  buttonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.forestDark,
  },
});
