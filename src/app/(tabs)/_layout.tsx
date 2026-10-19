import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../ui/theme';

const TABS: { name: string; title: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'home', title: 'Home', icon: 'home-outline' },
  { name: 'activity', title: 'Activity', icon: 'pulse' },
  { name: 'progress', title: 'Progress', icon: 'bar-chart-outline' },
  { name: 'profile', title: 'Profile', icon: 'person-circle-outline' },
];

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 12, fontWeight: '700' },
        tabBarStyle: { borderTopColor: colors.line, ...(Platform.OS === 'web' ? { height: 64, paddingBottom: 8 } : null) },
      }}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.title, tabBarIcon: ({ color, size }) => <Ionicons name={t.icon} size={size} color={color as string} /> }} />
      ))}
    </Tabs>
  );
}
