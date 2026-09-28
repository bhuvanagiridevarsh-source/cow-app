import { router } from 'expo-router';

import { Lamp } from '@/components/lamp';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextLink } from '@/components/ui/text-link';
import { WEBSITE_URL } from '@/config';
import { isUsableUrl } from '@/domain/urls';
import { useDeviceState } from '@/features/device-state';
import { openInApp } from '@/lib/links';

/** Under 13: no account. Friendly, and points to the website. (No "try again": see age block.) */
export default function TooYoungScreen() {
  const { clearAgeBlock } = useDeviceState();
  return (
    <Screen contentStyle={{ paddingTop: 48 }}>
      <Lamp size={112} />
      <AppText variant="title">Thanks for wanting to help!</AppText>
      <AppText>
        The CoW app is for people 13 and older. You can still learn about Children of War Project
        on our website.
      </AppText>
      <Card tone="warm">
        <AppText variant="bodyStrong">Ideas you can do today</AppText>
        <AppText>Start a coin jar at home, or ask a parent or guardian about donating things you no longer use.</AppText>
      </Card>
      {isUsableUrl(WEBSITE_URL) ? (
        <Button label="Visit our website" variant="secondary" onPress={() => void openInApp(WEBSITE_URL)} />
      ) : null}
      {__DEV__ ? (
        // Only in the development version (Expo Go). Store builds never show this.
        <TextLink
          label="Developer only: reset the age check"
          onPress={() => {
            clearAgeBlock();
            router.replace('/welcome');
          }}
        />
      ) : null}
    </Screen>
  );
}
