import { distanceChoiceLabel, formatDistance, milesBetween, milesTo, sortByDistance } from '@/domain/distance';
import { addressLines, addressQuery, mapsUrl } from '@/domain/maps';
import { ACTION_LABELS, REPORT_REASONS, shortStatus, statusHeadline, TIMELINE_LABELS } from '@/domain/pickup-text';
import { claimsLeft, parseStats, requestBlocker, summarizeRequests, type MyStats } from '@/domain/requests';
import { actionsFor, TIMELINE, type PickupStatus } from '@/domain/status';
import type { Database } from '@/lib/database.types';

const MONROE = { lat: 40.33, lng: -74.44 };
const PRINCETON = { lat: 40.36, lng: -74.67 };
const NEWARK = { lat: 40.74, lng: -74.17 };

describe('distance', () => {
  it('measures straight-line miles', () => {
    expect(milesBetween(MONROE, MONROE)).toBe(0);
    expect(milesBetween(MONROE, PRINCETON)).toBeGreaterThan(11);
    expect(milesBetween(MONROE, PRINCETON)).toBeLessThan(13);
    expect(milesBetween(MONROE, NEWARK)).toBeGreaterThan(30);
    expect(milesBetween(MONROE, NEWARK)).toBeLessThan(33);
    expect(milesBetween(MONROE, NEWARK)).toBeCloseTo(milesBetween(NEWARK, MONROE), 6);
  });
  it('is always shown as approximate', () => {
    expect(formatDistance(0)).toBe('under 1 mi');
    expect(formatDistance(0.9)).toBe('under 1 mi');
    expect(formatDistance(1)).toBe('about 1 mi');
    expect(formatDistance(3.4)).toBe('about 3 mi');
    expect(formatDistance(3.5)).toBe('about 4 mi');
    expect(formatDistance(NaN)).toBe('');
    expect(distanceChoiceLabel(10)).toBe('Within 10 miles');
    expect(distanceChoiceLabel(null)).toBe('Any distance');
  });
  const listing = (id: string, point: { lat: number; lng: number } | null, start: string) => ({
    id,
    approx_lat: point?.lat ?? null,
    approx_lng: point?.lng ?? null,
    pickup_window_start: start,
  });
  const items = [
    listing('newark', NEWARK, '2026-10-12T13:00:00Z'),
    listing('unknown', null, '2026-10-11T13:00:00Z'),
    listing('princeton', PRINCETON, '2026-10-14T13:00:00Z'),
    listing('monroe', MONROE, '2026-10-13T13:00:00Z'),
  ];
  it('sorts nearest first, with unknown locations last', () => {
    expect(sortByDistance(items, MONROE, null).map((r) => r.item.id)).toEqual(['monroe', 'princeton', 'newark', 'unknown']);
  });
  it('applies the distance filter', () => {
    expect(sortByDistance(items, MONROE, 25).map((r) => r.item.id)).toEqual(['monroe', 'princeton']);
    expect(sortByDistance(items, MONROE, 5).map((r) => r.item.id)).toEqual(['monroe']);
  });
  it('with no known starting point, shows everything by soonest pickup', () => {
    expect(sortByDistance(items, null, 5).map((r) => r.item.id)).toEqual(['unknown', 'newark', 'monroe', 'princeton']);
    expect(milesTo(null, items[0])).toBeNull();
    expect(milesTo(MONROE, items[1])).toBeNull();
  });
});

describe('maps', () => {
  const address = { street: ' 12 Maple St ', unit: 'Apt 3', town: 'Monroe Twp', zip: '08831' };
  it('builds a searchable address without the unit', () => {
    expect(addressQuery(address)).toBe('12 Maple St, Monroe Twp, NJ 08831');
  });
  it('shows the full address, unit included', () => {
    expect(addressLines(address)).toBe('12 Maple St, Apt 3\nMonroe Twp, NJ 08831');
    expect(addressLines({ ...address, unit: null })).toBe('12 Maple St\nMonroe Twp, NJ 08831');
  });
  it('opens Apple Maps on iPhone and Google Maps on Android', () => {
    expect(mapsUrl(address, 'ios')).toBe('https://maps.apple.com/?daddr=12%20Maple%20St%2C%20Monroe%20Twp%2C%20NJ%2008831');
    expect(mapsUrl(address, 'android')).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=12%20Maple%20St%2C%20Monroe%20Twp%2C%20NJ%2008831',
    );
  });
  it('keeps odd characters from breaking the link', () => {
    expect(mapsUrl({ street: '5 A&B Rd #2', town: 'Edison', zip: '08817' }, 'ios')).toContain('5%20A%26B%20Rd%20%232');
  });
});

