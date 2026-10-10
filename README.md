# CoW Project app

The official iPhone and Android app for **Children of War Project (CoW)**, a student-led nonprofit from Monroe Township, NJ.

People list furniture and electronics they no longer need. Volunteers pick the items up and earn volunteer hours. Every confirmed item's value counts toward CoW's $25,000 3-year impact goal.

The app is built with Expo (React Native) and Supabase. It has no ads, no analytics, and no tracking.

---

## Before you ship

These values are still blank or pending. Each one is a single line in `src/config.ts` unless noted.

1. **Zeffy donation link (`DONATE_URL`).** This is the most important one. Every "Donate money" button stays hidden until it is filled in.
2. **Privacy Policy and Terms links (`PRIVACY_POLICY_URL`, `TERMS_URL`).** Post `docs/PRIVACY_POLICY.md` and `docs/TERMS.md` on the website first. Both app stores require a public Privacy Policy link.
3. **Social links (`SOCIAL_URLS`).** Instagram and LinkedIn rows stay hidden while blank.
4. **App icon approval.** The lamp icon was redrawn for the app (see `assets/brand/README.md`). CoW should approve it or supply an official logo of 1024×1024 or larger.
5. **Board review** of `docs/SAFETY_POLICY_DRAFT.md`, `docs/TERMS.md`, and `docs/PRIVACY_POLICY.md`.

The full launch list, in order, is in [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md).

---

## Run the app on your phone

You need a Mac or PC with [Node.js](https://nodejs.org) installed, and the free **Expo Go** app on your phone.

1. **Get the code.** In Terminal:
   ```sh
   git clone https://github.com/bhuvanagiridevarsh-source/cow-app.git
   cd cow-app
   npm install
   ```
2. **Add the database keys.** Copy the file `.env.example` to a new file named `.env`, and fill in the two values. `docs/SUPABASE_SETUP.md` says where to find them. Without this file the app shows a "not set up yet" screen.
3. **Sign in to Expo.** Create a free account at expo.dev, then run:
   ```sh
   npx expo login
   ```
   Sign in to the Expo Go app on your phone with the same account.
4. **Start the app.**
   ```sh
   npx expo start --tunnel
   ```
5. **Open it.** Scan the QR code with your iPhone's Camera app (or from inside Expo Go on Android).

To stop, press `Ctrl+C` in Terminal. After changing `.env` or installing anything, stop and start again.

**Known limit of Expo Go:** on at least one test iPhone, Expo Go did not include Sign in with Apple, so that button is hidden there. It can only be tested in a real build (see the launch checklist). The success "buzz" also doesn't work in Expo Go.

---

## Check that everything is healthy

```sh
npm run check
```

This runs all six checks: type check, lint, unit tests, Expo's project doctor, and a test build for iPhone and for Android. All six must pass before any release.

---

## Guides

| Guide | What it's for |
|---|---|
| [`docs/BRIEF.md`](docs/BRIEF.md) | What the app must do. The source of truth. |
| [`docs/PLAN.md`](docs/PLAN.md) | How it was built, screen by screen. |
| [`docs/PROGRESS.md`](docs/PROGRESS.md) | What's done, what's next, and open items. |
| [`docs/SUPABASE_SETUP.md`](docs/SUPABASE_SETUP.md) | Setting up the database, for testing and for launch. |
| [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md) | How CoW leaders verify Ambassadors, handle reports, and more. |
| [`docs/UPDATING_CONTENT.md`](docs/UPDATING_CONTENT.md) | Changing the About screens and the board's settings without a new release. |
| [`docs/LAUNCH_CHECKLIST.md`](docs/LAUNCH_CHECKLIST.md) | Every non-code step to get into the App Store and Google Play. |
| [`docs/STORE_LISTING.md`](docs/STORE_LISTING.md) | The words and screenshots for the store pages. |
| [`docs/SAFETY_POLICY_DRAFT.md`](docs/SAFETY_POLICY_DRAFT.md) | Pickup safety decisions for the Board to approve. |
| [`docs/TERMS.md`](docs/TERMS.md), [`docs/PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md) | Legal text shown in the app and posted on the website. |
| [`docs/RLS_TEST_PLAN.md`](docs/RLS_TEST_PLAN.md) | How the database's privacy rules are tested. |
| [`docs/CREDITS.md`](docs/CREDITS.md) | Open-source libraries, fonts, and artwork. |

---

## Where things live

- `src/app/`: the screens.
- `src/domain/`: the rules (ages, ZIP codes, pickup steps, levels), each with unit tests.
- `src/features/`: talking to the database, grouped by feature.
- `src/config.ts`: links and settings you can change.
- `content/content.json`: the About screens' text, editable on GitHub.
- `supabase/migrations/`: every database change, in order.

## License

See [`LICENSE`](LICENSE).
