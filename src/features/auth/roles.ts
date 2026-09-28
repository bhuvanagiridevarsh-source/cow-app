import type { Profile, UserRole } from '@/lib/supabase';

/** How each choice is shown on buttons. */
export const ROLE_LABELS: Record<UserRole, string> = {
  donor: 'Donate items',
  volunteer: 'Volunteer',
  ambassador: 'Ambassador',
};

/** One line describing someone's role, including their Ambassador status. */
export function roleSummary(profile: Pick<Profile, 'role' | 'verified_ambassador' | 'ambassador_requested_at'>): string {
  if (profile.verified_ambassador) return 'Verified Ambassador';
  if (profile.ambassador_requested_at) return 'Ambassador request pending (CoW reviews it)';
  return profile.role === 'donor' ? 'Donor' : 'Volunteer';
}
