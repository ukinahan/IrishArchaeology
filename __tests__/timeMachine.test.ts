import { periodAtYear, formatYear } from '../src/components/TimeMachineSlider';

describe('TimeMachineSlider helpers', () => {
  test('periodAtYear maps Newgrange era to stone_age', () => {
    expect(periodAtYear(-3200)).toBe('stone_age');
  });
  test('periodAtYear maps Iron Age cliff fort era to iron_age', () => {
    expect(periodAtYear(-100)).toBe('iron_age');
  });
  test('periodAtYear maps Norman invasion era to medieval', () => {
    expect(periodAtYear(1200)).toBe('medieval');
  });
  test('periodAtYear handles boundaries', () => {
    expect(periodAtYear(-2500)).toBe('bronze_age');
    expect(periodAtYear(400)).toBe('early_christian');
  });
  test('formatYear formats BC and AD correctly', () => {
    expect(formatYear(-3200)).toBe('3,200 BC');
    expect(formatYear(800)).toBe('AD 800');
    expect(formatYear(1170)).toBe('1170');
  });
});
