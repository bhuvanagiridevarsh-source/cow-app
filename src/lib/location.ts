import * as Location from 'expo-location';

import type { Point } from '@/domain/distance';

/** Thrown with words that are safe to show on screen. */
export class LocationError extends Error {
  /** True when the fix is in the phone's Settings app. */
  needsSettings: boolean;
  constructor(message: string, needsSettings = false) {
    super(message);
    this.name = 'LocationError';
    this.needsSettings = needsSettings;
  }
}

/**
 * Where the phone is, roughly. Used only on the phone to sort nearby items:
 * it is never saved and never sent to CoW.
 */
export async function getPhonePoint(): Promise<Point> {
  let permission: Location.LocationPermissionResponse;
  try {
    permission = await Location.requestForegroundPermissionsAsync();
  } catch {
    throw new LocationError("We couldn't check your location. Showing items near your ZIP code instead.");
  }
  if (!permission.granted) {
    throw new LocationError(
      permission.canAskAgain
        ? 'No problem. Showing items near your ZIP code instead.'
        : 'Location is turned off for CoW. You can turn it on in Settings, or keep using your ZIP code.',
      !permission.canAskAgain,
    );
  }
  try {
    // A recent fix is plenty for "about 3 mi", and it's instant.
    const last = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60_000 });
    const position = last ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
    return { lat: position.coords.latitude, lng: position.coords.longitude };
  } catch {
    throw new LocationError("We couldn't find your location. Showing items near your ZIP code instead.");
  }
}

/** True if the person already allowed location (so we can use it without asking again). */
export async function hasLocationPermission(): Promise<boolean> {
  try {
    return (await Location.getForegroundPermissionsAsync()).granted;
  } catch {
    return false;
  }
}
