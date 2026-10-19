import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../data/store';
import { Button, Card, Screen, Title } from '../../ui/components';
import { Steps } from '../../ui/Steps';
import { colors, type } from '../../ui/theme';

const ITEMS: { icon: keyof typeof Ionicons.glyphMap; title: string; why: string; ifNo: string }[] = [
  {
    icon: 'location-outline',
    title: 'Location, only during outdoor workouts',
    why: 'Measures distance and pace for walks, runs and rides. We ask the first time you start one, never in the background.',
    ifNo: 'You can still track time for every workout.',
  },
  {
    icon: 'lock-closed-outline',
    title: 'Your data stays yours',
    why: 'Workouts are saved on this phone first. You can delete your account and all data from Profile at any time.',
    ifNo: 'Nothing is shared with other apps unless you turn it on.',
  },
];

export default function PermissionsIntro() {
  const store = useStore();
  return (
    <Screen>
      <Steps step={3} />
      <Title sub="Here’s what we ask for, why, and what still works if you say no.">Before your first workout</Title>
      {ITEMS.map((it) => (
        <Card key={it.title}>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <Ionicons name={it.icon} size={24} color={colors.navy} />
            <Text style={{ flex: 1, fontSize: 17, fontWeight: '800', color: colors.text }}>{it.title}</Text>
          </View>
          <Text style={type.body}>{it.why}</Text>
          <Text style={[type.body, { color: colors.muted, fontSize: 15 }]}>
            <Text style={{ fontWeight: '800', color: colors.text }}>If you say no: </Text>
            {it.ifNo}
          </Text>
        </Card>
      ))}
      <View style={{ flex: 1 }} />
      <Button
        label="Go to my dashboard"
        onPress={() => {
          store.completeOnboarding();
          router.replace('/home');
        }}
      />
    </Screen>
  );
}
