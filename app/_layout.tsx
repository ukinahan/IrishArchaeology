import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initTelemetry, track } from '@/utils/telemetry';
import { useContentStore } from '@/store/useContentStore';

export default function RootLayout() {
  useEffect(() => {
    initTelemetry();
    track('app_open');
    // Kick off remote content load (stories + site enrichments). Non-blocking.
    useContentStore.getState().init().catch(() => {});
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="light" />
      <ErrorBoundary>
        <Stack screenOptions={{ headerShown: false }} />
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
