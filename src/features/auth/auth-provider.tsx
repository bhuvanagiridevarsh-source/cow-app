import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { deriveAppStatus, type AppStatus } from '@/features/auth/app-status';
import { TERMS_VERSION } from '@/legal';
import { isSupabaseConfigured, supabase, type Profile } from '@/lib/supabase';

type AuthValue = {
  status: AppStatus;
  session: Session | null;
  userId: string | null;
  email: string | null;
  /** null while signing up (no profile yet) or signed out. */
  profile: Profile | null;
  reloadProfile: () => Promise<void>;
  /** everywhere = also sign out other devices. After deleting an account use 'thisDevice'. */
  signOut: (where?: 'everywhere' | 'thisDevice') => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export const profileQueryKey = (userId: string | null) => ['profile', userId] as const;

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

/** Keeps track of who is signed in and whether they've finished sign-up. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);
  const [authLoaded, setAuthLoaded] = useState(!isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    // Restore the saved sign-in (works offline too), then follow every change.
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data.session);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setAuthLoaded(true);
      });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthLoaded(true);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id ?? null;
  const profileQuery = useQuery({
    queryKey: profileQueryKey(userId),
    queryFn: () => fetchProfile(userId as string),
    enabled: userId !== null,
  });

  const status = deriveAppStatus({
    authLoaded,
    hasSession: session !== null,
    profileFailed: profileQuery.isError,
    profile: userId ? profileQuery.data : undefined,
    currentTermsVersion: TERMS_VERSION,
  });

  const { refetch } = profileQuery;
  const reloadProfile = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const signOut = useCallback(
    async (where: 'everywhere' | 'thisDevice' = 'everywhere') => {
      // signOut() reports problems (like being offline) by returning an error, not throwing.
      // If signing out everywhere fails, still sign out on this phone so nobody gets stuck.
      const { error } = await supabase.auth
        .signOut({ scope: where === 'everywhere' ? 'global' : 'local' })
        .catch((e: unknown) => ({ error: e }));
      if (error) await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
      queryClient.clear();
    },
    [queryClient],
  );

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      userId,
      email: session?.user.email ?? null,
      profile: profileQuery.data ?? null,
      reloadProfile,
      signOut,
    }),
    [status, session, userId, profileQuery.data, reloadProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
