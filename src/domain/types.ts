export type ActivityType = 'walk' | 'run' | 'cycle' | 'workout';
export type Units = 'metric' | 'imperial';
export type GoalType = 'workouts' | 'minutes' | 'distance';

export interface Goal {
  type: GoalType;
  /** workouts per week, minutes per week, or metres per week */
  target: number;
  /** ISO timestamp from which this goal applies. Older goals stay so past weeks keep their own target. */
  effectiveFrom: string;
}

export type SessionStatus = 'starting' | 'active' | 'paused' | 'completed' | 'discarded';

export interface SessionEvent {
  type: 'started' | 'paused' | 'resumed' | 'finished' | 'discarded';
  at: string;
}

export interface Segment {
  start: string;
  end?: string;
}

export interface GeoPoint {
  lat: number;
  lon: number;
  accuracy: number | null;
  at: string;
}

/** A workout in progress. Elapsed time is derived from timestamps, so it survives app restarts. */
export interface ActiveSession {
  id: string;
  activityType: ActivityType;
  plannedMinutes: number | null;
  status: SessionStatus;
  createdAt: string;
  segments: Segment[];
  events: SessionEvent[];
  /** null when location is unavailable for this session (denied or indoor activity) */
  distanceM: number | null;
  lastPoint: GeoPoint | null;
}

export type SyncState = 'pending' | 'synced' | 'local';

export interface Workout {
  id: string;
  activityType: ActivityType;
  title: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
  distanceM: number | null;
  events: SessionEvent[];
  source: 'phone';
  syncVersion: number;
  syncState: SyncState;
  rating?: 'easy' | 'right' | 'hard';
}
