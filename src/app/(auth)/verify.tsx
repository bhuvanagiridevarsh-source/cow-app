import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { TextLink } from '@/components/ui/text-link';
import { OTP_LENGTH } from '@/config';
import { cleanCode } from '@/domain/auth';
import { sendEmailCode, verifyEmailCode } from '@/features/auth/api';
import { friendlyAuthError } from '@/features/auth/auth-errors';

const RESEND_SECONDS = 60;

/** Type the emailed code. Pasting or iOS code autofill works; it submits by itself when complete. */
export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);
  const inFlight = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  if (!email) return <Redirect href="/sign-in" />;

  const submit = async (value: string) => {
    if (inFlight.current) return;
    if (value.length !== OTP_LENGTH) return setError(`Please enter all ${OTP_LENGTH} digits.`);
    inFlight.current = true;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await verifyEmailCode(email, value); // the app moves on by itself once signed in
    } catch (e) {
      setError(friendlyAuthError(e));
      setCode('');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    setInfo(null);
    try {
      await sendEmailCode(email);
      setCooldown(RESEND_SECONDS);
      setInfo('We sent a new code. It can take a minute to arrive.');
    } catch (e) {
      setError(friendlyAuthError(e));
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader />
      <AppText variant="title">Check your email</AppText>
      <AppText color="muted">
        We sent a {OTP_LENGTH}-digit code to <AppText variant="bodyStrong">{email}</AppText>. If you
        don&apos;t see it in a minute, check your spam folder.
      </AppText>
      <TextField
        label="Code"
        value={code}
        onChangeText={(t) => {
          const next = cleanCode(t, OTP_LENGTH);
          setCode(next);
          if (next.length === OTP_LENGTH) void submit(next);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        autoFocus
        style={{ fontSize: 28, letterSpacing: 8, textAlign: 'center' }}
      />
      <FormMessage message={error} />
      <FormMessage message={info} tone="info" />
      <Button label="Continue" onPress={() => void submit(code)} loading={busy} />
      <TextLink
        label={cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
        disabled={cooldown > 0}
        onPress={() => void resend()}
      />
      <TextLink label="Use a different email" onPress={() => router.back()} />
    </Screen>
  );
}
