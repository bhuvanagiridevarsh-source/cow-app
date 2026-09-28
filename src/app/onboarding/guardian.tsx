import { router } from 'expo-router';
import { useState } from 'react';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { isValidEmail, normalizeEmail } from '@/domain/auth';
import { useDeviceState } from '@/features/device-state';

/** Ages 13-17: a parent or guardian's name, email, and consent (brief §3). */
export default function OnboardingGuardian() {
  const { draft, updateDraft } = useDeviceState();
  const [name, setName] = useState(draft.guardianName ?? '');
  const [email, setEmail] = useState(draft.guardianEmail ?? '');
  const [consent, setConsent] = useState(draft.guardianConsent ?? false);
  const [error, setError] = useState<string | null>(null);

  const next = () => {
    if (name.trim().length < 1) return setError("Please enter your parent or guardian's name.");
    if (!isValidEmail(email)) return setError("Please enter your parent or guardian's email.");
    if (!consent) return setError('Please check the box to confirm your parent or guardian agrees.');
    setError(null);
    updateDraft({ guardianName: name.trim(), guardianEmail: normalizeEmail(email), guardianConsent: true });
    router.push('/onboarding/terms');
  };

  return (
    <Screen keyboard>
      <ScreenHeader />
      <AppText variant="title">Your parent or guardian</AppText>
      <AppText color="muted">
        Because you&apos;re under 18, we need a parent or guardian to know you&apos;re using CoW. We
        only contact them about your account if we need to.
      </AppText>
      <TextField
        label="Their name"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
        autoComplete="off"
        maxLength={80}
      />
      <TextField
        label="Their email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="off"
      />
      <Checkbox
        label="My parent or guardian knows I'm using the CoW app and agrees."
        checked={consent}
        onChange={setConsent}
      />
      <FormMessage message={error} />
      <Button label="Continue" onPress={next} />
    </Screen>
  );
}
