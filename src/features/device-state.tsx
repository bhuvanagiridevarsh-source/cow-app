import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { readJSON, removeKey, STORAGE_KEYS, writeJSON } from '@/lib/storage';
import type { UserRole } from '@/lib/supabase';

/** Answers a new person gives before their account exists. Cleared once sign-up finishes. */
export type OnboardingDraft = {
  role?: UserRole;
  birthYear?: number;
  birthMonth?: number;
  /** Name from Sign in with Apple (Apple only shares it the first time). Pre-fills the name field. */
  nameHint?: string;
  name?: string;
  zip?: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianConsent?: boolean;
};

type DeviceState = {
  loaded: boolean;
  draft: OnboardingDraft;
  ageBlockedUntil: string | null;
  notice: string | null;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
  clearDraft: () => void;
  blockUntil: (date: string) => void;
  setNotice: (message: string | null) => void;
};

const DeviceStateContext = createContext<DeviceState | null>(null);

/** Small things this phone remembers (never sent anywhere). Loaded once at startup. */
export function DeviceStateProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [draft, setDraft] = useState<OnboardingDraft>({});
  const [ageBlockedUntil, setAgeBlockedUntil] = useState<string | null>(null);
  const [notice, setNoticeState] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      readJSON<OnboardingDraft>(STORAGE_KEYS.onboardingDraft),
      readJSON<string>(STORAGE_KEYS.ageBlockedUntil),
      readJSON<string>(STORAGE_KEYS.notice),
    ]).then(([savedDraft, savedBlock, savedNotice]) => {
      if (!active) return;
      setDraft(savedDraft ?? {});
      setAgeBlockedUntil(savedBlock);
      setNoticeState(savedNotice);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((current) => {
      const next = { ...current, ...patch };
      void writeJSON(STORAGE_KEYS.onboardingDraft, next);
      return next;
    });
  }, []);

  const clearDraft = useCallback(() => {
    setDraft({});
    void removeKey(STORAGE_KEYS.onboardingDraft);
  }, []);

  const blockUntil = useCallback((date: string) => {
    setAgeBlockedUntil(date);
    void writeJSON(STORAGE_KEYS.ageBlockedUntil, date);
  }, []);

  const setNotice = useCallback((message: string | null) => {
    setNoticeState(message);
    if (message) void writeJSON(STORAGE_KEYS.notice, message);
    else void removeKey(STORAGE_KEYS.notice);
  }, []);

  const value = useMemo(
    () => ({ loaded, draft, ageBlockedUntil, notice, updateDraft, clearDraft, blockUntil, setNotice }),
    [loaded, draft, ageBlockedUntil, notice, updateDraft, clearDraft, blockUntil, setNotice],
  );

  return <DeviceStateContext.Provider value={value}>{children}</DeviceStateContext.Provider>;
}

export function useDeviceState(): DeviceState {
  const value = useContext(DeviceStateContext);
  if (!value) throw new Error('useDeviceState must be used inside DeviceStateProvider');
  return value;
}
