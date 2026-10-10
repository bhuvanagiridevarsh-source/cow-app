# Updating the App's Content

Two things in the app can be changed without releasing a new version:

- **About CoW** (story, team, board, partners, events, quotes, membership levels) lives in one file on GitHub.
- **Impact numbers and pickup rules** live in the Supabase `settings` table.

Everything else (screens, buttons, colors) needs a new app release.

---

## Part 1: The About screens

The file is `content/content.json`:
**https://github.com/bhuvanagiridevarsh-source/cow-app/blob/main/content/content.json**

### How to edit it

1. Open the link above while signed in to GitHub.
2. Click the **pencil icon** (Edit this file) at the top right of the file.
3. Make your change (see the examples below).
4. Change the `"updated"` date near the top to today's date, like `"2026-11-02"`.
5. Click **Commit changes**, write a few words about what you changed, and click **Commit changes** again.

The app picks up the change within about an hour. To see it sooner, close the app completely and open it again. GitHub itself can take up to five minutes to serve the new file.

### The app protects itself from mistakes

If the file has a mistake, **the app keeps showing the last good version** and nothing breaks. So if your change doesn't appear after an hour, the file probably has a mistake. Check these first:

- **Every piece of text sits inside straight double quotes:** `"like this"`. Curly quotes copied from Word or Notes (“like this”) break the file.
- **To use a quote mark inside text**, put a backslash before it: `"The \"Why Invest in Women\" Summit"`.
- **Items in a list are separated by commas**, with no comma after the last one.
- **Dates look like `2026-10-03`:** year, month, day, with dashes.
- **Don't delete a line that isn't marked optional below.** A missing name or role rejects the whole file.

To be sure before you commit, paste the whole file into **https://jsonlint.com** and click Validate. It points to the exact line with the problem.

If you get stuck, undo it: on the file's page click **History**, open the last version that worked, and copy its contents back.

### Examples

**Add an event.** Add a block to the `"events"` list. The app sorts events into "Coming up" and "Past events" by date on its own, so the order doesn't matter and you never need to move an event after it happens.

```json
{
  "title": "Winter Coin Drive",
  "startDate": "2026-12-05",
  "endDate": "2026-12-06",
  "time": "10:00 AM–2:00 PM ET",
  "location": "Monroe Twp, NJ",
  "note": "Bring your spare change!",
  "url": "https://example.org/coin-drive"
}
```

Only `title` and `startDate` are required. Leave out any other line you don't need.

**Add a team member or ChangeMaker.** Add a block to `"team"` or `"changeMakers"`:

```json
{
  "name": "Maya Patel",
  "role": "ChangeMaker, Events Lead"
}
```

Without a photo, the app shows the person's initials in a circle. To add a photo, add a line with a web link to a square image. The link must start with `https://`:

```json
"photo": "https://childrenofwarproject.org/photos/maya.jpg"
```

The photos of the current team and board are built into the app, which is why theirs are short names like `"yuvraaj-kumar"` and not links. Don't change those names.

**Add a partner.** Add a block to `"partners"`. `note` and `url` are optional:

```json
{ "name": "Example Foundation", "note": "NJ", "url": "https://example.org" }
```

**Change the story, a bio, or a quote.** Edit the text between the quotes.

### Rules to keep

- **Never write "tax-deductible."** CoW's 501(c)(3) status is still pending.
- **Only real facts.** No placeholder text, since people see it within the hour.
- **No war imagery** in any photo you link to.

---

## Part 2: Impact numbers and pickup rules

These live in Supabase and apply in the app right away.

1. Open the Supabase dashboard for the project and go to **Table Editor**, then the **settings** table.
2. There is exactly one row. Double-click the value you want to change, type the new value, and press **Enter**.
3. Click **Save** if the dashboard asks.

| Setting | What it does | Starting value |
|---|---|---|
| `goal_amount` | The impact goal, in dollars | 25000 |
| `goal_label` | The words shown next to the goal | 3-year goal |
| `base_impact_amount` | Impact CoW achieved before the app. The app adds confirmed item values on top of this. | 5000 |
| `min_pickup_age` | Youngest age allowed to do pickups | 16 |
| `minors_require_adult_on_pickup` | Whether volunteers under 18 must confirm an adult is coming | true |
| `hours_per_pickup` | Volunteer hours earned per confirmed pickup | 1 |
| `max_active_claims_volunteer` | Pickups a volunteer can have in progress at once | 1 |
| `max_active_claims_ambassador` | Pickups a verified Ambassador can have in progress at once | 5 |
| `allowed_zip_prefixes` | The service area: the first 3 digits of allowed ZIP codes | 070 to 089 (all of New Jersey) |
| `minor_donors_require_adult_home` | Whether donors under 18 must confirm an adult will be home | true |
| `max_item_value` | Highest value allowed for one item, in dollars | 5000 |
| `max_active_listings_per_donor` | Listings one donor can have open at once | 10 |
| `report_hide_threshold` | Reports from different people before a listing is hidden for review | 3 |

The pickup rules in this table are safety decisions. Change them only after CoW's board has agreed (see `SAFETY_POLICY_DRAFT.md`).

The database refuses values that make no sense, such as a negative goal or a pickup age under 13. If a change won't save, that is why.

---

## Part 3: Links (needs a new release)

The Zeffy donation link, social media links, and the website addresses are in `src/config.ts`. Changing them needs a new app release, so tell the developer.
