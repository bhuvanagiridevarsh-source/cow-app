/** Sorting events into "coming up" and "past" by date, so nobody has to move them by hand. */

type Dated = { startDate: string; endDate?: string };

/** The last day of an event (YYYY-MM-DD). */
function lastDay(e: Dated): string {
  return e.endDate ?? e.startDate;
}

/**
 * Splits events around `today` (YYYY-MM-DD). An event counts as coming up through its last day.
 * Coming up: soonest first. Past: most recent first.
 */
export function splitEvents<T extends Dated>(events: readonly T[], today: string): { upcoming: T[]; past: T[] } {
  const upcoming = events.filter((e) => lastDay(e) >= today).sort((a, b) => a.startDate.localeCompare(b.startDate));
  const past = events.filter((e) => lastDay(e) < today).sort((a, b) => lastDay(b).localeCompare(lastDay(a)));
  return { upcoming, past };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parts(day: string): { y: number; m: number; d: number } {
  const [y, m, d] = day.split('-').map(Number);
  return { y, m, d };
}

/** "Aug 16, 2026", "Oct 3–4, 2026", "Oct 31 – Nov 1, 2026", or "Dec 31, 2026 – Jan 1, 2027". */
export function formatEventDates(e: Dated): string {
  const a = parts(e.startDate);
  const one = (p: { y: number; m: number; d: number }) => `${MONTHS[p.m - 1]} ${p.d}, ${p.y}`;
  if (!e.endDate || e.endDate === e.startDate) return one(a);
  const b = parts(e.endDate);
  if (a.y !== b.y) return `${one(a)} – ${one(b)}`;
  if (a.m !== b.m) return `${MONTHS[a.m - 1]} ${a.d} – ${MONTHS[b.m - 1]} ${b.d}, ${a.y}`;
  return `${MONTHS[a.m - 1]} ${a.d}–${b.d}, ${a.y}`;
}

/** Today's date in New Jersey as YYYY-MM-DD (CoW's events are listed in Eastern time). */
export function njToday(now: Date = new Date()): string {
  const p = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: 'year' | 'month' | 'day') => p.find((x) => x.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
