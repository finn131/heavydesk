# Roadmap — Fleet Maintenance Log

**Deadline:** Fri, Sep 18, 2026 (demo-ready, deployed to Vercel).
**Principle:** every day delivers a working milestone. Not waiting for end-of-week.

Major milestones: M1 Auth+schema → M2 Asset+QR → M3 Maintenance → M4 Dashboard+notif → M5 Export+deploy.

---

## Mon, Sep 14 — Setup, Auth, Schema (M1) ✅ DONE

- [x] `npx create-next-app@latest` in `Project/fleet-maintenance` (TS, Tailwind, App Router) — **Next 16.3.5**
- [x] Installed: `@supabase/supabase-js`, `qrcode`, `html5-qrcode`
- [x] Supabase project + SQL migration: 6 tables, RLS, `organization_id()` helper — **fixed recursion → `security definer`**
- [x] Auth: login/register pages, route guard — **Next 16 = `proxy.ts` (not middleware)**
- [x] Role flow: self-serve registration → new org + admin; seeded dummy data (2 orgs, 4 units, 3 logs)
- [x] Cross-org live verification: user A (demo org) sees 3 units, user B (other org) sees 0 units

**Acceptance:** ✅ login + RLS landlocked — org A user can't read org B data.
**Extra:** demo account `admin@demo.fleet.app` / `demoFleet@2026` → org Demo Rental A (3 units).

## Tue, Sep 15 — Asset CRUD + QR (M2) ✅ DONE

- [x] Asset list page + new asset form (name, unit_no, category, hm_initial) — **server actions + validation**
- [x] Unit detail: info + QR button — **due/overdue status chip, service history, total cost**
- [x] QR render as `<canvas>` + download PNG ≥512px — **`QRPanel` 512×512**
- [x] Scan page: `html5-qrcode` camera + manual ID input fallback
- [x] Scan navigation → `/assets/[id]` — **parses `/assets/<uuid>`**
- [x] Dashboard shell layout (header, notif badge, nav) — **route group `(app)`, badge from notif count**

**Acceptance:** create unit → QR appears → print/PNG download. Camera scan → open unit ≤3s.

## Wed, Sep 16 — Maintenance Log + Photos (M3)

- [x] Add-log form: type, HM, cost, notes (mobile-first)
- [x] Photo upload → Storage bucket `fotos`, path `{org_id}/{log_id}/{uuid}` — bucket/policies created via Dashboard UI (SQL editor can't: `postgres` non-owner of storage) + verified live (upload 200, anon denied, signed URL 200)
- [x] Transaction: insert log + photos, update `next_due_hm` & `next_due_date`
- [x] Per-unit history + total cost, photo thumbnails
- [x] Validation: backward HM rejected, cost ≥ 0, required fields

**Acceptance:** save log → total cost & next_due auto-updated, photos appear.

## Thu, Sep 17 — Dashboard + Notifications (M4)

- [ ] Fleet dashboard: All/Due/Overdue tabs, status colors
- [ ] Summary: unit count, overdue units, Σ cost this month, top costs
- [ ] Vercel Cron `/api/cron/due` (daily 07:00 WIB) → insert notifications
- [ ] Notif badge + notifications page, mark-read
- [ ] Idempotent cron (no dupes same day); bearer-token protection

**Acceptance:** unit passes due → 24h later notification + badge appears.

## Fri, Sep 18 — Export, Polish, Deploy (M5)

- [ ] `/api/assets/[id]/export` → per-unit CSV cost (columns + total row)
- [ ] Error boundary, loading state, empty state (no data yet)
- [ ] Accessibility check (labels, contrast, 44px buttons), responsive <375px
- [ ] Deploy to Vercel; verify env vars; demo seed data accessible
- [ ] Prepare repo root for Vercel (project not in repo root folder) + point the path
- [ ] Full smoke test: register → unit → QR → scan → log → notif → export

**Acceptance:** open Vercel URL, run end-to-end flow without errors.

---

## Risks & Mitigation

| Risk | Mitigation |
|---|---|
| QR scan fails on certain phones | Manual input fallback; test on 2 browsers |
| Misconfigured RLS → cross-org data leak | Cross-org login test after every schema change; RLS is the main wall |
| Vercel Free Tier cron delay | Notifs may be 1h late for MVP; not critical path |
| Tight deadline | Scope split daily; Friday kept empty as buffer — if Thursday slips, Friday focuses M4 & trims polish |
| Monorepo path for Vercel deploy | Prepared since Monday: Vercel root = project subfolder |

## Buffer

Friday morning is the buffer day: target done by Thursday evening. Friday = demo & small bug fixes, not chasing new features.