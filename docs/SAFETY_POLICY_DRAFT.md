# DRAFT — Pickup Safety Policy

> **For review by CoW's Board of Trustees & Advisors. This is a draft to approve, change, or reject. It is not legal advice.**
> Every number below is a switch the app reads from its database (`settings` table). The Board can change any of them at any time without releasing a new version of the app.

## 1. Who can use the app

- **Under 13: no account.** This follows the US children's privacy law (COPPA). These users are pointed to the website instead.
- **Ages 13–17:** at sign-up they must enter a parent or guardian's name and email and confirm that the guardian consents.
- Ages come from **birth month and year**. When in doubt, the app treats people as the youngest they could be.

## 2. Pickups (a volunteer goes to a donor's home)

| Rule | Proposed | Setting name |
|---|---|---|
| Minimum age to do pickups | **16** | `min_pickup_age` |
| Volunteers under 18 must bring an adult on every pickup | **Yes** | `minors_require_adult_on_pickup` |
| Hours earned per completed pickup | **1** (confirmed by CoW) | `hours_per_pickup` |
| Pickups in progress at once: volunteer | **1** | `max_active_claims_volunteer` |
| Pickups in progress at once: verified Ambassador | **5** | `max_active_claims_ambassador` |
| Pickup time windows | Morning 9–12, Afternoon 12–4, Evening 4–7 | built into the app |

- **Hours only count after the donor, or a CoW admin, confirms the pickup.** Volunteers can't report their own hours.
- Before their **first pickup**, every volunteer must read this checklist, which stays available on every pickup screen:
  - Bring a buddy. If you're under 18, bring an adult.
  - Tell a parent or guardian where you're going and when.
  - Stay at the door, porch, or garage. Never go inside alone.
  - Heavy items need two people.
  - No money changes hands.
  - If anything feels wrong, leave, and report it in the app.

## 3. Donors (people listing items)

| Rule | Proposed | Setting name |
|---|---|---|
| Donors under 18 must confirm a parent/guardian approves and an adult will be home at pickup | **Yes** | `minor_donors_require_adult_home` |
| Maximum value per item | **$5,000** | `max_item_value` |
| Maximum active listings per donor | **10** | `max_active_listings_per_donor` |

- **The exact address is shown only to the one volunteer the donor accepts, and only until the pickup is done.** Everyone else sees only the town and an approximate distance.
- Photos are re-saved on the phone before upload. This removes hidden GPS data that could reveal a home address.

## 4. Service area

- **New Jersey ZIP codes 070–089.** Listings outside the service area are politely blocked.
- The Board can add nearby areas (for example parts of NY or PA) by adding their 3-digit ZIP prefixes (`allowed_zip_prefixes`).

## 5. Reports and blocking

- Anyone can **report** a listing, a pickup, or a person, and can **block** another user. Blocking hides both people's listings from each other and cancels any pickup in progress between them.
- A listing is **automatically hidden once 3 different people report it**, until an admin reviews it (`report_hide_threshold`).
- Proposed: CoW admins check new reports **at least once a day**. Apple expects apps with user content to act on reports promptly.
- **Zero tolerance** for abusive or fake listings (stated in the Terms of Use). Offending listings and accounts are removed.

## 6. Questions for the Board

1. Is **16** the right minimum age for pickups? Should volunteers under 18 bring an adult on **every** pickup?
2. Should **13–15-year-olds** be allowed to list items at all (with guardian approval), or only adults?
3. Is **1 hour per pickup** right regardless of distance or item size?
4. Is **New Jersey only** the right starting area?
5. **Who are the admins**, and how quickly will reports be reviewed?
6. Does CoW need **insurance or a liability waiver** for pickups? *Recommend asking an attorney. Two Board members, Lata Setty and Prema Roddam, are attorneys.*
7. Should a guardian get an **email** when their teen signs up? This isn't built in the first version, but it could be added.

_Draft prepared Sep 27, 2026 alongside the app build. Once decided, send the answers to the app developer. Most changes are a single setting._
