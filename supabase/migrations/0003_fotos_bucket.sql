-- ============ M3: STORAGE FOTO (2026-09-16) ============
-- Bucket 'fotos' private. RLS: upload + read hanya path {org_id}/...
-- Folder pertama path = org_id → isolasi antar org.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

alter table storage.objects enable row level security;

drop policy if exists "fotos read org" on storage.objects;
create policy "fotos read org" on storage.objects
  for select using (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select org_id from public.profiles where id = auth.uid())
  );

drop policy if exists "fotos insert org" on storage.objects;
create policy "fotos insert org" on storage.objects
  for insert with check (
    bucket_id = 'fotos'
    and (storage.foldername(name))[1] = (select org_id from public.profiles where id = auth.uid())
  );