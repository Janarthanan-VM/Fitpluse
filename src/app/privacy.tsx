import { useCallback, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useStore } from '../data/store';
import { locationStatus, PermissionState } from '../services/location';
import { BackButton, Button, Card, Pill, Row, Screen, Sheet, Title } from '../ui/components';
import { colors, type } from '../ui/theme';

export default function Privacy() {
  const store = useStore();
  const [loc, setLoc] = useState<PermissionState | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);

  useFocusEffect(useCallback(() => { locationStatus().then(setLoc); }, []));

  const locPill = loc === 'granted' ? <Pill tone="success" label="Allowed" /> : loc === 'denied' ? <Pill tone="neutral" label="Off" /> : <Pill tone="info" label="Not asked yet" />;

  return (
    <Screen>
      <BackButton label="Profile" />
      <Title>Privacy and data</Title>
      <Card style={{ paddingVertical: 4, gap: 0 }}>
        <Row title="Location" sub="Distance and pace, only while a workout records" right={locPill} />
        <Row title="Health app sharing" sub="Off. Coming in a later update" right={<Pill tone="neutral" label="Off" />} last />
      </Card>
      <Button label="Open system settings" variant="secondary" onPress={() => Linking.openSettings().catch(() => {})} />
      <Card>
        <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>What we store</Text>
        <Text style={type.body}>Your email, name, units, goals and the workouts you save: type, start and end time, duration and distance. We don’t keep your GPS route after a workout ends, and nothing goes to analytics or advertisers.</Text>
      </Card>
      <Card style={{ borderColor: '#F2C4BF' }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>Delete account</Text>
        <Text style={[type.body, { color: '#3D4C5E' }]}>Removes your account, goals and {store.state.workouts.length === 1 ? 'your workout' : `all ${store.state.workouts.length} workouts`} from this phone. This can’t be undone.</Text>
        <Button label="Delete account and data" variant="secondary" style={{ borderColor: colors.error.fg }} onPress={() => setConfirm(true)} />
      </Card>
      <Sheet visible={confirm} title="Delete your account?" body="Your profile, goals and every workout will be permanently deleted. You’ll need to create a new account to use FitPulse again." onClose={() => setConfirm(false)}>
        <Button label="Delete account and data" variant="danger" loading={busy} onPress={async () => {
          setBusy(true);
          await store.deleteAccount();
          setBusy(false);
          setConfirm(false);
          router.replace('/welcome');
        }} />
        <Button label="Cancel" variant="secondary" onPress={() => setConfirm(false)} />
      </Sheet>
      <View style={{ height: 8 }} />
    </Screen>
  );
}
