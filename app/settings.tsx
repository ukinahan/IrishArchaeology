// app/settings.tsx
// Privacy + about screen. Reachable from a gear icon in the welcome screen
// and from the saved-tab header. Lets users change their consent choices
// and view the app version / privacy policy.
import { ScrollView, View, Text, StyleSheet, TouchableOpacity, Switch, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useConsentStore } from '@/store/useConsentStore';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';
import { tapLight } from '@/utils/haptics';

const PRIVACY_URL = 'https://ukinahan.github.io/IrishArchaeology/privacy.html';

export default function SettingsScreen() {
  const router = useRouter();
  const analytics = useConsentStore((s) => s.analytics);
  const crash = useConsentStore((s) => s.crash);
  const setAnalytics = useConsentStore((s) => s.setAnalytics);
  const setCrash = useConsentStore((s) => s.setCrash);

  const version = Constants.expoConfig?.version ?? 'dev';
  const buildNumber = (Constants.expoConfig?.ios as any)?.buildNumber ?? '—';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
          <Ionicons name="chevron-back" size={26} color={COLORS.parchment} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.sectionLabel}>Privacy</Text>
        <View style={styles.card}>
          <Row
            title="Anonymous usage analytics"
            sub="Help us see which features people use, so we can improve them. No personal data."
            value={analytics === 'granted'}
            onChange={(v) => { tapLight(); setAnalytics(v ? 'granted' : 'denied'); }}
          />
          <Separator />
          <Row
            title="Crash & error reports"
            sub="Send a stack trace if the app crashes so we can fix it."
            value={crash === 'granted'}
            onChange={(v) => { tapLight(); setCrash(v ? 'granted' : 'denied'); }}
          />
        </View>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}
          accessibilityRole="link"
        >
          <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.gold} />
          <Text style={styles.linkText}>Read our privacy policy</Text>
          <Ionicons name="open-outline" size={16} color={COLORS.stoneLight} />
        </TouchableOpacity>

        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.card}>
          <InfoRow label="App" value="Evin Cairn — Irish Archaeology" />
          <Separator />
          <InfoRow label="Version" value={`${version} (${buildNumber})`} />
          <Separator />
          <InfoRow label="Data" value="National Monuments Service ArcGIS" />
        </View>

        <TouchableOpacity
          style={styles.linkRow}
          onPress={() => {
            Alert.alert(
              'Reset onboarding',
              'Show the privacy prompt again on next launch?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Reset',
                  style: 'destructive',
                  onPress: () => {
                    // Setting both back to 'unset' isn't exposed; achieve by
                    // setting one to denied/granted then both will gate again
                    // only if version bumps — for true reset users can
                    // reinstall. We instead force the prompt by clearing
                    // local consent via direct state mutation.
                    const s = useConsentStore.getState();
                    (useConsentStore as any).setState({
                      analytics: 'unset',
                      crash: 'unset',
                      acceptedAt: null,
                    });
                    // Fire-and-forget to overwrite storage too
                    s.setAll('denied').catch(() => {});
                  },
                },
              ],
            );
          }}
        >
          <Ionicons name="refresh-outline" size={18} color={COLORS.stoneLight} />
          <Text style={styles.linkTextMuted}>Reset privacy choices</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          Made in Ireland · Built on the National Monuments Service open data.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ title, sub, value, onChange }: { title: string; sub: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: COLORS.forestLight, true: COLORS.gold }}
        thumbColor={COLORS.parchment}
      />
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.forestDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  headerTitle: { color: COLORS.parchment, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  body: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  sectionLabel: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    overflow: 'hidden',
    ...SHADOWS.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowTitle: { color: COLORS.parchment, fontSize: FONTS.sizes.md, fontWeight: '700' },
  rowSub: { color: COLORS.stoneLight, fontSize: FONTS.sizes.xs, marginTop: 4, lineHeight: 17 },
  separator: { height: 1, backgroundColor: COLORS.forestLight, marginLeft: 16 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoLabel: { color: COLORS.stoneLight, fontSize: FONTS.sizes.sm },
  infoValue: { color: COLORS.parchment, fontSize: FONTS.sizes.sm, fontWeight: '700', maxWidth: '60%', textAlign: 'right' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.md,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
  },
  linkText: { color: COLORS.parchment, fontSize: FONTS.sizes.sm, fontWeight: '700', flex: 1 },
  linkTextMuted: { color: COLORS.stoneLight, fontSize: FONTS.sizes.sm, fontWeight: '600', flex: 1 },
  footer: {
    color: COLORS.stoneLight,
    fontSize: FONTS.sizes.xs,
    textAlign: 'center',
    marginTop: 24,
    paddingHorizontal: 24,
    lineHeight: 18,
  },
});
