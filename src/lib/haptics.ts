/**
 * Success "buzz" (e.g. when a pickup is confirmed).
 *
 * expo-haptics isn't listed as included in Expo Go for SDK 57, so it is loaded lazily inside
 * try/catch. If it's missing, the buzz is skipped. It can never crash the app.
 */
type HapticsModule = typeof import('expo-haptics');

let cached: HapticsModule | null | undefined;

function load(): HapticsModule | null {
  if (cached === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      cached = require('expo-haptics') as HapticsModule;
    } catch {
      cached = null;
    }
  }
  return cached;
}

/** True if the phone can buzz (used only by the dev check screen). */
export function hapticsAvailable(): boolean {
  return load() !== null;
}

export async function successBuzz(): Promise<void> {
  const h = load();
  if (!h) return;
  try {
    await h.notificationAsync(h.NotificationFeedbackType.Success);
  } catch {
    // Some devices (or Expo Go builds) can't buzz; that's fine.
  }
}
