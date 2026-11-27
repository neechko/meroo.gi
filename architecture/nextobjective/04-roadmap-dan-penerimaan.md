# Roadmap objective dan kriteria penerimaan

Status seluruh item: **belum dikerjakan**. Ini bukan izin menjalankan perubahan atau deploy sekarang. Prioritas berlandaskan dependensi kode yang terlihat, bukan estimasi hari atau komitmen tanggal.

## Urutan yang disarankan

| Objective | Lingkup berikutnya | Dependensi | Selesai ketika |
|---|---|---|---|
| O0: kontrak produk | Tutup keputusan role, state/payment, screenshot, bahasa/tema, Auth/media boundary | Perbandingan dokumen ini | Keputusan tertulis; istilah dan contoh transisi tidak ambigu |
| O1: fondasi data dan akses | Audit schema remote vs lokal, migration lengkap, ownership checklist/vault, eligibility, key/config | O0 | Skema dapat direproduksi; pengujian peserta/nonpeserta lulus; tidak ada secret fallback yang dipakai |
| O2: platform API | Error contract, typed client, pagination, request IDs, auth/session adapter, unit of work | O1 | Web dan mobile dapat memakai satu resource dengan hak yang sama dan error dapat ditangani konsisten |
| O3: consumer core | Catalog/detail/tiers/reviews, quote, checkout, list/detail order, cancel | O2 | Harga/status sama lintas platform; checkout retry tidak duplikat; direct business writes domain ini dihentikan terencana |
| O4: pengerjaan order | Checklist/vault/kode/receipt/messages/progress/review; worker availability/history | O3 | Web mengejar fitur operasional mobile; kedua client memakai Go dan invariant order konsisten |
| O5: studio admin | Manual/auto assign, katalog archive, akun/invite/moderasi, finance/dashboard | O2-O4 | Hasil kandidat/finance/role sama; tidak ada cascade histori atau silent partial success |
| O6: penyelarasan tampilan | Token SAGE adapter web, navigasi role, layout layar, feedback/state/a11y | O0 dan contract tiap domain siap | Kemiripan visual/istilah tercapai dan fungsi browser/desktop terpelihara |
| O7: cutover dan regresi | Audit sisa Supabase domain access, client lama, RLS/privilege, deployment staging dan rollback | O3-O6 | Traffic bisnis melalui Go, exception tertulis, regresi web/mobile dan bukti runtime tersedia |

Pekerjaan token/komponen UI dapat disiapkan saat kontrak berkembang, tetapi tidak boleh menambah jalur database baru demi mengejar tampilan. Prioritas pertama bukan menyalin semua layar mobile sekaligus.

## Paket pekerjaan yang dapat diberikan ke agent

### O0: keputusan yang dibutuhkan

- Bahasa: pertahankan Inggris pada web dengan kamus setara, samakan Indonesia, atau bilingual? Jangan campur tanpa strategi.
- Identitas: light SAGE baseline web; apakah dark mode juga diperlukan? Kemiripan diminta, detail theme belum final.
- Role: admin boleh mengerjakan order seperti mobile? Worker hanya lewat invite/promosi admin?
- Assignment/payment: kapan paid sah, apa sumber konfirmasi pembayaran, apakah pending dapat langsung diassign?
- Bukti progres: wajib setiap update, opsional, atau per kategori?
- Reopen: siapa boleh membuka kembali completed, konsekuensi deadline/counter/vault/finance?
- Auth/media: facade Go akhir atau pengecualian provider yang jelas?
- Invite: record internal, email invitation, atau mekanisme penerimaan eksplisit?
- User lifecycle: deactivate/archive atau delete; bagaimana histori order dipertahankan?

Keputusan yang belum ada tidak boleh dianggap otomatis mengikuti implementasi mobile yang kebetulan lebih baru.

### O1-O2: fondasi

Area yang kelak terdampak: apps/api/internal, database, packages/shared dan paket tipe. Petakan triggers dan RLS sebelum perubahan. Bukti minimal: user biasa tidak dapat memilih role worker/admin, membaca checklist order lain, menyimpan ulang vault terminal, atau menetapkan harga order seenaknya. Perbaiki endpoint yang sudah tersedia sebelum membuat web bergantung padanya.

### O3: consumer web dan mobile

Area web: Login/Register/Profile, Catalog/ServiceDetail/Cart/MyOrders. Area mobile: App/CatalogScreen/OrdersScreen/ProfileScreen. Objective bukan hanya mengganti fetch; respons server harus mengendalikan quote, total, status dan action. Validasi jalur tanpa login, consumer, worker/admin yang mencoba booking, harga berubah, jaringan timeout dan retry.

### O4: detail order dan worker

Area web: OrderTracking, OrderChat, WorkerDashboard serta section baru yang nantinya diperlukan. Area mobile: OrderDetailModal/WorkerScreen. Tambahkan feature gap web dari satu kontrak, lalu migrasikan operasi mobile yang masih langsung Supabase. Pastikan closed order tidak dapat dimutasi melalui UI atau request langsung kecuali alur koreksi khusus.

