import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';
import { useDeviceState } from '@/features/device-state';

/** Picks the right first step. (A saved profile here only means the Terms changed.) */
export default function OnboardingStart() {
  const { profile } = useAuth();
  const { draft } = useDeviceState();
  if (profile) return <Redirect href="/onboarding/terms" />;
  if (!draft.birthYear || !draft.birthMonth) return <Redirect href="/onboarding/birthday" />;
  return <Redirect href="/onboarding/details" />;
}
