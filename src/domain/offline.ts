/**
 * What the app keeps on the phone so it still shows something with no connection.
 *
 * Only this list is saved. Deliberately left out:
 * - 'pickup' and 'my-item': they hold a donor's exact address.
 * - 'phone-point': the phone's location is never saved anywhere.
 * - 'photo-link': photo links stop working after 30 minutes.
 * - 'item': a single listing may have been taken since.
 */
export const SAVED_QUERIES: readonly string[] = [
  'profile',
  'settings',
  'impact',
  'content',
  'my-items',
  'my-pickups',
  'my-stats',
  'open-items',
  'zip-point',
  'blocked-users',
];

/** Saved data older than this is thrown away (it's replaced whenever the phone is online). */
export const SAVED_FOR_MS = 7 * 24 * 60 * 60 * 1000;

/** True if a loaded query may be written to the phone's storage. */
export function shouldSaveQuery(queryKey: readonly unknown[], status: string): boolean {
  return status === 'success' && typeof queryKey[0] === 'string' && SAVED_QUERIES.includes(queryKey[0]);
}
