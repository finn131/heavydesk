-- ============ HARDEN SECURITY (evaluasi M2, 2026-09-16) ============
-- Blokir pemanggilan RPC publik utk helper SECURITY DEFINER.
-- `organization_id` tetap bisa dipanggil `authenticated` (dipakai policy RLS);
-- `anon` tertutup. `handle_new_user` full-revoke (triger internal, bukan via REST).

revoke all on function public.organization_id() from public, anon;
revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.organization_id() to authenticated;

-- Cegah unit_no duplikat dalam satu org.
alter table public.assets
  add constraint assets_org_unit_no_key unique (org_id, unit_no);