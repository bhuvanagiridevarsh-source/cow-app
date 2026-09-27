# CoW App — Build Plan (V1)

> **Status: DRAFT — waiting for your "go."**
> Written Sep 27, 2026. The source of truth is [`docs/BRIEF.md`](BRIEF.md). Day-to-day progress is in [`docs/PROGRESS.md`](PROGRESS.md).

---

## 1. The short version

We build the app in **10 phases**. Every phase ends the same way: all six automatic checks pass (§11), everything is committed to git and pushed to GitHub, and for most phases you do a 5-minute check on your iPhone with Expo Go.

Before writing this plan I checked:

- **Every library in the brief against Expo SDK 57**, the version this project uses, so the plan only relies on things that actually run in Expo Go (§3).
- **Supabase's current docs** for email codes, Sign in with Apple, photo storage, and free-plan limits. They changed several details below.
- **CoW's website stylesheet**, for the exact brand colors and fonts (§8).

**Saying "go" approves this plan and my recommended answer to every decision in §2.** To change one, just say so, for example: *"go, but D2 = birth year only."*

---

## 2. Decisions for you (my recommendation is the default)

**D1. Where the test database lives.**
I create a free Supabase project called `cow-app-dev` in your existing Supabase account, used only for building and testing. The real (production) project gets created later under CoW's email by following `docs/SUPABASE_SETUP.md`, and gets the exact same database setup. Keeping test data away from real users is standard practice. Supabase shows the cost before creating a project (it should be $0), and I'll confirm it with you first.

**D2. Ask birth month + year, not just birth year.**
With only a year, the app can't tell a 15-year-old from a 16-year-old born the same year. To stay safe it would have to treat everyone as the youngest they could be. For example, a student who turned 16 in March 2026 couldn't do pickups until January 2027. An 18-year-old born in 2008 would be treated as a minor all year. Month + year fixes this and is still not a full birthday.
*Alternative:* birth year only, exactly as the brief says, using the "youngest they could be" rule.

**D3. Minors who list items.**
If a 13–17-year-old lists an item, a stranger comes to their home. I recommend they tick *"My parent/guardian approves this donation and an adult will be home for the pickup"* on every listing. This is a `settings` switch the board can turn off.

**D4. Drop three libraries.** The brief says to drop anything that doesn't run in Expo Go.
- `lottie-react-native`: **not included in Expo Go for SDK 57.** Instead I'll animate CoW's own lamp flame, drawn from the logo, with approved tools (react-native-svg + Reanimated). This also avoids any license question.
- `moti`: last updated January 2025 and not confirmed to work with Reanimated 4, which this project uses. Reanimated 4 now has the same kind of animations built in.
- `react-native-maps`: works in Expo Go, but the Android store version needs a Google Cloud account and API key. V1 uses the brief's required **"Open in Maps"** button instead of a map preview. It's easy to add later.

**D5. Extra packages I'm asking to add.** All are free, open-source (MIT), and run in Expo Go.

| Package | Why |
|---|---|
| `@supabase/supabase-js` | Talks to the database. It's the brief's backend; listed for completeness. |
| `@react-native-async-storage/async-storage` | Keeps people signed in and stores offline copies. Recommended by Supabase's own docs and built into Expo Go. |
| `@tanstack/react-query` + `@tanstack/react-query-persist-client` + `@tanstack/query-async-storage-persister` | Handles loading states, automatic retries, and showing saved data when offline on every screen. This is how "never a blank screen" gets done reliably. |
| `jest`, `@types/jest`, `eslint` | Needed to run the brief's `npx jest` and `npx eslint .` checks. |

**D6. A password sign-in for demo and test accounts only.**
App Store reviewers can't receive our emailed codes, and Apple requires a working demo account. Only emails listed in `src/config.ts` see a password box instead of "Send code"; everyone else uses email codes or Apple. This also lets us test the two-person pickup loop without waiting for emails.

