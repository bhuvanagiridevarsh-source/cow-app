import { router } from 'expo-router';
import { useState } from 'react';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { TextLink } from '@/components/ui/text-link';
import { ageGroup, nyToday } from '@/domain/age';
import { useAuth } from '@/features/auth/auth-provider';
import { BirthdayForm } from '@/features/auth/birthday-form';
import { useEndUnder13 } from '@/features/auth/use-end-under-13';
import { useDeviceState } from '@/features/device-state';

/** Asked here only if we don't already have it (e.g. the person used "I already have an account"). */
export default function OnboardingBirthday() {
  const { draft, updateDraft } = useDeviceState();
  const { signOut } = useAuth();
  const endUnder13 = useEndUnder13();
  const [busy, setBusy] = useState(false);
  return (
    <Screen keyboard>
      <AppText variant="title">When were you born?</AppText>
      <AppText color="muted">We ask everyone. It helps keep CoW safe for students.</AppText>
      <BirthdayForm
        busy={busy}
        onSubmit={async (birthYear, birthMonth) => {
          if (ageGroup(birthYear, birthMonth, nyToday()) === 'too_young') {
            setBusy(true);
            await endUnder13(birthYear, birthMonth);
            return;
          }
          updateDraft({ birthYear, birthMonth });
          router.replace('/onboarding/details');
        }}
      />
      {!draft.role ? (
        <TextLink label="Use a different account" onPress={() => void signOut('thisDevice')} />
      ) : null}
    </Screen>
  );
}
