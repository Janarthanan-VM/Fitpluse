import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Screen } from '../ui/components';
import { colors } from '../ui/theme';

const POINTS = ['Start a workout in two taps', 'Keeps recording if you lose signal', 'You choose what data is shared'];

export default function Welcome() {
  return (
    <Screen dark>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24 }}>
        <Ionicons name="pulse" size={32} color={colors.accent} />
        <Text style={{ color: '#FFFFFF', fontSize: 22, fontWeight: '800' }}>FitPulse</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', gap: 18 }}>
        <Text accessibilityRole="header" style={{ color: '#FFFFFF', fontSize: 40, lineHeight: 44, fontWeight: '800', letterSpacing: -1 }}>Move with purpose.</Text>
        <Text style={{ color: '#C9D3DD', fontSize: 18, lineHeight: 26 }}>Set a weekly goal, track your workouts, and watch your progress build week by week.</Text>
        <View style={{ gap: 12, marginTop: 8 }}>
          {POINTS.map((p) => (
            <View key={p} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} />
              <Text style={{ color: '#E4EAF0', fontSize: 16 }}>{p}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={{ gap: 12 }}>
        <Button label="Create account" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signup' } })} />
        <Button label="Sign in" variant="onDark" onPress={() => router.push({ pathname: '/auth', params: { mode: 'signin' } })} />
        <Text style={{ color: colors.onDarkMuted, fontSize: 13, textAlign: 'center' }}>FitPulse is for general wellness. It doesn’t diagnose or monitor medical conditions.</Text>
      </View>
    </Screen>
  );
}
