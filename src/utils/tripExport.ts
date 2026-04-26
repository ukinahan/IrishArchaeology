// src/utils/tripExport.ts
// Build a Google Maps "directions" URL for a full day's route, and a
// minimal RFC-5545 .ics file for adding the trip to a phone calendar.
import { TripDay, TripPlan } from './tripPlanner';

/**
 * Google Maps directions URL with origin / destination / waypoints.
 * Works on iOS Safari, Chrome, and the Google Maps app via universal link.
 * Up to 9 waypoints is the documented max for the public API.
 */
export function buildGoogleDirectionsUrl(day: TripDay, planStart?: TripPlan['start']): string | null {
  if (day.stops.length === 0) return null;
  const points = day.stops.map((s) => `${s.site.lat},${s.site.lng}`);
  const origin = planStart && day.index === 0
    ? `${planStart.lat},${planStart.lng}`
    : points[0];
  const destination = points[points.length - 1];
  const waypoints = day.index === 0 && planStart
    ? points.slice(0, -1) // first stop becomes a waypoint when start anchor exists
    : points.slice(1, -1);
  const params = new URLSearchParams({
    api: '1',
    origin,
    destination,
    travelmode: 'driving',
  });
  if (waypoints.length) params.set('waypoints', waypoints.join('|'));
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Build a minimal valid .ics calendar with one VEVENT per day. Each event
 * is an all-day event tagged with the day's stops in DESCRIPTION. Users get
 * a "open in Calendar" prompt when this file is shared/opened on iOS.
 */
export function buildItineraryIcs(plan: TripPlan, opts: { startDate?: Date; tripName?: string } = {}): string {
  const startDate = opts.startDate ?? new Date();
  const tripName = opts.tripName ?? 'Irish Archaeology Trip';
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IrishArchaeology//Trip Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];
  for (const day of plan.days) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + day.index);
    const dtstart = formatDateBasic(date);
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const dtend = formatDateBasic(next);
    const uid = `${date.getTime()}-${day.index}@irisharchaeology`;
    const summary = `${tripName} – Day ${day.index + 1}`;
    const desc = day.stops.map((s, i) => `${i + 1}. ${s.site.name} (${s.site.county || ''})`).join('\\n');
    const meta = `\\n\\nDistance: ${day.totalKm.toFixed(0)} km · Drive: ${formatMins(day.driveMinutes)} · Visit: ${formatMins(day.visitMinutes)}`;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDateTimeBasic(new Date())}`,
      `DTSTART;VALUE=DATE:${dtstart}`,
      `DTEND;VALUE=DATE:${dtend}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(desc + meta)}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function formatMins(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function formatDateBasic(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${dd}`;
}
function formatDateTimeBasic(d: Date): string {
  const date = formatDateBasic(d);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const mi = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${date}T${h}${mi}${s}Z`;
}
function escapeIcs(s: string): string {
  return s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\r?\n/g, '\\n');
}
