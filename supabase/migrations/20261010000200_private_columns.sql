-- =============================================================================
-- CoW app: three columns that must not be readable through the app's API
--
-- Found in the final pre-launch review. The row rules (who can see which listing,
-- pickup, or report) were right, but each of these tables has one column that people
-- who can see the row should still not see:
--
--   items.adult_home_confirmed   "an adult will be home" is only ever ticked by donors
--                                under 18. Anyone browsing could read it and learn which
--                                listings (and so which homes) belong to a minor.
--   pickups.adult_attending      "an adult will come with me" is only ever ticked by
--                                volunteers under 18. The donor on that pickup could read
--                                it and learn the volunteer is a minor.
--   reports.admin_notes          CoW's private notes on a report. The person who sent the
--                                report could read them.
--
-- Fix: the app's role may read only the columns listed here. The database functions
-- (which run as the owner) still record and enforce all three, and CoW admins still
-- see them in the dashboard.
--
-- This also fails closed from now on: a column added to one of these tables later is
-- NOT readable by the app until a migration grants it.
-- =============================================================================

revoke select on public.items from authenticated;
grant select (
  id, donor_id, category, title, value, condition, photo_path,
  pickup_window_start, pickup_window_end, town, approx_lat, approx_lng,
  status, hidden_at, created_at, updated_at, confirmed_at
) on public.items to authenticated;

revoke select on public.pickups from authenticated;
grant select (
  id, item_id, donor_id, volunteer_id, status,
  requested_at, accepted_at, collected_at, confirmed_at, closed_at,
  cancelled_by, confirmed_by, hours_awarded,
  item_title, item_category, item_value
) on public.pickups to authenticated;

revoke select on public.reports from authenticated;
grant select (
  id, reporter_id, item_id, pickup_id, reported_user_id,
  reason, details, status, created_at, resolved_at
) on public.reports to authenticated;

comment on column public.items.adult_home_confirmed is
  'Ticked by donors under 18 (a parent approves and an adult will be home). Private: not readable through the app.';
comment on column public.pickups.adult_attending is
  'Ticked by volunteers under 18 (an adult will come with me). Private: not readable through the app.';
comment on column public.reports.admin_notes is
  'CoW''s private notes on a report. Not readable through the app.';
