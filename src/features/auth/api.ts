import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { joinName, normalizeEmail } from '@/domain/auth';
import { supabase, type UserRole } from '@/lib/supabase';

const PHOTO_BUCKET = 'item-photos';

/** Step 1 of email sign-in: email a one-time code (also creates the login for new people). */
export async function sendEmailCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: normalizeEmail(email),
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

/** Step 2: check the code. On success Supabase saves the session and the app moves on by itself. */
export async function verifyEmailCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email: normalizeEmail(email), token: code, type: 'email' });
  if (error) throw error;
}

/** Demo/test accounts only (see PASSWORD_SIGN_IN_EMAILS in src/config.ts). */
export async function signInWithPassword(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: normalizeEmail(email), password });
  if (error) throw error;
}

/**
 * Sign in with Apple (iPhone). Apple shares the person's name only the very first time,
 * so we return it to pre-fill the name field. Returns null if they cancelled.
 */
export async function signInWithApple(): Promise<{ name: string | null } | null> {
  // A one-time random value ties this Apple sign-in to this request (stops replay attacks).
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') return null;
    throw error;
  }
  if (!credential.identityToken) throw new Error('Apple did not return a sign-in token.');
  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
  return { name: joinName(credential.fullName?.givenName, credential.fullName?.familyName) };
}

export type NewProfile = {
  name: string;
  role: UserRole;
  birthYear: number;
  birthMonth: number;
  zip: string;
  termsVersion: string;
  guardianName?: string;
  guardianEmail?: string;
  guardianConsent?: boolean;
};

/** Finish sign-up. The database re-checks the age rules (it refuses under-13). */
export async function completeProfile(p: NewProfile): Promise<void> {
  const { error } = await supabase.rpc('complete_profile', {
    p_name: p.name.trim(),
    p_role: p.role,
    p_birth_year: p.birthYear,
    p_birth_month: p.birthMonth,
    p_zip: p.zip,
    p_terms_version: p.termsVersion,
    p_guardian_name: p.guardianName?.trim() || undefined,
    p_guardian_email: p.guardianEmail?.trim() || undefined,
    p_guardian_consent: p.guardianConsent ?? false,
  });
  if (error) throw error;
}

export async function acceptTerms(termsVersion: string): Promise<void> {
  const { error } = await supabase.rpc('accept_terms', { p_terms_version: termsVersion });
  if (error) throw error;
}

export type ProfileChanges = {
  name: string;
  zip: string;
  role: UserRole;
  guardianName?: string;
  guardianEmail?: string;
};

export async function updateProfile(c: ProfileChanges): Promise<void> {
  const { error } = await supabase.rpc('update_profile', {
    p_name: c.name.trim(),
    p_zip: c.zip,
    p_role: c.role,
    p_guardian_name: c.guardianName?.trim() || undefined,
    p_guardian_email: c.guardianEmail?.trim() || undefined,
  });
  if (error) throw error;
}

export async function requestAmbassador(): Promise<void> {
  const { error } = await supabase.rpc('request_ambassador');
  if (error) throw error;
}

/** Deletes every photo in the person's folder (Supabase only allows this through the Storage API). */
async function removeAllMyPhotos(userId: string): Promise<void> {
  const bucket = supabase.storage.from(PHOTO_BUCKET);
  for (let round = 0; round < 50; round++) {
    const { data, error } = await bucket.list(userId, { limit: 100 });
    if (error) throw error;
    const files = (data ?? []).filter((f) => f.name && f.id);
    if (files.length === 0) return;
    const { error: removeError } = await bucket.remove(files.map((f) => `${userId}/${f.name}`));
    if (removeError) throw removeError;
  }
}

/**
 * Delete account (Apple requires this in the app): photos first, then the database removes
 * everything that belongs to this person and their login.
 */
export async function deleteMyAccount(userId: string): Promise<void> {
  await removeAllMyPhotos(userId);
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw error;
}
