import { router } from 'expo-router';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { TextLink } from '@/components/ui/text-link';
import { useAuth } from '@/features/auth/auth-provider';
import { roleSummary } from '@/features/auth/roles';
import { space } from '@/theme';

export default function MeScreen() {
  const { profile, email, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  if (!profile) return null;
  return (
    <Screen>
      <AppText variant="title">Me</AppText>
      <Card>
        <AppText variant="heading">{profile.name}</AppText>
        {email ? <AppText color="muted">{email}</AppText> : null}
        <AppText>ZIP {profile.zip}</AppText>
        <AppText>{roleSummary(profile)}</AppText>
      </Card>
      <Button
        label="Edit profile"
        variant="outline"
        icon={PencilSimpleIcon}
        onPress={() => router.push('/edit-profile')}
      />
      <Button
        label="Sign out"
        variant="outline"
        icon={SignOutIcon}
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          await signOut();
        }}
      />
      <View style={styles.links}>
        <TextLink label="Terms of Use" onPress={() => router.push('/legal/terms')} />
        <TextLink label="Privacy Policy" onPress={() => router.push('/legal/privacy')} />
      </View>
      <Button
        label="Delete account"
        variant="danger"
        icon={TrashIcon}
        onPress={() => router.push('/delete-account')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  links: { flexDirection: 'row', justifyContent: 'center', gap: space.lg, flexWrap: 'wrap' },
});
