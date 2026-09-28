-- =============================================================================
-- CoW app: the only ways data changes
--
-- The app calls these functions (Supabase "RPC"). Each one checks who is calling
-- (auth.uid()) and the board's settings before changing anything. Errors are
-- short codes like COW_CLAIM_LIMIT that the app turns into friendly messages
-- (src/features/errors.ts).
--
-- Guard triggers at the bottom refuse invalid status moves for EVERYONE, including
-- edits made by hand in the dashboard.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Guards: the pickup loop can only move in allowed steps (docs/PLAN.md §5)
-- -----------------------------------------------------------------------------
create function private.guard_item_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'listed' or new.hidden_at is not null or new.confirmed_at is not null then
    raise exception 'COW_INVALID_TRANSITION' using detail = 'New items must start as listed.';
  end if;
  return new;
end;
$$;

create function private.guard_item_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.donor_id is distinct from old.donor_id
     or new.created_at is distinct from old.created_at then
    raise exception 'COW_IMMUTABLE_FIELD';
  end if;
  if new.status is distinct from old.status and not (
       (old.status = 'listed'    and new.status in ('requested', 'withdrawn', 'removed'))
    or (old.status = 'requested' and new.status in ('listed', 'accepted', 'withdrawn', 'removed'))
    or (old.status = 'accepted'  and new.status in ('listed', 'collected', 'withdrawn', 'removed'))
    or (old.status = 'collected' and new.status in ('confirmed', 'listed', 'removed'))
  ) then
    raise exception 'COW_INVALID_TRANSITION'
      using detail = format('Item cannot go from %s to %s.', old.status, new.status);
  end if;
  return new;
end;
$$;

create function private.guard_pickup_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'requested'
     or new.hours_awarded <> 0
     or new.accepted_at is not null
     or new.collected_at is not null
     or new.confirmed_at is not null then
    raise exception 'COW_INVALID_TRANSITION' using detail = 'New pickups must start as requested with 0 hours.';
  end if;
  return new;
end;
$$;

create function private.guard_pickup_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- The item copy and the people on a pickup never change. (People/items may only
  -- become NULL, which happens automatically when an account is deleted.)
  if new.id is distinct from old.id
     or new.item_title is distinct from old.item_title
     or new.item_category is distinct from old.item_category
     or new.item_value is distinct from old.item_value
     or new.requested_at is distinct from old.requested_at
     or new.adult_attending is distinct from old.adult_attending
     or (new.item_id is distinct from old.item_id and new.item_id is not null)
     or (new.donor_id is distinct from old.donor_id and new.donor_id is not null)
     or (new.volunteer_id is distinct from old.volunteer_id and new.volunteer_id is not null) then
    raise exception 'COW_IMMUTABLE_FIELD';
  end if;
  if new.status is distinct from old.status and not (
       (old.status = 'requested' and new.status in ('accepted', 'declined', 'cancelled'))
    or (old.status = 'accepted'  and new.status in ('collected', 'cancelled'))
    or (old.status = 'collected' and new.status in ('confirmed', 'cancelled'))
  ) then
    raise exception 'COW_INVALID_TRANSITION'
      using detail = format('Pickup cannot go from %s to %s.', old.status, new.status);
  end if;
  if new.hours_awarded is distinct from old.hours_awarded and new.status <> 'confirmed' then
    raise exception 'COW_INVALID_TRANSITION' using detail = 'Hours are only awarded when a pickup is confirmed.';
  end if;
  return new;
end;
$$;

create trigger items_guard_insert before insert on public.items
  for each row execute function private.guard_item_insert();
create trigger items_guard_update before update on public.items
  for each row execute function private.guard_item_update();
create trigger pickups_guard_insert before insert on public.pickups
  for each row execute function private.guard_pickup_insert();
create trigger pickups_guard_update before update on public.pickups
  for each row execute function private.guard_pickup_update();

-- -----------------------------------------------------------------------------
-- Shared steps (private: only called by the functions below and admin commands)
-- -----------------------------------------------------------------------------

-- Cancel a pickup and put its item back on the list.
create function private.do_cancel(p_pickup_id uuid, p_actor uuid, p_include_collected boolean default false)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.pickups;
begin
  select * into v from public.pickups where id = p_pickup_id for update;
  if not found then
    raise exception 'COW_NOT_FOUND';
  end if;
  if not (v.status in ('requested', 'accepted') or (p_include_collected and v.status = 'collected')) then
    raise exception 'COW_INVALID_TRANSITION';
  end if;
  update public.pickups
    set status = 'cancelled', closed_at = now(), cancelled_by = p_actor
    where id = v.id;
  if v.item_id is not null then
    update public.items set status = 'listed'
      where id = v.item_id and status in ('requested', 'accepted', 'collected');
  end if;
