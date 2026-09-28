-- =============================================================================
-- CoW app: API layer (follows Supabase's security advisor)
--
-- Functions that run with extra power (SECURITY DEFINER) should not live in the
-- schema the API exposes. This moves the app's functions from 000400 into `private`,
-- unchanged, and puts thin wrappers with the SAME names and arguments in `public`.
-- The wrappers run with the caller's own permissions (SECURITY INVOKER), so the app
-- keeps calling e.g. supabase.rpc('create_item', ...) exactly as before.
--
-- Security is identical: every check still happens inside the private function.
-- =============================================================================

alter function public.impact_total set schema private;
alter function public.user_hours set schema private;
alter function public.my_stats set schema private;
alter function public.complete_profile set schema private;
alter function public.update_profile set schema private;
alter function public.accept_terms set schema private;
alter function public.request_ambassador set schema private;
alter function public.create_item set schema private;
alter function public.update_item set schema private;
alter function public.withdraw_item set schema private;
alter function public.request_pickups set schema private;
alter function public.respond_to_request set schema private;
alter function public.mark_collected set schema private;
alter function public.confirm_pickup set schema private;
alter function public.cancel_pickup set schema private;
alter function public.pickup_counterpart set schema private;
alter function public.block_user set schema private;
alter function public.unblock_user set schema private;
alter function public.my_blocked_users set schema private;
alter function public.report set schema private;
alter function public.delete_my_account set schema private;

-- -----------------------------------------------------------------------------
-- Public wrappers (what the app calls)
-- -----------------------------------------------------------------------------
create function public.impact_total()
returns numeric language sql stable security invoker set search_path = ''
as $$ select private.impact_total() $$;

create function public.user_hours(p_user_id uuid default null)
returns numeric language sql stable security invoker set search_path = ''
as $$ select private.user_hours(p_user_id) $$;

create function public.my_stats()
returns json language sql stable security invoker set search_path = ''
as $$ select private.my_stats() $$;

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
returns public.profiles language sql security invoker set search_path = ''
as $$
  select * from private.complete_profile(
    p_name, p_role, p_birth_year, p_birth_month, p_zip, p_terms_version,
    p_guardian_name, p_guardian_email, p_guardian_consent
  )
$$;

create function public.update_profile(
  p_name text,
  p_zip text,
  p_role public.user_role,
  p_guardian_name text default null,
  p_guardian_email text default null
)
returns public.profiles language sql security invoker set search_path = ''
as $$ select * from private.update_profile(p_name, p_zip, p_role, p_guardian_name, p_guardian_email) $$;

create function public.accept_terms(p_terms_version text)
returns void language sql security invoker set search_path = ''
as $$ select private.accept_terms(p_terms_version) $$;

create function public.request_ambassador()
returns void language sql security invoker set search_path = ''
as $$ select private.request_ambassador() $$;

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
returns uuid language sql security invoker set search_path = ''
as $$
  select private.create_item(
    p_category, p_title, p_value, p_condition, p_photo_path, p_window_start, p_window_end,
    p_street, p_town, p_zip, p_unit, p_pickup_note, p_exact_lat, p_exact_lng, p_adult_home_confirmed
  )
$$;

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
returns void language sql security invoker set search_path = ''
as $$
  select private.update_item(
    p_item_id, p_category, p_title, p_value, p_condition, p_photo_path, p_window_start, p_window_end,
    p_street, p_town, p_zip, p_unit, p_pickup_note, p_exact_lat, p_exact_lng, p_adult_home_confirmed
  )
$$;

create function public.withdraw_item(p_item_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.withdraw_item(p_item_id) $$;

create function public.request_pickups(p_item_ids uuid[], p_adult_attending boolean default false)
returns table (item_id uuid, pickup_id uuid, result text)
language sql security invoker set search_path = ''
as $$ select * from private.request_pickups(p_item_ids, p_adult_attending) $$;

create function public.respond_to_request(p_pickup_id uuid, p_accept boolean)
returns void language sql security invoker set search_path = ''
as $$ select private.respond_to_request(p_pickup_id, p_accept) $$;

create function public.mark_collected(p_pickup_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.mark_collected(p_pickup_id) $$;

create function public.confirm_pickup(p_pickup_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.confirm_pickup(p_pickup_id) $$;

create function public.cancel_pickup(p_pickup_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.cancel_pickup(p_pickup_id) $$;

create function public.pickup_counterpart(p_pickup_id uuid)
returns json language sql stable security invoker set search_path = ''
as $$ select private.pickup_counterpart(p_pickup_id) $$;

create function public.block_user(p_user_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.block_user(p_user_id) $$;

create function public.unblock_user(p_user_id uuid)
returns void language sql security invoker set search_path = ''
as $$ select private.unblock_user(p_user_id) $$;

create function public.my_blocked_users()
returns table (user_id uuid, display_name text, blocked_at timestamptz)
language sql stable security invoker set search_path = ''
as $$ select * from private.my_blocked_users() $$;

create function public.report(
  p_reason public.report_reason,
  p_details text default null,
  p_item_id uuid default null,
  p_pickup_id uuid default null,
  p_user_id uuid default null
)
returns uuid language sql security invoker set search_path = ''
as $$ select private.report(p_reason, p_details, p_item_id, p_pickup_id, p_user_id) $$;

create function public.delete_my_account()
returns void language sql security invoker set search_path = ''
as $$ select private.delete_my_account() $$;

-- -----------------------------------------------------------------------------
-- Who can call what
-- -----------------------------------------------------------------------------
revoke execute on all functions in schema public from public, anon, authenticated;

-- Signed-out visitors: only the public impact total (Welcome screen).
grant usage on schema private to anon;
grant execute on function public.impact_total() to anon, authenticated;
grant execute on function private.impact_total() to anon, authenticated;

-- Signed-in users: the app's functions (wrapper + the private function it calls).
grant execute on function
  public.user_hours, public.my_stats, public.complete_profile, public.update_profile,
  public.accept_terms, public.request_ambassador, public.create_item, public.update_item,
  public.withdraw_item, public.request_pickups, public.respond_to_request, public.mark_collected,
  public.confirm_pickup, public.cancel_pickup, public.pickup_counterpart, public.block_user,
  public.unblock_user, public.my_blocked_users, public.report, public.delete_my_account
to authenticated;

grant execute on function
  private.user_hours, private.my_stats, private.complete_profile, private.update_profile,
  private.accept_terms, private.request_ambassador, private.create_item, private.update_item,
  private.withdraw_item, private.request_pickups, private.respond_to_request, private.mark_collected,
  private.confirm_pickup, private.cancel_pickup, private.pickup_counterpart, private.block_user,
  private.unblock_user, private.my_blocked_users, private.report, private.delete_my_account
to authenticated;

-- The impact ledger is never read directly (only through impact_total()). This rule
-- states that explicitly (the table has no read permission for app users either).
create policy "No direct access; use impact_total()"
  on public.impact_ledger for select
  to authenticated
  using (false);
