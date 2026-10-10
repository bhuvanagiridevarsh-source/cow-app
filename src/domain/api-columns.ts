/**
 * The columns the app may read from the two tables where one column is private
 * (supabase/migrations/20261010000200_private_columns.sql):
 *
 *   items.adult_home_confirmed   only donors under 18 tick it
 *   pickups.adult_attending      only volunteers under 18 tick it
 *
 * Reading either would reveal that someone is a minor, so the database doesn't allow it.
 * Asking for even one column that isn't on these lists makes the whole request fail, so
 * never use select('*') on these tables. A unit test keeps these lists identical to the
 * migration.
 */
export const ITEM_COLUMNS =
  'id, donor_id, category, title, value, condition, photo_path, pickup_window_start, pickup_window_end, town, approx_lat, approx_lng, status, hidden_at, created_at, updated_at, confirmed_at';

export const PICKUP_COLUMNS =
  'id, item_id, donor_id, volunteer_id, status, requested_at, accepted_at, collected_at, confirmed_at, closed_at, cancelled_by, confirmed_by, hours_awarded, item_title, item_category, item_value';