**D7. Pickup times as big buttons.**
Donors tap a day (within the next 3 weeks) and a window: **Morning 9 AM–12 PM, Afternoon 12–4 PM, or Evening 4–7 PM.** No fiddly clock pickers, and the evening window ends at 7 PM for safety.

**D8. Safety additions.** Each number is stored in `settings` so the board can change it.
- Item value is capped at **$5,000** per item, so the public impact total stays honest.
- A listing is **hidden automatically once 3 different people report it**, until an admin reviews it.
- A donor can have at most **10 active listings** at once, to stop spam.
- Volunteers read a short **safety checklist before their first pickup**: go with a buddy, stay at the door or garage, tell a parent where you're going, and leave and report if anything feels wrong. It's always reachable from the pickup screen.
- Photos are **re-saved on the phone before upload**, which strips hidden GPS data that could reveal a home address. I'll check this with a real upload.

---

## 3. What runs in Expo Go (SDK 57): checked

| Library | In Expo Go? |
|---|---|
| react-native-svg, react-native-reanimated 4.5, react-native-gesture-handler | ✅ Included |
| @shopify/react-native-skia (the glowing lamp meter) | ✅ Included |
| expo-apple-authentication (iPhone only), expo-image-picker, expo-image-manipulator, expo-location, expo-crypto, expo-network, expo-font | ✅ Included |
| @react-native-async-storage/async-storage | ✅ Included |
| phosphor-react-native, @gorhom/bottom-sheet (officially supports Reanimated 4), @expo-google-fonts, zod, supabase-js, TanStack Query | ✅ Plain JavaScript. It runs because the pieces it needs are included. |
| expo-haptics (the "success buzz") | ⚠️ SDK 57's docs don't list it as included in Expo Go. I'll test it on your phone in Phase 1. It will be set up so it can never crash the app. If it's missing, there's simply no buzz. |
| lottie-react-native | ❌ Not included, so it's dropped (D4) |

**Testing note:** this Mac has no Xcode, so I can't open an iPhone simulator. Phone checks are done by you on your iPhone, and I'll give you a short checklist each time.
*Optional:* if you install **Xcode** (free, Mac App Store, about a 15 GB download), I can test in a simulator myself and catch layout problems before they reach you.

---

## 4. Screens (V1)

**Before signing in**
1. **Welcome.** CoW lamp logo and "Compassion Driven Change". A live impact meter. *"How do you want to help?"* with four big choices:
   - **Donate items**
   - **Volunteer**
   - **Become an Ambassador** (a request CoW approves)
   - **Donate money**: opens Zeffy in the browser, no account needed. Hidden until the Zeffy link is set.

   Also: *"I already have an account"* and *"About CoW"*. Any choice lets you do everything later; it only decides what the app shows you first.
2. **When were you born?** Month + year (D2). Under 13 goes to a friendly stop screen with the website link. The phone remembers this, so going back and changing the year doesn't work.
3. **Sign in.** Enter your email and type the 6-digit code (resend allowed after 60 seconds). **Sign in with Apple** on iPhone. Demo/test accounts see a password box (D6).
4. **About CoW.** Also reachable before signing up (helps App Store reviewers too).

**First-time setup (after sign-in)**

5. **Your details.** First and last name, and ZIP.
6. **Parent/guardian.** Ages 13–17 only: guardian's name and email, plus a consent checkbox.
7. **Terms.** Read the Terms of Use, which include the zero-tolerance line, plus a link to the Privacy Policy. Then tap **I agree**.

**Bottom tabs: Home · Browse · Donate · Hours · Me**

8. **Home.**
   - A greeting and the glowing-lamp impact meter (*$X of $25,000 · 3-year goal*).
   - Two big buttons: **List an item** and **Find items to pick up**.
   - An **"Up next"** card when something needs you, e.g. *"Maya wants to pick up your desk — answer now."*
   - Three nearby items, and a Donate Money button.
9. **Browse.**
   - Each nearby item shows its photo, category, value, condition, town, *"about 3 mi"*, and pickup window.
   - Category chips plus a Filters sheet for distance.
   - "Use my location", which falls back to your ZIP if you'd rather not share it.
   - Verified Ambassadors get a **Select** mode to request several items at once, up to their limit.
