// app/story/[id].tsx  —  Story reader screen
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { STORIES } from '@/data/stories';
import { COLORS, FONTS, RADII } from '@/utils/theme';
import { useSiteStore } from '@/store/useSiteStore';
import { PeriodBadge } from '@/components/PeriodBadge';
import { ArchSite } from '@/data/sites';
import { useRouter as useNav } from 'expo-router';

export default function StoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const story = STORIES.find((s) => s.id === id);
  const allSites = useSiteStore((s) => s.allSites);

  if (!story) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Story not found</Text>
      </View>
    );
  }

  const relatedSites = allSites.filter((s) => story.relatedSiteIds.includes(s.id));

  // Render markdown-like bold text: **bold**
  const renderBody = (text: string) => {
    const paragraphs = text.split('\n\n');
    return paragraphs.map((para, pi) => {
      const parts = para.split(/(\*\*[^*]+\*\*)/g);
      return (
        <Text key={pi} style={styles.para}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <Text key={i} style={styles.bold}>
                  {part.slice(2, -2)}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={COLORS.parchment} />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>Story</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Meta */}
        <Text style={styles.period}>{story.period}</Text>
        <Text style={styles.emoji}>{story.imageEmoji}</Text>
        <Text style={styles.title}>{story.title}</Text>
        <View style={styles.hookRow}>
          <Text style={styles.hook}>{story.hook}</Text>
        </View>
        <View style={styles.readTimeRow}>
          <Ionicons name="time-outline" size={14} color={COLORS.stoneLight} />
          <Text style={styles.readTime}>{story.readTimeMinutes} min read</Text>
        </View>

        <View style={styles.divider} />

        {/* Body */}
        <View style={styles.body}>{renderBody(story.body)}</View>

        {/* Related sites */}
        {relatedSites.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Visit these sites</Text>
            {relatedSites.map((site) => (
              <RelatedSiteRow
                key={site.id}
                site={site}
                onPress={() => router.push(`/site/${site.id}`)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function RelatedSiteRow({ site, onPress }: { site: ArchSite; onPress: () => void }) {
  return (
    <TouchableOpacity style={relStyles.row} onPress={onPress} accessibilityLabel={`View ${site.name}`}>
      <View style={relStyles.left}>
        <PeriodBadge period={site.period} size="sm" />
        <Text style={relStyles.name}>{site.name}</Text>
        <Text style={relStyles.type}>{site.type}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.stoneLight} />
    </TouchableOpacity>
  );
}

const relStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.md,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    gap: 12,
    marginBottom: 10,
  },
  left: { flex: 1, gap: 4 },
  name: { fontSize: FONTS.sizes.md, fontWeight: '700', color: COLORS.parchment },
  type: { fontSize: FONTS.sizes.xs, color: COLORS.stoneLight },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.forestDark },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.forestDark },
  notFoundText: { color: COLORS.stoneLight, fontSize: FONTS.sizes.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.forestMid,
  },
  backBtn: { padding: 8, borderRadius: RADII.md },
  headerLabel: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.stoneLight, textTransform: 'uppercase', letterSpacing: 1 },
  content: { padding: 24, gap: 8 },
  period: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  emoji: { fontSize: 48, marginVertical: 4 },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.parchment,
    lineHeight: 36,
    marginBottom: 4,
  },
  hookRow: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
    paddingLeft: 14,
  },
  hook: {
    fontSize: FONTS.sizes.md,
    color: COLORS.goldLight,
    fontStyle: 'italic',
    lineHeight: 22,
  },
  readTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  readTime: { fontSize: FONTS.sizes.xs, color: COLORS.stoneLight },
  divider: { height: 1, backgroundColor: COLORS.forestLight, marginVertical: 12 },
  body: { gap: 0 },
  para: {
    fontSize: FONTS.sizes.md,
    color: COLORS.parchment,
    lineHeight: 26,
    marginBottom: 16,
  },
  bold: { fontWeight: '800', color: COLORS.goldLight },
  relatedSection: { marginTop: 12 },
  relatedTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.gold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
});
