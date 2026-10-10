# Progress Log

> **New session?** Read these first, in order: `docs/BRIEF.md`, `docs/PLAN.md`, this file, then run `git status`. Continue from **Next step** below.

_Last updated: Oct 9, 2026 (Phase 3)_

## Current phase

**Phase 3: Accounts & sign-in** (MAX effort). Steps 3.1–3.6 are built. Supabase dashboard setup (SUPABASE_SETUP Part B: B0–B4) is **done**: the two demo accounts exist, and the user's own account signed in with an email code, finished onboarding, and is an admin. It's **waiting for** the rest of **phone check #3** (checklist at the bottom).

All 6 checks pass (Oct 9, 115 unit tests), after `npx expo install --fix` brought 4 Expo packages up to the SDK's current patch versions.

## Next step

1. The user decides how to close Phase 3: **with Apple sign-in recorded as "built, untested"** (recommended), or wait for a real build. Everything else in phone check #3 passed.
2. On their OK: push, then announce Phase 4 (normal effort) and wait for "ready."

**Apple sign-in status.** The user's Expo Go (iPhone 15 Plus, iOS 27) has no `ExpoAppleAuthentication` native module, even after updating Expo Go on Oct 9, so the app correctly hides the button. Expo's SDK 57 docs and Expo Go source both list it as included; the cause is unknown. It must be tested in a real build (Phase 9, needs the Apple Developer account). Add to LAUNCH_CHECKLIST.

## Done

- [x] Git set up inside `cow-app` and connected to GitHub: `bhuvanagiridevarsh-source/cow-app` (public, `main` branch).
- [x] Brief saved as `docs/BRIEF.md`.
- [x] Website snapshot saved in `reference/website-home.html`. Its photos are embedded in the file.
- [x] Lamp logo from the website saved as `assets/brand/cow-logo-256.png`. It's only 256 px; a higher-res version is needed later.
- [x] Research for the plan:
  - Expo Go / SDK 57 library support
  - Supabase auth, storage, and free-plan limits
  - brand colors taken from the site's stylesheet
- [x] `docs/PLAN.md` written and approved.
- [x] 1.1 Starter demo removed, app identity set (`app.json`), `.env.example` added.
- [x] 1.2 ESLint + Jest set up. `npm run check` runs all 6 brief gates.
- [x] 1.3 Approved libraries installed with `npx expo install`.
- [x] 1.4 `src/theme.ts` (site colors, AA-tested in both themes), fonts, UI building blocks, the `Lamp` diya (replaces Lottie), custom tab bar, 5 tabs.
- [x] 1.5 `src/config.ts` (brief §10), link helpers, blank-URL hiding, tests.
- [x] 1.6 Phone check #1 done. The temporary dev-check screen was removed. The lamp flicker was made stronger after feedback.
- [x] 2.1 `docs/SAFETY_POLICY_DRAFT.md`, for the board.
- [x] 2.2 Dev Supabase project **cow-app-dev** created: ref `uhmwcvkgwlpejcdvudun`, us-east-1, org "Blogs", free, $0. The URL and publishable key are in `.env` (git-ignored).
- [x] 2.3 Migrations `supabase/migrations/…000100` through `…000800` are applied to dev:
  - schema
  - ZIP data (4,324 ZIPs)
  - security rules
  - functions and guards
  - admin commands
  - storage
  - API wrappers
  - the block-visibility fix
- [x] 2.4 TypeScript types saved in `src/lib/database.types.ts`. App-side rule copies are in `src/domain/{age,zip,status}.ts`, with friendly error messages in `src/features/errors.ts`.
- [x] 3.1 Supabase client with saved sessions; root navigator with one protected screen group per app state (status / (auth) / onboarding / (app)); a "not set up yet" screen.
- [x] 3.2 Welcome (live impact total), neutral birthday screen before any email, and the under-13 screen with the block remembered on the device. A development-only reset exists for testers.
- [x] 3.3 Email code sign-in (resend cooldown), the demo-account password path, and Sign in with Apple (SHA-256 nonce, iPhone only).
- [x] 3.4 Onboarding (details, guardian for ages 13–17, Terms). `docs/TERMS.md` and `docs/PRIVACY_POLICY.md` are drafts for the board; they're synced into the app by `npm run sync-legal`, and tests guard it.
- [x] 3.5 Me tab basics, edit profile, delete account.
- [x] 3.6 `docs/SUPABASE_SETUP.md`, first version (Parts A and B).
- [x] 2.5 `supabase/tests/security_and_rules.test.sql`: **78/78 pass**. `docs/RLS_TEST_PLAN.md` written. Supabase security advisor: **0 issues**. Unit tests: 88 pass.

## Facts found during research (keep in mind)

- **Libraries and Expo Go**
  - `lottie-react-native` is NOT in Expo Go on SDK 57.
  - `expo-haptics`: phone check #1 confirmed **no buzz in Expo Go**. The wrapper skips it safely. Re-test in a real build (Phase 9).
  - The phone connects to the Mac's dev server only via `npx expo start --tunnel`: the Mac firewall blocks LAN connections. The user runs Expo in their own Terminal (the Claude `!` prompt can't take typed input).
