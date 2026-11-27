# Checkpoint 1.0.1: progres, perubahan, dan konteks lanjutan

Tanggal pencatatan: 27 November 2026. Snapshot HEAD: `b93368eb357b1cf6641281b61d08004bd31a8508`, branch `main`; ref lokal `origin/main` menunjuk commit sama saat pemeriksaan. Tidak dilakukan fetch, commit, push, build, deploy, migrasi, atau perubahan kode dalam sesi ini.

## Cara membaca versi

Tidak ditemukan tag rilis 1.0.0/1.0.1. Pembanding yang digunakan adalah `35075b6`, parent dari commit perbaikan backend 1.0.1. Pada commit pembanding, app.json masih 1.0.0; pada HEAD menjadi 1.0.1. Ini baseline Git paling dekat sebelum dua commit rilis, bukan bukti commit APK 1.0.0 yang pernah dipasang pengguna.

| Urutan | Commit dan waktu WIB | Isi |
|---|---|---|
| Baseline | 35075b6, 26 Nov 19:43:27 | Wallpaper splash, keyboard-safe modal, segmented navigation, percentage bar |
| Perbaikan backend | 1dc5e71, 27 Nov 02:07:39 | 5 file Go, 257 penambahan dan 30 penghapusan |
| Perluasan mobile/rilis | b93368e, 27 Nov 02:19:34 | 20 file, 7774 penambahan dan 603 penghapusan |
| Sesi dokumentasi ini | Working tree setelah HEAD | Hanya penambahan dokumentasi structur/ |

Total rentang `35075b6..b93368e`: **25 file, 8031 baris ditambah, 633 dihapus**, termasuk lockfile dan transkrip. Angka ini ukuran diff, bukan jumlah fitur. Daftar numstat lengkap ada di [perubahan-git.md](perubahan-git.md).

Fitur splash, pemisahan tab admin/worker, animasi pond/transisi, perbaikan keyboard awal sudah ada sebelum baseline ini. Jangan menghitung seluruhnya sebagai fitur baru dua commit 1.0.1.

## Pembaruan terhadap checkpoint sebelumnya

Sumber pertama yang dibaca adalah `structure/latest 1.0.1.txt`. Transkrip berhenti pada judul perbaikan backend, sehingga laporan ini melengkapinya dari kode, diff, dan laporan audit eksternal lama.

- Transkrip lama mengatakan pekerjaan tidak di-commit/push. Pada snapshot sekarang perubahan tersebut **sudah ada dalam dua commit lokal**, dan origin/main lokal sejajar. Ini keadaan berbeda waktunya; keberadaan ref lokal bukan verifikasi baru ke GitHub.
- Mismatch action 2FA mobile/Go sudah diatasi: mobile memakai request/submit, Go menerima alias lama juga.
- Tabel vault/checklist/finance dan kolom seniority/deleted_at sekarang mempunyai DDL v3. Namun username/contact_info/fixed_price/worker_invites masih belum lengkap dalam SQL lokal.
- Tema SAGE terang dan pager mobile tetap aktif. Catatan dark glassmorphism/Expo Router tidak mencerminkan struktur runtime.
- Shared API/checklist/theme yang disebut dalam transkrip baru masuk Git pada b93368e. Transkrip merekam kondisi working tree, bukan hanya commit saat itu.
- Fallback master key belum diperbaiki; bukan sekadar key hardcoded, panjang fallback juga tidak memenuhi syarat crypto.

## Rincian backend: sebelum ? sesudah

### internal/middleware/rbac.go

Sebelum: token harus lolos JWT HMAC lokal, sehingga signing method/secret yang berbeda ditolak. Sesudah: validasi lokal tetap dicoba, tetapi jika user ID tidak didapat, token diverifikasi ke Supabase Auth /auth/v1/user. Role tetap diambil dari profiles menggunakan service-role. Ini berkaitan dengan toast sesi tidak valid pada screenshot vault/assignment; keberhasilan di perangkat belum diuji ulang pada sesi ini.

### internal/handlers/auth.go

Username dalam query ilike kini memakai url.QueryEscape. Ini mencegah karakter query tertentu merusak URL; tidak sama dengan menghapus seluruh semantik wildcard ilike atau menambah rate limit.

### internal/handlers/profile_progress.go

CreateOrderProgress kini membaca order, memastikan assigned worker/admin, dan menolak cancelled. Sebelumnya hanya group route worker/admin yang melindungi endpoint. Insert progress dan update order tetap paralel, belum atomik.

### internal/handlers/workers.go

Seniority dinormalisasi menjadi junior/mid/senior; lead dipetakan ke senior. Mid sebelumnya tidak termasuk validasi invite/update, sedangkan lead berpotensi bentrok dengan constraint database. Query email kini di-escape. Update akun menerima is_available dan is_on_leave sebagai pointer boolean sehingga false dapat dikirim dengan jelas.

### internal/handlers/api.go

