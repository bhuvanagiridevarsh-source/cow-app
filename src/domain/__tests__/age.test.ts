import { ageGroup, birthYearOptions, minAge, nyToday } from '@/domain/age';

// Same cases as the database test (supabase/tests, B1a-B1f) so both sides agree.
describe('minAge (youngest possible age from birth month + year)', () => {
  it.each([
    [2013, 5, { year: 2026, month: 6 }, 13], // birth month has passed
    [2013, 6, { year: 2026, month: 6 }, 12], // same month counts as "not yet"
    [2013, 7, { year: 2026, month: 6 }, 12], // birth month still ahead
    [2008, 1, { year: 2026, month: 2 }, 18],
    [2008, 2, { year: 2026, month: 2 }, 17],
    [2008, 12, { year: 2026, month: 12 }, 17], // stays conservative even on Dec 31
  ])('born %i/%i, today %o -> %i', (y, m, today, expected) => {
    expect(minAge(y, m, today)).toBe(expected);
  });
});

describe('ageGroup (sign-up age gate)', () => {
  const today = { year: 2026, month: 9 };
  it('blocks under 13', () => {
    expect(ageGroup(2014, 1, today)).toBe('too_young'); // 12
    expect(ageGroup(2013, 9, today)).toBe('too_young'); // turns 13 this month: not yet
  });
  it('treats 13-17 as minors (guardian needed)', () => {
    expect(ageGroup(2013, 8, today)).toBe('minor'); // 13
    expect(ageGroup(2008, 9, today)).toBe('minor'); // turns 18 this month: not yet
  });
  it('treats 18+ as adults', () => {
    expect(ageGroup(2008, 8, today)).toBe('adult');
    expect(ageGroup(1960, 1, today)).toBe('adult');
  });
});

describe('nyToday', () => {
  it('uses New Jersey time, not UTC', () => {
    // 2026-10-01 02:00 UTC is still Sep 30 in New Jersey.
    expect(nyToday(new Date('2026-10-01T02:00:00Z'))).toEqual({ year: 2026, month: 9 });
    expect(nyToday(new Date('2026-10-01T12:00:00Z'))).toEqual({ year: 2026, month: 10 });
  });
});

describe('birthYearOptions', () => {
  it('lists this year back 100 years (no hint about the minimum age)', () => {
    const years = birthYearOptions({ year: 2026, month: 9 });
    expect(years[0]).toBe(2026);
    expect(years[years.length - 1]).toBe(1926);
    expect(years).toHaveLength(101);
  });
});
