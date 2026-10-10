import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { Point } from '@/domain/distance';
import { fetchZipPoint } from '@/features/pickups/api';
import { getPhonePoint, hasLocationPermission, LocationError } from '@/lib/location';
import { readJSON, STORAGE_KEYS, writeJSON } from '@/lib/storage';

type Origin = {
  /** The point distances are measured from, or null while it's unknown. */
  point: Point | null;
  /** 'phone' when using the phone's location, 'zip' when using the profile ZIP. */
  source: 'phone' | 'zip';
  busy: boolean;
  /** A friendly note after trying to use the phone's location (e.g. permission was declined). */
  message: string | null;
  needsSettings: boolean;
  switchToPhone: () => Promise<void>;
  switchToZip: () => void;
};

/**
 * Where "nearby" is measured from. Starts with the person's ZIP code; "Use my location"
 * switches to the phone's location. Either way the point stays on the phone.
 */
export function useOrigin(zip: string | undefined): Origin {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [needsSettings, setNeedsSettings] = useState(false);

  const zipPoint = useQuery({
    queryKey: ['zip-point', zip],
    queryFn: () => fetchZipPoint(zip as string),
    enabled: !!zip,
    staleTime: Infinity,
  });

  // If the person chose "Use my location" before and it's still allowed, keep using it.
  const phonePoint = useQuery({
    queryKey: ['phone-point'],
    queryFn: async (): Promise<Point | null> => {
      const wanted = await readJSON<boolean>(STORAGE_KEYS.useLocation);
      if (!wanted || !(await hasLocationPermission())) return null;
      try {
        return await getPhonePoint();
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60_000,
  });

  const switchToPhone = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    setNeedsSettings(false);
    try {
      const point = await getPhonePoint();
      await writeJSON(STORAGE_KEYS.useLocation, true);
      queryClient.setQueryData(['phone-point'], point);
    } catch (e) {
      setNeedsSettings(e instanceof LocationError && e.needsSettings);
      setMessage(e instanceof LocationError ? e.message : 'Showing items near your ZIP code instead.');
    } finally {
      setBusy(false);
    }
  }, [queryClient]);

  const switchToZip = useCallback(() => {
    setMessage(null);
    setNeedsSettings(false);
    void writeJSON(STORAGE_KEYS.useLocation, false);
    queryClient.setQueryData(['phone-point'], null);
  }, [queryClient]);

  const phone = phonePoint.data ?? null;
  return {
    point: phone ?? zipPoint.data ?? null,
    source: phone ? 'phone' : 'zip',
    busy,
    message,
    needsSettings,
    switchToPhone,
    switchToZip,
  };
}
