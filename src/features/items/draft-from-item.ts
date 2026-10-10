import { EMPTY_DRAFT, type ListingDraft } from '@/domain/listing';
import { availableWindows, windowFromRange } from '@/domain/pickup-windows';
import type { Item, ItemAddress } from '@/features/items/api';

/** Fills the listing form from a saved listing. A pickup time that has passed is left blank to re-pick. */
export function draftFromItem(item: Item, address: ItemAddress, now: Date = new Date()): ListingDraft {
  const { day, key } = windowFromRange(item.pickup_window_start, item.pickup_window_end);
  const stillOpen = key !== null && availableWindows(day, now).includes(key);
  return {
    ...EMPTY_DRAFT,
    category: item.category,
    title: item.title,
    value: String(item.value),
    condition: item.condition,
    day: stillOpen ? day : null,
    window: stillOpen ? key : null,
    photoPath: item.photo_path,
    street: address.street,
    unit: address.unit ?? '',
    town: item.town,
    zip: address.zip,
    note: address.pickup_note ?? '',
    adultHome: item.adult_home_confirmed,
  };
}