- **Testing setup**
  - This Mac has **no Xcode**, so there's no iOS simulator; phone checks are done by the user on their iPhone.
  - Expo Go on a real iPhone requires Expo Go and the Expo CLI to be signed in to the same Expo account. The CLI is currently **not logged in**.
- **Supabase**
  - The built-in email only sends to members of the Supabase team, with a low hourly limit. Real email sending (SMTP) is required before launch.
  - Sign in with Apple in Expo Go needs `host.exp.Exponent` added to the Apple provider's Client IDs in Supabase.
  - Supabase now calls the anon key the "publishable key" (`sb_publishable_…`). Either works.
  - Storage files must be deleted through the Storage API, not SQL.
  - Free projects pause after 7 days of low activity (restorable for 90 days).
  - The user's existing Supabase org "Blogs" has 3 projects, all paused. None of them are for CoW.
- **Icons:** import them one at a time from `phosphor-react-native/src/icons/<Name>`; a lint rule blocks root imports. `tsconfig` `paths` maps those imports to the compiled `.d.ts` files, because phosphor's own `.tsx` source fails our type check. The bundle was verified to contain the real icon code.
- **JOIN_URL** is `#ambassador`: the site has no `#join` anchor, and its own "Join" menu link goes to `#ambassador`.
- **How migrations were applied to dev.** The Supabase connector can't read local files, so each file is pushed to GitHub, and the database fetches it from `raw.githubusercontent.com` pinned to a commit SHA. It checks the md5 checksum before running it, so the exact committed file runs. The `http` extension is turned on only for that step and removed afterwards.
  - Dev's migration history is out of order (100, 200, 500, 600, 300, 400, 700, 800), because the first batch was sent at once by mistake.
  - The end result is identical to the file order. For production, apply the files in file-name order (SQL Editor, or `supabase db push`).
- **After every migration:** regenerate the types, re-run the security tests, and check the advisor.
- **Expo location:** on Android, `geocodeAsync` needs location permission. That's why the ZIP-centroid fallback exists.

## Open items found in Phase 3

- **Sign in with Apple token revocation.** Apple says apps "should" revoke Sign in with Apple tokens when an account is deleted. That needs a server-side Apple key and an Edge Function. It isn't built yet; add it to LAUNCH_CHECKLIST as a known item.
- **Leftover empty logins.** If an under-13 sign-in happens while offline, an empty login (email only, no profile) may remain. Plan: add an `admin.cleanup_unfinished_signups()` command and document it in ADMIN_GUIDE (Phase 9).
- **Typed routes.** Route types are generated only by the dev server (`.expo/types`). On a fresh clone, route checking is relaxed until `npx expo start` runs once.

## Waiting on (not blocking yet)

- [ ] High-res logo, 1024×1024+ (needed in Phase 9)
- [ ] Zeffy donation URL (Donate buttons stay hidden until then)
- [ ] `reference/app-plan.html` (optional)
- [ ] Who manages the childrenofwarproject.org domain? Needed for real email sending before launch.
- [ ] Privacy Policy / Terms URLs, once posted on the website
- [ ] Apple Developer + Google Play organization enrollment (long lead time; see PLAN.md §12)

## Phone checks

| # | Phase | Result | Notes |
|---|---|---|---|
| 3 | Accounts: email code, Apple, age gate, onboarding, delete | ✅ 8/9 | Email code ✓, stay signed in ✓, edit profile ✓, legal pages ✓, sign out ✓, under-13 ✓, demo password sign-in + guardian ✓, delete account ✓. Apple sign-in ✗: not testable in the user's Expo Go (see Next step). Both demo accounts have finished setup. |
| 1 | Foundation: fonts/icons, lamp, Skia glow, smooth resize, bottom sheet, buzz | ✅ 5/6 | Fonts/icons ✓, Skia ✓, resize ✓, bottom sheet ✓. The lamp flicker was too faint, so it was made stronger. Haptics ✗ in Expo Go (skipped safely). |

### Phone check #3 checklist

Start with `npx expo start --tunnel` in your own Terminal. Reply with ✓ or ✗ for each line.

1. **Email code.** Sign in with your own email; a 6-digit code arrives and works. (Already seen working on Oct 9.)
2. **Stay signed in.** Close Expo Go fully and reopen the app: you land on Home, not Welcome.
3. **Edit profile.** Me → Edit profile: change your name or ZIP, save, and see the change.
4. **Legal pages.** Me → Terms of Use and Privacy Policy both open and scroll.
5. **Sign out.** Me → Sign out returns you to Welcome.
6. **Under 13.** On the birthday screen pick a date that makes you 12: you get the friendly stop screen and are never asked for an email. Then tap "Developer only: reset the age check".
7. **Demo donor + guardian.** Enter `demo.donor@childrenofwarproject.org`: a password box appears instead of "Send code". Sign in, choose a birth date that makes you 15, and confirm the parent/guardian screen appears before Terms.
8. **Sign in with Apple.** Sign out, tap Sign in with Apple, and finish onboarding.
9. **Delete account.** Signed in with the Apple account from line 8: Me → Delete account → "Yes, delete everything". You return to Welcome. (Don't delete your own admin account, or B4 has to be redone.)
