-- =============================================================================
-- Fix found by the security tests (supabase/tests, test F1):
-- A blocked person could still see a listing (and its photo) if they had EVER requested
-- it, because the "items you've requested" part of the rule ignored blocks and also
-- counted old declined/cancelled requests.
--
-- Now:
--   * only requests still in progress (or completed) count, and
--   * a block hides listings everywhere except from the donor themselves and admins.
-- The exact-address rule also respects blocks now.
-- =============================================================================

drop policy "Signed-in people can see open listings and their own" on public.items;

create policy "Signed-in people can see open listings and their own"
  on public.items for select
  to authenticated
  using (
    donor_id = (select auth.uid())
    or (select private.is_admin())
    or (
      not private.is_blocked_between(donor_id, (select auth.uid()))
      and (
        (status = 'listed' and hidden_at is null and pickup_window_end > now())
        or exists (
          select 1 from public.pickups p
          where p.item_id = items.id
            and p.volunteer_id = (select auth.uid())
            and p.status in ('requested', 'accepted', 'collected', 'confirmed')
        )
      )
    )
  );

drop policy "Exact address: donor, admins, and the accepted volunteer only" on public.item_addresses;

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
        and not private.is_blocked_between(p.donor_id, (select auth.uid()))
    )
  );
