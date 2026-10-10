/** "Open in Maps" links for an accepted pickup. */

export type PickupAddress = { street: string; unit?: string | null; town: string; zip: string };

/** The address on one line for a maps search (the unit is left out: maps apps can't use it). */
export function addressQuery(a: PickupAddress): string {
  return `${a.street.trim()}, ${a.town.trim()}, NJ ${a.zip.trim()}`;
}

/** The address as people read it, on two lines. */
export function addressLines(a: PickupAddress): string {
  const first = [a.street.trim(), a.unit?.trim()].filter(Boolean).join(', ');
  return `${first}\n${a.town.trim()}, NJ ${a.zip.trim()}`;
}

/** A link that opens directions in Apple Maps on iPhone and Google Maps on Android. */
export function mapsUrl(a: PickupAddress, platform: string): string {
  const destination = encodeURIComponent(addressQuery(a));
  return platform === 'ios'
    ? `https://maps.apple.com/?daddr=${destination}`
    : `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}
