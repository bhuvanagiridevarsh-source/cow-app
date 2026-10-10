import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorRetry, Loading } from '@/components/ui/states';
import { formatDollars } from '@/domain/format';
import { CATEGORY_LABELS } from '@/domain/listing';
import { shortStatus } from '@/domain/pickup-text';
import { isActivePickup } from '@/domain/status';
import { useAuth } from '@/features/auth/auth-provider';
import { friendlyError } from '@/features/errors';
import type { Pickup } from '@/features/pickups/api';
import { useMyPickups } from '@/features/pickups/use-pickups';
import { MIN_TOUCH, space } from '@/theme';

function PickupRow({ pickup }: { pickup: Pickup }) {
  const status = shortStatus(pickup.status, 'volunteer');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${pickup.item_title}. ${status}.`}
      onPress={() => router.push({ pathname: '/pickup/[id]', params: { id: pickup.id } })}>
      <Card>
        <View style={styles.row}>
          <View style={styles.grow}>
            <AppText variant="heading">{pickup.item_title}</AppText>
            <AppText color="muted">{`${CATEGORY_LABELS[pickup.item_category]} · ${formatDollars(pickup.item_value)}`}</AppText>
          </View>
          <AppText variant="bodyStrong" color="link">
            {status}
          </AppText>
        </View>
      </Card>
    </Pressable>
  );
}

/** Hours: the pickups this person is doing as a volunteer. (Hours and tier totals come in Phase 7.) */
export default function HoursScreen() {
  const { userId } = useAuth();
  const pickups = useMyPickups(userId);

  if (pickups.isPending) {
    return (
      <Screen scroll={false}>
        <AppText variant="title">My pickups</AppText>
        <Loading label="Loading your pickups" />
      </Screen>
    );
  }
  if (pickups.isError && !pickups.data) {
    return (
      <Screen scroll={false}>
        <AppText variant="title">My pickups</AppText>
        <ErrorRetry message={friendlyError(pickups.error)} onRetry={() => void pickups.refetch()} retrying={pickups.isFetching} />
      </Screen>
    );
  }

  const mine = (pickups.data ?? []).filter((x) => x.volunteer_id === userId);
  const active = mine.filter((x) => isActivePickup(x.status));
  const past = mine.filter((x) => !isActivePickup(x.status)).slice(0, 20);

  return (
    <Screen
      scroll={mine.length > 0}
      onRefresh={() => void pickups.refetch()}
      refreshing={pickups.isRefetching}>
      <AppText variant="title">My pickups</AppText>
      {mine.length === 0 ? (
        <EmptyState
          title="No pickups yet"
          body="Find an item near you and ask to pick it up. Each confirmed pickup earns volunteer hours."
          actionLabel="Find items to pick up"
          onAction={() => router.push('/browse')}
        />
      ) : null}
      {active.length > 0 ? <AppText variant="heading">In progress</AppText> : null}
      {active.map((pickup) => (
        <PickupRow key={pickup.id} pickup={pickup} />
      ))}
      {past.length > 0 ? <AppText variant="heading">Earlier</AppText> : null}
      {past.map((pickup) => (
        <PickupRow key={pickup.id} pickup={pickup} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: MIN_TOUCH },
  grow: { flex: 1, gap: 2 },
});
