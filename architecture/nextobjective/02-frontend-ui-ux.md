# Objective frontend dan UI/UX

Ini spesifikasi arah penyelarasan berdasarkan source. Tidak ada perubahan UI, mockup, pengujian browser, pengukuran kontras, atau klaim bahwa layout tertentu sudah rusak di perangkat.

## 1. Definisi kemiripan

Website dan aplikasi perlu terasa sebagai produk yang sama lewat warna semantik, tipografi, istilah, susunan informasi, status dan tindakan. Layout menyesuaikan layar: website tetap mempunyai URL, keyboard, pointer, halaman publik dan ruang kerja desktop. Kesamaan tidak berarti setiap halaman desktop harus berbentuk layar ponsel atau setiap animasi mobile dipindahkan.

Acuan identitas yang diusulkan adalah SAGE aktif mobile. Ini turunan dari permintaan menyamakan web dengan mobile, bukan keputusan untuk menyalin semua dekorasi. Dokumen lama web masih meminta dark theme dan bahasa Inggris; pada implementasi berikutnya aturan tersebut perlu direkonsiliasi secara eksplisit dengan arahan produk baru. Sesi ini tidak mengubah AGENTS.md.

## 2. Perbandingan sistem visual

| Aspek | Mobile aktif | Web aktif | Objective berikutnya |
|---|---|---|---|
| Warna | SAGE canvas #DCEAE4, header #9BC4B8, primary #4A8B7C | Background #0a0a0f, surface #18181b, primary indigo #6366f1 | Petakan token semantic bersama; light SAGE sebagai calon baseline web, dark mode hanya jika diputuskan |
| Tipografi | Outfit heading, Plus Jakarta Sans body, JetBrains Mono angka/metadata | Tailwind sans dan body di-override JetBrains Mono | Pisahkan font heading/body/data agar hierarki mendekati mobile; font loading web harus diperhitungkan |
| Surface | Kartu terang, mint/sage, rounded | Dark glass-card, blur/gradient/glow | Ganti recipe komponen bersama, bukan sekadar mengganti background sementara teks tetap putih |
| Status | Label campuran Indonesia/Inggris, badge/persen | Label Inggris, badge berbeda warna | Satu kamus pending/paid/in_progress/completed/cancelled serta label overdue terpisah dari status |
| Bahasa | Mayoritas Indonesia, istilah Costumer | Mayoritas Inggris tetapi reset/auth masih bercampur | Tentukan satu strategi bahasa; sementara jangan anggap seluruh web sudah English-only atau salin typo Costumer |
| Feedback | Sage toast/dialog | Custom dialog + inline error/success, masih alert native pada Register | Standar severity, posisi, loading, retry dan pesan aman; hilangkan perbedaan dialog native saat implementasi |
| Motion | Spring, pond, stagger, animated progress | Fade/slide, bounce badge, gradient animation | Motion sebagai feedback; tambahkan dukungan reduced-motion dan hindari animasi mengganggu operasi panjang |
| Icon | FontAwesome5 serta komponen lain | SVG inline | Samakan arti/ukuran/stroke/label; library boleh berbeda platform |
| Token bersama | SAGE local dan SAGE_THEME shared sudah berbeda sebagian nilai | Tailwind/CSS sendiri | Susun token canonical lalu adapter RN dan CSS; shared package bukan otomatis source-of-truth saat ini |

Sumber: M8, W7, W8. Tidak ada nilai rasio kontras yang diklaim lulus sebelum diuji.

## 3. Navigasi dan struktur informasi

### Customer

Web sekarang membuka katalog di /. Mobile setelah login memiliki Beranda terpisah. Target: katalog publik tetap tersedia; user login mendapat akses mudah ke ringkasan order, katalog, pesanan dan akun. Menjadikan semua halaman web wajib login akan menghilangkan kemampuan yang sudah ada.

Di layar sempit, evaluasi navigasi bawah untuk area user login agar dekat dengan mobile; desktop memakai top navigation atau sidebar yang sesuai ruang. Ini pilihan rancangan, bukan kewajiban menyalin pager horizontal. Browser back harus kembali ke filter/scroll yang wajar.

### Worker dan admin

Pintu masuk role harus konsisten. Admin mobile dapat workspace worker, web saat ini menolaknya pada route /worker. Jika role admin tetap boleh menerima order, navigasi dan server permission harus diperluas bersama.

Subbagian admin yang dituju: Ringkasan/Keuangan, Pesanan, User & Worker, Katalog (layanan/paket/kategori), Ulasan. Web sekarang mempunyai tujuh tab datar; kemampuan services/packages/categories tetap dipertahankan saat dirapikan. Tab web sudah overflow-x-auto, jadi jangan mengklaim tab horizontal belum ada.

## 4. Objective per layar

