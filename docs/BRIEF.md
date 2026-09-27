# Children of War Project: Mobile App Build Brief (v2)

You are building the official iOS + Android app for Children of War Project (CoW), a student-led nonprofit from Monroe Township, NJ. The app's core job: **people donate furniture and electronics they no longer need, volunteers and ambassadors pick the items up and earn volunteer hours, and every item's value counts toward CoW's $25,000 3-year impact goal.**

Read this whole file before writing any code. It is the source of truth. Re-read it at the start of every session. The original plan this brief is based on is saved as `/reference/app-plan.html`.

The person directing you is not a professional developer. Everything you build must run without him debugging anything. Every manual step he has to take must be written down for him in plain English.

**Platform priority: iOS first.** Test and polish on iPhone before anything else, and ship to the App Store first. Android builds from the same code and ships after, but it must still pass every check.

---

## 1. How you work (mandatory)

1. **Plan first.** Before coding, write `docs/PLAN.md` with the screen list, database schema, file structure, and build phases. Show it to me and wait for a "go."
2. **Build in phases.** Commit to git after each phase with a clear message. Never end a phase with failing checks.
3. **Quality gate after every phase.** All of these must pass: `npx tsc --noEmit`, `npx eslint .`, `npx jest`, `npx expo-doctor`, and `npx expo export` for both platforms. If anything fails, fix it before moving on. Do not tell me it works unless the checks passed.
4. **Expo Go compatible only.** Use only libraries that run in Expo Go, so the app can be tested on a real phone by scanning a QR code. No custom native modules. No bare workflow. Ask me before adding any dependency that isn't in the Expo SDK or the approved lists in this brief.
5. **Current versions.** Use the latest stable Expo SDK via `npx create-expo-app@latest` with TypeScript (strict mode) and Expo Router. Install packages with `npx expo install` so the versions match.
6. **Backend is Supabase.** Every database change is a SQL migration file in `supabase/migrations/`, committed to git. If the Supabase MCP connector is available, use it to apply migrations and inspect the database; otherwise give me exact copy-paste steps for the Supabase dashboard. Never put the service-role key anywhere in the app or repo. The app uses only the project URL and the public anon key.
7. **Security lives in the database.** Every table has Row Level Security enabled. Never rely on hiding a button to protect data.
8. **No placeholders in shipped UI.** No lorem ipsum, TODOs, fake names, or broken links. Any value I haven't provided goes in `src/config.ts` or the `settings` table (see §10), with a clear comment.
9. **Tell me the effort level before each phase.** Start every phase with one line: `⚙️ Set effort to MAX for this phase` or `⚙️ Normal effort is fine for this phase`, then wait for me to say "ready." Use MAX for: writing `docs/PLAN.md`, the database/RLS/security phase, the account and sign-in phase, and the final pre-submission review. Use normal for screens, styling, docs, and small fixes.
10. **Work so a usage reset never loses progress.** Break each phase into small steps. After each step, commit to git and update `docs/PROGRESS.md` with what's done, what's next, and any open problems. If I start a new session, first read this brief, `docs/PLAN.md`, `docs/PROGRESS.md`, and `git status`, then continue from exactly where the last step ended.
11. **Never suggest buying or using extra credits.** Work within my plan's normal usage.

---

## 2. Hard rules

- **No ads. No ad SDKs. No third-party analytics or tracking.** The users include minors.
- **Collect the minimum.** Name, email, role, birth year, town/ZIP, and what's needed for pickups. Nothing else.
- **Money donations open the Zeffy page in the device's external browser** (`Linking.openURL`). No in-app payments. CoW's 501(c)(3) status is **pending**: never use the phrase "tax-deductible" anywhere.
- **No in-app chat in V1.** Pickup coordination happens through the structured pickup flow (§5).
- Handle offline and slow connections gracefully. The app must never show a blank screen or crash. Every network action shows a loading state and a friendly retry on failure.

---

## 3. Safety, trust, and App Store rules (non-negotiable)

These protect students going to strangers' homes and are required for App Store approval.

