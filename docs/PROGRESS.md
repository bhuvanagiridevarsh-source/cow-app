# Progress Log

> **New session?** Read these first, in order: `docs/BRIEF.md`, `docs/PLAN.md`, this file, then run `git status`. Continue from **Next step** below.

_Last updated: Sep 27, 2026 (Phase 1)_

## Current phase

**Phase 1: Foundation** (normal effort). The plan was approved with **"go"**, which accepted every recommended decision D1–D8 (PLAN.md §2).
Steps 1.1–1.5 are done. Step 1.6 is built: the temporary `src/app/dev-check.tsx` screen. It's **waiting for phone check #1**.

## Next step

1. The user signs in to Expo on the Mac (`! npx expo login`) and in Expo Go on the iPhone, with the same account.
2. Start `npx expo start` and have the user run the "Run Expo Go check" screen, then record the results below.
3. Drop or replace any library that fails (brief §8 rule).
4. Delete `src/app/dev-check.tsx` and the Home button that opens it, run `npm run check`, commit, and push. That ends Phase 1.
5. Announce Phase 2 with `⚙️ Set effort to MAX for this phase`.

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
- [x] 1.6 (built) haptics wrapper that can't crash, plus the temporary dev-check screen.

## Facts found during research (keep in mind)

- **Libraries and Expo Go**
  - `lottie-react-native` is NOT in Expo Go on SDK 57.
  - `expo-haptics` isn't listed as included in Expo Go in the SDK 57 docs. Test it on the phone in Phase 1.
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
| 1 | Foundation: fonts/icons, lamp, Skia glow, smooth resize, bottom sheet, buzz | ⏳ pending | |
