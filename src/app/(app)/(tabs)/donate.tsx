import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { HeartIcon } from 'phosphor-react-native/src/icons/Heart';
import { PencilSimpleIcon } from 'phosphor-react-native/src/icons/PencilSimple';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { useState } from 'react';
import { Alert } from 'react-native';

import { ItemCard } from '@/components/item-card';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { EmptyState, ErrorRetry, Loading } from '@/components/ui/states';
import { TextLink } from '@/components/ui/text-link';
import { DONATE_URL } from '@/config';
import { countsTowardLimit, groupDonations } from '@/domain/my-donations';
import { isWindowOver } from '@/domain/pickup-windows';
import { isUsableUrl } from '@/domain/urls';
import { useAuth } from '@/features/auth/auth-provider';
import { friendlyError } from '@/features/errors';
import { withdrawItem, type Item } from '@/features/items/api';
import { myItemsKey, useMyItems } from '@/features/items/use-items';
import { useRules } from '@/features/settings/use-settings';
import { openExternal } from '@/lib/links';
import { removePhoto } from '@/lib/photos';

/** My donations: everything this person has listed, grouped by what happens next. */
export default function DonateScreen() {
  const { userId } = useAuth();
  const rules = useRules();
  const queryClient = useQueryClient();
  const items = useMyItems(userId);
  const [error, setError] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState<string | null>(null);

  const list = items.data ?? [];
  const groups = groupDonations(list);
  const atLimit = list.filter((i) => countsTowardLimit(i.status)).length >= rules.maxActiveListings;

  const withdraw = async (item: Item) => {
    setError(null);
    setWithdrawing(item.id);
    try {
      await withdrawItem(item.id);
      await removePhoto(item.photo_path); // the listing is gone, so its photo goes too
      await queryClient.invalidateQueries({ queryKey: myItemsKey(userId) });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setWithdrawing(null);
    }
  };

  const confirmWithdraw = (item: Item) =>
    Alert.alert('Remove this listing?', `“${item.title}” will no longer be offered for pickup.`, [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => void withdraw(item) },
    ]);

  const header = (
    <>
      <AppText variant="title">My donations</AppText>
      <Button
        label="List an item"
        icon={PlusIcon}
        disabled={atLimit}
        onPress={() => router.push('/list-item')}
      />
      {atLimit ? (
        <FormMessage
          tone="info"
          message={`You have the most listings allowed at once (${rules.maxActiveListings}). Finish or remove one to list another.`}
        />
      ) : null}
    </>
  );

  if (items.isPending) {
    return (
      <Screen scroll={false}>
        {header}
        <Loading label="Loading your donations" />
      </Screen>
    );
  }
  if (items.isError && !items.data) {
    return (
      <Screen scroll={false}>
        {header}
        <ErrorRetry message={friendlyError(items.error)} onRetry={() => void items.refetch()} retrying={items.isFetching} />
      </Screen>
    );
  }

  return (
    <Screen onRefresh={() => void items.refetch()} refreshing={items.isRefetching}>
      {header}
      <FormMessage message={error} />

      {groups.length === 0 ? (
        <EmptyState
          title="Nothing listed yet"
          body="Have furniture or electronics you no longer need? List it, and a CoW volunteer will pick it up."
        />
      ) : null}

      {groups.map((group) => (
        <Section key={group.key} title={group.title}>
          {group.items.map((item) => {
            if (group.key !== 'waiting') return <ItemCard key={item.id} item={item} />;
            const expired = isWindowOver(item.pickup_window_end);
            return (
              <ItemCard
                key={item.id}
                item={item}
                note={expired ? 'The pickup time has passed. Choose a new time so volunteers can see it.' : undefined}>
                <Button
                  label={expired ? 'Choose a new time' : 'Edit'}
                  variant={expired ? 'secondary' : 'outline'}
                  icon={PencilSimpleIcon}
                  disabled={withdrawing === item.id}
                  onPress={() => router.push({ pathname: '/list-item', params: { id: item.id } })}
                />
                <TextLink
                  label={withdrawing === item.id ? 'Removing…' : 'Remove listing'}
                  disabled={withdrawing === item.id}
                  onPress={() => confirmWithdraw(item)}
                />
              </ItemCard>
            );
          })}
        </Section>
      ))}

      {isUsableUrl(DONATE_URL) ? (
        <Card tone="warm">
          <AppText variant="heading">Give money instead</AppText>
          <AppText>Every dollar goes to children affected by war, homelessness, and poverty.</AppText>
          <Button
            label="Donate money"
            variant="success"
            icon={HeartIcon}
            accessibilityHint="Opens CoW's donation page in your browser"
            onPress={() => void openExternal(DONATE_URL)}
          />
        </Card>
      ) : null}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <AppText variant="heading">{title}</AppText>
      {children}
    </>
  );
}
