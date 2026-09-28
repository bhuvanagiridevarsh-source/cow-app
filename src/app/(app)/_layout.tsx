import { Stack } from 'expo-router';

/** Everything for signed-in people who finished sign-up: the tabs plus screens opened from them. */
export default function AppLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
