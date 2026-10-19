import { Pressable, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../data/store';
import { formatClock, formatPaceOrSpeed, toDisplayDistance, distanceUnit } from '../../domain/metrics';
import { formatGoalProgress, startOfWeek, weekProgress } from '../../domain/progress';
import { Workout } from '../../domain/types';
import { Button, Card, Screen } from '../../ui/components';
import { syncPill } from '../../ui/WorkoutBits';
import { colors, type } from '../../ui/theme';

const RATINGS: { value: NonNullable<Workout['rating']>; label: string }[] = [
  { value: 'easy', label: 'Easy' }, { value: 'right', label: 'Just right' }, { value: 'hard', label: 'Hard' },
];

export default function Summary() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const w = store.state.workouts.find((x) => x.id === id);
  if (!w) return <Redirect href="/home" />;
  const now = new Date();
  const week = weekProgress(store.state.goals, store.state.workouts, startOfWeek(now), now);
  const pace = formatPaceOrSpeed(w.activityType, w.durationSec, w.distanceM, store.state.units);
  const feedback = week.goal
    ? `That’s ${formatGoalProgress(week.goal.type, week.value, week.goal.target, store.state.units)} this week.${week.met ? ' Weekly goal reached.' : ' Nice work.'}`
    : 'Nice work.';

  return (
    <Screen>
      <View style={{ alignItems: 'center', gap: 10, marginTop: 16 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="checkmark" size={36} color={colors.navy} />
        </View>
        <Text accessibilityRole="header" style={[type.title, { textAlign: 'center' }]}>{w.title}</Text>
        <View style={{ alignItems: 'center' }}>{syncPill(w)}</View>
      </View>
      <Card style={{ flexDirection: 'row' }}>
        <Stat value={formatClock(w.durationSec)} label="Duration" />
        <Stat value={w.distanceM !== null ? toDisplayDistance(w.distanceM, store.state.units).toFixed(2) : '—'} label={w.distanceM !== null ? `Distance (${distanceUnit(store.state.units)})` : 'Distance not recorded'} />
        {pace ? <Stat value={pace.split(' ')[0]} label={pace.slice(pace.indexOf(' ') + 1)} /> : null}
      </Card>
      <Text style={{ textAlign: 'center', fontSize: 16, fontWeight: '700', color: colors.text }}>{feedback}</Text>
      <View style={{ alignItems: 'center', gap: 10 }}>
        <Text style={type.caption}>How did it feel?</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {RATINGS.map((r) => {
            const on = w.rating === r.value;
            return (
              <Pressable key={r.value} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => store.rateWorkout(w.id, r.value)}
                style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: on ? colors.navy : colors.line, backgroundColor: on ? colors.navy : colors.bg, justifyContent: 'center' }}>
                <Text style={{ fontWeight: '700', color: on ? '#FFFFFF' : colors.navy }}>{r.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Text style={{ textAlign: 'center', fontSize: 12, color: colors.muted }}>Distance and pace are GPS estimates.</Text>
      <View style={{ flex: 1 }} />
      <Button label="View details" variant="secondary" onPress={() => router.push({ pathname: '/history/[id]', params: { id: w.id } })} />
      <Button label="Done" onPress={() => router.replace('/home')} />
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[{ fontSize: 22, fontWeight: '800', color: colors.text }, type.num]}>{value}</Text>
      <Text style={{ fontSize: 13, color: colors.muted, textAlign: 'center' }}>{label}</Text>
    </View>
  );
}
