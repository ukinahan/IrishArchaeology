import { buildItineraryIcs, buildGoogleDirectionsUrl, formatMins } from '../src/utils/tripExport';
import { TripPlan } from '../src/utils/tripPlanner';

const samplePlan: TripPlan = {
  period: 'all',
  county: 'Meath',
  start: { lat: 53.5, lng: -6.8, label: 'Trim' },
  days: [
    {
      index: 0,
      stops: [
        { site: { id: 'a', name: 'Newgrange', county: 'Meath', lat: 53.694, lng: -6.475, type: 'Passage Tomb' } as any, score: 1 },
        { site: { id: 'b', name: 'Knowth', county: 'Meath', lat: 53.701, lng: -6.491, type: 'Passage Tomb' } as any, score: 1 },
      ],
      totalKm: 25,
      driveMinutes: 30,
      visitMinutes: 120,
    },
  ],
  totalSites: 2,
  totalKm: 25,
  totalDriveMinutes: 30,
  totalVisitMinutes: 120,
};

describe('tripExport', () => {
  test('formatMins handles minutes and hours', () => {
    expect(formatMins(45)).toBe('45 min');
    expect(formatMins(60)).toBe('1 h');
    expect(formatMins(135)).toBe('2 h 15 min');
  });

  test('buildGoogleDirectionsUrl returns a directions URL with origin and destination', () => {
    const url = buildGoogleDirectionsUrl(samplePlan.days[0], samplePlan.start);
    expect(url).toContain('https://www.google.com/maps/dir/');
    expect(url).toContain('travelmode=driving');
    expect(url).toContain('origin=53.5%2C-6.8');
  });

  test('buildItineraryIcs produces a valid VCALENDAR with one VEVENT per day', () => {
    const ics = buildItineraryIcs(samplePlan, { startDate: new Date('2026-06-01') });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('END:VCALENDAR');
    expect(ics).toMatch(/BEGIN:VEVENT[\s\S]*END:VEVENT/);
    expect(ics).toContain('DTSTART;VALUE=DATE:20260601');
    expect(ics).toContain('Newgrange');
  });
});
