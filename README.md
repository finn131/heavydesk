# HeavyDesk — Fleet / Asset Maintenance (Heavy Equipment Rental)

Maintenance logging system for heavy equipment units: per-unit QR codes, service logs (hour meter / HM), cost dashboard, daily reminders, CSV export. B2B multi-tenant, mobile-first.

## Live URL

**Production:** https://heavydesk.vercel.app

Demo account: `admin@demo.fleet.app` / `demoFleet@2026` → org **Demo Rental A** (3 units, 2 maintenance logs).

## Stack

- **Next.js 16** (App Router, TS, Tailwind 4) — deployed on Vercel
- **Supabase** (Postgres + RLS, Auth, Storage) — Cloud Free Tier
- QR: `qrcode` (generate) + `html5-qrcode` (scan)

## Docs

PRD, architecture, design, and timeline live in `PRD.md`, `architecture.md`, `design.md`, `roadmap.md`.

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in keys (see Supabase dashboard)
npm run dev
```

Open `http://localhost:3000`.

## ENV

| Key | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role, SERVER-ONLY |
| `VERCEL_CRON_SECRET` | Bearer guard for the cron endpoint |

Server-only keys (`SUPABASE_SERVICE_ROLE_KEY`, `VERCEL_CRON_SECRET`) must be set in the Vercel dashboard too.

## Automated Reminders (Cron)

`/api/cron/due` runs daily on Vercel Cron (00:00 UTC = 07:00 WIB):

- Guarded by `VERCEL_CRON_SECRET` (`Authorization: Bearer <secret>`), returns `401` otherwise.
- Scans assets with `next_due_date` within a 7-day window, inserts a broadcast notification per unit (due / overdue).
- Idempotent: no duplicate notification for the same org + message within the same day. Free Tier cron may run up to ~1h late; not critical for MVP.

## CSV Export

`/api/assets/[id]/export` downloads the unit's maintenance history as CSV:

- Session-guarded (`401` when not logged in), RLS-scoped to your org.
- UTF-8 with BOM, `Content-Disposition: attachment; filename="<unit_no>-maintenance.csv"`.
- Columns: `Tanggal, Jenis, HM, Biaya, Catatan` (Excel-friendly).

Trigger: **Export CSV** button on the asset detail page.

## Demo Accounts

| Email | Password | Access |
|---|---|---|
| `admin@demo.fleet.app` | `demoFleet@2026` | Admin of **Demo Rental A** org (3 units, 2 logs) |

> Free registration = self-serve: new user gets own org + becomes admin.

## Milestones

| Milestone | Status |
|---|---|
| **M1 — Setup, Auth, Schema** (Mon, Sep 14) | ✅ scaffold, schema+RLS, org isolation verified live |
| **M2 — Asset CRUD + QR** (Tue, Sep 15) | ✅ CRUD, QR generate/download, camera scan + manual fallback, app shell |
| **M3 — Maintenance Log + Photos** (Wed, Sep 16) | ✅ log form + tx (auto `next_due`), history+thumbnails, HM validation, storage bucket `fotos`; RBAC cleanup (`0004_rbac_cleanup`) |
| **M4 — Dashboard + Notifications** (Thu, Sep 17) | ✅ All/Due/Overdue tabs, Σ cost + top costs, Vercel Cron `/api/cron/due`, badge + notifications page, idempotent + bearer-guarded — **verified live** |
| **M5 — Export + Deploy** (Thu, Sep 17) | ✅ CSV export, deployed to Vercel (https://heavydesk.vercel.app), smoke-tested live: login, dashboard tabs, cron (`inserted:2` → idempotent `0`), CSV download |

Friday (Sep 18) = demo + polish buffer.