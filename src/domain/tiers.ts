/**
 * Tiers use CoW's membership levels (brief §5). They are measured by the confirmed value of
 * items a person has collected or donated: `tier_value` from my_stats() in the database.
 * The Ambassador TIER is a badge only. The verified Ambassador ROLE is granted by a CoW admin.
 */

export type Tier = { name: string; min: number };

export const TIERS: readonly Tier[] = [
  { name: 'Volunteer', min: 0 },
  { name: 'Supporter', min: 100 },
  { name: 'Activist', min: 250 },
  { name: 'Ambassador', min: 500 },
  { name: 'Change Maker', min: 1000 },
];

export type TierProgress = {
  current: Tier;
  /** Null at the top tier. */
  next: Tier | null;
  /** Dollars still needed for the next tier (0 at the top). */
  toNext: number;
  /** 0 to 1: how far along from the current tier to the next (1 at the top). */
  progress: number;
};

export function tierProgress(value: number): TierProgress {
  const v = Number.isFinite(value) && value > 0 ? value : 0;
  let index = 0;
  for (let i = 0; i < TIERS.length; i++) if (v >= TIERS[i].min) index = i;
  const current = TIERS[index];
  const next = TIERS[index + 1] ?? null;
  if (!next) return { current, next: null, toNext: 0, progress: 1 };
  return {
    current,
    next,
    toNext: Math.ceil(next.min - v),
    progress: Math.min(1, Math.max(0, (v - current.min) / (next.min - current.min))),
  };
}

/** "1 hour", "2.5 hours", "0 hours". */
export function formatHours(hours: number): string {
  const h = Number.isFinite(hours) && hours > 0 ? Math.round(hours * 100) / 100 : 0;
  return `${h} ${h === 1 ? 'hour' : 'hours'}`;
}

type Summary = { name: string; hours: number; pickups: number; valueCollected: number; tierName: string; today: string };

/**
 * The plain-text summary shared from the Hours tab. Every number in it comes from pickups a
 * donor (or CoW) confirmed, so it can be shown to a school or club as a record of service.
 */
export function hoursSummary(s: Summary): string {
  const pickups = `${s.pickups} confirmed ${s.pickups === 1 ? 'pickup' : 'pickups'}`;
  const value = `$${Math.round(s.valueCollected).toLocaleString('en-US')}`;
  return [
    'Children of War Project (CoW): volunteer summary',
    `${s.name}`,
    `As of ${s.today}`,
    '',
    `Volunteer hours: ${formatHours(s.hours)}`,
    `Pickups: ${pickups}`,
    `Value of items collected: ${value}`,
    `Level: ${s.tierName}`,
    '',
    'Hours count only after the donor or CoW confirms each pickup.',
    'childrenofwarproject.org',
  ].join('\n');
}
