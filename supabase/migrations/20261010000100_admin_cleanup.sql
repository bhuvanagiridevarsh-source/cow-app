-- =============================================================================
-- CoW app: admin command to remove unfinished sign-ups
--
-- A "sign-up" becomes a login the moment someone enters an email code, before they give
-- their name or accept the Terms. If they stop there (or an under-13 sign-in happened while
-- the phone was offline), an empty login with only an email address is left behind.
-- This removes those, so CoW never keeps an email it has no reason to keep.
--
-- Only logins with NO profile are touched, and only once they are at least a day old
-- (so nobody halfway through signing up is interrupted).
--
-- In the Supabase dashboard -> SQL Editor:
--   select admin.cleanup_unfinished_signups();        -- older than 24 hours
--   select admin.cleanup_unfinished_signups(72);      -- older than 72 hours
-- =============================================================================
create function admin.cleanup_unfinished_signups(p_older_than_hours integer default 24)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_older_than_hours is null or p_older_than_hours < 1 then
    raise exception 'Choose a number of hours of 1 or more.';
  end if;
  with removed as (
    delete from auth.users u
    where u.created_at < now() - make_interval(hours => p_older_than_hours)
      and not exists (select 1 from public.profiles p where p.id = u.id)
    returning u.id
  )
  select count(*) into v_count from removed;
  return 'Removed ' || v_count || ' unfinished sign-up' || case when v_count = 1 then '' else 's' end || '.';
end;
$$;

revoke all on function admin.cleanup_unfinished_signups(integer) from public, anon, authenticated;
