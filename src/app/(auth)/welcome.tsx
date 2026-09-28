import { Redirect, router } from 'expo-router';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { PackageIcon } from 'phosphor-react-native/src/icons/Package';
import { TruckIcon } from 'phosphor-react-native/src/icons/Truck';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { HighlightHeadline } from '@/components/highlight-headline';
import { ImpactSummary } from '@/components/impact-summary';
import { Lamp } from '@/components/lamp';
import { AppText } from '@/components/ui/app-text';
import { ChoiceCard } from '@/components/ui/choice-card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { TextLink } from '@/components/ui/text-link';
import { DONATE_URL } from '@/config';
import { isAgeBlocked } from '@/domain/age';
import { isUsableUrl } from '@/domain/urls';
import { useDeviceState } from '@/features/device-state';
import { openExternal } from '@/lib/links';
import type { UserRole } from '@/lib/supabase';
import { space } from '@/theme';

export default function WelcomeScreen() {
  const { ageBlockedUntil, notice, setNotice, updateDraft } = useDeviceState();
  // Show a one-time message (e.g. after deleting an account), then forget it.
  const [shownNotice] = useState(notice);
  useEffect(() => {
    if (notice) setNotice(null);
  }, [notice, setNotice]);

  if (isAgeBlocked(ageBlockedUntil)) return <Redirect href="/too-young" />;

  const choose = (role: UserRole) => {
    updateDraft({ role });
    router.push('/birthday');
  };

  return (
    <Screen>
      <View style={styles.hero}>
        <Lamp size={104} />
        <Eyebrow label="Children of War Project" />
        <HighlightHeadline highlight="Compassion" rest="Driven Change" />
        <AppText color="muted">Small change for big change.</AppText>
      </View>
      <FormMessage message={shownNotice} tone="info" />
      <ImpactSummary />

      <AppText variant="title">How do you want to help?</AppText>
      <ChoiceCard
        icon={PackageIcon}
        title="Donate items"
        subtitle="Give furniture or electronics you no longer need."
        onPress={() => choose('donor')}
      />
      <ChoiceCard
        icon={TruckIcon}
        title="Volunteer"
        subtitle="Pick up donated items and earn service hours."
        onPress={() => choose('volunteer')}
      />
      <ChoiceCard
        icon={MedalIcon}
        title="Become an Ambassador"
        subtitle="Lead more pickups. CoW reviews each request."
        onPress={() => choose('ambassador')}
      />
      {isUsableUrl(DONATE_URL) ? (
        <ChoiceCard
          icon={HeartIcon}
          title="Donate money"
          subtitle="Opens CoW's donation page. No account needed."
          onPress={() => void openExternal(DONATE_URL)}
        />
      ) : null}

      <TextLink
        label="I already have an account"
        onPress={() => {
          updateDraft({ role: undefined });
          router.push('/sign-in');
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: 'flex-start', gap: space.sm, paddingTop: space.sm },
});
