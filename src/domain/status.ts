/**
 * The pickup loop (docs/PLAN.md §5). The DATABASE enforces these moves (guard triggers in
 * supabase/migrations/..._functions.sql); this copy decides which button the app shows.
 * A unit test reads the migration file and fails if the two ever disagree.
 */
import type { Database } from '@/lib/database.types';

export type ItemStatus = Database['public']['Enums']['item_status'];
export type PickupStatus = Database['public']['Enums']['pickup_status'];

export const ITEM_TRANSITIONS: Record<ItemStatus, readonly ItemStatus[]> = {
  listed: ['requested', 'withdrawn', 'removed'],
  requested: ['listed', 'accepted', 'withdrawn', 'removed'],
  accepted: ['listed', 'collected', 'withdrawn', 'removed'],
  collected: ['confirmed', 'listed', 'removed'],
  confirmed: [],
  withdrawn: [],
  removed: [],
};

export const PICKUP_TRANSITIONS: Record<PickupStatus, readonly PickupStatus[]> = {
  requested: ['accepted', 'declined', 'cancelled'],
  accepted: ['collected', 'cancelled'],
  collected: ['confirmed', 'cancelled'],
  declined: [],
  cancelled: [],
  confirmed: [],
};

export function canItemMove(from: ItemStatus, to: ItemStatus): boolean {
  return ITEM_TRANSITIONS[from].includes(to);
}

export function canPickupMove(from: PickupStatus, to: PickupStatus): boolean {
  return PICKUP_TRANSITIONS[from].includes(to);
}

export type Viewer = 'donor' | 'volunteer';
export type PickupAction = 'accept' | 'decline' | 'cancel' | 'mark_collected' | 'confirm';

/**
 * Buttons each side sees at each step. Matches who the database functions allow:
 * donor accepts/declines/confirms; volunteer marks picked up; either cancels before pickup.
 * (Admin-only moves, like undoing a mistaken "picked up", are done in the dashboard.)
 */
export function actionsFor(status: PickupStatus, viewer: Viewer): PickupAction[] {
  if (viewer === 'donor') {
    if (status === 'requested') return ['accept', 'decline'];
    if (status === 'accepted') return ['cancel'];
    if (status === 'collected') return ['confirm'];
    return [];
  }
  if (status === 'requested') return ['cancel'];
  if (status === 'accepted') return ['mark_collected', 'cancel'];
  return [];
}

/** The four steps on the pickup timeline. */
export const TIMELINE: readonly PickupStatus[] = ['requested', 'accepted', 'collected', 'confirmed'];

/** How far along the timeline a pickup is (-1 if it was declined or cancelled). */
export function timelineStep(status: PickupStatus): number {
  return TIMELINE.indexOf(status);
}

/** Pickups that count toward a volunteer's limit (mirrors private.active_claims). */
export function isActivePickup(status: PickupStatus): boolean {
  return status === 'requested' || status === 'accepted' || status === 'collected';
}
