# Launch Checklist

Every step that isn't code, in order. iPhone comes first; Android follows from the same code.

Menus in Apple's, Google's, and Expo's websites change. If a button isn't where this says, look for the same words nearby.

**People in this list**
- **Account owner:** an adult with authority to sign for CoW. They own the Apple, Google, and Supabase accounts.
- **Developer:** the person who runs the build commands.

---

## 1. Start now: these take the longest

- [ ] **Apple Developer Program, as an organization.** The account owner enrolls at developer.apple.com/programs using CoW's legal name, EIN, and D-U-N-S number. Apple verifies the organization, which can take days to weeks. Cost: $99 per year. Apple offers a fee waiver to eligible nonprofits; CoW can apply once its 501(c)(3) is approved.
- [ ] **Google Play Console, as an organization.** $25 once, with the D-U-N-S number. Organization accounts skip the rule that personal accounts must run a 12-tester, 14-day closed test first.
- [ ] **Board review** of `SAFETY_POLICY_DRAFT.md`, `TERMS.md`, and `PRIVACY_POLICY.md`. Two board members are attorneys.
- [ ] **Decide who manages childrenofwarproject.org's domain settings (DNS).** Needed for sign-in emails (step 3).
- [ ] **Approve the app icon** or supply an official logo of 1024×1024 or larger (`assets/brand/README.md`).

---

## 2. Fill in the missing values

In `src/config.ts`:

- [ ] `DONATE_URL`: CoW's Zeffy page. Donate buttons are hidden until this is set.
- [ ] `PRIVACY_POLICY_URL` and `TERMS_URL`: post both documents on the website, then paste the links.
- [ ] `SOCIAL_URLS`: Instagram and LinkedIn, if CoW wants them shown.
- [ ] `PASSWORD_SIGN_IN_EMAILS`: keep the two demo addresses. They are how reviewers sign in.

Then run `npm run check`. All six checks must pass.

---

## 3. Production database and email

Follow `SUPABASE_SETUP.md` **Part C**. In short:

- [ ] Create the production Supabase project under CoW's email.
- [ ] Apply every file in `supabase/migrations/` in file-name order.
- [ ] Run the security tests and check the Security Advisor.
- [ ] Connect a real email service so sign-in codes reach everyone.
- [ ] Set the email templates, the 6-digit code length, and Sign in with Apple.
- [ ] Create the two demo accounts and make the first admin.
- [ ] Decide about free-plan pausing (upgrade to Pro, or accept the risk).

---

## 4. Set up Expo's build service (EAS)

The developer does this once.

```sh
npm install -g eas-cli
eas login
eas init
```

`eas init` links this project to CoW's Expo account. `eas.json` already has three build types:

| Type | What it makes |
|---|---|
| `development` | A test app with developer tools. Needs `npx expo install expo-dev-client` first. Optional. |
| `preview` | The real app, installed directly on test phones. Use this to test before the stores. |
| `production` | The app that goes to the App Store and Google Play. |

**Give the builds the database keys.** The `.env` file never leaves your computer, so builds need their own copy. Use the **production** project's values for `preview` and `production`:

```sh
eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value https://YOUR-PROJECT.supabase.co --environment production --visibility plaintext
eas env:set --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR-PUBLISHABLE-KEY --environment production --visibility plaintext
```

Repeat both lines with `--environment preview`. These two values are safe to ship. **Never put the secret (service_role) key anywhere.**

If a build opens to the "not set up yet" screen, these values are missing.

---

## 5. Let the developer submit without owning the accounts

**Apple: App Store Connect API key** (account owner does this)
1. appstoreconnect.apple.com → **Users and Access → Integrations → App Store Connect API**.
2. Create a key with the **App Manager** role.
3. Download the `.p8` file (it can only be downloaded once), and note the **Key ID** and **Issuer ID**.
4. Send all three to the developer privately. Never put the `.p8` file in the project folder or in chat.

**Google: service-account key** (account owner does this)
1. In Google Cloud, create a **service account** and download its **JSON key**.
2. In Play Console → **Users and permissions**, invite the service account's email with permission to manage releases.
3. Send the JSON file to the developer privately.

