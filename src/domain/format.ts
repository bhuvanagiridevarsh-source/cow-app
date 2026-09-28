/** "$5,000" (whole dollars, US format). */
export function formatDollars(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/** Share of the goal reached, from 0 to 1. */
export function goalProgress(total: number, goal: number): number {
  if (!(goal > 0) || !(total > 0)) return 0;
  return Math.min(1, total / goal);
}