10. **Item.**
    - Big photo, details, and **Request pickup**.
    - Minors tick *"An adult will come with me"* when the board's rule is on.
    - If someone can't request, the app tells them why, e.g. *"Pickups start at age 16."*
    - **Report listing** and **Block this donor**.
11. **List an item (4 steps).**
    ① Category
    ② Photo (camera or library), estimated value, condition, and the day and time window
    ③ Address: street, unit, town, and ZIP, with the ZIP checked against the service area. It shows *"Your exact address is only shared with the volunteer you accept."* There's an optional note, e.g. *"It's in the garage."*
    ④ Review, then **Post**
12. **Donate tab (My donations).**
    - A **List an item** button.
    - Your items grouped as: **Needs your answer** (Accept / Decline) · **Scheduled** · **Picked up — please confirm** · **Waiting for a volunteer** · **Done**.
    - Edit or withdraw a waiting listing.
    - A Donate money card.
13. **Pickup.**
    - A status timeline: Requested → Accepted → Picked up → Confirmed.
    - The **one button** for your current step, and the other person's first name.
    - Once accepted: the address, time window, note, and **Open in Maps**.
    - **Report** and **Block**.
14. **Hours.**
    - Your active pickups and your total hours.
    - Your tier and progress to the next tier.
    - Recent confirmed pickups, and **Share my hours summary** (plain text, through the Share sheet).
15. **Me.**
    - Profile: edit name and ZIP.
    - Your role, **Request Ambassador** (shows Pending or Verified), and blocked users.
    - About CoW, Join the Movement, YouTube, Terms, Privacy Policy, and Contact (shows `hello.childrenofwarproject@gmail.com`).
    - Sign out and **Delete account**.
16. **Pickup safety tips.** Shown before your first pickup and linked from every accepted pickup (D8).

**Every screen has** a loading state (the lamp glow), a friendly error with **Try again**, an empty state, and an offline banner that keeps showing saved info.

---

## 5. The pickup loop (enforced by the database)

| Step | Who can do it | What happens |
|---|---|---|
| listed → **requested** | a volunteer | Checks that they're old enough (`min_pickup_age`), that an adult is coming if they're a minor, and that they're under their limit (1 active pickup, or 5 for verified Ambassadors). It also checks it isn't their own item and nobody blocked anybody. Each item can only have one request at a time. |
| requested → **accepted** | the donor | The address becomes visible to **that volunteer only**. |
| requested → listed | donor declines, or volunteer cancels | |
| accepted → listed | donor or volunteer cancels | The address is hidden again. |
| accepted → **collected** | the volunteer | |
| collected → **confirmed** | the donor (or an admin) | The volunteer gets `hours_per_pickup` hours, the item's value is added to the impact total, and both people's tier progress goes up. |
| listed → withdrawn | the donor | |
| anything before confirmed → removed | an admin | Any pickup in progress is cancelled. |

**No other moves are possible.** The database refuses them even if someone edits it directly.

- **Impact total** is `base_impact_amount` ($5,000) plus the value of every confirmed item. It's kept in a separate, anonymous record so the total never drops if someone later deletes their account.
- **Tiers** are based on the confirmed value of items you've collected or donated, using the website's membership levels:

  | Tier | Confirmed value |
  |---|---|
  | Volunteer | $0 |
  | Supporter | $100 |
  | Activist | $250 |
  | Ambassador | $500 |
  | Change Maker | $1,000 |

  The *Ambassador tier* is just a badge. The *verified Ambassador role*, which lets someone claim several items at once, is only granted by a CoW admin.

---

## 6. Database (Supabase)

This section is technical, so you can skim it. Every change is a SQL file in `supabase/migrations/`, applied with the Supabase connector (available in this session). Every table has Row Level Security turned on.

**Tables**

