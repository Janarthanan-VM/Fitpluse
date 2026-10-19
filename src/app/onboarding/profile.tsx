import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../../data/store';
import { Units } from '../../domain/types';
import { Button, Choice, Field, Screen, Title } from '../../ui/components';
import { Steps } from '../../ui/Steps';

export default function ProfileSetup() {
  const store = useStore();
  const [name, setName] = useState(store.state.account?.name ?? '');
  const [units, setUnits] = useState<Units>(store.state.units);
  return (
    <Screen>
      <Steps step={1} />
      <Title sub="We only ask for what the app uses. You can change these later.">A little about you</Title>
      <Field label="What should we call you? (optional)" value={name} onChangeText={setName} placeholder="Your first name" autoComplete="given-name" />
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Choice style={{ flex: 1 }} label="Metric" hint="km" selected={units === 'metric'} onPress={() => setUnits('metric')} />
        <Choice style={{ flex: 1 }} label="Imperial" hint="miles" selected={units === 'imperial'} onPress={() => setUnits('imperial')} />
      </View>
      <View style={{ flex: 1 }} />
      <Button
        label="Continue"
        onPress={() => {
          store.setProfile(name, units);
          router.push('/onboarding/goal');
        }}
      />
    </Screen>
  );
}
