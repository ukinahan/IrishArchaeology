// __tests__/contentService.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock expo-constants to set the CDN base URL.
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { CONTENT_BASE_URL: 'https://cdn.example.com' } },
  },
}));

import {
  fetchRemoteManifest,
  getCachedManifest,
} from '../src/services/contentService';

const validManifest = {
  version: 1,
  updatedAt: '2026-04-26T00:00:00Z',
  stories: [],
  enrichments: [],
};

describe('contentService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    (global.fetch as jest.Mock).mockReset();
  });

  it('returns null when no cache exists', async () => {
    expect(await getCachedManifest()).toBeNull();
  });

  it('caches a fetched manifest and serves it back', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => validManifest,
    });
    const fetched = await fetchRemoteManifest();
    expect(fetched?.version).toBe(1);
    const cached = await getCachedManifest();
    expect(cached?.version).toBe(1);
  });

  it('rejects malformed remote payloads', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ stories: 'oops' }),
    });
    expect(await fetchRemoteManifest()).toBeNull();
  });

  it('returns null on non-ok response', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    expect(await fetchRemoteManifest()).toBeNull();
  });
});
