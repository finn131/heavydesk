# PRD — Fleet / Asset Maintenance Log (Rental Alat Berat)

## 1. Problem Statement

Perusahaan rental alat berat mencatat servis & perbaikan unit pakai buku, Excel, atau catatan pribadi mekanik. Akibatnya:

- Servis tertunda → downtime unit, unit rusak, klien komplain.
- Riwayat perbaikan tiap unit tidak terpusat → kesulitan nilai jual unit.
- Total biaya maintenance per unit tidak terhitung → harga sewa & keputusan jual/ganti aset tidak data-driven.
- Packing dokumentasi serah terima unit ke klien ribet.

## 2. Persona

| Persona | Deskripsi | Kebutuhan utama |
|---|---|---|
| **Admin Rental** | Owner/manager rental alat berat. Lapangan & kantor. | Pantau status semua unit, biaya TCO, pengingat servis, rekap buat bos/laporan |
| **Operator / Mekanik** | Orang yang ngecek & servis unit di lapangan. HP doang. | Cepat catat servis pas di unit, pindai QR, upload foto kerusakan |

## 3. Use Case Utama

1. **UC-01 Daftarkan unit baru** — admin input unit (nama, no unit, kategori, HM awal), sistem generate QR.
2. **UC-02 Catat maintenance** — mekanik scan QR → halaman unit → isi log: jenis (rutin/perbaikan), HM, biaya, catatan, foto.
3. **UC-03 Pantau fleet** — admin lihat dashboard: unit due/overdue servis, total biaya per unit/kategori.
4. **UC-04 Dapat reminder** — sistem kasih notif in-app saat unit mendekati/menembus jadwal servis.
5. **UC-05 Export biaya** — export CSV biaya per unit untuk rekap.

## 4. Scope MVP

### 4.1 Fitur In-Scope

| # | Fitur | Penerima |
|---|---|---|
| F1 | Auth Supabase, role **admin** + **operator**. Register bebas = self-serve: bikin org baru + jadi admin org itu (operator dibuat admin via invite/SQL) | Admin, Operator |
| F2 | CRUD asset: nama, no unit, kategori (excavator/loader/dll), HM awal | Admin |
| F3 | Generate QR per unit, cetak/simpan sebagai PNG | Admin |
| F4 | Scan QR via kamera (desktop + mobile browser) → buka halaman unit | Operator |
| F5 | Create maintenance log: jenis, HM saat servis, biaya, catatan, upload foto (1+/log) | Operator, Admin |
| F6 | Auto-update `next_due_hm` + `next_due_date` dari interval terakhir per log | Sistem |
| F7 | Dashboard fleet: status due/overdue, total biaya per unit + kategori | Admin |
| F8 | Riwayat maintenance per unit (list + total biaya) | Admin, Operator |
| F9 | Notifikasi in-app (badge + list) hasil Vercel Cron | Admin |
| F10 | Export CSV biaya per unit | Admin |

### 4.2 Anti-Goals (SKIP di MVP)

- Email/WhatsApp reminder (butuh external key). → `ponytail: in-app dulu, mail ketika ada user beneran`
- PWA penuh / offline sync. Scan kamera tetep jalan di browser HP.
- QR dengan token aman. MVP QR berisi ID unit aja.
- Multi-lokasi/cabang.
- Integrasi akuntansi / invoicing.
- Approval flow maintenance.
- Dashboard realtime (cukup refresh manual).

## 5. Acceptance Criteria

- **A1 (Auth):** Register bebas → langsung jadi admin org baru (org terisolasi otomatis). Admin bisa set role operator via SQL. Test: user org B login → ngga bisa baca data org A (RLS enforced).
- **A2 (Asset):** Admin bikin unit → QR muncul ≥ 1 detik, bisa di-download PNG resolusi cetak (≥ 512px).
- **A4 (Scan):** Scan QR dari kamera HP → buka `/assets/[id]` ≤ 3 detik.
- **A5 (Log):** Simpan log → muncul di riwayat, total biaya unit keupdate, `next_due` ter-hitung otomatis. Foto sukses upload ke Storage.
- **A7 (Dashboard):** Unit yang `next_due_date <= hari ini` muncul di tab overdue ≤ 1 menit setelah log lama disimpan.
- **A9 (Notif):** Cron daily → insert notifikasi untuk unit due/overdue dalam X hari; badge kelihatan di header.
- **A10 (CSV):** Export → file `biaya-{unit}.csv` kolom: tanggal, jenis, HM, biaya, catatan; total di row terakhir.

## 6. Non-Functional

- **Stack:** Next.js (App Router) + Vercel + Supabase (Postgres, Auth, Storage, Edge/Cron). Semua di Free Tier.
- **Multi-tenant:** isolasi 100% via RLS per `organization_id`; service role tidak pernah dipakai di client.
- **Mobile-first:** halaman scan & form log usable di layar ≤ 375px, tanpa horizontal scroll.
- **Performance:** dashboard fleet load < 2s (data < 10rb log).
- **Keamanan:** semua key server-side; client cuma pakai anon key + RLS.
- **Observability:** 1 log `console.error` path jelas; error boundary tiap route grup.

## 7. Data Domain & Map Ke Dokumen Ide

Ganti "kendaraan/km" jadi "unit alat berat / HM (jam meter)" sesuai pilihan user.

- `assets`: no unit, nama, kategori, **hm_initial**, **next_due_hm**, **next_due_date**, org FK.
- `maintenance_logs`: jenis (rutin/perbaikan), **hm**, biaya, catatan, asset FK, author FK.
- `photos`: storage path, log FK.
- `notifications`: user FK, pesan, read flag.

## 8. Success Metrics (Hipotesis, belum divalidasi)

- ≤ 60 detik untuk catat satu maintenance (waktu admin/operator).
- 100% unit punya QR tercetak dalam 1 minggu adopsi.
- 1 hitungan TCO per unit per bulan tanpa Excel.
- Pricing hipotesis: Rp50–100rb/unit/bulan (dari dokumen ide) — validasi dengan 5 calon user.
