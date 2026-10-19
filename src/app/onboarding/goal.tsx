import { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../data/store';
import { GOAL_PRESETS, formatGoalAmount, goalAt } from '../../domain/progress';
import { GoalType } from '../../domain/types';
import { BackButton, Button, Card, Choice, Screen, Title } from '../../ui/components';
import { Steps } from '../../ui/Steps';
import { colors, type } from '../../ui/theme';

export default function GoalScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const editing = mode === 'edit';
  const store = useStore();
  const current = goalAt(store.state.goals, new Date());
  const [goalType, setGoalType] = useState<GoalType>(current?.type ?? 'workouts');
  const [target, setTarget] = useState<number>(current?.target ?? GOAL_PRESETS.workouts.def);
  const p = GOAL_PRESETS[goalType];

  const pick = (t: GoalType) => {
    setGoalType(t);
    setTarget(t === current?.type ? current.target : GOAL_PRESETS[t].def);
  };
  const save = () => {
    store.setGoal({ type: goalType, target });
    if (editing) router.back();
    else router.push('/onboarding/permissions');
  };

  return (
    <Screen>
      {editing ? <BackButton label="Profile" /> : <Steps step={2} />}
      <Title sub="Start realistic. You can change it any time, and past weeks keep the goal they had.">Choose a weekly goal</Title>
      <View accessibilityRole="radiogroup" style={{ gap: 10 }}>
        {(Object.keys(GOAL_PRESETS) as GoalType[]).map((k) => (
          <Choice key={k} label={GOAL_PRESETS[k].label} hint={GOAL_PRESETS[k].hint} selected={goalType === k} onPress={() => pick(k)} />
        ))}
      </View>
      <Card style={{ backgroundColor: colors.soft, borderWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button label="−" variant="secondary" style={{ width: 56, paddingHorizontal: 0 }} onPress={() => setTarget(Math.max(p.min, target - p.step))} />
        <View style={{ alignItems: 'center' }} accessibilityLiveRegion="polite">
          <Text style={[{ fontSize: 32, fontWeight: '800', color: colors.text }, type.num]}>{formatGoalAmount(goalType, target, store.state.units)}</Text>
          <Text style={type.caption}>per week</Text>
        </View>
        <Button label="+" variant="secondary" style={{ width: 56, paddingHorizontal: 0 }} onPress={() => setTarget(Math.min(p.max, target + p.step))} />
      </Card>
      <View style={{ flex: 1 }} />
      <Button label={editing ? 'Save goal' : 'Continue'} onPress={save} />
    </Screen>
  );
}
