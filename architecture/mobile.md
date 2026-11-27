# Mobile: struktur dan perilaku aktif

## Entry dan state

`index.ts` mendaftarkan aplikasi Expo. `App.tsx` memuat font, wallpaper loading, `SafeAreaProvider`, `SageFeedbackProvider`, lalu `MainApp`. State session, profile, role, services/categories aktif dan semua data admin, tiers, rating, orders, serta selected order terpusat di MainApp.

Navigasi menggunakan horizontal pager dengan ref dan state `activeTab`; `goToTab` melakukan scroll berdasarkan lebar layar. Consumer mendapat Beranda/Katalog/Pesanan/Akun; worker mendapat tab Worker; admin mendapat Admin dan Worker. Role membatasi render tab. `AGENTS.md` meminta Expo Router, tetapi implementasi ini belum mengikuti pola tersebut; tidak ada dasar untuk merombak navigasi pada tugas dokumentasi.

`syncWorkspace()` membaca profil, services, categories, tiers, reviews, orders secara paralel. Join orders menyertakan service, consumer, worker; bila join gagal dilakukan query fallback yang lebih sederhana. Daftar service disaring `deleted_at`, lalu dipisah aktif versus semua. Selected order diperbarui dari daftar terbaru. Beberapa error diperlakukan sebagai daftar kosong; kosong di layar belum tentu database kosong.

Auth listener membaca session awal, menangani sign-in/update/sign-out. `lastSyncedUserRef` mencegah sinkronisasi user yang sama berulang. Tidak ada polling seluruh workspace yang otomatis setara dengan chat. Release memeriksa Expo Updates, fetch, lalu reload jika update tersedia; development melewati jalur tersebut.

## Layar dan operasi

| File `src/screens/` | Isi dan sumber data |
|---|---|
| `HomeScreen.tsx` | Ringkasan order, SanctuaryPond, pesanan terbaru, overdue, panduan order dan ketentuan dalam modal |
| `CatalogScreen.tsx` | Pencarian/kategori, multi-tier, review service, order langsung, keranjang dalam state lokal |
| `OrdersScreen.tsx` | Filter status, progress bar, deadline/overdue, alasan pembatalan, empty state menuju katalog |
| `WorkerScreen.tsx` | Order aktif/riwayat, availability/cuti, kapasitas/rating, catatan pelanggan, preset progres, upload screenshot |
| `AdminScreen.tsx` | Lima subtab: finance, orders, workers, catalog, reviews; katalog punya services/packages/categories |
| `ProfileScreen.tsx` | Edit identitas/contact info/avatar, logout dan akses workspace sesuai role |

### Auth

Login username memanggil `/v1/auth/resolve-identifier`, lalu Supabase password sign-in. Registrasi mengirim full name, username, phone sebagai metadata; jika langsung mendapat session, profile juga dipatch. Forgot password hanya mengirim email reset; penyelesaian reset tergantung konfigurasi redirect/auth dan belum dibuktikan di APK.

OAuth memakai `makeRedirectUri`, Supabase `signInWithOAuth` dengan `skipBrowserRedirect`, dan `openAuthSessionAsync`. Callback menukar code atau mengatur access/refresh token. Jangan mengganti scheme/redirect tanpa menilai APK, konfigurasi Auth, dan EAS.

### Katalog dan cart

`validateBookingForm` menolak pemesanan non-consumer dan meminta paket bila tersedia, UID, server. Harga adalah jumlah `fixed_price` tier; estimasi memakai estimasi tier bila ada atau service. Direct checkout memakai `submitting` dan menutup modal setelah insert, kemudian mencoba vault. Gagal vault menghasilkan informasi untuk mengisi ulang melalui detail; tidak membuat order baru secara sengaja.

Cart berada di `useState` CatalogScreen, bukan persisted storage. Item menyimpan ID/nama tier, harga/jam, UID/server/notes, tanpa credential. Checkout cart bulk insert ke orders, lalu mengosongkan cart. Guard UI ini bukan idempotency backend. Uji submit berulang dan retry jaringan tetap diperlukan.

