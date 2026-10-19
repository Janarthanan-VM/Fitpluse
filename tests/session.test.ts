import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addPoint, confirmStart, createSession, discard, elapsedSeconds, finish, InvalidTransitionError, pause, resume } from '../src/domain/session';

const t0 = new Date('2026-10-19T10:00:00Z');
const at = (sec: number) => new Date(t0.getTime() + sec * 1000);

test('timer starts only after start is confirmed', () => {
  const s = createSession('a', 'walk', { tracksDistance: true, now: t0 });
  assert.equal(s.status, 'starting');
  assert.equal(elapsedSeconds(s, at(30)), 0);
  const active = confirmStart(s, at(2));
  assert.equal(elapsedSeconds(active, at(62)), 60);
});

test('pause and resume keep the same session and exclude paused time', () => {
  let s = confirmStart(createSession('a', 'run', { tracksDistance: true, now: t0 }), t0);
  s = pause(s, at(100));
  assert.equal(elapsedSeconds(s, at(500)), 100);
  s = resume(s, at(160));
  assert.equal(s.id, 'a');
  assert.equal(elapsedSeconds(s, at(200)), 140);
  const w = finish(s, at(200), 'Run');
  assert.equal(w.id, 'a');
  assert.equal(w.durationSec, 140);
  assert.deepEqual(w.events.map((e) => e.type), ['started', 'paused', 'resumed', 'finished']);
});

test('invalid transitions are blocked', () => {
  const s = createSession('a', 'walk', { tracksDistance: false, now: t0 });
  assert.throws(() => pause(s, t0), InvalidTransitionError);
  assert.throws(() => finish(s, t0, 'x'), InvalidTransitionError);
  const active = confirmStart(s, t0);
  assert.throws(() => resume(active, t0), InvalidTransitionError);
  assert.throws(() => confirmStart(active, t0), InvalidTransitionError);
  assert.equal(discard(active), null);
});

test('distance is null, not zero, when location is not tracked', () => {
  const s = confirmStart(createSession('a', 'walk', { tracksDistance: false, now: t0 }), t0);
  const s2 = addPoint(s, { lat: 0, lon: 0, accuracy: 5, at: at(1).toISOString() });
  assert.equal(finish(s2, at(60), 'x').distanceM, null);
});

test('GPS noise and paused movement are not counted', () => {
  let s = confirmStart(createSession('a', 'walk', { tracksDistance: true, now: t0 }), t0);
  s = addPoint(s, { lat: 0, lon: 0, accuracy: 5, at: at(0).toISOString() });
  s = addPoint(s, { lat: 0.0001, lon: 0, accuracy: 5, at: at(10).toISOString() }); // ~11 m
  const afterWalk = s.distanceM!;
  assert.ok(afterWalk > 10 && afterWalk < 12);
  s = addPoint(s, { lat: 0.01, lon: 0, accuracy: 5, at: at(11).toISOString() }); // 1 km in 1 s: noise
  assert.equal(s.distanceM, afterWalk);
  s = addPoint(s, { lat: 0.0002, lon: 0, accuracy: 80, at: at(20).toISOString() }); // poor accuracy
  assert.equal(s.distanceM, afterWalk);
  s = pause(s, at(30));
  s = addPoint(s, { lat: 0.0005, lon: 0, accuracy: 5, at: at(40).toISOString() });
  assert.equal(s.distanceM, afterWalk);
});
