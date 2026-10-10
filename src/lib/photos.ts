import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { isJpeg, jpegHasGps } from '@/lib/jpeg';
import { supabase } from '@/lib/supabase';

export const PHOTO_BUCKET = 'item-photos';
/** Longest side of an uploaded photo, in pixels. Plenty for a phone screen, and a small upload. */
const MAX_SIDE = 1600;
const JPEG_QUALITY = 0.8;
/** The storage bucket refuses anything larger than this (5 MB). */
const MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_TRIES = 3;

/** Thrown with words that are safe to show on screen. */
export class PhotoError extends Error {
  /** True when the fix is in the phone's Settings app (permission was turned off). */
  needsSettings: boolean;
  constructor(message: string, needsSettings = false) {
    super(message);
    this.name = 'PhotoError';
    this.needsSettings = needsSettings;
  }
}

export type PickedPhoto = { uri: string; width: number; height: number };

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: false,
  quality: 1,
  exif: false,
};

function firstAsset(result: ImagePicker.ImagePickerResult): PickedPhoto | null {
  if (result.canceled || result.assets.length === 0) return null;
  const { uri, width, height } = result.assets[0];
  return { uri, width, height };
}

/** Opens the camera. Returns null if the person backs out. */
export async function takePhoto(): Promise<PickedPhoto | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    throw new PhotoError(
      permission.canAskAgain
        ? 'CoW needs the camera to take a photo of your item. You can also choose a photo you already have.'
        : 'The camera is turned off for CoW. Turn it on in Settings, or choose a photo you already have.',
      !permission.canAskAgain,
    );
  }
  try {
    return firstAsset(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
  } catch {
    throw new PhotoError("We couldn't open the camera. You can choose a photo you already have instead.");
  }
}

/** Opens the phone's photo picker (no permission needed: the person hands over one photo). */
export async function choosePhoto(): Promise<PickedPhoto | null> {
  try {
    return firstAsset(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  } catch {
    throw new PhotoError("We couldn't open your photos. Please try again.");
  }
}

/**
 * Shrinks a photo and re-saves it as a JPEG. Re-saving drops the hidden info cameras add,
 * including where the photo was taken. Returns the new file's location on this phone.
 */
export async function shrinkPhoto(photo: PickedPhoto): Promise<string> {
  try {
    const context = ImageManipulator.manipulate(photo.uri);
    if (Math.max(photo.width, photo.height) > MAX_SIDE) {
      context.resize(photo.width >= photo.height ? { width: MAX_SIDE } : { height: MAX_SIDE });
    }
    const image = await context.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    return saved.uri;
  } catch {
    throw new PhotoError("We couldn't get that photo ready. Please try a different one.");
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Uploads a prepared photo into the person's own private folder and returns its path.
 * Refuses any file that still carries location data. Retries a shaky connection.
 */
export async function uploadPhoto(userId: string, uri: string): Promise<string> {
  let bytes: Uint8Array;
  try {
    bytes = await new File(uri).bytes();
  } catch {
    throw new PhotoError("We couldn't read that photo. Please add it again.");
  }
  if (!isJpeg(bytes) || jpegHasGps(bytes)) {
    throw new PhotoError("We couldn't make that photo safe to share. Please try a different one.");
  }
  if (bytes.length > MAX_BYTES) throw new PhotoError('That photo is too large. Please try a different one.');

  const path = `${userId}/${Crypto.randomUUID()}.jpg`;
  // Send exactly these bytes (a plain copy), not a window onto a larger chunk of memory.
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  let lastError: unknown = null;
  for (let attempt = 0; attempt < UPLOAD_TRIES; attempt++) {
    if (attempt > 0) await wait(800 * attempt);
    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, body, { contentType: 'image/jpeg', upsert: false });
    // "Already exists" means an earlier try got through even though its reply was lost.
    if (!error || /exists|duplicate/i.test(error.message)) return path;
    lastError = error;
  }
  throw lastError ?? new PhotoError("We couldn't upload your photo. Please try again.");
}

/** Removes an uploaded photo that is no longer used. Failing here is harmless, so it never throws. */
export async function removePhoto(path: string | null | undefined): Promise<void> {
  if (!path) return;
  try {
    await supabase.storage.from(PHOTO_BUCKET).remove([path]);
  } catch {
    // Left behind; it is deleted with the account at the latest.
  }
}

/** A private link to a photo that works for 30 minutes. Null if it can't be made. */
export async function photoLink(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(PHOTO_BUCKET).createSignedUrl(path, 30 * 60);
  return error ? null : data.signedUrl;
}
