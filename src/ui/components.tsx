import { ReactNode } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, space, type } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'onDark';

export function Button(props: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  big?: boolean;
}) {
  const v = props.variant ?? 'primary';
  const off = props.disabled || props.loading;
  const fg = off ? colors.disabledText : { primary: colors.navy, secondary: colors.navy, ghost: colors.navy, danger: '#FFFFFF', onDark: '#FFFFFF' }[v];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!props.loading }}
      disabled={off}
      onPress={props.onPress}
      style={({ pressed }) => [
        styles.btn,
        props.big && { minHeight: 60 },
        v === 'primary' && { backgroundColor: pressed ? colors.accentPressed : colors.accent },
        v === 'secondary' && { backgroundColor: pressed ? colors.soft : colors.bg, borderWidth: 1.5, borderColor: colors.navy },
        v === 'ghost' && { backgroundColor: pressed ? colors.soft : 'transparent' },
        v === 'danger' && { backgroundColor: colors.error.fg },
        v === 'onDark' && { borderWidth: 1.5, borderColor: '#FFFFFF', backgroundColor: pressed ? colors.navyRaised : 'transparent' },
        off && { backgroundColor: colors.disabledBg, borderColor: colors.disabledBg },
        props.style,
      ]}
    >
      {props.loading ? <ActivityIndicator color={fg} /> : props.icon ? <Ionicons name={props.icon} size={20} color={fg} /> : null}
      <Text style={[styles.btnText, { color: fg }, props.big && { fontSize: 18 }]}>{props.label}</Text>
    </Pressable>
  );
}

export function Screen(props: { children: ReactNode; scroll?: boolean; dark?: boolean; soft?: boolean; edges?: ('top' | 'bottom')[] }) {
  const bg = props.dark ? colors.navy : props.soft ? colors.soft : colors.bg;
  const body = props.scroll === false
    ? <View style={[styles.pad, { flex: 1 }]}>{props.children}</View>
    : <ScrollView contentContainerStyle={[styles.pad, { flexGrow: 1 }]} keyboardShouldPersistTaps="handled">{props.children}</ScrollView>;
  return <SafeAreaView edges={props.edges ?? ['top', 'bottom']} style={{ flex: 1, backgroundColor: bg }}>{body}</SafeAreaView>;
}

export function BackButton({ label = 'Back', onPress }: { label?: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress ?? (() => (router.canGoBack() ? router.back() : router.replace('/')))} style={styles.back} hitSlop={8}>
      <Ionicons name="chevron-back" size={22} color={colors.navy} />
      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.navy }}>{label}</Text>
    </Pressable>
  );
}

export function Card(props: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, props.style]}>{props.children}</View>;
}

export function Title({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text accessibilityRole="header" style={type.title}>{children}</Text>
      {sub ? <Text style={[type.body, { color: colors.muted }]}>{sub}</Text> : null}
    </View>
  );
}

type Tone = 'success' | 'warning' | 'error' | 'info' | 'neutral';
const TONE_ICON: Record<Tone, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle', warning: 'alert-circle', error: 'close-circle', info: 'information-circle', neutral: 'ellipse-outline',
};
function toneColors(t: Tone) {
  return t === 'neutral' ? { bg: colors.soft, fg: '#3D4C5E' } : colors[t];
}

/** Status is always icon + words + colour, never colour alone. */
export function Pill({ tone, label }: { tone: Tone; label: string }) {
  const c = toneColors(tone);
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]} accessible accessibilityLabel={label}>
      <Ionicons name={TONE_ICON[tone]} size={15} color={c.fg} />
      <Text style={{ color: c.fg, fontSize: 13, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function Notice({ tone, title, body, action }: { tone: Tone; title?: string; body: string; action?: ReactNode }) {
  const c = toneColors(tone);
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: c.bg, borderRadius: radius.md, padding: 14, gap: 6, flexDirection: 'row' }}>
      <Ionicons name={TONE_ICON[tone]} size={20} color={c.fg} />
      <View style={{ flex: 1, gap: 4 }}>
        {title ? <Text style={{ color: c.fg, fontWeight: '800', fontSize: 15 }}>{title}</Text> : null}
        <Text style={{ color: c.fg, fontSize: 14, lineHeight: 20 }}>{body}</Text>
        {action}
      </View>
    </View>
  );
}

