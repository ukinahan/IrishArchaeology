// jest.setup.js
// Silence noisy logs and stub native modules used by the offline cache.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  wrap: (c) => c,
  captureException: jest.fn(),
  setUser: jest.fn(),
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

global.fetch = jest.fn();
