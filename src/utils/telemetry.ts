// src/utils/telemetry.ts
// Lightweight telemetry facade. Keeps Sentry / PostHog vendor SDKs optional
// so the app builds and runs even before secrets are wired up. When the
// corresponding env-fed config is present we lazily import and forward.
//
// Wire-up:
//   1) `npm install @sentry/react-native posthog-react-native` (deferred —
//      see docs/sprint-1.md). Until installed, all calls are no-ops.
//   2) Provide DSN / API key via app.config.js -> extra.SENTRY_DSN /
//      extra.POSTHOG_API_KEY.
import Constants from 'expo-constants';

type EventProps = Record<string, string | number | boolean | null | undefined>;

let sentry: any = null;
let posthog: any = null;
let initialised = false;

function getExtra(): Record<string, any> {
  return ((Constants.expoConfig?.extra as any) ?? {}) as Record<string, any>;
}

export function initTelemetry(): void {
  if (initialised) return;
  initialised = true;

  const extra = getExtra();
  const sentryDsn: string | undefined = extra.SENTRY_DSN;
  const posthogKey: string | undefined = extra.POSTHOG_API_KEY;
  const posthogHost: string = extra.POSTHOG_HOST ?? 'https://eu.i.posthog.com';

  if (sentryDsn) {
    try {
      // Dynamic require so the bundle doesn't blow up if the package isn't
      // installed yet.
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Sentry = require('@sentry/react-native');
      Sentry.init({
        dsn: sentryDsn,
        tracesSampleRate: 0.2,
        enableAutoSessionTracking: true,
      });
      sentry = Sentry;
    } catch {
      // Package not installed yet — ignore.
    }
  }

  if (posthogKey) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PostHog } = require('posthog-react-native');
      posthog = new PostHog(posthogKey, { host: posthogHost });
    } catch {
      // Package not installed yet — ignore.
    }
  }
}

export function reportError(err: unknown, context?: EventProps): void {
  // Always log to console so dev builds keep visibility.
  // eslint-disable-next-line no-console
  console.error('[telemetry]', err, context);
  if (sentry?.captureException) {
    try {
      sentry.captureException(err, context ? { extra: context } : undefined);
    } catch {
      /* ignore */
    }
  }
}

export function track(event: string, props?: EventProps): void {
  if (posthog?.capture) {
    try {
      posthog.capture(event, props);
    } catch {
      /* ignore */
    }
  }
  if (__DEV__) {
    // eslint-disable-next-line no-console
    console.log('[event]', event, props ?? {});
  }
}

export function identify(userId: string, traits?: EventProps): void {
  if (posthog?.identify) {
    try {
      posthog.identify(userId, traits);
    } catch {
      /* ignore */
    }
  }
  if (sentry?.setUser) {
    try {
      sentry.setUser({ id: userId, ...(traits as any) });
    } catch {
      /* ignore */
    }
  }
}
