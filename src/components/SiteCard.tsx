// src/components/SiteCard.tsx
// Full-screen site detail card (used in site/[id].tsx)
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { ArchSite } from '../data/sites';
import { COLORS, FONTS, RADII, SHADOWS } from '../utils/theme';
import { PeriodBadge } from './PeriodBadge';
import { TimelineBar } from './TimelineBar';
import { AccessBadge } from './AccessBadge';
import { useSiteStore } from '../store/useSiteStore';

interface Props {
  site: ArchSite;
}

export function SiteCard({ site }: Props) {
  const router = useRouter();
  const isSaved = useSiteStore((s) => s.isSaved(site.id));
  const toggleSaved = useSiteStore((s) => s.toggleSaved);

  const handleShare = async () => {
    await Share.share({
      title: site.name,
      message: `Check out ${site.name} on Ard Seandálaíocht — ${site.whatItIs}\n\nirisharchaeology://site/${site.id}`,
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBtn}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.parchment} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => toggleSaved(site.id)}
            style={styles.headerBtn}
            accessibilityLabel={isSaved ? 'Remove from saved' : 'Save site'}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={22}
              color={isSaved ? COLORS.gold : COLORS.parchment}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerBtn} accessibilityLabel="Share">
            <Ionicons name="share-outline" size={22} color={COLORS.parchment} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Hero area */}
        <View style={styles.hero}>
          <PeriodBadge period={site.period} />
          <Text style={styles.type}>{site.type}</Text>
          <Text style={styles.name}>{site.name}</Text>
          {site.irishName && <Text style={styles.irishName}>{site.irishName}</Text>}
        </View>

        <View style={styles.divider} />

        {/* What it is */}
        <Section label="What it is">
          <Text style={styles.bodyText}>{site.whatItIs}</Text>
        </Section>

        {/* Why it matters */}
        <Section label="Why it matters">
          <Text style={styles.bodyText}>{site.whyItMatters}</Text>
        </Section>

        {/* Timeline */}
        <Section label="When it was used">
          <TimelineBar start={site.whenUsed.start} end={site.whenUsed.end} />
        </Section>

        {/* What to look for */}
        <Section label="What to look for today">
          <View style={styles.lookForBox}>
            <Ionicons name="eye-outline" size={16} color={COLORS.gold} />
            <Text style={styles.lookForText}>{site.whatToLookFor}</Text>
          </View>
        </Section>

        {/* Trust & safety */}
        <Section label="Access & protection">
          <AccessBadge
            status={site.accessStatus}
            note={site.accessNote}
            isMonument={site.isMonument}
          />
          {site.isMonument && (
            <View style={styles.monitorNotice}>
              <Ionicons name="information-circle-outline" size={15} color={COLORS.stoneLight} />
              <Text style={styles.monitorText}>
                Protected under the National Monuments Act. Do not dig, remove material, or damage the site.
              </Text>
            </View>
          )}
        </Section>

        {site.smrRef && (
          <Text style={styles.smrRef}>SMR Ref: {site.smrRef} · {site.county}</Text>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  container: { marginBottom: 24 },
  label: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: COLORS.gold,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.forestDark },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.forestMid,
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerBtn: {
    padding: 8,
    borderRadius: RADII.md,
  },
  scroll: { flex: 1 },
  content: { padding: 24 },
  hero: { gap: 6, marginBottom: 24 },
  type: { fontSize: FONTS.sizes.sm, color: COLORS.stoneLight, fontWeight: '500', marginTop: 8 },
  name: { fontSize: FONTS.sizes.xxxl, fontWeight: '800', color: COLORS.parchment, lineHeight: 36 },
  irishName: { fontSize: FONTS.sizes.lg, color: COLORS.goldLight, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: COLORS.forestLight, marginBottom: 24 },
  bodyText: { fontSize: FONTS.sizes.md, color: COLORS.parchment, lineHeight: 24 },
  lookForBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.md,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.gold,
  },
  lookForText: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.parchment, lineHeight: 22 },
  monitorNotice: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADII.sm,
    padding: 10,
  },
  monitorText: { flex: 1, fontSize: FONTS.sizes.xs, color: COLORS.stoneLight, lineHeight: 18 },
  smrRef: { fontSize: 11, color: COLORS.textLight, marginBottom: 8 },
});
