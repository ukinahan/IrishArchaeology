import AsyncStorage from '@react-native-async-storage/async-storage';
import { useConsentStore, getConsentSnapshot, CONSENT_VERSION } from '../src/store/useConsentStore';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

beforeEach(() => {
  (AsyncStorage.getItem as jest.Mock).mockReset();
  (AsyncStorage.setItem as jest.Mock).mockReset();
  // Reset zustand state
  (useConsentStore as any).setState({
    hydrated: false,
    version: CONSENT_VERSION,
    analytics: 'unset',
    crash: 'unset',
    acceptedAt: null,
  });
});

describe('useConsentStore', () => {
  test('starts unset and reports needsPrompt after hydrate with no stored value', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await useConsentStore.getState().hydrate();
    expect(useConsentStore.getState().analytics).toBe('unset');
    expect(useConsentStore.getState().needsPrompt()).toBe(true);
  });

  test('setAll grants both and persists', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
    await useConsentStore.getState().hydrate();
    await useConsentStore.getState().setAll('granted');
    expect(getConsentSnapshot()).toEqual({ analytics: 'granted', crash: 'granted' });
    expect(AsyncStorage.setItem).toHaveBeenCalled();
    expect(useConsentStore.getState().needsPrompt()).toBe(false);
  });

  test('hydrate restores stored consent of matching version', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ version: CONSENT_VERSION, analytics: 'denied', crash: 'denied', acceptedAt: 'x' }),
    );
    await useConsentStore.getState().hydrate();
    expect(useConsentStore.getState().analytics).toBe('denied');
    expect(useConsentStore.getState().needsPrompt()).toBe(false);
  });

  test('hydrate ignores stored consent of wrong version', async () => {
    (AsyncStorage.getItem as jest.Mock).mockResolvedValue(
      JSON.stringify({ version: 999, analytics: 'granted', crash: 'granted', acceptedAt: 'x' }),
    );
    await useConsentStore.getState().hydrate();
    expect(useConsentStore.getState().analytics).toBe('unset');
    expect(useConsentStore.getState().needsPrompt()).toBe(true);
  });
});
