/// <reference types="node" />
// (Node types come with Jest; this test reads the database migration file.)
import { readFileSync } from 'fs';
import { join } from 'path';

import { ITEM_COLUMNS, PICKUP_COLUMNS } from '@/domain/api-columns';

const migration = readFileSync(
  join(__dirname, '../../../supabase/migrations/20261010000200_private_columns.sql'),
  'utf8',
);

/** The columns the database lets the app read from a table, straight from the migration. */
function granted(table: string): string[] {
  const match = new RegExp(`grant select \\(([^)]*)\\) on public\\.${table} to authenticated;`).exec(migration);
  if (!match) throw new Error(`No column grant found for ${table}`);
  return match[1].split(',').map((c) => c.trim()).filter(Boolean).sort();
}
const asked = (columns: string) => columns.split(',').map((c) => c.trim()).sort();

describe('the app only asks the database for columns it is allowed to read', () => {
  // Asking for even one column that isn't granted makes the whole request fail,
  // so these two lists must match the migration exactly.
  it('listings', () => {
    expect(asked(ITEM_COLUMNS)).toEqual(granted('items'));
  });
  it('pickups', () => {
    expect(asked(PICKUP_COLUMNS)).toEqual(granted('pickups'));
  });
});

describe('columns that reveal someone is under 18, or CoW’s private notes, stay private', () => {
  it('the app never asks for them', () => {
    expect(asked(ITEM_COLUMNS)).not.toContain('adult_home_confirmed');
    expect(asked(PICKUP_COLUMNS)).not.toContain('adult_attending');
  });
  it('the database never grants them', () => {
    expect(granted('items')).not.toContain('adult_home_confirmed');
    expect(granted('pickups')).not.toContain('adult_attending');
    expect(granted('reports')).not.toContain('admin_notes');
  });
  it('whole-table read access is taken away first', () => {
    for (const table of ['items', 'pickups', 'reports']) {
      expect(migration).toContain(`revoke select on public.${table} from authenticated;`);
    }
  });
});
