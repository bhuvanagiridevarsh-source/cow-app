import { router } from 'expo-router';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { Pressable, StyleSheet, View } from 'react-native';

import { ImpactMeter } from '@/components/impact-meter';
import { ItemPhoto } from '@/components/item-photo';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Eyebrow } from '@/components/ui/eyebrow';
import { Screen } from '@/components/ui/screen';
import { TextLink } from '@/components/ui/text-link';
import { DONATE_URL } from '@/config';
import { formatDistance, sortByDistance } from '@/domain/distance';
import { formatDollars } from '@/domain/format';
import { CATEGORY_LABELS } from '@/domain/listing';
import { describeWindow } from '@/domain/pickup-windows';
import { firstName, upNext } from '@/domain/up-next';
import { isUsableUrl } from '@/domain/urls';
import { useAuth } from '@/features/auth/auth-provider';
import { useOrigin } from '@/features/browse/use-origin';
import { useMyPickups, useOpenItems, useRefreshPickupData } from '@/features/pickups/use-pickups';
import { openExternal } from '@/lib/links';
import { MIN_TOUCH, space } from '@/theme';

/** Home: the impact meter, the two main actions, and whatever needs this person next. */
export default function HomeScreen() {
  const { userId, profile } = useAuth();
  const pickups = useMyPickups(userId);
  const items = useOpenItems(userId);
  const origin = useOrigin(profile?.zip);
  const refresh = useRefreshPickupData();

  const next = upNext(pickups.data ?? [], userId);
  const nearby = sortByDistance(items.data ?? [], origin.point, null).slice(0, 3);
  const name = firstName(profile?.name);

  return (
    <Screen onRefresh={() => void refresh()} refreshing={pickups.isRefetching || items.isRefetching}>
      <Eyebrow label="Children of War Project" />
      <AppText variant="title">{name ? `Hi, ${name}!` : 'Welcome!'}</AppText>

      {next ? (
        <Card tone="tint">
          <AppText variant="eyebrow" color="link">
            UP NEXT
          </AppText>
          <AppText variant="heading">{next.title}</AppText>
          <AppText>{next.body}</AppText>
          <Button label={next.action} onPress={() => router.push({ pathname: '/pickup/[id]', params: { id: next.pickupId } })} />
        </Card>
      ) : null}

      <ImpactMeter />

      <Button label="List an item" icon={PlusIcon} onPress={() => router.push('/list-item')} />
      <Button
        label="Find items to pick up"
        variant="secondary"
        icon={MagnifyingGlassIcon}
        onPress={() => router.push('/browse')}
      />

      {nearby.length > 0 ? (
        <>
          <View style={styles.sectionRow}>
            <AppText variant="heading" style={styles.grow}>
              Near you
            </AppText>
            <TextLink label="See all" onPress={() => router.push('/browse')} />
          </View>
          {nearby.map(({ item, miles }) => {
            const where = miles === null ? item.town : `${item.town} · ${formatDistance(miles)}`;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.title}. ${where}.`}
                onPress={() => router.push({ pathname: '/item/[id]', params: { id: item.id } })}>
                <Card>
                  <View style={styles.row}>
                    <ItemPhoto path={item.photo_path} label={item.title} style={styles.photo} />
                    <View style={styles.text}>
                      <AppText variant="heading" numberOfLines={2}>
                        {item.title}
                      </AppText>
                      <AppText color="muted">{`${CATEGORY_LABELS[item.category]} · ${formatDollars(item.value)}`}</AppText>
                      <AppText variant="bodyStrong" color="link">
                        {where}
                      </AppText>
                      <AppText variant="small">{describeWindow(item.pickup_window_start, item.pickup_window_end)}</AppText>
                    </View>
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </>
      ) : null}

      {isUsableUrl(DONATE_URL) ? (
        <Button
          label="Donate money"
          variant="success"
          icon={HeartIcon}
          accessibilityHint="Opens CoW's donation page in your browser"
          onPress={() => void openExternal(DONATE_URL)}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'center', minHeight: MIN_TOUCH },
  grow: { flex: 1 },
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  photo: { width: 80, height: 80 },
  text: { flex: 1, gap: 2 },
});
