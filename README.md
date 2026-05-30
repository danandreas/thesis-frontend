# Psychoposition — Frontend

Dashboard frontend untuk sistem seleksi kandidat berbasis ML-Enhanced Fuzzy-ELECTRE.

## Teknologi

- **Next.js 15** — App Router
- **TypeScript**
- **Tailwind CSS** — dengan konfigurasi warna brand
- **Axios** — HTTP client dengan Bearer Token
- **Lineicons** — icon library
- **Google Fonts (Montserrat)** — typography

## Setup & Instalasi

```bash
# 1. Clone / extract project
cd thesis_frontend

# 2. Install dependencies
npm install

# 3. Buat file .env.local dari template
cp .env.example .env.local

# 4. Edit .env.local — sesuaikan URL backend
NEXT_PUBLIC_API_BASE_URL=http://localhost:5100/api

# 5. Jalankan development server
npm run dev
# Buka http://localhost:3000
```

## Struktur Halaman

```
/                           → Landing Page (publik)
/login                      → Halaman Login
/register                   → Halaman Register (kandidat)

/dashboard                  → Dashboard utama (admin & kandidat)
/dashboard/profile          → Profil & ganti password

# Admin only
/dashboard/users            → Manajemen pengguna
/dashboard/criteria         → Master kriteria penilaian
/dashboard/req-types        → Jenis syarat tambahan
/dashboard/recruitment      → Kelola rekrutmen & posisi
/dashboard/report           → Generate & lihat ranking ML

# Kandidat only
/dashboard/recruitments     → Rekrutmen aktif
/dashboard/my-applications  → Status lamaran
/dashboard/assessment/:id   → Form asesmen Likert
/dashboard/result/:id       → Hasil ranking
```

## Struktur File Penting

```
src/
  app/                    → Halaman (Next.js App Router)
  components/
    layout/
      DashboardLayout.tsx → Layout utama dashboard (header + sidebar + footer)
  lib/
    api.ts                → Fungsi HTTP: get, post, put, del, patch, upload
    auth.ts               → Login, logout, manajemen session/cookie
  hooks/
    useTheme.tsx          → Dark/light mode context
```

## Fitur

- ✅ Landing Page informatif
- ✅ Login / Register
- ✅ Dashboard admin & kandidat (tampilan sama, menu berbeda)
- ✅ Dark / Light mode toggle (hanya di dashboard)
- ✅ Avatar dropdown (info user + logout)
- ✅ Sidebar navigasi responsif
- ✅ Manajemen kriteria (CRUD)
- ✅ Manajemen pengguna (CRUD)
- ✅ Rekrutmen (buat, publish, tutup)
- ✅ Generate ranking (Fuzzy + EWM + PSO + ELECTRE)
- ✅ Perbandingan ranking Manual vs ML
- ✅ Human-in-the-Loop (admin pilih versi)
- ✅ Form asesmen Likert (kandidat)
- ✅ Halaman hasil ranking (kandidat)
- ✅ Profil & ganti password

## Akun Default (dari seeder backend)

| Role      | Email               | Password   |
|-----------|---------------------|------------|
| Admin     | admin@company.com   | password   |
| Admin     | hr@company.com      | password   |
| Kandidat  | budi@email.com      | password   |
| Kandidat  | rina@email.com      | password   |
```

## Catatan

- File `.env.local` **tidak akan masuk ke Git** (sudah di `.gitignore`)
- Pastikan backend `thesis_flask` sudah berjalan sebelum membuka frontend
- Port default backend: `5100`
- Port default frontend: `3000`