### Admin

`loadAdminExtras` mengambil finance, user, review, invite. Ada fallback Supabase bila API gagal. CRUD service/paket/kategori memakai Supabase, sedangkan delete service, edit/delete review, assignment dan kontrol akun mencoba Go terlebih dahulu.

Candidate picker menampilkan eligible, score, dan beban. Fallback mengurutkan berdasarkan beban/rating, bukan rumus Go yang lengkap. Edit user menawarkan role, identitas, email/password, seniority, kapasitas, online/cuti. Fallback profile tidak mengubah email/password Supabase Auth walaupun toast umum tetap sukses.

Rasio finance berupa input angka dan validasi jumlah 100. Jangan mendeskripsikannya sebagai slider drag yang telah teruji. Subtab kini horizontal scroll. Grafik mingguan dibentuk dari orders yang tersedia pada komponen; itu bukan pipeline analytics server.

## OrderDetailModal

File pusat detail order: kalender checklist, vault/2FA, histori progres, chat, struk, cancel, review, zoom screenshot, animasi section/modal dan pengelolaan keyboard.

| Fungsi | Jalur aktif |
|---|---|
| Checklist baca/tambah/toggle/hapus | Supabase langsung; cache per order+tanggal dan optimistic state |
| Vault simpan/baca/request/submit kode | Go API |
| Edit progres | Go API |
| Riwayat progres | Supabase langsung |
| Chat baca/kirim | Supabase langsung, optimistic message dan polling setiap 3500 ms selama modal terlihat |
| Cancel | Go, lalu fallback Supabase jika error |
| Submit review | Supabase insert; state menyimpan existing review |
| Struk | Go receipt dan tampilan/share mobile |

Tanggal awal checklist memakai tanggal lokal. Pergeseran hari memakai konstruksi UTC eksplisit dari komponen yyyy-mm-dd untuk menghindari konversi ambigu. Kontrol checklist diperketat untuk staff pada 1.0.1, tetapi API checklist masih perlu audit izin tersendiri.

## Infrastruktur mobile

- `lib/goApi.ts`: URL dari `EXPO_PUBLIC_GO_API_URL` atau `EXPO_PUBLIC_API_URL`, lalu infer host Metro untuk development, fallback Android emulator `10.0.2.2:8080`. Token direfresh bila hampir kedaluwarsa, 401 dicoba ulang sekali, request timeout default 15 detik.
- `lib/supabase.ts`: client langsung, AsyncStorage untuk session, auto refresh, persist session, tanpa detectSessionInUrl.
- `lib/imageCompressor.ts`: picker → resize/JPEG/base64 → ArrayBuffer → bucket `avatars` atau `screenshots` → fallback `meroogi-media` → fallback data URI. Komentar `<120KB` bukan batas ukuran yang benar-benar ditegakkan.
- `theme/sage.ts`: palet aktif, font Outfit/Plus Jakarta Sans/JetBrains Mono, formatter dan preset checklist lokal.
- `theme/tokens.ts`, `design.md`, komponen bertema Abyss: konteks visual berbeda; jangan diasumsikan seluruhnya aktif. Periksa import sebelum edit atau hapus.
- `components/SageFeedback.tsx`: toast/dialog provider. `SpringTouchable`, `MotionPrimitives`, `ProgressRing`, `SanctuaryPond`, `BotanicalStats`: interaksi, animasi dan visual statistik.
- `context/BlurContext.tsx` dan komponen tambahan tercantum di inventaris; keberadaan file tidak otomatis membuktikan keterpakaiannya dalam entry aktif.

## Batas sinkronisasi dengan web

Multi-paket/cart/review/availability/CRUD admin kini memiliki padanan mobile. Namun cart berbeda implementasi, chat beda interval, ranking beda rumus, mobile mempunyai vault/checklist/finance Go yang belum digunakan web, dan bahasa/tema berbeda. Klaim yang tepat adalah penambahan banyak padanan fitur, bukan parity menyeluruh yang sudah teruji.
