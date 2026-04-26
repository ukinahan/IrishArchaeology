// __tests__/todayInHistory.test.ts
import { getTodayEntry, getUpcomingEntry } from '../src/data/todayInHistory';

describe('todayInHistory', () => {
  it('returns the matching entry for a known date', () => {
    const stPatricks = new Date(2026, 2, 17); // March 17 (month is 0-indexed)
    const entry = getTodayEntry(stPatricks);
    expect(entry?.title).toMatch(/St Patrick/);
  });

  it('returns null for an unmatched date', () => {
    const random = new Date(2026, 1, 4); // Feb 4
    expect(getTodayEntry(random)).toBeNull();
  });

  it('returns an upcoming entry within 30 days when nothing matches today', () => {
    // Feb 26 → Mar 17 (St Patrick's) is 19 days away.
    const date = new Date(2026, 1, 26);
    const upcoming = getUpcomingEntry(date);
    expect(upcoming?.title).toMatch(/St Patrick/);
  });
});
