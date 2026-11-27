# Panduan agent: bekerja dari konteks yang dapat dibuktikan

## Batas tugas dan urutan kerja

Mandat sesi pembuatan dokumen ini: hanya menulis di structur/. Izin umum akses proyek tidak membatalkan larangan perubahan file lain. Rekomendasi berikut berlaku untuk sesi implementasi berikutnya yang memang mendapat mandat perubahan.

1. Baca README dan checkpoint; cocokkan git status/log terhadap hash snapshot.
2. Baca AGENTS.md di area yang akan disentuh. Tidak ada root AGENTS.md yang ditemukan pada inventaris awal.
3. Telusuri UI ? client ? handler/RLS ? tabel/trigger sebelum membuat solusi. Kenali jalur fallback.
4. Pisahkan fakta kode, laporan historis, dugaan penyebab, dan hasil runtime.
5. Tentukan skenario penerimaan konkret; ubah hanya lingkup yang diminta.
6. Jalankan pemeriksaan yang tersedia dan relevan; catat perintah, hasil, keterbatasan.
7. Perbarui checkpoint setelah pekerjaan, termasuk perubahan schema/env/deployment yang benar-benar dilakukan.

Instruksi AGENTS mobile mengharuskan membaca dokumentasi Expo versi yang sesuai sebelum mengubah API Expo/RN/EAS; manifest saat snapshot Expo ~58.0.26. AGENTS juga meminta lint/typecheck, tetapi mobile belum memiliki script lint. Jangan mengarang hasil lint atau memasang konfigurasi baru tanpa menilai lingkup pekerjaan. Instruksi Expo Router berbeda dengan pager aktif; perubahan arsitektur butuh tugas yang jelas.

## Konfigurasi tanpa membocorkan nilai

| Lingkup | Nama environment | Makna |
|---|---|---|
| Web | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY | Public client Supabase |
| Mobile | EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY | Public client Supabase |
| Mobile | EXPO_PUBLIC_GO_API_URL, EXPO_PUBLIC_API_URL | Base URL Go; yang pertama prioritas |
| API | SUPABASE_URL | URL Supabase |
| API | SUPABASE_SERVICE_ROLE_KEY | Server-only; akses istimewa PostgREST/Auth |
| API | SUPABASE_JWT_SECRET | Verifikasi JWT HMAC lokal |
| API | ENCRYPTION_MASTER_KEY | Tepat 32 byte untuk vault |
| API | PORT | Default 8080 |

File .env ditemukan di apps/web dan apps/mobile; nilainya tidak dicantumkan di dokumentasi. EAS profile juga menyimpan public URL/anon key. Public anon key berbeda fungsi dari service-role/JWT/encryption secret; jangan memindahkan secret server ke EXPO_PUBLIC_ atau VITE_.

API membaca .env dari working directory melalui helper sendiri. Menjalankannya dari folder yang salah dapat membuat env tidak terbaca. Root script JS tidak memulai Go otomatis.

## Perintah yang dideklarasikan proyek

Perintah ini **referensi untuk sesi berikutnya**, bukan catatan bahwa sudah dijalankan pada audit dokumentasi.

| Tujuan | Working directory | Perintah |
|---|---|---|
| Web dev | root | pnpm dev:web |
| Mobile dev | root | pnpm dev:mobile |
| Web build | root | pnpm build:web |
| Lint workspace | root | pnpm lint |
| Mobile typecheck | apps/mobile | pnpm exec tsc --noEmit |
| Web lint | apps/web | pnpm lint |
| Go dev | apps/api | go run ./cmd/server |
| Go static checks | apps/api | go vet ./... |
| Go build | apps/api | go build ./cmd/server |
| EAS preview historis | apps/mobile | npx -y eas-cli@latest build --platform android --profile preview --non-interactive |

Root lint menjalankan Turbo lint; tidak berarti mobile/Go ikut teruji. Web build script hanya vite build, bukan perintah typecheck eksplisit. Menjalankan build/install dapat menulis cache, binary, dist, lockfile atau dependency; jangan dilakukan di bawah mandat hanya-documentasi.

