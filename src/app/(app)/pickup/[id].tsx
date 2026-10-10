import { router, useLocalSearchParams } from 'expo-router';
import { FlagIcon } from 'phosphor-react-native/src/icons/Flag';
import { NavigationArrowIcon } from 'phosphor-react-native/src/icons/NavigationArrow';
import { ProhibitIcon } from 'phosphor-react-native/src/icons/Prohibit';
import { SealCheckIcon } from 'phosphor-react-native/src/icons/SealCheck';
import { ShieldCheckIcon } from 'phosphor-react-native/src/icons/ShieldCheck';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import { ItemPhoto } from '@/components/item-photo';
import { PickupTimeline } from '@/components/pickup-timeline';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import { LinkRow } from '@/components/ui/link-row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorRetry, Loading } from '@/components/ui/states';
import { TextLink } from '@/components/ui/text-link';
import { formatDollars } from '@/domain/format';
import { CATEGORY_LABELS } from '@/domain/listing';
import { addressLines, mapsUrl } from '@/domain/maps';
import { ACTION_LABELS, statusHeadline } from '@/domain/pickup-text';
import { describeWindow } from '@/domain/pickup-windows';
import { actionsFor, type PickupAction, type Viewer } from '@/domain/status';
import { useAuth } from '@/features/auth/auth-provider';
import { friendlyError } from '@/features/errors';
import { blockUser, cancelPickup, confirmPickup, markCollected, respondToRequest } from '@/features/pickups/api';
import { usePickup, useRefreshPickupData } from '@/features/pickups/use-pickups';
import { usePalette } from '@/hooks/use-theme';
import { successBuzz } from '@/lib/haptics';
import { openExternal } from '@/lib/links';
import { space } from '@/theme';

