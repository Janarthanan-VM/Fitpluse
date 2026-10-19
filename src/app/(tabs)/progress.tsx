import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../data/store';
import { addDays, dailyMinutes, formatGoalAmount, startOfWeek, weekProgress, workoutsBetween } from '../../domain/progress';
import { Button, Card, Screen, Segmented } from '../../ui/components';
import { ActiveSessionBar } from '../../ui/WorkoutBits';
import { colors, type } from '../../ui/theme';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Bars({ values, labels, highlight }: { values: number[]; labels: string[]; highlight: number }) {
  const max = Math.max(30, ...values);
  return (
    <View aria-hidden>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 160, borderBottomWidth: 1, borderBottomColor: '#B9C4CF' }}>
        {values.map((v, i) => (
          <View key={i} style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4, height: '100%' }}>
            <Text style={[{ fontSize: 12, fontWeight: '700', color: colors.text }, type.num]}>{v > 0 ? v : ''}</Text>
            <View style={{ width: '100%', height: Math.max(v > 0 ? 4 : 2, (v / max) * 128), borderTopLeftRadius: 6, borderTopRightRadius: 6, backgroundColor: i === highlight ? colors.accentStrong : colors.navy }} />
          </View>
        ))}
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
        {labels.map((l, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, color: i === highlight ? colors.text : colors.muted, fontWeight: i === highlight ? '800' : '500' }}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

export default function Progress() {
  const { state } = useStore();
  const [range, setRange] = useState<'week' | 'month'>('week');
  const now = new Date();
  const thisWeek = startOfWeek(now);
  const todayIdx = (now.getDay() + 6) % 7;

  if (state.workouts.length === 0) {
    return (
      <Screen edges={['top']}>
        <ActiveSessionBar />
        <Text accessibilityRole="header" style={type.title}>Progress</Text>
        <View style={{ alignItems: 'center', gap: 10, padding: 32, backgroundColor: colors.soft, borderRadius: 16 }}>
          <Ionicons name="bar-chart-outline" size={44} color={colors.muted} />
          <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>Not enough data yet</Text>
          <Text style={{ fontSize: 14, color: colors.muted, textAlign: 'center' }}>Trends appear after your first workout. Each finished session adds to this view.</Text>
          <Button label="Start a workout" onPress={() => router.push('/workout/select')} style={{ alignSelf: 'stretch', marginTop: 6 }} />
        </View>
      </Screen>
    );
  }

  const weeks = [3, 2, 1, 0].map((n) => addDays(thisWeek, -7 * n));
  let values: number[], labels: string[], highlight: number, total: number, summary: string, rangeTitle: string;
  if (range === 'week') {
    values = dailyMinutes(state.workouts, thisWeek);
    labels = DAYS.map((d, i) => (i === todayIdx ? 'Today' : d));
    highlight = todayIdx;
    total = values.reduce((a, b) => a + b, 0);
    const count = workoutsBetween(state.workouts, thisWeek, addDays(thisWeek, 7)).length;
    summary = `Active minutes per day this week, Monday to Sunday: ${values.join(', ')}. ${total} minutes across ${count} workouts.`;
    rangeTitle = `${thisWeek.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${addDays(thisWeek, 6).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
  } else {
    values = weeks.map((w) => Math.round(workoutsBetween(state.workouts, w, addDays(w, 7)).reduce((a, x) => a + x.durationSec, 0) / 60));
    labels = weeks.map((w, i) => (i === 3 ? 'This wk' : w.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })));
    highlight = 3;
    total = values.reduce((a, b) => a + b, 0);
    summary = `Active minutes per week for the last 4 weeks: ${values.join(', ')}.`;
    rangeTitle = `${weeks[0].toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${addDays(thisWeek, 6).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;
  }
  const consistency = weeks.map((w) => weekProgress(state.goals, state.workouts, w, now));
  const metCount = consistency.filter((c) => c.met).length;

  return (
    <Screen edges={['top']}>
      <ActiveSessionBar />
      <Text accessibilityRole="header" style={type.title}>Progress</Text>
      <Segmented label="Date range" value={range} onChange={setRange} options={[{ value: 'week', label: 'This week' }, { value: 'month', label: 'Last 4 weeks' }]} />
      <Card>
        <Text style={type.eyebrow}>{rangeTitle}</Text>
        <Text style={[{ fontSize: 30, fontWeight: '800', color: colors.text }, type.num]}>{total} <Text style={{ fontSize: 15, fontWeight: '600', color: colors.muted }}>active minutes</Text></Text>
        <View accessible accessibilityRole="image" accessibilityLabel={summary}>
          <Bars values={values} labels={labels} highlight={highlight} />
        </View>
        <Text style={{ fontSize: 13, color: colors.muted }}>{summary}</Text>
      </Card>
      <Card>
        <Text style={type.eyebrow}>Goal consistency</Text>
        <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>Goal met in {metCount} of the last 4 weeks</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {consistency.map((c, i) => {
            const current = i === 3;
            const status = c.met ? 'Goal met' : current ? 'In progress' : 'Not met';
            return (
              <View key={i} accessible accessibilityLabel={`${labels[i] ?? ''} ${status}`} style={{ flex: 1, alignItems: 'center', gap: 4, padding: 10, borderRadius: 12, backgroundColor: c.met ? colors.success.bg : colors.soft }}>
                <Ionicons name={c.met ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={c.met ? colors.success.fg : colors.muted} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.text }}>{current ? 'This wk' : weeks[i].toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}</Text>
                <Text style={{ fontSize: 11, color: '#3D4C5E' }}>{status}</Text>
                {c.goal ? <Text style={[{ fontSize: 11, color: colors.muted }, type.num]}>{formatGoalAmount(c.goal.type, c.value, state.units)}</Text> : null}
              </View>
            );
          })}
        </View>
        <Text style={{ fontSize: 13, color: colors.muted }}>Each week is measured against the goal you had that week.</Text>
      </Card>
    </Screen>
  );
}
