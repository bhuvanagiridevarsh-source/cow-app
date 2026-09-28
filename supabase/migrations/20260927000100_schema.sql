-- =============================================================================
-- CoW app: core schema (tables, types, indexes, housekeeping triggers)
--
-- Security model (see docs/PLAN.md §6-7):
--   * Every table has Row Level Security (policies: 20260927000300_security_rules.sql).
--   * The app never writes to tables directly. Writes go through functions that
--     check who is calling (20260927000400_functions.sql).
--   * Two schemas are NOT exposed through the API:
--       private: helper functions used by the security rules and app functions
--       admin:   copy-paste commands for CoW admins in the dashboard (docs/ADMIN_GUIDE.md)
-- =============================================================================

create schema if not exists private;
create schema if not exists admin;
revoke all on schema private from public;
revoke all on schema admin from public;

-- Fail closed: by default Supabase lets the public API roles use every new table and
-- function in `public`. Here, new objects get no API access until a migration grants it.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private revoke execute on functions from public;
alter default privileges for role postgres in schema admin revoke execute on functions from public;

-- -----------------------------------------------------------------------------
-- Types
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('donor', 'volunteer', 'ambassador');
create type public.item_category as enum ('furniture', 'electronics', 'appliances', 'other');
create type public.item_condition as enum ('new', 'good', 'fair');
create type public.item_status as enum (
  'listed', 'requested', 'accepted', 'collected', 'confirmed', 'withdrawn', 'removed'
);
create type public.pickup_status as enum (
  'requested', 'accepted', 'declined', 'cancelled', 'collected', 'confirmed'
);
create type public.report_reason as enum (
  'fake_listing', 'inappropriate', 'unsafe', 'no_show', 'harassment', 'other'
);
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- -----------------------------------------------------------------------------
-- settings: one row of switches CoW's board controls (docs/SAFETY_POLICY_DRAFT.md).
-- Edit in the dashboard: Table Editor -> settings.
-- -----------------------------------------------------------------------------
create table public.settings (
  id boolean primary key default true constraint settings_single_row check (id),
  goal_amount numeric(12, 2) not null default 25000 check (goal_amount > 0),
  goal_label text not null default '3-year goal' check (char_length(goal_label) between 1 and 60),
  base_impact_amount numeric(12, 2) not null default 5000 check (base_impact_amount >= 0),
  min_pickup_age integer not null default 16 check (min_pickup_age between 13 and 25),
  minors_require_adult_on_pickup boolean not null default true,
  hours_per_pickup numeric(4, 2) not null default 1 check (hours_per_pickup > 0 and hours_per_pickup <= 8),
  max_active_claims_volunteer integer not null default 1 check (max_active_claims_volunteer between 1 and 20),
  max_active_claims_ambassador integer not null default 5 check (max_active_claims_ambassador between 1 and 50),
  allowed_zip_prefixes text[] not null default array[
    '070', '071', '072', '073', '074', '075', '076', '077', '078', '079',
    '080', '081', '082', '083', '084', '085', '086', '087', '088', '089'
  ] check (array_to_string(allowed_zip_prefixes, ',') ~ '^[0-9]{3}(,[0-9]{3})*$'),
  minor_donors_require_adult_home boolean not null default true,
  max_item_value integer not null default 5000 check (max_item_value between 1 and 100000),
  max_active_listings_per_donor integer not null default 10 check (max_active_listings_per_donor between 1 and 100),
  report_hide_threshold integer not null default 3 check (report_hide_threshold between 1 and 50),
  updated_at timestamptz not null default now()
);

comment on table public.settings is 'One row of switches set by CoW''s board. Changes apply in the app right away.';
comment on column public.settings.goal_amount is 'Impact goal in dollars (e.g. 25000).';
comment on column public.settings.goal_label is 'Shown under the impact meter, e.g. "3-year goal".';
comment on column public.settings.base_impact_amount is 'Impact already achieved before the app (starting amount).';
comment on column public.settings.min_pickup_age is 'Youngest age allowed to do pickups.';
comment on column public.settings.minors_require_adult_on_pickup is 'If true, volunteers under 18 must confirm an adult will come on every pickup.';
comment on column public.settings.hours_per_pickup is 'Volunteer hours awarded for each confirmed pickup.';
comment on column public.settings.max_active_claims_volunteer is 'Pickups a regular volunteer can have in progress at once.';
comment on column public.settings.max_active_claims_ambassador is 'Pickups a verified Ambassador can have in progress at once.';
comment on column public.settings.allowed_zip_prefixes is 'Service area: first 3 digits of allowed ZIP codes. Default = all of New Jersey (070-089).';
comment on column public.settings.minor_donors_require_adult_home is 'If true, donors under 18 must confirm a parent approves and an adult will be home at pickup.';
comment on column public.settings.max_item_value is 'Highest estimated value (dollars) allowed for one item.';
comment on column public.settings.max_active_listings_per_donor is 'Most listings one donor can have open at once.';
comment on column public.settings.report_hide_threshold is 'A listing is hidden automatically once this many different people report it.';