### O5: admin

Area web: AdminDashboard yang besar sebaiknya dipisah sesuai domain ketika fitur ditambahkan, bukan rewrite total tanpa baseline. Mobile AdminScreen juga harus berhenti memelihara rumus/fallback berbeda. Candidate list, assignment, finance, invite, moderation dan archive diuji dari dua platform.

### O6: tampilan

Ubah semantic tokens dan komponen dasar dahulu, lalu tiap layar yang kontraknya siap. Uji dark text/light surface, modal, form, tabel, feedback dan responsive state; mengganti beberapa warna tidak cukup. Pertahankan deep links dan browser back, keyboard accessibility, serta katalog publik. Tidak perlu mengganti React/Vite atau framework mobile untuk mencapai tujuan ini.

### O7: cutover

Inventaris seluruh Supabase .from/.storage/auth call dengan klasifikasi domain/Auth/media. Verifikasi tidak ada catch yang diam-diam melakukan write lama setelah Go menolak. Simulasikan versi APK lama; tentukan minimum supported client/masa transisi sebelum policy akses diubah. Rollback mengembalikan versi layanan yang kompatibel, bukan membuka akses data luas sebagai solusi error.

## Skenario penerimaan lintas platform

| ID | Skenario | Hasil yang harus sama |
|---|---|---|
| A1 | Akun yang sama login web/mobile, lalu role diubah admin | Identitas/role/allowed actions diperbarui, tidak menyisakan akses lama |
| A2 | User memilih dua tier yang sama di kedua client | Quote harga, jam, label dan snapshot sama |
| A3 | Checkout timeout lalu pengguna retry | Tidak ada order duplikat; hasil order awal dapat dipulihkan |
| A4 | Order pending dibatalkan dari web | Mobile menampilkan cancelled/reason; vault ditutup sesuai kebijakan |
| A5 | Worker offline/cuti/penuh dipilih manual maupun auto | Go menolak konsisten dengan alasan yang benar |
| A6 | Dua admin mengassign worker hampir bersamaan | Kapasitas tidak terlampaui tanpa kebijakan override eksplisit |
| A7 | Worker kirim progres 100 dari mobile | Web membaca status/log/deadline/counter yang konsisten; vault terminal ditangani |
| A8 | Koreksi completed ke bawah 100 | Hanya izin yang disetujui, efek reopen mengikuti keputusan produk |
| A9 | Consumer mencoba mengubah checklist/akses password atau user lain membaca order | Ditolak server, bukan sekadar tombol tersembunyi |
| A10 | Tanggal checklist berpindah sekitar tengah malam Jakarta | Hari/task tidak bergeser antara web dan mobile |
| A11 | Pesan terkirim tetapi respons hilang, lalu retry | Satu pesan resmi, UI dapat rekonsiliasi pending/failed |
| A12 | Review dibuat lalu dimoderasi admin | Rating/count service dan worker sama di kedua client |
| A13 | Rasio finance diubah setelah order lama diassign | Snapshot alokasi historis tetap mengikuti kebijakan, summary punya definisi jelas |
| A14 | Service bersejarah diarsipkan dari web | Tidak tampil untuk booking baru, histori order tetap ada di mobile |
| A15 | Edit email/password Auth gagal tetapi profile sukses | Hasil parsial dinyatakan jelas; tidak toast sukses seluruh operasi |
| A16 | Link reset web dan callback mobile dibuka | Pengguna bisa menyelesaikan recovery, bukan hanya menerima email |
| A17 | Upload gagal/ditolak/terlalu besar | Error jelas, tidak menyimpan data URI tak terbatas atau referensi media palsu |
| A18 | Browser sempit, keyboard dan modal; desktop hanya keyboard | Semua tindakan dapat diakses, fokus/scroll/label terlihat dan data tidak hilang |

Pengujian ini belum dijalankan. Sediakan akun/data uji terkontrol pada sesi implementasi; jangan memakai order pelanggan nyata untuk membuktikan mutasi.

## Di luar objective parity awal

Payment gateway dan pembayaran otomatis, native push notification, sinkronisasi cart lintas perangkat, PDF receipt khusus, migrasi keluar Supabase sepenuhnya, microservices, penggantian router/framework, dan salinan animasi dekoratif penuh. Semua dapat dipertimbangkan kemudian, tetapi tidak boleh terselip sebagai scope baru hanya karena menyatukan backend.

## Format handoff pekerjaan berikutnya

Catat HEAD awal/akhir, objective ID, file yang benar-benar diubah, contract/migration yang berubah, tes dan hasil, status deploy/migration aktual, kompatibilitas client lama, masalah terbuka, serta next objective. Bedakan implementasi lokal dari perubahan yang sudah berada di server. Dokumentasi ini tidak menandai satu pun milestone implementasi sebagai selesai.
