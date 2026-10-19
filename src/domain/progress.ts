import { Goal, GoalType, Units, Workout } from './types';
import { distanceUnit, toDisplayDistance } from './metrics';

export const GOAL_PRESETS: Record<GoalType, { label: string; hint: string; def: number; step: number; min: number; max: number }> = {
  workouts: { label: 'Workouts per week', hint: 'Good for building a habit', def: 3, step: 1, min: 1, max: 14 },
  minutes: { label: 'Active minutes per week', hint: 'Counts any tracked workout time', def: 150, step: 15, min: 30, max: 900 },
  distance: { label: 'Distance per week', hint: 'For walkers, runners and riders', def: 10000, step: 1000, min: 1000, max: 200000 },
};

/** Monday 00:00 local time of the week containing `d`. */
export function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const dow = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - dow);
  return x;
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** The goal in effect at `at`: the latest goal whose effectiveFrom is not after `at`. */
export function goalAt(goals: Goal[], at: Date): Goal | null {
  const sorted = [...goals].sort((a, b) => Date.parse(a.effectiveFrom) - Date.parse(b.effectiveFrom));
  let found: Goal | null = null;
  for (const g of sorted) if (Date.parse(g.effectiveFrom) <= at.getTime()) found = g;
  return found ?? sorted[0] ?? null;
}

export function workoutsBetween(ws: Workout[], from: Date, to: Date): Workout[] {
  return ws.filter((w) => {
    const t = Date.parse(w.startedAt);
    return t >= from.getTime() && t < to.getTime();
  });
}

export function goalValue(type: GoalType, ws: Workout[]): number {
  if (type === 'workouts') return ws.length;
  if (type === 'minutes') return Math.round(ws.reduce((a, w) => a + w.durationSec, 0) / 60);
  return ws.reduce((a, w) => a + (w.distanceM ?? 0), 0);
}

export interface WeekProgress {
  weekStart: Date;
  goal: Goal | null;
  value: number;
  met: boolean;
  pct: number;
}

/** Progress for the week starting at weekStart, measured against the goal that applied at the end of that week (or now, for the current week). */
export function weekProgress(goals: Goal[], ws: Workout[], weekStart: Date, now: Date): WeekProgress {
  const end = addDays(weekStart, 7);
  const goal = goalAt(goals, end.getTime() > now.getTime() ? now : new Date(end.getTime() - 1));
  const value = goal ? goalValue(goal.type, workoutsBetween(ws, weekStart, end)) : 0;
  const met = !!goal && value >= goal.target;
  const pct = goal ? Math.min(100, Math.round((value / goal.target) * 100)) : 0;
  return { weekStart, goal, value, met, pct };
}

export function formatGoalAmount(type: GoalType, v: number, units: Units): string {
  if (type === 'workouts') return `${v} ${v === 1 ? 'workout' : 'workouts'}`;
  if (type === 'minutes') return `${v} min`;
  const d = toDisplayDistance(v, units);
  return `${d % 1 === 0 ? d.toFixed(0) : d.toFixed(1)} ${distanceUnit(units)}`;
}

/** Active minutes per day, Monday to Sunday, for the week starting at weekStart. */
export function dailyMinutes(ws: Workout[], weekStart: Date): number[] {
  return Array.from({ length: 7 }, (_, i) => {
    const from = addDays(weekStart, i);
    return Math.round(workoutsBetween(ws, from, addDays(from, 1)).reduce((a, w) => a + w.durationSec, 0) / 60);
  });
}

/** "2 of 3 workouts", "40 of 150 min", "4.2 of 10 km". */
export function formatGoalProgress(type: GoalType, value: number, target: number, units: Units): string {
  if (type === 'workouts') return `${value} of ${target} ${target === 1 ? 'workout' : 'workouts'}`;
  if (type === 'minutes') return `${value} of ${target} min`;
  const v = toDisplayDistance(value, units);
  const t = toDisplayDistance(target, units);
  return `${v.toFixed(1)} of ${t % 1 === 0 ? t.toFixed(0) : t.toFixed(1)} ${distanceUnit(units)}`;
}
