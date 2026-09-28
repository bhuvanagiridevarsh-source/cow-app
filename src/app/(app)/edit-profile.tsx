import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { CONTACT_EMAIL } from '@/config';
import { ageGroup, nyToday } from '@/domain/age';
import { isValidEmail } from '@/domain/auth';
import { isValidZip } from '@/domain/zip';
import { updateProfile } from '@/features/auth/api';
import { friendlyAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/auth-provider';
import { ROLE_LABELS } from '@/features/auth/roles';
import type { UserRole } from '@/lib/supabase';
import { space } from '@/theme';

/** Change name, ZIP, and role. (Birth month/year can't change here: contact CoW to fix it.) */
export default function EditProfileScreen() {
  const { profile, reloadProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [zip, setZip] = useState(profile?.zip ?? '');
  const [role, setRole] = useState<UserRole>(profile?.role ?? 'volunteer');
  const [guardianName, setGuardianName] = useState(profile?.guardian_name ?? '');
  const [guardianEmail, setGuardianEmail] = useState(profile?.guardian_email ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;

  const minor = ageGroup(profile.birth_year, profile.birth_month, nyToday()) === 'minor';

  const save = async () => {
    if (name.trim().length < 1) return setError('Please enter your name.');
    if (!isValidZip(zip)) return setError('Please enter a 5-digit ZIP code.');
    if (minor && (guardianName.trim() === '' || !isValidEmail(guardianEmail))) {
      return setError("Please enter your parent or guardian's name and email.");
    }
    setBusy(true);
    setError(null);
    try {
      await updateProfile({
        name,
        zip,
        role,
        guardianName: minor ? guardianName : undefined,
        guardianEmail: minor ? guardianEmail : undefined,
      });
      await reloadProfile();
      router.back();
    } catch (e) {
      setError(friendlyAuthError(e));
      setBusy(false);
    }
  };

  return (
    <Screen keyboard>
      <ScreenHeader title="Edit profile" />
      <TextField label="Your name" value={name} onChangeText={setName} autoCapitalize="words" maxLength={80} />
      <TextField
        label="ZIP code"
        value={zip}
        onChangeText={(t) => setZip(t.replace(/\D/g, '').slice(0, 5))}
        keyboardType="number-pad"
        maxLength={5}
      />
      <View style={styles.roles}>
        <AppText variant="bodyStrong" color="heading">
          How you want to help
        </AppText>
        <View style={styles.chips}>
          {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => (
            <Chip key={r} label={ROLE_LABELS[r]} selected={role === r} onPress={() => setRole(r)} />
          ))}
        </View>
        {role === 'ambassador' && !profile.verified_ambassador ? (
          <AppText variant="small" color="muted">
            CoW reviews Ambassador requests. You can keep volunteering in the meantime.
          </AppText>
        ) : null}
      </View>
      {minor ? (
        <>
          <TextField label="Parent or guardian's name" value={guardianName} onChangeText={setGuardianName} />
          <TextField
            label="Parent or guardian's email"
            value={guardianEmail}
            onChangeText={setGuardianEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </>
      ) : null}
      <AppText variant="small" color="muted">
        Need to fix your birth month or year? Email {CONTACT_EMAIL} and CoW will help.
      </AppText>
      <FormMessage message={error} />
      <Button label="Save" onPress={() => void save()} loading={busy} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  roles: { gap: space.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
