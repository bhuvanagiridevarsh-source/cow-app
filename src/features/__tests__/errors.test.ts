/// <reference types="node" />
// (Node types come with Jest; these tests read the migration files.)
import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { ERROR_MESSAGES, errorCode, friendlyError } from '@/features/errors';

describe('database error codes', () => {
  it('every code the database can raise has a friendly message', () => {
    const dir = join(__dirname, '../../../supabase/migrations');
    const raised = new Set<string>();
    for (const file of readdirSync(dir)) {
      const sql = readFileSync(join(dir, file), 'utf8');
      for (const m of sql.matchAll(/raise exception '(COW_[A-Z0-9_]+)'/g)) raised.add(m[1]);
    }
    expect(raised.size).toBeGreaterThan(20);
    const missing = [...raised].filter((code) => !(code in ERROR_MESSAGES));
    expect(missing).toEqual([]);
  });
});

describe('friendlyError', () => {
  it('maps a database code to plain words', () => {
    expect(friendlyError({ message: 'COW_CLAIM_LIMIT' })).toMatch(/limit of pickups/);
    expect(errorCode({ message: 'COW_CLAIM_LIMIT' })).toBe('COW_CLAIM_LIMIT');
  });
  it('uses the board number when the database sends one', () => {
    expect(friendlyError({ message: 'COW_TOO_YOUNG_FOR_PICKUP', details: '16' })).toBe(
      'Pickups start at age 16. You can still list items and share CoW with friends!',
    );
    expect(friendlyError({ message: 'COW_VALUE_TOO_HIGH', details: '5000' })).toMatch(/up to \$5000/);
  });
  it('still reads well without the number', () => {
    expect(friendlyError({ message: 'COW_TOO_YOUNG_FOR_PICKUP' })).toMatch(/^You're not old enough/);
  });
  it('recognizes being offline', () => {
    expect(friendlyError(new TypeError('Network request failed'))).toMatch(/offline/);
  });
  it('never shows raw technical errors', () => {
    expect(friendlyError({ message: 'duplicate key value violates unique constraint' })).toBe(
      'Something went wrong. Please try again.',
    );
    expect(friendlyError(null)).toBe('Something went wrong. Please try again.');
    expect(errorCode({ message: 'something else' })).toBeNull();
  });
});
