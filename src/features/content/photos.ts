import type { ImageSource } from 'expo-image';

import { isUsableUrl } from '@/domain/urls';

/**
 * Photos built into the app, from CoW's own website. In content.json a person's "photo" is
 * one of these names. To add a new person without an app update, use an https image link instead.
 */
const BUNDLED_PHOTOS: Record<string, number> = {
  'yuvraaj-kumar': require('../../../assets/content/yuvraaj-kumar.jpg'),
  'dhanvin-challa': require('../../../assets/content/dhanvin-challa.jpg'),
  'guntas-dhanjal': require('../../../assets/content/guntas-dhanjal.jpg'),
  'aditi-menon': require('../../../assets/content/aditi-menon.jpg'),
  'samyuktha-nair': require('../../../assets/content/samyuktha-nair.jpg'),
  'wesley-mathews': require('../../../assets/content/wesley-mathews.jpg'),
  'lata-setty': require('../../../assets/content/lata-setty.jpg'),
  'prema-roddam': require('../../../assets/content/prema-roddam.jpg'),
  'thomas-abraham': require('../../../assets/content/thomas-abraham.jpg'),
};

export const BUNDLED_PHOTO_NAMES = Object.keys(BUNDLED_PHOTOS);

/** Community outreach in Monroe Twp, NJ (Aug 15, 2026). */
export const TEAM_OUTREACH_PHOTO: number = require('../../../assets/content/team-outreach.jpg');
/** Receiving the Best Social Enterprise Award at the 2024 TiE-NJ Gala. */
export const TIE_AWARD_PHOTO: number = require('../../../assets/content/tie-award.jpg');

/** The image for a "photo" value, or null to show the person's initials instead. */
export function photoSource(photo: string | undefined): number | ImageSource | null {
  if (!photo) return null;
  if (photo in BUNDLED_PHOTOS) return BUNDLED_PHOTOS[photo];
  // Only secure links: iPhones block plain http images.
  if (isUsableUrl(photo) && /^https:/i.test(photo)) return { uri: photo };
  return null;
}
