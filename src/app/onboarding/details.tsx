import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { TextLink } from '@/components/ui/text-link';
import { ageGroup, nyToday } from '@/domain/age';
import { isValidZip, normalizeZip } from '@/domain/zip';
import { useAuth } from '@/features/auth/auth-provider';
import { ROLE_LABELS } from '@/features/auth/roles';
import { useDeviceState } from '@/features/device-state';
import type { UserRole } from '@/lib/supabase';
import { space } from '@/theme';

export default function OnboardingDetails() {
  const { draft, updateDraft } = useDeviceState();
  const { signOut } = useAuth();
  const [name, setName] = useState(draft.name ?? draft.nameHint ?? '');
  const [zip, setZip] = useState(draft.zip ?? '');
  const [role, setRole] = useState<UserRole | undefined>(draft.role);
  const [error, setError] = useState<string | null>(null);
  const askRole = draft.role === undefined;

  const next = () => {
    const trimmed = name.trim();
    if (trimmed.length < 1 || trimmed.length > 80) return setError('Please enter your first and last name.');
    if (!isValidZip(zip)) return setError('Please enter your 5-digit ZIP code.');
    if (!role) return setError('Please choose how you want to help.');
    if (!draft.birthYear || !draft.birthMonth) return router.replace('/onboarding');
    setError(null);
    updateDraft({ name: trimmed, zip: normalizeZip(zip), role });
    const minor = ageGroup(draft.birthYear, draft.birthMonth, nyToday()) === 'minor';
    router.push(minor ? '/onboarding/guardian' : '/onboarding/terms');
  };

  return (
    <Screen keyboard>
      <AppText variant="title">About you</AppText>
      <TextField
        label="Your name"
        hint="First and last name. Others only ever see your first name and last initial."
        value={name}
        onChangeText={setName}
        autoComplete="name"
        textContentType="name"
        autoCapitalize="words"
        maxLength={80}
      />
      <TextField
        label="ZIP code"
        hint="We use it to show how far away items are."
        value={zip}
        onChangeText={(t) => setZip(t.replace(/\D/g, '').slice(0, 5))}
        keyboardType="number-pad"
        autoComplete="postal-code"
        textContentType="postalCode"
        maxLength={5}
      />
      {askRole ? (
        <View style={styles.roles}>
          <AppText variant="bodyStrong" color="heading">
            How do you want to help?
          </AppText>
          <AppText variant="small" color="muted">
            You can always do both. This just decides what we show you first.
          </AppText>
          <View style={styles.chips}>
            {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
              <Chip key={r} label={ROLE_LABELS[r]} selected={role === r} onPress={() => setRole(r)} />
            ))}
          </View>
        </View>
      ) : null}
      <FormMessage message={error} />
      <Button label="Continue" onPress={next} />
      <TextLink label="Use a different account" onPress={() => void signOut('thisDevice')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  roles: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
