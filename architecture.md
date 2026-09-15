# Architecture — Fleet Maintenance Log

## 1. Stack

| Layer | Teknologi | Catatan |
|---|---|---|
| Frontend | Next.js (App Router) + Tailwind | Mobile-first |
| Hosting | Vercel (Free Tier) | |
| DB | Supabase PostgreSQL (Free Tier) | RLS aktif |
| Auth | Supabase Auth (email/password) | |
| Storage | Supabase Storage | foto maintenance |
| Cron | Vercel Cron | daily check due |
| QR | `qrcode` (gen) + `html5-qrcode` (scan) | semua client-side |

## 2. Skema Database

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
  category text,                      -- excavator/loader/dll
  hm_initial numeric default 0,
  next_due_hm numeric,                -- interval+ hm terakhir, null = blm diset
  next_due_date date,                 -- jadwal servis berikutnya
  created_at timestamptz default now()
)

maintenance_logs (
  id uuid pk default gen_random_uuid(),
  asset_id uuid not null references assets on delete cascade,
  org_id uuid not null references organizations,
  log_type text not null check (log_type in ('rutin','perbaikan')),
  hm numeric,                          -- HM saat servis
  cost numeric default 0,              -- biaya (Rp)
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
  user_id uuid references auth.users,  -- null = broadcast org
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
)
```

Index:
- `assets (org_id)`, `maintenance_logs (asset_id, created_at desc)`, `notifications (user_id, read)`.

## 3. Row Level Security

Pola: satu kolom `org_id` di tiap tabel parental + `organization_id()` helper.

> **PENTING:** helper WAJIB `security definer`. Tanpa itu, policy `profiles` yang memakai
> `organization_id()` (yang membaca `profiles`) → infinite recursion → error `54001 stack depth limited`.

```sql
create or replace function public.organization_id() returns uuid
language sql stable
security definer
set search_path = public as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- contoh policy, ditiru untuk semua tabel
alter table assets enable row level security;
create policy "org access" on assets
  for all using (org_id = public.organization_id());
```

- `photos` di-force lewat app code (cek kepemilikan parent) + policy di Storage bucket `fotos` mengunci path memakai RLS.
- Service role TIDAK dipakai client, tidak pernah diledakkan ke public.
- Backend/Edge Function pakai service role HANYA utk cron (insert notifikasi).

## 4. Alur Data

### 4.1 Generate QR (admin)
```
Admin simpan asset → FE panggil lib qrcode → render <canvas> → tombol download PNG (dpi cukup utk cetak ≥512px)
```
QR payload: `${origin}/assets/${assetId}` — plain URL bebas restriksi.

### 4.2 Scan QR (operator)
```
Kamera (html5-qrcode) → decode URL → baca asset_id → navigate /assets/[id]
```
Desktop fallback: input manual / paste asset_id.

### 4.3 Catat Maintenance
```
POST log {asset_id, log_type, hm, cost, notes}
  -> validasi: asset milik org user (RLS menjamin)
  -> upload foto ke Storage bucket 'fotos' path: {org_id}/{log_id}/{uuid}.jpg
  -> insert log + photos (1 transaksi)
  -> update assets.next_due_hm = log.hm + interval
            assets.next_due_date = interval date terakhir
```
Interval disimpan sebagai konstanta per kategori di code (MVP) — `ponytail: konstanta JS, jadikan per-asset setting kalau user minta`.

### 4.4 Cron Reminder (Vercel Cron, daily 07:00 WIB)
```
GET /api/cron/due (protected bearer token, VERCEL_CRON_SECRET)
  -> query assets where next_due_date <= now()+3days / next_due_hm melebihi cap
  -> upsert notifications (org_id = asset.org_id)
```
Endpoint berjalan di server runtime (pakai service role, HANYA di sini). Idempotent: skip kalau notif duplikat hari yg sama.

### 4.5 Export CSV
```
GET /api/assets/[id]/export.csv
  -> server-side query logs (authorized)
  -> build CSV string, header Content-Type text/csv + Content-Disposition attachment
```
Kolom: tanggal, jenis, HM, biaya, catatan. Total di baris terakhir.

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
    │   ├── assets/[id]/          # detail + riwayat + QR
    │   ├── assets/new
    │   └── scan/
    ├── api/
    │   ├── cron/due/route.ts
    │   └── assets/[id]/export/route.ts
    ├── lib/  (supabase client, server, helpers, intervals)
    ├── components/
    └── supabase/migrations/
```

## 6. Keamanan & Edge Cases

- Foto: Path traversal dicegah — pakai id uuid, tidak pernah nama user.
- Log cost: numerik ≥ 0; HM tidak boleh mundur < HM tersimpan.
- Concurrency: last-write-wins utk `next_due` (MVP cukup — `ponytail: row version kalau baku-saing log rame`).
- Server actions vs route handler: pakai route handler utk hal berfile (upload, export), server action utk CRUD ringan.
- Env: `NEXT_PUBLIC_SUPABASE_URL/ANON_KEY` (client-safe), `SUPABASE_SERVICE_ROLE_KEY` (server-only, cron/export), `VERCEL_CRON_SECRET`.

## 7. Deployment

- Vercel: monorepo root tanpa folder `Project/` — ini masalah; pindah/symlink saat mau deploy (catatan di roadmap Jumat).
- Supabase: 1 project, sql migration via `supabase/migrations`, RLS aktif sebelum seed.
- Vercel Cron: config `vercel.json` cron expression daily, hits `/api/cron/due`.
