import { router } from 'expo-router';
import { ShareNetworkIcon } from 'phosphor-react-native/src/icons/ShareNetwork';
import { Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorRetry, Loading } from '@/components/ui/states';
import { formatDollars } from '@/domain/format';
import { CATEGORY_LABELS } from '@/domain/listing';
import { shortStatus } from '@/domain/pickup-text';
import { isActivePickup } from '@/domain/status';
import { formatHours, hoursSummary, tierProgress } from '@/domain/tiers';
import { useAuth } from '@/features/auth/auth-provider';
import { friendlyError } from '@/features/errors';
import type { Pickup } from '@/features/pickups/api';
import { useMyPickups, useMyStats } from '@/features/pickups/use-pickups';
import { usePalette } from '@/hooks/use-theme';
import { MIN_TOUCH, radius, space } from '@/theme';

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

/** Hours: confirmed volunteer hours, tier progress, and this person's pickups. */
export default function HoursScreen() {
  const p = usePalette();
  const { userId, profile } = useAuth();
  const pickups = useMyPickups(userId);
  const stats = useMyStats(userId);

  if (pickups.isPending || stats.isPending) {
    return (
      <Screen scroll={false}>
        <AppText variant="title">Hours</AppText>
        <Loading label="Loading your hours" />
      </Screen>
    );
  }
  if ((pickups.isError && !pickups.data) || (stats.isError && !stats.data)) {
    const retry = () => {
      void pickups.refetch();
      void stats.refetch();
    };
    return (
      <Screen scroll={false}>
        <AppText variant="title">Hours</AppText>
        <ErrorRetry
          message={friendlyError(pickups.error ?? stats.error)}
          onRetry={retry}
          retrying={pickups.isFetching || stats.isFetching}
        />
      </Screen>
    );
  }
  const s = stats.data;
  if (!s) return null;

  const mine = (pickups.data ?? []).filter((x) => x.volunteer_id === userId);
  const active = mine.filter((x) => isActivePickup(x.status));
  const confirmed = mine.filter((x) => x.status === 'confirmed').slice(0, 10);
  const tier = tierProgress(s.tier_value);

  const share = () => {
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    void Share.share({
      message: hoursSummary({
        name: profile?.name ?? '',
        hours: s.hours,
        pickups: s.pickups_confirmed,
        valueCollected: s.value_collected,
        tierName: tier.current.name,
        today,
      }),
    }).catch(() => undefined);
  };

  return (
    <Screen
      onRefresh={() => {
        void pickups.refetch();
        void stats.refetch();
      }}
      refreshing={pickups.isRefetching || stats.isRefetching}>
      <AppText variant="title">Hours</AppText>

      <Card tone="warm">
        <View accessible accessibilityLabel={`${formatHours(s.hours)} of confirmed volunteer time, from ${s.pickups_confirmed} pickups.`}>
          <AppText variant="display">{formatHours(s.hours)}</AppText>
          <AppText color="muted">
            {s.pickups_confirmed === 1 ? 'from 1 confirmed pickup' : `from ${s.pickups_confirmed} confirmed pickups`}
          </AppText>
        </View>
        <Button label="Share my hours summary" variant="secondary" icon={ShareNetworkIcon} onPress={share} />
      </Card>

      <Card>
        <View
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel={
            tier.next
              ? `Level: ${tier.current.name}. ${formatDollars(tier.toNext)} more to reach ${tier.next.name}.`
              : `Level: ${tier.current.name}, the highest level.`
          }
          style={styles.tier}>
          <AppText variant="eyebrow" color="link">
            YOUR LEVEL
          </AppText>
          <AppText variant="heading">{tier.current.name}</AppText>
          <View style={[styles.track, { backgroundColor: p.surfaceTint }]}>
            <View style={[styles.fill, { backgroundColor: p.success, width: `${Math.max(tier.progress * 100, 2)}%` }]} />
          </View>
          <AppText color="muted">
            {tier.next
              ? `${formatDollars(tier.toNext)} more in confirmed items to reach ${tier.next.name}.`
              : "You've reached the highest level. Thank you!"}
          </AppText>
          <AppText variant="small" color="muted">
            {`Counts items you collected (${formatDollars(s.value_collected)}) and donated (${formatDollars(s.value_donated)}).`}
          </AppText>
        </View>
        <Button label="See all levels" variant="outline" onPress={() => router.push('/about/levels')} />
      </Card>

      {active.length > 0 ? <AppText variant="heading">In progress</AppText> : null}
      {active.map((pickup) => (
        <PickupRow key={pickup.id} pickup={pickup} />
      ))}

      {confirmed.length > 0 ? <AppText variant="heading">Recent confirmed pickups</AppText> : null}
      {confirmed.map((pickup) => (
        <PickupRow key={pickup.id} pickup={pickup} />
      ))}

      {mine.length === 0 ? (
        <EmptyState
          title="No pickups yet"
          body={
            s.can_pick_up
              ? 'Find an item near you and ask to pick it up. Each confirmed pickup earns volunteer hours.'
              : 'Pickups open up when you are a little older. Until then, listing items moves you up the levels.'
          }
          actionLabel={s.can_pick_up ? 'Find items to pick up' : 'List an item'}
          onAction={() => router.push(s.can_pick_up ? '/browse' : '/list-item')}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: MIN_TOUCH },
  grow: { flex: 1, gap: 2 },
  tier: { gap: space.xs },
  track: { height: 12, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
