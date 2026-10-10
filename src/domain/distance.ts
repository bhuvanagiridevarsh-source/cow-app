/** Distances for Browse. Worked out on the phone, so nobody's location is ever sent to CoW. */

export type Point = { lat: number; lng: number };

const EARTH_RADIUS_MILES = 3958.8;
const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Straight-line miles between two points. */
export function milesBetween(a: Point, b: Point): number {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * "about 3 mi". Always approximate: listings only carry a location rounded to about 1 km,
 * so we never show a number precise enough to find a home.
 */
export function formatDistance(miles: number): string {
  if (!Number.isFinite(miles) || miles < 0) return '';
  if (miles < 1) return 'under 1 mi';
  return `about ${Math.round(miles)} mi`;
}

/** Choices in the Filters sheet. Null means any distance. */
export const DISTANCE_CHOICES: readonly (number | null)[] = [5, 10, 25, 50, null];

export function distanceChoiceLabel(miles: number | null): string {
  return miles === null ? 'Any distance' : `Within ${miles} miles`;
}

type Located = { approx_lat: number | null; approx_lng: number | null };

/** Miles from `origin` to a listing, or null if either location is unknown. */
export function milesTo(origin: Point | null, item: Located): number | null {
  if (!origin || item.approx_lat === null || item.approx_lng === null) return null;
  return milesBetween(origin, { lat: item.approx_lat, lng: item.approx_lng });
}

/**
 * Nearest first. With a distance limit, listings farther away (or with no known location) are
 * left out. Listings with no known distance go last, soonest pickup first.
 */
export function sortByDistance<T extends Located & { pickup_window_start: string }>(
  items: readonly T[],
  origin: Point | null,
  maxMiles: number | null,
): { item: T; miles: number | null }[] {
  return items
    .map((item) => ({ item, miles: milesTo(origin, item) }))
    .filter((row) => maxMiles === null || origin === null || (row.miles !== null && row.miles <= maxMiles))
    .sort((a, b) => {
      if (a.miles !== null && b.miles !== null && a.miles !== b.miles) return a.miles - b.miles;
      if (a.miles === null && b.miles !== null) return 1;
      if (a.miles !== null && b.miles === null) return -1;
      return a.item.pickup_window_start.localeCompare(b.item.pickup_window_start);
    });
}
