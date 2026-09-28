/// <reference types="node" />
// (Node types come with Jest; these tests read the migration files.)
import { readFileSync } from 'fs';
import { join } from 'path';

import {
  actionsFor,
  canItemMove,
  canPickupMove,
  isActivePickup,
  ITEM_TRANSITIONS,
  PICKUP_TRANSITIONS,
  timelineStep,
} from '@/domain/status';

/** Reads the allowed moves straight out of the database guard in the migration file. */
function transitionsFromSql(functionName: string): Record<string, string[]> {
  const sql = readFileSync(
    join(__dirname, '../../../supabase/migrations/20260927000400_functions.sql'),
    'utf8',
  );
  const start = sql.indexOf(`create function private.${functionName}()`);
  const body = sql.slice(start, sql.indexOf('$$;', start));
  const result: Record<string, string[]> = {};
  for (const m of body.matchAll(/\(old\.status = '(\w+)'\s+and new\.status in \(([^)]*)\)\)/g)) {
    result[m[1]] = m[2].split(',').map((s) => s.trim().replace(/'/g, ''));
  }
  return result;
}

const withoutEmpty = (t: Record<string, readonly string[]>) =>
  Object.fromEntries(Object.entries(t).filter(([, to]) => to.length > 0));

describe('status rules match the database guard exactly', () => {
  it('items', () => {
    expect(transitionsFromSql('guard_item_update')).toEqual(withoutEmpty(ITEM_TRANSITIONS));
  });
  it('pickups', () => {
    expect(transitionsFromSql('guard_pickup_update')).toEqual(withoutEmpty(PICKUP_TRANSITIONS));
  });
});

describe('pickup loop', () => {
  it('follows listed -> requested -> accepted -> collected -> confirmed', () => {
    expect(canItemMove('listed', 'requested')).toBe(true);
    expect(canItemMove('requested', 'accepted')).toBe(true);
    expect(canItemMove('accepted', 'collected')).toBe(true);
    expect(canItemMove('collected', 'confirmed')).toBe(true);
  });
  it('cannot skip steps or undo a confirmation', () => {
    expect(canItemMove('listed', 'confirmed')).toBe(false);
    expect(canItemMove('requested', 'collected')).toBe(false);
    expect(canItemMove('confirmed', 'listed')).toBe(false);
    expect(canPickupMove('requested', 'confirmed')).toBe(false);
    expect(canPickupMove('confirmed', 'cancelled')).toBe(false);
  });
  it('lets either side cancel before pickup, but not the volunteer after', () => {
    expect(actionsFor('requested', 'volunteer')).toContain('cancel');
    expect(actionsFor('accepted', 'volunteer')).toContain('cancel');
    expect(actionsFor('accepted', 'donor')).toContain('cancel');
    expect(actionsFor('collected', 'volunteer')).toEqual([]);
  });
  it('only the donor accepts and confirms; only the volunteer marks picked up', () => {
    expect(actionsFor('requested', 'donor')).toEqual(['accept', 'decline']);
    expect(actionsFor('collected', 'donor')).toEqual(['confirm']);
    expect(actionsFor('accepted', 'volunteer')).toContain('mark_collected');
    expect(actionsFor('requested', 'volunteer')).not.toContain('accept');
    expect(actionsFor('collected', 'volunteer')).not.toContain('confirm');
  });
  it('timeline steps and active pickups', () => {
    expect(timelineStep('requested')).toBe(0);
    expect(timelineStep('confirmed')).toBe(3);
    expect(timelineStep('declined')).toBe(-1);
    expect(isActivePickup('collected')).toBe(true);
    expect(isActivePickup('confirmed')).toBe(false);
    expect(isActivePickup('cancelled')).toBe(false);
  });
});
