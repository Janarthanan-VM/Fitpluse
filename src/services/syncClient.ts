import { SyncClient, SyncOp } from '../domain/sync';

/**
 * Sends one outbox op to the backend. The server must treat Idempotency-Key as unique per op
 * and keep the highest syncVersion per workout (see ReferenceServer in domain/sync.ts).
 */
class HttpSyncClient implements SyncClient {
  constructor(private baseUrl: string, private token: () => string | null) {}

  async send(op: SyncOp): Promise<void> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
      const res = await fetch(`${this.baseUrl}/v1/sync/ops`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': op.opId,
          ...(this.token() ? { Authorization: `Bearer ${this.token()}` } : {}),
        },
        body: JSON.stringify({ opId: op.opId, kind: op.kind, workoutId: op.workoutId, version: op.version, workout: op.payload }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } finally {
      clearTimeout(timer);
    }
  }
}

/** Returns null until a backend URL is configured; workouts then stay saved on the phone only. */
export function makeSyncClient(token: () => string | null): SyncClient | null {
  const url = process.env.EXPO_PUBLIC_SYNC_URL;
  return url ? new HttpSyncClient(url.replace(/\/$/, ''), token) : null;
}
