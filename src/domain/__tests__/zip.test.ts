import { DEFAULT_ZIP_PREFIXES, isInServiceArea, isValidZip } from '@/domain/zip';

describe('ZIP codes', () => {
  it('default service area is all of New Jersey (070-089)', () => {
    expect(DEFAULT_ZIP_PREFIXES).toHaveLength(20);
    expect(DEFAULT_ZIP_PREFIXES[0]).toBe('070');
    expect(DEFAULT_ZIP_PREFIXES[19]).toBe('089');
  });

  it.each(['08831', '07001', '08999', ' 08831 '])('%p is in the NJ service area', (zip) => {
    expect(isInServiceArea(zip, DEFAULT_ZIP_PREFIXES)).toBe(true);
  });

  it.each(['10001', '06901', '19103', '09001'])('%p is outside NJ', (zip) => {
    expect(isInServiceArea(zip, DEFAULT_ZIP_PREFIXES)).toBe(false);
  });

  it.each(['', '0883', '088311', 'abcde', '08831-1234'])('%p is not a valid 5-digit ZIP', (zip) => {
    expect(isValidZip(zip)).toBe(false);
    expect(isInServiceArea(zip, DEFAULT_ZIP_PREFIXES)).toBe(false);
  });

  it('follows the board setting when it adds nearby areas', () => {
    expect(isInServiceArea('10001', [...DEFAULT_ZIP_PREFIXES, '100'])).toBe(true);
  });
});
