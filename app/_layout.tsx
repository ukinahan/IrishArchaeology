import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ConsentDialog } from '@/components/ConsentDialog';
import { initTelemetry, track } from '@/utils/telemetry';
import { useContentStore } from '@/store/useContentStore';
import { useConsentStore } from '@/store/useConsentStore';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://17bbe9dc7ab83c9e32decdc4b9bde7a1@o4511287408197632.ingest.de.sentry.io/4511287414095952',

  // Adds more context data to events (IP address, cookies, user, etc.)
  // For more information, visit: https://docs.sentry.io/platforms/react-native/data-management/data-collected/
  sendDefaultPii: true,

  // Enable Logs
  enableLogs: true,

  // uncomment the line below to enable Spotlight (https://spotlightjs.com)
  // spotlight: __DEV__,
});

export default Sentry.wrap(function RootLayout() {
  useEffect(() => {
    initTelemetry();
    // Hydrate consent first so any track() calls below the gate are skipped
    // until the user makes a choice.
    useConsentStore.getState().hydrate().then(() => {
      track('app_open');
    });
    // Kick off remote content load (stories + site enrichments). Non-blocking.
    useContentStore.getState().init().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }} />
        <ConsentDialog />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1 },
});
