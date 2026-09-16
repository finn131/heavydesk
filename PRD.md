# PRD — Fleet / Asset Maintenance Log (Heavy Equipment Rental)

## 1. Problem Statement

Heavy equipment rental companies track unit service & repairs in paper logs, Excel, or mechanics' personal notes. Consequences:

- Servicing delayed → unit downtime, unit breakdowns, client complaints.
- Per-unit repair history is not centralized → hard to value a unit for resale.
- Total maintenance cost per unit not tracked → rental pricing and sell/replace decisions are not data-driven.
- Handover documentation to clients is tedious to assemble.

## 2. Persona

| Persona | Description | Core needs |
|---|---|---|
| **Rental Admin** | Owner/manager of heavy equipment rental. Works in field & office. | Monitor all unit status, TCO costs, service reminders, reports for boss/stakeholders |
| **Operator / Mechanic** | Person who inspects & services units in the field. Phone only. | Quickly log service at the unit, scan QR, upload damage photos |

## 3. Key Use Cases

1. **UC-01 Register new unit** — admin inputs unit (name, unit no, category, initial HM), system generates QR.
2. **UC-02 Log maintenance** — mechanic scans QR → unit page → fills log: type (routine/repair), HM, cost, notes, photos.
3. **UC-03 Monitor fleet** — admin views dashboard: units due/overdue for service, total cost per unit/category.
4. **UC-04 Get reminders** — system shows in-app notification when a unit approaches/passes its service schedule.
5. **UC-05 Export costs** — CSV export of per-unit costs for reporting.

## 4. MVP Scope

### 4.1 Features In-Scope

| # | Feature | Recipients |
|---|---|---|
| F1 | Supabase auth, **admin** + **operator** roles. Free registration = self-serve: creates new org + becomes that org's admin (operators created by admin via invite/SQL) | Admin, Operator |
| F2 | Asset CRUD: name, unit no, category (excavator/loader/etc), initial HM | Admin |
| F3 | Per-unit QR generation, print/save as PNG | Admin |
| F4 | QR scan via camera (desktop + mobile browser) → opens unit page | Operator |
| F5 | Create maintenance log: type, HM at service, cost, notes, photo upload (1+/log) | Operator, Admin |
| F6 | Auto-update `next_due_hm` + `next_due_date` from the interval of the last log per asset | System |
| F7 | Fleet dashboard: due/overdue status, total cost per unit + category | Admin |
| F8 | Per-unit maintenance history (list + total cost) | Admin, Operator |
| F9 | In-app notifications (badge + list) from Vercel Cron | Admin |
| F10 | CSV export of per-unit costs | Admin |

### 4.2 Anti-Goals (SKIPPED in MVP)

- Email/WhatsApp reminders (needs external keys). → `ponytail: in-app first, email when there are real users`
- Full PWA / offline sync. Camera scanning still works in mobile browsers.
- Secure QR tokens. MVP QR just carries the unit ID.
- Multi-location/branch.
- Accounting / invoicing integration.
- Maintenance approval flow.
- Realtime dashboard (manual refresh is enough).

## 5. Acceptance Criteria

- **A1 (Auth):** Free registration → immediately admin of a new org (org auto-isolated). Admin can set operator role via SQL. Test: user from org B logs in → cannot read org A data (RLS enforced).
- **A2 (Asset):** Admin creates unit → QR appears in ≥ 1 second, downloadable as print-resolution PNG (≥ 512px).
- **A4 (Scan):** Scanning QR from a phone camera → opens `/assets/[id]` in ≤ 3 seconds.
- **A5 (Log):** Saving a log → appears in history, unit total cost updates, `next_due` auto-computed. Photos upload to Storage successfully.
- **A7 (Dashboard):** Units with `next_due_date <= today` appear in the overdue tab ≤ 1 minute after an old log is saved.
- **A9 (Notif):** Daily cron → inserts notifications for units due/overdue within X days; badge visible in header.
- **A10 (CSV):** Export → file `cost-{unit}.csv` columns: date, type, HM, cost, notes; total on last row.

## 6. Non-Functional

- **Stack:** Next.js (App Router) + Vercel + Supabase (Postgres, Auth, Storage, Edge/Cron). Everything on Free Tier.
- **Multi-tenant:** 100% isolation via RLS per `organization_id`; service role never used on the client.
- **Mobile-first:** scan page & log form usable on screens ≤ 375px, no horizontal scroll.
- **Performance:** fleet dashboard loads < 2s (data < 10k logs).
- **Security:** all keys server-side; client only uses anon key + RLS.
- **Observability:** 1 clear-path `console.error` log; error boundary per route group.

## 7. Data Domain & Mapping to Idea Document

Replaced "vehicle/km" with "equipment unit / HM (hour meter)" per user's choice.

- `assets`: unit no, name, category, **hm_initial**, **next_due_hm**, **next_due_date**, org FK.
- `maintenance_logs`: type (routine/repair), **hm**, cost, notes, asset FK, author FK.
- `photos`: storage path, log FK.
- `notifications`: user FK, message, read flag.

## 8. Success Metrics (Hypothesis, not yet validated)

- ≤ 60 seconds to log one maintenance event (admin/operator time).
- 100% of units have a printed QR within 1 week of adoption.
- 1 TCO calculation per unit per month without Excel.
- Pricing hypothesis: Rp50–100k/unit/month (from the idea document) — validate with 5 prospective users.