## Build dan hosting yang ada

- Mobile app name meroo.gi, slug mobile, scheme meroogi, Android package com.meroogi.mobile, portrait/light.
- appVersion 1.0.1 dan runtime policy appVersion. preview dan production EAS sama-sama buildType apk; preview internal distribution, masing-masing channel berbeda.
- Konfigurasi Android memilih arm64-v8a serta shrink/proguard release. Jangan mengasumsikan emulator x86 dapat memasang artefak ini.
- Updates URL dan projectId ada di app.json; release App.tsx mencoba update saat startup.
- Metro watchFolders root monorepo dan resolver node_modules aplikasi/root. .npmrc memakai hoisted.
- Vercel API installCommand skip dan buildCommand go build -o $VERCEL_OUTPUT_FILE ./cmd/server. Tidak ada bukti deployment baru di sesi ini.
- Vercel web rewrite ke index.html. Pengaturan dashboard hosting di luar file belum diperiksa.

## Matriks penerimaan yang perlu dijalankan saat perbaikan

| Area | Skenario minimum dan hasil yang dicari |
|---|---|
| Auth | Email, username, Google, token kedaluwarsa, sign-out/sign-in role berbeda; role sesuai server |
| Booking | Paket satu/banyak, tanpa tier, cart, submit cepat, timeout; tidak ada order tambahan tak disengaja |
| Vault | Owner simpan, assigned worker baca, unrelated user ditolak, request/submit kode, cancel/complete wipe |
| Assignment | Offline/cuti/penuh/seniority rendah, manual/auto, terminal order; aturan konsisten |
| Progress | 0/99/100, koreksi turun, kegagalan salah satu write; aggregate/log/counter/deadline konsisten |
| Checklist | Owner baca, staff yang sesuai edit, user lain ditolak, ganti hari sekitar tengah malam |
| Review | Hanya order selesai milik reviewer, satu review/order, edit/delete agregat worker diperbarui |
| Finance | Pending/cancelled dikecualikan, revenue/escrow benar, rasio valid, allocation gagal terdeteksi |
| Chat | Dua akun, modal buka/tutup, kirim gagal, polling tidak bocor sesudah close |
| Media | Permission ditolak, upload bucket gagal, file besar, fallback jelas dan ukuran terkendali |
| UI | Safe-area, keyboard, scroll tab admin, modal bertumpuk, tombol disabled, loading/error/empty |
| Parity web | Flow bersama tetap benar setelah perubahan SQL/trigger walau web tidak diedit |

Tidak ditemukan test files khusus dalam inventaris source saat audit. Tambahkan pengujian yang melindungi aturan bisnis ketika benar-benar melakukan perbaikan; jangan menyamakan compile dengan validasi RLS atau runtime.

## Template instruksi lanjutan

> Baca structur/README.md, structur/checkpoint.md dan dokumen area terkait. Cocokkan HEAD/status terbaru. Tugas: [hasil konkret]. File yang boleh berubah: [lingkup]. Jangan menyentuh perubahan pengguna yang sudah ada. Telusuri jalur Supabase langsung dan Go/fallback. Pisahkan temuan dari perubahan yang dibuat. Laporkan validasi yang benar-benar dijalankan, kebutuhan migrasi/deploy yang belum dilakukan, dan perbarui checkpoint.

## Template checkpoint berikutnya

- Tanggal, HEAD awal/akhir, branch, status working tree awal.
- Tujuan dan file yang boleh berubah.
- Perubahan per alur, lokasi source, alasan.
- Kontrak API/SQL/env yang berubah.
- Tes/perintah dan hasil, bukan hanya checkbox.
- Status build/deploy/migrasi beserta bukti waktunya.
- Masalah terbuka dan langkah berikutnya.
- Konfirmasi lingkup file, tanpa secret atau data pelanggan.
