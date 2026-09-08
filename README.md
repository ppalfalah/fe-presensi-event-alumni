# Sistem Presensi & Event Alumni Al-Falah (Frontend)

Aplikasi web modern berbasis **Next.js App Router** untuk pengelolaan presensi, event, segmentasi engagement, dan direktori alumni Pondok Pesantren Al-Falah. Dilengkapi dengan antarmuka PWA (Progressive Web App), integrasi Google OAuth, scanner QR Code kamera langsung, dan dashboard manajemen admin.

---

## 🚀 Tech Stack

- **Framework**: [Next.js 16 (App Router)](https://nextjs.org/) (React 19, TypeScript)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State & Server Management**: [TanStack Query v5 (React Query)](https://tanstack.com/query/latest)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Icons & UI Utilities**: [Lucide React](https://lucide.dev/)
- **Charts**: [Chart.js](https://www.chart.js.org/) & [react-chartjs-2](https://react-chartjs-2.js.org/)
- **QR Code**: [html5-qrcode](https://github.com/mebjas/html5-qrcode) & [qrcode](https://www.npmjs.com/package/qrcode)
- **PWA**: Service Worker & Web App Manifest

---

## 📋 Prasyarat Sistem

- **Node.js**: Versi `>= 20.x` (Direkomendasikan Node.js 22 LTS)
- **Package Manager**: `npm` (atau `pnpm` / `yarn`)
- **Backend API**: Laravel REST API yang sudah berjalan

---

## ⚙️ Panduan Instalasi & Menjalankan Lokal

### 1. Clone Repository
```bash
git clone <URL_REPOSITORY_ANDA>
cd fe-presensi-event-alumni
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```

Sesuaikan variabel di dalam `.env.local`:
```env
# Base URL API Laravel Backend
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api

# Host Backend untuk proxy rewrites
BACKEND_URL=http://127.0.0.1:8000

# Google OAuth Client ID (opsional jika flow redirect ditangani backend)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 4. Jalankan Development Server
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Script yang Tersedia

| Script | Deskripsi |
| --- | --- |
| `npm run dev` | Menjalankan server development Next.js dengan Webpack bundler |
| `npm run build` | Membuat production build (standalone output) |
| `npm run start` | Menjalankan server production Next.js |
| `npm run lint` | Menjalankan validasi ESLint untuk standarisasi kode |

---

## 📁 Struktur Direktori

```text
fe-presensi-event-alumni/
├── app/                      # Next.js App Router (Halaman & Layouts)
│   ├── admin/                # Portal & Dashboard Khusus Admin
│   ├── alumni/               # Portal Alumni (PWA, Dashboard, Scan QR, Riwayat)
│   ├── components/           # Komponen UI Reusable (Admin & Alumni)
│   ├── forgot-password/      # Alur reset kata sandi
│   ├── reset-password/       # Form ubah kata sandi via token email
│   ├── globals.css           # Styling global Tailwind CSS
│   ├── layout.tsx            # Root Layout
│   ├── manifest.ts           # Konfigurasi PWA Manifest
│   ├── page.tsx              # Landing Page Utama
│   └── providers.tsx         # TanStack Query & Service Worker Provider
├── context/                  # React Contexts (e.g. SidebarContext)
├── docs/                     # Dokumentasi Teknis & Panduan
│   ├── deployment/           # Panduan Deployment Server & VPS
│   └── guides/               # Panduan Integrasi Fitur
├── hooks/                    # Custom Hooks (Admin & Alumni queries/mutations)
├── lib/                      # Utilitas API, Auth Interceptor, Heartbeat, Types
├── public/                   # Static Assets, PWA Icons, dan sw.js
├── next.config.ts            # Konfigurasi Next.js, Rewrites, & Security Headers
└── package.json
```

---

## 🔐 Keamanan & Fitur Utama

- **Security Headers Terintegrasi**: Mengaktifkan proteksi `X-Frame-Options` (anti-clickjacking), `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`, `Referrer-Policy`, dan `Permissions-Policy`.
- **Proteksi Rute Dinamis & Session Heartbeat**: Mekanisme auto-logout otomatis jika sesi kedaluwarsa atau token tidak valid via `lib/heartbeat.ts`.
- **Service Worker Aman**: Service Worker hanya meng-cache static assets dan secara eksplisit mem-bypass rute `/api/` dan data dinamis user.
- **PWA & Akses Kamera**: Dukungan penuh Progressive Web App yang dapat di-install di Android & iOS, dengan integrasi scanner QR kamera bawaan.

---

## 📚 Dokumentasi Lanjutan

- [Panduan Deployment Production VPS](docs/deployment/frontend-production.md)
- [Struktur Hook & Query TanStack](docs/QUERY_HOOK_STRUCTURE.md)
- [Panduan Integrasi Google OAuth](docs/guides/google-auth.md)
- [Panduan Otorisasi Admin](docs/guides/admin-authorization.md)
- [Panduan Integrasi QR Code](docs/guides/qr-integration.md)
- [Panduan Integrasi Wilayah & Domisili](docs/guides/domicile.md)
- [Panduan Pemetaan Engagement Alumni](docs/guides/engagement-mapping.md)
- [Panduan Riwayat Kehadiran](docs/guides/attendance-history.md)
- [Panduan Auto Logout & Heartbeat](docs/guides/auto-logout.md)

---

## 📄 Lisensi

Hak Cipta © 2026. Seluruh hak cipta dilindungi undang-undang.
