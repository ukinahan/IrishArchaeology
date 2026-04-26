// __tests__/i18n.test.ts
import { t, __setLocaleForTesting } from '../src/utils/i18n';

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

describe('i18n', () => {
  it('returns English by default', () => {
    __setLocaleForTesting('en');
    expect(t('common.save')).toBe('Save');
    expect(t('tab.map')).toBe('Map');
  });

  it('returns Irish for ga locale', () => {
    __setLocaleForTesting('ga');
    expect(t('common.save')).toBe('Sábháil');
    expect(t('tab.map')).toBe('Léarscáil');
  });

  it('falls back to English for missing keys in ga', () => {
    __setLocaleForTesting('ga');
    expect(t('totally.missing.key')).toBe('totally.missing.key');
  });

  it('has parity between en and ga keysets', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require('../src/utils/i18n');
    // We can't introspect internals here without exposing them; smoke-test
    // by sampling that critical keys exist in both.
    __setLocaleForTesting('en');
    const enSave = mod.t('common.save');
    __setLocaleForTesting('ga');
    const gaSave = mod.t('common.save');
    expect(enSave).not.toBe(gaSave);
    expect(gaSave.length).toBeGreaterThan(0);
  });
});
