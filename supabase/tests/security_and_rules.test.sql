-- =============================================================================
-- CoW app: database security & rules tests  (plain-English list: docs/RLS_TEST_PLAN.md)
--
-- HOW TO RUN: Supabase dashboard -> SQL Editor -> paste this whole file -> Run.
--
-- It creates 10 fake users and plays out attacks and the full pickup loop. Everything
-- runs in ONE transaction that is always thrown away at the end (the last line raises
-- an error on purpose), so it never leaves anything behind.
--
-- EXPECTED RESULT: an error message that starts with  "ALL <n> TESTS PASSED".
-- Anything else (a message starting with "FAILED") lists exactly which tests failed.
-- =============================================================================
do $tests$
declare
  -- people
  donor uuid := gen_random_uuid();
  donor2 uuid := gen_random_uuid();
  vol uuid := gen_random_uuid();
  stranger uuid := gen_random_uuid();
  stranger2 uuid := gen_random_uuid();
  stranger3 uuid := gen_random_uuid();
  teen15 uuid := gen_random_uuid();
  teen17 uuid := gen_random_uuid();
  amb uuid := gen_random_uuid();
  adminu uuid := gen_random_uuid();
  kid12 uuid := gen_random_uuid();
  -- things
  y integer := extract(year from (now() at time zone 'America/New_York'))::integer;
  w_start timestamptz := now() + interval '1 day';
  w_end timestamptz := now() + interval '1 day 3 hours';
  item_a uuid; item_b uuid; item_c uuid; item_r uuid; item_s uuid;
  m1 uuid; m2 uuid; m3 uuid;
  pk_a uuid; pk_b uuid; pk_c uuid; pk_s uuid;
  impact_before numeric; impact_after numeric;
  n integer; n2 integer; v_num numeric; v_text text; v_json json; v_bool boolean;
  r record;
  passed integer := 0;
  failed text[] := '{}';