export function Field(props: TextInputProps & { label: string; helper?: string; invalid?: boolean }) {
  const { label, helper, invalid, style, ...rest } = props;
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontWeight: '700', fontSize: 14, color: colors.text }}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#7A8899"
        style={[styles.input, invalid && { borderColor: colors.error.fg }, style]}
        {...rest}
      />
      {helper ? <Text style={type.caption}>{helper}</Text> : null}
    </View>
  );
}

export function Choice(props: { label: string; hint?: string; selected: boolean; onPress: () => void; icon?: keyof typeof Ionicons.glyphMap; style?: StyleProp<ViewStyle> }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      style={[styles.choice, props.selected && styles.choiceOn, props.style]}
    >
      {props.icon ? (
        <View style={styles.choiceIcon}><Ionicons name={props.icon} size={22} color={colors.accent} /></View>
      ) : (
        <View style={styles.radio}>{props.selected ? <View style={styles.radioDot} /> : null}</View>
      )}
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '800', fontSize: 16, color: colors.text }}>{props.label}</Text>
        {props.hint ? <Text style={type.caption}>{props.hint}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Segmented<T extends string>(props: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <View accessibilityRole="tablist" accessibilityLabel={props.label} style={styles.seg}>
      {props.options.map((o) => {
        const on = o.value === props.value;
        return (
          <Pressable key={o.value} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => props.onChange(o.value)} style={[styles.segItem, on && { backgroundColor: colors.navy }]}>
            <Text style={{ fontWeight: '700', color: on ? '#FFFFFF' : colors.navy }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Sheet(props: { visible: boolean; title: string; body: string; onClose: () => void; children: ReactNode }) {
  return (
    <Modal visible={props.visible} transparent animationType="slide" onRequestClose={props.onClose}>
      <View style={styles.scrim}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <View style={styles.grabber} />
          <Text accessibilityRole="header" style={{ fontSize: 22, fontWeight: '800', color: colors.text }}>{props.title}</Text>
          <Text style={[type.body, { color: '#3D4C5E' }]}>{props.body}</Text>
          <View style={{ gap: 10, marginTop: 6 }}>{props.children}</View>
        </View>
      </View>
    </Modal>
  );
}

export function Row(props: { title: string; sub?: string; onPress?: () => void; right?: ReactNode; last?: boolean }) {
  const inner = (
    <>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontWeight: '700', fontSize: 16, color: colors.text }}>{props.title}</Text>
        {props.sub ? <Text style={{ fontSize: 14, color: colors.muted }}>{props.sub}</Text> : null}
      </View>
      {props.right ?? (props.onPress ? <Ionicons name="chevron-forward" size={20} color={colors.muted} /> : null)}
    </>
  );
  const style = [styles.row, props.last && { borderBottomWidth: 0 }];
  return props.onPress ? <Pressable accessibilityRole="button" onPress={props.onPress} style={style}>{inner}</Pressable> : <View style={style}>{inner}</View>;
}

export const styles = StyleSheet.create({
  pad: { padding: space(2.5), gap: space(2) },
  btn: { minHeight: 52, borderRadius: radius.md, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontSize: 16, fontWeight: '800' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44, alignSelf: 'flex-start' },
  card: { backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line, borderRadius: radius.lg, padding: 16, gap: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999 },
  input: { minHeight: 52, borderWidth: 1.5, borderColor: '#8D9BAA', borderRadius: radius.md, paddingHorizontal: 14, fontSize: 16, color: colors.text, backgroundColor: colors.bg },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: colors.line, borderRadius: radius.md, padding: 14, minHeight: 56, backgroundColor: colors.bg },
  choiceOn: { borderColor: colors.navy, backgroundColor: '#EAF8F1', borderWidth: 2 },
  choiceIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.navy, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.navy },
  seg: { flexDirection: 'row', backgroundColor: colors.soft, borderRadius: radius.md, padding: 4, gap: 4 },
  segItem: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  scrim: { flex: 1, backgroundColor: 'rgba(18,35,56,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.bg, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 32, gap: 10 },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.line, alignSelf: 'center', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E6EBEF' },
});
