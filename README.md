# HeavyDesk — Fleet / Asset Maintenance (Heavy Equipment Rental)

Maintenance logging system for heavy equipment units: per-unit QR codes, service logs (hour meter / HM), cost dashboard, reminders, CSV export. B2B multi-tenant, mobile-first.

## Stack

- **Next.js 16** (App Router, TS, Tailwind 4) — Vercel
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
| `SUPABASE_SERVICE_ROLE_KEY` | Service role, SERVER-ONLY (cron/export) |
| `VERCEL_CRON_SECRET` | Bearer guard for the cron endpoint |

## Demo Accounts

| Email | Password | Access |
|---|---|---|
| `admin@demo.fleet.app` | `demoFleet@2026` | Admin of **Demo Rental A** org (3 units, 2 logs) |

> Free registration = self-serve: new user gets own org + becomes admin.

## Status

**M1 done (Mon, Sep 14):** scaffold, schema+RLS, auth, org isolation verified.
**M2 done (Tue, Sep 15):** asset CRUD + QR generate/download, camera scan + manual fallback, app shell.

**Status (Wed, Sep 16):** M3 maintenance log + photos **done & verified live** — form, transaction (insert log+photos, auto `next_due`), history+thumbnails, HM validation; storage bucket `fotos` + RLS policy created via Dashboard UI (SQL editor rejected: `postgres` non-owner of storage) and tested: upload 200, anon access denied, signed URLs working.

**Comprehensive evaluation (Wed, Sep 16, `0004_rbac_cleanup`):** tightened RBAC — asset CRUD & log update/delete admin-only, operators can only log; photos cleaned up on unit delete; notification mark-read, `/notifications` page, error/not-found boundaries, 44px button a11y, `lang=id`, batched signed URLs, case-insensitive unique `unit_no`, `hm >= 0` constraint. All verified live.