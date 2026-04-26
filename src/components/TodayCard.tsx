// src/components/TodayCard.tsx
// Small "On this day" card surfaced on the welcome screen. Renders today's
// entry from src/data/todayInHistory if there is one, otherwise the next
// upcoming entry within 30 days, otherwise nothing.
import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS, FONTS, RADII } from '../utils/theme';
import { getTodayEntry, getUpcomingEntry } from '../data/todayInHistory';

export function TodayCard() {
  const today = getTodayEntry();
  const upcoming = today ? null : getUpcomingEntry();
  const entry = today ?? upcoming;
  if (!entry) return null;

  const yearText = entry.yearLabel ?? (entry.year < 0 ? `${Math.abs(entry.year)} BC` : `AD ${entry.year}`);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="time-outline" size={14} color={COLORS.gold} />
        <Text style={styles.label}>{today ? 'On this day' : 'Coming up'}</Text>
        <Text style={styles.year}>{yearText}</Text>
      </View>
      <Text style={styles.title}>{entry.title}</Text>
      <Text style={styles.blurb}>{entry.blurb}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    padding: 14,
    gap: 4,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  label: {
    flex: 1,
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  year: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.stoneLight,
  },
  title: {
    fontSize: FONTS.sizes.md,
    fontWeight: '800',
    color: COLORS.parchment,
  },
  blurb: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.stoneLight,
    lineHeight: 19,
  },
});
