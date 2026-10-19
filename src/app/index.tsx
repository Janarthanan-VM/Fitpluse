import { Redirect } from 'expo-router';
import { useStore } from '../data/store';

/** Launch: restore state, then route to the right place. An unfinished workout is resumed first. */
export default function Launch() {
  const { state } = useStore();
  if (!state.account || !state.signedIn) return <Redirect href="/welcome" />;
  if (!state.onboarded) return <Redirect href="/onboarding/profile" />;
  if (state.active && state.active.status !== 'starting') return <Redirect href="/workout/live" />;
  return <Redirect href="/home" />;
}
