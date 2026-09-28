# Supabase Setup

Supabase is the app's online database. It stores accounts, listings, pickups, and photos, and it sends the sign-in codes.

This guide has three parts:

- **Part A** is what's already done for the **test project**.
- **Part B** is the **dashboard steps you do now**, before testing sign-in on your phone.
- **Part C** covers the **real (production) project** for launch. It's filled in during Phase 9.

---

## Part A — Already done (test project `cow-app-dev`)

- **Project:** `cow-app-dev` on Supabase's free plan, in the us-east-1 region, with project ID `uhmwcvkgwlpejcdvudun`.
- **Database:** every file in `supabase/migrations/` has been applied: tables, security rules, functions, admin commands, and the private photo folder.
- **Security tests:** `supabase/tests/security_and_rules.test.sql` passes (see `docs/RLS_TEST_PLAN.md`).
- **App connection:** the app's `.env` file has this project's URL and publishable key. `.env` is never uploaded to GitHub.

> **Heads-up: free projects pause** after about 7 days without use. If the app suddenly can't load anything, open the Supabase dashboard. If it says the project is paused, click **Resume project** and wait a few minutes.

---

## Part B — Do these now (about 10 minutes)

Open the project dashboard: **https://supabase.com/dashboard/project/uhmwcvkgwlpejcdvudun**

### B0. Connect an email service (needed before templates can be edited)

Supabase only lets you edit email templates after a custom email service (SMTP) is connected. For testing, a Gmail account works. At launch, use CoW's own email (see Part C).

1. Get a Gmail **app password**:
   - Go to **myaccount.google.com/apppasswords**. If Google says it's unavailable, first turn on **2-Step Verification** under Security.
   - Name it "CoW Supabase" and click **Create**.
   - Copy the 16-letter password. Don't put it in any project file or chat.
2. In Supabase, go to **Authentication → Emails → SMTP Settings** (or click **Set up SMTP** on a template page) and fill in:
   - **Enable custom SMTP:** on
   - **Sender email:** the Gmail address
   - **Sender name:** `CoW`
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Username:** the Gmail address
   - **Password:** the 16-letter app password

   Then click **Save**.
3. Once this is connected, codes can go to any email address, not just Supabase team members. Gmail allows about 500 emails a day, which is plenty for testing and a small launch.

### B1. Make the sign-in email show a 6-digit code

The app asks people to type a code, so the emails must contain the code instead of a link.

1. Go to **Authentication → Emails → Templates** (direct link: https://supabase.com/dashboard/project/uhmwcvkgwlpejcdvudun/auth/templates).
2. Open the template called **Magic link or OTP**.
   - **Subject:** `Your CoW sign-in code`
   - **Body:** delete what's there and paste this:
     ```html
     <h2>Your CoW sign-in code</h2>
     <p>Enter this code in the CoW app:</p>
     <p style="font-size:32px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
     <p>The code expires soon. If you didn't ask for it, you can ignore this email.</p>
     ```
   - Click **Save**.
3. Open the template called **Confirm sign up**. This is the one brand-new people receive. Paste the **same subject and body**, then click **Save**.
4. Go to **Authentication → Sign In / Providers → Email** (direct link: https://supabase.com/dashboard/project/uhmwcvkgwlpejcdvudun/auth/providers). Set:
   - **Email OTP Length:** `6`
   - **Email OTP Expiration:** `900` (15 minutes)

   Then click **Save**.

> Without B0, Supabase only emails **members of your Supabase team**, and the emails contain a link instead of a code. The app needs the code.

### B2. Turn on Sign in with Apple (for testing in Expo Go)

1. Go to **Authentication → Sign In / Providers**, then **Apple**.
2. Turn **Enable Sign in with Apple** on.
3. In **Client IDs**, enter: `host.exp.Exponent`

   That's the Expo Go app's ID; it lets Apple sign-in work while testing. At launch, add the real app ID too, separated by a comma: `host.exp.Exponent,org.childrenofwarproject.app`
4. Leave **Secret Key (for OAuth)** and the other OAuth fields **empty**. The app uses Apple's native iPhone sign-in, which doesn't need them.
5. Click **Save**.

### B3. Create the two demo accounts

These sign in with a password instead of an emailed code. The app shows a password box only for these two emails (listed in `src/config.ts`). You'll use them to test with two people, and Apple's reviewers will use them later.

1. Go to **Authentication → Users** (direct link: https://supabase.com/dashboard/project/uhmwcvkgwlpejcdvudun/auth/users).
2. Click **Add user**, then **Create new user**.
   - **Email:** `demo.donor@childrenofwarproject.org`
   - **Password:** make up a strong one and save it in your password manager. Don't put it in any file in the project.
   - Check **Auto Confirm User**.
   - Click **Create user**.
3. Repeat for `demo.volunteer@childrenofwarproject.org`.

Neither email needs a real inbox, because no email is ever sent to them.

### B4. Make yourself an admin (after you've signed up in the app)

1. Sign up in the app with your own email and finish the steps.
2. In the dashboard, go to **SQL Editor**, then **New query**. Paste this, with your email, and click **Run**:
   ```sql
   select admin.set_admin('your-email@example.com');
   ```
   It answers `Now an admin: <your name>`.

### B5. (Optional) Re-run the security tests

In **SQL Editor**, paste the whole file `supabase/tests/security_and_rules.test.sql` and click **Run**. The expected result is a message starting with **ALL 78 TESTS PASSED**. It shows as a red error on purpose, because that's how the test cleans up after itself.

---

## Part C — Production project (filled in during Phase 9)

This part will cover:

- creating the real project under **CoW's email** and applying the migrations in order
- connecting a real email service so codes reach everyone (Resend or Brevo)
- adding `org.childrenofwarproject.app` to Apple's Client IDs
- the demo accounts for App Store review
- what to do about free-plan pausing