end;
$$;

-- Confirm a picked-up item: award hours, mark the item done, add its value to the impact total.
create function private.do_confirm(p_pickup_id uuid, p_actor uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.pickups;
  v_hours numeric(4, 2);
begin
  select * into v from public.pickups where id = p_pickup_id for update;
  if not found then
    raise exception 'COW_NOT_FOUND';
  end if;
  if v.status <> 'collected' then
    raise exception 'COW_INVALID_TRANSITION';
  end if;
  select case when v.volunteer_id is null then 0 else s.hours_per_pickup end
    into v_hours from public.settings s where s.id;
  update public.pickups
    set status = 'confirmed', confirmed_at = now(), confirmed_by = p_actor, hours_awarded = v_hours
    where id = v.id;
  if v.item_id is not null then
    update public.items set status = 'confirmed', confirmed_at = now() where id = v.item_id;
  end if;
  insert into public.impact_ledger (pickup_id, amount)
    values (v.id, v.item_value)
    on conflict (pickup_id) do nothing;
end;
$$;

-- All the rules a listing must meet (used by create_item and update_item).
create function private.validate_item(
  p_donor public.profiles,
  p_title text,
  p_value integer,
  p_photo_path text,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_street text,
  p_unit text,
  p_town text,
  p_zip text,
  p_pickup_note text,
  p_adult_home_confirmed boolean
)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  s public.settings;
begin
  select * into s from public.settings where id;
  if p_title is null or char_length(btrim(p_title)) not between 3 and 60 then
    raise exception 'COW_BAD_TITLE';
  end if;
  if p_value is null or p_value < 1 then
    raise exception 'COW_BAD_VALUE';
  end if;
  if p_value > s.max_item_value then
    raise exception 'COW_VALUE_TOO_HIGH' using detail = s.max_item_value::text;
  end if;
  -- The photo must be one the donor uploaded to their own folder.
  if p_photo_path is null
     or p_photo_path !~ ('^' || p_donor.id::text || '/[A-Za-z0-9_-]{8,64}\.jpg$')
     or not exists (
       select 1 from storage.objects o where o.bucket_id = 'item-photos' and o.name = p_photo_path
     ) then
    raise exception 'COW_PHOTO_MISSING';
  end if;
  if p_window_start is null or p_window_end is null
     or p_window_end <= p_window_start
     or p_window_end - p_window_start > interval '12 hours'
     or p_window_end - p_window_start < interval '1 hour'
     or p_window_end < now() + interval '30 minutes'
     or p_window_start > now() + interval '31 days' then
    raise exception 'COW_BAD_WINDOW';
  end if;
  if p_street is null or char_length(btrim(p_street)) not between 3 and 120
     or p_town is null or char_length(btrim(p_town)) not between 2 and 60
     or char_length(coalesce(p_unit, '')) > 30
     or char_length(coalesce(p_pickup_note, '')) > 200 then
    raise exception 'COW_BAD_ADDRESS';
  end if;
  if coalesce(p_zip, '') !~ '^[0-9]{5}$' then
    raise exception 'COW_BAD_ZIP';
  end if;
  if not private.zip_allowed(p_zip) then
    raise exception 'COW_OUT_OF_AREA';
  end if;
  if s.minor_donors_require_adult_home
     and private.min_age(p_donor.birth_year, p_donor.birth_month) < 18
     and not coalesce(p_adult_home_confirmed, false) then
    raise exception 'COW_ADULT_HOME_REQUIRED';
  end if;
end;
$$;

-- Approximate map point for a listing: the phone's geocoded address rounded to ~1 km
-- (2 decimals), or the ZIP's census point if geocoding wasn't possible.
create function private.approx_point(
  p_zip text,
  p_lat double precision,
  p_lng double precision,
  out approx_lat double precision,
  out approx_lng double precision,
  out exact_ok boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  -- Only trust coordinates in the NJ region (anything else is ignored).
  if p_lat between 38 and 46 and p_lng between -81 and -71 then
    approx_lat := round(p_lat::numeric, 2);
    approx_lng := round(p_lng::numeric, 2);
    exact_ok := true;
  else
    select round(z.lat::numeric, 2), round(z.lng::numeric, 2)
      into approx_lat, approx_lng
      from public.zip_centroids z where z.zip = p_zip;
    exact_ok := false;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Impact
-- -----------------------------------------------------------------------------

-- Total impact = starting amount + value of every confirmed item. Public (Welcome screen).
create function public.impact_total()
returns numeric
language sql
stable
security definer
set search_path = ''
as $$
  select s.base_impact_amount + coalesce((select sum(l.amount) from public.impact_ledger l), 0)
  from public.settings s
  where s.id;
$$;

-- Hours a volunteer has earned (confirmed pickups only). Yourself, or any user for admins.
create function public.user_hours(p_user_id uuid default null)
returns numeric
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_target uuid := coalesce(p_user_id, (select auth.uid()));
begin
  if v_target is null then
    raise exception 'COW_NOT_SIGNED_IN';
  end if;
  if v_target is distinct from (select auth.uid()) and not private.is_admin() then
    raise exception 'COW_FORBIDDEN';
  end if;
  return (
    select coalesce(sum(p.hours_awarded), 0)
    from public.pickups p
    where p.volunteer_id = v_target and p.status = 'confirmed'
  );
end;
$$;

-- Everything the Hours tab and the request buttons need to know about "me".
create function public.my_stats()
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_me public.profiles;
  s public.settings;
  v_age integer;
  v_hours numeric;
  v_count integer;
  v_collected bigint;
  v_donated bigint;
begin
  select * into v_me from public.profiles where id = (select auth.uid());
  if not found then
    raise exception 'COW_PROFILE_REQUIRED';
  end if;
  select * into s from public.settings where id;
  v_age := private.min_age(v_me.birth_year, v_me.birth_month);

  select coalesce(sum(p.hours_awarded), 0), count(*), coalesce(sum(p.item_value), 0)
    into v_hours, v_count, v_collected
    from public.pickups p
    where p.volunteer_id = v_me.id and p.status = 'confirmed';

  select coalesce(sum(i.value), 0) into v_donated
    from public.items i
    where i.donor_id = v_me.id and i.status = 'confirmed';

  return json_build_object(
    'hours', v_hours,
    'pickups_confirmed', v_count,
    'value_collected', v_collected,
    'value_donated', v_donated,
    'tier_value', v_collected + v_donated,
    'active_claims', private.active_claims(v_me.id),
    'claim_limit', case when v_me.verified_ambassador
                        then s.max_active_claims_ambassador
                        else s.max_active_claims_volunteer end,
    'active_listings', (
      select count(*) from public.items i
      where i.donor_id = v_me.id and i.status in ('listed', 'requested', 'accepted', 'collected')
    ),
    'listing_limit', s.max_active_listings_per_donor,
    'is_minor', v_age < 18,
    'can_pick_up', v_age >= s.min_pickup_age,
    'needs_adult_on_pickup', v_age < 18 and s.minors_require_adult_on_pickup,
    'needs_adult_home', v_age < 18 and s.minor_donors_require_adult_home
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Profile
-- -----------------------------------------------------------------------------

-- Finish sign-up. The age gate is checked again here (the app checks first, before
-- asking for an email). If this says COW_UNDER_13, the app deletes the new login at once.
create function public.complete_profile(
  p_name text,
  p_role public.user_role,
  p_birth_year integer,
  p_birth_month integer,
  p_zip text,
  p_terms_version text,
  p_guardian_name text default null,
  p_guardian_email text default null,
  p_guardian_consent boolean default false
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_age integer;
  v_minor boolean;
  v_profile public.profiles;
begin
  if v_uid is null then
    raise exception 'COW_NOT_SIGNED_IN';
  end if;
  if exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'COW_PROFILE_EXISTS';
  end if;
  if p_birth_month is null or p_birth_month not between 1 and 12
     or p_birth_year is null
     or p_birth_year not between 1900 and extract(year from private.ny_today())::integer then
    raise exception 'COW_BAD_BIRTH_DATE';
  end if;
  v_age := private.min_age(p_birth_year, p_birth_month);
  if v_age < 13 then
    raise exception 'COW_UNDER_13';
  end if;
  v_minor := v_age < 18;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then
    raise exception 'COW_BAD_NAME';
  end if;
  if coalesce(p_zip, '') !~ '^[0-9]{5}$' then
    raise exception 'COW_BAD_ZIP';
  end if;
  if p_role is null then
    raise exception 'COW_BAD_ROLE';
  end if;
  if p_terms_version is null or char_length(btrim(p_terms_version)) not between 1 and 40 then
    raise exception 'COW_TERMS_REQUIRED';
  end if;
  if v_minor then
    if coalesce(btrim(p_guardian_name), '') = ''
       or coalesce(btrim(p_guardian_email), '') = ''
       or not coalesce(p_guardian_consent, false) then
      raise exception 'COW_GUARDIAN_REQUIRED';
    end if;
    if char_length(btrim(p_guardian_name)) > 80 then
      raise exception 'COW_GUARDIAN_REQUIRED';
    end if;
    if btrim(p_guardian_email) !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(btrim(p_guardian_email)) > 254 then
      raise exception 'COW_BAD_GUARDIAN_EMAIL';
    end if;
  end if;

  insert into public.profiles (
    id, name, role, ambassador_requested_at, birth_year, birth_month, zip,
    guardian_name, guardian_email, guardian_consent_at, accepted_terms_at, terms_version
  ) values (
    v_uid, btrim(p_name), p_role,
    case when p_role = 'ambassador' then now() end,
    p_birth_year, p_birth_month, p_zip,
    case when v_minor then btrim(p_guardian_name) end,
    case when v_minor then lower(btrim(p_guardian_email)) end,
    case when v_minor then now() end,
    now(), btrim(p_terms_version)
  )
  returning * into v_profile;
  return v_profile;
end;
$$;

-- Edit name, ZIP, role, and (for minors) guardian details. Birth month/year and
-- admin/ambassador status can't be changed here.
create function public.update_profile(
  p_name text,
  p_zip text,
  p_role public.user_role,
  p_guardian_name text default null,
  p_guardian_email text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_me public.profiles;
begin
  select * into v_me from public.profiles where id = (select auth.uid()) for update;
  if not found then
    raise exception 'COW_PROFILE_REQUIRED';
  end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 80 then
    raise exception 'COW_BAD_NAME';
  end if;
  if coalesce(p_zip, '') !~ '^[0-9]{5}$' then
    raise exception 'COW_BAD_ZIP';
  end if;
  if p_role is null then
    raise exception 'COW_BAD_ROLE';
  end if;
  if p_guardian_name is not null or p_guardian_email is not null then
    if coalesce(btrim(p_guardian_name), '') = '' or char_length(btrim(p_guardian_name)) > 80 then
      raise exception 'COW_GUARDIAN_REQUIRED';
    end if;
    if coalesce(btrim(p_guardian_email), '') !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
       or char_length(btrim(p_guardian_email)) > 254 then
      raise exception 'COW_BAD_GUARDIAN_EMAIL';
    end if;
  end if;

  update public.profiles set
    name = btrim(p_name),
    zip = p_zip,
    role = p_role,
    ambassador_requested_at = case
      when p_role = 'ambassador' and not verified_ambassador
        then coalesce(ambassador_requested_at, now())
      else ambassador_requested_at end,
    guardian_name = coalesce(btrim(p_guardian_name), guardian_name),
    guardian_email = coalesce(lower(btrim(p_guardian_email)), guardian_email)
  where id = v_me.id
  returning * into v_me;
  return v_me;
end;
$$;

-- Accept a new version of the Terms of Use.
create function public.accept_terms(p_terms_version text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_terms_version is null or char_length(btrim(p_terms_version)) not between 1 and 40 then
    raise exception 'COW_TERMS_REQUIRED';
  end if;
  update public.profiles
    set accepted_terms_at = now(), terms_version = btrim(p_terms_version)
    where id = (select auth.uid());
  if not found then
    raise exception 'COW_PROFILE_REQUIRED';
  end if;
end;
$$;

-- Ask CoW to become a verified Ambassador (an admin approves it).
create function public.request_ambassador()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
    set ambassador_requested_at = coalesce(ambassador_requested_at, now())
    where id = (select auth.uid()) and not verified_ambassador;
  if not found and not exists (select 1 from public.profiles where id = (select auth.uid())) then
    raise exception 'COW_PROFILE_REQUIRED';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Listings (donor side)
-- -----------------------------------------------------------------------------
create function public.create_item(
  p_category public.item_category,
  p_title text,
  p_value integer,
  p_condition public.item_condition,
  p_photo_path text,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_street text,
  p_town text,
  p_zip text,
  p_unit text default null,
  p_pickup_note text default null,
  p_exact_lat double precision default null,
  p_exact_lng double precision default null,
  p_adult_home_confirmed boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_donor public.profiles;
  v_point record;
  v_limit integer;
  v_id uuid;
begin
  select * into v_donor from public.profiles where id = (select auth.uid());
  if not found then
    raise exception 'COW_PROFILE_REQUIRED';
  end if;
  if p_category is null or p_condition is null then
    raise exception 'COW_BAD_TITLE';
  end if;
  perform private.validate_item(
    v_donor, p_title, p_value, p_photo_path, p_window_start, p_window_end,
    p_street, p_unit, p_town, p_zip, p_pickup_note, p_adult_home_confirmed
  );
  select max_active_listings_per_donor into v_limit from public.settings where id;
  if (
    select count(*) from public.items i
    where i.donor_id = v_donor.id and i.status in ('listed', 'requested', 'accepted', 'collected')
  ) >= v_limit then
    raise exception 'COW_TOO_MANY_LISTINGS' using detail = v_limit::text;
  end if;

  select * into v_point from private.approx_point(p_zip, p_exact_lat, p_exact_lng);

  insert into public.items (
    donor_id, category, title, value, condition, photo_path,
    pickup_window_start, pickup_window_end, town, approx_lat, approx_lng, adult_home_confirmed
  ) values (
    v_donor.id, p_category, btrim(p_title), p_value, p_condition, p_photo_path,
    p_window_start, p_window_end, btrim(p_town), v_point.approx_lat, v_point.approx_lng,
    coalesce(p_adult_home_confirmed, false)
  )
  returning id into v_id;

  insert into public.item_addresses (item_id, street, unit, zip, pickup_note, exact_lat, exact_lng)
  values (
    v_id, btrim(p_street), nullif(btrim(p_unit), ''), p_zip, nullif(btrim(p_pickup_note), ''),
    case when v_point.exact_ok then p_exact_lat end,
    case when v_point.exact_ok then p_exact_lng end
  );
  return v_id;
end;
$$;

-- Edit a listing while it is still waiting for a volunteer.
create function public.update_item(
  p_item_id uuid,
  p_category public.item_category,
  p_title text,
  p_value integer,
  p_condition public.item_condition,
  p_photo_path text,
  p_window_start timestamptz,
  p_window_end timestamptz,
  p_street text,
  p_town text,
  p_zip text,
  p_unit text default null,
  p_pickup_note text default null,
  p_exact_lat double precision default null,
  p_exact_lng double precision default null,
  p_adult_home_confirmed boolean default false
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_donor public.profiles;
  v_item public.items;
  v_point record;
begin
  select * into v_donor from public.profiles where id = (select auth.uid());
  if not found then
    raise exception 'COW_PROFILE_REQUIRED';
  end if;
  select * into v_item from public.items where id = p_item_id for update;
  if not found or v_item.donor_id <> v_donor.id then
    raise exception 'COW_NOT_FOUND';
  end if;
  if v_item.status <> 'listed' then
    raise exception 'COW_NOT_EDITABLE';
  end if;
  if p_category is null or p_condition is null then
    raise exception 'COW_BAD_TITLE';
  end if;
  perform private.validate_item(
    v_donor, p_title, p_value, p_photo_path, p_window_start, p_window_end,
    p_street, p_unit, p_town, p_zip, p_pickup_note, p_adult_home_confirmed
  );
  select * into v_point from private.approx_point(p_zip, p_exact_lat, p_exact_lng);

  update public.items set
    category = p_category,
    title = btrim(p_title),
    value = p_value,
    condition = p_condition,
    photo_path = p_photo_path,
    pickup_window_start = p_window_start,
    pickup_window_end = p_window_end,
    town = btrim(p_town),
    approx_lat = v_point.approx_lat,
    approx_lng = v_point.approx_lng,
    adult_home_confirmed = coalesce(p_adult_home_confirmed, false)
  where id = p_item_id;

  update public.item_addresses set
    street = btrim(p_street),
    unit = nullif(btrim(p_unit), ''),
    zip = p_zip,
    pickup_note = nullif(btrim(p_pickup_note), ''),
    exact_lat = case when v_point.exact_ok then p_exact_lat end,
    exact_lng = case when v_point.exact_ok then p_exact_lng end
  where item_id = p_item_id;
end;
$$;

-- Take a listing down (cancels any request or scheduled pickup for it).
create function public.withdraw_item(p_item_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.items;
  v_pickup uuid;
begin
  select * into v_item from public.items where id = p_item_id for update;
  if not found or v_item.donor_id is distinct from (select auth.uid()) then
    raise exception 'COW_NOT_FOUND';
  end if;
  if v_item.status not in ('listed', 'requested', 'accepted') then
    raise exception 'COW_NOT_EDITABLE';
  end if;
  for v_pickup in
    select p.id from public.pickups p
    where p.item_id = p_item_id and p.status in ('requested', 'accepted')
  loop
    perform private.do_cancel(v_pickup, v_item.donor_id);
  end loop;
  update public.items set status = 'withdrawn' where id = p_item_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Pickups (the loop)
-- -----------------------------------------------------------------------------

-- Ask to pick up one item (or several at once for verified Ambassadors).
-- Returns one row per item: result = requested | unavailable | own_item | over_limit.
create function public.request_pickups(p_item_ids uuid[], p_adult_attending boolean default false)
returns table (item_id uuid, pickup_id uuid, result text)
language plpgsql
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_me public.profiles;
  s public.settings;
  v_age integer;
  v_available integer;
  v_id uuid;
  v_item public.items;
  v_new uuid;
begin
  select * into v_me from public.profiles pr where pr.id = (select auth.uid());
  if not found then
    raise exception 'COW_PROFILE_REQUIRED';
  end if;
  select * into s from public.settings st where st.id;

  if p_item_ids is null or cardinality(p_item_ids) = 0 then
    raise exception 'COW_NO_ITEMS';
  end if;
  if cardinality(p_item_ids) > 50 then
    raise exception 'COW_TOO_MANY_ITEMS';
  end if;

  v_age := private.min_age(v_me.birth_year, v_me.birth_month);
  if v_age < s.min_pickup_age then
    raise exception 'COW_TOO_YOUNG_FOR_PICKUP' using detail = s.min_pickup_age::text;
  end if;
  if v_age < 18 and s.minors_require_adult_on_pickup and not coalesce(p_adult_attending, false) then
    raise exception 'COW_ADULT_REQUIRED';
  end if;
  if (select count(distinct t.x) from unnest(p_item_ids) as t(x)) > 1 and not v_me.verified_ambassador then
    raise exception 'COW_AMBASSADOR_ONLY';
  end if;

  v_available := (case when v_me.verified_ambassador
                       then s.max_active_claims_ambassador
                       else s.max_active_claims_volunteer end)
                 - private.active_claims(v_me.id);
  if v_available <= 0 then
    raise exception 'COW_CLAIM_LIMIT';
  end if;

  for v_id in
    select u.id from unnest(p_item_ids) with ordinality as u(id, ord)
    group by u.id
    order by min(u.ord)
  loop
    item_id := v_id;
    pickup_id := null;
    select * into v_item from public.items i where i.id = v_id for update;
    if not found then
      result := 'unavailable';
    elsif v_item.donor_id = v_me.id then
      result := 'own_item';
    elsif v_item.status <> 'listed'
          or v_item.hidden_at is not null
          or v_item.pickup_window_end <= now()
          or private.is_blocked_between(v_me.id, v_item.donor_id) then
      -- (A block is reported as "unavailable" so nobody learns they were blocked.)
      result := 'unavailable';
    elsif v_available <= 0 then
      result := 'over_limit';
    else
      insert into public.pickups (
        item_id, donor_id, volunteer_id, adult_attending, item_title, item_category, item_value
      ) values (
        v_item.id, v_item.donor_id, v_me.id, coalesce(p_adult_attending, false),
        v_item.title, v_item.category, v_item.value
      )
      returning id into v_new;
      update public.items i set status = 'requested' where i.id = v_item.id;
      pickup_id := v_new;
      v_available := v_available - 1;
      result := 'requested';
    end if;
    return next;
  end loop;
end;
$$;

-- Donor accepts (reveals the address to this volunteer) or declines a request.
create function public.respond_to_request(p_pickup_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.pickups;
begin
  select * into v from public.pickups where id = p_pickup_id for update;
  if not found or v.donor_id is distinct from (select auth.uid()) then
    raise exception 'COW_NOT_FOUND';
  end if;
  if v.status <> 'requested' or p_accept is null then
    raise exception 'COW_INVALID_TRANSITION';
  end if;
  if p_accept then
    if v.volunteer_id is null or private.is_blocked_between(v.donor_id, v.volunteer_id) then
      raise exception 'COW_BLOCKED';
    end if;
    update public.pickups set status = 'accepted', accepted_at = now() where id = v.id;
    update public.items set status = 'accepted' where id = v.item_id;
  else
    update public.pickups set status = 'declined', closed_at = now() where id = v.id;
    update public.items set status = 'listed' where id = v.item_id and status = 'requested';
  end if;
end;
$$;

-- Volunteer says "I picked it up."
create function public.mark_collected(p_pickup_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.pickups;
begin
  select * into v from public.pickups where id = p_pickup_id for update;
  if not found or v.volunteer_id is distinct from (select auth.uid()) then
    raise exception 'COW_NOT_FOUND';
  end if;
  if v.status <> 'accepted' then
    raise exception 'COW_INVALID_TRANSITION';
  end if;
  update public.pickups set status = 'collected', collected_at = now() where id = v.id;
  if v.item_id is not null then
    update public.items set status = 'collected' where id = v.item_id;
  end if;
end;
$$;

-- Donor (or an admin) confirms the item was picked up. Hours and impact count only now.
create function public.confirm_pickup(p_pickup_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.pickups;
  v_uid uuid := (select auth.uid());
begin
  select * into v from public.pickups where id = p_pickup_id;
  -- coalesce: a deleted donor (NULL) must mean "not allowed", never "unknown".
  if not found or not (coalesce(v.donor_id = v_uid, false) or private.is_admin()) then
    raise exception 'COW_NOT_FOUND';
  end if;
  perform private.do_confirm(p_pickup_id, v_uid);
end;
$$;

-- Either side cancels before the item is picked up.
create function public.cancel_pickup(p_pickup_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v public.pickups;
  v_uid uuid := (select auth.uid());
begin
  select * into v from public.pickups where id = p_pickup_id;
  if not found
     or not (coalesce(v.volunteer_id = v_uid, false)
             or coalesce(v.donor_id = v_uid, false)
             or private.is_admin()) then
    raise exception 'COW_NOT_FOUND';
  end if;
  if v.status not in ('requested', 'accepted') then
    raise exception 'COW_INVALID_TRANSITION';
  end if;
  perform private.do_cancel(p_pickup_id, v_uid);
end;
$$;

-- What each side may know about the other: first name + last initial, badge, experience.
create function public.pickup_counterpart(p_pickup_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v public.pickups;
  v_uid uuid := (select auth.uid());
  v_other uuid;
  v_p public.profiles;
begin
  select * into v from public.pickups where id = p_pickup_id;
  if not found
     or not (coalesce(v.volunteer_id = v_uid, false)
             or coalesce(v.donor_id = v_uid, false)
             or private.is_admin()) then
    raise exception 'COW_NOT_FOUND';
  end if;
  v_other := case when v.volunteer_id = v_uid then v.donor_id else v.volunteer_id end;
  if v_other is null then
    return json_build_object('user_id', null, 'display_name', 'A former CoW member',
      'verified_ambassador', false, 'completed_pickups', 0);
  end if;
  select * into v_p from public.profiles where id = v_other;
  return json_build_object(
    'user_id', v_other,
    'display_name', private.display_name(v_p.name),
    'verified_ambassador', v_p.verified_ambassador,
    'completed_pickups', (
      select count(*) from public.pickups p where p.volunteer_id = v_other and p.status = 'confirmed'
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Safety: block and report
-- -----------------------------------------------------------------------------
create function public.block_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_pickup uuid;
begin
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'COW_PROFILE_REQUIRED';
  end if;
  if p_user_id is null or p_user_id = v_uid then
    raise exception 'COW_CANNOT_BLOCK_SELF';
  end if;
  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'COW_NOT_FOUND';
  end if;
  insert into public.blocks (blocker_id, blocked_id) values (v_uid, p_user_id)
    on conflict do nothing;
  -- Stop any pickup in progress between the two people.
  for v_pickup in
    select p.id from public.pickups p
    where p.status in ('requested', 'accepted')
      and ((p.volunteer_id = v_uid and p.donor_id = p_user_id)
        or (p.volunteer_id = p_user_id and p.donor_id = v_uid))
  loop
    perform private.do_cancel(v_pickup, v_uid);
  end loop;
end;
$$;

create function public.unblock_user(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.blocks where blocker_id = (select auth.uid()) and blocked_id = p_user_id;
$$;

create function public.my_blocked_users()
returns table (user_id uuid, display_name text, blocked_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select b.blocked_id, private.display_name(p.name), b.created_at
  from public.blocks b
  join public.profiles p on p.id = b.blocked_id
  where b.blocker_id = (select auth.uid())
  order by b.created_at desc;
$$;

-- Report a listing, a pickup, and/or a person. Enough different reporters auto-hide a listing.
create function public.report(
  p_reason public.report_reason,
  p_details text default null,
  p_item_id uuid default null,
  p_pickup_id uuid default null,
  p_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_item uuid := p_item_id;
  v_existing uuid;
  v_id uuid;
  v_threshold integer;
begin
  if not exists (select 1 from public.profiles where id = v_uid) then
    raise exception 'COW_PROFILE_REQUIRED';
  end if;
  if p_reason is null then
    raise exception 'COW_REPORT_TARGET_REQUIRED';
  end if;
  if p_item_id is null and p_pickup_id is null and p_user_id is null then
    raise exception 'COW_REPORT_TARGET_REQUIRED';
  end if;
  if char_length(coalesce(p_details, '')) > 500 then
    raise exception 'COW_BAD_DETAILS';
  end if;
  if (
    select count(*) from public.reports r
    where r.reporter_id = v_uid and r.created_at > now() - interval '24 hours'
  ) >= 20 then
    raise exception 'COW_TOO_MANY_REPORTS';
  end if;
  if p_item_id is not null and not exists (select 1 from public.items where id = p_item_id) then
    raise exception 'COW_NOT_FOUND';
  end if;
  if p_pickup_id is not null then
    -- You can only report pickups you are part of. Attach the pickup's item.
    select coalesce(v_item, p.item_id) into v_item
      from public.pickups p
      where p.id = p_pickup_id and (p.volunteer_id = v_uid or p.donor_id = v_uid);
    if not found then
      raise exception 'COW_NOT_FOUND';
    end if;
  end if;
  if p_user_id is not null and not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'COW_NOT_FOUND';
  end if;

  -- Reporting the same thing twice doesn't count twice.
  select r.id into v_existing from public.reports r
    where r.reporter_id = v_uid and r.status = 'open'
      and r.item_id is not distinct from v_item
      and r.pickup_id is not distinct from p_pickup_id
      and r.reported_user_id is not distinct from p_user_id
    limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.reports (reporter_id, item_id, pickup_id, reported_user_id, reason, details)
  values (v_uid, v_item, p_pickup_id, p_user_id, p_reason, nullif(btrim(p_details), ''))
  returning id into v_id;

  if v_item is not null then
    select report_hide_threshold into v_threshold from public.settings where id;
    if (
      select count(distinct r.reporter_id) from public.reports r
      where r.item_id = v_item and r.status = 'open'
    ) >= v_threshold then
      update public.items set hidden_at = coalesce(hidden_at, now()) where id = v_item;
    end if;
  end if;
  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Delete my account (Me -> Delete account)
-- The app first deletes the person's photos through the Storage API (Supabase doesn't
-- allow deleting files with SQL), then calls this. It removes only the caller's own data.
-- -----------------------------------------------------------------------------
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_pickup uuid;
begin
  if v_uid is null then
    raise exception 'COW_NOT_SIGNED_IN';
  end if;
  if exists (
    select 1 from storage.objects o
    where o.bucket_id = 'item-photos' and (storage.foldername(o.name))[1] = v_uid::text
  ) then
    raise exception 'COW_PHOTOS_REMAIN';
  end if;
  -- Cancel anything not yet picked up, so nobody is left waiting on a deleted account.
  for v_pickup in
    select p.id from public.pickups p
    where p.status in ('requested', 'accepted') and (p.volunteer_id = v_uid or p.donor_id = v_uid)
  loop
    perform private.do_cancel(v_pickup, v_uid);
  end loop;
  -- Deleting the login deletes the profile, their listings and addresses, and their blocks.
  -- Pickup history keeps no link to them; the anonymous impact amounts stay.
  delete from auth.users where id = v_uid;
end;
$$;

-- -----------------------------------------------------------------------------
-- Who can call what
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

grant execute on function public.impact_total() to anon, authenticated;
grant execute on function
  public.user_hours,
  public.my_stats,
  public.complete_profile,
  public.update_profile,
  public.accept_terms,
  public.request_ambassador,
  public.create_item,
  public.update_item,
  public.withdraw_item,
  public.request_pickups,
  public.respond_to_request,
  public.mark_collected,
  public.confirm_pickup,
  public.cancel_pickup,
  public.pickup_counterpart,
  public.block_user,
  public.unblock_user,
  public.my_blocked_users,
  public.report,
  public.delete_my_account
to authenticated;

-- The read rules call these two helpers.
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_blocked_between(uuid, uuid) to authenticated;
