# Roadmap — Fleet Maintenance Log

**Deadline:** Jumat, 18 Sep 2026 (demo-ready, deploy Vercel).
**Prinsip:** tiap hari = milestone yang jalan & bisa dipakai. Bukan nunggu akhir minggu.

Milestone besar: M1 Auth+schema → M2 Asset+QR → M3 Maintenance → M4 Dashboard+notif → M5 Export+deploy.

---

## Senin, 14 Sep — Setup, Auth, Schema (M1) ✅ SELESAI

- [x] `npx create-next-app@latest` di `Project/fleet-maintenance` (TS, Tailwind, App Router) — **Next 16.3.5**
- [x] Install: `@supabase/supabase-js`, `qrcode`, `html5-qrcode`
- [x] Supabase project + SQL migration: 6 tabel, RLS, helper `organization_id()` — **fix recursion → `security definer`**
- [x] Auth: login/register page, route guard — **Next 16 = `proxy.ts` (bukan middleware)**
- [x] Role flow: register self-serve → org baru + admin; seed data dummy (2 org, 4 unit, 3 log)
- [x] Verifikasi cross-org live: user A (org demo) lihat 3 unit, user B (org lain) lihat 0 unit

**Acceptance:** ✅ login + RLS landlocked — user org A tak bisa baca data org B.
**Extra:** account demo `admin@demo.fleet.app` / `demoFleet@2026` → org Demo Rental A (3 unit).

## Selasa, 15 Sep — Asset CRUD + QR (M2) ✅ SELESAI

- [x] Halaman asset list + form new asset (name, unit_no, category, hm_initial) — **server actions + validasi**
- [x] Detail unit: informasi + tombol QR — **status chip due/overdue, riwayat servis, total biaya**
- [x] Generate QR render `<canvas>` + download PNG ≥512px — **`QRPanel` 512×512**
- [x] Halaman scan: `html5-qrcode` kamera + fallback input ID manual
- [x] Navigasi scan → `/assets/[id]` — **parse `/assets/<uuid>`**
- [x] Layout dashboard shell (header, badge notif, nav) — **route group `(app)`, badge dari count notif**

**Acceptance:** buat unit → QR tampil → print/nedus PNG. Scan kamera → buka unit ≤3s.

## Rabu, 16 Sep — Maintenance Log + Foto (M3)

- [x] Form tambah log: jenis, HM, biaya, catatan (mobile-first)
- [ ] Upload foto → Storage bucket `fotos`, path `{org_id}/{log_id}/{uuid}`
- [x] Transaksi: insert log + photos, update `next_due_hm` & `next_due_date`
- [x] Riwayat per unit + total biaya, thumbnail foto
- [x] Validasi: HM mundur dilarang, biaya ≥ 0, required fields

**Acceptance:** simpan log → total biaya & next_due terupdate otomatis, foto muncul.

## Kamis, 17 Sep — Dashboard + Notifikasi (M4)

- [ ] Dashboard fleet: tab Semua/Due/Overdue, status warna
- [ ] Ringkasan: jumlah unit, unit overdue, Σ biaya bulan ini, top biaya
- [ ] Vercel Cron `/api/cron/due` (daily 07:00 WIB) → insert notifications
- [ ] Badge notif + halaman notifikasi, mark-read
- [ ] Idempotent cron (no duplikat hari sama); proteksi bearer token

**Acceptance:** unit melewati due → 24 jam kemudian muncul notif + badge.

## Jumat, 18 Sep — Export, Polish, Deploy (M5)

- [ ] `/api/assets/[id]/export` → CSV biaya per unit (kolom + total row)
- [ ] Error boundary, loading state, empty state (belum ada data)
- [ ] Aksesibilitas check (label, kontras, tombol 44px), responsive <375px
- [ ] Deploy Vercel; verifikasi env var; seed data demo bisa diakses
- [ ] Persiapkan folder root utk Vercel (project bukan di folder root repo) + tadahkan path
- [ ] Smoke test penuh alur: register → unit → QR → scan → log → notif → export

**Acceptance:** buka Vercel URL, jalankan alur end-to-end tanpa error.

---

## Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| QR scan bermasalah di HP tertentu | Fallback input manual; test di 2 browser |
| RLS salah konfig → bocor data antar org | Uji cross-org login tiap selesai schema; RLS jadi tembok utama |
| Cron Vercel Free Tier delay | Notif boleh telat 1 jam utk MVP; bukan critical path |
| Deadline mepet | Scope dipecah harian; hari Jumat mosong untuk buffer — kalau Kamis telat, Jumat fokus M4 & pangkas polish |
| Monorepo path utk deploy Vercel | Siapkan sejak Senin: Vercel root = subfolder project |

## Buffer

Jumat pagi dianggap hari buffer: target finish Kamis sore. Jumat = demo & fix bug kecil, bukan ngejar fitur baru.