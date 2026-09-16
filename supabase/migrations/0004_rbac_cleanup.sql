-- ============ RBAC + CLEANUP (evaluasi menyeluruh, 2026-09-16) ============
-- 1. Operator dilarang manage asset/log (PRD F2: CRUD asset = Admin).
--    SELECT tetap untuk semua anggota org; INSERT log semua; UPDATE/DELETE admin.
-- 2. Notifikasi: policy UPDATE mark-read untuk penerima (user broadcast org).
-- 3. Data integrity: hm >= 0; unit_no unik case-insensitive per org.
-- 4. Catatan: policy DELETE storage (cleanup foto) dibuat via Dashboard UI —
--    postgres non-owner storage.objects (lihat 0003). Ekspresi sama seperti SELECT/INSERT.

-- ============ HELPER is_admin (security definer, terkunci) ============
create or replace function public.is_admin()
returns boolean
language sql stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  )
$$;

-- helper dipakai ekspresi policy → butuh EXECUTE utk role policy (authenticated).
-- anon/sekali lagi di-revoke (default fungsi baru = EXECUTE utk PUBLIC).
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ============ ASSETS: read semua member, manage admin-only ============
drop policy if exists "assets org access" on public.assets;
create policy "assets read" on public.assets
  for select using (org_id = public.organization_id());
create policy "assets manage admin" on public.assets
  for insert with check (org_id = public.organization_id() and public.is_admin());
create policy "assets update admin" on public.assets
  for update using (org_id = public.organization_id() and public.is_admin())
  with check (org_id = public.organization_id() and public.is_admin());
create policy "assets delete admin" on public.assets
  for delete using (org_id = public.organization_id() and public.is_admin());

-- ============ MAINTENANCE_LOGS: read+insert semua, update/delete admin ============
drop policy if exists "logs org access" on public.maintenance_logs;
create policy "logs read" on public.maintenance_logs
  for select using (org_id = public.organization_id());
create policy "logs insert" on public.maintenance_logs
  for insert with check (org_id = public.organization_id());
create policy "logs update admin" on public.maintenance_logs
  for update using (org_id = public.organization_id() and public.is_admin())
  with check (org_id = public.organization_id() and public.is_admin());
create policy "logs delete admin" on public.maintenance_logs
  for delete using (org_id = public.organization_id() and public.is_admin());

-- ============ NOTIFICATIONS: pengguna bisa mark-read ============
create policy "notif update own" on public.notifications
  for update using (
    org_id = public.organization_id()
    and (user_id is null or user_id = auth.uid())
  )
  with check (
    org_id = public.organization_id()
    and (user_id is null or user_id = auth.uid())
  );

-- ============ DATA INTEGRITY ============
-- HM tak boleh negatif di level DB (bukan cuma app).
alter table public.maintenance_logs
  add constraint maintenance_logs_hm_nonneg check (hm is null or hm >= 0);

-- unit_no unik case-insensitive per org ("ex-01" == "EX-01").
alter table public.assets drop constraint if exists assets_org_unit_no_key;
create unique index if not exists assets_org_unit_no_ci
  on public.assets (org_id, lower(unit_no));

-- ============ STORAGE: policy DELETE utk cleanup foto (via Dashboard UI) ============
-- Karena role 'postgres' non-owner storage.objects, jalankan di UI:
--   Storage → fotos → Policies → New policy
--   name: fotos delete org, operation: DELETE
--   policy definition:
--     (storage.foldername(name))[1] = ((select org_id from public.profiles where id = auth.uid())::text)
-- catatan replay project lain (role punya hak storage):
-- create policy "fotos delete org" on storage.objects
--   for delete using (
--     (storage.foldername(name))[1] = ((select org_id from public.profiles where id = auth.uid())::text)
--   );