| Table | Main columns | Who can read it |
|---|---|---|
| `profiles` | id, name, role (donor / volunteer / ambassador, as chosen at sign-up), verified_ambassador, ambassador_requested_at, is_admin, birth_year, birth_month (D2), zip, guardian_name, guardian_email, guardian_consent_at, accepted_terms_at, terms_version | You and admins only |
| `items` | id, donor_id, category (furniture / electronics / appliances / other), title (3–60 characters), value (whole dollars), condition (new / good / fair), photo_path, pickup_window_start/end, town, zip, approx_lat/lng (rounded to about 1 km), status, hidden_at, adult_home_confirmed (D3) | Signed-in users see open listings, except ones from people they blocked or who blocked them, hidden ones, and ones whose pickup time has passed. The donor, the involved volunteer, and admins can also see it. |
| `item_addresses` | item_id, street, unit, pickup_note, exact_lat/lng (optional) | The donor, admins, and the volunteer the donor **accepted** (only while that pickup is accepted or picked up) |
| `pickups` | id, item_id, donor_id, volunteer_id, adult_attending, status, requested/accepted/collected/confirmed/closed timestamps, cancelled_by, confirmed_by, hours_awarded, plus a copy of the item's title, category, and value, so volunteers keep their history even if the donor deletes their account | The volunteer, the donor, and admins |
| `impact_ledger` | one row per confirmed item: amount and date. **No names.** | Nobody directly; read through `impact_total()` |
| `reports` | reporter, item and/or person, reason (fake listing / inappropriate / unsafe / no-show / harassment / other), details, status, admin notes | The person who reported it, and admins |
| `blocks` | blocker, blocked | Your own blocks |
| `settings` | one row: all the board's switches (below) | Everyone. Only changed in the Supabase dashboard. |
| `zip_centroids` | ZIP → approximate map point, from the US Census (public domain), for NJ, NY, PA, and DE | Everyone |

**Settings defaults**

| Setting | Default |
|---|---|
| goal amount | $25,000 |
| goal label | "3-year goal" |
| base impact amount | $5,000 |
| minimum pickup age | 16 |
| minors need an adult on pickups | on |
| hours per pickup | 1 |
| max active pickups (volunteer) | 1 |
| max active pickups (Ambassador) | 5 |
| allowed ZIP prefixes | 070–089 (all of NJ) |
| minor donors need an adult home (D3) | on |
| max item value (D8) | $5,000 |
| max active listings per donor (D8) | 10 |
| reports before a listing is auto-hidden (D8) | 3 |

**Functions the app calls.** Each one checks who's calling before doing anything.

- `impact_total()`, `user_hours(user_id)`, and `my_stats()` (hours, pickups, and the value used for your tier)
- `complete_profile()` and `update_profile()`. These enforce the age gate, guardian info, and Terms.
- `request_ambassador()`
- `create_item()`, `update_item()`, and `withdraw_item()`. These check the ZIP area, time window, value cap, listing limit, and that the photo belongs to you.
- `request_pickups(item_ids, adult_attending)`, which handles one item or several for Ambassadors
- `respond_to_request()`, `mark_collected()`, `confirm_pickup()`, and `cancel_pickup()`
- `block_user()`, `unblock_user()`, and `my_blocked_users()`
- `report()`, which also applies the auto-hide rule
- `pickup_counterpart()`, which returns only a first name + last initial, verified badge, and completed-pickup count
- `delete_my_account()`

**Admin work in V1** happens in the Supabase dashboard using copy-paste commands from `docs/ADMIN_GUIDE.md`: verify Ambassadors, handle reports, remove listings, confirm stuck pickups, and edit settings. These commands live in a private `admin` part of the database that the app can't reach.

**Photos** go in a private storage bucket called `item-photos`: JPEG only, 5 MB max. You can only upload to your own folder. Only signed-in users who are allowed to see the listing get a link to the photo, and that link expires after 30 minutes.

---

## 7. Privacy & safety: how each rule is enforced

