/** How a donor's listings are grouped on the Donate tab (docs/PLAN.md §4, screen 12). */
import type { ItemStatus } from '@/domain/status';

export type DonationGroup = 'needs_answer' | 'scheduled' | 'confirm' | 'waiting' | 'done' | 'taken_down';

/** Groups in the order they appear: things that need the donor come first. */
export const DONATION_GROUPS: readonly { key: DonationGroup; title: string }[] = [
  { key: 'needs_answer', title: 'Needs your answer' },
  { key: 'confirm', title: 'Picked up: please confirm' },
  { key: 'scheduled', title: 'Scheduled' },
  { key: 'waiting', title: 'Waiting for a volunteer' },
  { key: 'done', title: 'Done' },
  { key: 'taken_down', title: 'Taken down by CoW' },
];

/** Which group a listing belongs in. Null for listings the donor withdrew (they're not shown). */
export function donationGroup(status: ItemStatus): DonationGroup | null {
  switch (status) {
    case 'requested':
      return 'needs_answer';
    case 'accepted':
      return 'scheduled';
    case 'collected':
      return 'confirm';
    case 'listed':
      return 'waiting';
    case 'confirmed':
      return 'done';
    case 'removed':
      return 'taken_down';
    default:
      return null;
  }
}

/** Sorts listings into the groups above, dropping empty groups. */
export function groupDonations<T extends { status: ItemStatus }>(
  items: readonly T[],
): { key: DonationGroup; title: string; items: T[] }[] {
  return DONATION_GROUPS.map((g) => ({ ...g, items: items.filter((i) => donationGroup(i.status) === g.key) })).filter(
    (g) => g.items.length > 0,
  );
}

/** Listings that count toward the donor's limit (mirrors the count in private.create_item). */
export function countsTowardLimit(status: ItemStatus): boolean {
  return status === 'listed' || status === 'requested' || status === 'accepted' || status === 'collected';
}
