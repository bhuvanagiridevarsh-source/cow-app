import { useQuery } from '@tanstack/react-query';

import { DEFAULT_ZIP_PREFIXES } from '@/domain/zip';
import { supabase, type Settings } from '@/lib/supabase';

/** The board's rules the app needs on screen. The database enforces all of them again. */
export type AppRules = {
  allowedZipPrefixes: readonly string[];
  maxItemValue: number;
  maxActiveListings: number;
  minorDonorsNeedAdultHome: boolean;
  minPickupAge: number;
  minorsNeedAdultOnPickup: boolean;
};

/** Used only until the live settings load (they match the database's starting values). */
export const DEFAULT_RULES: AppRules = {
  allowedZipPrefixes: DEFAULT_ZIP_PREFIXES,
  maxItemValue: 5000,
  maxActiveListings: 10,
  minorDonorsNeedAdultHome: true,
  minPickupAge: 16,
  minorsNeedAdultOnPickup: true,
};

function toRules(s: Settings): AppRules {
  return {
    allowedZipPrefixes: s.allowed_zip_prefixes,
    maxItemValue: s.max_item_value,
    maxActiveListings: s.max_active_listings_per_donor,
    minorDonorsNeedAdultHome: s.minor_donors_require_adult_home,
    minPickupAge: s.min_pickup_age,
    minorsNeedAdultOnPickup: s.minors_require_adult_on_pickup,
  };
}

async function fetchRules(): Promise<AppRules> {
  const { data, error } = await supabase.from('settings').select('*').single();
  if (error) throw error;
  return toRules(data);
}

/** The board's current rules, or the starting values while they load or if the phone is offline. */
export function useRules(): AppRules {
  const { data } = useQuery({ queryKey: ['settings'], queryFn: fetchRules, staleTime: 5 * 60_000 });
  return data ?? DEFAULT_RULES;
}
