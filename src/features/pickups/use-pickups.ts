import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { fetchBlockedUsers, fetchItem, fetchMyPickups, fetchMyStats, fetchOpenItems, fetchPickup } from '@/features/pickups/api';

/** Open listings from other people (Browse). */
export function useOpenItems(userId: string | null) {
  return useQuery({
    queryKey: ['open-items', userId],
    queryFn: () => fetchOpenItems(userId as string),
    enabled: !!userId,
  });
}

export function useItem(itemId: string | undefined) {
  return useQuery({ queryKey: ['item', itemId], queryFn: () => fetchItem(itemId as string), enabled: !!itemId });
}

export function usePickup(pickupId: string | undefined) {
  return useQuery({
    queryKey: ['pickup', pickupId],
    queryFn: () => fetchPickup(pickupId as string),
    enabled: !!pickupId,
    // There are no push notifications in V1, so check for the other person's move while the screen is open.
    refetchInterval: 20_000,
  });
}

/** Every pickup this person is part of. */
export function useMyPickups(userId: string | null) {
  return useQuery({
    queryKey: ['my-pickups', userId],
    queryFn: () => fetchMyPickups(userId as string),
    enabled: !!userId,
  });
}

/** Hours, limits, and age rules for the signed-in person. */
export function useMyStats(userId: string | null) {
  return useQuery({ queryKey: ['my-stats', userId], queryFn: fetchMyStats, enabled: !!userId });
}

export function useBlockedUsers(userId: string | null) {
  return useQuery({ queryKey: ['blocked-users', userId], queryFn: fetchBlockedUsers, enabled: !!userId });
}

/** After anything about a pickup or listing changes, reload every list that could show it. */
export function useRefreshPickupData() {
  const queryClient = useQueryClient();
  return useCallback(async () => {
    await Promise.all(
      ['open-items', 'item', 'pickup', 'my-pickups', 'my-stats', 'my-items', 'blocked-users', 'impact'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );
  }, [queryClient]);
}
