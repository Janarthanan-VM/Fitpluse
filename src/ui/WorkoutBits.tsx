import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useNow, useStore } from '../data/store';
import { elapsedSeconds } from '../domain/session';
import { ACTIVITIES, formatClock, formatDistance, formatDurationWords } from '../domain/metrics';
import { ActivityType, Units, Workout } from '../domain/types';
import { Pill } from './components';
import { colors, type } from './theme';

export const ACTIVITY_ICON: Record<ActivityType, keyof typeof Ionicons.glyphMap> = {
  walk: 'walk', run: 'fitness', cycle: 'bicycle', workout: 'barbell',
};

/** Shown at the top of tab screens while a workout is recording, so it is never lost behind navigation. */
export function ActiveSessionBar() {
  const { state } = useStore();
  const now = useNow();
  const a = state.active;
  if (!a || a.status === 'starting') return null;
  const paused = a.status === 'paused';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${ACTIVITIES[a.activityType].label} ${paused ? 'paused' : 'recording'}, ${formatClock(elapsedSeconds(a, now))}. Return to workout.`}
      onPress={() => router.push('/workout/live')}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.navy, borderRadius: 14, padding: 14 }}
    >
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: paused ? colors.pause : colors.accent }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{ACTIVITIES[a.activityType].label} · {paused ? 'Paused' : 'Recording'}</Text>
        <Text style={[{ color: '#C9D3DD' }, type.num]}>{formatClock(elapsedSeconds(a, now))}</Text>
      </View>
      <Text style={{ color: colors.accent, fontWeight: '800' }}>Return</Text>
    </Pressable>
  );
}

export function syncPill(w: Workout) {
  if (w.syncState === 'synced') return <Pill tone="success" label="Synced to your account" />;
  if (w.syncState === 'pending') return <Pill tone="warning" label="Saved on this phone · will sync when online" />;
  return <Pill tone="success" label="Saved on this phone" />;
}

export function WorkoutRow({ w, units, last }: { w: Workout; units: Units; last?: boolean }) {
  const date = new Date(w.startedAt);
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/history/[id]', params: { id: w.id } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: last ? 0 : 1, borderBottomColor: '#E6EBEF', minHeight: 64 }}
    >
      <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#EAF8F1', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={ACTIVITY_ICON[w.activityType]} size={22} color={colors.accentStrong} />
      </View>
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{w.title}</Text>
        <Text style={{ fontSize: 13, color: colors.muted }}>
          {date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })} · {formatDurationWords(w.durationSec)}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[{ fontWeight: '800', color: colors.text }, type.num]}>{w.distanceM !== null ? formatDistance(w.distanceM, units) : formatClock(w.durationSec)}</Text>
        {w.syncState === 'pending' ? <Text style={{ fontSize: 12, color: colors.warning.fg, fontWeight: '700' }}>Sync pending</Text> : null}
      </View>
    </Pressable>
  );
}
