import { ActiveSession, ActivityType, GeoPoint, SessionStatus, Workout } from './types';
import { distanceBetween, isPlausibleStep } from './metrics';

export class InvalidTransitionError extends Error {
  constructor(from: SessionStatus, action: string) {
    super(`Cannot ${action} a session that is ${from}`);
    this.name = 'InvalidTransitionError';
  }
}

const ALLOWED: Record<string, SessionStatus[]> = {
  confirmStart: ['starting'],
  pause: ['active'],
  resume: ['paused'],
  finish: ['active', 'paused'],
  discard: ['starting', 'active', 'paused'],
};

function assertCan(s: ActiveSession, action: keyof typeof ALLOWED) {
  if (!ALLOWED[action].includes(s.status)) throw new InvalidTransitionError(s.status, action);
}

export function createSession(
  id: string,
  activityType: ActivityType,
  opts: { plannedMinutes?: number | null; tracksDistance: boolean; now: Date },
): ActiveSession {
  return {
    id,
    activityType,
    plannedMinutes: opts.plannedMinutes ?? null,
    status: 'starting',
    createdAt: opts.now.toISOString(),
    segments: [],
    events: [],
    distanceM: opts.tracksDistance ? 0 : null,
    lastPoint: null,
  };
}

/** Called once tracking has really begun. The timer starts here, not when the user taps Start. */
export function confirmStart(s: ActiveSession, now: Date): ActiveSession {
  assertCan(s, 'confirmStart');
  const at = now.toISOString();
  return { ...s, status: 'active', segments: [{ start: at }], events: [{ type: 'started', at }] };
}

export function pause(s: ActiveSession, now: Date): ActiveSession {
  assertCan(s, 'pause');
  const at = now.toISOString();
  const segments = s.segments.map((seg, i) => (i === s.segments.length - 1 ? { ...seg, end: at } : seg));
  // A paused session drops its last point so the walk between pause and resume is not counted.
  return { ...s, status: 'paused', segments, lastPoint: null, events: [...s.events, { type: 'paused', at }] };
}

export function resume(s: ActiveSession, now: Date): ActiveSession {
  assertCan(s, 'resume');
  const at = now.toISOString();
  return { ...s, status: 'active', segments: [...s.segments, { start: at }], events: [...s.events, { type: 'resumed', at }] };
}

export function elapsedSeconds(s: Pick<ActiveSession, 'segments'>, now: Date): number {
  let ms = 0;
  for (const seg of s.segments) {
    const end = seg.end ? Date.parse(seg.end) : now.getTime();
    ms += Math.max(0, end - Date.parse(seg.start));
  }
  return Math.floor(ms / 1000);
}

/** Adds a GPS fix. Ignored unless the session is active and tracking distance; implausible jumps are dropped, not smoothed. */
export function addPoint(s: ActiveSession, p: GeoPoint): ActiveSession {
  if (s.status !== 'active' || s.distanceM === null) return s;
  if (p.accuracy !== null && p.accuracy > 35) return s;
  if (!s.lastPoint) return { ...s, lastPoint: p };
  const d = distanceBetween(s.lastPoint, p);
  if (!isPlausibleStep(s.lastPoint, p, d, s.activityType)) return { ...s, lastPoint: p };
  return { ...s, distanceM: s.distanceM + d, lastPoint: p };
}

export function finish(s: ActiveSession, now: Date, title: string): Workout {
  assertCan(s, 'finish');
  const at = now.toISOString();
  const segments = s.segments.map((seg) => (seg.end ? seg : { ...seg, end: at }));
  return {
    id: s.id,
    activityType: s.activityType,
    title,
    startedAt: segments[0]?.start ?? s.createdAt,
    endedAt: at,
    durationSec: elapsedSeconds({ segments }, now),
    distanceM: s.distanceM === null ? null : Math.round(s.distanceM),
    events: [...s.events, { type: 'finished', at }],
    source: 'phone',
    syncVersion: 1,
    syncState: 'pending',
  };
}

export function discard(s: ActiveSession): null {
  assertCan(s, 'discard');
  return null;
}

export function defaultTitle(activity: ActivityType, startedAt: Date): string {
  const h = startedAt.getHours();
  const part = h < 12 ? 'Morning' : h < 18 ? 'Afternoon' : 'Evening';
  const name = { walk: 'walk', run: 'run', cycle: 'ride', workout: 'workout' }[activity];
  return `${part} ${name}`;
}
