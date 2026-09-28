import AsyncStorage from '@react-native-async-storage/async-storage';

/** Keys for small things remembered on this phone only (never sent anywhere). */
export const STORAGE_KEYS = {
  /** Sign-up answers kept until the account is finished (so leaving to read an email loses nothing). */
  onboardingDraft: 'cow:onboarding-draft',
  /** Date an under-13 visitor may try again (neutral age screen: going back doesn't help). */
  ageBlockedUntil: 'cow:age-blocked-until',
  /** One-time message to show on the next screen (e.g. "Your account was deleted"). */
  notice: 'cow:notice',
} as const;

/** Reads JSON from phone storage. Returns null if missing, unreadable, or storage is unavailable. */
export async function readJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

/** Saves JSON to phone storage. Failing to save never crashes the app. */
export async function writeJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or unavailable: the app keeps working without remembering this.
  }
}

export async function removeKey(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
}
