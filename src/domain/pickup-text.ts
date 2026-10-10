/** The words shown for each step of a pickup, from each person's side. */
import type { PickupAction, PickupStatus, Viewer } from '@/domain/status';

/** The four timeline steps (see TIMELINE in status.ts). */
export const TIMELINE_LABELS: Record<'requested' | 'accepted' | 'collected' | 'confirmed', string> = {
  requested: 'Requested',
  accepted: 'Accepted',
  collected: 'Picked up',
  confirmed: 'Confirmed',
};

/** One sentence saying where things stand and what happens next. */
export function statusHeadline(status: PickupStatus, viewer: Viewer, otherName: string): string {
  if (viewer === 'donor') {
    switch (status) {
      case 'requested':
        return `${otherName} wants to pick up your item. Accept to share your address with them.`;
      case 'accepted':
        return `${otherName} is coming to pick it up. They can now see your address.`;
      case 'collected':
        return `${otherName} says they picked it up. Please confirm so they earn their hours.`;
      case 'confirmed':
        return 'All done. Thank you for donating!';
      case 'declined':
        return 'You declined this request. Your item is listed again.';
      default:
        return 'This pickup was cancelled. Your item is listed again.';
    }
  }
  switch (status) {
    case 'requested':
      return `Waiting for ${otherName} to answer. You'll see the address once they accept.`;
    case 'accepted':
      return `${otherName} accepted. Head over during the pickup time, then tap “I picked it up.”`;
    case 'collected':
      return `Waiting for ${otherName} to confirm. Your hours count once they do.`;
    case 'confirmed':
      return 'Confirmed. Your hours have been added. Thank you!';
    case 'declined':
      return `${otherName} declined this request. You can look for another item.`;
    default:
      return 'This pickup was cancelled.';
  }
}

export const ACTION_LABELS: Record<PickupAction, string> = {
  accept: 'Accept',
  decline: 'Decline',
  cancel: 'Cancel this pickup',
  mark_collected: 'I picked it up',
  confirm: 'Confirm it was picked up',
};

/** A short label for lists, e.g. on the Hours tab. */
export function shortStatus(status: PickupStatus, viewer: Viewer): string {
  switch (status) {
    case 'requested':
      return viewer === 'donor' ? 'Needs your answer' : 'Waiting for an answer';
    case 'accepted':
      return 'Scheduled';
    case 'collected':
      return viewer === 'donor' ? 'Please confirm' : 'Waiting for confirmation';
    case 'confirmed':
      return 'Confirmed';
    case 'declined':
      return 'Declined';
    default:
      return 'Cancelled';
  }
}

export type ReportReason = 'fake_listing' | 'inappropriate' | 'unsafe' | 'no_show' | 'harassment' | 'other';

/** Report reasons in the order they are offered. */
export const REPORT_REASONS: readonly { key: ReportReason; label: string }[] = [
  { key: 'unsafe', label: 'Something felt unsafe' },
  { key: 'harassment', label: 'Rude or harassing behavior' },
  { key: 'fake_listing', label: 'Fake or misleading listing' },
  { key: 'inappropriate', label: 'Inappropriate photo or words' },
  { key: 'no_show', label: "They didn't show up" },
  { key: 'other', label: 'Something else' },
];

export const REPORT_DETAILS_MAX = 500;
