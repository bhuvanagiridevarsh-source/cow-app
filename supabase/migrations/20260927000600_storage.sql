-- =============================================================================
-- CoW app: private photo storage
--
-- Bucket `item-photos` is PRIVATE. Photos are shown with short-lived signed links,
-- and only to signed-in people who are allowed to see that listing.
-- Files live at: <user id>/<random id>.jpg
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('item-photos', 'item-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Upload only into your own folder, JPEG only.
create policy "Upload item photos into your own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and storage.extension(name) = 'jpg'
  );

-- See your own photos, and photos of listings you're allowed to see
-- (the items table's own read rule decides which listings those are).
create policy "View photos of listings you can see"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'item-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (select 1 from public.items i where i.photo_path = storage.objects.name)
    )
  );

-- Delete only your own photos (replacing a photo, deleting your account).
create policy "Delete your own item photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'item-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
