// __tests__/offlineCache.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheSites, getCachedSites } from '../src/utils/offlineCache';
import { ArchSite } from '../src/data/sites';

const make = (i: number): ArchSite => ({
  id: `s${i}`,
  name: `Site ${i}`,
  type: 'Ringfort',
  period: 'early_medieval',
  lat: 53,
  lng: -7,
  whatItIs: '',
  accessStatus: 'protected',
  accessNote: '',
  isMonument: true,
  county: 'Meath',
});

describe('offlineCache', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('round-trips sites within TTL', async () => {
    const sites = [make(1), make(2)];
    await cacheSites(sites);
    const back = await getCachedSites();
    expect(back).toHaveLength(2);
    expect(back[0].id).toBe('s1');
  });

  it('caps cache size at the upper bound', async () => {
    const sites = Array.from({ length: 9000 }, (_, i) => make(i));
    await cacheSites(sites);
    const back = await getCachedSites();
    expect(back.length).toBeLessThanOrEqual(8000);
    // Tail (most recent) is preserved.
    expect(back[back.length - 1].id).toBe('s8999');
  });

  it('returns empty array when nothing cached', async () => {
    const back = await getCachedSites();
    expect(back).toEqual([]);
  });
});
