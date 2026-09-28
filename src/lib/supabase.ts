import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/config';
import { isUsableUrl } from '@/domain/urls';
import type { Database } from '@/lib/database.types';

/** False when .env is missing the Supabase values. The app then shows a "not set up yet" screen. */
export const isSupabaseConfigured = isUsableUrl(SUPABASE_URL) && SUPABASE_ANON_KEY.trim().length > 20;

// Without configuration we still create a client pointing nowhere, so importing this file can
// never crash. The root layout shows the "not set up yet" screen and nothing calls it.
export const supabase = createClient<Database>(
  isSupabaseConfigured ? SUPABASE_URL : 'https://not-configured.invalid',
  isSupabaseConfigured ? SUPABASE_ANON_KEY : 'not-configured',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// Keep the sign-in fresh only while the app is open (Supabase's guidance for React Native).
if (isSupabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];
export type UserRole = Database['public']['Enums']['user_role'];