- **Exact address.** Stored in its own table that the database only lets the donor, admins, and the accepted volunteer read. Everyone else sees the town and an approximate distance, based on a location rounded to about 1 km.
- **Your location never leaves your phone.** Browse downloads each item's approximate location and works out distances on the phone. This also keeps App Store privacy labels simple.
- **The age question comes before the email question.** This is required for under-13s. If someone under 13 gets past it anyway, the server refuses and the new login is deleted immediately.
- **Birth month and year can't be changed after sign-up**, so nobody can edit their way past the age rules. CoW can fix genuine mistakes.
- **Other users only ever see your first name and last initial.** Never your email, ZIP, age, or guardian info.
- **Photos** are private, the links expire, and location data is stripped (D8).
- **Block** hides both people's listings from each other and cancels any pickup in progress between them.
- **Report** is on every listing, pickup, and person. After 3 reports, a listing is hidden automatically (D8).
- **Delete account** (Me → Delete account) first removes your photos (Supabase requires this to go through its storage system), then a database function deletes only your own records and your login. The anonymous dollar amounts stay in the impact total. Volunteers keep the hours they earned from your items, but your name is removed.
- **No ads, no analytics, no tracking, and no crash-reporting tools.** Donations only open Zeffy in the phone's browser. The phrase "tax-deductible" never appears.

---

## 8. Design

**Colors.** These are exact values from the website's stylesheet (`reference/website-home.html`). The brief's approximate colors are close, but the brief says exact reference values win. Two are adjusted only where the site's version fails the readability standard (WCAG AA).

| Token | Hex | Where it comes from | Used for |
|---|---|---|---|
| navy | `#0B3C5D` | `--blue-ink` | Headings, dark areas |
| ink | `#173A4E` | `--ink` | Body text |
| muted | `#5B7488` | `--muted` | Secondary text (4.9:1 contrast on white ✓) |
| blue | `#0288D1` | `--blue-deep` | Brand blue for fills and large text |
| blueText | `#0277BD` | adjusted | Small blue text and links. The site's `#0288D1` is only 3.9:1 on white, which fails AA. |
| sky | `#29B6F6` | `--blue` | Glows and illustrations only, never text |
| skySoft | `#E1F5FE` / `#F2FBFF` | `--blue-soft` / `--blue-softer` | Background tints |
| yellow | `#FFCA28` + text `#5A3D00` | `--yellow`, site button text | Main action buttons |
| cream | `#FFF6DC` | `--yellow-soft` | Warm backgrounds and cards |
| green | `#7CB342` + **navy** text | site's green button | Success and "Join". The site's white text on green is only 2.5:1, which fails; navy text is 4.6:1 ✓ |
| highlight | `#FFF176` on `#0288D1` | the site's highlighted "Compassion" word | Highlighted-word headlines |

Dark mode uses navy backgrounds with cream and white text and the same accents. Every text/background pair is checked for AA.

**Fonts.** **Baloo 2** for headings and **Nunito** for body text, the same as the website, loaded from `@expo-google-fonts`. Text grows with the phone's text-size setting.

**Look.**
- Soft rounded cards (22-point corners) and pill-shaped buttons.
- Small uppercase labels like the site's "OUR STORY", and the site's highlighted-word headlines.
- The **lamp glow** for loading and empty states.
- The impact meter as a **lamp that brightens** as the total grows (Skia).
- Phosphor duotone icons in CoW colors, and a custom CoW tab bar.
- No emoji as icons, no gradient blobs, and **no war imagery, ever.**

**Motion.** Small and purposeful: the meter filling, cards appearing, timeline steps changing, and a success buzz on confirm. All of it turns off when the phone's Reduce Motion setting is on.

**Accessibility.**
- Touch targets at least 44 points.
- A VoiceOver label on every button.
- Text that grows with the phone's text-size setting (Dynamic Type).
- AA contrast everywhere.

---

## 9. Code structure

This is technical, so you can skim it.