insert into public.settings default values;

-- -----------------------------------------------------------------------------
-- zip_centroids: ZIP -> approximate map point (public US Census data), used only
-- for approximate distances. Seeded in 20260927000200_zip_centroids_seed.sql.
-- -----------------------------------------------------------------------------
create table public.zip_centroids (
  zip text primary key check (zip ~ '^[0-9]{5}$'),
  lat double precision not null check (lat between -90 and 90),
  lng double precision not null check (lng between -180 and 180)
);

-- -----------------------------------------------------------------------------
-- profiles: one per account. Private: only the person themselves and admins can read it.
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  role public.user_role not null,
  verified_ambassador boolean not null default false,
  ambassador_requested_at timestamptz,
  is_admin boolean not null default false,
  birth_year smallint not null check (birth_year between 1900 and 2100),
  birth_month smallint not null check (birth_month between 1 and 12),
  zip text not null check (zip ~ '^[0-9]{5}$'),
  guardian_name text check (guardian_name is null or char_length(btrim(guardian_name)) between 1 and 80),
  guardian_email text check (
    guardian_email is null
    or (char_length(guardian_email) <= 254 and guardian_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
  ),
  guardian_consent_at timestamptz,
  accepted_terms_at timestamptz not null,
  terms_version text not null check (char_length(terms_version) between 1 and 40),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_guardian_complete check ((guardian_name is null) = (guardian_email is null)),
  constraint profiles_guardian_consent check (guardian_consent_at is null or guardian_name is not null)
);

comment on column public.profiles.role is 'What the person chose at sign-up. Everyone can both donate and volunteer.';
comment on column public.profiles.verified_ambassador is 'Set by a CoW admin (admin.verify_ambassador). Lets them claim several items at once.';
comment on column public.profiles.is_admin is 'CoW admin. Set only with admin.set_admin(email).';

-- -----------------------------------------------------------------------------
-- items: donated things. Everyone signed in sees the town and approximate location only.
-- The street, unit, ZIP and exact location live in item_addresses (private).
-- -----------------------------------------------------------------------------
create table public.items (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles (id) on delete cascade,
  category public.item_category not null,
  title text not null check (char_length(btrim(title)) between 3 and 60),
  value integer not null check (value >= 1),
  condition public.item_condition not null,
  photo_path text not null check (char_length(photo_path) between 1 and 300),
  pickup_window_start timestamptz not null,
  pickup_window_end timestamptz not null,
  town text not null check (char_length(btrim(town)) between 2 and 60),
  approx_lat double precision check (approx_lat between -90 and 90),
  approx_lng double precision check (approx_lng between -180 and 180),
  status public.item_status not null default 'listed',
  adult_home_confirmed boolean not null default false,
  hidden_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  confirmed_at timestamptz,
  constraint items_window_order check (pickup_window_end > pickup_window_start),
  constraint items_window_length check (pickup_window_end - pickup_window_start <= interval '12 hours')
);

comment on column public.items.value is 'Estimated value in whole dollars. Counts toward the impact total once confirmed.';
comment on column public.items.approx_lat is 'Rounded to ~1 km (2 decimals). Never the exact location.';
comment on column public.items.hidden_at is 'Set automatically when enough people report the listing. Clear with admin.unhide_item.';

-- -----------------------------------------------------------------------------
-- item_addresses: the private part of a listing. Readable only by the donor, admins,
-- and the one volunteer the donor accepted (while that pickup is in progress).
-- -----------------------------------------------------------------------------
create table public.item_addresses (
  item_id uuid primary key references public.items (id) on delete cascade,
  street text not null check (char_length(btrim(street)) between 3 and 120),
  unit text check (unit is null or char_length(unit) <= 30),
  zip text not null check (zip ~ '^[0-9]{5}$'),
  pickup_note text check (pickup_note is null or char_length(pickup_note) <= 200),
  exact_lat double precision check (exact_lat between -90 and 90),
  exact_lng double precision check (exact_lng between -180 and 180)
);

