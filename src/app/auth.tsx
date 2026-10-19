import { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useStore } from '../data/store';
import { AuthError, validateEmail, validatePassword } from '../services/auth';
import { BackButton, Button, Field, Notice, Screen, Title } from '../ui/components';
import { colors } from '../ui/theme';

export default function Auth() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const signin = mode === 'signin';
  const store = useStore();
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async () => {
    setTried(true);
    setInfo(null);
    const err = validateEmail(email) ?? (signin ? null : validatePassword(pw));
    if (err) return setError(err);
    setBusy(true);
    setError(null);
    try {
      if (signin) await store.signIn(email, pw);
      else await store.signUp(email, pw);
      router.replace('/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <BackButton />
      <Title sub={signin ? 'Sign in to see your workouts and progress.' : 'Your workouts are saved to your account.'}>
        {signin ? 'Welcome back' : 'Create your account'}
      </Title>
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" placeholder="name@example.com" invalid={tried && !!validateEmail(email)} />
      <Field label="Password" value={pw} onChangeText={setPw} secureTextEntry autoComplete={signin ? 'current-password' : 'new-password'} helper={signin ? undefined : 'At least 8 characters.'} invalid={tried && !signin && !!validatePassword(pw)} onSubmitEditing={submit} />
      {error ? <Notice tone="error" body={error} /> : null}
      {info ? <Notice tone="info" body={info} /> : null}
      {signin ? (
        <Text
          accessibilityRole="button"
          onPress={() => setInfo('Password reset arrives with online accounts. For now, delete the app data and create a new account.')}
          style={{ color: '#1F5FAF', fontWeight: '700', paddingVertical: 10 }}
        >
          Forgot password?
        </Text>
      ) : null}
      <View style={{ flex: 1 }} />
      <Button label={busy ? (signin ? 'Signing in…' : 'Creating account…') : signin ? 'Sign in' : 'Create account'} loading={busy} onPress={submit} />
      <Text style={{ fontSize: 12, color: colors.muted, textAlign: 'center' }}>In this first version your account is stored securely on this phone.</Text>
    </Screen>
  );
}