| Layar | Perubahan pengalaman yang dituju | State dan kriteria penerimaan |
|---|---|---|
| Login/register | Email/username dan Google terlihat konsisten, reset mudah ditemukan, role worker tidak menjadi jalur promosi mandiri | Input tetap saat error; loading mencegah submit ganda; field error dibedakan dari gangguan server |
| Home user | Ringkasan order aktif, terbaru, overdue dan tautan panduan | Data user sendiri, empty state nyata, tidak menampilkan angka dummy; dekorasi pond opsional |
| Katalog | Card dengan nama, kategori, harga awal, estimasi, rating/count dan action jelas | Harga awal tidak disalahartikan sebagai harga semua paket; filter kosong berbeda dari gagal load |
| Service detail/booking | Pilihan paket, ringkasan quote, UID/server/notes, add-cart dan usulan pesan-langsung | Quote berubah terlihat; error inline; total final dari Go; navigasi kembali tidak membuang isian tanpa alasan |
| Cart | Item dapat diperiksa/diedit/dihapus, harga/jam jelas, checkout tunggal | Submit pending terlihat; retry memakai idempotency; harga berubah meminta konfirmasi; tidak menaruh credential dalam cart storage |
| Daftar pesanan | Ringkas status, progress, layanan, deadline, worker dan alasan cancel | Definisi filter sama lintas platform, termasuk paid; action sesuai allowed_actions server |
| Detail order | Ringkasan + section Jadwal, Checklist, Vault/Kode, Progres, Chat, Review, Struk | Desktop bisa dua kolom, sempit accordion/section; direct URL dan anchor section tetap bekerja |
| Vault/kode | Owner melihat status/simpan, assigned staff akses yang diizinkan, waktu/status request jelas | Password tersembunyi default; reveal/copy hanya berizin, tidak bocor ke toast/log; terminal state menjelaskan akses ditutup |
| Checklist | Tanggal aktif, task done/total, preset/custom serta izin edit | Consumer read-only, staff order lain ditolak server, loading pergantian tanggal tidak menampilkan task order sebelumnya |
| Progress | Persentase, catatan, bukti, riwayat koreksi | Kebijakan screenshot sama; tampilan pending sampai server konfirmasi; gagal write tidak tampil sebagai berhasil |
| Chat | Pesan, pengirim, waktu dan state kirim/gagal; scroll terbaru terkendali | Tidak memaksa scroll saat membaca histori; retry tidak menggandakan pesan; gagal polling bukan empty chat |
| Worker | Ringkasan workload/availability, aktif/riwayat, actions dari tiap tugas | Order terminal tidak punya form submit biasa; offline/cuti tidak menghapus histori |
| Admin assignment | Candidate dengan eligibility/reason/load/score, manual dan auto | Kandidat berubah kapasitas ditolak dengan alasan terbaru; admin dapat refresh tanpa kehilangan konteks order |
| Admin finance | Revenue/escrow/alokasi/rasio dan periode statistik jelas | Definisi angka tertulis; nominal bukan bukti paid; rasio valid; failed save mempertahankan input |
| Admin katalog | Tabel desktop/kartu sempit, filter aktif/arsip dan editor paket/kategori | Archive bukan delete histori; service terkait order dijelaskan; kategori terpakai tidak dihapus diam-diam |
| Admin akun/review | Search, detail, perubahan role/status, invite dan moderasi | Tindakan sensitif punya konfirmasi; sukses parsial Auth/profile tidak disembunyikan |
| Profil | Nama, username, kontak canonical, avatar, pintu workspace | Nomor yang diedit muncul sama pada detail order/receipt di kedua aplikasi |

## 5. Kontrak interaksi bersama

Semua operasi data perlu enam kondisi yang jelas: initial loading, data tersedia, empty, error, mutation pending, hasil sukses/gagal. Skeleton/spinner/toast bukan tujuan sendiri; pengguna harus tahu apakah data kosong, belum termuat, atau tidak boleh diakses.

- Tombol disabled memiliki sebab yang terlihat bila tidak jelas dari konteks.
- Dialog destructive menjelaskan objek dan dampaknya, terutama archive service/role/reopen order.
- Setelah mutasi, invalidasi data terkait: assignment memperbarui order, workload, candidate list dan finance, bukan hanya menutup modal.
- Zona waktu/date formatting disepakati; label WIB tidak cukup tanpa konversi.
- Search/filter/pagination tidak hilang hanya karena membuka detail lalu kembali.
- Error domain dari Go dipetakan ke pesan yang sesuai; tidak menampilkan stack, secret, atau raw database error.
- Keyboard web: fokus terlihat, label input, fokus modal masuk/kembali, Escape yang sesuai, tab tidak keluar modal aktif.
- Mobile web: target sentuh, safe-area browser, modal bisa discroll saat keyboard, tidak ada scroll horizontal tak disengaja pada halaman.
- Screen reader: heading/landmark, nama tombol ikon, status tidak hanya warna, progress punya nilai yang dapat dibaca.
- Reduced-motion dan performa media menjadi kriteria uji; tidak menyimpulkan semua komponen sekarang sudah gagal hanya dari pencarian string.

## 6. Yang belum diputuskan

Bahasa tunggal atau bilingual; kebutuhan dark mode web; apakah motif pond perlu hadir di web; format cetak struk; lokasi home user; dan policy screenshot wajib/opsional. Keputusan ini tidak menghalangi dokumentasi, tetapi harus ditutup sebelum implementasi UI terkait. Token, field, layout dan copy tidak boleh diputuskan tersembunyi melalui refactor besar.
