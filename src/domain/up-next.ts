/** The "Up next" card on Home: the one pickup that most needs this person right now. */
import type { PickupStatus } from '@/domain/status';

type PickupLike = { id: string; status: PickupStatus; donor_id: string | null; volunteer_id: string | null; item_title: string; requested_at: string };

export type UpNext = { pickupId: string; title: string; body: string; action: string };

/**
 * What to show, most urgent first:
 * 1. A volunteer is waiting for the donor to confirm (their hours depend on it).
 * 2. Someone asked for the donor's item.
 * 3. The volunteer's own accepted pickup (go get it).
 * Null when nothing needs this person.
 */
export function upNext(pickups: readonly PickupLike[], userId: string | null): UpNext | null {
  if (!userId) return null;
  const oldestFirst = [...pickups].sort((a, b) => a.requested_at.localeCompare(b.requested_at));
  const find = (side: 'donor_id' | 'volunteer_id', status: PickupStatus) =>
    oldestFirst.find((p) => p[side] === userId && p.status === status);

  const confirm = find('donor_id', 'collected');
  if (confirm) {
    return {
      pickupId: confirm.id,
      title: 'Please confirm a pickup',
      body: `Your ${confirm.item_title} was picked up. Confirm it so the volunteer earns their hours.`,
      action: 'Confirm now',
    };
  }
  const answer = find('donor_id', 'requested');
  if (answer) {
    return {
      pickupId: answer.id,
      title: 'Someone wants your item',
      body: `A volunteer asked to pick up your ${answer.item_title}.`,
      action: 'Answer now',
    };
  }
  const go = find('volunteer_id', 'accepted');
  if (go) {
    return {
      pickupId: go.id,
      title: 'Your pickup is ready',
      body: `The donor accepted. See the address for the ${go.item_title}.`,
      action: 'See the address',
    };
  }
  return null;
}

/** "Maya" from "Maya Patel" (for the greeting). */
export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? '';
}
