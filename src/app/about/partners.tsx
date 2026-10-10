import { ArrowSquareOutIcon } from 'phosphor-react-native/src/icons/ArrowSquareOut';
import { Pressable, StyleSheet, View } from 'react-native';

import { QuoteCard } from '@/components/quote-card';
import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { isUsableUrl } from '@/domain/urls';
import { useContent } from '@/features/content/use-content';
import { usePalette } from '@/hooks/use-theme';
import { openInApp } from '@/lib/links';
import { MIN_TOUCH, space } from '@/theme';

export default function PartnersScreen() {
  const p = usePalette();
  const { featuredPartner, partners } = useContent();
  return (
    <Screen>
      <ScreenHeader />
      <Eyebrow label="Our partners" />
      <AppText variant="title">The organizations we work with</AppText>
      <AppText>
        Our partners include children&apos;s charities selected by our Board of Trustees & Advisors, and
        organizations that help us spread the word.
      </AppText>

      {featuredPartner ? (
        <>
          <Card tone="tint">
            <AppText variant="eyebrow" color="link">
              FEATURED PARTNER
            </AppText>
            <AppText variant="heading">
              {featuredPartner.location ? `${featuredPartner.name} (${featuredPartner.location})` : featuredPartner.name}
            </AppText>
            <AppText>{featuredPartner.description}</AppText>
          </Card>
          {featuredPartner.quote ? (
            <QuoteCard
              text={featuredPartner.quote.text}
              name={featuredPartner.quote.name}
              role={featuredPartner.quote.role}
            />
          ) : null}
        </>
      ) : null}

      {partners.length > 0 ? (
        <Card>
          <AppText variant="heading">Partners & supporters</AppText>
          {partners.map((partner) => {
            const label = partner.note ? `${partner.name} (${partner.note})` : partner.name;
            const url = partner.url;
            if (!isUsableUrl(url)) {
              return (
                <View key={partner.name} style={styles.row}>
                  <AppText>{label}</AppText>
                </View>
              );
            }
            return (
              <Pressable
                key={partner.name}
                accessibilityRole="link"
                accessibilityLabel={`${label}. Opens their website.`}
                onPress={() => void openInApp(url)}
                style={styles.row}>
                <AppText variant="bodyStrong" color="link" style={styles.grow}>
                  {label}
                </AppText>
                <ArrowSquareOutIcon size={20} color={p.link} />
              </Pressable>
            );
          })}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm, minHeight: MIN_TOUCH },
  grow: { flex: 1 },
});
