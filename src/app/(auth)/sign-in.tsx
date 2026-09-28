import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, useColorScheme, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { TextLink } from '@/components/ui/text-link';
import { OTP_LENGTH, PASSWORD_SIGN_IN_EMAILS } from '@/config';
import { isValidEmail, normalizeEmail, usesPasswordSignIn } from '@/domain/auth';
import { sendEmailCode, signInWithApple, signInWithPassword } from '@/features/auth/api';
import { friendlyAuthError } from '@/features/auth/auth-errors';
import { useDeviceState } from '@/features/device-state';
import { space } from '@/theme';

export default function SignInScreen() {
  const scheme = useColorScheme();
  const { draft, updateDraft } = useDeviceState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'email' | 'apple' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  const inFlight = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync()
      .then(setAppleAvailable)
      .catch(() => setAppleAvailable(false));
  }, []);

  const passwordMode = usesPasswordSignIn(email, PASSWORD_SIGN_IN_EMAILS);
  const isNewPerson = draft.role !== undefined;

  const continueWithEmail = async () => {
    if (inFlight.current) return;
    if (!isValidEmail(email)) return setError('Please enter a valid email address.');
    if (passwordMode && password.length === 0) return setError('Please enter the demo account password.');
    inFlight.current = true;
    setError(null);
    setBusy('email');
    try {
      if (passwordMode) {
        await signInWithPassword(email, password); // the app moves on by itself once signed in
      } else {
        await sendEmailCode(email);
        router.push({ pathname: '/verify', params: { email: normalizeEmail(email) } });
      }
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  };

  const continueWithApple = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError(null);
    setBusy('apple');
    try {
      const result = await signInWithApple();
      if (result?.name) updateDraft({ nameHint: result.name });
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      inFlight.current = false;
      setBusy(null);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader />
      <AppText variant="title">{isNewPerson ? 'Create your account' : 'Sign in'}</AppText>
      <AppText color="muted">
        {passwordMode
          ? 'This is a CoW demo account. Enter its password.'
          : `We'll email you a ${OTP_LENGTH}-digit code. No password needed.`}
      </AppText>

      <TextField
        label="Email"
        value={email}
        onChangeText={(t) => {
          setEmail(t);
          setError(null);
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType={passwordMode ? 'next' : 'send'}
        onSubmitEditing={passwordMode ? undefined : () => void continueWithEmail()}
      />
      {passwordMode ? (
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => void continueWithEmail()}
        />
      ) : null}

      <FormMessage message={error} />
      <Button
        label={passwordMode ? 'Sign in' : 'Email me a code'}
        icon={passwordMode ? undefined : EnvelopeSimpleIcon}
        onPress={() => void continueWithEmail()}
        loading={busy === 'email'}
        disabled={busy === 'apple'}
      />

      {appleAvailable ? (
        <View style={styles.apple}>
          <AppText variant="small" color="muted" style={styles.center}>
            or
          </AppText>
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={
              scheme === 'dark'
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={26}
            style={styles.appleButton}
            onPress={() => void continueWithApple()}
          />
        </View>
      ) : null}

      <View style={styles.legal}>
        <AppText variant="small" color="muted" style={styles.center}>
          Before your account is ready, you&apos;ll review and accept CoW&apos;s Terms of Use.
        </AppText>
        <View style={styles.links}>
          <TextLink label="Terms of Use" onPress={() => router.push('/legal/terms')} />
          <TextLink label="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  apple: { gap: space.sm },
  appleButton: { width: '100%', height: 52 },
  center: { textAlign: 'center' },
  legal: { gap: space.xs, marginTop: space.md },
  links: { flexDirection: 'row', justifyContent: 'center', gap: space.lg, flexWrap: 'wrap' },
});
