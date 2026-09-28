import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';

import { friendlyError } from '@/features/errors';

/** Plain-words messages for Supabase sign-in errors (by Supabase error code). */
export const AUTH_MESSAGES: Record<string, string> = {
  over_email_send_rate_limit: 'Please wait a minute before asking for another code.',
  over_request_rate_limit: 'Too many tries. Please wait a minute and try again.',
  otp_expired: "That code didn't work. It may be mistyped or expired. You can ask for a new one.",
  otp_disabled: 'Email codes are turned off right now. Please contact CoW.',
  email_address_invalid: 'Please check your email address.',
  validation_failed: 'Please check what you typed and try again.',
  email_address_not_authorized:
    "We can't send a code to that email yet. CoW's email service is still being set up.",
  invalid_credentials: 'That email and password don’t match.',
  email_not_confirmed: 'That account isn’t confirmed yet. Please contact CoW.',
  provider_disabled: 'This sign-in option isn’t turned on yet.',
  email_provider_disabled: 'Email sign-in isn’t turned on yet.',
  signup_disabled: 'New sign-ups are paused right now. Please try again later.',
  user_banned: 'This account has been suspended. Please contact CoW.',
  captcha_failed: 'Please try again.',
  request_timeout: "You're offline or the connection is slow. Please try again.",
};

/** Friendly message for anything thrown while signing in (auth errors, database codes, offline). */
export function friendlyAuthError(error: unknown): string {
  if (isAuthRetryableFetchError(error)) {
    return "You're offline. Check your internet connection and try again.";
  }
  if (isAuthError(error) && error.code && AUTH_MESSAGES[error.code]) {
    return AUTH_MESSAGES[error.code];
  }
  return friendlyError(error);
}
