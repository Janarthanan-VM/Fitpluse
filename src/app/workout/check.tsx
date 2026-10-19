import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../data/store';
import { ACTIVITIES } from '../../domain/metrics';
import { ActivityType } from '../../domain/types';
import { locationStatus, PermissionState, requestLocation } from '../../services/location';
import { BackButton, Button, Card, Screen, Title } from '../../ui/components';
import { colors, type } from '../../ui/theme';

/** Pre-workout check: resolves blockers before the timer starts, and never blocks a time-only workout. */
export default function Check() {
  const params = useLocalSearchParams<{ activity?: string; plan?: string }>();
  const activity = (params.activity && params.activity in ACTIVITIES ? params.activity : 'walk') as ActivityType;
  const plan = params.plan ? Number(params.plan) : null;
  const act = ACTIVITIES[activity];
  const store = useStore();
  const [loc, setLoc] = useState<PermissionState | null>(act.outdoor ? null : 'denied');
  const [withoutDistance, setWithoutDistance] = useState(false);
  const starting = store.state.active?.status === 'starting';

  useEffect(() => {
    if (act.outdoor) locationStatus().then(setLoc);
  }, [act.outdoor]);

  // The timer begins only once the session is created and saved; then we confirm and open the live screen.
  useEffect(() => {
    if (!starting) return;
    const t = setTimeout(() => {
      store.confirmStart();
      router.replace('/workout/live');
    }, 600);
    return () => clearTimeout(t);
  }, [starting]);

  useEffect(() => {
    if (store.state.active && store.state.active.status !== 'starting') router.replace('/workout/live');
  }, []);

  const tracksDistance = act.outdoor && loc === 'granted' && !withoutDistance;
  const needsDecision = act.outdoor && loc === 'undetermined' && !withoutDistance;

  return (
    <Screen>
      <BackButton label="Change activity" />
      <View>
        <Text style={type.eyebrow}>Ready check</Text>
        <Title>{act.label}</Title>
      </View>

      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <CheckRow ok title="Timer" detail={plan ? `${plan} minute plan. You can keep going past it.` : 'Open session. Finish whenever you like.'} />
        {act.outdoor ? (
          tracksDistance ? <CheckRow ok title="Location" detail="Distance and pace on" last />
            : loc === null ? <CheckRow title="Location" detail="Checking…" last />
            : withoutDistance ? <CheckRow title="Location" detail="Off for this workout. Time only." last />
            : loc === 'denied' ? <CheckRow title="Location" detail="Location is off, so distance and pace won’t be recorded. Time still works." last action={{ label: 'Open settings', onPress: () => Linking.openSettings().catch(() => {}) }} />
            : <CheckRow title="Location" detail="Needed to measure distance and pace." last />
        ) : <CheckRow ok title="Tracking" detail="Time only for general workouts" last />}
      </Card>

      {needsDecision ? (
        <Card style={{ backgroundColor: colors.soft, borderWidth: 0 }}>
          <Text style={{ fontWeight: '800', fontSize: 17, color: colors.text }}>Use location for distance?</Text>
          <Text style={type.body}>FitPulse uses GPS only while this workout is recording. If you say no, you can still track time.</Text>
          <Button label="Continue to permission prompt" onPress={async () => setLoc(await requestLocation())} />
          <Button label="Track without distance" variant="secondary" onPress={() => setWithoutDistance(true)} />
        </Card>
      ) : null}

      <View style={{ flex: 1 }} />
      {starting ? <Text accessibilityLiveRegion="polite" style={{ textAlign: 'center', color: colors.muted }}>Getting ready. The timer starts once tracking has begun.</Text> : null}
      <Button
        big
        label={starting ? 'Starting…' : `Start ${act.label.toLowerCase()}`}
        loading={starting}
        disabled={needsDecision || (act.outdoor && loc === null)}
        onPress={() => store.beginSession(activity, plan, tracksDistance)}
      />
    </Screen>
  );
}

function CheckRow(props: { ok?: boolean; title: string; detail: string; last?: boolean; action?: { label: string; onPress: () => void } }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 14, borderBottomWidth: props.last ? 0 : 1, borderBottomColor: '#E6EBEF' }}>
      <Ionicons name={props.ok ? 'checkmark-circle' : 'alert-circle'} size={26} color={props.ok ? colors.success.fg : colors.warning.fg} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontWeight: '800', fontSize: 15, color: colors.text }}>{props.title}</Text>
        <Text style={{ fontSize: 14, color: colors.muted }}>{props.detail}</Text>
        {props.action ? <Text accessibilityRole="button" onPress={props.action.onPress} style={{ color: '#1F5FAF', fontWeight: '700', paddingVertical: 6 }}>{props.action.label}</Text> : null}
      </View>
    </View>
  );
}
