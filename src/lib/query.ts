import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import { addNetworkStateListener } from 'expo-network';
import { AppState } from 'react-native';

import { errorCode } from '@/features/errors';

/** One shared cache for everything loaded from the database. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retry network hiccups, but not rule errors like COW_CLAIM_LIMIT (retrying won't help).
      retry: (failureCount, error) => failureCount < 2 && errorCode(error) === null,
    },
    mutations: { retry: false },
  },
});

let wired = false;

/** Refresh data when the app comes back to the front; pause requests while offline. */
export function wireQueryManagers(): void {
  if (wired) return;
  wired = true;
  AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
  onlineManager.setEventListener((setOnline) => {
    const subscription = addNetworkStateListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return () => subscription.remove();
  });
}
