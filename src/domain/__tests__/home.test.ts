import { formatHours, hoursSummary, tierProgress, TIERS } from '@/domain/tiers';
import { firstName, upNext } from '@/domain/up-next';

describe('tiers (brief §5)', () => {
  it('are CoW’s membership levels', () => {
    expect(TIERS).toEqual([
      { name: 'Volunteer', min: 0 },
      { name: 'Supporter', min: 100 },
      { name: 'Activist', min: 250 },
      { name: 'Ambassador', min: 500 },
      { name: 'Change Maker', min: 1000 },
    ]);
  });
  it.each([
    [0, 'Volunteer', 'Supporter', 100, 0],
    [99, 'Volunteer', 'Supporter', 1, 0.99],
    [100, 'Supporter', 'Activist', 150, 0],
    [175, 'Supporter', 'Activist', 75, 0.5],
    [249, 'Supporter', 'Activist', 1, 149 / 150],
    [250, 'Activist', 'Ambassador', 250, 0],
    [500, 'Ambassador', 'Change Maker', 500, 0],
    [999, 'Ambassador', 'Change Maker', 1, 499 / 500],
  ])('$%d is %s, %s next', (value, current, next, toNext, progress) => {
    const t = tierProgress(value);
    expect(t.current.name).toBe(current);
    expect(t.next?.name).toBe(next);
    expect(t.toNext).toBe(toNext);
    expect(t.progress).toBeCloseTo(progress, 6);
  });
  it('tops out at Change Maker', () => {
    for (const value of [1000, 5000, 1_000_000]) {
      expect(tierProgress(value)).toEqual({ current: TIERS[4], next: null, toNext: 0, progress: 1 });
    }
  });
  it('treats bad numbers as zero', () => {
    for (const value of [-5, NaN, Infinity * 0]) expect(tierProgress(value).current.name).toBe('Volunteer');
  });
  it('rounds the amount still needed up, so it never says $0 too early', () => {
    expect(tierProgress(99.5).toNext).toBe(1);
  });
});

describe('hours', () => {
  it('formats totals', () => {
    expect(formatHours(0)).toBe('0 hours');
    expect(formatHours(1)).toBe('1 hour');
    expect(formatHours(2)).toBe('2 hours');
    expect(formatHours(2.5)).toBe('2.5 hours');
    expect(formatHours(-1)).toBe('0 hours');
    expect(formatHours(NaN)).toBe('0 hours');
  });
  it('builds the share summary from confirmed numbers only', () => {
    const text = hoursSummary({
      name: 'Maya Patel', hours: 3, pickups: 3, valueCollected: 1240, tierName: 'Change Maker', today: 'Oct 10, 2026',
    });
    expect(text).toContain('Maya Patel');
    expect(text).toContain('As of Oct 10, 2026');
    expect(text).toContain('Volunteer hours: 3 hours');
    expect(text).toContain('Pickups: 3 confirmed pickups');
    expect(text).toContain('Value of items collected: $1,240');
    expect(text).toContain('Level: Change Maker');
    expect(text).toMatch(/only after the donor or CoW confirms/);
    expect(text).not.toMatch(/tax.?deductible/i);
  });
  it('uses the singular for one pickup', () => {
    expect(hoursSummary({ name: 'A', hours: 1, pickups: 1, valueCollected: 50, tierName: 'Volunteer', today: 'x' })).toContain(
      'Pickups: 1 confirmed pickup\n',
    );
  });
});

describe('Up next', () => {
  const me = 'me';
  const pickup = (id: string, status: string, side: 'donor' | 'volunteer', at = '2026-10-10T10:00:00Z') => ({
    id,
    status: status as never,
    donor_id: side === 'donor' ? me : 'other',
    volunteer_id: side === 'volunteer' ? me : 'other',
    item_title: `item-${id}`,
    requested_at: at,
  });
  it('is empty when nothing needs me', () => {
    expect(upNext([], me)).toBeNull();
    expect(upNext([pickup('a', 'requested', 'volunteer'), pickup('b', 'confirmed', 'donor'), pickup('c', 'accepted', 'donor')], me)).toBeNull();
    expect(upNext([pickup('a', 'requested', 'donor')], null)).toBeNull();
  });
  it('puts confirming first, then answering, then my own accepted pickup', () => {
    const all = [pickup('go', 'accepted', 'volunteer'), pickup('answer', 'requested', 'donor'), pickup('confirm', 'collected', 'donor')];
    expect(upNext(all, me)?.pickupId).toBe('confirm');
    expect(upNext(all.slice(0, 2), me)?.pickupId).toBe('answer');
    expect(upNext(all.slice(0, 1), me)?.pickupId).toBe('go');
  });
  it('shows the one that has waited longest', () => {
    const two = [pickup('new', 'requested', 'donor', '2026-10-10T12:00:00Z'), pickup('old', 'requested', 'donor', '2026-10-09T12:00:00Z')];
    expect(upNext(two, me)?.pickupId).toBe('old');
  });
  it('names the item and the action', () => {
    expect(upNext([pickup('a', 'requested', 'donor')], me)).toEqual({
      pickupId: 'a',
      title: 'Someone wants your item',
      body: 'A volunteer asked to pick up your item-a.',
      action: 'Answer now',
    });
  });
  it('firstName', () => {
    expect(firstName('Maya Patel')).toBe('Maya');
    expect(firstName('  Yuvraaj Kumar ')).toBe('Yuvraaj');
    expect(firstName('')).toBe('');
    expect(firstName(null)).toBe('');
  });
});
