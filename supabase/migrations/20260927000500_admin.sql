-- =============================================================================
-- CoW app: admin commands for CoW leaders (V1 has no in-app admin screens)
--
-- Use them in the Supabase dashboard -> SQL Editor. Copy-paste examples are in
-- docs/ADMIN_GUIDE.md. The `admin` schema is not exposed to the app, and only the
-- database owner (the dashboard) can run these.
-- =============================================================================

-- Look up an account by email. Raises a clear error if there isn't one.
create function admin.user_id(p_email text)
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v uuid;
begin
  select id into v from auth.users where lower(email) = lower(btrim(p_email));
  if v is null then
    raise exception 'No account found with the email %', p_email;
  end if;
  if not exists (select 1 from public.profiles where id = v) then
    raise exception '% has signed in but has not finished sign-up yet.', p_email;
  end if;
  return v;
end;
$$;

-- select admin.verify_ambassador('person@example.com');
create function admin.verify_ambassador(p_email text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_name text;
begin
  update public.profiles set verified_ambassador = true
    where id = admin.user_id(p_email)
    returning name into v_name;
  return 'Verified Ambassador: ' || v_name;
end;
$$;

-- select admin.remove_ambassador('person@example.com');
create function admin.remove_ambassador(p_email text)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_name text;
begin
  update public.profiles set verified_ambassador = false, ambassador_requested_at = null
    where id = admin.user_id(p_email)
    returning name into v_name;
  return 'No longer an Ambassador: ' || v_name;
end;
$$;

-- select admin.set_admin('leader@example.com');          -- make an admin
-- select admin.set_admin('leader@example.com', false);   -- remove admin
create function admin.set_admin(p_email text, p_is_admin boolean default true)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_name text;
begin
  update public.profiles set is_admin = p_is_admin
    where id = admin.user_id(p_email)
    returning name into v_name;
  return case when p_is_admin then 'Now an admin: ' else 'No longer an admin: ' end || v_name;
end;
$$;

-- Take down any listing. Any request or pickup in progress for it is cancelled.
-- select admin.remove_item('ITEM-ID');
create function admin.remove_item(p_item_id uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_pickup uuid;
  v_title text;
begin
  for v_pickup in
    select p.id from public.pickups p
    where p.item_id = p_item_id and p.status in ('requested', 'accepted', 'collected')
  loop
    perform private.do_cancel(v_pickup, null, true);
  end loop;
  update public.items set status = 'removed'
    where id = p_item_id and status in ('listed', 'requested', 'accepted', 'collected')
    returning title into v_title;
  if v_title is null then
    raise exception 'Item not found, or it is already finished (confirmed, withdrawn, or removed).';
  end if;
  return 'Removed: ' || v_title;
end;
$$;

-- Show a listing again after reviewing reports that auto-hid it.
-- select admin.unhide_item('ITEM-ID');
create function admin.unhide_item(p_item_id uuid)
returns text
language plpgsql
set search_path = ''
as $$
declare
  v_title text;
begin
  update public.items set hidden_at = null where id = p_item_id returning title into v_title;
  if v_title is null then
    raise exception 'Item not found.';
  end if;
  return 'Visible again: ' || v_title;
end;
$$;

-- Confirm a picked-up item when the donor can't (awards hours + impact).
-- select admin.confirm_pickup('PICKUP-ID');
create function admin.confirm_pickup(p_pickup_id uuid)
returns text
language plpgsql
set search_path = ''
as $$
begin
  perform private.do_confirm(p_pickup_id, null);
  return 'Pickup confirmed.';
end;
$$;

-- Cancel a pickup in any unfinished step (including "picked up" if that was a mistake).
-- select admin.cancel_pickup('PICKUP-ID');
create function admin.cancel_pickup(p_pickup_id uuid)
returns text
language plpgsql
set search_path = ''
as $$
begin
  perform private.do_cancel(p_pickup_id, null, true);
  return 'Pickup cancelled. The item is listed again.';
end;
$$;

-- Close a report.
-- select admin.resolve_report('REPORT-ID', 'Removed the listing');
-- select admin.resolve_report('REPORT-ID', 'Not a problem', 'dismissed');
create function admin.resolve_report(
  p_report_id uuid,
  p_notes text default null,
  p_status public.report_status default 'resolved'
)
returns text
language plpgsql
set search_path = ''
as $$
begin
  if p_status = 'open' then
    raise exception 'Use resolved or dismissed.';
  end if;
  update public.reports
    set status = p_status, admin_notes = p_notes, resolved_at = now()
    where id = p_report_id;
  if not found then
    raise exception 'Report not found.';
  end if;
  return 'Report ' || p_status::text || '.';
end;
$$;

-- -----------------------------------------------------------------------------
-- Ready-made lists (in the SQL Editor: select * from admin.open_reports;)
-- -----------------------------------------------------------------------------
create view admin.open_reports with (security_invoker = true) as
select
  r.id as report_id,
  r.created_at,
  r.reason,
  r.details,
  r.item_id,
  i.title as item_title,
  i.status as item_status,
  i.hidden_at as item_hidden_at,
  r.pickup_id,
  rp.name as reported_person,
  ru.email as reported_person_email,
  fp.name as reported_by,
  fu.email as reported_by_email
from public.reports r
left join public.items i on i.id = r.item_id
left join public.profiles rp on rp.id = r.reported_user_id
left join auth.users ru on ru.id = r.reported_user_id
left join public.profiles fp on fp.id = r.reporter_id
left join auth.users fu on fu.id = r.reporter_id
where r.status = 'open'
order by r.created_at;

create view admin.ambassador_requests with (security_invoker = true) as
select p.name, u.email, p.ambassador_requested_at, p.created_at as joined_at
from public.profiles p
join auth.users u on u.id = p.id
where p.ambassador_requested_at is not null and not p.verified_ambassador
order by p.ambassador_requested_at;

-- Pickups that seem stuck: picked up but unconfirmed for 3+ days, or waiting 7+ days.
create view admin.stuck_pickups with (security_invoker = true) as
select
  pk.id as pickup_id,
  pk.status,
  pk.item_title,
  pk.item_value,
  pk.requested_at,
  pk.accepted_at,
  pk.collected_at,
  dp.name as donor,
  du.email as donor_email,
  vp.name as volunteer,
  vu.email as volunteer_email
from public.pickups pk
left join public.profiles dp on dp.id = pk.donor_id
left join auth.users du on du.id = pk.donor_id
left join public.profiles vp on vp.id = pk.volunteer_id
left join auth.users vu on vu.id = pk.volunteer_id
where (pk.status = 'collected' and pk.collected_at < now() - interval '3 days')
   or (pk.status = 'accepted' and pk.accepted_at < now() - interval '7 days')
   or (pk.status = 'requested' and pk.requested_at < now() - interval '7 days')
order by coalesce(pk.collected_at, pk.accepted_at, pk.requested_at);

create view admin.hidden_items with (security_invoker = true) as
select i.id as item_id, i.title, i.status, i.hidden_at, i.town,
  (select count(distinct r.reporter_id) from public.reports r
    where r.item_id = i.id and r.status = 'open') as open_reports
from public.items i
where i.hidden_at is not null and i.status not in ('withdrawn', 'removed')
order by i.hidden_at;

-- Only the database owner (the dashboard) may use anything in the admin schema.
revoke all on all functions in schema admin from public, anon, authenticated;
revoke all on all tables in schema admin from public, anon, authenticated;