/** One pickup: where it stands, the one thing to do next, and (once accepted) the address. */
export default function PickupScreen() {
  const p = usePalette();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { userId } = useAuth();
  const query = usePickup(id);
  const refresh = useRefreshPickupData();
  const [busy, setBusy] = useState<PickupAction | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (query.isPending) {
    return (
      <Screen scroll={false}>
        <ScreenHeader />
        <Loading label="Loading the pickup" />
      </Screen>
    );
  }
  if (query.isError && !query.data) {
    return (
      <Screen scroll={false}>
        <ScreenHeader />
        <ErrorRetry message={friendlyError(query.error)} onRetry={() => void query.refetch()} retrying={query.isFetching} />
      </Screen>
    );
  }
  const detail = query.data;
  if (!detail) {
    return (
      <Screen scroll={false}>
        <ScreenHeader />
        <EmptyState title="We couldn't find this pickup" body="It may have been removed." actionLabel="Go back" onAction={() => router.back()} />
      </Screen>
    );
  }

  const { pickup, item, address, other } = detail;
  const viewer: Viewer = pickup.volunteer_id === userId ? 'volunteer' : 'donor';
  const actions = actionsFor(pickup.status, viewer);
  const showAddress = viewer === 'volunteer' && address && item && (pickup.status === 'accepted' || pickup.status === 'collected');
  const fullAddress = showAddress
    ? { street: address.street, unit: address.unit, town: item.town, zip: address.zip }
    : null;

  const perform = async (action: PickupAction) => {
    if (busy) return;
    setBusy(action);
    setError(null);
    try {
      if (action === 'accept') await respondToRequest(pickup.id, true);
      else if (action === 'decline') await respondToRequest(pickup.id, false);
      else if (action === 'mark_collected') await markCollected(pickup.id);
      else if (action === 'confirm') await confirmPickup(pickup.id);
      else await cancelPickup(pickup.id);
      if (action === 'confirm') void successBuzz();
      await refresh();
    } catch (e) {
      setError(friendlyError(e));
      void query.refetch(); // the other person may have just changed it
    } finally {
      setBusy(null);
    }
  };

  const ask = (title: string, message: string, confirmLabel: string, action: PickupAction) =>
    Alert.alert(title, message, [
      { text: 'Go back', style: 'cancel' },
      { text: confirmLabel, style: 'destructive', onPress: () => void perform(action) },
    ]);

  const press = (action: PickupAction) => {
    if (action === 'cancel') {
      return ask('Cancel this pickup?', 'The item goes back on the list for other volunteers.', 'Cancel pickup', 'cancel');
    }
    if (action === 'decline') {
      return ask('Decline this request?', `${other.display_name} won't see your address, and your item stays listed.`, 'Decline', 'decline');
    }
    void perform(action);
  };

  const block = () => {
    const otherId = other.user_id;
    if (!otherId) return;
    Alert.alert(
      `Block ${other.display_name}?`,
      "You won't see each other's listings, and any pickup between you is cancelled. They aren't told.",
      [
        { text: 'Go back', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await blockUser(otherId);
              await refresh();
              router.back();
            } catch (e) {
              setError(friendlyError(e));
            }
          },
        },
      ],
    );
  };

  const primary = actions.filter((a) => a !== 'cancel' && a !== 'decline');
  const secondary = actions.filter((a) => a === 'cancel' || a === 'decline');

  return (
    <Screen onRefresh={() => void query.refetch()} refreshing={query.isRefetching}>
      <ScreenHeader />
      <AppText variant="title">{pickup.item_title}</AppText>
      <PickupTimeline status={pickup.status} />
      <Card tone={pickup.status === 'confirmed' ? 'warm' : 'tint'}>
        <AppText variant="bodyStrong" color="heading">
          {statusHeadline(pickup.status, viewer, other.display_name)}
        </AppText>
      </Card>

      <FormMessage message={error} />
      {primary.map((action) => (
        <Button
          key={action}
          label={ACTION_LABELS[action]}
          variant={action === 'confirm' ? 'success' : 'primary'}
          loading={busy === action}
          disabled={busy !== null && busy !== action}
          onPress={() => press(action)}
        />
      ))}
      {secondary.map((action) =>
        action === 'decline' ? (
          <Button
            key={action}
            label={ACTION_LABELS[action]}
            variant="outline"
            loading={busy === action}
            disabled={busy !== null && busy !== action}
            onPress={() => press(action)}
          />
        ) : (
          <TextLink key={action} label={ACTION_LABELS[action]} disabled={busy !== null} onPress={() => press(action)} />
        ),
      )}

      {fullAddress ? (
        <Card>
          <AppText variant="heading">Pickup address</AppText>
          <AppText selectable>{addressLines(fullAddress)}</AppText>
          {address?.pickup_note ? (
            <View style={styles.fact}>
              <AppText variant="small" color="muted">
                Note from the donor
              </AppText>
              <AppText>{address.pickup_note}</AppText>
            </View>
          ) : null}
          <Button
            label="Open in Maps"
            variant="secondary"
            icon={NavigationArrowIcon}
            accessibilityHint="Opens directions in your maps app"
            onPress={() => void openExternal(mapsUrl(fullAddress, Platform.OS))}
          />
        </Card>
      ) : null}

      <Card>
        <View style={styles.row}>
          {item ? <ItemPhoto path={item.photo_path} label={pickup.item_title} style={styles.photo} /> : null}
          <View style={styles.grow}>
            <AppText color="muted">{`${CATEGORY_LABELS[pickup.item_category]} · ${formatDollars(pickup.item_value)}`}</AppText>
            {item ? (
              <>
                <AppText variant="small" color="muted">
                  Pickup time
                </AppText>
                <AppText>{describeWindow(item.pickup_window_start, item.pickup_window_end)}</AppText>
                <AppText variant="small" color="muted">
                  {item.town}
                </AppText>
              </>
            ) : null}
          </View>
        </View>
      </Card>

      <Card>
        <AppText variant="small" color="muted">
          {viewer === 'donor' ? 'Volunteer' : 'Donor'}
        </AppText>
        <View style={styles.nameRow}>
          <AppText variant="heading">{other.display_name}</AppText>
          {other.verified_ambassador ? <SealCheckIcon size={22} weight="fill" color={p.brand} /> : null}
        </View>
        {other.verified_ambassador ? <AppText color="muted">Verified CoW Ambassador</AppText> : null}
        {viewer === 'donor' ? (
          <AppText color="muted">
            {other.completed_pickups === 0
              ? 'This is their first pickup with CoW.'
              : other.completed_pickups === 1
                ? '1 pickup completed with CoW.'
                : `${other.completed_pickups} pickups completed with CoW.`}
          </AppText>
        ) : null}
      </Card>

      <Card>
        <LinkRow label="Pickup safety tips" icon={ShieldCheckIcon} onPress={() => router.push('/safety')} />
        <LinkRow
          label="Report a problem"
          icon={FlagIcon}
          onPress={() =>
            router.push({
              pathname: '/report',
              params: { pickupId: pickup.id, ...(other.user_id ? { userId: other.user_id } : {}) },
            })
          }
        />
        {other.user_id ? <LinkRow label={`Block ${other.display_name}`} icon={ProhibitIcon} onPress={block} /> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start' },
  photo: { width: 88, height: 88 },
  grow: { flex: 1, gap: 2 },
  fact: { gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
});
