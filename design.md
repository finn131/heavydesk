# Design — HeavyDesk (Fleet Maintenance Log)

## 1. Prinsip

- **Mobile-first**: operator pakai HP di lapangan. Target layar ≥ 375px, no horizontal scroll.
- **Satu aksi per layar inti**: catat maintenance = form pendek, bukan wizard.
- **Statistik > kosmetik**: dashboard maybe pakai angka besar + warna status (vibe glassmorphism presensidev, dikurangi).
- **Status = makna warna**:
  - Hijau ➜ aman (`next_due -- >= 7 hari`)
  - Kuning ➜ mau due (≤ 7 hari)
  - Merah ➜ overdue / already melewati
  - Abu ➜ belum ada jadwal

## 2. Sitemap

```
/login
├── /dashboard
│   ├── /assets
│   │   ├── /assets/new
│   │   └── /assets/[id]      # detail, QR, riwayat
│   └── /scan
└── /notifications           # badge di header
```

## 3. Wireframe (ASCII)

### 3.1 Login
```
┌──────────────────────────┐
│ ⛨ HeavyDesk               │
│                          │
│  [ email                ]│
│  [ password             ]│
│  [ Login  ]  [ Register ]│
└──────────────────────────┘
```

### 3.2 Dashboard (admin)
```
┌──────────────────────────┐
│ HeavyDesk      🔔 (3)  👤 │
│                          │
│  ◐ 12 Unit · ● 2 Overdue │
│  Σ biaya bln ini Rp 4,2jt │
│                          │
│ [Tab: Semua|Due|Overdue] │
│ ┌──────────────────────┐ │
│ │ EX-01  ● 2 hari      │ │  ← merah overdue
│ │  biaya Rp 850rb      │ │
│ ├──────────────────────┤ │
│ │ LO-07  ◐ 5 hari      │ │  ← kuning menjelang due
│ │  biaya Rp 120rb      │ │
│ ├──────────────────────┤ │
│ │ CR-11  ● ok          │ │  ← hijau
│ │  biaya Rp 2,1jt      │ │
│ └──────────────────────┘ │
│  [+ Unit]   [Scan]       │
└──────────────────────────┘
```

### 3.3 Daftar Asset / Detail Unit
```
list: ┌──────────────────────┐
      │ 📷 EX-01 Excavator   │
      │    8.420 HM · due 3h│
      │  [QR]  [Riwayat]     │
      └──────────────────────┘

detail (mobile):
┌──────────────────────────┐
│ ← EX-01        [QR]  ✎   │
│ Kategori : Excavator     │
│ HM awal  : 8.100         │
│ Next due : 8.500 ● (3h)  │
│──────────────────────────│
│ TAMBAH LOG      [+ FOTO] │
│──────────────────────────│
│ 🔍 log rutin · 8.210 HM  │
│    Rp 450rb · 12/09      │
│ 🔧 log perbaikan · 8.150 │
│    Rp 1,2jt · 02/09      │
│──────────────────────────│
│ Total biaya: Rp 1,65jt   │
│ [Export CSV]             │
└──────────────────────────┘
```

### 3.4 QR + Scan
```
generate (admin):       scan (operator):
┌────────────────────┐  ┌────────────────┐
│ QR Code EX-01      │  │ [kamera feed ] │
│   ▛▀▀▀▀▀■▀■▀▀▀▀▜   │  │  arahkan ke   │
│   ▀■▀■▀▀▀▀▀■▀▀■▀   │  │  QR unit      │
│   ...              │  │ ────────────── │
│ [⬇ Download PNG]  │  │ or ketik ID:   │
└────────────────────┘  │ [______][Cari]│
                        └────────────────┘
```

### 3.5 Form Tambah Maintenance
```
┌──────────────────────────┐
│ ← EX-01 · Log baru       │
│ Jenis    : (•) Rutin     │
│           ( ) Perbaikan  │
│ HM       : [8_210]       │
│ Biaya Rp : [450_000]     │
│ Catatan  : [ganti selang │
│            hidrolik     ]│
│                        │ │
│ Foto  [+] 📷 (opsional)  │
│ [ Simpan Log ]           │
└──────────────────────────┘
```
Flow submit: validasi → upload foto → simpan → redirect ke detail unit dengan toast "Log tersimpan · next due 8.500 HM".

### 3.6 Notifikasi
```
┌──────────────────────────┐
│ 🔔 Notifikasi            │
│ ● EX-01 overdue 2 hari   │  12/09
│ ◐ LO-07 due dalam 3 hari │  12/09
│ ✓ CR-11 diupdate         │  11/09
└──────────────────────────┘
```

## 4. Flow Utama

```
Register/Login
  → (admin) Dashboard → +Unit → isi → QR muncul → cetak/attach ke unit
  → (operator) Scan → detail unit → Tambah Log → foto → Simpan
  → Sistem update next_due → dashboard warna berubah → cron notice
```

## 5. Tone Visual

- Basis: Tailwind, glassmorphism lembut (nyontek presensidev) tapi data-dense, background abu muda, aksen biru/slate.
- Tipe: system stack + tabular-nums untuk angka biaya/HM.
- States: focus ring jelas (accessibility), label form selalu visible (bukan cuma placeholder).
- Layar scan: full-viewport camera, tombol toggle light, pesan error saat QR tak dikenal.
- Export/download & QR: selalu ada feedback sukses (toast).

## 6. Accessible / Usability Checklist

- Contrast AA (teks di atas background status bisa dibaca — pakai teks ikon/status, bukan warna doang).
- Tombol minimal 44px height (jempol di HP).
- Form: label + error inline, angka format `Rp 1.200.000` & `8.500 HM`.
- Scan: minta izin kamera dgn penjelasan kenapa.
- Riwayat & dashboard: format tanggal jelas (23 Sep 2026), bukan `2026-09-23T...`.
