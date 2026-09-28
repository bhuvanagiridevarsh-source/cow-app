import { ageBlockedUntil, isAgeBlocked } from '@/domain/age';
import { cleanCode, isValidEmail, joinName, normalizeEmail, usesPasswordSignIn } from '@/domain/auth';
import { deriveAppStatus } from '@/features/auth/app-status';

describe('age block for under-13 visitors', () => {
  it('lasts until the month after they turn 13', () => {
    expect(ageBlockedUntil(2014, 3)).toBe('2027-04-01');
    expect(ageBlockedUntil(2014, 12)).toBe('2028-01-01');
  });
  it('is active before that date and lifts on it', () => {
    expect(isAgeBlocked('2027-04-01', new Date(2027, 2, 31))).toBe(true);
    expect(isAgeBlocked('2027-04-01', new Date(2027, 3, 1))).toBe(false);
    expect(isAgeBlocked(null)).toBe(false);
    expect(isAgeBlocked('garbage')).toBe(false);
  });
});

describe('email and code helpers', () => {
  it('normalizes and validates emails', () => {
    expect(normalizeEmail('  Maya@Example.COM ')).toBe('maya@example.com');
    expect(isValidEmail('maya@example.com')).toBe(true);
    expect(isValidEmail('maya@example')).toBe(false);
    expect(isValidEmail('maya example.com')).toBe(false);
  });
  it('recognizes demo accounts regardless of case/spaces', () => {
    const list = ['demo.donor@childrenofwarproject.org'];
    expect(usesPasswordSignIn(' Demo.Donor@ChildrenOfWarProject.org ', list)).toBe(true);
    expect(usesPasswordSignIn('someone@example.com', list)).toBe(false);
  });
  it('keeps only digits in codes', () => {
    expect(cleanCode('12 34-56', 6)).toBe('123456');
    expect(cleanCode('1234567', 6)).toBe('123456');
    expect(cleanCode('abc', 6)).toBe('');
  });
  it('joins Apple name parts', () => {
    expect(joinName('Maya', 'Patel')).toBe('Maya Patel');
    expect(joinName('Maya', null)).toBe('Maya');
    expect(joinName(null, null)).toBeNull();
  });
});

describe('deriveAppStatus', () => {
  const base = {
    authLoaded: true,
    hasSession: true,
    profileFailed: false,
    profile: { terms_version: 'v1' } as { terms_version: string } | null | undefined,
    currentTermsVersion: 'v1',
  };
  it('waits for the saved sign-in to load', () => {
    expect(deriveAppStatus({ ...base, authLoaded: false })).toBe('loading');
  });
  it('shows sign-in screens when signed out', () => {
    expect(deriveAppStatus({ ...base, hasSession: false })).toBe('signed_out');
  });
  it('loads the profile, or shows a retry screen if it fails with nothing saved', () => {
    expect(deriveAppStatus({ ...base, profile: undefined })).toBe('loading');
    expect(deriveAppStatus({ ...base, profile: undefined, profileFailed: true })).toBe('error');
  });
  it('sends new accounts (no profile) to finish sign-up', () => {
    expect(deriveAppStatus({ ...base, profile: null })).toBe('onboarding');
  });
  it('asks to accept new Terms when they change', () => {
    expect(deriveAppStatus({ ...base, currentTermsVersion: 'v2' })).toBe('onboarding');
  });
  it('opens the app otherwise', () => {
    expect(deriveAppStatus(base)).toBe('ready');
  });
});
