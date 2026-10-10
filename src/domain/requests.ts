/**
 * Whether someone can ask to pick up an item, and how to explain it if they can't.
 * The database decides for real (private.request_pickups); this is so the app can say why
 * before the button is even tapped.
 */

/** What public.my_stats() returns. */
export type MyStats = {
  hours: number;
  pickups_confirmed: number;
  value_collected: number;
  value_donated: number;
  tier_value: number;
  active_claims: number;
  claim_limit: number;
  active_listings: number;
  listing_limit: number;
  is_minor: boolean;
  can_pick_up: boolean;
  needs_adult_on_pickup: boolean;
  needs_adult_home: boolean;
};

const NUMBER_KEYS = [
  'hours', 'pickups_confirmed', 'value_collected', 'value_donated', 'tier_value',
  'active_claims', 'claim_limit', 'active_listings', 'listing_limit',
] as const;
const BOOLEAN_KEYS = ['is_minor', 'can_pick_up', 'needs_adult_on_pickup', 'needs_adult_home'] as const;

/** Checks the shape of my_stats() so a surprise from the server can't crash a screen. */
export function parseStats(input: unknown): MyStats | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, unknown>;
  const out: Record<string, number | boolean> = {};
  for (const key of NUMBER_KEYS) {
    const n = Number(raw[key]);
    if (raw[key] === null || raw[key] === undefined || !Number.isFinite(n)) return null;
    out[key] = n;
  }
  for (const key of BOOLEAN_KEYS) {
    if (typeof raw[key] !== 'boolean') return null;
    out[key] = raw[key];
  }
  return out as MyStats;
}

/** How many more pickups this person can have in progress. */
export function claimsLeft(stats: MyStats): number {
  return Math.max(0, stats.claim_limit - stats.active_claims);
}

/** Why this person can't request right now, in plain words. Null if they can. */
export function requestBlocker(stats: MyStats, minPickupAge: number, wanted = 1): string | null {
  if (!stats.can_pick_up) {
    return `Pickups start at age ${minPickupAge}. You can still list items and share CoW with friends!`;
  }
  const left = claimsLeft(stats);
  if (left === 0) {
    return stats.claim_limit === 1
      ? 'You already have a pickup in progress. Finish it before asking for another.'
      : `You already have ${stats.active_claims} pickups in progress, which is the most allowed. Finish one first.`;
  }
  if (wanted > left) {
    return `You can ask for ${left} more ${left === 1 ? 'item' : 'items'} right now. Please choose fewer.`;
  }
  return null;
}

export type RequestResult = { item_id: string; pickup_id: string | null; result: string };

/** Sums up what happened after asking for one or several items. */
export function summarizeRequests(rows: readonly RequestResult[]): { requested: number; message: string | null } {
  const count = (result: string) => rows.filter((r) => r.result === result).length;
  const requested = count('requested');
  const gone = count('unavailable');
  const mine = count('own_item');
  const over = count('over_limit');
  const problems: string[] = [];
  if (gone > 0) {
    problems.push(gone === 1 ? 'One item is no longer available.' : `${gone} items are no longer available.`);
  }
  if (mine > 0) problems.push("You can't pick up your own item.");
  if (over > 0) {
    problems.push(over === 1 ? 'One item was over your limit.' : `${over} items were over your limit.`);
  }
  if (requested === 0 && problems.length === 0) problems.push('Nothing was requested. Please try again.');
  return { requested, message: problems.length > 0 ? problems.join(' ') : null };
}
