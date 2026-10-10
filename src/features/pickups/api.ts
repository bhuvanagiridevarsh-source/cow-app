import type { Point } from '@/domain/distance';
import type { ReportReason } from '@/domain/pickup-text';
import { parseStats, type MyStats, type RequestResult } from '@/domain/requests';
import type { Item, ItemAddress } from '@/features/items/api';
import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

export type Pickup = Database['public']['Tables']['pickups']['Row'];

/** What each side may know about the other (never a full name, email, or ZIP). */
export type Counterpart = {
  user_id: string | null;
  display_name: string;
  verified_ambassador: boolean;
  completed_pickups: number;
};

/** Open listings from other people. The database already leaves out blocked, hidden, and expired ones. */
export async function fetchOpenItems(userId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('status', 'listed')
    .is('hidden_at', null)
    .gt('pickup_window_end', new Date().toISOString())
    .neq('donor_id', userId)
    .order('pickup_window_start', { ascending: true })
    .limit(300);
  if (error) throw error;
  return data;
}

/** One listing, or null if it's gone or this person isn't allowed to see it. */
export async function fetchItem(itemId: string): Promise<Item | null> {
  const { data, error } = await supabase.from('items').select('*').eq('id', itemId).maybeSingle();
  if (error) throw error;
  return data;
}

/** The approximate map point for a ZIP code (public census data). */
export async function fetchZipPoint(zip: string): Promise<Point | null> {
  const { data, error } = await supabase.from('zip_centroids').select('lat, lng').eq('zip', zip).maybeSingle();
  if (error) throw error;
  return data ? { lat: Number(data.lat), lng: Number(data.lng) } : null;
}

export async function fetchMyStats(): Promise<MyStats> {
  const { data, error } = await supabase.rpc('my_stats');
  if (error) throw error;
  const stats = parseStats(data);
  if (!stats) throw new Error('Unexpected reply from my_stats');
  return stats;
}

/** Ask to pick up one item, or several at once for verified Ambassadors. */
export async function requestPickups(itemIds: string[], adultAttending: boolean): Promise<RequestResult[]> {
  const { data, error } = await supabase.rpc('request_pickups', {
    p_item_ids: itemIds,
    p_adult_attending: adultAttending,
  });
  if (error) throw error;
  return data;
}

export type PickupDetail = {
  pickup: Pickup;
  /** Null if the listing was deleted (e.g. the donor closed their account). */
  item: Item | null;
  /** Only present for the donor, and for the volunteer once the donor accepts. */
  address: ItemAddress | null;
  other: Counterpart;
};

function parseCounterpart(input: unknown): Counterpart {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  return {
    user_id: typeof raw.user_id === 'string' ? raw.user_id : null,
    display_name: typeof raw.display_name === 'string' && raw.display_name ? raw.display_name : 'A CoW member',
    verified_ambassador: raw.verified_ambassador === true,
    completed_pickups: Number.isFinite(Number(raw.completed_pickups)) ? Number(raw.completed_pickups) : 0,
  };
}

/** Everything the pickup screen shows. Null if the pickup doesn't exist or isn't this person's. */
export async function fetchPickup(pickupId: string): Promise<PickupDetail | null> {
  const { data: pickup, error } = await supabase.from('pickups').select('*').eq('id', pickupId).maybeSingle();
  if (error) throw error;
  if (!pickup) return null;
  const itemId = pickup.item_id;
  const [item, address, other] = await Promise.all([
    itemId ? supabase.from('items').select('*').eq('id', itemId).maybeSingle() : null,
    // The database returns no row here unless this person is allowed to see the address.
    itemId ? supabase.from('item_addresses').select('*').eq('item_id', itemId).maybeSingle() : null,
    supabase.rpc('pickup_counterpart', { p_pickup_id: pickupId }),
  ]);
  if (item?.error) throw item.error;
  if (address?.error) throw address.error;
  if (other.error) throw other.error;
  return {
    pickup,
    item: item?.data ?? null,
    address: address?.data ?? null,
    other: parseCounterpart(other.data),
  };
}

/** Every pickup this person is part of, as volunteer or donor, newest first. */
export async function fetchMyPickups(): Promise<Pickup[]> {
  const { data, error } = await supabase
    .from('pickups')
    .select('*')
    .order('requested_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
}

async function run(call: PromiseLike<{ error: unknown }>): Promise<void> {
  const { error } = await call;
  if (error) throw error;
}

export const respondToRequest = (pickupId: string, accept: boolean) =>
  run(supabase.rpc('respond_to_request', { p_pickup_id: pickupId, p_accept: accept }));
export const markCollected = (pickupId: string) => run(supabase.rpc('mark_collected', { p_pickup_id: pickupId }));
export const confirmPickup = (pickupId: string) => run(supabase.rpc('confirm_pickup', { p_pickup_id: pickupId }));
export const cancelPickup = (pickupId: string) => run(supabase.rpc('cancel_pickup', { p_pickup_id: pickupId }));
export const blockUser = (userId: string) => run(supabase.rpc('block_user', { p_user_id: userId }));
export const unblockUser = (userId: string) => run(supabase.rpc('unblock_user', { p_user_id: userId }));

export type BlockedUser = { user_id: string; display_name: string; blocked_at: string };

export async function fetchBlockedUsers(): Promise<BlockedUser[]> {
  const { data, error } = await supabase.rpc('my_blocked_users');
  if (error) throw error;
  return data;
}

export type ReportTarget = { itemId?: string; pickupId?: string; userId?: string };

export async function sendReport(reason: ReportReason, details: string, target: ReportTarget): Promise<void> {
  await run(
    supabase.rpc('report', {
      p_reason: reason,
      p_details: details.trim() || undefined,
      p_item_id: target.itemId,
      p_pickup_id: target.pickupId,
      p_user_id: target.userId,
    }),
  );
}
