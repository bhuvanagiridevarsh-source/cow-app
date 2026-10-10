import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { CalendarBlankIcon } from 'phosphor-react-native/src/icons/CalendarBlank';
import { HandshakeIcon } from 'phosphor-react-native/src/icons/Handshake';
import { MedalIcon } from 'phosphor-react-native/src/icons/Medal';
import { PathIcon } from 'phosphor-react-native/src/icons/Path';
import { UsersThreeIcon } from 'phosphor-react-native/src/icons/UsersThree';
import { StyleSheet } from 'react-native';

import { Lamp } from '@/components/lamp';
import { AppText } from '@/components/ui/app-text';
import { ChoiceCard } from '@/components/ui/choice-card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TEAM_OUTREACH_PHOTO } from '@/features/content/photos';
import { useContent } from '@/features/content/use-content';
import { radius } from '@/theme';

export default function AboutScreen() {
  const content = useContent();
  return (
    <Screen>
      <ScreenHeader />
      <Lamp size={88} />
      <Eyebrow label="Children of War Project" />
      <AppText variant="display">{content.headline}</AppText>
      <AppText variant="bodyStrong" color="link">
        {content.tagline}
      </AppText>
      <AppText>{content.intro}</AppText>
      <Image
        source={TEAM_OUTREACH_PHOTO}
        style={styles.photo}
        contentFit="cover"
        accessibilityLabel="The CoW team at a community outreach table in Monroe Township, New Jersey"
      />

      <ChoiceCard
        icon={BookOpenIcon}
        title="Our story"
        subtitle={content.story.title}
        onPress={() => router.push('/about/story')}
      />
      <ChoiceCard
        icon={PathIcon}
        title="How it works"
        subtitle="Where every dollar goes."
        onPress={() => router.push('/about/how-it-works')}
      />
      <ChoiceCard
        icon={UsersThreeIcon}
        title="The team"
        subtitle="Student leaders, ChangeMakers, and our board."
        onPress={() => router.push('/about/team')}
      />
      <ChoiceCard
        icon={HandshakeIcon}
        title="Partners"
        subtitle="The organizations we work with."
        onPress={() => router.push('/about/partners')}
      />
      <ChoiceCard
        icon={CalendarBlankIcon}
        title="Events"
        subtitle="What's coming up and what we've done."
        onPress={() => router.push('/about/events')}
      />
      <ChoiceCard
        icon={MedalIcon}
        title="Membership levels"
        subtitle="From Volunteer to Change Maker."
        onPress={() => router.push('/about/levels')}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 1.5, borderRadius: radius.card },
});
