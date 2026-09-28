/**
 * Turns database error codes (raised as e.g. 'COW_CLAIM_LIMIT' by the functions in
 * supabase/migrations) into friendly words. A unit test checks that every code the
 * database can raise has a message here.
 */

export const ERROR_MESSAGES: Record<string, string> = {
  COW_NOT_SIGNED_IN: 'Please sign in again.',
  COW_PROFILE_EXISTS: 'Your account is already set up.',
  COW_PROFILE_REQUIRED: 'Please finish setting up your account first.',
  COW_BAD_BIRTH_DATE: 'Please choose your birth month and year.',
  COW_UNDER_13: 'You need to be 13 or older to use the CoW app.',
  COW_BAD_NAME: 'Please enter your name.',
  COW_BAD_ZIP: 'Please enter a 5-digit ZIP code.',
  COW_BAD_ROLE: 'Please choose how you want to help.',
  COW_TERMS_REQUIRED: 'Please accept the Terms of Use to continue.',
  COW_GUARDIAN_REQUIRED:
    "Please add your parent or guardian's name and email, and check the consent box.",
  COW_BAD_GUARDIAN_EMAIL: "Please check your parent or guardian's email address.",
  COW_BAD_TITLE: 'Please give the item a short name (3 to 60 letters) and choose a category and condition.',
  COW_BAD_VALUE: 'Please enter an estimated value of at least $1.',
  COW_VALUE_TOO_HIGH: 'That value is higher than CoW allows for one item.',
  COW_PHOTO_MISSING: "We couldn't find your photo. Please add it again.",
  COW_BAD_WINDOW: "Please pick a pickup day and time that hasn't passed yet.",
  COW_BAD_ADDRESS: 'Please check the street and town.',
  COW_OUT_OF_AREA: "Sorry, CoW doesn't pick up in that area yet. Right now we serve New Jersey.",
  COW_ADULT_HOME_REQUIRED:
    'Please confirm that a parent or guardian approves and an adult will be home for the pickup.',
  COW_TOO_MANY_LISTINGS: 'You already have the most listings allowed at once. Finish or remove one first.',
  COW_NOT_FOUND: "We couldn't find that. It may have been removed.",
  COW_NOT_EDITABLE: "This item can't be changed right now because a pickup is in progress.",
  COW_NO_ITEMS: 'Please choose at least one item.',
  COW_TOO_MANY_ITEMS: 'Please choose fewer items.',
  COW_TOO_YOUNG_FOR_PICKUP:
    "You're not old enough for pickups yet. You can still list items and share CoW with friends!",
  COW_ADULT_REQUIRED: 'Please confirm that an adult will come with you on this pickup.',
  COW_AMBASSADOR_ONLY: 'Only verified Ambassadors can request several items at once.',
  COW_CLAIM_LIMIT: "You've reached your limit of pickups in progress. Finish one first.",
  COW_INVALID_TRANSITION: 'This pickup has already moved on. Pull down to refresh.',
  COW_BLOCKED: "This pickup can't continue.",
  COW_CANNOT_BLOCK_SELF: "You can't block yourself.",
  COW_REPORT_TARGET_REQUIRED: 'Please choose what you are reporting.',
  COW_BAD_DETAILS: 'Please keep the details under 500 characters.',
  COW_TOO_MANY_REPORTS: "You've sent a lot of reports today. CoW will review them soon.",
  COW_FORBIDDEN: "You don't have access to that.",
  COW_PHOTOS_REMAIN: "We couldn't remove your photos yet. Please try again.",
  COW_IMMUTABLE_FIELD: "That can't be changed.",
};

/** Better wording when the database also sends a number (the board's current limit). */
const WITH_DETAIL: Partial<Record<string, (detail: string) => string>> = {
  COW_VALUE_TOO_HIGH: (d) => `That value is higher than CoW allows for one item (up to $${d}).`,
  COW_TOO_MANY_LISTINGS: (d) =>
    `You already have the most listings allowed at once (${d}). Finish or remove one first.`,
  COW_TOO_YOUNG_FOR_PICKUP: (d) =>
    `Pickups start at age ${d}. You can still list items and share CoW with friends!`,
};

const GENERIC = 'Something went wrong. Please try again.';
const OFFLINE = "You're offline. Check your internet connection and try again.";

type ErrorLike = { message?: unknown; details?: unknown };

/** Friendly message for anything thrown by Supabase or the network. Never shows raw errors. */
export function friendlyError(error: unknown): string {
  if (!error || typeof error !== 'object') return GENERIC;
  const e = error as ErrorLike;
  const message = typeof e.message === 'string' ? e.message : '';
  const known = ERROR_MESSAGES[message];
  if (known) {
    const detail = typeof e.details === 'string' ? e.details.trim() : '';
    const withDetail = WITH_DETAIL[message];
    return withDetail && /^\d+$/.test(detail) ? withDetail(detail) : known;
  }
  if (/network request failed|failed to fetch|network error|timed? ?out/i.test(message)) return OFFLINE;
  return GENERIC;
}

/** The error code (e.g. 'COW_CLAIM_LIMIT'), if the error came from our database rules. */
export function errorCode(error: unknown): string | null {
  const message = (error as ErrorLike | null)?.message;
  return typeof message === 'string' && message in ERROR_MESSAGES ? message : null;
}
