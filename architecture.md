# Architecture — Fleet Maintenance Log

## 1. Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind | Mobile-first |
| Hosting | Vercel (Free Tier) | |
| DB | Supabase PostgreSQL (Free Tier) | RLS enabled |
| Auth | Supabase Auth (email/password) | |
| Storage | Supabase Storage | maintenance photos |
| Cron | Vercel Cron | daily due check |
| QR | `qrcode` (gen) + `html5-qrcode` (scan) | all client-side |

## 2. Database Schema

```sql
organizations (
  id uuid pk default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
)

profiles (
  id uuid pk references auth.users,
  org_id uuid not null references organizations,
  role text not null check (role in ('admin','operator')),
  name text,
  created_at timestamptz default now()
)

assets (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations,
  name text not null,
  unit_no text not null,
  category text,                      -- excavator/loader/etc
  hm_initial numeric default 0,
  next_due_hm numeric,                -- last interval+ hm, null = not set
  next_due_date date,                 -- next service schedule
  created_at timestamptz default now()
)

maintenance_logs (
  id uuid pk default gen_random_uuid(),
  asset_id uuid not null references assets on delete cascade,
  org_id uuid not null references organizations,
  log_type text not null check (log_type in ('rutin','perbaikan')),
  hm numeric,                          -- HM at service
  cost numeric default 0,              -- cost (IDR)
  notes text,
  author_id uuid references auth.users,
  created_at timestamptz default now()
)

photos (
  id uuid pk default gen_random_uuid(),
  log_id uuid not null references maintenance_logs on delete cascade,
  storage_path text not null,          -- supabase path
  created_at timestamptz default now()
)

notifications (
  id uuid pk default gen_random_uuid(),
  org_id uuid not null references organizations,
  user_id uuid references auth.users,  -- null = org broadcast
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
)
```

Indexes:
- `assets (org_id)`, `maintenance_logs (asset_id, created_at desc)`, `notifications (user_id, read)`.

## 3. Row Level Security

Pattern: one `org_id` column on every parent table + `organization_id()` helper.

> **IMPORTANT:** the helper MUST be `security definer`. Without it, a `profiles` policy using
> `organization_id()` (which itself reads `profiles`) → infinite recursion → error `54001 stack depth limited`.

```sql
create or replace function public.organization_id() returns uuid
language sql stable
security definer
set search_path = public as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- example policy, replicated for every table
alter table assets enable row level security;
create policy "org access" on assets
  for all using (org_id = public.organization_id());
```

- `photos` is enforced via app code (parent ownership check) + the Storage bucket `fotos` policy locks the path using RLS.
- Service role is NOT used on the client, never exposed to the public.
- Backend/Edge Function uses service role ONLY for cron (inserting notifications).

## 4. Data Flow

### 4.1 Generate QR (admin)
```
Admin saves asset → FE calls qrcode lib → render <canvas> → download PNG button (dpi enough for print ≥512px)
```
QR payload: `${origin}/assets/${assetId}` — a plain, unrestricted URL.

### 4.2 Scan QR (operator)
```
Camera (html5-qrcode) → decode URL → read asset_id → navigate /assets/[id]
```
Desktop fallback: manual ID input / paste asset_id.

### 4.3 Log Maintenance
```
POST log {asset_id, log_type, hm, cost, notes}
  -> validate: asset belongs to user's org (guaranteed by RLS)
  -> upload photos to Storage bucket 'fotos' path: {org_id}/{log_id}/{uuid}.jpg
  -> insert log + photos (1 transaction)
  -> update assets.next_due_hm = log.hm + interval
            assets.next_due_date = last interval date
```
Interval is stored as per-category constants in code (MVP) — `ponytail: JS constants, make per-asset setting if requested`.

### 4.4 Cron Reminder (Vercel Cron, daily 07:00 WIB)
```
GET /api/cron/due (protected by bearer token, VERCEL_CRON_SECRET)
  -> query assets where next_due_date <= now()+3days / next_due_hm over cap
  -> upsert notifications (org_id = asset.org_id)
```
Endpoint runs on server runtime (uses service role, ONLY here). Idempotent: skip if a dupe notification for the same day already exists.

### 4.5 Export CSV
```
GET /api/assets/[id]/export.csv
  -> server-side query logs (authorized)
  -> build CSV string, header Content-Type text/csv + Content-Disposition attachment
```
Columns: date, type, HM, cost, notes. Total on last row.

## 5. Folder Structure

```
fleet-maintenance/
├── PRD.md
├── architecture.md
├── design.md
├── roadmap.md
└── app/
    ├── (auth)/login, register
    ├── (dashboard)/
    │   ├── dashboard             # fleet view
    │   ├── assets/               # list
    │   ├── assets/[id]/          # detail + history + QR
    │   ├── assets/new
    │   └── scan/
    ├── api/
    │   ├── cron/due/route.ts
    │   └── assets/[id]/export/route.ts
    ├── lib/  (supabase client, server, helpers, intervals)
    ├── components/
    └── supabase/migrations/
```

## 6. Security & Edge Cases

- Photos: path traversal prevented — uses uuid ids, never user names.
- Log cost: numeric ≥ 0; HM must not go backward below stored HM.
- Concurrency: last-write-wins for `next_due` (fine for MVP — `ponytail: row version if log contention gets heavy`).
- Server actions vs route handlers: route handlers for file handles (upload, export), server actions for light CRUD.
- Env: `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` (client-safe), `SUPABASE_SERVICE_ROLE_KEY` (server-only, cron/export), `VERCEL_CRON_SECRET`.

## 7. Deployment

- Vercel: monorepo root has no `Project/` folder — this is a problem; move/symlink when deploying (note in Friday's roadmap).
- Supabase: 1 project, SQL migration via `supabase/migrations`, RLS enabled before seed.
- Vercel Cron: `vercel.json` cron config, daily expression, hits `/api/cron/due`.