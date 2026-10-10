import { StyleSheet, View } from 'react-native';

import { QuoteCard } from '@/components/quote-card';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useContent } from '@/features/content/use-content';
import { usePalette } from '@/hooks/use-theme';
import { space } from '@/theme';

export default function HowItWorksScreen() {
  const p = usePalette();
  const { howItWorks, quotes } = useContent();
  return (
    <Screen>
      <ScreenHeader />
      <Eyebrow label="How it works" />
      <AppText variant="title">From small change to a child in need</AppText>
      <AppText>{howItWorks.intro}</AppText>
      {howItWorks.steps.map((step, index) => (
        <Card key={step.title}>
          <View style={styles.row} accessible accessibilityLabel={`Step ${index + 1}. ${step.title}. ${step.body}`}>
            <View style={[styles.number, { backgroundColor: p.accent }]}>
              <AppText variant="heading" style={{ color: p.onAccent }} maxFontSizeMultiplier={1.3}>
                {index + 1}
              </AppText>
            </View>
            <View style={styles.text}>
              <AppText variant="heading">{step.title}</AppText>
              <AppText>{step.body}</AppText>
            </View>
          </View>
        </Card>
      ))}
      {howItWorks.impactNote ? (
        <Card tone="tint">
          <AppText variant="bodyStrong" color="heading">
            How we measure impact
          </AppText>
          <AppText>{howItWorks.impactNote}</AppText>
        </Card>
      ) : null}
      {quotes.map((quote) => (
        <QuoteCard key={quote.text} text={quote.text} name={quote.name} role={quote.role} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  number: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: space.xs },
});
