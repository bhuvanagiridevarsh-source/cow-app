# Progress Log

> **New session?** Read these first, in order: `docs/BRIEF.md`, `docs/PLAN.md`, this file, then run `git status`. Continue from **Next step** below.

_Last updated: Oct 10, 2026 (Phase 3 closed)_

## Current phase

**V1 is built. All 10 phases are complete** (Oct 10, 2026). The brief's Definition of Done (§12) is met for everything that can be checked in Expo Go.

All 6 checks pass on the user's Mac and on a brand-new copy cloned from GitHub (266 unit tests). All 83 database security tests pass against cow-app-dev. The user confirmed phone check #10.

## Next step

There is no more planned build work. What remains is launch work, in `docs/LAUNCH_CHECKLIST.md`:

1. **CoW's adults:** enroll in the Apple Developer Program and Google Play as an organization (slow; start now). Review `SAFETY_POLICY_DRAFT.md`, `TERMS.md`, and `PRIVACY_POLICY.md`. Approve the icon or supply a 1024×1024 logo. Say who manages the website's domain.
2. **Devarsh:** fill in the pending values in `src/config.ts` (the Zeffy link first), and post the Privacy Policy and Terms on the website.
3. **With the Apple account:** create the production Supabase project (`SUPABASE_SETUP.md` Part C), make the first preview build, and run the checks Expo Go couldn't do: Sign in with Apple, the success buzz, the real icon and launch screen.
4. **Before submitting:** build Apple sign-in token revocation (see "Open items"), and run the phone checklists on a real Android phone before the Android release.

If a new session picks this up, start from the user's request; this file and `LAUNCH_CHECKLIST.md` say what is open.

## Phase 10 findings (all fixed unless marked open)

**10.1 Fresh copy**
- The type check **failed on a fresh clone** and passed only on the user's Mac, because of a helper file Expo generates locally (`expo-env.d.ts`). Fixed in `src/components/pickup-timeline.tsx`. `npm run typecheck` now also checks the code the way a fresh clone sees it (`tsconfig.fresh-clone.json`), so this can't recur unnoticed.

**10.2 Database**
- Baseline: 78/78 passed. After the fixes below: **83/83**. Security Advisor: no errors, 1 expected warning (leaked-password protection; a dashboard setting).

