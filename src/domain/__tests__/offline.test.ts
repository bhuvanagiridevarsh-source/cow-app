import { SAVED_FOR_MS, SAVED_QUERIES, shouldSaveQuery } from '@/domain/offline';

describe('what is saved on the phone for offline use', () => {
  it('saves the everyday screens', () => {
    for (const key of ['profile', 'settings', 'impact', 'content', 'my-items', 'my-pickups', 'my-stats', 'open-items']) {
      expect(shouldSaveQuery([key, 'user-1'], 'success')).toBe(true);
    }
  });
  it('never saves a donor’s exact address', () => {
    expect(shouldSaveQuery(['pickup', 'p1'], 'success')).toBe(false);
    expect(shouldSaveQuery(['my-item', 'i1'], 'success')).toBe(false);
    expect(SAVED_QUERIES).not.toContain('pickup');
    expect(SAVED_QUERIES).not.toContain('my-item');
  });
  it('never saves the phone’s location', () => {
    expect(shouldSaveQuery(['phone-point'], 'success')).toBe(false);
  });
  it('never saves photo links, which stop working after 30 minutes', () => {
    expect(shouldSaveQuery(['photo-link', 'u/a.jpg'], 'success')).toBe(false);
  });
  it('never saves something that failed or is still loading', () => {
    expect(shouldSaveQuery(['impact'], 'error')).toBe(false);
    expect(shouldSaveQuery(['impact'], 'pending')).toBe(false);
  });
  it('ignores anything it does not recognize', () => {
    expect(shouldSaveQuery(['something-new'], 'success')).toBe(false);
    expect(shouldSaveQuery([], 'success')).toBe(false);
    expect(shouldSaveQuery([42], 'success')).toBe(false);
  });
  it('keeps saved data for a week', () => {
    expect(SAVED_FOR_MS).toBe(7 * 24 * 60 * 60 * 1000);
  });
});
