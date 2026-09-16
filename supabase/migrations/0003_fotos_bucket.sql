-- ============ M3: STORAGE FOTO (2026-09-16) ============
-- Bucket 'fotos'. DIBUAT via Dashboard UI (Storage → New bucket), karena
-- role 'postgres' di project ini non-superuser: `create policy` di
-- storage.objects wajib owner 'supabase_storage_admin' → SQL editor ditolak.
-- Policy dibuat via UI (operator: SELECT/INSERT) dengan ekspresi foldername.
-- NOTE: bucket di dashboard status 'public: true' (default UI). Kebocoran
-- antar-org tetap tertutup RLS: anon/luar org → auth.uid() null → deny.
-- catatan aplikasi:
--   upload  -> path {org_id}/{log_id}/{uuid}.{ext}
--   baca    -> createSignedUrl (policy SELECT, scope org).

-- untuk replay di project lain: jalankan via dashboard / role yang punya
-- hak storage_admin. Ekspresi policy pakai ::text (foldername text vs org_id uuid).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

alter table storage.objects enable row level security;

-- SELECT (read) — folder path = org_id
drop policy if exists "fotos read org" on storage.objects;
create policy "fotos read org" on storage.objects
  for select using (
    (storage.foldername(name))[1] = ((select org_id from public.profiles where id = auth.uid())::text)
  );

-- INSERT (upload)
drop policy if exists "fotos insert org" on storage.objects;
create policy "fotos insert org" on storage.objects
  for insert with check (
    (storage.foldername(name))[1] = ((select org_id from public.profiles where id = auth.uid())::text)
  );
