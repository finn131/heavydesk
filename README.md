# HeavyDesk — Fleet / Asset Maintenance (Rental Alat Berat)

Sistem pencatatan maintenance unit alat berat: QR per unit, log servis (jam meter/HM), dashboard biaya, reminder, export CSV. B2B multi-tenant, mobile-first.

## Stack

- **Next.js 16** (App Router, TS, Tailwind 4) — Vercel
- **Supabase** (Postgres + RLS, Auth, Storage) — Cloud Free Tier
- QR: `qrcode` (gen) + `html5-qrcode` (scan)

## Roadmap

PRD, arsitektur, desain, dan timeline ada di `PRD.md`, `architecture.md`, `design.md`, `roadmap.md`.

## Cara Run

```bash
npm install
cp .env.example .env.local   # isi keys (lihat Supabase dashboard)
npm run dev
```

Buka `http://localhost:3000`.

## ENV

| Key | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publik key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role, SERVER-ONLY (cron/export) |

## Akun Demo

| Email | Password | Akses |
|---|---|---|
| `admin@demo.fleet.app` | `demoFleet@2026` | Admin org **Demo Rental A** (3 unit, 2 log) |

> Register bebas = self-serve: user baru dapat org sendiri + jadi admin.

## Status

**M1 selesai (Senin, 14 Sep):** scaffold, schema+RLS, auth, isolasi org verified.
**M2 selesai (Selasa, 15 Sep):** asset CRUD + QR generate/download, scan kamera + fallback manual, app shell.

**Status (Rabu, 16 Sep):** maintenance log + foto (M3) — form + log + next_due auto done; foto nunggu storage bucket (SQL dashboard).