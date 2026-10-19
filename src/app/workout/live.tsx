import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useNow, useStore } from '../../data/store';
import { elapsedSeconds } from '../../domain/session';
import { ACTIVITIES, distanceUnit, formatClock, formatPaceOrSpeed, toDisplayDistance } from '../../domain/metrics';
import { watchLocation } from '../../services/location';
import { Button, Screen, Sheet } from '../../ui/components';
import { colors, type } from '../../ui/theme';

export default function Live() {
  // Keep the screen on during a workout where the device allows it; never fail the workout if it can't.
  useEffect(() => {
    activateKeepAwakeAsync('live-workout').catch(() => {});
    return () => { deactivateKeepAwake('live-workout').catch(() => {}); };
  }, []);
  const store = useStore();
  const a = store.state.active;
  const now = useNow(500);
  const [sheet, setSheet] = useState<null | 'finish' | 'discard'>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const recording = a?.status === 'active';
  const tracksDistance = a?.distanceM !== null && a?.distanceM !== undefined;

  useEffect(() => {
    if (!recording || !tracksDistance) return;
    let stop: (() => void) | null = null;
    let cancelled = false;
    watchLocation(
      (p) => { setGpsError(null); store.addPoint(p); },
      () => setGpsError('GPS signal lost. Time is still recording; distance resumes when the signal returns.'),
    ).then((fn) => (cancelled ? fn() : (stop = fn)));
    return () => { cancelled = true; stop?.(); };
  }, [recording, tracksDistance]);

  if (!a) return <Redirect href="/home" />;

  const act = ACTIVITIES[a.activityType];
  const sec = elapsedSeconds(a, now);
  const paused = a.status === 'paused';
  const u = distanceUnit(store.state.units);
  const pace = formatPaceOrSpeed(a.activityType, sec, a.distanceM, store.state.units);
  const left = a.plannedMinutes ? a.plannedMinutes * 60 - sec : null;

  const finish = () => {
    const id = store.finishSession();
    setSheet(null);
    if (id) router.replace({ pathname: '/workout/summary', params: { id } });
  };

  return (
    <Screen dark scroll={false}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Pressable accessibilityRole="button" accessibilityLabel="Minimize workout" onPress={() => router.replace('/home')} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 4 }}>
          <Ionicons name="chevron-down" size={22} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 15 }}>Minimize</Text>
        </Pressable>
        <View accessibilityRole="text" accessibilityLiveRegion="polite" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: paused ? colors.pause : colors.accent, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 }}>
          <Ionicons name={paused ? 'pause' : 'radio-button-on'} size={14} color={colors.navy} />
          <Text style={{ color: colors.navy, fontWeight: '800' }}>{paused ? 'Paused' : 'Recording'}</Text>
        </View>
      </View>

      <View style={{ alignItems: 'center', marginTop: 12 }}>
        <Text style={{ color: '#C9D3DD', fontWeight: '700', fontSize: 17 }}>{act.label}</Text>
        <Text accessibilityLabel={`Elapsed ${formatClock(sec)}`} style={[{ color: paused ? colors.pause : '#FFFFFF', fontSize: 84, fontWeight: '800', letterSpacing: -2 }, type.num]}>{formatClock(sec)}</Text>
        <Text style={{ color: colors.onDarkMuted, fontSize: 14 }}>
          {left === null ? 'Open session' : left > 0 ? `${formatClock(left)} left of your ${a.plannedMinutes} min plan` : `${a.plannedMinutes} min plan done. Keep going or finish.`}
        </Text>
      </View>

      {act.outdoor ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Metric label="Distance" value={tracksDistance ? toDisplayDistance(a.distanceM ?? 0, store.state.units).toFixed(2) : null} unit={u} why="Location is off" />
          <Metric label={a.activityType === 'cycle' ? 'Avg speed' : 'Avg pace'} value={tracksDistance ? pace ?? '—' : null} unit="" why="Needs location" />
        </View>
      ) : null}

      {gpsError && recording ? (
        <View accessibilityRole="alert" style={{ flexDirection: 'row', gap: 10, backgroundColor: colors.pause, borderRadius: 12, padding: 12, marginTop: 8 }}>
          <Ionicons name="warning" size={18} color={colors.navy} />
          <Text style={{ flex: 1, color: colors.navy, fontSize: 14 }}>{gpsError}</Text>
        </View>
      ) : null}

      <View style={{ flex: 1 }} />
      {paused ? (
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Button big variant="onDark" icon="stop" label="Finish" style={{ flex: 1, minHeight: 64 }} onPress={() => setSheet('finish')} />
          <Button big icon="play" label="Resume" style={{ flex: 1, minHeight: 64 }} onPress={store.resume} />
        </View>
      ) : (
        <View style={{ alignItems: 'center' }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Pause workout" onPress={store.pause}
            style={({ pressed }) => ({ width: 108, height: 108, borderRadius: 54, backgroundColor: pressed ? '#F2C35F' : colors.pause, alignItems: 'center', justifyContent: 'center', gap: 2 })}>
            <Ionicons name="pause" size={34} color={colors.navy} />
            <Text style={{ color: colors.navy, fontWeight: '800' }}>Pause</Text>
          </Pressable>
          <Text style={{ color: colors.onDarkMuted, fontSize: 13, marginTop: 10 }}>Pause first to finish or discard</Text>
        </View>
      )}

      <Sheet visible={sheet === 'finish'} title={`Finish this ${act.label.toLowerCase()}?`} body={`${formatClock(sec)} recorded${tracksDistance ? ` · ${toDisplayDistance(a.distanceM ?? 0, store.state.units).toFixed(2)} ${u}` : ''}. It will be saved to your history.`} onClose={() => setSheet(null)}>
        <Button label="Finish and save" onPress={finish} />
        <Button label="Keep going" variant="secondary" onPress={() => { setSheet(null); store.resume(); }} />
        <Button label="Discard workout" variant="ghost" onPress={() => setSheet('discard')} style={{ minHeight: 44 }} />
      </Sheet>
      <Sheet visible={sheet === 'discard'} title="Discard this workout?" body={`${formatClock(sec)} of tracking will be deleted. This can’t be undone.`} onClose={() => setSheet(null)}>
        <Button label="Discard workout" variant="danger" onPress={() => { setSheet(null); store.discardSession(); router.replace('/home'); }} />
        <Button label="Keep workout" variant="secondary" onPress={() => setSheet('finish')} />
      </Sheet>
    </Screen>
  );
}

function Metric({ label, value, unit, why }: { label: string; value: string | null; unit: string; why: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: colors.navyRaised, borderRadius: 14, padding: 14, minHeight: 88 }}>
      <Text style={{ color: colors.onDarkMuted, fontWeight: '700', fontSize: 13 }}>{label}</Text>
      {value !== null ? (
        <Text style={[{ color: '#FFFFFF', fontSize: 28, fontWeight: '800' }, type.num]}>{value} <Text style={{ fontSize: 14, color: '#C9D3DD' }}>{unit}</Text></Text>
      ) : (
        <>
          <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '800', marginTop: 4 }}>Unavailable</Text>
          <Text style={{ color: colors.onDarkMuted, fontSize: 12 }}>{why}</Text>
        </>
      )}
    </View>
  );
}
