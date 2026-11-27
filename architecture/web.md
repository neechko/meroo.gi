# Web: peta fitur pembanding

Basis analisis sama dengan snapshot README. Tidak ada perubahan `apps/web` antara `35075b6` dan `b93368e`, dan tidak ada perubahan kode web pada sesi dokumentasi ini.

## Entry dan aturan

`index.html` → `src/main.tsx` → `src/App.tsx`. React Router membungkus route SPA, dan CartProvider menyediakan keranjang. `lib/supabase.ts` menggunakan typed factory dari `@meroogi/supabase`. Tidak ditemukan pemakaian `goApi` atau `MerooApiClient` dalam source web.

`AGENTS.md` web meminta UI Inggris, tanpa emoji, custom dialog, TypeScript, dan memperhatikan RLS/triggers. Dokumen masih menyebut Primora/Service.app; brand runtime sudah meroo.gi. Tema Tailwind gelap dan glass utilities berada pada konfigurasi Tailwind/CSS. Jangan menerapkan tema SAGE mobile ke web tanpa tugas tersendiri.

## Route

| URL | Komponen | Akses/layout routing |
|---|---|---|
| `/` | Catalog | Publik |
| `/service/:id` | ServiceDetail | Publik; tindakan order memeriksa user/role |
| `/service/:id/reviews` | ServiceReviews | Publik |
| `/how-to-order` | HowToOrder | Publik |
| `/cart` | Cart | Route terbuka; checkout perlu user |
| `/login`, `/register` | Login, Register | Redirect bila sudah login |
| `/reset-password` | ResetPassword | Halaman reset |
| `/orders` | MyOrders | Session consumer |
| `/order/:id` | OrderTracking | Session; detail bergantung RLS |
| `/worker` | WorkerDashboard | Role worker |
| `/admin` | AdminDashboard | Role admin |
| `/profile` | Profile | Session |
| wildcard | Navigate | Kembali ke `/` |

Route guard adalah perilaku client, bukan izin database.

## Pemetaan file

- `Catalog`: service/kategori aktif, query dan penelusuran layanan.
- `ServiceDetail`: detail, tier aktif, harga/jam gabungan, preview rating, UID/server/notes → addToCart.
- `CartContext`: items/add/remove/update/clear, total harga dan jumlah; disimpan dalam memori React.
- `Cart`: membentuk payload banyak order lalu insert Supabase.
- `MyOrders`: daftar pelanggan dan cancel langsung Supabase.
- `OrderTracking`: join order/profil/service, histori screenshot, update progress dan status, submit review; menyertakan `OrderChat`.
- `OrderChat`: query messages tiap 3000 ms; pengiriman langsung Supabase. Istilah realtime dalam keluhan pengguna tidak berarti implementasi web memakai websocket.
- `WorkerDashboard`: daftar tugas, status availability/cuti, detail kerja dan workload.
- `AdminDashboard`: order dan assignment, pengelolaan worker/katalog/paket/kategori serta ringkasan operasional; logika bisnis berada di komponen besar, bukan service layer Go.
- `Profile`: profil/avatar. `Login`, `Register`, `ResetPassword`: lifecycle Supabase Auth.
- `lib/imageUtils`: kompresi browser sebelum upload; berbeda dari kompresi Expo.
- `lib/dialog.tsx` dan `ConfirmModal`: dialog kustom yang dipanggil imperative dari handler.
- `src/types/database.ts`: salinan tipe database selain versi di package bersama; berpotensi drift.
- `vite.config.ts`: plugin React. `vercel.json`: rewrite seluruh path ke `index.html` untuk SPA.

## Dampak lintas aplikasi

Web dan mobile berbagi tabel yang sama tetapi tidak berbagi semua business logic. Perubahan RLS/trigger atau field service dapat memengaruhi keduanya walaupun kode web tidak disentuh. Perubahan backend Go saja tidak memperbaiki operasi web yang langsung menuju Supabase. Pekerjaan sinkronisasi harus membandingkan hasil bisnis, kontrol akses, dan error handling, bukan hanya menyalin tombol.
