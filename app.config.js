// Dynamic Expo config wrapper.
// Reads app.json then injects the @rnmapbox/maps plugin with the secret
// download token from the EAS-provided env var (kept out of source control).
const base = require('./app.json');

module.exports = ({ config }) => {
  const expo = { ...base.expo };
  const plugins = [...(expo.plugins || [])];

  plugins.push([
    '@rnmapbox/maps',
    {
      RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOAD_TOKEN || '',
    },
  ]);

  expo.plugins = plugins;

  // Make the public token available to the runtime via Constants.expoConfig.extra
  expo.extra = {
    ...(expo.extra || {}),
    MAPBOX_PUBLIC_TOKEN:
      process.env.MAPBOX_PUBLIC_TOKEN ||
      expo.extra?.MAPBOX_ACCESS_TOKEN ||
      '',
    SENTRY_DSN: process.env.SENTRY_DSN || expo.extra?.SENTRY_DSN || '',
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY || expo.extra?.POSTHOG_API_KEY || '',
    POSTHOG_HOST: process.env.POSTHOG_HOST || expo.extra?.POSTHOG_HOST || 'https://us.i.posthog.com',
    CONTENT_BASE_URL:
      process.env.CONTENT_BASE_URL ||
      expo.extra?.CONTENT_BASE_URL ||
      'https://ukinahan.github.io/IrishArchaeology',
  };

  return expo;
};