| Operasi | Perubahan 1.0.1 |
|---|---|
| CancelOrder | Mencoba menghapus encrypted_password dan verification_code setelah cancel, selain mengandalkan trigger |
| HandleVerificationCode | Memeriksa order/status; request hanya assigned worker/admin, submit hanya owner/admin; menerima alias action lama |
| EditOrderProgress | Memeriksa assignment/status; persentase 100 mengisi completed/completed_at, koreksi dari completed membuka kembali in_progress |
| ListChecklists | Filter tanggal di-escape |
| AssignWorkerToOrder | Menolak assignment ulang completed/cancelled |
| GetFinanceSummary | Memisahkan completed sebagai gross_revenue, paid/in_progress sebagai escrow_revenue; menambah completed_orders_count |
| DeleteService | Memeriksa histori order; soft-delete service bersejarah dengan is_active=false/deleted_at, fallback tanpa deleted_at; hard delete jika tidak ada histori terdeteksi |
| UpdateReview/DeleteReview | Membaca reviewee dan menghitung ulang rating/count; rating edit dijepit 1?5 |

Batas tetap ada: kepemilikan checklist API, eligibility manual assignment, error yang diabaikan, dan operasi parsial. Lihat [temuan.md](temuan.md).

## Rincian mobile: sebelum ? sesudah

### App.tsx

- Menambah SafeAreaProvider/insets untuk tab bar.
- Workspace sekarang membaca tiers, review rating, semua service/kategori bagi admin; customer menerima data aktif.
- Join order memuat consumer/worker/contact; fallback query dan refresh selected order ditambahkan.
- Menambah mode forgot password dan pemanggilan resetPasswordForEmail.
- Registrasi menambah phone/WhatsApp dan patch profile username/contact saat session langsung tersedia.
- Props role/tiers/ratings diberikan ke katalog; selesai order berpindah ke tab orders.
- Admin mendapat data katalog lengkap; Worker mendapat profile dan callback update availability.
- Root navigation dan OAuth bukan fitur yang baru seluruhnya pada commit ini.

### CatalogScreen.tsx

Sebelumnya booking sederhana. Sekarang multi-select service tiers, hitung harga/jam gabungan, standar server bersama, cart multi-item, hapus item cart, checkout cart, rating dan daftar review layanan, search/kategori dan empty state lebih lengkap.

Pemesanan dibatasi consumer di UI/validasi. Direct checkout memakai submitting, menutup modal segera setelah order tersimpan, dan memisahkan gagal vault dari gagal pembuatan order. Ini mengurangi skenario pengguna mengulang order karena toast vault gagal. Belum ada idempotency key server; cart tidak menyimpan credential.

### OrderDetailModal.tsx

- Polling chat tiap 3500 ms ketika modal terlihat.
- Fetch existing review dan form rating/comment untuk owner pada completed.
- Modal cancel dengan alasan, loading, Go API lalu fallback Supabase.
- Tanggal lokal checklist dan pergeseran hari diperbaiki.
- Kontrol mutasi checklist ditampilkan/diaktifkan untuk staff.
- Tampilan informasi peserta, catatan, jadwal/deadline/overdue, alasan cancel dan review diperluas.
- Safe-area, penanganan modal dan isi detail diperbarui.
- Edit progres tetap melalui Go; checklist aktif tetap langsung Supabase.

### WorkerScreen.tsx

Menambah filter aktif versus selesai/batal, status online/offline/cuti, ringkasan kapasitas/rating, customer/contact/notes, overdue, preset progres 25/50/75/100, serta penguncian form pada order terminal. Fallback progress kini memeriksa error update order, bukan hanya error insert progress. Header memakai safe-area.

### AdminScreen.tsx

Perubahan terbesar UI mobile:
- Subtab horizontal finance/orders/workers/catalog/reviews.
- Manual candidate picker selain auto assignment, dengan skor/eligibility dan fallback ranking client.
- Filter order dan detail peserta.
- Kontrol akun diperluas dengan seniority mid, availability/cuti, kapasitas, identitas serta email/password.
- CRUD service, paket dan kategori, aktivasi service, nested catalog tabs.
- Edit/hapus review serta reload data tambahan admin.
- Grafik mingguan dari order, ringkasan completed/escrow, validasi total rasio.
- Modal input dan header menyesuaikan keyboard/safe-area.

Fallback merupakan perilaku nyata yang ditambahkan/diperluas, tetapi bukan bukti kontrak Go dan Supabase identik. Khusus delete service dan update akun, fallback memiliki dampak berbeda.

### HomeScreen.tsx

Menambah modal cara order/ketentuan, indikator overdue, safe-area dan penyesuaian teks kartu agar lebih lentur. Pond/visual dasar sudah ada sebelum perubahan ini.

### OrdersScreen.tsx

Filter diperinci menjadi semua/aktif/pending/berjalan/selesai/batal; paid dihitung pada filter berjalan. Menambah empty state ke katalog, overdue, catatan pembatalan dan penyesuaian tampilan. Progress bar bukan seluruhnya baru.

### ProfileScreen.tsx

Perubahan pada rentang ini hanya import/use safe-area dan padding header dinamis. Edit profile/avatar sudah ada sebelumnya.

### src/lib/goApi.ts

