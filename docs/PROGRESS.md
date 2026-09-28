# Progress Log

> **New session?** Read these first, in order: `docs/BRIEF.md`, `docs/PLAN.md`, this file, then run `git status`. Continue from **Next step** below.

_Last updated: Sep 27, 2026 (end of Phase 2)_

## Current phase

**Phase 2: Database & security is COMPLETE.** Next is **Phase 3: Accounts & sign-in** (MAX effort).

## Next step

Announce Phase 3 with `⚙️ Set effort to MAX for this phase`, wait for "ready", then start step 3.1: the Supabase client, saved sessions, and the "not set up yet" screen.
The user will need to do some Supabase dashboard setup in step 3.6: the email template with the code, the Apple Client ID `host.exp.Exponent`, and the demo accounts.

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
| 1 | Foundation: fonts/icons, lamp, Skia glow, smooth resize, bottom sheet, buzz | ✅ 5/6 | Fonts/icons ✓, Skia ✓, resize ✓, bottom sheet ✓. The lamp flicker was too faint, so it was made stronger. Haptics ✗ in Expo Go (skipped safely). |
