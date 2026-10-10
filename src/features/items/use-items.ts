import { useQuery } from '@tanstack/react-query';

import { fetchMyItems } from '@/features/items/api';
import { photoLink } from '@/lib/photos';

export const myItemsKey = (userId: string | null) => ['my-items', userId] as const;

/** The signed-in person's own listings. */
export function useMyItems(userId: string | null) {
  return useQuery({
    queryKey: myItemsKey(userId),
    queryFn: () => fetchMyItems(userId as string),
    enabled: !!userId,
  });
}

/** A private link to an item's photo. Refreshed before the 30-minute link runs out. */
export function usePhotoLink(path: string | null | undefined) {
  return useQuery({
    queryKey: ['photo-link', path],
    queryFn: () => photoLink(path as string),
    enabled: !!path,
    staleTime: 20 * 60_000,
    gcTime: 25 * 60_000,
  });
}
