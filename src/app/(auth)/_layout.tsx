import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'welcome' };

/** Signed-out screens: Welcome -> birthday -> sign in -> code. */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="birthday" />
      <Stack.Screen name="too-young" options={{ gestureEnabled: false }} />
      <Stack.Screen name="sign-in" />
      <Stack.Screen name="verify" />
    </Stack>
  );
}
