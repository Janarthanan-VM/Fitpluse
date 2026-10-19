import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../data/store';
import { ACTIVITIES } from '../../domain/metrics';
import { ActivityType } from '../../domain/types';
import { BackButton, Button, Choice, Screen, Title } from '../../ui/components';
import { ACTIVITY_ICON } from '../../ui/WorkoutBits';
import { colors } from '../../ui/theme';

const PLANS: { value: number | null; label: string }[] = [
  { value: null, label: 'Open' }, { value: 20, label: '20 min' }, { value: 30, label: '30 min' }, { value: 45, label: '45 min' },
];

export default function Select() {
  const { state } = useStore();
  const [activity, setActivity] = useState<ActivityType>(state.workouts[0]?.activityType ?? 'walk');
  const [plan, setPlan] = useState<number | null>(null);
  return (
    <Screen>
      <BackButton />
      <Title>What are you doing?</Title>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {(Object.keys(ACTIVITIES) as ActivityType[]).map((k) => (
          <Choice key={k} style={{ flexBasis: '47%', flexGrow: 1 }} icon={ACTIVITY_ICON[k]} label={ACTIVITIES[k].label} hint={ACTIVITIES[k].metrics} selected={activity === k} onPress={() => setActivity(k)} />
        ))}
      </View>
      <Text style={{ fontWeight: '800', fontSize: 15, color: colors.text }}>Planned length <Text style={{ fontWeight: '500', color: colors.muted }}>(optional)</Text></Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {PLANS.map((p) => {
          const on = p.value === plan;
          return (
            <Pressable key={p.label} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => setPlan(p.value)}
              style={{ minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: on ? colors.navy : colors.line, backgroundColor: on ? colors.navy : colors.bg, justifyContent: 'center' }}>
              <Text style={{ fontWeight: '700', color: on ? '#FFFFFF' : colors.navy }}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <View style={{ flex: 1 }} />
      <Button label="Continue" onPress={() => router.push({ pathname: '/workout/check', params: { activity, plan: plan ? String(plan) : '' } })} />
    </Screen>
  );
}
