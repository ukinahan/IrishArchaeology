// src/components/ConsentDialog.tsx
// Modal shown on first launch to collect GDPR-style consent for analytics
// and crash reporting. Blocking by design \u2014 the user must choose before
// the app proceeds, but they can change their mind any time from Settings.
import { useCallback } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useConsentStore } from '@/store/useConsentStore';
import { COLORS, FONTS, RADII, SHADOWS } from '@/utils/theme';

const PRIVACY_URL = 'https://ukinahan.github.io/IrishArchaeology/privacy.html';

export function ConsentDialog() {
  const needsPrompt = useConsentStore((s) => s.needsPrompt());
  const setAll = useConsentStore((s) => s.setAll);
  const hydrated = useConsentStore((s) => s.hydrated);

  const onAccept = useCallback(() => { void setAll('granted'); }, [setAll]);
  const onDecline = useCallback(() => { void setAll('denied'); }, [setAll]);

  if (!hydrated || !needsPrompt) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="shield-checkmark" size={28} color={COLORS.gold} />
            <Text style={styles.title}>Your privacy</Text>
          </View>
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.lead}>
              Evin Cairn is built in Ireland and respects your data. We never sell it
              and never identify you personally.
            </Text>
            <Text style={styles.section}>What we'd like to collect</Text>
            <Bullet>Anonymous usage events (which screens you open, which features you use) so we can improve the app.</Bullet>
            <Bullet>Crash and error reports if the app misbehaves.</Bullet>
            <Text style={styles.section}>What we never collect</Text>
            <Bullet>Your name, email or contacts.</Bullet>
            <Bullet>Your precise location (location is used on-device only and is never transmitted).</Bullet>
            <Bullet>Any photos or files on your device.</Bullet>
            <TouchableOpacity onPress={() => Linking.openURL(PRIVACY_URL).catch(() => {})}>
              <Text style={styles.link}>Read the full privacy policy</Text>
            </TouchableOpacity>
            <Text style={styles.footnote}>
              You can change your mind any time in Settings.
            </Text>
          </ScrollView>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnSecondary]}
              onPress={onDecline}
              accessibilityRole="button"
              accessibilityLabel="Decline analytics and crash reporting"
            >
              <Text style={styles.btnSecondaryText}>No thanks</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={onAccept}
              accessibilityRole="button"
              accessibilityLabel="Accept analytics and crash reporting"
            >
              <Text style={styles.btnPrimaryText}>Accept all</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADII.lg,
    borderWidth: 1,
    borderColor: COLORS.forestLight,
    maxHeight: '85%',
    ...SHADOWS.card,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { color: COLORS.parchment, fontSize: FONTS.sizes.xl, fontWeight: '800' },
  body: { paddingHorizontal: 20 },
  lead: { color: COLORS.parchment, fontSize: FONTS.sizes.md, lineHeight: 22, marginBottom: 12 },
  section: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.sm,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginTop: 12,
    marginBottom: 6,
  },
  bulletRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  bulletDot: { color: COLORS.gold, fontSize: FONTS.sizes.md, lineHeight: 20 },
  bulletText: { color: COLORS.stoneLight, fontSize: FONTS.sizes.sm, lineHeight: 20, flex: 1 },
  link: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.sm,
    fontWeight: '700',
    marginTop: 14,
    textDecorationLine: 'underline',
  },
  footnote: {
    color: COLORS.stoneLight,
    fontSize: FONTS.sizes.xs,
    marginTop: 12,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.forestLight,
  },
  btn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: RADII.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnPrimary: { backgroundColor: COLORS.gold },
  btnPrimaryText: { color: COLORS.forestDark, fontSize: FONTS.sizes.md, fontWeight: '800' },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.forestLight },
  btnSecondaryText: { color: COLORS.parchment, fontSize: FONTS.sizes.md, fontWeight: '700' },
});
