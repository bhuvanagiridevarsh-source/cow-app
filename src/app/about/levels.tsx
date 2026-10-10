import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useContent } from '@/features/content/use-content';
import { usePalette } from '@/hooks/use-theme';
import { space } from '@/theme';

export default function LevelsScreen() {
  const p = usePalette();
  const { membershipLevels } = useContent();
  return (
    <Screen>
      <ScreenHeader />
      <Eyebrow label="Join the movement" />
      <AppText variant="title">Membership levels</AppText>
      <AppText>Join CoW at the level that&apos;s right for you. Every level builds on the one before.</AppText>
      {membershipLevels.map((level, index) => (
        <Card key={level.name} tone={index === membershipLevels.length - 1 ? 'warm' : 'plain'}>
          <AppText variant="eyebrow" color="link">{`LEVEL ${index + 1}`}</AppText>
          <AppText variant="heading">{level.name}</AppText>
          <AppText color="muted">{level.requirement}</AppText>
          {level.perks.map((perk) => (
            <View key={perk} style={styles.perk}>
              <CheckIcon size={20} weight="bold" color={p.success} style={styles.check} />
              <AppText style={styles.grow}>{perk}</AppText>
            </View>
          ))}
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  perk: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  check: { marginTop: 3 },
  grow: { flex: 1 },
});
