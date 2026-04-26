// app/(tabs)/stories.tsx  —  Stories screen
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useContentStore } from '@/store/useContentStore';
import { RemoteStory } from '@/data/content';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';
import { EmptyState } from '@/components/EmptyState';
import { t } from '@/utils/i18n';

export default function StoriesScreen() {
  const router = useRouter();
  const stories = useContentStore((s) => s.stories);

  const renderItem: ListRenderItem<RemoteStory> = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/story/${item.id}`)}
      accessibilityLabel={`Read story: ${item.title}`}
    >
      <View style={styles.cardTop}>
        <Text style={styles.emoji}>{item.imageEmoji}</Text>
        <View style={styles.meta}>
          <Text style={styles.period}>{item.period}</Text>
          <View style={styles.readTimeRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.stoneLight} />
            <Text style={styles.readTime}>{item.readTimeMinutes} min read</Text>
          </View>
        </View>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.hook} numberOfLines={2}>{item.hook}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.readMore}>Read story</Text>
        <Ionicons name="arrow-forward" size={14} color={COLORS.gold} />
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stories</Text>
        <Text style={styles.headerSub}>Ireland's deep past, in plain English</Text>
      </View>
      {stories.length === 0 ? (
        <EmptyState
          icon="book-outline"
          title={t('empty.stories.title')}
          body={t('empty.stories.body')}
        />
      ) : (
        <FlatList
          data={stories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.forestDark },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.parchment },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.stoneLight, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    gap: 8,
    ...SHADOWS.card,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  emoji: { fontSize: 36 },
  meta: { gap: 3 },
  period: { fontSize: FONTS.sizes.xs, color: COLORS.gold, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  readTimeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  readTime: { fontSize: FONTS.sizes.xs, color: COLORS.stoneLight },
  title: { fontSize: FONTS.sizes.lg, fontWeight: '800', color: COLORS.parchment, lineHeight: 24 },
  hook: { fontSize: FONTS.sizes.sm, color: COLORS.stoneLight, lineHeight: 20 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  readMore: { fontSize: FONTS.sizes.sm, fontWeight: '700', color: COLORS.gold },
});
