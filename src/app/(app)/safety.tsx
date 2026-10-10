import { router, useLocalSearchParams } from 'expo-router';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { CONTACT_EMAIL } from '@/config';
import { usePalette } from '@/hooks/use-theme';
import { STORAGE_KEYS, writeJSON } from '@/lib/storage';
import { space } from '@/theme';

const TIPS: { title: string; body: string }[] = [
  { title: 'Go with a buddy', body: 'Bring a parent, guardian, or friend. If you are under 18, an adult comes with you.' },
  { title: 'Tell someone where you are going', body: 'Share the address and the pickup time with a parent or guardian before you leave.' },
  { title: 'Stay at the door or garage', body: "Meet at the front door, porch, or garage. Don't go further into someone's home." },
  { title: 'Go in daylight, during the pickup time', body: 'Arrive inside the time window the donor chose.' },
  { title: 'Lift safely', body: "Don't carry anything too heavy or awkward. It's fine to say an item needs two people." },
  { title: 'Trust your feelings', body: 'If anything feels wrong, leave right away. Then tell an adult and report it in the app.' },
];

/** Pickup safety tips: shown before a volunteer's first request, and linked from every pickup. */
export default function SafetyScreen() {
  const p = usePalette();
  const { first } = useLocalSearchParams<{ first?: string }>();
  const done = async () => {
    await writeJSON(STORAGE_KEYS.safetySeen, true);
    router.back();
  };
  return (
    <Screen>
      <ScreenHeader />
      <Eyebrow label="Pickup safety" />
      <AppText variant="title">Stay safe on every pickup</AppText>
      <AppText>
        {first
          ? 'Please read these before your first pickup. You can find them again on any pickup and on the Me tab.'
          : 'A few simple habits that keep every pickup safe.'}
      </AppText>
      {TIPS.map((tip) => (
        <Card key={tip.title}>
          <View style={styles.row} accessible accessibilityLabel={`${tip.title}. ${tip.body}`}>
            <ShieldCheckIcon size={28} weight="duotone" color={p.brand} duotoneColor={p.accent} />
            <View style={styles.text}>
              <AppText variant="heading">{tip.title}</AppText>
              <AppText>{tip.body}</AppText>
            </View>
          </View>
        </Card>
      ))}
      <Card tone="warm">
        <AppText variant="bodyStrong" color="heading">
          In an emergency, call 911.
        </AppText>
        <AppText>For anything else, use Report in the app or email {CONTACT_EMAIL}.</AppText>
      </Card>
      {first ? <Button label="I understand" onPress={() => void done()} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  text: { flex: 1, gap: space.xs },
});
