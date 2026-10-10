/**
 * Rules for listing an item, checked on the phone so mistakes are caught before posting.
 * The database checks all of this again (private.validate_item) and has the final say.
 */
import { availableWindows, type WindowKey } from '@/domain/pickup-windows';
import { isInServiceArea, isValidZip } from '@/domain/zip';
import type { Database } from '@/lib/database.types';

export type ItemCategory = Database['public']['Enums']['item_category'];
export type ItemCondition = Database['public']['Enums']['item_condition'];

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  furniture: 'Furniture',
  electronics: 'Electronics',
  appliances: 'Appliances',
  other: 'Other',
};

export const CONDITION_LABELS: Record<ItemCondition, string> = { new: 'New', good: 'Good', fair: 'Fair' };
export const CONDITIONS: readonly ItemCondition[] = ['new', 'good', 'fair'];

export const TITLE_MIN = 3;
export const TITLE_MAX = 60;
export const NOTE_MAX = 200;

/** Everything a donor fills in across the four steps. Text boxes stay as typed until posting. */
export type ListingDraft = {
  category: ItemCategory | null;
  title: string;
  value: string;
  condition: ItemCondition | null;
  day: string | null;
  window: WindowKey | null;
  /** A photo already uploaded (when editing a listing). */
  photoPath: string | null;
  /** A new photo chosen on this phone, not uploaded yet. */
  photoUri: string | null;
  street: string;
  unit: string;
  town: string;
  zip: string;
  note: string;
  adultHome: boolean;
};

export const EMPTY_DRAFT: ListingDraft = {
  category: null,
  title: '',
  value: '',
  condition: null,
  day: null,
  window: null,
  photoPath: null,
  photoUri: null,
  street: '',
  unit: '',
  town: '',
  zip: '',
  note: '',
  adultHome: false,
};

/** Whole dollars from what was typed ("$1,200" -> 1200). Null if it isn't a number. */
export function parseValue(input: string): number | null {
  const cleaned = input.replace(/[$,\s]/g, '');
  if (!/^\d{1,9}$/.test(cleaned)) return null;
  return Number(cleaned);
}

/** Step 2 (photo, name, value, condition, time). Returns the first problem in plain words, or null. */
export function detailsProblem(d: ListingDraft, maxValue: number, now: Date = new Date()): string | null {
  if (!d.photoUri && !d.photoPath) return 'Please add a photo of the item.';
  const title = d.title.trim();
  if (title.length < TITLE_MIN) return 'Please say what the item is (at least 3 letters).';
  if (title.length > TITLE_MAX) return `Please keep the name under ${TITLE_MAX} letters.`;
  const value = parseValue(d.value);
  if (value === null || value < 1) return 'Please enter an estimated value of at least $1.';
  if (value > maxValue) return `That value is higher than CoW allows for one item (up to $${maxValue.toLocaleString('en-US')}).`;
  if (!d.condition) return 'Please choose the condition.';
  if (!d.day) return 'Please choose a pickup day.';
  if (!d.window) return 'Please choose a pickup time.';
  if (!availableWindows(d.day, now).includes(d.window)) return 'That pickup time has passed. Please choose another.';
  return null;
}

/** Step 3 (address). Returns the first problem in plain words, or null. */
export function addressProblem(
  d: ListingDraft,
  rules: { allowedZipPrefixes: readonly string[]; adultHomeRequired: boolean },
): string | null {
  const street = d.street.trim();
  if (street.length < 3 || street.length > 120) return 'Please enter the street address.';
  if (d.unit.trim().length > 30) return 'Please shorten the apartment or unit.';
  const town = d.town.trim();
  if (town.length < 2 || town.length > 60) return 'Please enter the town.';
  if (!isValidZip(d.zip)) return 'Please enter a 5-digit ZIP code.';
  if (!isInServiceArea(d.zip, rules.allowedZipPrefixes)) {
    return "Sorry, CoW doesn't pick up in that area yet. Right now we serve New Jersey.";
  }
  if (d.note.trim().length > NOTE_MAX) return `Please keep the note under ${NOTE_MAX} letters.`;
  if (rules.adultHomeRequired && !d.adultHome) {
    return 'Please confirm that a parent or guardian approves and an adult will be home for the pickup.';
  }
  return null;
}