When the developer runs `eas submit`, it asks for these and can store them in Expo's secure credentials.

---

## 6. First real build, and the tests Expo Go couldn't do

```sh
eas build --profile preview --platform ios
```

Install it on a test iPhone and check these. They could not be tested in Expo Go:

- [ ] **Sign in with Apple** works: sign up, sign out, sign in again. First add `org.childrenofwarproject.app` to the Apple provider's Client IDs in Supabase (see `SUPABASE_SETUP.md`).
- [ ] **The success buzz** happens when a donor confirms a pickup.
- [ ] **The icon and splash screen** look right in light and dark mode.
- [ ] **Permission pop-ups** for camera and location show CoW's wording.
- [ ] The full loop with the two demo accounts: list, request, accept, address appears, picked up, confirmed, hours and impact go up.
- [ ] Airplane mode: the app opens with saved information and an offline strip.

Then the same on an Android phone: `eas build --profile preview --platform android`.

### One more check on a real photo

The app re-saves every photo and refuses to upload one that still carries hidden location data. This was confirmed on a real upload from the test database on Oct 10, 2026. Repeat it once on the first real build:

1. In Supabase: **Storage → item-photos**, open any folder, and download one photo taken with the phone's camera.
2. On a Mac, select the file in Finder and press **Cmd+I**. Under **More Info** there must be **no Latitude or Longitude**.

### Technical notes for the developer

