// app/(tabs)/explore.tsx  —  "What Am I Looking At?" screen
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useRef, useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocation } from '@/hooks/useLocation';
import { useSiteStore } from '@/store/useSiteStore';
import { inferFromLocation, Inference } from '@/utils/inference';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';

export default function ExploreScreen() {
  const router = useRouter();
  const { lat, lng, heading, loading: locLoading, error: locError, refresh } = useLocation();
  const { allSites, loadSitesNear, initFromCache } = useSiteStore();
  const [inference, setInference] = useState<Inference | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => { initFromCache(); }, []);

  const startPulse = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.92, duration: 150, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  };

  const handleAnalyze = async () => {
    if (!lat || !lng) {
      refresh();
      return;
    }
    startPulse();
    setAnalyzing(true);
    setInference(null);
    // Fetch nearby sites from the NMS API before inferring
    await loadSitesNear(lat, lng, 5);
    const currentSites = useSiteStore.getState().allSites;
    const result = inferFromLocation(lat, lng, currentSites, heading);
    setInference(result);
    setAnalyzing(false);
  };

  const CONFIDENCE_CONFIG = {
    high: { color: COLORS.accessible, label: 'High confidence', icon: 'checkmark-circle' as const },
    moderate: { color: COLORS.caution, label: 'Moderate confidence', icon: 'help-circle' as const },
    low: { color: COLORS.stoneLight, label: 'Based on site density', icon: 'information-circle' as const },
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={styles.title}>What Am I{'\n'}Looking At?</Text>
        <Text style={styles.subtitle}>
          Point your phone at a mound, bank, or ruin. We'll tell you what it might be.
        </Text>

        {/* Main CTA button */}
        <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: pulseAnim }] }]}>
          <TouchableOpacity
            style={[styles.analyzeBtn, analyzing && styles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={analyzing}
            accessibilityLabel="Analyse what's nearby"
            accessibilityRole="button"
          >
            {analyzing ? (
              <>
                <ActivityIndicator color={COLORS.forestDark} size="large" />
                <Text style={styles.analyzeBtnText}>Reading the landscape…</Text>
              </>
            ) : (
              <>
                <Ionicons name="eye" size={40} color={COLORS.forestDark} />
                <Text style={styles.analyzeBtnText}>What am I looking at?</Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Location context */}
        {locLoading && (
          <View style={styles.locRow}>
            <ActivityIndicator color={COLORS.stoneLight} size="small" />
            <Text style={styles.locText}>Getting your location…</Text>
          </View>
        )}
        {locError && (
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={14} color={COLORS.stoneLight} />
            <Text style={styles.locText}>{locError}</Text>
          </View>
        )}
        {lat && lng && !locLoading && (
          <View style={styles.locRow}>
            <Ionicons name="location" size={14} color={COLORS.accessible} />
            <Text style={styles.locText}>
              Location active
              {heading != null ? ` · Heading ${Math.round(heading)}°` : ''}
            </Text>
          </View>
        )}

        {/* Inference result */}
        {inference && (
          <View style={styles.resultCard}>
            {/* Confidence badge */}
            <View
              style={[
                styles.confidenceBadge,
                { borderColor: CONFIDENCE_CONFIG[inference.confidence].color },
              ]}
            >
              <Ionicons
                name={CONFIDENCE_CONFIG[inference.confidence].icon}
                size={13}
                color={CONFIDENCE_CONFIG[inference.confidence].color}
              />
              <Text
                style={[
                  styles.confidenceText,
                  { color: CONFIDENCE_CONFIG[inference.confidence].color },
                ]}
              >
                {CONFIDENCE_CONFIG[inference.confidence].label}
              </Text>
            </View>

            <Text style={styles.resultHeadline}>{inference.headline}</Text>
            <Text style={styles.resultDetail}>{inference.detail}</Text>

            {inference.site && (
              <TouchableOpacity
                style={styles.goToSiteBtn}
                onPress={() => router.push(`/site/${inference.site!.id}`)}
                accessibilityLabel={`View full details for ${inference.site.name}`}
              >
                <Text style={styles.goToSiteBtnText}>View full details</Text>
                <Ionicons name="arrow-forward" size={16} color={COLORS.forestDark} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Explainer */}
        {!inference && !analyzing && (
          <View style={styles.explainer}>
            <Text style={styles.explainerTitle}>How it works</Text>
            <ExplainerRow
              icon="locate"
              text="Uses your GPS coordinates to find known sites within range."
            />
            <ExplainerRow
              icon="compass"
              text="If compass data is available, factors in your heading."
            />
            <ExplainerRow
              icon="library"
              text="Matches against curated County Meath sites and general Irish site density patterns."
            />
            <View style={styles.note}>
              <Text style={styles.noteText}>
                This feature gives probabilities, not certainties. Always verify with the National
                Monuments Service.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function ExplainerRow({ icon, text }: { icon: React.ComponentProps<typeof Ionicons>['name']; text: string }) {
  return (
    <View style={exStyles.row}>
      <Ionicons name={icon} size={16} color={COLORS.gold} />
      <Text style={exStyles.text}>{text}</Text>
    </View>
  );
}

const exStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 10, alignItems: 'flex-start' },
  text: { flex: 1, fontSize: FONTS.sizes.sm, color: COLORS.stoneLight, lineHeight: 20 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.forestDark },
  content: { padding: 24, gap: 20 },
  title: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '800',
    color: COLORS.parchment,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.stoneLight,
    lineHeight: 22,
  },
  buttonWrapper: { alignItems: 'center' },
  analyzeBtn: {
    width: 200,
    height: 200,
    borderRadius: RADII.full,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    ...SHADOWS.card,
  },
  analyzeBtnDisabled: { backgroundColor: COLORS.stone },
  analyzeBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.forestDark,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  locText: { fontSize: FONTS.sizes.xs, color: COLORS.stoneLight },
  resultCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    ...SHADOWS.card,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADII.full,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  confidenceText: { fontSize: FONTS.sizes.xs, fontWeight: '700' },
  resultHeadline: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '800',
    color: COLORS.parchment,
    lineHeight: 26,
  },
  resultDetail: {
    fontSize: FONTS.sizes.md,
    color: COLORS.stoneLight,
    lineHeight: 22,
  },
  goToSiteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.gold,
    borderRadius: RADII.full,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  goToSiteBtnText: { fontWeight: '700', color: COLORS.forestDark, fontSize: FONTS.sizes.md },
  explainer: { gap: 4 },
  explainerTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    color: COLORS.stoneLight,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  note: {
    marginTop: 8,
    padding: 12,
    backgroundColor: COLORS.bgCardAlt,
    borderRadius: RADII.sm,
    borderLeftWidth: 2,
    borderLeftColor: COLORS.caution,
  },
  noteText: { fontSize: FONTS.sizes.xs, color: COLORS.stoneLight, lineHeight: 18 },
});
