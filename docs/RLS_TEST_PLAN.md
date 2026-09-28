# Database Security Test Plan

This proves that the database itself protects people. Hiding a button in the app isn't enough: someone could skip the app and talk to the database directly. These tests do exactly that.

## How to run it

1. Open the Supabase dashboard, then your project, then **SQL Editor**.
2. Open the file `supabase/tests/security_and_rules.test.sql` from this repo, copy **all** of it, paste it in, and press **Run**.
3. **Expected result:** a red message that starts with **`ALL 78 TESTS PASSED (everything was rolled back)`**.
   - It shows as an error on purpose. Ending with an error is how the test throws away everything it created, so your database is left exactly as it was.
   - Anything that starts with **`FAILED`** lists which tests broke. Send that message to the developer.

The test creates 10 pretend people:

- two donors
- a volunteer
- three strangers
- a 15-year-old
- a 17-year-old
- a verified Ambassador
- an admin
- plus a 12-year-old who tries to sign up

They then play out attacks and the whole pickup loop.

## What it proves

### The three the brief requires

| Test | We try to… | Must happen |
|---|---|---|
| D1, E9, E11 | read a donor's **exact address** as a stranger, and as a volunteer before the donor accepts | Hidden. Only the accepted volunteer sees it (E11). |
| A4, A5, C4, E7, E8 | **change someone else's item**: edit it directly, use someone else's photo, accept someone else's request | Refused |
| E12, A8, E25, G7 | **award yourself hours**: confirm your own pickup, add to the impact total, set hours directly | Refused |

### Everything else

| Area | Tests | What's checked |
|---|---|---|
| Age gate | B1a–B1f, B2–B5 | A 12-year-old can't sign up. 13–17 need a guardian and consent. The "youngest you could be" age math. |
| Direct writes | A4–A9 | Nobody can insert, update, or delete tables directly, even their own rows. |
| Signed-out visitors | A1–A3 | They can see the impact total and settings only. |
| Listing rules | C1–C7 | Location is rounded to about 1 km. Out-of-area ZIPs are blocked. The value cap. Photo must be your own. The time window. A teen donor needs an adult home. The ZIP fallback location. |
| Privacy | D1–D3, E11b, H1–H2 | Nobody can read anyone else's profile. The other person shows only as "Val T.". Nobody can upload into someone else's photo folder. |
| Pickup loop | E1–E26 | Under 16 can't pick up. A minor needs an adult. You can't request your own item. The 1-pickup limit. Only Ambassadors can request several items. You can't skip steps or confirm twice. The address disappears once the pickup is done. Decline and cancel put the item back. The Ambassador limit. The database refuses invalid moves even from the dashboard. |
| Reports & blocks | F1–F6 | 3 different reporters hide a listing, and the same person twice counts once. People only see their own reports. A block cancels the pickup in progress and hides listings, photos, and addresses. |
| Delete account | G1–G8 | Deletion is refused while photos remain. The donor's data is fully gone. The volunteer keeps their hours and the impact total stays. Strangers can't take over the orphaned pickup. An admin can finish it. |
| Admin commands | I1–I2 | App users can't run them. The dashboard can. |

## App-side checks (run with every `npm run check`)

- `src/domain/__tests__/status.test.ts` reads the database's pickup-step rules straight from the migration file. It fails if the app's copy ever disagrees.
- `src/features/__tests__/errors.test.ts` fails if the database can raise an error code that has no friendly message in the app.

## Also checked every time

Supabase's own **security advisor**: Dashboard → Advisors → Security. It must show **no issues**.

## Results log

| Date | Project | Result | Notes |
|---|---|---|---|
| Sep 27, 2026 | cow-app-dev | 75/76, then **78/78 ✅** | Test F1 found a real bug: a blocked person could still see a listing they had once requested. It was fixed in migration `…000800`, with two new regression tests (E26, F6). A second bug was found by code review before the first run: a deleted account (NULL) could make a pickup ownership check come out "unknown" instead of "no". It was fixed, and tests G4–G7 guard it. Security advisor: 0 issues. |