- **Library warnings.** `npm audit` reports known issues in the tools that build the app (Expo's command line, Metro, Jest, React DevTools). Those tools run on the developer's computer and are not part of the app people install. One low-risk item does ship: the navigation library's web-address reader can be slowed down by a deliberately malformed link, which would only freeze the app for the person who tapped that link. The fix arrives with the next Expo SDK. **Do not run `npm audit fix --force`:** it would downgrade Expo and React Native and break the app. Re-check after each SDK upgrade.
- **Android permissions.** Before the Android release, look at the permissions Play Console lists for the build. Expected: internet, camera, location, and vibrate. Expo's template also declares "display over other apps" and old-Android storage access, which the app doesn't need. If Play flags them, remove them with `android.blockedPermissions` in `app.json` and re-test photos and the developer menu.
- **Android cloud backup is off** (`android.allowBackup: false` in `app.json`), so a saved sign-in is never copied to a Google account backup.
- **Apple's privacy manifest.** Apple requires every app to say why it uses a few built-in phone features (saved settings, file dates, time since start-up, free disk space). The app's libraries use them in ordinary ways, and their reasons are listed in `app.json` under `ios.privacyManifests`, copied from the libraries' own declarations. Tracking is declared as off. If Apple emails about a "missing API declaration" after an upload, add the reason it names to that list and upload again. After adding a library that contains native code, check whether it brings a `PrivacyInfo.xcprivacy` file with new reasons.
- **iPhone permission messages.** Every message in `app.json` says exactly what the permission is for. Two of them (always-on location and motion) exist only because Apple requires a message for anything a built-in library could ask for; the app never asks for either.

---

## 7. App Store Connect

- [ ] Create the app: name **CoW Project**, bundle ID `org.childrenofwarproject.app`, primary language English (U.S.).
- [ ] Paste the text from `STORE_LISTING.md`. Add screenshots.
- [ ] **Privacy Policy URL** and **Support URL** (the website).
- [ ] **Category:** Lifestyle, or Social Networking as secondary.

### Privacy labels ("App Privacy")

Answer from what the app really collects. As built:

| Apple's data type | Collected? | Linked to the person? | Used for tracking? | Purpose |
|---|---|---|---|---|
| Name | Yes | Yes | No | App functionality |
| Email address | Yes | Yes | No | App functionality |
| Physical address (donors' pickup address) | Yes | Yes | No | App functionality |
| Photos (item photos the person chooses) | Yes | Yes | No | App functionality |
| Other user content (pickup notes, reports) | Yes | Yes | No | App functionality |
| Other data (birth month and year, ZIP code, guardian's name and email) | Yes | Yes | No | App functionality |
| Location | **No** | | | Used only on the phone; never sent to CoW |
| Identifiers, usage data, diagnostics, purchases, contacts, browsing | **No** | | | |

There is **no tracking** and no third-party advertising or analytics. If the app ever starts collecting anything new, update these answers and `PRIVACY_POLICY.md` together.

### Age rating

Answer Apple's questionnaire honestly. The app has **user-generated content** (listings and photos) with **reporting, blocking, and moderation**, and no gambling, violence, or mature themes. The app itself requires users to be 13 or older. Expect a rating in the 12+/13+ range.

### App Review information

- [ ] **Demo account:** `demo.donor@childrenofwarproject.org` and its password. Give the second one too, so the reviewer can try a pickup.
- [ ] **Notes for the reviewer.** Paste something like this:

  > CoW Project connects item donors with student volunteers for a nonprofit.
  > Sign-in normally uses an emailed 6-digit code. For review, typing the demo email shows a password field.
  > Donor: demo.donor@childrenofwarproject.org. Volunteer: demo.volunteer@childrenofwarproject.org.
  > Account deletion: Me tab → Delete account.
  > Report and Block are on every listing and every pickup. Terms with a zero-tolerance policy are accepted at sign-up.
  > Money donations open our Zeffy page in Safari. There are no in-app purchases or payments.
  > The service area is New Jersey (ZIP codes 070–089).

### Submit

```sh
eas build --profile production --platform ios
eas submit --profile production --platform ios
```

- [ ] The build appears in **TestFlight**. Add internal testers and try it once more.
- [ ] Attach the build to the version and click **Submit for Review**.

---

## 8. Common reasons Apple rejects apps like this one

Each is already built. Make sure the reviewer can find it.

- **No way to delete an account.** Ours: Me → Delete account. Say so in the notes.
- **User content without moderation.** Ours: Report and Block on every listing and pickup, auto-hide after 3 reports, and Terms with zero tolerance. Someone must actually review reports within 24 hours.
- **Other sign-in offered without Sign in with Apple.** Ours has Sign in with Apple on iPhone. Confirm it works in the build.
- **Reviewer can't sign in.** Double-check the demo passwords the day you submit.
- **Demo data is empty.** Before submitting, list two or three items with the demo donor so Browse isn't empty.
- **Vague permission pop-ups.** Ours say why the camera and location are used.
- **Charity claims.** The app never says "tax-deductible" and says 501(c)(3) status is pending. Keep the store text the same.
- **Known gap: Apple sign-in token revocation.** Apple asks apps to revoke a person's Sign in with Apple token when their account is deleted. That needs a small server function and an Apple key, and it is **not built yet**. Build it before submitting if possible; otherwise a reviewer may flag it.

---

## 9. Google Play

- [ ] Create the app with package name `org.childrenofwarproject.app`.
- [ ] **Data safety form:** the same facts as Apple's privacy labels. Data is encrypted in transit, and users can request deletion (in the app).
- [ ] **Content rating questionnaire:** user-generated content with moderation; no violence, gambling, or mature themes.
- [ ] **Target audience:** 13 and older. Do not select under-13 age groups.
- [ ] **Account deletion:** Google asks for a web link where people can request deletion. Add a short section to the website's Privacy Policy page saying how (in the app, or by emailing CoW).
- [ ] **Donations.** Google Play limits donation features to registered charities. While CoW's 501(c)(3) is pending, keep the Donate buttons hidden on Android (leave `DONATE_URL` blank in the Android build, or ask the developer to hide them on Android only) until Google approves CoW as a nonprofit.
- [ ] Before the Android launch, someone runs the phone checklists in `PROGRESS.md` on a real Android phone. Android has only been build-tested so far.

```sh
eas build --profile production --platform android
eas submit --profile production --platform android
```

The first Android upload usually has to be done by hand in Play Console; after that `eas submit` works.

---

## 10. After launch

- [ ] Check `ADMIN_GUIDE.md`'s daily list every day.
- [ ] **Small fixes without a new store release** are possible with `eas update`, once `expo-updates` is installed and configured. It is not set up in this version.
- [ ] To change the About screens or the board's settings, see `UPDATING_CONTENT.md`. No release needed.
- [ ] When the 501(c)(3) is approved: update the store text, the website, and the Terms. The phrase "tax-deductible" still needs the Board's sign-off before it appears anywhere.
