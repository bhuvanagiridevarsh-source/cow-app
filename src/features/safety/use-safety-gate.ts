import { router } from 'expo-router';
import { useCallback } from 'react';

import { readJSON, STORAGE_KEYS } from '@/lib/storage';

/**
 * Volunteers read the pickup safety tips before their first request (docs/PLAN.md D8).
 * Returns a function: true means go ahead; false means the tips were just opened instead.
 */
export function useSafetyGate() {
  return useCallback(async (): Promise<boolean> => {
    if (await readJSON<boolean>(STORAGE_KEYS.safetySeen)) return true;
    router.push({ pathname: '/safety', params: { first: '1' } });
    return false;
  }, []);
}
