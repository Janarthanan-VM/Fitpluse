import { useState } from 'react';
import { Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useStore } from '../../data/store';
import { ACTIVITIES, formatClock, formatDistance, formatPaceOrSpeed } from '../../domain/metrics';
import { BackButton, Button, Card, Field, Screen, Sheet } from '../../ui/components';
import { syncPill } from '../../ui/WorkoutBits';
import { colors, type } from '../../ui/theme';

const EVENT_LABEL = { started: 'Started', paused: 'Paused', resumed: 'Resumed', finished: 'Finished', discarded: 'Discarded' };

export default function Detail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const store = useStore();
  const w = store.state.workouts.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(w?.title ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (!w) return <Redirect href="/activity" />;

  const start = new Date(w.startedAt);
  const pace = formatPaceOrSpeed(w.activityType, w.durationSec, w.distanceM, store.state.units);
  const timeline = w.events.map((e) => ({ label: EVENT_LABEL[e.type], at: new Date(e.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) }));

  return (
    <Screen>
      <BackButton />
      {editing ? (
        <View style={{ gap: 10 }}>
          <Field label="Workout title" value={draft} onChangeText={setDraft} autoFocus maxLength={60} invalid={!draft.trim()} helper={!draft.trim() ? 'Title can’t be empty.' : undefined} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => { setDraft(w.title); setEditing(false); }} />
            <Button label="Save" style={{ flex: 1 }} disabled={!draft.trim()} onPress={() => { store.renameWorkout(w.id, draft.trim()); setEditing(false); }} />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={{ flex: 1 }}>
            <Text accessibilityRole="header" style={type.title}>{w.title}</Text>
            <Text style={{ color: colors.muted, fontSize: 14 }}>
              {ACTIVITIES[w.activityType].label} · {start.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}, {start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </Text>
          </View>
          <Button label="Edit" variant="ghost" icon="pencil" style={{ minHeight: 44, paddingHorizontal: 10 }} onPress={() => setEditing(true)} />
        </View>
      )}
      <View style={{ alignItems: 'flex-start' }}>{syncPill(w)}</View>
      <Card style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 0, rowGap: 14 }}>
        <Stat label="Duration" value={formatClock(w.durationSec)} />
        <Stat label="Distance" value={formatDistance(w.distanceM, store.state.units)} />
        <Stat label={w.activityType === 'cycle' ? 'Avg speed' : 'Avg pace'} value={pace ?? 'Not recorded'} />
        <Stat label="Felt" value={w.rating ? { easy: 'Easy', right: 'Just right', hard: 'Hard' }[w.rating] : '—'} />
      </Card>
      <Card style={{ gap: 0 }}>
        <Text style={{ fontWeight: '800', fontSize: 15, color: colors.text, marginBottom: 6 }}>Timeline</Text>
        {timeline.map((t, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 }}>
            <Text style={[{ width: 72, fontSize: 13, color: colors.muted, fontWeight: '700' }, type.num]}>{t.at}</Text>
            <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 2, borderColor: colors.navy, backgroundColor: i === 0 || i === timeline.length - 1 ? colors.navy : colors.bg }} />
            <Text style={{ fontSize: 15, color: colors.text }}>{t.label}</Text>
          </View>
        ))}
      </Card>
      <Text style={{ fontSize: 13, color: colors.muted }}>Recorded on this phone. Distance and pace are GPS estimates.</Text>
      <Button label="Delete workout" variant="ghost" icon="trash-outline" onPress={() => setConfirmDelete(true)} />
      <Sheet visible={confirmDelete} title="Delete this workout?" body={`“${w.title}” will be removed from your history and your weekly progress will update. This can’t be undone.`} onClose={() => setConfirmDelete(false)}>
        <Button label="Delete workout" variant="danger" onPress={() => { setConfirmDelete(false); store.deleteWorkout(w.id); router.replace('/activity'); }} />
        <Button label="Cancel" variant="secondary" onPress={() => setConfirmDelete(false)} />
      </Sheet>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '50%' }}>
      <Text style={{ fontSize: 13, color: colors.muted }}>{label}</Text>
      <Text style={[{ fontSize: 20, fontWeight: '800', color: colors.text }, type.num]}>{value}</Text>
    </View>
  );
}
