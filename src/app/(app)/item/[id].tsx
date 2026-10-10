import { router, useLocalSearchParams } from 'expo-router';
import { FlagIcon } from 'phosphor-react-native/src/icons/Flag';
import { ProhibitIcon } from 'phosphor-react-native/src/icons/Prohibit';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ItemPhoto } from '@/components/item-photo';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { FormMessage } from '@/components/ui/form-message';
import { LinkRow } from '@/components/ui/link-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorRetry, Loading } from '@/components/ui/states';
import { formatDistance, milesTo } from '@/domain/distance';
import { formatDollars } from '@/domain/format';
import { CATEGORY_LABELS, CONDITION_LABELS } from '@/domain/listing';
import { describeWindow } from '@/domain/pickup-windows';
import { requestBlocker, summarizeRequests } from '@/domain/requests';
import { useAuth } from '@/features/auth/auth-provider';
import { useOrigin } from '@/features/browse/use-origin';
import { friendlyError } from '@/features/errors';
import { blockUser, requestPickups } from '@/features/pickups/api';
import { useItem, useMyStats, useRefreshPickupData } from '@/features/pickups/use-pickups';
import { useSafetyGate } from '@/features/safety/use-safety-gate';
import { useRules } from '@/features/settings/use-settings';

/** One item: the details, and the button to ask to pick it up. */
export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId, profile } = useAuth();
  const rules = useRules();
  const item = useItem(id);
  const stats = useMyStats(userId);
  const origin = useOrigin(profile?.zip);
  const refresh = useRefreshPickupData();
  const passedSafety = useSafetyGate();
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (item.isPending) {
    return (
      <Screen scroll={false}>
        <ScreenHeader />
        <Loading label="Loading the item" />
      </Screen>
    );
  }
  if (item.isError) {
    return (
      <Screen scroll={false}>
        <ScreenHeader />
        <ErrorRetry message={friendlyError(item.error)} onRetry={() => void item.refetch()} retrying={item.isFetching} />
      </Screen>
    );
  }
  const data = item.data;
  if (!data) {
    return (
      <Screen scroll={false}>
        <ScreenHeader />
        <EmptyState
          title="This item is no longer available"
          body="It may have been picked up or taken down."
          actionLabel="Back to Browse"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const isMine = data.donor_id === userId;
  const isOpen = data.status === 'listed' && !data.hidden_at && new Date(data.pickup_window_end) > new Date();
  const miles = milesTo(origin.point, data);
  const blocker = stats.data ? requestBlocker(stats.data, rules.minPickupAge) : null;
  const needsAdult = !!stats.data?.needs_adult_on_pickup;

  const request = async () => {
    if (busy) return;
    if (needsAdult && !adult) return setError('Please confirm that an adult will come with you.');
    if (!(await passedSafety())) return;
    setBusy(true);
    setError(null);
    try {
      const rows = await requestPickups([data.id], adult);
      const { requested, message } = summarizeRequests(rows);
      await refresh();
      const pickupId = rows.find((r) => r.result === 'requested')?.pickup_id;
      if (requested > 0 && pickupId) {
        router.replace({ pathname: '/pickup/[id]', params: { id: pickupId } });
        return;
      }
      setError(message);
    } catch (e) {
      setError(friendlyError(e));
    }
    setBusy(false);
  };

  const block = () =>
    Alert.alert(
      'Block this donor?',
      "You won't see each other's listings, and any pickup between you is cancelled. They aren't told.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(data.donor_id);
              await refresh();
              router.back();
            } catch (e) {
              setError(friendlyError(e));
            }
          },
        },
      ],
    );

  return (
    <Screen>
      <ScreenHeader />
      <ItemPhoto path={data.photo_path} label={data.title} style={styles.photo} />
      <AppText variant="title">{data.title}</AppText>
      <AppText color="muted">
        {`${CATEGORY_LABELS[data.category]} · ${CONDITION_LABELS[data.condition]} · ${formatDollars(data.value)}`}
      </AppText>
      <Card>
        <View style={styles.fact}>
          <AppText variant="small" color="muted">
            Where
          </AppText>
          <AppText>{miles === null ? data.town : `${data.town} · ${formatDistance(miles)}`}</AppText>
          <AppText variant="small" color="muted">
            You&apos;ll see the exact address after the donor accepts.
          </AppText>
        </View>
        <View style={styles.fact}>
          <AppText variant="small" color="muted">
            Pickup time
          </AppText>
          <AppText>{describeWindow(data.pickup_window_start, data.pickup_window_end)}</AppText>
        </View>
      </Card>

      {isMine ? (
        <Card tone="tint">
          <AppText>This is your listing. You can change it on the Donate tab.</AppText>
        </Card>
      ) : !isOpen ? (
        <Card tone="tint">
          <AppText>Someone has already asked for this item, or its pickup time has passed.</AppText>
        </Card>
      ) : blocker ? (
        <Card tone="warm">
          <AppText>{blocker}</AppText>
        </Card>
      ) : (
        <>
          {needsAdult ? <Checkbox label="An adult will come with me." checked={adult} onChange={setAdult} /> : null}
          <Button label="Request pickup" loading={busy} disabled={!stats.data} onPress={() => void request()} />
          <AppText variant="small" color="muted" style={styles.center}>
            The donor decides whether to accept. You earn hours once the pickup is confirmed.
          </AppText>
        </>
      )}
      <FormMessage message={error} />

      {!isMine ? (
        <Card>
          <LinkRow
            label="Report this listing"
            icon={FlagIcon}
            onPress={() => router.push({ pathname: '/report', params: { itemId: data.id } })}
          />
          <LinkRow label="Block this donor" icon={ProhibitIcon} onPress={block} />
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { width: '100%', aspectRatio: 4 / 3 },
  fact: { gap: 2 },
  center: { textAlign: 'center' },
});
