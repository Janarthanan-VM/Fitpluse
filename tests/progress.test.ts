import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dailyMinutes, goalAt, startOfWeek, weekProgress } from '../src/domain/progress';
import { formatClock, formatDistance, formatPaceOrSpeed } from '../src/domain/metrics';
import { Goal, Workout } from '../src/domain/types';

const w = (startedAt: string, durationSec: number, distanceM: number | null = null): Workout => ({
  id: startedAt, activityType: 'run', title: '', startedAt, endedAt: startedAt, durationSec, distanceM, events: [], source: 'phone', syncVersion: 1, syncState: 'local',
});

test('weeks start on Monday', () => {
  const ws = startOfWeek(new Date(2026, 9, 21, 15)); // Wed 21 Oct 2026
  assert.equal(ws.getDay(), 1);
  assert.equal(ws.getDate(), 19);
});

test('past weeks keep the goal that applied then', () => {
  const goals: Goal[] = [
    { type: 'workouts', target: 2, effectiveFrom: new Date(2026, 9, 1).toISOString() },
    { type: 'workouts', target: 5, effectiveFrom: new Date(2026, 9, 19).toISOString() },
  ];
  const now = new Date(2026, 9, 21, 12);
  const lastWeek = startOfWeek(new Date(2026, 9, 14));
  const workouts = [w(new Date(2026, 9, 13, 8).toISOString(), 600), w(new Date(2026, 9, 15, 8).toISOString(), 600)];
  const p = weekProgress(goals, workouts, lastWeek, now);
  assert.equal(p.goal!.target, 2);
  assert.ok(p.met);
  assert.equal(goalAt(goals, now)!.target, 5);
});

test('daily minutes are bucketed by local day', () => {
  const ws = startOfWeek(new Date(2026, 9, 21));
  const mins = dailyMinutes([w(new Date(2026, 9, 21, 7).toISOString(), 1800), w(new Date(2026, 9, 21, 19).toISOString(), 600)], ws);
  assert.deepEqual(mins, [0, 0, 40, 0, 0, 0, 0]);
});

test('formatting keeps units explicit and does not invent values', () => {
  assert.equal(formatClock(65), '1:05');
  assert.equal(formatClock(3725), '1:02:05');
  assert.equal(formatDistance(null, 'metric'), 'Not recorded');
  assert.equal(formatDistance(1609.344, 'imperial'), '1.00 mi');
  assert.equal(formatPaceOrSpeed('run', 1500, 5000, 'metric'), '5:00 /km');
  assert.equal(formatPaceOrSpeed('cycle', 3600, 20000, 'metric'), '20.0 km/h');
  assert.equal(formatPaceOrSpeed('run', 60, 10, 'metric'), null);
});