begin
  -- ===========================================================================
  -- SETUP (as the database owner)
  -- ===========================================================================
  insert into auth.users (id, email) values
    (donor, 'donor@cow-test.invalid'), (donor2, 'donor2@cow-test.invalid'),
    (vol, 'vol@cow-test.invalid'), (stranger, 'stranger@cow-test.invalid'),
    (stranger2, 'stranger2@cow-test.invalid'), (stranger3, 'stranger3@cow-test.invalid'),
    (teen15, 'teen15@cow-test.invalid'), (teen17, 'teen17@cow-test.invalid'),
    (amb, 'amb@cow-test.invalid'), (adminu, 'admin@cow-test.invalid'),
    (kid12, 'kid12@cow-test.invalid');
  -- Photos "uploaded" to each donor's own folder (the real app uploads via the Storage API).
  insert into storage.objects (bucket_id, name, owner) values
    ('item-photos', donor::text || '/testphoto0001.jpg', donor),
    ('item-photos', donor2::text || '/testphoto0002.jpg', donor2),
    ('item-photos', teen15::text || '/testphoto0003.jpg', teen15);

  -- ===========================================================================
  -- B. AGE GATE  (min_age mirrors src/domain/age.ts)
  -- ===========================================================================
  if private.min_age(2013, 5, '2026-06-01') = 13 then passed := passed + 1; else failed := array_append(failed, 'B1a min_age month passed'); end if;
  if private.min_age(2013, 6, '2026-06-15') = 12 then passed := passed + 1; else failed := array_append(failed, 'B1b min_age same month counts as not yet'); end if;
  if private.min_age(2013, 7, '2026-06-01') = 12 then passed := passed + 1; else failed := array_append(failed, 'B1c min_age month ahead'); end if;
  if private.min_age(2008, 1, '2026-02-01') = 18 then passed := passed + 1; else failed := array_append(failed, 'B1d min_age adult'); end if;
  if private.min_age(2008, 2, '2026-02-01') = 17 then passed := passed + 1; else failed := array_append(failed, 'B1e min_age minor'); end if;
  if private.min_age(2008, 12, '2026-12-31') = 17 then passed := passed + 1; else failed := array_append(failed, 'B1f min_age Dec 31 stays conservative'); end if;

  -- helper pattern: become a signed-in user
  perform set_config('request.jwt.claims', json_build_object('sub', kid12, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.complete_profile('Kid Twelve', 'volunteer', y - 12, 1, '08831', 'test');
    failed := array_append(failed, 'B2 a 12-year-old completed sign-up');
  exception when others then
    if sqlerrm = 'COW_UNDER_13' then passed := passed + 1; else failed := array_append(failed, 'B2 wrong error: ' || sqlerrm); end if;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', teen15, 'role', 'authenticated')::text, true);
  begin
    perform public.complete_profile('Tia Young', 'donor', y - 16, 1, '08831', 'test');
    failed := array_append(failed, 'B3 minor signed up without guardian');
  exception when others then
    if sqlerrm = 'COW_GUARDIAN_REQUIRED' then passed := passed + 1; else failed := array_append(failed, 'B3 wrong error: ' || sqlerrm); end if;
  end;
  -- 15 (born y-16 in January -> youngest possible age is 15 after January)... use December to be safe:
  perform public.complete_profile('Tia Young', 'donor', y - 15, 12, '08831', 'test', 'Pat Parent', 'Parent@Example.com', true);
  select count(*) into n from public.profiles where id = teen15 and guardian_email = 'parent@example.com' and guardian_consent_at is not null;
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'B4 minor guardian details not stored'); end if;

  perform set_config('request.jwt.claims', json_build_object('sub', teen17, 'role', 'authenticated')::text, true);
  perform public.complete_profile('Theo Teen', 'volunteer', y - 17, 12, '08831', 'test', 'Pat Parent', 'parent@example.com', true);

  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  perform public.complete_profile('Dana Donor', 'donor', 1990, 5, '08831', 'test', 'Should Be', 'ignored@example.com', true);
  select count(*) into n from public.profiles where id = donor and guardian_name is null and guardian_email is null;
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'B5 adult guardian fields should be ignored'); end if;
  begin
    perform public.complete_profile('Dana Again', 'donor', 1990, 5, '08831', 'test');
    failed := array_append(failed, 'B6 second profile created');
  exception when others then
    if sqlerrm = 'COW_PROFILE_EXISTS' then passed := passed + 1; else failed := array_append(failed, 'B6 wrong error: ' || sqlerrm); end if;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', donor2, 'role', 'authenticated')::text, true);
  perform public.complete_profile('Dora Second', 'donor', 1985, 3, '08831', 'test');
  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  perform public.complete_profile('Val Tester', 'volunteer', 1995, 3, '08831', 'test');
  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  perform public.complete_profile('Sam Stranger', 'volunteer', 1992, 7, '08901', 'test');
  perform set_config('request.jwt.claims', json_build_object('sub', stranger2, 'role', 'authenticated')::text, true);
  perform public.complete_profile('Sid Other', 'volunteer', 1993, 8, '08901', 'test');
  perform set_config('request.jwt.claims', json_build_object('sub', stranger3, 'role', 'authenticated')::text, true);
  perform public.complete_profile('Sue Third', 'volunteer', 1994, 9, '08901', 'test');
  perform set_config('request.jwt.claims', json_build_object('sub', amb, 'role', 'authenticated')::text, true);
  perform public.complete_profile('Amy Ambassador', 'ambassador', 1990, 1, '08831', 'test');
  perform set_config('request.jwt.claims', json_build_object('sub', adminu, 'role', 'authenticated')::text, true);
  perform public.complete_profile('Ada Admin', 'volunteer', 1980, 1, '08831', 'test');

  -- ===========================================================================
  -- I. ADMIN COMMANDS: app users can't run them; the dashboard (owner) can
  -- ===========================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', amb, 'role', 'authenticated')::text, true);
  begin
    perform admin.verify_ambassador('amb@cow-test.invalid');
    failed := array_append(failed, 'I1 app user ran an admin command');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'I1 wrong error: ' || sqlerrm); end if;
  end;
  perform set_config('role', 'postgres', true);
  perform admin.verify_ambassador('amb@cow-test.invalid');
  perform admin.set_admin('admin@cow-test.invalid');
  select count(*) into n from public.profiles where (id = amb and verified_ambassador) or (id = adminu and is_admin);
  if n = 2 then passed := passed + 1; else failed := array_append(failed, 'I2 admin commands did not work from the dashboard'); end if;

  -- ===========================================================================
  -- A. NOBODY WRITES TABLES DIRECTLY; SIGNED-OUT VISITORS SEE ALMOST NOTHING
  -- ===========================================================================
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
  begin
    select public.impact_total() into v_num;
    select count(*) into n from public.settings;
    if v_num >= 5000 and n = 1 then passed := passed + 1; else failed := array_append(failed, 'A1 visitor cannot see impact total/settings'); end if;
  exception when others then failed := array_append(failed, 'A1 visitor error: ' || sqlerrm);
  end;
  begin
    select count(*) into n from public.items;
    failed := array_append(failed, 'A2 visitor could read items');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'A2 wrong error: ' || sqlerrm); end if;
  end;
  begin
    perform public.complete_profile('Anon', 'donor', 1990, 1, '08831', 'test');
    failed := array_append(failed, 'A3 visitor could call complete_profile');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'A3 wrong error: ' || sqlerrm); end if;
  end;

  -- ===========================================================================
  -- C. LISTING RULES
  -- ===========================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  item_a := public.create_item('furniture', 'Oak desk', 120, 'good', donor::text || '/testphoto0001.jpg',
    w_start, w_end, '12 Test Lane', 'Monroe Township', '08831', null, 'In the garage', 40.334567, -74.432111);
  select count(*) into n from public.items
    where id = item_a and status = 'listed' and approx_lat = 40.33 and approx_lng = -74.43;
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'C1 item not created as listed with ~1 km location'); end if;
  select count(*) into n from public.item_addresses where item_id = item_a and zip = '08831' and exact_lat = 40.334567;
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'C1b donor cannot see own exact address'); end if;

  begin
    perform public.create_item('furniture', 'NYC couch', 50, 'good', donor::text || '/testphoto0001.jpg',
      w_start, w_end, '1 Broadway', 'New York', '10004');
    failed := array_append(failed, 'C2 out-of-area listing allowed');
  exception when others then
    if sqlerrm = 'COW_OUT_OF_AREA' then passed := passed + 1; else failed := array_append(failed, 'C2 wrong error: ' || sqlerrm); end if;
  end;
  begin
    perform public.create_item('electronics', 'Gold TV', 999999, 'new', donor::text || '/testphoto0001.jpg',
      w_start, w_end, '12 Test Lane', 'Monroe Township', '08831');
    failed := array_append(failed, 'C3 value above the cap allowed');
  exception when others then
    if sqlerrm = 'COW_VALUE_TOO_HIGH' then passed := passed + 1; else failed := array_append(failed, 'C3 wrong error: ' || sqlerrm); end if;
  end;
  begin
    perform public.create_item('electronics', 'Borrowed photo', 10, 'good', donor2::text || '/testphoto0002.jpg',
      w_start, w_end, '12 Test Lane', 'Monroe Township', '08831');
    failed := array_append(failed, 'C4 used someone else''s photo');
  exception when others then
    if sqlerrm = 'COW_PHOTO_MISSING' then passed := passed + 1; else failed := array_append(failed, 'C4 wrong error: ' || sqlerrm); end if;
  end;
  begin
    perform public.create_item('other', 'Old lamp', 10, 'fair', donor::text || '/testphoto0001.jpg',
      now() - interval '5 hours', now() - interval '2 hours', '12 Test Lane', 'Monroe Township', '08831');
    failed := array_append(failed, 'C5 pickup window in the past allowed');
  exception when others then
    if sqlerrm = 'COW_BAD_WINDOW' then passed := passed + 1; else failed := array_append(failed, 'C5 wrong error: ' || sqlerrm); end if;
  end;

  -- More of the donor's items for later tests (no coordinates -> ZIP census point fallback).
  item_b := public.create_item('appliances', 'Microwave', 80, 'good', donor::text || '/testphoto0001.jpg',
    w_start, w_end, '12 Test Lane', 'Monroe Township', '08831');
  select count(*) into n from public.items i
    join public.zip_centroids z on z.zip = '08831'
    where i.id = item_b and i.approx_lat = round(z.lat::numeric, 2) and i.approx_lng = round(z.lng::numeric, 2);
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'C7 ZIP fallback location not used'); end if;
  item_c := public.create_item('other', 'Bookshelf', 40, 'fair', donor::text || '/testphoto0001.jpg',
    w_start, w_end, '12 Test Lane', 'Monroe Township', '08831');
  m1 := public.create_item('other', 'Chair one', 10, 'good', donor::text || '/testphoto0001.jpg', w_start, w_end, '12 Test Lane', 'Monroe Township', '08831');
  m2 := public.create_item('other', 'Chair two', 10, 'good', donor::text || '/testphoto0001.jpg', w_start, w_end, '12 Test Lane', 'Monroe Township', '08831');
  m3 := public.create_item('other', 'Chair three', 10, 'good', donor::text || '/testphoto0001.jpg', w_start, w_end, '12 Test Lane', 'Monroe Township', '08831');

  -- Teen donor must confirm an adult will be home.
  perform set_config('request.jwt.claims', json_build_object('sub', teen15, 'role', 'authenticated')::text, true);
  begin
    perform public.create_item('other', 'Teen table', 20, 'good', teen15::text || '/testphoto0003.jpg',
      w_start, w_end, '5 Teen Rd', 'Monroe Township', '08831');
    failed := array_append(failed, 'C6 minor listed without adult-home confirmation');
  exception when others then
    if sqlerrm = 'COW_ADULT_HOME_REQUIRED' then passed := passed + 1; else failed := array_append(failed, 'C6 wrong error: ' || sqlerrm); end if;
  end;
  perform public.create_item('other', 'Teen table', 20, 'good', teen15::text || '/testphoto0003.jpg',
    w_start, w_end, '5 Teen Rd', 'Monroe Township', '08831', p_adult_home_confirmed => true);
  passed := passed + 1; -- C6b minor listing with confirmation succeeded

  -- Direct writes are refused even for your own data.
  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  begin
    update public.items set value = 1 where id = item_a;
    failed := array_append(failed, 'A4 direct item update allowed');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'A4 wrong error: ' || sqlerrm); end if;
  end;
  begin
    insert into public.items (donor_id, category, title, value, condition, photo_path, pickup_window_start, pickup_window_end, town)
      values (donor, 'other', 'Sneaky', 1, 'good', 'x', w_start, w_end, 'Town');
    failed := array_append(failed, 'A5 direct item insert allowed');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'A5 wrong error: ' || sqlerrm); end if;
  end;
  begin
    update public.profiles set is_admin = true where id = donor;
    failed := array_append(failed, 'A6 user made themselves admin');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'A6 wrong error: ' || sqlerrm); end if;
  end;
  begin
    update public.settings set min_pickup_age = 13;
    failed := array_append(failed, 'A7 user changed settings');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'A7 wrong error: ' || sqlerrm); end if;
  end;
  begin
    insert into public.impact_ledger (pickup_id, amount) values (null, 1000000);
    failed := array_append(failed, 'A8 user inflated the impact total');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'A8 wrong error: ' || sqlerrm); end if;
  end;
  begin
    insert into public.pickups (item_id, donor_id, volunteer_id, item_title, item_category, item_value)
      values (item_a, donor, donor, 'x', 'other', 1);
    failed := array_append(failed, 'A9 user inserted a pickup directly');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'A9 wrong error: ' || sqlerrm); end if;
  end;

  -- ===========================================================================
  -- D. PRIVACY
  -- ===========================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  select count(*) into n from public.items where id = item_a;
  select count(*) into n2 from public.item_addresses where item_id = item_a;
  if n = 1 and n2 = 0 then passed := passed + 1; else failed := array_append(failed, 'D1 stranger: listing should be visible, address hidden'); end if;
  select count(*) into n from public.profiles where id = donor;
  if n = 0 then passed := passed + 1; else failed := array_append(failed, 'D2 stranger read the donor''s private profile'); end if;
  select count(*) into n from public.profiles;
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'D3 user can see profiles other than their own'); end if;
  -- Storage: a stranger can see the photo of a visible listing, but can't upload into someone else's folder.
  select count(*) into n from storage.objects where bucket_id = 'item-photos' and name = donor::text || '/testphoto0001.jpg';
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'H1 photo of a visible listing not viewable'); end if;
  begin
    insert into storage.objects (bucket_id, name, owner) values ('item-photos', donor::text || '/evilphoto01.jpg', stranger);
    failed := array_append(failed, 'H2 stranger uploaded into someone else''s folder');
  exception when others then
    if sqlstate = '42501' then passed := passed + 1; else failed := array_append(failed, 'H2 wrong error: ' || sqlerrm); end if;
  end;

  -- ===========================================================================
  -- E. THE PICKUP LOOP AND ITS RULES
  -- ===========================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', teen15, 'role', 'authenticated')::text, true);
  begin
    perform public.request_pickups(array[item_a], true);
    failed := array_append(failed, 'E1 15-year-old requested a pickup');
  exception when others then
    if sqlerrm = 'COW_TOO_YOUNG_FOR_PICKUP' then passed := passed + 1; else failed := array_append(failed, 'E1 wrong error: ' || sqlerrm); end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', teen17, 'role', 'authenticated')::text, true);
  begin
    perform public.request_pickups(array[item_a], false);
    failed := array_append(failed, 'E2 17-year-old requested without an adult');
  exception when others then
    if sqlerrm = 'COW_ADULT_REQUIRED' then passed := passed + 1; else failed := array_append(failed, 'E2 wrong error: ' || sqlerrm); end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  select t.result into v_text from public.request_pickups(array[item_a], false) t;
  if v_text = 'own_item' then passed := passed + 1; else failed := array_append(failed, 'E3 donor could request own item: ' || coalesce(v_text, 'null')); end if;

  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  begin
    perform public.request_pickups(array[item_a, item_b], false);
    failed := array_append(failed, 'E6 regular volunteer requested several items');
  exception when others then
    if sqlerrm = 'COW_AMBASSADOR_ONLY' then passed := passed + 1; else failed := array_append(failed, 'E6 wrong error: ' || sqlerrm); end if;
  end;
  select t.result, t.pickup_id into v_text, pk_a from public.request_pickups(array[item_a], false) t;
  select count(*) into n from public.items where id = item_a and status = 'requested';
  if v_text = 'requested' and n = 1 then passed := passed + 1; else failed := array_append(failed, 'E4 request did not work'); end if;
  begin
    perform public.request_pickups(array[item_c], false);
    failed := array_append(failed, 'E5 volunteer went over the 1-pickup limit');
  exception when others then
    if sqlerrm = 'COW_CLAIM_LIMIT' then passed := passed + 1; else failed := array_append(failed, 'E5 wrong error: ' || sqlerrm); end if;
  end;
  begin
    perform public.respond_to_request(pk_a, true);
    failed := array_append(failed, 'E8 volunteer accepted their own request');
  exception when others then
    if sqlerrm = 'COW_NOT_FOUND' then passed := passed + 1; else failed := array_append(failed, 'E8 wrong error: ' || sqlerrm); end if;
  end;
  select count(*) into n from public.item_addresses where item_id = item_a;
  if n = 0 then passed := passed + 1; else failed := array_append(failed, 'E9 address visible before the donor accepted'); end if;
  begin
    perform public.mark_collected(pk_a);
    failed := array_append(failed, 'E10 marked picked up before acceptance');
  exception when others then
    if sqlerrm = 'COW_INVALID_TRANSITION' then passed := passed + 1; else failed := array_append(failed, 'E10 wrong error: ' || sqlerrm); end if;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  begin
    perform public.respond_to_request(pk_a, true);
    failed := array_append(failed, 'E7 stranger accepted someone else''s request');
  exception when others then
    if sqlerrm = 'COW_NOT_FOUND' then passed := passed + 1; else failed := array_append(failed, 'E7 wrong error: ' || sqlerrm); end if;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  perform public.respond_to_request(pk_a, true);
  select public.pickup_counterpart(pk_a) into v_json;
  if v_json ->> 'display_name' = 'Val T.' and v_json::text not like '%@%' then passed := passed + 1;
  else failed := array_append(failed, 'E11b counterpart should be "Val T." with no email: ' || v_json::text); end if;

  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  select count(*) into n from public.item_addresses where item_id = item_a;
  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  select count(*) into n2 from public.item_addresses where item_id = item_a;
  if n = 1 and n2 = 0 then passed := passed + 1; else failed := array_append(failed, 'E11 after acceptance: address must be visible to the volunteer only'); end if;

  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  begin
    perform public.confirm_pickup(pk_a);
    failed := array_append(failed, 'E12 volunteer confirmed their own pickup (self-awarded hours)');
  exception when others then
    if sqlerrm = 'COW_NOT_FOUND' then passed := passed + 1; else failed := array_append(failed, 'E12 wrong error: ' || sqlerrm); end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  begin
    perform public.confirm_pickup(pk_a);
    failed := array_append(failed, 'E13 confirmed before the item was picked up');
  exception when others then
    if sqlerrm = 'COW_INVALID_TRANSITION' then passed := passed + 1; else failed := array_append(failed, 'E13 wrong error: ' || sqlerrm); end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  perform public.mark_collected(pk_a);
  passed := passed + 1; -- E14
  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  begin
    perform public.confirm_pickup(pk_a);
    failed := array_append(failed, 'E15 stranger confirmed a pickup');
  exception when others then
    if sqlerrm = 'COW_NOT_FOUND' then passed := passed + 1; else failed := array_append(failed, 'E15 wrong error: ' || sqlerrm); end if;
  end;

  impact_before := public.impact_total();
  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  perform public.confirm_pickup(pk_a);
  impact_after := public.impact_total();
  select count(*) into n from public.pickups where id = pk_a and status = 'confirmed' and hours_awarded = 1;
  select count(*) into n2 from public.items where id = item_a and status = 'confirmed';
  if n = 1 and n2 = 1 and impact_after = impact_before + 120 then passed := passed + 1;
  else failed := array_append(failed, format('E16 confirm: pickup=%s item=%s impact %s -> %s', n, n2, impact_before, impact_after)); end if;
  begin
    perform public.confirm_pickup(pk_a);
    failed := array_append(failed, 'E20 confirmed the same pickup twice');
  exception when others then
    if sqlerrm = 'COW_INVALID_TRANSITION' and public.impact_total() = impact_after then passed := passed + 1;
    else failed := array_append(failed, 'E20 wrong error: ' || sqlerrm); end if;
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  select count(*) into n from public.item_addresses where item_id = item_a;
  if n = 0 then passed := passed + 1; else failed := array_append(failed, 'E17 address still visible after the pickup finished'); end if;
  select public.user_hours() into v_num;
  select public.my_stats() into v_json;
  if v_num = 1 and (v_json ->> 'value_collected')::integer = 120 and (v_json ->> 'hours')::numeric = 1 then passed := passed + 1;
  else failed := array_append(failed, 'E19 hours/stats wrong: ' || v_json::text); end if;
  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  begin
    perform public.user_hours(vol);
    failed := array_append(failed, 'E18 stranger read someone else''s hours');
  exception when others then
    if sqlerrm = 'COW_FORBIDDEN' then passed := passed + 1; else failed := array_append(failed, 'E18 wrong error: ' || sqlerrm); end if;
  end;

  -- Decline and cancel put the item back on the list.
  perform set_config('request.jwt.claims', json_build_object('sub', stranger2, 'role', 'authenticated')::text, true);
  select t.pickup_id into pk_c from public.request_pickups(array[item_c], false) t;
  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  perform public.respond_to_request(pk_c, false);
  select count(*) into n from public.items where id = item_c and status = 'listed';
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'E21 declined item not back on the list'); end if;
  perform set_config('request.jwt.claims', json_build_object('sub', stranger2, 'role', 'authenticated')::text, true);
  select t.pickup_id into pk_c from public.request_pickups(array[item_c], false) t;
  perform public.cancel_pickup(pk_c);
  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  select count(*) into n from public.items where id = item_c and status = 'listed';
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'E22 cancelled item not back on the list'); end if;

  -- Verified Ambassador: several at once, up to their limit (set to 2 for this test).
  perform set_config('role', 'postgres', true);
  update public.settings set max_active_claims_ambassador = 2;
  perform set_config('request.jwt.claims', json_build_object('sub', amb, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  select count(*) filter (where t.result = 'requested'), count(*) filter (where t.result = 'over_limit')
    into n, n2 from public.request_pickups(array[m1, m2, m3], false) t;
  if n = 2 and n2 = 1 then passed := passed + 1; else failed := array_append(failed, format('E23 ambassador multi-request: %s requested, %s over limit', n, n2)); end if;

  -- The guard stops invalid moves even from the dashboard.
  perform set_config('role', 'postgres', true);
  begin
    update public.items set status = 'confirmed' where id = item_c;
    failed := array_append(failed, 'E24 dashboard skipped straight to confirmed');
  exception when others then
    if sqlerrm = 'COW_INVALID_TRANSITION' then passed := passed + 1; else failed := array_append(failed, 'E24 wrong error: ' || sqlerrm); end if;
  end;
  begin
    update public.pickups set hours_awarded = 5 where item_id = m1;
    failed := array_append(failed, 'E25 hours set on an unconfirmed pickup');
  exception when others then
    if sqlerrm = 'COW_INVALID_TRANSITION' then passed := passed + 1; else failed := array_append(failed, 'E25 wrong error: ' || sqlerrm); end if;
  end;

  -- ===========================================================================
  -- F. REPORTS AND BLOCKS
  -- ===========================================================================
  perform set_config('request.jwt.claims', json_build_object('sub', donor2, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  item_r := public.create_item('electronics', 'Suspicious TV', 30, 'good', donor2::text || '/testphoto0002.jpg',
    w_start, w_end, '9 Other St', 'Monroe Township', '08831');
  item_s := public.create_item('furniture', 'Sofa', 60, 'good', donor2::text || '/testphoto0002.jpg',
    w_start, w_end, '9 Other St', 'Monroe Township', '08831');

  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  perform public.report('fake_listing', 'Looks fake', item_r);
  perform public.report('fake_listing', 'Reporting again', item_r); -- same person twice counts once
  perform set_config('request.jwt.claims', json_build_object('sub', stranger2, 'role', 'authenticated')::text, true);
  perform public.report('fake_listing', null, item_r);
  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  select count(*) into n from public.items where id = item_r;
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'F3a listing hidden too early (2 reporters)'); end if;
  perform set_config('request.jwt.claims', json_build_object('sub', stranger3, 'role', 'authenticated')::text, true);
  perform public.report('inappropriate', null, item_r);
  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  select count(*) into n from public.items where id = item_r;
  perform set_config('request.jwt.claims', json_build_object('sub', donor2, 'role', 'authenticated')::text, true);
  select count(*) into n2 from public.items where id = item_r;
  if n = 0 and n2 = 1 then passed := passed + 1; else failed := array_append(failed, 'F3b 3 reports should hide the listing from others (not the donor)'); end if;
  perform set_config('request.jwt.claims', json_build_object('sub', stranger3, 'role', 'authenticated')::text, true);
  select count(*) into n from public.reports;
  if n = 1 then passed := passed + 1; else failed := array_append(failed, 'F4 users can see other people''s reports'); end if;
  begin
    perform public.report('unsafe', null, null, pk_a);
    failed := array_append(failed, 'F5 reported a pickup they are not part of');
  exception when others then
    if sqlerrm = 'COW_NOT_FOUND' then passed := passed + 1; else failed := array_append(failed, 'F5 wrong error: ' || sqlerrm); end if;
  end;

  -- Block: cancels the pickup in progress and hides listings both ways.
  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  select t.pickup_id into pk_s from public.request_pickups(array[item_s], false) t;
  perform set_config('request.jwt.claims', json_build_object('sub', donor2, 'role', 'authenticated')::text, true);
  perform public.block_user(stranger);
  select count(*) into n from public.pickups where id = pk_s and status = 'cancelled';
  select count(*) into n2 from public.items where id = item_s and status = 'listed';
  if n = 1 and n2 = 1 then passed := passed + 1; else failed := array_append(failed, 'F2 block did not cancel the pickup in progress'); end if;
  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  select count(*) into n from public.items where donor_id = donor2;
  select t.result into v_text from public.request_pickups(array[item_s], false) t;
  select count(*) into n2 from storage.objects where bucket_id = 'item-photos' and name = donor2::text || '/testphoto0002.jpg';
  if n = 0 and v_text = 'unavailable' and n2 = 0 then passed := passed + 1;
  else failed := array_append(failed, format('F1 blocked user still sees listings=%s / request=%s / photo=%s', n, v_text, n2)); end if;

  -- ===========================================================================
  -- G. DELETE MY ACCOUNT
  -- ===========================================================================
  -- A second pickup for the volunteer, left at "picked up" when the donor leaves.
  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  select t.pickup_id into pk_b from public.request_pickups(array[item_b], false) t;
  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  perform public.respond_to_request(pk_b, true);
  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  perform public.mark_collected(pk_b);

  perform set_config('request.jwt.claims', json_build_object('sub', donor, 'role', 'authenticated')::text, true);
  begin
    perform public.delete_my_account();
    failed := array_append(failed, 'G1 account deleted while photos remain');
  exception when others then
    if sqlerrm = 'COW_PHOTOS_REMAIN' then passed := passed + 1; else failed := array_append(failed, 'G1 wrong error: ' || sqlerrm); end if;
  end;
  -- The app deletes photos through the Storage API; here we simulate that step.
  perform set_config('role', 'postgres', true);
  perform set_config('storage.allow_delete_query', 'true', true);
  delete from storage.objects where bucket_id = 'item-photos' and name like donor::text || '/%';
  perform set_config('storage.allow_delete_query', 'false', true);
  impact_before := public.impact_total();
  perform set_config('role', 'authenticated', true);
  perform public.delete_my_account();
  perform set_config('role', 'postgres', true);
  select count(*) into n from auth.users where id = donor;
  select count(*) into n2 from public.items where donor_id = donor;
  if n = 0 and n2 = 0 and not exists (select 1 from public.profiles where id = donor)
     and not exists (select 1 from public.item_addresses where street = '12 Test Lane') then passed := passed + 1;
  else failed := array_append(failed, 'G2 donor data not fully deleted'); end if;
  select count(*) into n from public.pickups where id = pk_a and status = 'confirmed' and item_id is null and donor_id is null and hours_awarded = 1;
  if n = 1 and public.impact_total() = impact_before then passed := passed + 1;
  else failed := array_append(failed, 'G3 volunteer history or impact total lost after donor deletion'); end if;

  -- The NULL-safety regression: once the donor is gone, strangers (and the volunteer) must NOT be able to confirm.
  perform set_config('request.jwt.claims', json_build_object('sub', stranger, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
  begin
    perform public.confirm_pickup(pk_b);
    failed := array_append(failed, 'G4 stranger confirmed a pickup whose donor was deleted');
  exception when others then
    if sqlerrm = 'COW_NOT_FOUND' then passed := passed + 1; else failed := array_append(failed, 'G4 wrong error: ' || sqlerrm); end if;
  end;
  begin
    perform public.cancel_pickup(pk_b);
    failed := array_append(failed, 'G5 stranger cancelled a pickup whose donor was deleted');
  exception when others then
    if sqlerrm = 'COW_NOT_FOUND' then passed := passed + 1; else failed := array_append(failed, 'G5 wrong error: ' || sqlerrm); end if;
  end;
  begin
    perform public.pickup_counterpart(pk_b);
    failed := array_append(failed, 'G6 stranger looked up people on someone else''s pickup');
  exception when others then
    if sqlerrm = 'COW_NOT_FOUND' then passed := passed + 1; else failed := array_append(failed, 'G6 wrong error: ' || sqlerrm); end if;
  end;
  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  begin
    perform public.confirm_pickup(pk_b);
    failed := array_append(failed, 'G7 volunteer self-confirmed after the donor was deleted');
  exception when others then
    if sqlerrm = 'COW_NOT_FOUND' then passed := passed + 1; else failed := array_append(failed, 'G7 wrong error: ' || sqlerrm); end if;
  end;
  -- An admin can finish it.
  perform set_config('request.jwt.claims', json_build_object('sub', adminu, 'role', 'authenticated')::text, true);
  perform public.confirm_pickup(pk_b);
  perform set_config('request.jwt.claims', json_build_object('sub', vol, 'role', 'authenticated')::text, true);
  if public.user_hours() = 2 then passed := passed + 1; else failed := array_append(failed, 'G8 admin confirm did not award hours'); end if;

  -- ===========================================================================
  -- RESULT (always rolls everything back)
  -- ===========================================================================
  perform set_config('role', 'postgres', true);
  if coalesce(array_length(failed, 1), 0) = 0 then
    raise exception 'ALL % TESTS PASSED (everything was rolled back)', passed;
  else
    raise exception 'FAILED % of %: %', array_length(failed, 1), passed + array_length(failed, 1),
      array_to_string(failed, ' | ');
  end if;
end
$tests$;
