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
  };

  return expo;
};
