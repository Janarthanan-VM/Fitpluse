import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../data/store';
import { formatGoalAmount, goalAt } from '../../domain/progress';
import { Button, Card, Row, Screen, Segmented, Sheet } from '../../ui/components';
import { ActiveSessionBar } from '../../ui/WorkoutBits';
import { colors, type } from '../../ui/theme';

export default function Profile() {
  const store = useStore();
  const { state } = store;
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const goal = goalAt(state.goals, new Date());
  const name = state.account?.name || 'You';
  const pending = state.workouts.filter((w) => w.syncState === 'pending').length;

  return (
    <Screen edges={['top']}>
      <ActiveSessionBar />
      <Text accessibilityRole="header" style={type.title}>Profile</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 22 }}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>{name}</Text>
          <Text style={{ fontSize: 14, color: colors.muted }}>{state.account?.email}</Text>
        </View>
      </View>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        <Row title="Weekly goal" sub={goal ? `${formatGoalAmount(goal.type, goal.target, state.units)} per week` : 'Not set'} onPress={() => router.push({ pathname: '/onboarding/goal', params: { mode: 'edit' } })} />
        <View style={{ paddingVertical: 12, gap: 8, borderBottomWidth: 1, borderBottomColor: '#E6EBEF' }}>
          <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>Units</Text>
          <Segmented label="Units" value={state.units} onChange={store.setUnits} options={[{ value: 'metric', label: 'Kilometres' }, { value: 'imperial', label: 'Miles' }]} />
        </View>
        <Row
          title="Sync"
          sub={!store.syncEnabled ? 'Workouts are saved on this phone' : pending ? `${pending} waiting to sync` : 'Everything is synced'}
          right={store.syncEnabled && pending ? <Button label="Retry" variant="secondary" onPress={store.retrySync} style={{ minHeight: 40 }} /> : undefined}
        />
        <Row title="Watch" sub="Watch app is coming in a later update" />
        <Row title="Privacy and data" sub="Permissions, privacy policy, delete account" onPress={() => router.push('/privacy')} last />
      </Card>
      <Button label="Sign out" variant="secondary" onPress={() => setConfirmSignOut(true)} />
      <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>FitPulse is for general wellness. It does not diagnose or monitor medical conditions.</Text>

      <Sheet visible={confirmSignOut} title="Sign out?" body={state.active ? 'Your workout in progress will be discarded. Saved workouts stay on this phone.' : 'Your saved workouts stay on this phone for when you sign back in.'} onClose={() => setConfirmSignOut(false)}>
        <Button label="Sign out" onPress={() => { setConfirmSignOut(false); store.signOut(); router.replace('/welcome'); }} />
        <Button label="Cancel" variant="secondary" onPress={() => setConfirmSignOut(false)} />
      </Sheet>
    </Screen>
  );
}
