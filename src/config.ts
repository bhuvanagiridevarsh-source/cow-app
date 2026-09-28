/**
 * App settings you (Devarsh / CoW) can change without touching any other code.
 *
 * - Any URL left as '' (blank) hides the button that uses it. The app never breaks because of a blank URL.
 * - Impact numbers and pickup rules are NOT here. They live in the Supabase `settings` table,
 *   so CoW's board can change them without a new app release (see docs/UPDATING_CONTENT.md).
 */

/** Supabase project URL. Comes from the git-ignored .env file (see .env.example). */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

/**
 * Supabase public key. Supabase now calls this the "Publishable key" (sb_publishable_...);
 * the older "anon" key also works. Safe to ship in the app. Never use the secret/service_role key.
 */
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** Zeffy donation page. Opens in the phone's browser (never in-app payments).
 *  While blank, every "Donate money" button is hidden. */
// TODO(Devarsh): paste CoW's Zeffy donation page URL here. This is the most important blank value.
export const DONATE_URL = '';

/** Where people email CoW. Shown as text on the Contact screen. */
export const CONTACT_EMAIL = 'hello.childrenofwarproject@gmail.com';

/** CoW's website. */
export const WEBSITE_URL = 'https://childrenofwarproject.org';

/**
 * "Join the Movement" form. The website's own "Join" menu link points to the #ambassador
 * section, which contains the sign-up form (there is no #join anchor on the site).
 * TODO(Devarsh): on your phone, tap Me -> Join the Movement and confirm it scrolls to the form.
 * If it doesn't, change this to WEBSITE_URL.
 */
export const JOIN_URL = 'https://childrenofwarproject.org/#ambassador';

/** About-screen content that CoW can update on GitHub without a new app release. */
export const CONTENT_URL =
  'https://raw.githubusercontent.com/bhuvanagiridevarsh-source/cow-app/main/content/content.json';

/** CoW's YouTube channel. */
export const YOUTUBE_URL = 'https://www.youtube.com/@CoWProject_SCBC';

/** Social media pages. Blank ones are hidden. */
// TODO(Devarsh): add CoW's social links when available.
export const SOCIAL_URLS: { label: string; url: string }[] = [
  { label: 'Instagram', url: '' },
  { label: 'LinkedIn', url: '' },
];

/** Privacy Policy on the website. While blank, the app shows its built-in copy. */
// TODO(Devarsh): add once the Privacy Policy is posted on the website.
export const PRIVACY_POLICY_URL = '';

/** Terms of Use on the website. While blank, the app shows its built-in copy. */
// TODO(Devarsh): add once the Terms of Use are posted on the website.
export const TERMS_URL = '';

/**
 * Demo and test accounts that sign in with a PASSWORD instead of an emailed code.
 * Why: App Store reviewers can't receive our codes, and Apple requires a working demo account.
 * Create each one in Supabase: Authentication -> Users -> Add user -> Create new user,
 * with "Auto Confirm User" checked (see docs/SUPABASE_SETUP.md). Passwords never go in this repo.
 */
export const PASSWORD_SIGN_IN_EMAILS: readonly string[] = [
  'demo.donor@childrenofwarproject.org',
  'demo.volunteer@childrenofwarproject.org',
];

/**
 * Digits in the emailed sign-in code. Must match Supabase:
 * Authentication -> Sign In / Providers -> Email -> "Email OTP Length" (set it to 6).
 */
export const OTP_LENGTH = 6;

/** App Store / Play Store app IDs (also set in app.json). */
export const IOS_BUNDLE_ID = 'org.childrenofwarproject.app';
export const ANDROID_PACKAGE = 'org.childrenofwarproject.app';
