// __tests__/inference.test.ts
import { inferFromLocation } from '../src/utils/inference';
import { ArchSite } from '../src/data/sites';

const baseSite = (over: Partial<ArchSite>): ArchSite => ({
  id: 'x',
  name: 'X',
  type: 'Ringfort',
  period: 'early_medieval',
  lat: 53.4,
  lng: -7.0,
  whatItIs: 'A ringfort.',
  accessStatus: 'protected',
  accessNote: '',
  isMonument: true,
  county: 'Meath',
  ...over,
});

describe('inferFromLocation', () => {
  it('returns high confidence within 500m', () => {
    const sites = [baseSite({ id: 'near', lat: 53.4001, lng: -7.0001 })];
    const r = inferFromLocation(53.4, -7.0, sites);
    expect(r.confidence).toBe('high');
    expect(r.site?.id).toBe('near');
  });

  it('returns moderate confidence within 2km', () => {
    const sites = [baseSite({ id: 'mid', lat: 53.41, lng: -7.0 })];
    const r = inferFromLocation(53.4, -7.0, sites);
    expect(r.confidence).toBe('moderate');
  });

  it('falls back to low confidence when far from any site', () => {
    const sites = [baseSite({ id: 'far', lat: 54.5, lng: -8.5 })];
    const r = inferFromLocation(53.4, -7.0, sites);
    expect(r.confidence).toBe('low');
    expect(r.site).toBeNull();
  });

  it('prefers a forward-aligned site when heading is provided', () => {
    // North is 0°. Site to the north (~1.5km) should beat one to the south.
    const north = baseSite({ id: 'north', lat: 53.4135, lng: -7.0 });
    const south = baseSite({ id: 'south', lat: 53.387, lng: -7.0 });
    const r = inferFromLocation(53.4, -7.0, [south, north], 0);
    expect(r.confidence).toBe('moderate');
    expect(r.site?.id).toBe('north');
  });
});
