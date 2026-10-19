import { Workout } from './types';

/**
 * Outbox-based sync. Every change becomes an operation with a client-generated id.
 * Servers must treat opId as an idempotency key and keep only the highest syncVersion per workout,
 * so retrying after a timeout never creates a second workout.
 */
export interface SyncOp {
  opId: string;
  kind: 'upsert' | 'delete';
  workoutId: string;
  version: number;
  payload?: Workout;
  attempts: number;
  lastError?: string;
}

export interface SyncClient {
  /** Resolves when the server has durably applied (or already applied) the op. Rejects on any failure. */
  send(op: SyncOp): Promise<void>;
}

export function enqueue(outbox: SyncOp[], op: Omit<SyncOp, 'attempts'>): SyncOp[] {
  // A newer op for the same workout supersedes queued ones that have not been sent yet.
  const rest = outbox.filter((o) => o.workoutId !== op.workoutId);
  return [...rest, { ...op, attempts: 0 }];
}

export interface FlushResult {
  outbox: SyncOp[];
  synced: { workoutId: string; version: number }[];
  failed: number;
}

/** Sends ops in order. Stops at the first failure so ordering is preserved; failed ops stay queued for the next attempt. */
export async function flush(outbox: SyncOp[], client: SyncClient): Promise<FlushResult> {
  const remaining = [...outbox];
  const synced: FlushResult['synced'] = [];
  while (remaining.length) {
    const op = remaining[0];
    try {
      await client.send(op);
      remaining.shift();
      if (op.kind === 'upsert') synced.push({ workoutId: op.workoutId, version: op.version });
    } catch (e) {
      remaining[0] = { ...op, attempts: op.attempts + 1, lastError: e instanceof Error ? e.message : String(e) };
      return { outbox: remaining, synced, failed: 1 };
    }
  }
  return { outbox: remaining, synced, failed: 0 };
}

/** Delay before the next retry, capped at 5 minutes. */
export function backoffMs(attempts: number): number {
  return Math.min(300000, 2000 * 2 ** Math.max(0, attempts - 1));
}

/** In-memory server with the idempotency rules a real backend must follow. Used in tests and as a reference. */
export class ReferenceServer implements SyncClient {
  applied = new Set<string>();
  workouts = new Map<string, Workout>();
  failNext = 0;
  /** Simulates "server applied it but the response was lost". */
  dropResponseNext = 0;

  async send(op: SyncOp): Promise<void> {
    if (this.failNext > 0) {
      this.failNext--;
      throw new Error('network');
    }
    if (!this.applied.has(op.opId)) {
      this.applied.add(op.opId);
      const cur = this.workouts.get(op.workoutId);
      if (op.kind === 'delete') this.workouts.delete(op.workoutId);
      else if (op.payload && (!cur || cur.syncVersion <= op.version)) this.workouts.set(op.workoutId, op.payload);
    }
    if (this.dropResponseNext > 0) {
      this.dropResponseNext--;
      throw new Error('timeout');
    }
  }
}
