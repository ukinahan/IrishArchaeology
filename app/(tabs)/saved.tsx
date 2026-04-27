// app/(tabs)/saved.tsx  —  Saved sites screen
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
import { useSiteStore } from '@/store/useSiteStore';
import { ArchSite, PERIOD_COLORS, PERIOD_ICONS } from '@/data/sites';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';
import { PeriodBadge } from '@/components/PeriodBadge';
import { EmptyState } from '@/components/EmptyState';
import { t } from '@/utils/i18n';
import { tapLight } from '@/utils/haptics';

export default function SavedScreen() {
  const router = useRouter();
  const allSites = useSiteStore((s) => s.allSites);
  const savedSiteIds = useSiteStore((s) => s.savedSiteIds);
  const toggleSaved = useSiteStore((s) => s.toggleSaved);
  const savedSites = allSites.filter((s) => savedSiteIds.has(s.id));

  const renderItem: ListRenderItem<ArchSite> = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/site/${item.id}`)}
      accessibilityLabel={`View ${item.name}`}
    >
      <View
        style={[styles.periodStripe, { backgroundColor: PERIOD_COLORS[item.period] }]}
      />
      <View style={styles.cardContent}>
        <Text style={styles.icon}>{PERIOD_ICONS[item.period]}</Text>
        <View style={styles.textBlock}>
          <PeriodBadge period={item.period} size="sm" />
          <Text style={styles.name}>{item.name}</Text>
          {item.irishName && <Text style={styles.irishName}>{item.irishName}</Text>}
          <Text style={styles.type}>{item.type}</Text>
        </View>
        <TouchableOpacity
          onPress={() => { tapLight(); toggleSaved(item.id); }}
          style={styles.unsaveBtn}
          accessibilityLabel={`${t('a11y.unsave')}: ${item.name}`}
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="bookmark" size={20} color={COLORS.gold} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Saved</Text>
          <Text style={styles.headerSub}>Your personal archaeology near home</Text>
        </View>
        <TouchableOpacity
          onPress={() => { tapLight(); router.push('/settings'); }}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.settingsBtn}
        >
          <Ionicons name="settings-outline" size={22} color={COLORS.parchment} />
        </TouchableOpacity>
      </View>

      {savedSites.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title={t('empty.saved.title')}
          body={t('empty.saved.body')}
        />
      ) : (
        <FlatList
          data={savedSites}
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  settingsBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: '800', color: COLORS.parchment },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.stoneLight, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 12 },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    ...SHADOWS.card,
  },
  periodStripe: { width: 4 },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  icon: { fontSize: 28 },
  textBlock: { flex: 1, gap: 3 },
  name: { fontSize: FONTS.sizes.lg, fontWeight: '700', color: COLORS.parchment },
  irishName: { fontSize: FONTS.sizes.sm, color: COLORS.goldLight, fontStyle: 'italic' },
  type: { fontSize: FONTS.sizes.xs, color: COLORS.stoneLight },
  unsaveBtn: { padding: 4 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: FONTS.sizes.xl, fontWeight: '700', color: COLORS.parchment },
  emptyText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.stoneLight,
    textAlign: 'center',
    lineHeight: 22,
  },
});
