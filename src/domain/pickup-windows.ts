/**
 * Pickup times as big buttons (docs/PLAN.md D7): a day in the next 3 weeks plus
 * Morning, Afternoon, or Evening. All times are New Jersey time, whatever the phone is set to.
 * The database re-checks the window (private.validate_item: 1-12 hours long, not already over,
 * and no more than 31 days away).
 */

export type WindowKey = 'morning' | 'afternoon' | 'evening';

export const WINDOWS: readonly { key: WindowKey; label: string; startHour: number; endHour: number }[] = [
  { key: 'morning', label: 'Morning', startHour: 9, endHour: 12 },
  { key: 'afternoon', label: 'Afternoon', startHour: 12, endHour: 16 },
  // Ends at 7 PM so pickups don't run late (safety).
  { key: 'evening', label: 'Evening', startHour: 16, endHour: 19 },
];

/** How many days ahead a donor can choose. */
export const DAYS_AHEAD = 21;
/** A window is offered only while at least this much of it is left. */
const MIN_MINUTES_LEFT = 60;

const TZ = 'America/New_York';
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Wall = { year: number; month: number; day: number; hour: number; minute: number };

/** The clock-on-the-wall time in New Jersey at a given moment. */
function njWall(at: Date): Wall {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute') };
}

const pad = (n: number) => String(n).padStart(2, '0');
const toDay = (w: { year: number; month: number; day: number }) => `${w.year}-${pad(w.month)}-${pad(w.day)}`;

function splitDay(day: string): { year: number; month: number; day: number } {
  const [year, month, d] = day.split('-').map(Number);
  return { year, month, day: d };
}

/** The exact moment of `hour`:00 New Jersey time on `day` (YYYY-MM-DD). Handles daylight saving. */
export function njTime(day: string, hour: number): Date {
  const { year, month, day: d } = splitDay(day);
  const target = Date.UTC(year, month - 1, d, hour);
  // Start by pretending NJ is UTC, then shift by however far off that guess lands.
  const w = njWall(new Date(target));
  const landed = Date.UTC(w.year, w.month - 1, w.day, w.hour, w.minute);
  return new Date(target - (landed - target));
}

/** Today in New Jersey as YYYY-MM-DD. */
export function njDay(now: Date = new Date()): string {
  return toDay(njWall(now));
}

/** `day` plus `count` days. */
export function addDays(day: string, count: number): string {
  const { year, month, day: d } = splitDay(day);
  const next = new Date(Date.UTC(year, month - 1, d + count));
  return toDay({ year: next.getUTCFullYear(), month: next.getUTCMonth() + 1, day: next.getUTCDate() });
}

/** Start and end of a window, ready to send to the database. */
export function windowRange(day: string, key: WindowKey): { start: string; end: string } {
  const w = WINDOWS.find((x) => x.key === key) ?? WINDOWS[0];
  return { start: njTime(day, w.startHour).toISOString(), end: njTime(day, w.endHour).toISOString() };
}

/** Windows on `day` that still have at least an hour left. */
export function availableWindows(day: string, now: Date = new Date()): WindowKey[] {
  return WINDOWS.filter((w) => njTime(day, w.endHour).getTime() - now.getTime() >= MIN_MINUTES_LEFT * 60_000).map(
    (w) => w.key,
  );
}

/** The days a donor can pick: today (if any window is left) through 3 weeks out. */
export function dayOptions(now: Date = new Date()): string[] {
  const today = njDay(now);
  const days: string[] = [];
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const day = addDays(today, i);
    if (availableWindows(day, now).length > 0) days.push(day);
  }
  return days;
}

/** "Today", "Tomorrow", or "Sat, Oct 17". */
export function formatDay(day: string, now: Date = new Date()): string {
  const today = njDay(now);
  if (day === today) return 'Today';
  if (day === addDays(today, 1)) return 'Tomorrow';
  const { year, month, day: d } = splitDay(day);
  return `${WEEKDAYS[new Date(Date.UTC(year, month - 1, d)).getUTCDay()]}, ${MONTHS[month - 1]} ${d}`;
}

function formatHour(hour: number, minute = 0): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  const suffix = hour < 12 ? 'AM' : 'PM';
  return minute === 0 ? `${h} ${suffix}` : `${h}:${pad(minute)} ${suffix}`;
}

/** "9 AM–12 PM" for a window button. */
export function windowHours(key: WindowKey): string {
  const w = WINDOWS.find((x) => x.key === key) ?? WINDOWS[0];
  return `${formatHour(w.startHour)}–${formatHour(w.endHour)}`;
}

/** "Sat, Oct 17 · 9 AM–12 PM" from a saved listing's start and end. */
export function describeWindow(start: string, end: string, now: Date = new Date()): string {
  const a = njWall(new Date(start));
  const b = njWall(new Date(end));
  return `${formatDay(toDay(a), now)} · ${formatHour(a.hour, a.minute)}–${formatHour(b.hour, b.minute)}`;
}

/** The day and window buttons that match a saved listing (window is null if it isn't one of ours). */
export function windowFromRange(start: string, end: string): { day: string; key: WindowKey | null } {
  const a = njWall(new Date(start));
  const b = njWall(new Date(end));
  const match = WINDOWS.find(
    (w) => w.startHour === a.hour && w.endHour === b.hour && a.minute === 0 && b.minute === 0 && toDay(a) === toDay(b),
  );
  return { day: toDay(a), key: match?.key ?? null };
}

/** True once a listing's pickup time is over. */
export function isWindowOver(end: string, now: Date = new Date()): boolean {
  return new Date(end).getTime() <= now.getTime();
}
