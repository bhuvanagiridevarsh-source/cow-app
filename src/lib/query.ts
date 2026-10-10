import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { focusManager, onlineManager, QueryClient } from '@tanstack/react-query';
import type { PersistQueryClientProviderProps } from '@tanstack/react-query-persist-client';
import { addNetworkStateListener, getNetworkStateAsync, type NetworkState } from 'expo-network';
import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';

import { SAVED_FOR_MS, shouldSaveQuery } from '@/domain/offline';
import { errorCode } from '@/features/errors';

/** One shared cache for everything loaded from the database. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Keep loaded data around as long as the saved copy lives, so it can be shown offline.
      gcTime: SAVED_FOR_MS,
      // Retry network hiccups, but not rule errors like COW_CLAIM_LIMIT (retrying won't help).
      retry: (failureCount, error) => failureCount < 2 && errorCode(error) === null,
    },
    mutations: { retry: false },
  },
});

const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'cow:saved-data',
  throttleTime: 1000,
});

/**
 * Saves a copy of the safe-to-keep data on the phone (see src/domain/offline.ts for exactly
 * what) and loads it back when the app opens, so screens aren't blank without a connection.
 * Change `buster` whenever the shape of saved data changes: old copies are then thrown away.
 */
export const persistOptions: PersistQueryClientProviderProps['persistOptions'] = {
  persister,
  maxAge: SAVED_FOR_MS,
  buster: 'v1',
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => shouldSaveQuery(query.queryKey, query.state.status),
  },
};

/** Forget everything, in memory and on the phone. Called when someone signs out. */
export async function clearSavedData(): Promise<void> {
  queryClient.clear();
  try {
    await persister.removeClient();
  } catch {
    // Storage unavailable: the in-memory copy is already gone, and nothing was saved.
  }
}

const isConnected = (state: NetworkState) => state.isConnected !== false && state.isInternetReachable !== false;

let wired = false;

/** Refresh data when the app comes back to the front; pause requests while offline. */
export function wireQueryManagers(): void {
  if (wired) return;
  wired = true;
  AppState.addEventListener('change', (state) => focusManager.setFocused(state === 'active'));
  onlineManager.setEventListener((setOnline) => {
    // The listener only reports changes, so ask once for where things stand right now.
    getNetworkStateAsync()
      .then((state) => setOnline(isConnected(state)))
      .catch(() => {});
    const subscription = addNetworkStateListener((state) => setOnline(isConnected(state)));
    return () => subscription.remove();
  });
}

/** True while the phone has an internet connection. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
  );
}
