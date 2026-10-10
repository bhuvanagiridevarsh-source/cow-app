import { ITEM_COLUMNS } from '@/domain/api-columns';
import { parseValue, type ListingDraft } from '@/domain/listing';
import { windowRange } from '@/domain/pickup-windows';
import { normalizeZip } from '@/domain/zip';
import type { Database } from '@/lib/database.types';
import { removePhoto, shrinkPhoto, uploadPhoto, type PickedPhoto } from '@/lib/photos';
import { supabase } from '@/lib/supabase';

/** A listing as the app can read it (see src/domain/api-columns.ts for the one private column). */
export type Item = Omit<Database['public']['Tables']['items']['Row'], 'adult_home_confirmed'>;
export type ItemAddress = Database['public']['Tables']['item_addresses']['Row'];

/** Everything the signed-in person has listed, newest first. */
export async function fetchMyItems(userId: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_COLUMNS)
    .eq('donor_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

/** One of the person's own listings with its private address (for editing). */
export async function fetchMyItem(itemId: string): Promise<{ item: Item; address: ItemAddress }> {
  const [item, address] = await Promise.all([
    supabase.from('items').select(ITEM_COLUMNS).eq('id', itemId).single(),
    supabase.from('item_addresses').select('*').eq('item_id', itemId).single(),
  ]);
  if (item.error) throw item.error;
  if (address.error) throw address.error;
  return { item: item.data, address: address.data };
}

/** Gets a newly chosen photo ready to upload (shrunk, re-saved without hidden info). */
export function preparePhoto(photo: PickedPhoto): Promise<string> {
  return shrinkPhoto(photo);
}

function listingArgs(draft: ListingDraft, photoPath: string) {
  if (!draft.category || !draft.condition || !draft.day || !draft.window) {
    throw new Error('COW_BAD_TITLE');
  }
  const { start, end } = windowRange(draft.day, draft.window);
  return {
    p_category: draft.category,
    p_title: draft.title.trim(),
    p_value: parseValue(draft.value) ?? 0,
    p_condition: draft.condition,
    p_photo_path: photoPath,
    p_window_start: start,
    p_window_end: end,
    p_street: draft.street.trim(),
    p_town: draft.town.trim(),
    p_zip: normalizeZip(draft.zip),
    p_unit: draft.unit.trim() || undefined,
    p_pickup_note: draft.note.trim() || undefined,
    p_adult_home_confirmed: draft.adultHome,
  };
}

/**
 * Posts a new listing, or saves changes to one (`itemId`). A newly chosen photo is uploaded
 * first; if posting then fails, that upload is removed so nothing is left behind.
 */
export async function saveListing(userId: string, draft: ListingDraft, itemId?: string): Promise<void> {
  const uploaded = draft.photoUri ? await uploadPhoto(userId, draft.photoUri) : null;
  const photoPath = uploaded ?? draft.photoPath;
  if (!photoPath) throw new Error('COW_PHOTO_MISSING');
  try {
    const args = listingArgs(draft, photoPath);
    const { error } = itemId
      ? await supabase.rpc('update_item', { p_item_id: itemId, ...args })
      : await supabase.rpc('create_item', args);
    if (error) throw error;
  } catch (e) {
    await removePhoto(uploaded);
    throw e;
  }
  // The listing now points at the new photo, so the one it replaced is no longer needed.
  if (uploaded && draft.photoPath) await removePhoto(draft.photoPath);
}

/** Takes a listing down. Any request or scheduled pickup for it is cancelled. */
export async function withdrawItem(itemId: string): Promise<void> {
  const { error } = await supabase.rpc('withdraw_item', { p_item_id: itemId });
  if (error) throw error;
}
