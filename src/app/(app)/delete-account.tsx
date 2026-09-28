import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useState } from 'react';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { deleteMyAccount } from '@/features/auth/api';
import { friendlyAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/auth-provider';
import { useDeviceState } from '@/features/device-state';

/** Delete account (required by Apple and Google). Two taps so it can't happen by accident. */
export default function DeleteAccountScreen() {
  const { userId, signOut } = useAuth();
  const { setNotice, clearDraft } = useDeviceState();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (!userId) return;
    setBusy(true);
    setError(null);
    try {
      await deleteMyAccount(userId);
      clearDraft();
      setNotice('Your account and your information were deleted. Thank you for helping CoW.');
      await signOut('thisDevice'); // the app returns to the Welcome screen by itself
    } catch (e) {
      setError(friendlyAuthError(e));
      setBusy(false);
    }
  };

  return (
    <Screen>
      <ScreenHeader title="Delete account" />
      <AppText variant="title">Delete your account?</AppText>
      <Card>
        <AppText variant="bodyStrong">This deletes right away:</AppText>
        <AppText>• Your profile, email, and sign-in</AppText>
        <AppText>• Your listings, their addresses, and your photos</AppText>
        <AppText>• Pickups that haven&apos;t happened yet (they&apos;re cancelled)</AppText>
        <AppText>• The people you blocked</AppText>
      </Card>
      <Card tone="warm">
        <AppText variant="bodyStrong">We keep, without your name:</AppText>
        <AppText>• Dollar amounts already counted in CoW&apos;s impact total</AppText>
        <AppText>• Finished pickups, so volunteers keep their hours</AppText>
        <AppText>• Reports you sent, to keep the community safe</AppText>
      </Card>
      <FormMessage message={error} />
      {confirming ? (
        <>
          <AppText variant="bodyStrong">This can&apos;t be undone.</AppText>
          <Button
            label="Yes, delete everything"
            variant="danger"
            icon={TrashIcon}
            loading={busy}
            onPress={() => void remove()}
          />
          <Button label="Keep my account" variant="outline" disabled={busy} onPress={() => setConfirming(false)} />
        </>
      ) : (
        <Button label="Delete my account" variant="danger" icon={TrashIcon} onPress={() => setConfirming(true)} />
      )}
    </Screen>
  );
}