```
cow-app/
├── app.json                  app name, IDs (org.childrenofwarproject.app), permissions
├── eas.json                  store build profiles (Phase 9)
├── .env.example              copy to .env; holds the Supabase URL + publishable key (never committed)
├── content/content.json      About-screen content, editable on GitHub
├── docs/                     brief, plan, progress, and every guide in the brief's §11
├── reference/                website snapshot
├── assets/brand/             logo; assets/content/ has team/board photos from CoW's website
├── supabase/
│   ├── migrations/           numbered SQL files (tables, security rules, functions, storage)
│   └── tests/                database security tests, run against the dev project
└── src/
    ├── app/                  screens (Expo Router)
    │   ├── _layout.tsx         fonts, providers, sign-in gate (Stack.Protected)
    │   ├── welcome.tsx, birthday.tsx, too-young.tsx, sign-in.tsx, verify.tsx
    │   ├── onboarding/         details, guardian, terms
    │   ├── (tabs)/             index (Home), browse, donate, hours, me + custom tab bar
    │   ├── list-item/          the 4 steps
    │   ├── item/[id].tsx, pickup/[id].tsx, safety.tsx
    │   ├── about/              story, how it works, team, board, partners, events
    │   └── me/                 profile, blocked users, legal pages, delete account
    ├── components/           shared building blocks (Button, Card, Screen, Field, LampLoader, ErrorRetry…)
    ├── features/             auth, items, pickups, profile, content, settings, impact, reports
    ├── domain/               pure logic with unit tests: age, zip, status, tiers, hours, distance, pickup windows
    ├── lib/                  supabase client, query cache, network status, photos, location, links, haptics
    ├── legal/                Terms + Privacy text shown in-app (synced from docs/*.md; a test keeps them identical)
    ├── theme.ts              all colors, fonts, spacing (light + dark)
    └── config.ts             every URL and ID from the brief's §10, each with a comment
```

The iPad layout is turned off (`supportsTablet: false`). The app still runs on iPads, and App Review won't demand iPad screenshots. The starter's web files and unused packages get removed, because the app targets iOS and Android only.

---

## 10. Build phases

After **every step** I commit to git and update `docs/PROGRESS.md`. At the **end of every phase** I run all six checks and push to GitHub. **Every phase starts with its effort line, and I wait for your "ready."**

| # | Phase | Effort | Your phone check at the end |
|---|---|---|---|
| 1 | Foundation | Normal | ✅ Library test screen |
| 2 | Database & security | **MAX** | — (automated database tests instead) |
| 3 | Accounts & sign-in | **MAX** | ✅ Sign up, Apple, age gate, delete account |
| 4 | CoW content & About | Normal | ✅ About screens, remote content |
| 5 | Listing items | Normal | ✅ List an item with a photo |
| 6 | Browse & pickups | Normal | ✅ **Full two-account pickup loop** |
| 7 | Home, Hours & impact meter | Normal | ✅ |
| 8 | Offline, accessibility & polish | Normal | ✅ Airplane mode + VoiceOver |
| 9 | Icon, splash, store setup & docs | Normal | ✅ Icon and splash |
| 10 | Final pre-submission review | **MAX** | ✅ Definition of Done (brief §12) |

**Phase 1 — Foundation**
1. Remove the starter's demo screens, web files, and unused packages. Set the app identity (name, IDs, portrait orientation, iPhone-first). Add `.env.example`.
2. Tooling: ESLint, Jest, and `npm run check`, which runs all six checks.
3. Install the approved libraries with `npx expo install`.
4. Theme tokens, fonts, the base building blocks, and the custom tab bar.
5. `src/config.ts`, and links that hide themselves when blank (with tests).
6. A temporary test screen for Skia, the bottom sheet, icons, haptics, and animations → **phone check #1** → remove it.

*Your part:* create a free Expo account if you don't have one, sign in to Expo Go on your iPhone, and type `! npx expo login` here. Keep your iPhone on the same Wi-Fi as this Mac.

