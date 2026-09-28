import { Stack } from 'expo-router';

export const unstable_settings = { initialRouteName: 'index' };

/** Finish sign-up: birthday (if needed) -> details -> guardian (13-17) -> Terms. */
export default function OnboardingLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