**10.4 Security, privacy, and brief review**
- **Minor status was readable (fixed).** Anyone signed in could read `items.adult_home_confirmed`, which only donors under 18 tick, so they could tell which listings (and homes) belong to minors. A donor could read `pickups.adult_attending` and tell a volunteer was a minor. The app never showed the first; it did show the second ("An adult is coming with them"), which is now removed. Migration `20261010000200_private_columns.sql` limits the app to an explicit list of columns on `items`, `pickups`, and `reports`. Five new database tests prove it; run before the fix, exactly the three leak tests failed.
- **Admin notes on reports were readable by the reporter (fixed)** in the same migration.
- **A login could be created before the age question (fixed).** "I already have an account" created a login and sent an email for any address, so a child's email could be stored without ever seeing the age screen. Email sign-in now refuses unknown addresses unless the age question was answered on that phone. Sign in with Apple still creates the login first; the age question follows immediately and an under-13 login is deleted.
- **Saved offline data survived some sign-outs (fixed).** It was erased only when the person tapped Sign out. It is now erased on every sign-out, including one forced from another device.
- **Admins loaded everyone's pickups (fixed).** "My pickups" relied on the database to filter, but admins may see all pickups. It now filters to the signed-in person.
- **Donors weren't told a listing was hidden for review (fixed).** The Donate tab now says so.
- **Android would back up the saved sign-in to Google (fixed):** `android.allowBackup` is now false.
- **Two iOS permission messages had vague default wording (fixed),** and **Apple's privacy manifest was missing (fixed):** `ios.privacyManifests` in `app.json`. Verified by generating the real iOS and Android projects in a scratch folder: strict network security, specific wording everywhere, tracking off.
- **A real uploaded photo was inspected and carries no location or camera information** (details in phone check #10, line 5).
- **Checked and clean:** no secrets anywhere in the git history, `.env` never committed, no logging of personal data, no ad, analytics, or tracking libraries, no "tax-deductible", every link resolves (tie.org refused the automated check; the user taps it once).
- **Open, documented in LAUNCH_CHECKLIST:** library audit warnings are in build tools except one low-risk web-address reader inside the navigation library (fixed in the next Expo SDK); Android's permission list should be reviewed before the Android release; Sign in with Apple, the success buzz, and the real icon and launch screen need a real build; Apple sign-in token revocation is not built.

**Apple sign-in status (carry to LAUNCH_CHECKLIST in Phase 9).** The user's Expo Go (iPhone 15 Plus, iOS 27) has no `ExpoAppleAuthentication` native module, even after updating Expo Go, so the app correctly hides the button. Expo's SDK 57 docs and Expo Go source both list it as included; the cause is unknown. It must be tested in a real build, which needs the Apple Developer account.

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
- [x] 4.1 `content/content.json` (brief §4 + website), rules in `src/features/content/schema.ts` (zod), loader in `load.ts`, and `useContent()`. The app ships the same file it fetches from GitHub, so there is no second copy to keep in sync. Order of preference: valid online copy, then the last good saved copy, then the built-in copy. Events sort themselves into coming up / past by date (`src/domain/events.ts`). 35 new tests.
- [x] 4.2 About screens under `src/app/about/` (hub, story, how it works, team, partners, events, levels), open to signed-out visitors from Welcome. CoW's portraits and two photos were extracted from the website snapshot into `assets/content/`; a person without a photo shows initials.
- [x] 4.3 Me tab: profile card, Ambassador request (button / pending / verified), About, Join the Movement, YouTube, Contact, Terms, Privacy, sign out, delete. Donate and social rows stay hidden while their URLs are blank. "Blocked users" arrives with blocking in Phase 6.
- [x] 4.4 `docs/UPDATING_CONTENT.md`. Pushed; the live GitHub copy of `content.json` was checked against the local file.
- [x] 5.1 The 4-step listing flow in `src/app/(app)/list-item/` (category; photo, name, value, condition, day and time; address; review). Rules live in `src/domain/listing.ts` and `src/domain/pickup-windows.ts` (New Jersey time, daylight-saving safe). Minor donors get the adult-home checkbox when the board's rule is on (D3). The same screens edit a listing (`/list-item?id=...`).
- [x] 5.2 Photo pipeline in `src/lib/photos.ts`: camera (asks permission) or the photo picker (no permission needed), shrink to 1600 px, re-save as JPEG, upload with 3 tries. `src/lib/jpeg.ts` inspects the bytes and **refuses to upload any photo that still carries GPS data**. The photo uploads only when Post is tapped, and is removed again if posting fails.
- [x] 5.3 Donate tab: listings grouped by what happens next, Edit and Remove for waiting listings, a "choose a new time" prompt once a pickup time passes, the listing limit, pull to refresh, and a Donate money card (hidden while the Zeffy link is blank).
- [x] 6.1 Browse tab: open listings from other people, nearest first, with category chips and a Filters sheet for distance. Distances start from the profile ZIP; "Use my location" switches to the phone's location, which never leaves the phone. Verified Ambassadors get "Select several items".
- [x] 6.2 Item screen (`item/[id]`): Request pickup, the adult checkbox for minors, and plain reasons when someone can't request (age, limit). Report and Block.
- [x] 6.3 Pickup screen (`pickup/[id]`): timeline, one main button per step, the address and Open in Maps for the accepted volunteer only, a success buzz on confirm, and a re-check every 20 seconds (there are no push notifications). The Donate tab links each in-progress listing to its pickup and shows a red dot on the tab when something needs the donor.
- [x] 6.4 Report screen (`report`), Block from listings and pickups, and Blocked people (`blocked`) on the Me tab with Unblock.
- [x] 6.5 Pickup safety tips (`safety`): shown before a volunteer's first request, and linked from every pickup and the Me tab.
- The Hours tab now lists the volunteer's pickups (in progress and earlier). Hours and tier totals come in Phase 7.
- [x] 7.1 `src/components/impact-meter.tsx`: a Skia glow behind the lamp that grows wider and brighter with progress toward the goal, plus the total, goal, and a bar. The grow-in animation is skipped when Reduce Motion is on.
- [x] 7.2 Home tab: greeting, an "Up next" card when something needs the person (`src/domain/up-next.ts`), the meter, List an item, Find items to pick up, three nearest items, and Donate money (hidden while the Zeffy link is blank).
- [x] 7.3 Hours tab: confirmed hours, Share my hours summary (plain text through the Share sheet), level and progress to the next (`src/domain/tiers.ts`), pickups in progress, and recent confirmed pickups.
- [x] 8.1 Offline: the data cache is saved on the phone for 7 days and reloaded at startup (`src/lib/query.ts`), so the app opens signed in and shows saved screens with no connection. `src/domain/offline.ts` lists exactly what is saved; **exact addresses, the phone's location, and photo links are never saved**, and everything is erased on sign-out. Every screen shows an offline banner, and a screen with nothing saved says "You're offline" instead of loading forever. Photos are cached by their path, so they aren't downloaded again when a private link rotates.
- [x] 8.2 Accessibility audit: every pressable has a role, a label, and a 44-point target. The contrast tests now cover the pairs added since Phase 1; three failed in the light theme (blue links and grey captions on the light blue and cream cards were 4.3–4.4:1), so `link` and `muted` were darkened slightly. The meter's "Try again" became a proper link.
- [x] 8.3 Polish: timeline steps ease in when a pickup moves on (off with Reduce Motion). Wording pass: no placeholder text, no "tax-deductible", no emoji used as icons, and no colors outside `src/theme.ts` except the lamp artwork. The only TODOs left are the four pending values in `src/config.ts`.
- [x] 9.1 Icon and splash from a redrawn lamp (CoW had no logo larger than 256 px): `assets/brand/icon.png` (1024, no transparency), Android adaptive foreground and monochrome layers, and `splash.png`, all wired into `app.json`. Sources are in `assets/brand/source/`. **CoW still has to approve the artwork.**
- [x] 9.2 `eas.json` with development, preview, and production profiles, each tied to an EAS environment for the Supabase keys. Camera, photo, and location permission wording is in `app.json`. `ITSAppUsesNonExemptEncryption` is set to false (the app only uses standard HTTPS).
- [x] 9.3 Docs: `README.md`, `ADMIN_GUIDE.md`, `LAUNCH_CHECKLIST.md`, `STORE_LISTING.md`, `CREDITS.md`, and `SUPABASE_SETUP.md` Part C. `PRIVACY_POLICY.md` was corrected to match the app (no address lookup; what is kept on the phone; camera and maps) and is now version 2026-10-10. `TERMS.md` is unchanged, so nobody is asked to accept again.
- [x] Migration `20261010000100_admin_cleanup.sql` adds `admin.cleanup_unfinished_signups()` and is applied to dev. Tested in a rolled-back transaction: it removed a 3-day-old empty login, kept a 2-hour-old one, kept every finished account, and refused 0 hours. The app's roles cannot run it.
- [x] 10.1 Six checks from a fresh clone: found and fixed one failure; now pass (commit b7e5501 and later).
- [x] 10.2 Database security tests re-run against dev: 83/83. Advisor checked.
- [x] 10.4 Security, privacy, and brief-compliance review: see "Phase 10 findings" above.
- [x] 10.3 Definition of Done walkthrough with the user (phone check #10): all five checks passed.
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
- **JOIN_URL** is `#ambassador` (confirmed on a phone, Oct 10): the site has no `#join` anchor, and its own "Join" menu link goes to `#ambassador`.
- **How migrations were applied to dev.** The Supabase connector can't read local files, so each file is pushed to GitHub, and the database fetches it from `raw.githubusercontent.com` pinned to a commit SHA. It checks the md5 checksum before running it, so the exact committed file runs. The `http` extension is turned on only for that step and removed afterwards.
  - Dev's migration history is out of order (100, 200, 500, 600, 300, 400, 700, 800), because the first batch was sent at once by mistake.
  - The end result is identical to the file order. For production, apply the files in file-name order (SQL Editor, or `supabase db push`).
- **After every migration:** regenerate the types, re-run the security tests, and check the advisor.
- **Expo location:** on Android, `geocodeAsync` needs location permission. That's why the ZIP-centroid fallback exists.

## Open items found in Phase 3

- **Sign in with Apple token revocation.** Apple says apps "should" revoke Sign in with Apple tokens when an account is deleted. That needs a server-side Apple key and an Edge Function. It isn't built yet. It is listed in LAUNCH_CHECKLIST §8 as a known gap.
- **Security Advisor warning (new in Phase 9):** "Leaked Password Protection Disabled." It appeared once the demo password accounts existed. It's a dashboard setting, not a code issue; SUPABASE_SETUP C3 covers it.
- **Leftover empty logins.** Solved in Phase 9: `admin.cleanup_unfinished_signups()`, documented in ADMIN_GUIDE. The dev project has two such logins from testing; they were left alone.
- **Typed routes.** Route types are generated only by the dev server (`.expo/types`). On a fresh clone, route checking is relaxed until `npx expo start` runs once.

## Waiting on (not blocking yet)

- [ ] **Offline address trade-off (decide before launch):** a volunteer with no signal at the door can't open a pickup's address unless the screen was already open, because addresses are never saved to the phone. Saving them would fix that but leaves a donor's address on a volunteer's phone.
- [ ] High-res logo, 1024×1024+ (needed in Phase 9)
- [ ] Zeffy donation URL (Donate buttons stay hidden until then)
- [ ] `reference/app-plan.html` (optional)
- [ ] Who manages the childrenofwarproject.org domain? Needed for real email sending before launch.
- [ ] Privacy Policy / Terms URLs, once posted on the website
- [ ] Apple Developer + Google Play organization enrollment (long lead time; see PLAN.md §12)

## Phone checks

| # | Phase | Result | Notes |
|---|---|---|---|
| 10 | Final review: Definition of Done | ✅ passed | The app works after the database fix, unknown emails are refused before the age question, no console warnings reported, the TiE link opens, and a real uploaded photo has no hidden location. |
| 9 | Icon, splash, store setup & docs | ✅ passed | Icon judged good enough to take to CoW for approval; the app still runs in Expo Go. The real icon and launch screen need a preview build to check on a phone. |
| 8 | Offline, accessibility & polish | ✅ passed | The user reported all good. |
| 7 | Home, Hours & impact meter | ✅ passed | Line 2 failed at first (the grow-in was invisible); fixed and re-checked by the user. |
| 6 | Browse & pickups: the full two-account loop, report, block | ✅ passed | The user reported that everything works. |
| 5 | Listing: 4-step flow, photo, Donate tab, edit, remove | ✅ 11/11 | All lines passed. "Today" hides windows with under an hour left, so Morning is missing in the afternoon: by design. |
| 4 | Content & About: About screens, photos, Me tab links, live content | ✅ 10/10 | All lines passed. Join the Movement lands on the website's sign-up form. |
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

### Phone check #4 checklist

Shake the phone and tap Reload first. Reply with ✓ or ✗ for each line.

1. **About from Welcome.** Sign out. On Welcome, tap "About CoW" at the bottom: the About page opens without signing in, with the lamp, the headline, and the team photo.
2. **Six sections.** Open each card (Our story, How it works, The team, Partners, Events, Membership levels). Each one opens, scrolls, and Back returns to About.
3. **Photos.** On The team, all nine people (3 leaders, 2 ChangeMakers, 4 board members) show a round photo.
4. **Events.** Both events are under "Past events", and "Coming up" shows the calm "Nothing scheduled right now" message.
5. **Partner link.** On Partners, tap Shradhaa Foundation: their website opens in a sheet inside the app.
6. **Me tab.** Sign in. Me shows your profile, an Ambassador card, a Children of War Project card, and a Legal card. There is no Donate row (the Zeffy link is still blank).
7. **Links.** About CoW opens About. YouTube opens CoW's channel. Contact opens your mail app addressed to CoW.
8. **Join the Movement.** It opens the website. Does it land on the sign-up form? (This answers the open question in `src/config.ts`.)
9. **Request Ambassador.** With the demo volunteer account, tap Request Ambassador: the card changes to "Your request is in."
10. **Dark mode.** Turn on Dark Mode in iPhone Settings and glance through About: all text is readable.

### Phone check #5 checklist

Restart `npx expo start --tunnel` first (new libraries were installed). Reply with ✓ or ✗ for each line. If any screen shows a red error, send a screenshot of it.

1. **Start.** Donate tab shows "My donations", a "List an item" button, and "Nothing listed yet".
2. **Step 1.** Tap List an item, then a category: it moves to step 2.
3. **Camera.** Tap "Take a photo": the phone asks for camera permission with a clear reason, and the photo appears on the screen.
4. **Photo picker.** Tap "Choose from my photos" and pick one: it replaces the photo, with no permission question.
5. **Catches mistakes.** Tap Next with the name blank: a friendly message says what's missing.
6. **Day and time.** The days start at Today and scroll sideways for 3 weeks. Picking Tomorrow shows Morning, Afternoon, and Evening with their hours. (Today only shows the windows that still have an hour left.)
7. **Step 3.** Your ZIP is already filled in. Enter ZIP 10001: Next is refused with a message about New Jersey. Fix it and continue.
8. **Post.** The review screen shows everything. Tap Post: you land on the Donate tab with the item under "Waiting for a volunteer", photo included.
9. **Edit.** Tap Edit, change the value, and go through to Save changes: the card shows the new value.
10. **Remove.** Tap Remove listing, then Remove: the item disappears.
11. **Minor donor.** With the demo donor account (set up as age 15), step 3 shows the parent/guardian checkbox, and Next is refused until it's ticked.

### Phone check #6 checklist

Restart `npx expo start --tunnel` first (a new library was installed). Use the two demo accounts: sign out and back in to switch. Both have ZIP 08831. Reply with ✓ or ✗ for each line. If any screen shows a red error, send a screenshot.

**Setup**
1. As **demo donor**, list an item (any photo, tomorrow, any time). It appears under "Waiting for a volunteer".

**The loop**
2. As **demo volunteer**, open Browse: the item is there with its photo, town, and "under 1 mi". Your own listings never show here.
3. Tap a category chip that doesn't match: the item disappears and "Nothing matches" shows. Tap All to bring it back. The distance button opens a sheet from the bottom.
4. Open the item and tap Request pickup: the safety tips open first. Tap "I understand", then Request pickup again.
5. You land on the pickup screen: step 1 of the timeline is filled, it says you're waiting for the donor, and **no address is shown**.
6. As **demo donor**: the Donate tab has a red dot. The item is under "Needs your answer". Tap "Answer the request", then Accept.
7. As **demo volunteer**, open the Hours tab and tap the pickup: the address now shows, and Open in Maps opens Apple Maps with directions.
8. Tap "I picked it up". The timeline moves to step 3.
9. As **demo donor**: the item is under "Picked up: please confirm". Open it and tap "Confirm it was picked up". All four steps fill in.
10. Both sides now show the pickup as confirmed, and the impact total on the Welcome screen went up by the item's value.

**Other paths**
11. List a second item as demo donor, request it as demo volunteer, then **Decline** it as demo donor: the item goes back to "Waiting for a volunteer".
12. Request it again, then as demo volunteer tap "Cancel this pickup": the item is on Browse again.
13. On the item screen, tap "Report this listing", pick a reason, and send: you see "Thank you".
14. As demo volunteer, tap "Block this donor": the item vanishes from Browse. Then Me → Blocked people → Unblock: it returns.
15. **Minor volunteer:** your own account is 16, so on an item it shows the "An adult will come with me" checkbox and refuses the request until it's ticked.
16. **Use my location:** on Browse tap "Use my location": the phone asks permission with a clear reason, and the label changes to "Near you".

**Optional: Ambassador multi-select.** In the Supabase SQL Editor run `select admin.verify_ambassador('your-email@example.com');` with your own email, reload the app, and Browse shows "Select several items".

### Phone check #7 checklist

Shake the phone and tap Reload first. Reply with ✓ or ✗ for each line.

1. **Home.** It greets you by first name and shows the lamp with a soft yellow glow, the impact total, "of $25,000 · 3-year goal", and a green bar.
2. **Glow grows in.** Tap another tab and come back to Home: the bar fills and the glow opens up over about a second.
3. **Buttons.** "List an item" opens the listing steps. "Find items to pick up" opens Browse.
4. **Near you.** With an item listed by the other demo account, Home shows it under "Near you"; tapping it opens the item. "See all" opens Browse.
5. **Up next (donor).** Request that item as demo volunteer. As demo donor, Home shows an "Up next" card saying someone wants your item; "Answer now" opens the pickup.
6. **Up next (volunteer).** Accept it. As demo volunteer, Home shows "Your pickup is ready" with "See the address".
7. **Hours.** As demo volunteer, the Hours tab shows your confirmed hours (at least 1 hour from phone check #6), your level, and a progress bar toward the next level.
8. **Share.** "Share my hours summary" opens the iPhone share sheet with a plain-text summary.
9. **Totals move.** Finish the pickup from line 6 (picked up, then confirmed). The volunteer's hours go up by 1, and the Home total goes up by the item's value.
10. **Reduce Motion.** Turn on Settings → Accessibility → Motion → Reduce Motion, reopen the app: the glow and bar appear at once, and the flame doesn't flicker.

### Phone check #8 checklist

Shake the phone and tap Reload first, then open Home, Browse, Donate, Hours, and Me once while online (so there is something saved). Reply with ✓ or ✗ for each line.

**Airplane mode**
1. Turn on Airplane Mode (Wi-Fi off too). A cream strip appears at the top: "You're offline. Showing saved information."
2. Home, Browse, Donate, Hours, and Me still show what they showed before. Nothing is blank and nothing crashes.
3. About CoW and all six of its sections open.
4. Open an item from Browse that you had not opened before: it says "You're offline" with the lamp, not an endless loading screen.
5. Try to post a listing or request a pickup: a friendly message says you're offline.
6. Close Expo Go completely, reopen the project still in Airplane Mode: you are still signed in and the saved screens appear. (Expo Go itself may need a connection to load the project; if it can't load at all, mark this line "can't test".)
7. Turn Airplane Mode off: the strip disappears and the screens refresh by themselves.

**VoiceOver** (Settings → Accessibility → VoiceOver; triple-click the side button if you set that shortcut)
8. On Home, swipe right through the screen: every button is read with a clear name, and the meter is read as the total and goal.
9. On Browse, each item card is read as one sentence (name, category, value, town, distance, time).
10. On a pickup, the timeline is read as "Step 2 of 4: Accepted" (or wherever it is), and each button says what it does.

**Text size and dark mode**
11. Settings → Display & Brightness → Text Size all the way up: Home, Browse, and a pickup stay readable, with no text cut off or overlapping.
12. Dark Mode on: Home, Browse, Donate, Hours, Me, and a pickup are all readable.

### Phone check #9

Expo Go can't show the app's own icon or launch screen (it shows Expo's), so this check is on the Mac.

1. **Icon.** Open `assets/brand/icon.png`. Is it good enough to take to CoW for approval?
2. **Splash.** Open `assets/brand/splash.png`: the same lamp, shown on cream (light mode) or navy (dark mode) when the app starts.
3. **Still works.** Reload the app in Expo Go: it opens and behaves as before.

The real icon and launch screen are checked on a phone with the first preview build (LAUNCH_CHECKLIST §6).

### Phone check #10 (Definition of Done, brief §12)

| Brief §12 line | Status |
|---|---|
| All quality gates pass on a clean clone | ✅ Verified from a fresh GitHub clone |
| Runs in Expo Go on iPhone with no warnings in the console | ✅ Reported by the user, Oct 10 |
| Full loop with two real test accounts | ✅ Phone check #6; the app was re-checked after the Phase 10 database change |
| The RLS test plan passes | ✅ 83/83 on Oct 10 |
| Airplane mode: opens, shows saved content, friendly message, no crash | ✅ Phone check #8 |
| Every link works or is hidden; VoiceOver reaches every button | ✅ Links checked automatically, and tie.org by the user; VoiceOver in phone check #8 |
| Every doc in §11 exists in plain English | ✅ |

Shake the phone and tap Reload first. The database changed, so an app that isn't reloaded will show errors.

1. **Still works after the database fix.** Home, Browse, Donate, and Hours all load. Open one item from Browse and one pickup from Hours or Donate. (If any of these shows "We couldn't load this", send a screenshot.)
2. **No account before the age question.** Sign out. Tap "I already have an account" and enter an email that has never been used: you should see "We couldn't find an account with that email…" and no email should arrive. Then sign in with your real email as usual: it still works.
3. **No warnings.** Look at the Terminal running Expo while you use the app for a minute. Report any yellow or red messages.
4. **One link.** About CoW → Partners → The Indus Entrepreneurs (TiE): the site opens.
5. **A real photo has no hidden location.** ✅ Done Oct 10. The user downloaded an uploaded photo (`3d3e8e6e-….jpg`, 1200×1600, 212,585 bytes, the same size the database records). Checked with macOS's own tools and a separate byte-level reader: no GPS data, no camera make or model, no dates, no XMP, and an empty IPTC block. The only hidden information left is rotation, resolution, pixel size, and a color profile.
