/**
 * A safety check on photos before they leave the phone. Cameras hide the place a photo was
 * taken inside the file (GPS data), which could reveal a donor's home. The app re-saves every
 * photo, which normally drops that data; this check proves it, and the upload is refused if not.
 */

const SOI = 0xd8; // start of image
const SOS = 0xda; // start of the picture data: no more hidden-info blocks after this
const APP1 = 0xe1; // the block cameras use for Exif and XMP
const GPS_TAG = 0x8825; // Exif "GPS info" pointer

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let out = '';
  const end = Math.min(bytes.length, start + length);
  for (let i = start; i < end; i++) out += String.fromCharCode(bytes[i]);
  return out;
}

/** True if this starts like a JPEG file. */
export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === SOI && bytes[2] === 0xff;
}

function exifHasGps(bytes: Uint8Array, tiff: number, end: number): boolean {
  if (tiff + 8 > end) return false;
  const order = ascii(bytes, tiff, 2);
  if (order !== 'II' && order !== 'MM') return false;
  const little = order === 'II';
  const u16 = (o: number) => (little ? bytes[o] | (bytes[o + 1] << 8) : (bytes[o] << 8) | bytes[o + 1]);
  const u32 = (o: number) =>
    little
      ? (bytes[o] | (bytes[o + 1] << 8) | (bytes[o + 2] << 16) | (bytes[o + 3] << 24)) >>> 0
      : ((bytes[o] << 24) | (bytes[o + 1] << 16) | (bytes[o + 2] << 8) | bytes[o + 3]) >>> 0;
  const ifd = tiff + u32(tiff + 4);
  if (ifd + 2 > end) return false;
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > end) return false;
    if (u16(entry) === GPS_TAG) return true;
  }
  return false;
}

/** True if a JPEG still carries GPS location data (in Exif or XMP). */
export function jpegHasGps(bytes: Uint8Array): boolean {
  if (!isJpeg(bytes)) return false;
  let pos = 2;
  while (pos + 4 <= bytes.length) {
    if (bytes[pos] !== 0xff) return false; // not a well-formed header: stop looking
    const marker = bytes[pos + 1];
    if (marker === 0xff) {
      pos += 1; // padding
      continue;
    }
    if (marker === SOS) return false;
    const length = (bytes[pos + 2] << 8) | bytes[pos + 3];
    if (length < 2) return false;
    const start = pos + 4;
    const end = Math.min(bytes.length, pos + 2 + length);
    if (marker === APP1) {
      if (ascii(bytes, start, 6) === 'Exif\0\0' && exifHasGps(bytes, start + 6, end)) return true;
      if (ascii(bytes, start, 5) === 'http:' && /GPS(Latitude|Longitude)/.test(ascii(bytes, start, end - start))) {
        return true;
      }
    }
    pos += 2 + length;
  }
  return false;
}
