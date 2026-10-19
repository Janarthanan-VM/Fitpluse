import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, AppState as RNAppState, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { ActiveSession, ActivityType, GeoPoint, Goal, Units, Workout } from '../domain/types';
import * as S from '../domain/session';
import { backoffMs, enqueue, flush, SyncOp } from '../domain/sync';
import { Account, createAccount, verify } from '../services/auth';
import { makeSyncClient } from '../services/syncClient';

const KEY = 'fitpulse/state/v1';

export interface PersistedState {
  version: 1;
  account: Account | null;
  signedIn: boolean;
  onboarded: boolean;
  units: Units;
  goals: Goal[];
  workouts: Workout[];
  active: ActiveSession | null;
  outbox: SyncOp[];
  motionExplained: boolean;
}

const INITIAL: PersistedState = {
  version: 1,
  account: null,
  signedIn: false,
  onboarded: false,
  units: 'metric',
  goals: [],
  workouts: [],
  active: null,
  outbox: [],
  motionExplained: false,
};

interface Store {
  state: PersistedState;
  hydrated: boolean;
  syncEnabled: boolean;
  signUp(email: string, password: string): Promise<void>;
  signIn(email: string, password: string): Promise<void>;
  signOut(): void;
  deleteAccount(): Promise<void>;
  setProfile(name: string, units: Units): void;
  setUnits(units: Units): void;
  setGoal(goal: Omit<Goal, 'effectiveFrom'>): void;
  completeOnboarding(): void;
  beginSession(activity: ActivityType, plannedMinutes: number | null, tracksDistance: boolean): void;
  confirmStart(): void;
  pause(): void;
  resume(): void;
  addPoint(p: GeoPoint): void;
  finishSession(): string | null;
  discardSession(): void;
  renameWorkout(id: string, title: string): void;
  rateWorkout(id: string, rating: Workout['rating']): void;
  deleteWorkout(id: string): void;
  retrySync(): void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(INITIAL);
  const [hydrated, setHydrated] = useState(false);
  const ref = useRef(state);
  ref.current = state;

  const client = useMemo(() => makeSyncClient(() => ref.current.account?.id ?? null), []);

  // Load once. An active session survives a restart because its timer is stored as timestamps.
  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (raw) setState({ ...INITIAL, ...(JSON.parse(raw) as PersistedState) });
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (hydrated) AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const update = useCallback((fn: (s: PersistedState) => PersistedState) => setState((s) => fn(s)), []);

  // ---- sync loop
  const syncing = useRef(false);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runSync = useCallback(async () => {
    if (!client || syncing.current || !ref.current.outbox.length) return;
    syncing.current = true;
    try {
      const snapshot = ref.current.outbox;
      const r = await flush(snapshot, client);
      // Ops may have been queued while we were sending: drop only what was sent, keep the rest.
      const left = new Map(r.outbox.map((o) => [o.opId, o]));
      const sent = new Set(snapshot.filter((o) => !left.has(o.opId)).map((o) => o.opId));
      update((s) => {
        return {
          ...s,
          outbox: s.outbox.filter((o) => !sent.has(o.opId)).map((o) => left.get(o.opId) ?? o),
          workouts: s.workouts.map((w) => (r.synced.some((x) => x.workoutId === w.id && x.version === w.syncVersion) ? { ...w, syncState: 'synced' } : w)),
        };
      });
      if (r.failed && r.outbox[0]) {
        if (retryTimer.current) clearTimeout(retryTimer.current);
        retryTimer.current = setTimeout(() => void runSync(), backoffMs(r.outbox[0].attempts));
      }
    } finally {
      syncing.current = false;
    }
  }, [client, update]);

  useEffect(() => {
    if (hydrated && state.outbox.length) void runSync();
  }, [hydrated, state.outbox.length, runSync]);

  useEffect(() => {
    const sub = RNAppState.addEventListener('change', (s) => s === 'active' && void runSync());
    return () => sub.remove();
  }, [runSync]);

  const queue = (s: PersistedState, op: Omit<SyncOp, 'attempts' | 'opId'>): SyncOp[] =>
    client ? enqueue(s.outbox, { ...op, opId: Crypto.randomUUID() }) : s.outbox;

