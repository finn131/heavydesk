# Design — HeavyDesk (Fleet Maintenance Log)

## 1. Principles

- **Mobile-first**: operators use phones in the field. Target screens ≥ 375px, no horizontal scroll.
- **One action per core screen**: logging maintenance = a short form, not a wizard.
- **Statistics over cosmetics**: dashboard favors big numbers + status colors (presensidev-style glassmorphism, toned down).
- **Status = meaning by color**:
  - Green ➜ safe (`next_due -- >= 7 days`)
  - Yellow ➜ approaching due (≤ 7 days)
  - Red ➜ overdue / already passed
  - Gray ➜ no schedule yet

## 2. Sitemap

```
/login
├── /dashboard
│   ├── /assets
│   │   ├── /assets/new
│   │   └── /assets/[id]      # detail, QR, history
│   └── /scan
└── /notifications           # badge in header
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
│  Σ cost this mo Rp 4.2m  │
│                          │
│ [Tab: All|Due|Overdue]   │
│ ┌──────────────────────┐ │
│ │ EX-01  ● 2 days      │ │  ← red overdue
│ │  cost Rp 850k        │ │
│ ├──────────────────────┤ │
│ │ LO-07  ◐ 5 days      │ │  ← yellow approaching
│ │  cost Rp 120k        │ │
│ ├──────────────────────┤ │
│ │ CR-11  ● ok          │ │  ← green
│ │  cost Rp 2.1m        │ │
│ └──────────────────────┘ │
│  [+ Unit]   [Scan]       │
└──────────────────────────┘
```

### 3.3 Asset List / Unit Detail
```
list: ┌──────────────────────┐
      │ 📷 EX-01 Excavator   │
      │    8,420 HM · due 3h│
      │  [QR]  [History]     │
      └──────────────────────┘

detail (mobile):
┌──────────────────────────┐
│ ← EX-01        [QR]  ✎   │
│ Category : Excavator     │
│ Init HM  : 8,100         │
│ Next due : 8,500 ● (3h)  │
│──────────────────────────│
│ ADD LOG          [+ PHOTO]│
│──────────────────────────│
│ 🔍 routine · 8,210 HM    │
│    Rp 450k · 12/09       │
│ 🔧 repair · 8,150 HM     │
│    Rp 1.2m · 02/09       │
│──────────────────────────│
│ Total cost: Rp 1.65m     │
│ [Export CSV]             │
└──────────────────────────┘
```

### 3.4 QR + Scan
```
generate (admin):       scan (operator):
┌────────────────────┐  ┌────────────────┐
│ QR Code EX-01      │  │ [camera feed ] │
│   ▛▀▀▀▀▀■▀■▀▀▀▀▜   │  │  point at the  │
│   ▀■▀■▀▀▀▀▀■▀▀■▀   │  │  unit's QR     │
│   ...              │  │ ────────────── │
│ [⬇ Download PNG]  │  │ or type ID:    │
└────────────────────┘  │ [______][Find] │
                        └────────────────┘
```

### 3.5 Add Maintenance Form
```
┌──────────────────────────┐
│ ← EX-01 · New log        │
│ Type   : (•) Routine     │
│           ( ) Repair     │
│ HM      : [8,210]        │
│ Cost Rp: [450,000]       │
│ Notes   : [replaced      │
│           hydraulic hose]│
│                        │ │
│ Photo [+] 📷 (optional)  │
│ [ Save Log ]             │
└──────────────────────────┘
```
Submit flow: validate → upload photos → save → redirect to unit detail with toast "Log saved · next due 8,500 HM".

### 3.6 Notifications
```
┌──────────────────────────┐
│ 🔔 Notifications         │
│ ● EX-01 overdue 2 days   │  12/09
│ ◐ LO-07 due in 3 days    │  12/09
│ ✓ CR-11 updated          │  11/09
└──────────────────────────┘
```

## 4. Main Flow

```
Register/Login
  → (admin) Dashboard → +Unit → fill → QR appears → print/attach to unit
  → (operator) Scan → unit detail → Add Log → photo → Save
  → System updates next_due → dashboard colors change → cron notice
```

## 5. Visual Tone

- Base: Tailwind, soft glassmorphism (borrowed from presensidev) but data-dense, light gray background, blue/slate accents.
- Type: system stack + tabular-nums for cost/HM numbers.
- States: clear focus ring (accessibility), form labels always visible (not just placeholders).
- Scan screen: full-viewport camera, light-toggle button, error message for unknown QR.
- Export/download & QR: always a success feedback (toast).

## 6. Accessibility / Usability Checklist

- Contrast AA (status text legible on colored backgrounds — use icon/status text, not color alone).
- Buttons at least 44px tall (thumbs on phones).
- Forms: label + inline error, number format `Rp 1.200.000` & `8.500 HM`.
- Scan: ask camera permission with an explanation of why.
- History & dashboard: clear date format (23 Sep 2026), not `2026-09-23T...`.