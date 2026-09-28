/** Small rules for the sign-in screens. */

export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/** A sensible email check (the server does the real one when it sends the code). */
export function isValidEmail(input: string): boolean {
  const email = normalizeEmail(input);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

/** Demo/test accounts sign in with a password instead of an emailed code (see src/config.ts). */
export function usesPasswordSignIn(input: string, passwordEmails: readonly string[]): boolean {
  const email = normalizeEmail(input);
  return passwordEmails.some((e) => normalizeEmail(e) === email);
}

/** Keeps only digits from a typed or pasted code, up to the code length. */
export function cleanCode(input: string, length: number): string {
  return input.replace(/\D/g, '').slice(0, length);
}

/** "Maya Patel" from Apple's name parts (either part may be missing). */
export function joinName(given?: string | null, family?: string | null): string | null {
  const name = [given, family].map((p) => p?.trim()).filter(Boolean).join(' ');
  return name || null;
}
