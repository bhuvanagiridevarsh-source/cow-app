import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { CouchIcon } from 'phosphor-react-native/src/icons/Couch';
import { LaptopIcon } from 'phosphor-react-native/src/icons/Laptop';
import { PackageIcon } from 'phosphor-react-native/src/icons/Package';
import { WashingMachineIcon } from 'phosphor-react-native/src/icons/WashingMachine';
import { useEffect, useRef } from 'react';

import { StepHeader } from '@/components/step-header';
import { ChoiceCard } from '@/components/ui/choice-card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { ErrorRetry, Loading } from '@/components/ui/states';
import { CATEGORY_LABELS, EMPTY_DRAFT, type ItemCategory } from '@/domain/listing';
import { useAuth } from '@/features/auth/auth-provider';
import { friendlyError } from '@/features/errors';
import { fetchMyItem } from '@/features/items/api';
import { draftFromItem } from '@/features/items/draft-from-item';
import { useListingDraft } from '@/features/items/listing-draft';

const CATEGORIES: { key: ItemCategory; icon: typeof CouchIcon; subtitle: string }[] = [
  { key: 'furniture', icon: CouchIcon, subtitle: 'Desks, chairs, shelves, tables.' },
  { key: 'electronics', icon: LaptopIcon, subtitle: 'Laptops, TVs, tablets, speakers.' },
  { key: 'appliances', icon: WashingMachineIcon, subtitle: 'Microwaves, fans, vacuums.' },
  { key: 'other', icon: PackageIcon, subtitle: 'Anything else in good shape.' },
];

/** Step 1: what kind of item. Also the entry point for editing (`/list-item?id=...`). */
export default function ListItemCategory() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile } = useAuth();
  const { draft, update, start } = useListingDraft();
  const profileZip = profile?.zip ?? '';

  // Editing: load the saved listing and its private address.
  const saved = useQuery({
    queryKey: ['my-item', id],
    queryFn: () => fetchMyItem(id as string),
    enabled: !!id,
    staleTime: 0,
    gcTime: 0,
  });

  // Fill the form once: blank for a new listing, or from the saved one.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current) return;
    if (!id) {
      seeded.current = true;
      // A new listing starts with the person's own ZIP filled in (they can change it).
      start({ ...EMPTY_DRAFT, zip: profileZip });
    } else if (saved.data) {
      seeded.current = true;
      start(draftFromItem(saved.data.item, saved.data.address), id);
    }
  }, [id, profileZip, saved.data, start]);

  if (id && saved.isError) {
    return (
      <Screen scroll={false}>
        <ScreenHeader />
        <ErrorRetry message={friendlyError(saved.error)} onRetry={() => void saved.refetch()} retrying={saved.isFetching} />
      </Screen>
    );
  }
  if (id && !saved.data) {
    return (
      <Screen scroll={false}>
        <ScreenHeader />
        <Loading label="Loading your listing" />
      </Screen>
    );
  }
  return (
    <Screen>
      <ScreenHeader />
      <StepHeader step={1} of={4} title={id ? 'Change your listing' : 'What are you giving?'} />
      {CATEGORIES.map((c) => (
        <ChoiceCard
          key={c.key}
          role="radio"
          icon={c.icon}
          title={CATEGORY_LABELS[c.key]}
          subtitle={c.subtitle}
          selected={draft.category === c.key}
          onPress={() => {
            update({ category: c.key });
            router.push('/list-item/details');
          }}
        />
      ))}
    </Screen>
  );
}
