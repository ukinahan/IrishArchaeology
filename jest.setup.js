// jest.setup.js
// Silence noisy logs and stub native modules used by the offline cache.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

global.fetch = jest.fn();
