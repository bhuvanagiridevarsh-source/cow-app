import { router } from 'expo-router';
import { LockIcon } from 'phosphor-react-native/src/icons/Lock';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { StepHeader } from '@/components/step-header';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TextField } from '@/components/ui/text-field';
import { ageGroup, nyToday } from '@/domain/age';
import { addressProblem, NOTE_MAX } from '@/domain/listing';
import { useAuth } from '@/features/auth/auth-provider';
import { useListingDraft } from '@/features/items/listing-draft';
import { useRules } from '@/features/settings/use-settings';
import { usePalette } from '@/hooks/use-theme';
import { space } from '@/theme';

/** Step 3: where to pick it up. The exact address stays private until the donor accepts a volunteer. */
export default function ListItemAddress() {
  const p = usePalette();
  const { profile } = useAuth();
  const { draft, update } = useListingDraft();
  const rules = useRules();
  const [error, setError] = useState<string | null>(null);

  const isMinor = !!profile && ageGroup(profile.birth_year, profile.birth_month, nyToday()) === 'minor';
  const adultHomeRequired = isMinor && rules.minorDonorsNeedAdultHome;

  const next = () => {
    const problem = addressProblem(draft, { allowedZipPrefixes: rules.allowedZipPrefixes, adultHomeRequired });
    setError(problem);
    if (!problem) router.push('/list-item/review');
  };

  return (
    <Screen keyboard>
      <ScreenHeader />
      <StepHeader step={3} of={4} title="Where is the pickup?" />
      <Card tone="tint">
        <View style={styles.row}>
          <LockIcon size={26} weight="duotone" color={p.brand} duotoneColor={p.accent} />
          <AppText style={styles.grow}>
            Your exact address is only shared with the volunteer you accept. Everyone else sees just your town.
          </AppText>
        </View>
      </Card>

      <TextField
        label="Street address"
        value={draft.street}
        onChangeText={(street) => update({ street })}
        autoCapitalize="words"
        autoComplete="address-line1"
        textContentType="streetAddressLine1"
        maxLength={120}
      />
      <TextField
        label="Apartment or unit (optional)"
        value={draft.unit}
        onChangeText={(unit) => update({ unit })}
        autoComplete="address-line2"
        textContentType="streetAddressLine2"
        maxLength={30}
      />
      <TextField
        label="Town"
        value={draft.town}
        onChangeText={(town) => update({ town })}
        autoCapitalize="words"
        textContentType="addressCity"
        maxLength={60}
      />
      <TextField
        label="ZIP code"
        value={draft.zip}
        onChangeText={(t) => update({ zip: t.replace(/\D/g, '').slice(0, 5) })}
        keyboardType="number-pad"
        autoComplete="postal-code"
        textContentType="postalCode"
        maxLength={5}
      />
      <TextField
        label="Note for the volunteer (optional)"
        hint="For example: “It's in the garage.”"
        value={draft.note}
        onChangeText={(note) => update({ note })}
        maxLength={NOTE_MAX}
        multiline
      />

      {adultHomeRequired ? (
        <Checkbox
          label="My parent or guardian approves this donation, and an adult will be home for the pickup."
          checked={draft.adultHome}
          onChange={(adultHome) => update({ adultHome })}
        />
      ) : null}

      <FormMessage message={error} />
      <Button label="Next" onPress={next} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  grow: { flex: 1 },
});
