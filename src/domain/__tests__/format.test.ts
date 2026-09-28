import { formatDollars, goalProgress } from '@/domain/format';

describe('money', () => {
  it('formats whole dollars', () => {
    expect(formatDollars(5000)).toBe('$5,000');
    expect(formatDollars(25000.4)).toBe('$25,000');
    expect(formatDollars(0)).toBe('$0');
  });
  it('computes goal progress safely', () => {
    expect(goalProgress(5000, 25000)).toBeCloseTo(0.2);
    expect(goalProgress(30000, 25000)).toBe(1);
    expect(goalProgress(5000, 0)).toBe(0);
    expect(goalProgress(-5, 100)).toBe(0);
  });
});
