import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enqueue, flush, ReferenceServer, SyncOp } from '../src/domain/sync';
import { Workout } from '../src/domain/types';

const w = (id: string, version = 1): Workout => ({
  id, activityType: 'walk', title: 'Walk', startedAt: '2026-10-19T10:00:00Z', endedAt: '2026-10-19T10:30:00Z',
  durationSec: 1800, distanceM: 2000, events: [], source: 'phone', syncVersion: version, syncState: 'pending',
});
const op = (opId: string, workout: Workout): Omit<SyncOp, 'attempts'> => ({ opId, kind: 'upsert', workoutId: workout.id, version: workout.syncVersion, payload: workout });

test('a retry after a lost response does not create a duplicate', async () => {
  const server = new ReferenceServer();
  let box = enqueue([], op('op1', w('a')));
  server.dropResponseNext = 1;
  let r = await flush(box, server);
  assert.equal(r.failed, 1);
  assert.equal(r.outbox.length, 1);
  assert.equal(r.outbox[0].attempts, 1);
  r = await flush(r.outbox, server);
  assert.equal(r.failed, 0);
  assert.equal(server.workouts.size, 1);
  assert.deepEqual(r.synced, [{ workoutId: 'a', version: 1 }]);
});

test('offline ops stay queued in order until the network returns', async () => {
  const server = new ReferenceServer();
  let box = enqueue([], op('op1', w('a')));
  box = enqueue(box, op('op2', w('b')));
  server.failNext = 1;
  let r = await flush(box, server);
  assert.deepEqual(r.outbox.map((o) => o.opId), ['op1', 'op2']);
  r = await flush(r.outbox, server);
  assert.equal(r.outbox.length, 0);
  assert.equal(server.workouts.size, 2);
});

test('a newer edit replaces an unsent older one and older versions never win', async () => {
  const server = new ReferenceServer();
  let box = enqueue([], op('op1', w('a', 1)));
  box = enqueue(box, op('op2', { ...w('a', 2), title: 'Renamed' }));
  assert.equal(box.length, 1);
  await flush(box, server);
  await server.send({ ...op('op-old', w('a', 1)), attempts: 0 });
  assert.equal(server.workouts.get('a')!.title, 'Renamed');
});

test('delete removes the workout on the server', async () => {
  const server = new ReferenceServer();
  await flush(enqueue([], op('op1', w('a'))), server);
  await flush(enqueue([], { opId: 'op2', kind: 'delete', workoutId: 'a', version: 2 }), server);
  assert.equal(server.workouts.size, 0);
});