-- -----------------------------------------------------------------------------
-- pickups: one row per request. Keeps a copy of the item's title/category/value so a
-- volunteer's history (and hours) survive if the donor later deletes their account.
-- -----------------------------------------------------------------------------
create table public.pickups (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references public.items (id) on delete set null,
  donor_id uuid references public.profiles (id) on delete set null,
  volunteer_id uuid references public.profiles (id) on delete set null,
  adult_attending boolean not null default false,
  status public.pickup_status not null default 'requested',
  requested_at timestamptz not null default now(),
  accepted_at timestamptz,
  collected_at timestamptz,
  confirmed_at timestamptz,
  closed_at timestamptz,
  cancelled_by uuid references public.profiles (id) on delete set null,
  confirmed_by uuid references public.profiles (id) on delete set null,
  hours_awarded numeric(4, 2) not null default 0 check (hours_awarded >= 0 and hours_awarded <= 8),
  item_title text not null,
  item_category public.item_category not null,
  item_value integer not null check (item_value >= 0)
);

comment on column public.pickups.hours_awarded is 'Set only when the donor or an admin confirms the pickup.';

-- At most one request/pickup in progress (or confirmed) per item.
create unique index pickups_one_active_per_item
  on public.pickups (item_id)
  where status in ('requested', 'accepted', 'collected', 'confirmed');

-- -----------------------------------------------------------------------------
-- impact_ledger: one anonymous row per confirmed pickup (amount only, no names), so the
-- public impact total never drops when someone deletes their account.
-- -----------------------------------------------------------------------------
create table public.impact_ledger (
  id bigint generated always as identity primary key,
  pickup_id uuid unique references public.pickups (id) on delete set null,
  amount integer not null check (amount >= 0),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- reports: "Report" on a listing, pickup, or person. Reviewed by CoW admins.
-- (No "must have a target" check here: targets become NULL when accounts are deleted.
--  The report() function requires a target when a report is created.)
-- -----------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references public.profiles (id) on delete set null,
  item_id uuid references public.items (id) on delete set null,
  pickup_id uuid references public.pickups (id) on delete set null,
  reported_user_id uuid references public.profiles (id) on delete set null,
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 500),
  status public.report_status not null default 'open',
  admin_notes text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

-- -----------------------------------------------------------------------------
-- blocks: "Block" another person. Hides both people's listings from each other and
-- stops pickups between them.
-- -----------------------------------------------------------------------------
create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

-- -----------------------------------------------------------------------------
-- Indexes (browse, "my stuff" lists, security-rule lookups, foreign keys)
-- -----------------------------------------------------------------------------
create index items_browse_idx on public.items (status, pickup_window_end) where hidden_at is null;
create index items_donor_idx on public.items (donor_id);
create index items_photo_path_idx on public.items (photo_path);
create index pickups_item_idx on public.pickups (item_id);
create index pickups_volunteer_idx on public.pickups (volunteer_id, status);
create index pickups_donor_idx on public.pickups (donor_id, status);
create index pickups_cancelled_by_idx on public.pickups (cancelled_by);
create index pickups_confirmed_by_idx on public.pickups (confirmed_by);
create index reports_item_idx on public.reports (item_id);
create index reports_pickup_idx on public.reports (pickup_id);
create index reports_reporter_idx on public.reports (reporter_id, created_at);
create index reports_reported_user_idx on public.reports (reported_user_id);
create index blocks_blocked_idx on public.blocks (blocked_id);

-- -----------------------------------------------------------------------------
-- Housekeeping triggers
-- -----------------------------------------------------------------------------
create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger settings_touch before update on public.settings
  for each row execute function private.touch_updated_at();
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();
create trigger items_touch before update on public.items
  for each row execute function private.touch_updated_at();

-- The single settings row must always exist (the app's rules read it).
create function private.prevent_settings_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'The settings row cannot be deleted. Edit its values instead.';
end;
$$;

create trigger settings_no_delete before delete on public.settings
  for each row execute function private.prevent_settings_delete();
