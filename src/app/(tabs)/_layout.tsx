import { Tabs } from 'expo-router';

import { CowTabBar } from '@/components/tab-bar';

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CowTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="browse" />
      <Tabs.Screen name="donate" />
      <Tabs.Screen name="hours" />
      <Tabs.Screen name="me" />
    </Tabs>
  );
}
