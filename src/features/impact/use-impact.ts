import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

export type Impact = { total: number; goal: number; label: string };

async function fetchImpact(): Promise<Impact> {
  const [totalResult, settingsResult] = await Promise.all([
    supabase.rpc('impact_total'),
    supabase.from('settings').select('goal_amount, goal_label').single(),
  ]);
  if (totalResult.error) throw totalResult.error;
  if (settingsResult.error) throw settingsResult.error;
  return {
    total: Number(totalResult.data),
    goal: Number(settingsResult.data.goal_amount),
    label: settingsResult.data.goal_label,
  };
}

/** CoW's live impact total and goal (public: works signed out too). */
export function useImpact() {
  return useQuery({ queryKey: ['impact'], queryFn: fetchImpact, staleTime: 60_000 });
}
