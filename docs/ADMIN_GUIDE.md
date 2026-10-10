# Admin Guide

How CoW's leaders run the app day to day. In this first version, admin work is done in the **Supabase dashboard**, not inside the app.

**Where:** open the project at supabase.com, then **SQL Editor → New query**. Paste a command from this guide, change the part in quotes, and click **Run**. Each command answers with a short sentence saying what it did.

**Who:** only people who can sign in to CoW's Supabase account. Keep that list short, and turn on two-step sign-in for each of them.

> Type commands exactly as shown, including the single quotes. Nothing here can be run from the app by a regular user.

---

## Check these every day

Run each line on its own. An empty result means there is nothing to do.

```sql
select * from admin.open_reports;
```
```sql
select * from admin.ambassador_requests;
```
```sql
select * from admin.stuck_pickups;
```
```sql
select * from admin.hidden_items;
```

The Terms promise that reports are reviewed quickly, usually within 24 hours. Please keep to that.

---

## Ambassadors

A user asks from the app (**Me → Request Ambassador**). CoW decides.

**Approve.** They can then request several items at once.
```sql
select admin.verify_ambassador('person@example.com');
```

**Remove or decline.** This also clears their pending request.
```sql
select admin.remove_ambassador('person@example.com');
```

---

## Reports

`admin.open_reports` shows who reported what, the reason, and any details. Decide what to do, act, then close the report.

**Take a listing down.** Any request or pickup in progress for it is cancelled.
```sql
select admin.remove_item('ITEM-ID');
```

**Close the report** with a note about what you did:
```sql
select admin.resolve_report('REPORT-ID', 'Removed the listing');
```

**Close it as not a problem:**
```sql
select admin.resolve_report('REPORT-ID', 'Not a problem', 'dismissed');
```

The note you write is private. The person who sent the report can see that it was closed, but not your note.

The `ITEM-ID` and `REPORT-ID` are the long codes in the `item_id` and `report_id` columns. Copy and paste them.

### Listings hidden automatically

When 3 different people report the same listing, the app hides it until you look. See them with `admin.hidden_items`.

**Show it again** if the reports were wrong:
```sql
select admin.unhide_item('ITEM-ID');
```
Otherwise remove it with `admin.remove_item`.

### Removing a person

For serious or repeated problems, go to **Authentication → Users**, find the person, open the **⋯** menu, and choose **Ban user** or **Delete user**. Deleting removes their profile, listings, addresses, and blocks. Delete their photos first: **Storage → item-photos**, open the folder named with their user ID, and delete its contents.

**If anyone may be in danger, call 911 first.** Then write down what happened and tell CoW's Board.

---

## Stuck pickups

`admin.stuck_pickups` lists pickups waiting a long time on someone.

**Confirm a pickup for a donor who isn't responding.** The volunteer gets their hours and the item's value joins the impact total. Only do this when you're sure the item was collected.
```sql
select admin.confirm_pickup('PICKUP-ID');
```

**Cancel a pickup,** including one marked "picked up" by mistake. The item is listed again.
```sql
select admin.cancel_pickup('PICKUP-ID');
```

---

## Admins

**Make someone an admin.** They must have finished signing up in the app first.
```sql
select admin.set_admin('leader@example.com');
```

**Remove admin:**
```sql
select admin.set_admin('leader@example.com', false);
```

Being an admin lets a signed-in person see reports and private details through the database. It adds no screens in the app in this version.

---

## Clean up unfinished sign-ups

If someone enters a sign-in code but never finishes setting up, a login with only their email is left behind. Run this about once a month so CoW doesn't keep emails it has no reason to keep:

```sql
select admin.cleanup_unfinished_signups();
```

It only removes logins that have no profile and are more than a day old. It never touches a finished account.

---

## Settings and content

- **Impact goal, pickup age, limits, service area:** see `UPDATING_CONTENT.md`, Part 2. Change pickup rules only after the Board has agreed.
- **About screens (team, events, partners):** see `UPDATING_CONTENT.md`, Part 1.

---

## Fixing a mistake in someone's birthday

Birth month and year can't be changed in the app, so nobody can edit their way past the age rules. If a real mistake was made, an admin can correct it in **Table Editor → profiles**: find the person by name, and edit `birth_year` and `birth_month`. Only do this when you're confident of the person's real age.

---

## If the app suddenly can't load anything

Free Supabase projects pause after about 7 days without use. Open the dashboard; if it says the project is paused, click **Resume project** and wait a few minutes. For the live app, see `SUPABASE_SETUP.md` Part C.