Action verifikasi diubah dari request_code/submit_code menjadi request/submit. updateUserAccount ditambah is_available/is_on_leave. Wrapper token refresh, timeout dan retry tidak boleh seluruhnya diklaim baru hanya karena file berubah.

### src/lib/imageCompressor.ts

Upload kini mencoba bucket avatars/screenshots lebih dahulu sebelum meroogi-media. Fallback data URI tetap ada bila upload gagal; perbaikan bucket tidak menghapus risiko payload besar.

### app.json

expo.version 1.0.0 ? 1.0.1. runtimeVersion tetap memakai policy appVersion. Package version npm mobile tetap 1.0.0; keduanya berbeda sumber versi.

## Database, package bersama, dan tooling

| File | Perubahan |
|---|---|
| database/migration_v3.sql | File baru 217 baris: trigger metadata OAuth, services seniority/soft-delete, policy CRUD admin, FK review SET NULL, policy koreksi progress/review, tabel vault + wipe trigger, checklist, finance/settings/allocations |
| packages/shared/src/api.ts | Client REST Go baru dengan token callback, order/vault/checklist/assignment/finance/role/service/review methods |
| packages/shared/src/checklists.ts | Tipe preset dan enam preset daily/weekly/monthly |
| packages/shared/src/theme.ts | SAGE_THEME bersama |
| packages/shared/src/index.ts | Mengekspor tiga modul baru di atas |
| .npmrc | node-linker=hoisted untuk layout dependency |
| .gitignore | Menambah pola *bug/; isi lama campuran perintah belum dibersihkan |
| pnpm-lock.yaml | 4791 baris tambah, 170 hapus; jangan diterjemahkan menjadi klaim semua versi dependency dinaikkan |
| structure/latest 1.0.1.txt | Menambah transkrip sesi lama |

Tidak berubah dalam rentang ini: apps/web, package.json mobile, eas.json, router Go, crypto, scheduler, receipt, schema.sql dasar dan tipe Supabase. Ini menjelaskan mengapa perubahan fitur belum otomatis menutup seluruh drift.

## Bukti build historis

Checkpoint lama melaporkan build Expo EAS FINISHED dengan appVersion/runtimeVersion 1.0.1 dan package com.meroogi.mobile:

- [Halaman build historis](https://expo.dev/accounts/meroohihi/projects/mobile/builds/d05512dd-09a2-4e58-8222-704ba6dd40b2)
- [Artefak APK yang tercatat](https://expo.dev/artifacts/eas/-DusUGM8D_OiLuuDFVpod3vnxRzKTfPo4N-sfOJK2yQ.apk)

Tautan disalin dari transkrip lokal, **tidak diakses atau diverifikasi ulang**. Tidak diketahui apakah APK tepat sama dengan HEAD tanpa metadata build tambahan. Tidak ada build baru dalam sesi dokumentasi.

Transkrip mencatat percobaan tsc/Go sempat gagal, kemudian dijalankan ulang setelah typo diperbaiki. Laporan audit eksternal mencentang tsc, go vet/build, expo-doctor/lint sebagai selesai, tetapi raw output lengkap tidak disertakan. Maka ini klaim validasi sesi lama, bukan hasil pemeriksaan baru. Mobile bahkan belum mempunyai script lint dalam package.json saat ini.

## Pemetaan keluhan pengguna

| Keluhan bug/bug.txt | Perubahan yang terkait | Status kepastian |
|---|---|---|
| Order masuk, credential tidak tersimpan | Auth fallback, action verification, pemisahan warning vault | Kode berubah; key/env/skema masih perlu diperiksa |
| Spam menimbulkan order berulang | Guard submitting, modal direct booking ditutup setelah insert | Mitigasi UI; belum idempotent server |
| Tidak ada rating/review | Review detail, katalog, moderasi admin | Ada di kode; RLS dan runtime belum dites |
| Assign gagal | Auth fallback, candidate/manual picker, fallback assignment | Ada jalur baru; eligibility/fallback berbeda |
| Worker/admin dapat memesan | Guard consumer pada katalog | Belum perlindungan lengkap database |
| Cancel tidak berfungsi | Modal alasan, fallback, wipe backend | Ada di kode; trigger/RLS remote belum diverifikasi |
| Chat tidak realtime | Polling 3,5 detik | Bukan push realtime |
| Tab/slider admin berantakan | Horizontal subtabs, keyboard/safe-area, input rasio | Perlu QA layar/perangkat, bukan bukti gesture selesai |

## Handoff sesi ini

Dokumentasi tersedia melalui [README.md](README.md). File lama structure/ tidak disentuh. Tidak ada perubahan kode atau remote. Inventaris dan statistik dibuat dari file/revision lokal, referensi source dan tautan internal diperiksa. Build/runtime test sengaja tidak dijalankan karena tugas ini hanya analisis dan tidak mengizinkan artefak di luar structur/.

Jika ada sesi implementasi baru: mulai dari memverifikasi skema dan environment, periksa batas role/service-role serta fallback, lalu uji alur consumer/worker/admin. Jangan langsung mengulang build APK dengan asumsi semua backend/database sudah mengikuti versi aplikasi.
