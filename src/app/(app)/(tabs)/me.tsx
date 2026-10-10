import { router } from 'expo-router';
import { EnvelopeSimpleIcon } from 'phosphor-react-native/src/icons/EnvelopeSimple';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { InfoIcon } from 'phosphor-react-native/src/icons/Info';
import { LinkSimpleIcon } from 'phosphor-react-native/src/icons/LinkSimple';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { ProhibitIcon } from 'phosphor-react-native/src/icons/Prohibit';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { SignOutIcon } from 'phosphor-react-native/src/icons/SignOut';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { YoutubeLogoIcon } from 'phosphor-react-native/src/icons/YoutubeLogo';
import { useState } from 'react';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import { LinkRow } from '@/components/ui/link-row';
import { Screen } from '@/components/ui/screen';
import { CONTACT_EMAIL, DONATE_URL, JOIN_URL, SOCIAL_URLS, YOUTUBE_URL } from '@/config';
import { isUsableUrl, visibleLinks } from '@/domain/urls';
import { requestAmbassador } from '@/features/auth/api';
import { friendlyAuthError } from '@/features/auth/auth-errors';
import { useAuth } from '@/features/auth/auth-provider';
import { roleSummary } from '@/features/auth/roles';
import { openEmail, openExternal, openInApp } from '@/lib/links';

export default function MeScreen() {
  const { profile, email, signOut, reloadProfile } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;

  const askToBeAmbassador = async () => {
    setRequesting(true);
    setError(null);
    try {
      await requestAmbassador();
      await reloadProfile();
    } catch (e) {
      setError(friendlyAuthError(e));
    } finally {
      setRequesting(false);
    }
  };

  const contact = async () => {
    const opened = await openEmail(CONTACT_EMAIL);
    if (!opened) setError(`We couldn't open your mail app. You can email us at ${CONTACT_EMAIL}.`);
  };

  return (
    <Screen>
      <AppText variant="title">Me</AppText>
      <Card>
        <AppText variant="heading">{profile.name}</AppText>
        {email ? <AppText color="muted">{email}</AppText> : null}
        <AppText>ZIP {profile.zip}</AppText>
        <AppText>{roleSummary(profile)}</AppText>
        <Button
          label="Edit profile"
          variant="outline"
          icon={PencilSimpleIcon}
          onPress={() => router.push('/edit-profile')}
        />
      </Card>

      <Card tone={profile.verified_ambassador ? 'warm' : 'tint'}>
        <AppText variant="heading">Ambassador</AppText>
        {profile.verified_ambassador ? (
          <AppText>You&apos;re a verified CoW Ambassador. You can request several items at once.</AppText>
        ) : profile.ambassador_requested_at ? (
          <AppText>Your request is in. CoW reviews each one, and this will update when you&apos;re approved.</AppText>
        ) : (
          <>
            <AppText>Ambassadors lead more pickups and can request several items at once. CoW reviews each request.</AppText>
            <Button
              label="Request Ambassador"
              variant="secondary"
              icon={MedalIcon}
              loading={requesting}
              onPress={() => void askToBeAmbassador()}
            />
          </>
        )}
      </Card>

      <FormMessage message={error} />

      <Card>
        <AppText variant="heading">Children of War Project</AppText>
        <LinkRow label="About CoW" icon={InfoIcon} onPress={() => router.push('/about')} />
        {isUsableUrl(JOIN_URL) ? (
          <LinkRow label="Join the Movement" icon={UserPlusIcon} external onPress={() => void openInApp(JOIN_URL)} />
        ) : null}
        {isUsableUrl(DONATE_URL) ? (
          <LinkRow label="Donate money" icon={HeartIcon} external onPress={() => void openExternal(DONATE_URL)} />
        ) : null}
        {isUsableUrl(YOUTUBE_URL) ? (
          <LinkRow label="YouTube" icon={YoutubeLogoIcon} external onPress={() => void openExternal(YOUTUBE_URL)} />
        ) : null}
        {visibleLinks(SOCIAL_URLS).map((link) => (
          <LinkRow
            key={link.label}
            label={link.label}
            icon={LinkSimpleIcon}
            external
            onPress={() => void openExternal(link.url)}
          />
        ))}
        <LinkRow label="Contact" detail={CONTACT_EMAIL} icon={EnvelopeSimpleIcon} external onPress={() => void contact()} />
      </Card>

      <Card>
        <AppText variant="heading">Safety</AppText>
        <LinkRow label="Pickup safety tips" icon={ShieldCheckIcon} onPress={() => router.push('/safety')} />
        <LinkRow label="Blocked people" icon={ProhibitIcon} onPress={() => router.push('/blocked')} />
      </Card>

      <Card>
        <AppText variant="heading">Legal</AppText>
        <LinkRow label="Terms of Use" icon={FileTextIcon} onPress={() => router.push('/legal/terms')} />
        <LinkRow label="Privacy Policy" icon={FileTextIcon} onPress={() => router.push('/legal/privacy')} />
      </Card>

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
      <Button
        label="Delete account"
        variant="danger"
        icon={TrashIcon}
        onPress={() => router.push('/delete-account')}
      />
    </Screen>
  );
}
