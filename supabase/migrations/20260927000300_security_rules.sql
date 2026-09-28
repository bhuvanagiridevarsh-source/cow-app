-- =============================================================================
-- CoW app: security rules (Row Level Security) and API access
--
-- Plain-English summary of who can READ what (nobody can WRITE tables directly;
-- all changes go through the functions in 20260927000400_functions.sql):
--   settings, zip_centroids  everyone
--   profiles                 only yourself (and admins)
--   items                    open listings (not hidden, not expired, nobody blocked);
--                            plus your own items and items you've requested
--   item_addresses           the donor, admins, and the ONE volunteer the donor accepted,
--                            only while that pickup is accepted or picked up
--   pickups                  the volunteer and the donor on it (and admins)
--   reports                  the person who filed it (and admins)
--   blocks                   your own blocks
--   impact_ledger            nobody directly (read through impact_total())
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helpers used inside the rules. SECURITY DEFINER so they can check other tables
-- without being limited by those tables' own rules (and without loops).
-- -----------------------------------------------------------------------------
create function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and is_admin
  );
$$;

create function private.is_blocked_between(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.blocks
    where (blocker_id = a and blocked_id = b) or (blocker_id = b and blocked_id = a)
  );
$$;

-- Today's date in New Jersey.
create function private.ny_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/New_York')::date;
$$;

-- The youngest age someone born in (birth_year, birth_month) can be on a date.
-- If today is in or before their birth month, we assume the birthday hasn't happened yet.
-- Mirrors src/domain/age.ts (unit-tested there with the same cases).
create function private.min_age(p_birth_year integer, p_birth_month integer, p_on date default null)
returns integer
language sql
stable
set search_path = ''
as $$
  select extract(year from d)::integer - p_birth_year
         - case when extract(month from d)::integer > p_birth_month then 0 else 1 end
  from (select coalesce(p_on, private.ny_today()) as d) as t;
$$;

-- "Maya Patel" -> "Maya P."  (what other people see; never the full name)
create function private.display_name(p_name text)
returns text
language plpgsql
immutable
set search_path = ''
as $$
declare
  parts text[];
begin
  if p_name is null or btrim(p_name) = '' then
    return 'A CoW member';
  end if;
  parts := regexp_split_to_array(btrim(p_name), '\s+');
  if array_length(parts, 1) = 1 then
    return parts[1];
  end if;
  return parts[1] || ' ' || upper(left(parts[array_length(parts, 1)], 1)) || '.';
end;
$$;

-- Is this 5-digit ZIP inside the service area (settings.allowed_zip_prefixes)?
create function private.zip_allowed(p_zip text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(p_zip, '') ~ '^[0-9]{5}$'
     and exists (
       select 1 from public.settings s
       where s.id and left(p_zip, 3) = any (s.allowed_zip_prefixes)
     );
$$;

-- How many pickups a volunteer has in progress (counts toward their limit).
create function private.active_claims(p_volunteer uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.pickups
  where volunteer_id = p_volunteer
    and item_id is not null
    and status in ('requested', 'accepted', 'collected');
$$;

-- -----------------------------------------------------------------------------
-- Turn on Row Level Security everywhere
-- -----------------------------------------------------------------------------
alter table public.settings enable row level security;
alter table public.zip_centroids enable row level security;
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.item_addresses enable row level security;
alter table public.pickups enable row level security;
alter table public.impact_ledger enable row level security;
alter table public.reports enable row level security;
alter table public.blocks enable row level security;

-- -----------------------------------------------------------------------------
-- Read rules (there are deliberately NO insert/update/delete rules)
-- -----------------------------------------------------------------------------
create policy "Anyone can read the settings"
  on public.settings for select
  to anon, authenticated
  using (true);

create policy "Anyone can read ZIP locations"
  on public.zip_centroids for select
  to anon, authenticated
  using (true);

create policy "You can read your own profile"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select private.is_admin()));

create policy "Signed-in people can see open listings and their own"
  on public.items for select
  to authenticated
  using (
    donor_id = (select auth.uid())
    or (select private.is_admin())
    or (
      status = 'listed'
      and hidden_at is null
      and pickup_window_end > now()
      and not private.is_blocked_between(donor_id, (select auth.uid()))
    )
    or exists (
      select 1 from public.pickups p
      where p.item_id = items.id and p.volunteer_id = (select auth.uid())
    )
  );

create policy "Exact address: donor, admins, and the accepted volunteer only"
  on public.item_addresses for select
  to authenticated
  using (
    exists (
      select 1 from public.items i
      where i.id = item_addresses.item_id and i.donor_id = (select auth.uid())
    )
    or (select private.is_admin())
    or exists (
      select 1 from public.pickups p
      where p.item_id = item_addresses.item_id
        and p.volunteer_id = (select auth.uid())
        and p.status in ('accepted', 'collected')
    )
  );

create policy "You can see pickups you are part of"
  on public.pickups for select
  to authenticated
  using (
    volunteer_id = (select auth.uid())
    or donor_id = (select auth.uid())
    or (select private.is_admin())
  );

create policy "You can see reports you filed"
  on public.reports for select
  to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_admin()));

create policy "You can see who you blocked"
  on public.blocks for select
  to authenticated
  using (blocker_id = (select auth.uid()));

-- impact_ledger: RLS on, no rules -> no direct access.

-- -----------------------------------------------------------------------------
-- API access (table privileges). Read-only; writes happen only through functions.
-- -----------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select on public.settings, public.zip_centroids to anon, authenticated;
grant select on public.profiles, public.items, public.item_addresses, public.pickups,
  public.reports, public.blocks to authenticated;

-- The rules above call two helpers, so signed-in users need to be able to run just those.
grant usage on schema private to authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_blocked_between(uuid, uuid) to authenticated;
