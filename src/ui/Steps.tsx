import { Text, View } from 'react-native';
import { colors, type } from './theme';

export function Steps({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <View style={{ gap: 10 }} accessible accessibilityLabel={`Step ${step} of ${total}`}>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <View key={i} style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i < step ? colors.navy : colors.line }} />
        ))}
      </View>
      <Text style={type.eyebrow}>Step {step} of {total}</Text>
    </View>
  );
}
