/**
 * Which part of the app to show. Pure function so it can be unit-tested.
 *   signed_out  -> Welcome / sign-in screens
 *   onboarding  -> finish sign-up (or accept new Terms)
 *   ready       -> the app
 *   loading     -> lamp loading screen
 *   error       -> "couldn't load your account" with Try again
 */
export type AppStatus = 'loading' | 'signed_out' | 'onboarding' | 'ready' | 'error';

export type AppStatusInput = {
  authLoaded: boolean;
  hasSession: boolean;
  /** Profile request failed and there is nothing saved to show. */
  profileFailed: boolean;
  /** null = signed in but hasn't finished sign-up. */
  profile: { terms_version: string } | null | undefined;
  currentTermsVersion: string;
};

export function deriveAppStatus(input: AppStatusInput): AppStatus {
  if (!input.authLoaded) return 'loading';
  if (!input.hasSession) return 'signed_out';
  if (input.profile === undefined) {
    if (input.profileFailed) return 'error';
    return 'loading';
  }
  if (input.profile === null) return 'onboarding';
  if (input.profile.terms_version !== input.currentTermsVersion) return 'onboarding';
  return 'ready';
}