  const store: Store = {
    state,
    hydrated,
    syncEnabled: !!client,

    async signUp(email, password) {
      const account = await createAccount(email, password);
      update((s) => ({ ...INITIAL, account, signedIn: true }));
    },
    async signIn(email, password) {
      await verify(ref.current.account, email, password);
      update((s) => ({ ...s, signedIn: true }));
    },
    signOut() {
      update((s) => ({ ...s, signedIn: false, active: null }));
    },
    async deleteAccount() {
      // With a backend this sends a deletion request first; here all data lives on the phone.
      await AsyncStorage.removeItem(KEY);
      setState(INITIAL);
    },
    setProfile(name, units) {
      update((s) => ({ ...s, units, account: s.account ? { ...s.account, name: name.trim() } : s.account }));
    },
    setUnits(units) {
      update((s) => ({ ...s, units }));
    },
    setGoal(goal) {
      update((s) => {
        const now = new Date().toISOString();
        // Changing the goal on the same day replaces that day's entry instead of stacking.
        const today = now.slice(0, 10);
        const goals = s.goals.filter((g) => g.effectiveFrom.slice(0, 10) !== today);
        return { ...s, goals: [...goals, { ...goal, effectiveFrom: s.goals.length ? now : new Date(0).toISOString() }] };
      });
    },
    completeOnboarding() {
      update((s) => ({ ...s, onboarded: true, motionExplained: true }));
    },
    beginSession(activity, plannedMinutes, tracksDistance) {
      update((s) => (s.active ? s : { ...s, active: S.createSession(Crypto.randomUUID(), activity, { plannedMinutes, tracksDistance, now: new Date() }) }));
    },
    confirmStart() {
      update((s) => (s.active?.status === 'starting' ? { ...s, active: S.confirmStart(s.active, new Date()) } : s));
    },
    pause() {
      update((s) => (s.active?.status === 'active' ? { ...s, active: S.pause(s.active, new Date()) } : s));
    },
    resume() {
      update((s) => (s.active?.status === 'paused' ? { ...s, active: S.resume(s.active, new Date()) } : s));
    },
    addPoint(p) {
      update((s) => (s.active ? { ...s, active: S.addPoint(s.active, p) } : s));
    },
    finishSession() {
      const a = ref.current.active;
      if (!a || (a.status !== 'active' && a.status !== 'paused')) return null;
      const now = new Date();
      const w = S.finish(a, now, S.defaultTitle(a.activityType, new Date(a.segments[0]?.start ?? a.createdAt)));
      const workout: Workout = { ...w, syncState: client ? 'pending' : 'local' };
      update((s) => ({
        ...s,
        active: null,
        workouts: [workout, ...s.workouts.filter((x) => x.id !== workout.id)],
        outbox: queue(s, { kind: 'upsert', workoutId: workout.id, version: workout.syncVersion, payload: workout }),
      }));
      return workout.id;
    },
    discardSession() {
      update((s) => ({ ...s, active: null }));
    },
    renameWorkout(id, title) {
      editWorkout(id, (w) => ({ ...w, title }));
    },
    rateWorkout(id, rating) {
      editWorkout(id, (w) => ({ ...w, rating }));
    },
    deleteWorkout(id) {
      update((s) => {
        const w = s.workouts.find((x) => x.id === id);
        return { ...s, workouts: s.workouts.filter((x) => x.id !== id), outbox: w ? queue(s, { kind: 'delete', workoutId: id, version: w.syncVersion + 1 }) : s.outbox };
      });
    },
    retrySync() {
      void runSync();
    },
  };

  function editWorkout(id: string, fn: (w: Workout) => Workout) {
    update((s) => {
      const cur = s.workouts.find((w) => w.id === id);
      if (!cur) return s;
      const next: Workout = { ...fn(cur), syncVersion: cur.syncVersion + 1, syncState: client ? 'pending' : 'local' };
      return {
        ...s,
        workouts: s.workouts.map((w) => (w.id === id ? next : w)),
        outbox: queue(s, { kind: 'upsert', workoutId: id, version: next.syncVersion, payload: next }),
      };
    });
  }

  return (
    <Ctx.Provider value={store}>
      {hydrated ? children : (
        <View style={{ flex: 1, backgroundColor: '#122338', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Text style={{ color: '#FFFFFF', fontSize: 28, fontWeight: '800' }}>FitPulse</Text>
          <ActivityIndicator color="#35C982" />
        </View>
      )}
    </Ctx.Provider>
  );
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

/** Re-renders every second while mounted, for live timers. */
export function useNow(intervalMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}
