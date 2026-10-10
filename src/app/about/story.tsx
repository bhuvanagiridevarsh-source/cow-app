import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';

import { QuoteCard } from '@/components/quote-card';
import { AppText } from '@/components/ui/app-text';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { TIE_AWARD_PHOTO } from '@/features/content/photos';
import { useContent } from '@/features/content/use-content';
import { radius } from '@/theme';

export default function StoryScreen() {
  const { story, founderQuote } = useContent();
  return (
    <Screen>
      <ScreenHeader />
      <Eyebrow label="Our story" />
      <AppText variant="title">{story.title}</AppText>
      {story.paragraphs.map((paragraph) => (
        <AppText key={paragraph}>{paragraph}</AppText>
      ))}
      <Image
        source={TIE_AWARD_PHOTO}
        style={styles.photo}
        contentFit="cover"
        accessibilityLabel="CoW's founders receiving the Best Social Enterprise Award at the 2024 TiE New Jersey gala"
      />
      <QuoteCard text={founderQuote.text} name={founderQuote.name} role={founderQuote.role} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 1.2, borderRadius: radius.card },
});