describe('who can request a pickup', () => {
  const stats: MyStats = {
    hours: 0, pickups_confirmed: 0, value_collected: 0, value_donated: 0, tier_value: 0,
    active_claims: 0, claim_limit: 1, active_listings: 0, listing_limit: 10,
    is_minor: false, can_pick_up: true, needs_adult_on_pickup: false, needs_adult_home: false,
  };
  it('reads my_stats() from the server, and rejects anything malformed', () => {
    expect(parseStats({ ...stats, hours: '2.00' })).toEqual({ ...stats, hours: 2 });
    expect(parseStats(null)).toBeNull();
    expect(parseStats('x')).toBeNull();
    expect(parseStats({ ...stats, can_pick_up: 'yes' })).toBeNull();
    expect(parseStats({ ...stats, claim_limit: undefined })).toBeNull();
    expect(parseStats({ ...stats, hours: 'lots' })).toBeNull();
  });
  it('lets an eligible volunteer request', () => {
    expect(requestBlocker(stats, 16)).toBeNull();
    expect(claimsLeft(stats)).toBe(1);
  });
  it('explains the age rule using the board’s current age', () => {
    expect(requestBlocker({ ...stats, can_pick_up: false }, 16)).toMatch(/Pickups start at age 16/);
    expect(requestBlocker({ ...stats, can_pick_up: false }, 18)).toMatch(/age 18/);
  });
  it('explains the limit of pickups in progress', () => {
    expect(requestBlocker({ ...stats, active_claims: 1 }, 16)).toMatch(/already have a pickup in progress/);
    expect(requestBlocker({ ...stats, active_claims: 5, claim_limit: 5 }, 16)).toMatch(/5 pickups in progress/);
    expect(claimsLeft({ ...stats, active_claims: 7, claim_limit: 5 })).toBe(0);
  });
  it('stops an Ambassador from choosing more than they have room for', () => {
    const ambassador = { ...stats, active_claims: 3, claim_limit: 5 };
    expect(requestBlocker(ambassador, 16, 2)).toBeNull();
    expect(requestBlocker(ambassador, 16, 3)).toMatch(/2 more items/);
    expect(requestBlocker({ ...ambassador, active_claims: 4 }, 16, 2)).toMatch(/1 more item /);
  });
  it('sums up the result of a request', () => {
    const row = (result: string) => ({ item_id: 'i', pickup_id: result === 'requested' ? 'p' : null, result });
    expect(summarizeRequests([row('requested')])).toEqual({ requested: 1, message: null });
    expect(summarizeRequests([row('unavailable')])).toEqual({ requested: 0, message: 'One item is no longer available.' });
    expect(summarizeRequests([row('own_item')]).message).toMatch(/your own item/);
    const mixed = summarizeRequests([row('requested'), row('requested'), row('unavailable'), row('unavailable'), row('over_limit')]);
    expect(mixed.requested).toBe(2);
    expect(mixed.message).toBe('2 items are no longer available. One item was over your limit.');
    expect(summarizeRequests([]).message).toMatch(/Nothing was requested/);
  });
});

describe('pickup wording', () => {
  const statuses: PickupStatus[] = ['requested', 'accepted', 'collected', 'confirmed', 'declined', 'cancelled'];
  it('has a timeline label for every timeline step', () => {
    for (const step of TIMELINE) expect(TIMELINE_LABELS[step as keyof typeof TIMELINE_LABELS]).toBeTruthy();
  });
  it('has a headline and a short label for every status and side', () => {
    for (const status of statuses) {
      for (const viewer of ['donor', 'volunteer'] as const) {
        expect(statusHeadline(status, viewer, 'Maya P.').length).toBeGreaterThan(10);
        expect(shortStatus(status, viewer).length).toBeGreaterThan(3);
      }
    }
  });
  it('tells the donor that accepting shares their address', () => {
    expect(statusHeadline('requested', 'donor', 'Maya P.')).toMatch(/share your address/);
  });
  it('never promises a volunteer the address before the donor accepts', () => {
    expect(statusHeadline('requested', 'volunteer', 'Sam D.')).toMatch(/once they accept/);
  });
  it('has a label for every button either side can see', () => {
    for (const status of statuses) {
      for (const viewer of ['donor', 'volunteer'] as const) {
        for (const action of actionsFor(status, viewer)) expect(ACTION_LABELS[action]).toBeTruthy();
      }
    }
  });
  it('offers exactly the report reasons the database accepts', () => {
    const allowed: Database['public']['Enums']['report_reason'][] = [
      'fake_listing', 'inappropriate', 'unsafe', 'no_show', 'harassment', 'other',
    ];
    expect(REPORT_REASONS.map((r) => r.key).sort()).toEqual([...allowed].sort());
  });
});
