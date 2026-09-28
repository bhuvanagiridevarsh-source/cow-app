/**
 * Age rules. Mirrors private.min_age() in the database (supabase/migrations/..._security_rules.sql);
 * both are tested with the same cases.
 *
 * We only know birth month + year, so we use the YOUNGEST age someone could be:
 * if today is in or before their birth month, we assume the birthday hasn't happened yet.
 */
export type YearMonth = { year: number; month: number }; // month is 1-12

export const MIN_ACCOUNT_AGE = 13;
export const ADULT_AGE = 18;

export function minAge(birthYear: number, birthMonth: number, today: YearMonth): number {
  return today.year - birthYear - (today.month > birthMonth ? 0 : 1);
}

/** Today's year and month in New Jersey (the database uses the same time zone). */
export function nyToday(now: Date = new Date()): YearMonth {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: 'numeric',
  }).formatToParts(now);
  const get = (type: 'year' | 'month') => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month') };
}

export type AgeGroup = 'too_young' | 'minor' | 'adult';

/** Sign-up age gate: under 13 can't join; 13-17 need a parent/guardian. */
export function ageGroup(birthYear: number, birthMonth: number, today: YearMonth): AgeGroup {
  const age = minAge(birthYear, birthMonth, today);
  if (age < MIN_ACCOUNT_AGE) return 'too_young';
  if (age < ADULT_AGE) return 'minor';
  return 'adult';
}

/**
 * Years shown on the "When were you born?" screen. Every year back to 100 years ago, so the
 * list itself doesn't hint at the minimum age (a neutral age screen, as the FTC recommends).
 */
export function birthYearOptions(today: YearMonth): number[] {
  const years: number[] = [];
  for (let y = today.year; y >= today.year - 100; y--) years.push(y);
  return years;
}

/**
 * When an under-13 visitor may try again: the first day of the month after they turn 13
 * (the same moment minAge() starts counting them as 13). Returned as 'YYYY-MM-DD'.
 */
export function ageBlockedUntil(birthYear: number, birthMonth: number): string {
  const month = birthMonth === 12 ? 1 : birthMonth + 1;
  const year = birthYear + MIN_ACCOUNT_AGE + (birthMonth === 12 ? 1 : 0);
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/** True while an age block saved on this phone is still in effect. */
export function isAgeBlocked(blockedUntil: string | null, now: Date = new Date()): boolean {
  if (!blockedUntil) return false;
  const [y, m, d] = blockedUntil.split('-').map(Number);
  if (!y || !m || !d) return false;
  return now < new Date(y, m - 1, d);
}
