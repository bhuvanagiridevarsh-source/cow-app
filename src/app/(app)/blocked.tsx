import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormMessage } from '@/components/ui/form-message';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { EmptyState, ErrorRetry, Loading } from '@/components/ui/states';
import { useAuth } from '@/features/auth/auth-provider';
import { friendlyError } from '@/features/errors';
import { unblockUser } from '@/features/pickups/api';
import { useBlockedUsers, useRefreshPickupData } from '@/features/pickups/use-pickups';
import { space } from '@/theme';

/** People this person has blocked, with a way to undo it. */
export default function BlockedScreen() {
  const { userId } = useAuth();
  const blocked = useBlockedUsers(userId);
  const refresh = useRefreshPickupData();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const unblock = async (id: string) => {
    setBusy(id);
    setError(null);
    try {
      await unblockUser(id);
      await refresh();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  if (blocked.isPending) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Blocked people" />
        <Loading />
      </Screen>
    );
  }
  if (blocked.isError && !blocked.data) {
    return (
      <Screen scroll={false}>
        <ScreenHeader title="Blocked people" />
        <ErrorRetry message={friendlyError(blocked.error)} onRetry={() => void blocked.refetch()} retrying={blocked.isFetching} />
      </Screen>
    );
  }
  const list = blocked.data ?? [];
  return (
    <Screen scroll={list.length > 0}>
      <ScreenHeader title="Blocked people" />
      {list.length === 0 ? (
        <EmptyState
          title="You haven't blocked anyone"
          body="If you block someone, you won't see each other's listings. You can block from any listing or pickup."
        />
      ) : (
        <>
          <AppText color="muted">You and these people can&apos;t see each other&apos;s listings.</AppText>
          <FormMessage message={error} />
          {list.map((person) => (
            <Card key={person.user_id}>
              <View style={styles.row}>
                <AppText variant="heading" style={styles.grow}>
                  {person.display_name}
                </AppText>
              </View>
              <Button
                label="Unblock"
                variant="outline"
                loading={busy === person.user_id}
                disabled={busy !== null && busy !== person.user_id}
                onPress={() => void unblock(person.user_id)}
              />
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  grow: { flex: 1 },
});
