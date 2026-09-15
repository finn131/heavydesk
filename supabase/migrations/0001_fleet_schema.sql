-- ============ FLEET MAINTENANCE SCHEMA (applied 2026-09-14) ============
-- Versi FINAL + fix recursion: helper pakai SECURITY DEFINER.
-- Multi-tenant: tiap row punya org_id. Isolasi via RLS.

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('admin','operator')),
  name text,
  created_at timestamptz not null default now()
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  unit_no text not null,
  category text,
  hm_initial numeric not null default 0,
  next_due_hm numeric,
  next_due_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_logs (
  id uuid primary key default gen_random_uuid(),
  asset_id uuid not null references public.assets(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  log_type text not null check (log_type in ('rutin','perbaikan')),
  hm numeric,
  cost numeric not null default 0 check (cost >= 0),
  notes text,
  author_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  log_id uuid not null references public.maintenance_logs(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id), -- null = broadcast org
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_assets_org on public.assets(org_id);
create index if not exists idx_logs_asset_created on public.maintenance_logs(asset_id, created_at desc);
create index if not exists idx_notif_user_read on public.notifications(user_id, read);

-- ============ HELPERS ============
-- WAJIB security definer: helper baca profiles, kalau invoker akan
-- infinite recursion dgn policy profiles sendiri (error 54001 stack depth).
create or replace function public.organization_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- Register bebas = self-serve: bikin org baru + jadi admin org itu.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare v_org uuid;
begin
  insert into public.organizations (name)
  values ('Org ' || split_part(coalesce(new.email, 'user'), '@', 1))
  returning id into v_org;

  insert into public.profiles (id, org_id, role, name)
  values (new.id, v_org, 'admin', coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email, 'user'), '@', 1)));

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ RLS ============
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.assets enable row level security;
alter table public.maintenance_logs enable row level security;
alter table public.photos enable row level security;
alter table public.notifications enable row level security;

create policy "org read own" on public.organizations
  for select using (id = public.organization_id());
create policy "org update own admin" on public.organizations
  for update using (id = public.organization_id())
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "profile read own org" on public.profiles
  for select using (org_id = public.organization_id());
create policy "profile insert admin" on public.profiles
  for insert with check (
    org_id = public.organization_id() and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );
create policy "profile update admin" on public.profiles
  for update using (org_id = public.organization_id())
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

create policy "assets org access" on public.assets
  for all using (org_id = public.organization_id())
  with check (org_id = public.organization_id());

create policy "logs org access" on public.maintenance_logs
  for all using (org_id = public.organization_id())
  with check (org_id = public.organization_id());

create policy "photos org select" on public.photos
  for select using (
    exists (select 1 from public.maintenance_logs l where l.id = log_id and l.org_id = public.organization_id())
  );
create policy "photos org insert" on public.photos
  for insert with check (
    exists (select 1 from public.maintenance_logs l where l.id = log_id and l.org_id = public.organization_id())
  );

create policy "notif org select" on public.notifications
  for select using (
    org_id = public.organization_id()
    and (user_id is null or user_id = auth.uid())
  );
create policy "notif org insert admin" on public.notifications
  for insert with check (
    org_id = public.organization_id() and
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============ SEED DEMO ============
insert into public.organizations (id, name) values
  ('00000000-0000-0000-0000-000000000001', 'Demo Rental A'),
  ('00000000-0000-0000-0000-000000000002', 'Demo Rental B')
on conflict do nothing;

insert into public.assets (org_id, name, unit_no, category, hm_initial, next_due_hm, next_due_date) values
  ('00000000-0000-0000-0000-000000000001', 'Excavator PC200', 'EX-01', 'excavator', 8100, 8500, '2026-09-20'),
  ('00000000-0000-0000-0000-000000000001', 'Wheel Loader WA30', 'WL-03', 'loader', 5200, 5600, '2026-09-12'),
  ('00000000-0000-0000-0000-000000000001', 'Bulldozer D31', 'BD-07', 'bulldozer', 12400, 12800, '2026-09-30'),
  ('00000000-0000-0000-0000-000000000002', 'Excavator Komatsu', 'EX-91', 'excavator', 9900, 10200, '2026-09-25')
on conflict do nothing;

insert into public.maintenance_logs (asset_id, org_id, log_type, hm, cost, notes) values
  ((select id from public.assets where unit_no='EX-01'), '00000000-0000-0000-0000-000000000001', 'rutin', 8210, 450000, 'Ganti selang hidrolik'),
  ((select id from public.assets where unit_no='EX-01'), '00000000-0000-0000-0000-000000000001', 'perbaikan', 8150, 1200000, 'Perbaikan final drive'),
  ((select id from public.assets where unit_no='WL-03'), '00000000-0000-0000-0000-000000000001', 'rutin', 5400, 250000, 'Servis rutin 500 jam')
on conflict do nothing;
