import { Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '../../data/store';
import { ACTIVITIES, distanceUnit, toDisplayDistance } from '../../domain/metrics';
import { addDays, formatGoalProgress, startOfWeek, weekProgress, workoutsBetween } from '../../domain/progress';
import { Button, Card, Screen } from '../../ui/components';
import { ActiveSessionBar, WorkoutRow } from '../../ui/WorkoutBits';
import { colors, type } from '../../ui/theme';

export default function Home() {
  const { state } = useStore();
  const now = new Date();
  const name = state.account?.name || 'there';
  const week = weekProgress(state.goals, state.workouts, startOfWeek(now), now);
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const today = workoutsBetween(state.workouts, dayStart, addDays(dayStart, 1));
  const todayMin = Math.round(today.reduce((a, w) => a + w.durationSec, 0) / 60);
  const todayDist = today.reduce((a, w) => a + (w.distanceM ?? 0), 0);
  const recent = state.workouts[0];
  const lastActivity = recent?.activityType ?? 'walk';
  const first = state.workouts.length === 0;

  const quickStart = () => {
    if (state.active) return router.push('/workout/live');
    router.push({ pathname: '/workout/check', params: { activity: lastActivity } });
  };

  const r = 31;
  const circ = 2 * Math.PI * r;
  return (
    <Screen soft edges={['top']}>
      <ActiveSessionBar />
      <View>
        <Text style={type.caption}>{now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
        <Text accessibilityRole="header" style={type.title}>Hi, {name}</Text>
      </View>

      <View style={{ backgroundColor: colors.navy, borderRadius: 20, padding: 20, gap: 14 }}>
        <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 13, letterSpacing: 0.5 }}>{first ? 'YOUR FIRST WORKOUT' : 'QUICK START'}</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 21, fontWeight: '700', lineHeight: 27 }}>
          {state.active ? 'You have a workout in progress.' : first ? 'A short walk is a great first session. Finish it to see your summary.' : `Pick up where you left off with a ${ACTIVITIES[lastActivity].label.toLowerCase()}.`}
        </Text>
        <Button big icon="play" label={state.active ? 'Return to workout' : `Start ${lastActivity === 'workout' ? 'a workout' : 'a ' + ACTIVITIES[lastActivity].label.toLowerCase()}`} onPress={quickStart} />
        {!state.active ? <Button variant="onDark" label="Choose another activity" onPress={() => router.push('/workout/select')} /> : null}
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <View accessible accessibilityRole="image" accessibilityLabel={`Weekly goal ${week.pct} percent complete`} style={{ width: 76, height: 76, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={76} height={76} style={{ position: 'absolute' }}>
            <Circle cx={38} cy={38} r={r} stroke="#E3E8ED" strokeWidth={9} fill="none" />
            {week.pct > 0 ? <Circle cx={38} cy={38} r={r} stroke={colors.accentStrong} strokeWidth={9} fill="none" strokeLinecap="round" strokeDasharray={`${(circ * week.pct) / 100} ${circ}`} transform="rotate(-90 38 38)" /> : null}
          </Svg>
          <Text style={[{ fontWeight: '800', fontSize: 17, color: colors.text }, type.num]}>{week.pct}%</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={type.eyebrow}>This week</Text>
          {week.goal ? (
            <Text style={[{ fontWeight: '800', fontSize: 19, color: colors.text }, type.num]}>
              {formatGoalProgress(week.goal.type, week.value, week.goal.target, state.units)}
            </Text>
          ) : <Text style={type.body}>No goal set</Text>}
          <Text style={{ fontSize: 14, color: colors.muted }}>{week.met ? 'Goal reached. Anything more is a bonus.' : week.value === 0 ? 'Every week starts fresh.' : 'You’re on your way.'}</Text>
        </View>
      </Card>

      <Card>
        <Text style={type.eyebrow}>Today</Text>
        {today.length ? (
          <View style={{ flexDirection: 'row' }}>
            <Stat value={`${todayMin}`} label="active min" />
            <Stat value={`${today.length}`} label={today.length === 1 ? 'workout' : 'workouts'} />
            <Stat value={toDisplayDistance(todayDist, state.units).toFixed(toDisplayDistance(todayDist, state.units) < 1 ? 2 : 1)} label={distanceUnit(state.units)} />
          </View>
        ) : (
          <Text style={type.body}>No activity recorded yet today. Your workouts will show up here.</Text>
        )}
      </Card>

      <Card>
        <Text style={type.eyebrow}>Recent workout</Text>
        {recent ? <WorkoutRow w={recent} units={state.units} last /> : <Text style={[type.body, { color: colors.muted }]}>Finish your first workout to see a summary here.</Text>}
      </Card>
    </Screen>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={[{ fontSize: 22, fontWeight: '800', color: colors.text }, type.num]}>{value}</Text>
      <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
    </View>
  );
}
