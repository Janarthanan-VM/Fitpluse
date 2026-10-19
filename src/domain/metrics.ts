import { ActivityType, GeoPoint, Units } from './types';

const EARTH_R = 6371000;

export function distanceBetween(a: GeoPoint, b: GeoPoint): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(h));
}

/** Top plausible speed in m/s per activity; faster steps are treated as GPS noise. */
const MAX_SPEED: Record<ActivityType, number> = { walk: 4, run: 9, cycle: 25, workout: 9 };

export function isPlausibleStep(a: GeoPoint, b: GeoPoint, d: number, activity: ActivityType): boolean {
  const dt = (Date.parse(b.at) - Date.parse(a.at)) / 1000;
  if (dt <= 0) return false;
  return d / dt <= MAX_SPEED[activity];
}

export const ACTIVITIES: Record<ActivityType, { label: string; outdoor: boolean; metrics: string }> = {
  walk: { label: 'Walk', outdoor: true, metrics: 'Time, distance, pace' },
  run: { label: 'Run', outdoor: true, metrics: 'Time, distance, pace' },
  cycle: { label: 'Cycle', outdoor: true, metrics: 'Time, distance, speed' },
  workout: { label: 'General workout', outdoor: false, metrics: 'Time' },
};

const M_PER_MI = 1609.344;

export function distanceUnit(units: Units) {
  return units === 'imperial' ? 'mi' : 'km';
}

/** Metres to display units. Storage is always metres; conversion happens only for display. */
export function toDisplayDistance(m: number, units: Units): number {
  return units === 'imperial' ? m / M_PER_MI : m / 1000;
}

export function fromDisplayDistance(v: number, units: Units): number {
  return units === 'imperial' ? v * M_PER_MI : v * 1000;
}

export function formatDistance(m: number | null, units: Units, digits = 2): string {
  if (m === null) return 'Not recorded';
  return `${toDisplayDistance(m, units).toFixed(digits)} ${distanceUnit(units)}`;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

export function formatClock(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

export function formatDurationWords(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 1) return 'under 1 min';
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${pad(m % 60)} min`;
}

/** Pace for walk/run (time per unit) or speed for cycling. Returns null when there is too little distance to be meaningful. */
export function formatPaceOrSpeed(activity: ActivityType, durationSec: number, distanceM: number | null, units: Units): string | null {
  if (distanceM === null || distanceM < 50 || durationSec <= 0) return null;
  const dist = toDisplayDistance(distanceM, units);
  const u = distanceUnit(units);
  if (activity === 'cycle') return `${(dist / (durationSec / 3600)).toFixed(1)} ${u}/h`;
  return `${formatClock(Math.round(durationSec / dist))} /${u}`;
}