**Phase 2 — Database & security (MAX)**
1. Write `docs/SAFETY_POLICY_DRAFT.md` first, so the board can start reviewing it while I build.
2. Create `cow-app-dev` after you confirm the $0 cost. The keys go only in `.env`.
3. Migrations:
   - tables and settings defaults
   - ZIP data
   - security rules for every table
   - all functions, plus the guard that blocks invalid status moves
   - the admin commands
   - the photo bucket and its rules
4. Generate TypeScript types from the database.
5. Write `docs/RLS_TEST_PLAN.md` and `supabase/tests/`, run them against the dev project, fix until everything passes, and get zero warnings from Supabase's security advisor.

**Phase 3 — Accounts & sign-in (MAX)**
1. Supabase client, saved sessions, and a friendly "not set up yet" screen if keys are missing.
2. Welcome → birthday gate → too-young screen.
3. Email code sign-in, the demo/test password box (D6), and **Sign in with Apple** (iPhone), which saves your name from Apple's first response.
4. Your details → guardian (13–17) → Terms. Draft `docs/TERMS.md` and `docs/PRIVACY_POLICY.md` and show them in-app.
5. The sign-in gate, profile edit, sign out, and **Delete account**.
6. First version of `docs/SUPABASE_SETUP.md`, with the dashboard clicks for you:
   - put the 6-digit code into the sign-in email
   - add `host.exp.Exponent` to Apple's Client IDs, so Apple sign-in works in Expo Go
   - make the demo/test accounts

→ **Phone check #3**

**Phase 4 — CoW content & About**
1. Write `content/content.json` (from brief §4 + the website), the zod schema, and the bundled copy. Then remote fetch, where a bad or missing remote copy keeps the last good one. With tests.
2. About screens: story, founder quote, how it works, team, ChangeMakers, board, partners, events, quotes, and membership levels. Uses CoW's own photos from the website.
3. The Me tab and all its links.
4. Write `docs/UPDATING_CONTENT.md`, push, and confirm the live GitHub copy loads in the app.

**Phase 5 — Listing items**
1. The 4-step listing flow: ZIP check, day and window buttons (D7), and the minor-donor checkbox (D3).
2. Photo pipeline: ask for permission with a clear reason, shrink the photo, confirm GPS data is gone, upload with retry.
3. Donate tab: my donations, edit and withdraw, and Donate money.

**Phase 6 — Browse & pickups**
1. Browse: photos, distance, category chips, the filters sheet, and empty and offline states.
2. Item screen and requests: the adult checkbox, limits, clear reasons, and Ambassador multi-select.
3. Pickup screen: the timeline, accept and decline, Open in Maps, picked up, confirm (with the buzz), and cancel.
4. Report sheet, block and unblock, and the blocked users list.
5. Pickup safety tips (D8).

→ **Phone check #6:** the full loop with two accounts. One phone is fine: sign out and back in between them.

**Phase 7 — Home, Hours & impact meter**
1. The Skia lamp-glow meter, with Reduce Motion respected.
2. Home: meter, actions, "Up next", nearby items, and Donate.
3. Hours: pickups, hours, tier progress, recent history, and Share summary. Includes tier and hours tests.

**Phase 8 — Offline, accessibility & polish**
1. Offline saved data, the offline banner, and an airplane-mode test of every screen.
2. VoiceOver labels, 44-point targets, the largest text sizes, and contrast.
3. Motion polish, dark mode, and a wording pass: no placeholders, and no "tax-deductible".

**Phase 9 — Icon, splash, store setup & docs**
1. App icon and splash at every required size. **This needs the high-res logo.** If CoW can't find one, I'll draw a clean vector version of the lamp for them to approve.
2. `eas.json` (development, preview, production) and permission wording that App Review accepts.
3. The remaining docs:
   - `README.md` and final versions of `SUPABASE_SETUP.md`, `TERMS.md`, and `PRIVACY_POLICY.md`
   - `ADMIN_GUIDE.md`, `LAUNCH_CHECKLIST.md`, and `STORE_LISTING.md`
   - `CREDITS.md`