- **Age gate at sign-up.** Ask birth year. Under 13: cannot create an account; show a friendly message pointing to the website. Ages 13–17: must enter a parent/guardian name and email and check a consent box before finishing sign-up.
- **Pickup policy is configurable, not hard-coded.** `settings` table values (set by CoW's board): `min_pickup_age`, `minors_require_adult_on_pickup` (true/false), `hours_per_pickup`, `max_active_claims_volunteer`, `max_active_claims_ambassador`. When `minors_require_adult_on_pickup` is true, a minor must confirm "An adult will come with me" on every pickup request. **Starting defaults until the board decides:** `min_pickup_age` 16, `minors_require_adult_on_pickup` true, `hours_per_pickup` 1 (confirmed by CoW), `max_active_claims_volunteer` 1, `max_active_claims_ambassador` 5, goal label "3-year goal" (confirmed by CoW).
- **Exact addresses are private.** Store the street address in a separate table readable only by the donor, admins, and the one volunteer whose pickup the donor has **accepted**. Everyone else sees town and approximate distance only. Enforce this with RLS.
- **Service area:** New Jersey and nearby. Validate by ZIP code against an allowed list of 3-digit ZIP prefixes stored in `settings` (default: all NJ prefixes, 070–089). Out-of-area listings are politely blocked with an explanation.
- **Report and block.** Every listing and user profile has "Report." Reports go to a `reports` table. Users can block another user, which hides that user's listings and stops pickups between them.
- **Terms at sign-up.** Users must accept Terms of Use (including a zero-tolerance line on abusive or fake listings) before using the app. Draft it in `docs/TERMS.md`.
- **Account deletion inside the app** (Profile → Delete account), which deletes the user's data. Implement it with a `security definer` Postgres function that deletes only `auth.uid()`'s own records.
- **Ambassadors are verified by CoW.** A user can request Ambassador; an admin approves it. Unverified users are Volunteers.
- **Hours are two-sided.** Hours and item value only count after the volunteer marks the item collected **and** the donor confirms it (or an admin confirms it). No self-reported hours.

---
## 4. Organization facts (use exactly; do not invent facts)

**Name:** Children of War Project (CoW) · childrenofwarproject.org
**Tagline:** "Small change for big change." Headline: "Compassion Driven Change."
**What they do:** Students turn things people don't need into cash for children affected by war, homelessness, and poverty: spare coins, garage and online sales of lightly used items (toys, electronics, books), resold books, illustrated digital storybooks, and technical services (websites, voice assistants, AI agents). 100% of net proceeds go to vetted child-welfare organizations selected by the Board of Trustees & Advisors. Donors receive an annual report. 100% volunteer-run by high-school students; no overhead.

**Origin story:** In 2022, when the bombs started falling in Ukraine, founder Yuvraaj Kumar (then 12) collected a decade of loose change from his garage, converted it, got his parents to match it, and sent it to help children in Ukraine. He and his friend Guntas did this for two years in their schools and neighborhoods. The idea won the **Best Social Enterprise Award at the 2024 TiE New Jersey annual gala** and became CoW.

**Founder quote (Yuvi):** In summer 2018, in Kochi, India, the power went off during heavy rain as floodwaters rose. His grandmother told him that instead of cursing the darkness, light a lamp. "We are the lamp!" (The logo is a lamp/diya. This is the brand's core symbol.)

**Team:** Yuvraaj Kumar (Yuvi), Founder & President (Strategy, Partnerships & Design) · Dhanvin Challa, Co-Founder & VP, Marketing · Guntas Dhanjal, Co-Founder & VP, Finance
**ChangeMakers:** Aditi Menon (ChangeMaker & Technology Lead) · Samyuktha Nair (ChangeMaker, Social Media Lead)
**Board of Trustees & Advisors:** Wesley Mathews (VP State Government Affairs, PSEG; former President & CEO, Choose New Jersey; former U.S. Foreign Service diplomat; Chair, NJ–India Commission) · Lata Setty (attorney turned serial founder; inaugural investor at How Women Invest Funds I–III; TiE NJ board) · Prema Roddam (attorney, global mobility & corporate immigration; NJBIZ Leader in Law) · Dr. Thomas Abraham (Founder, President & Chairman, GOPIO; President, Innovative Research and Products, Inc.)

**Featured partner:** Voices of Children (Ukraine), a charitable foundation providing psychological support and care to tens of thousands of war-affected children.
**Partners & supporters:** Shradhaa Foundation, Voices of Children, Save Kids Trust, American Red Cross, World Central Kitchen, UNICEF, The Indus Entrepreneurs (TiE), Enspire Academy, Cedar Hill Preparatory School (NJ), Monroe Indians for Civic Action (NJ).

**Impact:** $5,000 impact to date (the starting base amount; see §7) · goal $25,000. It is a 3-year goal (confirmed by CoW; the app plan's "two-year" wording is outdated). Store the goal label in the `settings` table. Total Economic Impact = cash raised + in-kind donations + estimated value of goods/services provided (websites, storybooks, volunteer time).

**Membership levels:**
1. Volunteer: no contribution needed. Free CoW coin jar, starter kit (flyers, tips, community), volunteer/service hours.
2. Supporter: volunteer, donate, or raise $100. Adds a digital certificate of appreciation.
3. Activist: $250. Adds leading your own mini-campaign with CoW support and a spot on the Change Maker Wall.
4. Ambassador: $500. Adds a leadership role, a service-hours letter, and a spotlight feature.
5. Change Maker: $1,000. Adds mentoring sessions with the founders, a personalized college recommendation letter, and a free copy of *The Founders Compass*.

**Events (remote-editable):** "Why Invest in Women" Summit, "The Peace Blueprint: Youth Perspectives," Oct 3–4, 2026, 10:00 AM–12:30 PM ET, online (Eventbrite). Yuvraaj Kumar is a guest speaker on Oct 4. Past: CoW's first garage sale, Aug 16, 2026, Monroe Twp, NJ.

**Quotes:** Kailash Satyarthi (Nobel Peace Laureate): "Every single minute matters. Every single child matters. Every single childhood matters." Olena Rozvadovska (Co-founder, Voices of Children): "Where there is war, there we are too — so that children can have a childhood despite everything."

Screenshots of the full website are in `/reference`. Use them for content and visual style.

**Money donations:** CoW takes cash donations through its Zeffy page (URL pending in config).

---

## 5. Roles and the core loop

**Roles:** Donor (anyone with items to give), Volunteer (picks up items, earns hours), Ambassador (verified volunteer who can claim several items at once and moves up the Change-Maker tiers), and Admin (CoW leadership, set manually in the database). One account can be both a Donor and a Volunteer.

**Pickup statuses (enforce valid transitions in the database, not just the UI):**
`listed` → `requested` (a volunteer asks to pick it up) → `accepted` (the donor accepts; address is revealed to that volunteer) → `collected` (volunteer marks it picked up) → `confirmed` (donor or admin confirms; hours are awarded and the value is added to the impact total).
Also: donor can decline a request (back to `listed`), either side can cancel before `collected`, and admins can remove any listing.

**Impact total** = `base_impact_amount` in `settings` ($5,000 to start) + the sum of values of all `confirmed` items. Shown app-wide.

**Tiers** use the existing membership levels: Supporter $100, Activist $250, Ambassador $500, Change Maker $1,000, measured by the total confirmed value of items a user has collected or donated.

---

## 6. Screens (V1)

Bottom tabs: **Home · Browse · Donate · Hours · Me.** Big buttons, one decision per screen, plain words.

1. **Welcome / sign-up.** "How do you want to help?" with four choices: donate items, volunteer, ambassador (request), donate money (opens Zeffy, no account needed). Sign-in with **email one-time code** (6-digit code, no magic-link redirect) and **Sign in with Apple** on iOS. Then name, birth year, ZIP, guardian info if 13–17, and Terms.
2. **Home.** Greeting, the live impact meter toward $25,000, two big actions (List an item / Find items to pick up), a few nearby items, and a Donate Money button.
3. **List an item (4 short steps).** Category (Furniture, Electronics, Appliances, Other) → required photo (camera or library, compressed before upload) + estimated value + condition (New / Good / Fair) + pickup date and time window → address with ZIP check and a note that the exact address stays private → review and post.
4. **Browse.** Nearby items with photo, category, value, condition, town, approximate distance, and pickup window. Category filter. Distance uses the phone's location if allowed, otherwise the user's ZIP. Ambassadors can select several items and request them together, up to their limit.
5. **Pickup detail.** Status timeline, the current step's single action button, and the address plus pickup window once accepted. "Open in Maps" for directions.
6. **My donations** (for donors). Each item's status, with Accept/Decline for requests and Confirm collected.
7. **Hours.** Total hours, current tier and progress to the next, recent confirmed pickups, and a "Share my hours summary" button (plain-text summary through the Share sheet).
8. **Me.** Profile, role and "Request Ambassador," blocked users, About CoW (story, how it works, team, board, partners, events, from `content.json`), Join the Movement (website form), Terms, Privacy Policy, Contact, and Delete account.

---

## 7. Data model (Supabase)

Tables (all with RLS): `profiles` (id, name, role, verified_ambassador, is_admin, birth_year, zip, guardian_name, guardian_email, accepted_terms_at) · `items` (id, donor_id, category, title, value, condition, photo_path, pickup_window_start/end, town, zip, approx_lat, approx_lng rounded to ~1 km, status) · `item_addresses` (item_id, street, exact_lat, exact_lng) · `pickups` (id, item_id, volunteer_id, adult_attending, status, requested_at, accepted_at, collected_at, confirmed_at, hours_awarded) · `reports` · `blocks` · `settings` (single row: goal amount, goal label, base_impact_amount, pickup policy values, allowed ZIP prefixes).

Views/functions: `impact_total()`, `user_hours(user_id)`, status-transition functions that check the caller's role before changing status, and `delete_my_account()`.

Photos go in a **private** Storage bucket, shown with short-lived signed URLs to signed-in users only.

---

## 8. Design direction

This must look like CoW's own brand, not a generic template.
- **Palette:** Match the site. Deep navy text (~#1E3A5F), CoW blue (~#3A86C8), warm yellow (~#F7C948), leaf green (~#8AB453), cream backgrounds (~#FDF6DC). Sample exact values from `/reference`. Put all colors in `src/theme.ts` as tokens and support dark mode.
- **Type:** A rounded display face for headings, matching the site (Baloo 2 via `@expo-google-fonts`), and Nunito for body text.
- **Signature motifs:** The lamp/diya glow as the loading and empty-state motif. The impact meter as a glowing lamp that brightens as the total grows. Soft rounded cards. Warm rather than tragic tone. **No graphic war imagery, ever.**
- **Motion:** Small and purposeful (meter fill, status-step changes, a success haptic via `expo-haptics` when a pickup is confirmed). Respect the reduce-motion setting.
- **Accessibility:** Minimum 44pt touch targets, Dynamic Type support, screen-reader labels on every interactive element, WCAG AA contrast.
- **Avoid:** Default Expo/React Native look, gradient-blob hero sections, emoji used as icons (use `@expo/vector-icons` or custom SVG), and stock-template layouts.

**Approved open-source design stack** (pre-approved under §1 rule 4; install with `npx expo install`, confirm each runs in Expo Go, and drop any that doesn't rather than working around it):
- `phosphor-react-native` + `react-native-svg`: the icon set. Use its "duotone" weight tinted with CoW colors instead of default Ionicons.
- `react-native-reanimated` + `moti`: all motion (meter fill, card entrances, status timeline).
- `@shopify/react-native-skia`: the signature lamp-glow impact meter.
- `lottie-react-native`: one hand-picked lamp/diya flame animation for loading and empty states. Only use animations whose license allows free commercial use, and record the source and license in `docs/CREDITS.md`.
- `@gorhom/bottom-sheet` + `react-native-gesture-handler`: filters, pickup actions, and the report sheet.
- Only MIT/Apache/BSD-licensed code. Do not copy layouts, artwork, or assets from other apps; use these libraries as tools, and CoW's own photos, logo, and flyers as the visual content.
- `react-native-maps` is allowed for a single-item location preview only (full map view is V2).

---

## 9. Organization content (updates without a new release)

About-screen content (team, board, partners, events, story, how it works) lives in `content/content.json`, validated by a **zod** schema. The app shows the bundled copy instantly, then fetches `CONTENT_URL`. If the remote copy is valid it is cached and used; if it is invalid or the device is offline, the last good copy stays. The app must never crash on bad content. Impact numbers and policies come from the database `settings` table, not this file.

Write `docs/UPDATING_CONTENT.md`: a plain-English guide for editing `content.json` on the GitHub website and for changing `settings` values in the Supabase dashboard.

---

## 10. Config (`src/config.ts`)

Each value gets a comment explaining what it is. The app must still run if any URL is blank: hide that button rather than breaking.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`: read from `EXPO_PUBLIC_` environment variables in `.env` (git-ignored), with a `.env.example` committed.
- `CONTACT_EMAIL`: `hello.childrenofwarproject@gmail.com`
- `WEBSITE_URL`: `https://childrenofwarproject.org`
- `JOIN_URL`: The join form lives on the homepage. Open `https://childrenofwarproject.org/#join` if that anchor scrolls to the form, otherwise the homepage. Add a comment telling me to confirm which works.
- `CONTENT_URL`: `https://raw.githubusercontent.com/bhuvanagiridevarsh-source/cow-app/main/content/content.json`
- `YOUTUBE_URL`: `https://www.youtube.com/@CoWProject_SCBC`
- `DONATE_URL` (Zeffy) and social URLs: pending. Leave blank with a `// TODO(Devarsh):` comment. Donate is the most important one, so list it first in the README's "Before you ship" section. While blank, Donate Money buttons stay hidden.
- `PRIVACY_POLICY_URL`, `TERMS_URL`: pending until posted on the website.
- `IOS_BUNDLE_ID` / `ANDROID_PACKAGE`: `org.childrenofwarproject.app`

---

## 11. Deliverables besides the app

- `README.md`: What the app is, plus exact copy-paste steps to run it on a phone with Expo Go. Written for a non-developer.
- `docs/SUPABASE_SETUP.md`: Creating the Supabase project under CoW's email, applying migrations, turning on email OTP and Apple sign-in, creating the photo bucket, and making the first admin. Note that free-tier projects can pause after a period of inactivity and what to do about it.
- `docs/ADMIN_GUIDE.md`: How CoW leaders do admin work in the Supabase dashboard in V1: verify ambassadors, handle reports, remove listings, confirm stuck pickups, and edit settings.
- `docs/SAFETY_POLICY_DRAFT.md`: A one-page draft of the pickup policy decisions (minimum age, adults on pickups, hours per pickup, service area) for CoW's Board of Trustees to approve. Mark it clearly as a draft for the board, not legal advice.
- `docs/LAUNCH_CHECKLIST.md`: Every non-code step, in order. Cover: Apple Developer and Google Play **organization** accounts enrolled by an adult with authority to sign for CoW (CoW already has an EIN and a D-U-N-S number; organization Play accounts skip the 12-tester/14-day closed-test rule); how the account owner creates an App Store Connect API key and a Google Play service-account key so the developer can run `eas submit` without owning the accounts; EAS setup (`eas build`, `eas submit`, `eas update`); TestFlight; a reviewer demo account; privacy labels matching §2; age rating; content rating questionnaires; and review-rejection tips (account deletion, report/block, Sign in with Apple, Terms).
- `docs/STORE_LISTING.md`: App name, subtitle, keywords, description, promotional text, "What's New," and a screenshot shot list for both stores.
- `docs/PRIVACY_POLICY.md` and `docs/TERMS.md`: Short and accurate to what the app actually collects and does, ready to post on the website.
- An app icon and splash screen generated from the lamp logo in `/assets` at all required sizes.
- `eas.json` with development, preview, and production profiles.
- `docs/CREDITS.md` for any third-party animations or assets.
- Unit tests for status transitions, ZIP/service-area checks, age-gate logic, tier math, hours totals, and content-schema validation.
- `docs/RLS_TEST_PLAN.md`, plus actually running it against the dev project: prove with two test accounts that a stranger cannot read an exact address, change someone else's item, or award themselves hours.

---

## 12. Definition of done (V1)

- All quality gates pass on a clean clone.
- The app runs in Expo Go on iPhone with no warnings in the console.
- The full loop works with two real test accounts: sign up → list an item with a photo → second account requests it → first accepts → address appears only for the second account → collected → confirmed → hours and impact total update.
- The RLS test plan passes.
- Airplane mode: the app opens, shows cached content and a friendly offline message, and does not crash.
- Every link either works or is hidden. VoiceOver can reach every button.
- Every doc in §11 exists and is written in plain English.

---

## 13. Not in V1 (do not build yet)

V2: in-app messaging, push notifications ("new item near you," pickup reminders), map and route view for ambassadors, hours certificates (PDF), donor acknowledgments, in-app admin screens. V3: admin dashboard, leaderboards, value estimator, Spanish language, optional in-app payments. Keep the code structured so these can be added later without rewrites.
