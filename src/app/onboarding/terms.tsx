import { Redirect, router } from 'expo-router';
import { useState } from 'react';

import { LegalText } from '@/components/legal-text';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextLink } from '@/components/ui/text-link';
import { acceptTerms, completeProfile } from '@/features/auth/api';
import { friendlyAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/auth-provider';
import { useEndUnder13 } from '@/features/auth/use-end-under-13';
import { useDeviceState } from '@/features/device-state';
import { errorCode } from '@/features/errors';
import { TERMS_MD, TERMS_VERSION } from '@/legal';

/** Last step of sign-up (or: the Terms changed and need accepting again). */
export default function OnboardingTerms() {
  const { profile, reloadProfile } = useAuth();
  const { draft, clearDraft } = useDeviceState();
  const endUnder13 = useEndUnder13();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updating = profile !== null;

  const ready = updating || (draft.name && draft.zip && draft.role && draft.birthYear && draft.birthMonth);
  if (!ready) return <Redirect href="/onboarding" />;

  const finish = async () => {
    if (!agreed) return setError('Please check the box to accept the Terms of Use.');
    setBusy(true);
    setError(null);
    try {
      if (updating) {
        await acceptTerms(TERMS_VERSION);
      } else {
        await completeProfile({
          name: draft.name as string,
          zip: draft.zip as string,
          role: draft.role!,
          birthYear: draft.birthYear as number,
          birthMonth: draft.birthMonth as number,
          termsVersion: TERMS_VERSION,
          guardianName: draft.guardianName,
          guardianEmail: draft.guardianEmail,
          guardianConsent: draft.guardianConsent,
        });
        clearDraft();
      }
      await reloadProfile(); // the app opens by itself once the profile is saved
    } catch (e) {
      if (!updating && errorCode(e) === 'COW_UNDER_13') {
        await endUnder13(draft.birthYear as number, draft.birthMonth as number);
        return;
      }
      setError(friendlyAuthError(e));
      setBusy(false);
    }
  };

  return (
    <Screen>
      {!updating ? <ScreenHeader /> : null}
      <AppText variant="title">{updating ? 'We updated our Terms' : 'Last step: our Terms'}</AppText>
      <AppText color="muted">
        Please read CoW&apos;s Terms of Use. They include our zero-tolerance rule for abuse and fake
        listings, and the safety rules for pickups.
      </AppText>
      <Card>
        <LegalText markdown={TERMS_MD} />
      </Card>
      <TextLink label="Read the Privacy Policy" onPress={() => router.push('/legal/privacy')} />
      <Checkbox label="I have read and agree to the Terms of Use." checked={agreed} onChange={setAgreed} />
      <FormMessage message={error} />
      <Button label={updating ? 'Accept and continue' : 'Finish sign-up'} onPress={() => void finish()} loading={busy} />
    </Screen>
  );
}