**Phase 10 — Final pre-submission review (MAX)**
1. All six checks from a fresh copy of the code.
2. Re-run the database security tests and the security advisor.
3. Walk through the brief's §12 Definition of Done with you, and fix anything that's wrong.
4. A full security, privacy, and brief-compliance review.

---

## 11. How we test

- **Six automatic checks**, run together as `npm run check`:
  1. `npx tsc --noEmit`
  2. `npx eslint .`
  3. `npx jest`
  4. `npx expo-doctor`
  5. `npx expo export` for iOS
  6. `npx expo export` for Android

  A phase can't end with a failing check.
- **Unit tests** (the brief's list plus a few more):
  - status transitions
  - ZIP and service-area checks
  - age gate
  - tier math
  - hours totals
  - content-schema validation and fallback
  - distance
  - pickup windows
  - links hiding themselves when blank
  - Terms and Privacy text staying in sync
- **Database security tests** in `supabase/tests/`. They create two fake users and prove that a stranger **cannot**:
  - read an exact address
  - change someone else's item
  - give themselves hours
  - skip a pickup step
  - approve themselves as an Ambassador
  - change settings
  - see anyone's private profile

  They also prove the age, limit, and block rules. Each test runs inside a transaction that gets undone, so the dev database stays clean.
- **Phone checks.** A short checklist per phase, stored in `PROGRESS.md`. You reply with ✓ or ✗.
- **Android.** Every phase builds for Android (check 6), but I can't run Android here. Before the Android launch, someone with an Android phone runs the same checklists in Expo Go.

---

## 12. Start these now (they take a while), and things that block launch

1. **Apple Developer Program, organization account.** An adult with authority to sign for CoW enrolls using CoW's D-U-N-S number. Apple's verification can take days to weeks. It costs $99/year. Apple offers fee waivers to some nonprofits, but that will likely need the 501(c)(3) approval first.
2. **Google Play Console, organization account.** $25 one-time, using the D-U-N-S number.
3. **Real email sending for sign-in codes.** This blocks launch. Supabase's built-in email only reaches members of your Supabase team, a few per hour. Before real users, CoW needs an email service connected to Supabase; Resend and Brevo both have free tiers. Ideally it sends from an `@childrenofwarproject.org` address, which needs access to the website's domain settings (DNS). **Who manages CoW's domain?**
4. **High-resolution logo**, 1024×1024 or larger. Needed in Phase 9.
5. **Zeffy donation link.** Donate buttons stay hidden until it's set.
6. **Board review.**
   - `SAFETY_POLICY_DRAFT.md`, ready in Phase 2.
   - The Terms and Privacy drafts, ready in Phase 3. Two board members, Lata Setty and Prema Roddam, are attorneys and would be ideal reviewers.
7. **Privacy Policy and Terms posted on the website.** Their URLs go in `src/config.ts`.
8. **Supabase production project** under CoW's email. It can be set up any time after Phase 2.
9. **Free Supabase projects pause after 7 quiet days.**
   - The dev project may pause between our sessions. Restoring it is one click, and I'll tell you when.
   - For the live app, CoW should upgrade to Supabase Pro ($25/month, which never pauses) or keep the app regularly used.
10. **Google Play's donation rules.** Google Play limits donation buttons for organizations that aren't registered charities yet. `LAUNCH_CHECKLIST.md` will cover this. If needed, the Donate button can be hidden on Android until the 501(c)(3) is approved.

---

## 13. Not in V1

- **Not in V1, from the brief:** in-app messaging, push notifications, map and route view, hours certificates (PDF), donor acknowledgments, and in-app admin screens.
- **V3, from the brief:** admin dashboard, leaderboards, value estimator, Spanish, and optional in-app payments.
- **Also deferred:** the map preview for a single item, and Lottie (D4).

The code is organized by feature (`src/features/*`) with the rules in `src/domain/*`, so these can be added later without rewrites.

**One side effect of no push notifications:** donors see new requests when they open the app. The Donate tab shows a badge, and Home shows "Up next."
