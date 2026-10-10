# Supabase Setup

Supabase is the app's online database. It stores accounts, listings, pickups, and photos, and it sends the sign-in codes.

This guide has three parts:

- **Part A** is what's already done for the **test project**.
- **Part B** is the **dashboard steps you do now**, before testing sign-in on your phone.
- **Part C** covers the **real (production) project** for launch.

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

## Part C — Production project (for launch)

The test project keeps test data away from real people. The real app gets its own project, owned by CoW.

### C1. Create the project

1. Sign in at supabase.com with **CoW's email** (not a personal one). Create an organization named for CoW.
2. Click **New project**. Name it `cow-app`, choose the **East US** region, and save the database password in CoW's password manager.
3. Supabase shows the cost before creating it. The free plan is $0.

### C2. Build the database

Apply every file in `supabase/migrations/`, **in file-name order** (the numbers at the start put them in order).

**Easiest way:** in the dashboard, open **SQL Editor → New query**. For each file, in order: open it on GitHub, click **Raw**, copy everything, paste, and click **Run**. Wait for "Success" before the next one.

**Developer way:** install the Supabase CLI, run `supabase link` with the project ID, then `supabase db push`.

One file (`…000200_zip_centroids_seed.sql`) is large. If the editor struggles, use the developer way.

### C3. Prove the privacy rules work

1. In **SQL Editor**, paste the whole file `supabase/tests/security_and_rules.test.sql` and click **Run**. The expected result starts with **ALL 78 TESTS PASSED**. It shows as a red error on purpose; that's how the test undoes itself.
2. Open **Advisors → Security Advisor**. It should list no errors.
   - It may show a warning named **"Leaked Password Protection Disabled."** Only the two demo accounts use passwords. Turn the protection on under **Authentication → Sign In / Providers → Email** if your plan offers it; otherwise give the demo accounts long, random passwords.

Do not launch if a test fails.

### C4. Connect the app

1. **Project Settings → API Keys.** Copy the **Project URL** and the **Publishable key**.
2. Give them to the developer for the build settings (see `LAUNCH_CHECKLIST.md`, step 4).
3. **Never copy the secret (service_role) key anywhere.** The app doesn't need it.

### C5. Real email for sign-in codes

Supabase's built-in email only reaches members of your Supabase team, so a real email service is required.

1. Create a free account with an email service such as **Resend** or **Brevo**.
2. In that service, add the domain `childrenofwarproject.org`. It shows a few **DNS records** to add. Whoever manages the website's domain adds them. This proves CoW owns the address and keeps the emails out of spam.
3. The service gives you SMTP details (host, port, username, password). In Supabase: **Authentication → Emails → SMTP Settings**, turn on **custom SMTP**, and enter them. Set the sender to something like `hello@childrenofwarproject.org` and the sender name to `CoW`.
4. Then do steps **B1** above in this project: paste the code template into both email templates, and set **Email OTP Length** to `6` and **Expiration** to `900`.
5. Test it: sign up in a test build with an email that is **not** on the Supabase team.

A Gmail app password (step B0) also works for a very small launch, at up to about 500 emails a day, but emails from a personal Gmail look less official.

### C6. Sign in with Apple

1. **Authentication → Sign In / Providers → Apple.** Turn it on.
2. **Client IDs:** `org.childrenofwarproject.app`
   Add `host.exp.Exponent` after a comma only if you still test in Expo Go against this project.
3. Leave the OAuth secret fields empty. The app uses Apple's native iPhone sign-in.
4. In the Apple Developer account, the app's identifier `org.childrenofwarproject.app` must have the **Sign in with Apple** capability. Expo's build service turns this on when it builds.

### C7. Demo accounts and the first admin

1. Repeat step **B3** in this project to create `demo.donor@…` and `demo.volunteer@…` with strong passwords, saved in CoW's password manager. Apple's and Google's reviewers use these.
2. Sign in to a test build with each one and finish the setup screens. Use an adult birthday so the reviewer isn't asked for a guardian.
3. List two or three realistic items with the demo donor, so Browse isn't empty for the reviewer.
4. Repeat step **B4** to make the first CoW admin.

### C8. Settings

**Table Editor → settings** has one row with the starting values. Change them only as the Board decides (`SAFETY_POLICY_DRAFT.md`). `UPDATING_CONTENT.md` explains each one.

### C9. Free-plan pausing

Free projects pause after about 7 days with very little activity, and the app then can't load anything until someone clicks **Resume project**. Paused projects can be restored for 90 days.

- **Recommended for the live app:** upgrade to **Supabase Pro** ($25 a month), which never pauses and adds daily backups.
- **If staying on the free plan:** the app will keep the project awake as long as people use it. Check the dashboard weekly, and know that a quiet week can pause it.

### C10. Keep the account safe

- Turn on two-step sign-in for every Supabase team member.
- Keep the team small. Anyone on it can see private information.
- The photo folder (`item-photos`) is private and created by the migrations. Don't make it public.
