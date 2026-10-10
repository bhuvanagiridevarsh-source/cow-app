import { Stack } from 'expo-router';

import { ListingDraftProvider } from '@/features/items/listing-draft';

/** The four steps for listing an item. They share one set of answers. */
export default function ListItemLayout() {
  return (
    <ListingDraftProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ListingDraftProvider>
  );
}
