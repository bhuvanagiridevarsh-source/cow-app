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

/** Up to two initials for a name: "Yuvraaj Kumar (Yuvi)" -> "YK", "Dr. Thomas Abraham" -> "TA". */
export function initials(name: string): string {
  const words = name
    .replace(/\([^)]*\)/g, ' ')
    .split(/\s+/)
    .filter((w) => w && !/^(dr|mr|mrs|ms|prof)\.?$/i.test(w));
  if (words.length === 0) return '';
  const first = words[0][0];
  const last = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + last).toUpperCase();
}
