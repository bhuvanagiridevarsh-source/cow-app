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
