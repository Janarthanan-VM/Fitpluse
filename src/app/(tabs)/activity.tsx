import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../data/store';
import { ACTIVITIES } from '../../domain/metrics';
import { addDays, startOfWeek } from '../../domain/progress';
import { ActivityType, Workout } from '../../domain/types';
import { Button, Screen } from '../../ui/components';
import { ActiveSessionBar, WorkoutRow } from '../../ui/WorkoutBits';
import { colors, type } from '../../ui/theme';

type Filter = 'all' | ActivityType;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'walk', label: 'Walk' }, { value: 'run', label: 'Run' }, { value: 'cycle', label: 'Cycle' }, { value: 'workout', label: 'Workout' },
];

function groupByWeek(ws: Workout[], now: Date) {
  const thisWeek = startOfWeek(now).getTime();
  const lastWeek = addDays(startOfWeek(now), -7).getTime();
  const groups = new Map<string, Workout[]>();
  const sorted = [...ws].sort((a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt));
  for (const w of sorted) {
    const ws0 = startOfWeek(new Date(w.startedAt));
    const label = ws0.getTime() === thisWeek ? 'This week' : ws0.getTime() === lastWeek ? 'Last week' : `Week of ${ws0.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
    groups.set(label, [...(groups.get(label) ?? []), w]);
  }
  return [...groups.entries()];
}

export default function Activity() {
  const { state } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const filtered = state.workouts.filter((w) => filter === 'all' || w.activityType === filter);
  const groups = groupByWeek(filtered, new Date());

  return (
    <Screen edges={['top']}>
      <ActiveSessionBar />
      <Text accessibilityRole="header" style={type.title}>Activity</Text>
      <Button big icon="play" label={state.active ? 'Return to workout' : 'Start a workout'} onPress={() => router.push(state.active ? '/workout/live' : '/workout/select')} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 8 }}>
        <Text accessibilityRole="header" style={type.section}>History</Text>
        <Text style={type.caption}>{state.workouts.length ? `${state.workouts.length} ${state.workouts.length === 1 ? 'workout' : 'workouts'}` : ''}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, alignItems: 'center' }} accessibilityLabel="Filter by activity">
        {FILTERS.map((f) => {
          const on = f.value === filter;
          return (
            <Pressable key={f.value} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setFilter(f.value)}
              style={{ minHeight: 40, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: on ? colors.navy : colors.line, backgroundColor: on ? colors.navy : colors.bg, justifyContent: 'center' }}>
              <Text style={{ fontWeight: '700', color: on ? '#FFFFFF' : colors.navy }}>{f.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {filtered.length === 0 ? (
        <View style={{ alignItems: 'center', gap: 10, padding: 32, backgroundColor: colors.soft, borderRadius: 16 }}>
          <Ionicons name="calendar-outline" size={40} color={colors.muted} />
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text, textAlign: 'center' }}>
            {state.workouts.length ? `No ${ACTIVITIES[filter as ActivityType]?.label.toLowerCase() ?? ''} workouts yet` : 'No workouts yet'}
          </Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>
            {state.workouts.length ? 'Try another filter, or start one now.' : 'Finished workouts will appear here, newest first.'}
          </Text>
        </View>
      ) : (
        groups.map(([label, items]) => (
          <View key={label}>
            <Text style={[type.eyebrow, { marginTop: 4 }]}>{label}</Text>
            {items.map((w, i) => <WorkoutRow key={w.id} w={w} units={state.units} last={i === items.length - 1} />)}
          </View>
        ))
      )}
    </Screen>
  );
}
