import { useCallback } from 'react';

import { ageBlockedUntil } from '@/domain/age';
import { useAuth } from '@/features/auth/auth-provider';
import { useDeviceState } from '@/features/device-state';
import { supabase } from '@/lib/supabase';

/**
 * Someone under 13 got as far as signing in (e.g. via "I already have an account").
 * Delete the brand-new login right away, sign out, and show the friendly under-13 screen.
 */
export function useEndUnder13() {
  const { signOut } = useAuth();
  const { blockUntil, clearDraft } = useDeviceState();
  return useCallback(
    async (birthYear: number, birthMonth: number) => {
      blockUntil(ageBlockedUntil(birthYear, birthMonth));
      clearDraft();
      try {
        // No profile or photos exist yet, so this removes the login (and its email) completely.
        await supabase.rpc('delete_my_account');
      } catch {
        // Offline: the empty login is removed later by CoW's cleanup (docs/ADMIN_GUIDE.md).
      }
      await signOut('thisDevice');
    },
    [blockUntil, clearDraft, signOut],
  );
}
