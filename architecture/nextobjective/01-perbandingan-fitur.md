# Perbandingan fitur dan perilaku

Snapshot sama dengan README. Referensi W/M/G di bawah dirinci pada [daftar bukti](05-bukti-dan-batas-analisis.md). Target adalah objective berikutnya, bukan status selesai.

## A. Akun, akses, dan profil

| Bagian | Mobile sekarang | Web sekarang | Kekurangan/perbedaan dan target |
|---|---|---|---|
| Login email/password | Ada melalui Supabase | Ada melalui Supabase | Satukan hasil error, session expiry, dan role dari Go; jangan menyalin session antarplatform |
| Login username | Resolver Go lalu login email | Form email saja | Tambah identifier email/username di web setelah kontrak username unik/normalisasi tersedia |
| Google login | OAuth browser dan callback ada | Tidak ditemukan OAuth Google pada login web | Tambah alur browser web, callback/redirect yang sesuai; satu identitas akun lintas platform |
| Registrasi | Nama, username, email, password, phone; UI consumer | Nama/email/password/WhatsApp dan pilihan consumer/worker | Jangan menyalin self-selection worker menjadi otoritas. Role awal consumer; promosi worker lewat proses admin yang tervalidasi |
| Forgot password | Kirim email reset dari email/username | Kirim email dan redirect /reset-password | Web sudah mempunyai penyelesaian reset; mobile perlu memastikan recovery callback dan layar akhirnya. Keduanya perlu hasil yang jelas |
| Profil | Nama/username/contact_info/avatar | Nama/phone/avatar, email ditampilkan | Satukan definisi phone dan contact_info; username web belum ada. Jangan kehilangan nomor yang dipakai receipt/join |
| Akses workspace | Admin dapat tab Admin dan Worker | /worker hanya role worker; admin hanya /admin | Jika admin boleh mengerjakan tugas, web perlu akses workspace worker dengan izin yang sama |
| Logout/role berubah | Session dan role state di root | Session/profile di root web | Bersihkan cache privat dan cart terkait user saat pergantian akun; refresh izin saat role berubah |
| Penghapusan user admin | Tidak terlihat aksi setara pada kontrol akun mobile | Handler delete profile tersedia | Ini fitur web yang perlu keputusan retensi; menghapus profile tidak sama dengan menonaktifkan akun Auth. Jangan migrasi sebagai DELETE generik |

Bukti: W1, W2, W9, M1, M5, G1. Pemilihan role di registrasi web adalah perilaku aktual yang bertentangan dengan arah role terpusat, bukan kemampuan yang perlu dipertahankan tanpa evaluasi.

## B. Katalog, pembelian, dan dashboard pelanggan

| Bagian | Mobile sekarang | Web sekarang | Target berikutnya |
|---|---|---|---|
| Beranda pelanggan | Ringkasan aktivitas, order terbaru, panduan | Root / adalah katalog publik | Tambah ringkasan untuk user login; tetap pertahankan katalog publik dan URL service |
| Search/kategori | Ada | Ada | Samakan nama kategori, filter aktif, pesan kosong; bukan fitur baru |
| Service tiers/multi-paket | Ada, harga/jam dijumlahkan | Ada di ServiceDetail | Go memberikan quote resmi; kedua UI boleh preview tetapi tidak menentukan harga final |
| Rating di kartu katalog | Ringkasan rating/count pada kartu | Katalog tidak memuat review; rating ada di detail dan halaman review | Tambah ringkasan pada list web melalui endpoint agregat, tanpa query per kartu |
| Daftar review service | Modal katalog | Halaman /service/:id/reviews | Satukan isi/rating/count; web tetap dapat dibagikan via URL |
| Booking langsung | Ada; optional credential sesudah order | Alur detail ke cart lalu checkout | Usulan aksi pesan langsung web dengan quote/checkout yang sama; bukan insert terpisah baru |
| Keranjang | State lokal CatalogScreen | Context state seluruh web | Keduanya belum persisted/cross-device. Persistence cart opsional fase lanjut; parity dasar adalah payload dan hasil checkout |
| UID/server/notes | Di booking | Di detail dan dapat diedit pada cart | Validasi domain sama, label konsisten, jangan menyimpan password ke notes |
| Tier dipilih saat order | Nama tier disalin ke notes | Pola yang sama | Simpan snapshot pilihan dan harga resmi terstruktur dalam rancangan Go; pembaca histori lama tetap didukung |
| Duplicate checkout | Guard tombol/direct submitting | Loading/disabled checkout | Butuh idempotency server kedua platform; UI loading saja tidak cukup |
| Panduan pemesanan | Modal di Home | HowToOrder route | Isi langkah sama, format sesuai platform, jangan menjanjikan integrasi yang belum ada |

Bukti: W3, M2, M6. Cart, review dan paket sudah ada pada web; objective adalah menyamakan kontrak dan melengkapi titik akses.

## C. Pesanan dan detail pengerjaan

| Bagian | Mobile sekarang | Web sekarang | Target berikutnya |
|---|---|---|---|
| Daftar/filter order | Semua/aktif/pending/berjalan/selesai/batal; berjalan mencakup paid dan in_progress | Filter hampir sama, tetapi in_progress memakai kecocokan status langsung | Tetapkan definisi filter server; order paid tidak boleh hilang hanya karena label filter berbeda |
| Deadline/timeline | Ada pada detail dan overdue pada sejumlah list | Timeline assigned/deadline, OVERDUE/ON TRACK pada OrderTracking | Pertahankan fitur web; lengkapi informasi list dan samakan zona waktu |
| Pembatalan/alasan | Go, fallback Supabase; owner pending/paid di UI | Supabase langsung dengan guard status dan custom prompt | Pusatkan izin/transisi/cancel_reason/wipe pada Go, respons terminal jelas |
| Progress + screenshot | Ada; screenshot opsional | Ada; screenshot diwajibkan handler upload web | Putuskan kebijakan bukti per jenis layanan. Server menjadi otoritas, bukan perbedaan wajib/opsional diam-diam |
| Koreksi progres | Edit histori melalui Go | Tidak ditemukan edit progress existing | Tambah koreksi berizin di web; tetapkan dampak reopen, deadline, counter, vault dan finance |
| Vault credential | Simpan/read via Go, owner melihat status, assigned staff melihat password saat aktif | Belum ditemukan | Tambah panel status/simpan/akses yang aman; UI tidak pernah membaca cipher/password langsung dari database |
| Kode verifikasi game | Request assigned worker/admin, submit owner/admin | Belum ditemukan | Tambah state waiting/submitted/expired yang terdefinisi. Ini perantara kode login game, bukan MFA akun meroo.gi |
| Kalender checklist | Daily/weekly/monthly/custom, tanggal dan preset, CRUD Supabase | Belum ditemukan | Tambah panel kalender/task web; perbaiki izin Go dahulu, lalu kedua client pindah |
| Struk | Receipt Go, tampil/share teks | Belum ditemukan receipt flow | Tambah lihat/cetak/download representasi konsisten; PDF opsional, bukan kemampuan Go yang sudah ada |
| Chat | Polling 3500 ms dan optimistic send | Polling 3000 ms | Satukan API messages, identitas pesan, retry/dedup, interval/refresh policy; push bukan prasyarat parity pertama |
| Review pelanggan | Form pada completed owner | Sudah ada form pada order selesai | Satukan server validation: pemilik, order selesai, satu review, rating 1-5 |
| Notifikasi perubahan lintas perangkat | Tidak ada sistem notifikasi terpusat yang dibuktikan | Tidak ada sistem terpusat yang dibuktikan | Refresh sesudah mutasi dan saat kembali ke layar terlebih dahulu; notifikasi push adalah objective tambahan |

Bukti: W4, M3, G1. Satu order harus memberikan status, total, deadline dan izin yang sama saat dibuka bersamaan di web dan mobile.

## D. Worker

| Bagian | Mobile sekarang | Web sekarang | Target berikutnya |
|---|---|---|---|
| Daftar aktif dan riwayat | Filter aktif versus completed/cancelled | Query hanya pending/paid/in_progress | Tambah riwayat worker web dan filter yang sama melalui Go |
| Online/offline/cuti sendiri | Toggle pada WorkerScreen | Tidak ditemukan pada WorkerDashboard/Profile | Tambah self-service availability; admin controls tetap berbeda izin |
| Beban dan rating sendiri | Ringkasan kapasitas/active/rating | Kartu tugas, belum ringkasan worker setara | Tampilkan data turunan resmi; counter tidak diedit manual dari UI |
| Update persen | Input dan preset 25/50/75/100 | Form upload dengan input persentase | Preset dapat ditambah, tetapi aturan min/max/terminal harus sama |
| Info customer/order | Nama/contact/notes/deadline | Nama/WhatsApp/UID/server/harga dan link detail | Satukan informasi wajib; desktop dapat menampilkan tabel, mobile kartu |
| Checklist/vault/chat dari tugas | Buka detail modal | Link detail hanya kemampuan lama | Tambah akses langsung ke section pekerjaan tanpa kehilangan konteks/filter |

Bukti: W5, M4. Koreksi penting: ringkasan lama menyebut availability/cuti pada worker web; pembacaan source sekarang menunjukkan kontrol tersebut ada pada admin, belum pada halaman worker sendiri.

## E. Admin dan studio

| Bagian | Mobile sekarang | Web sekarang | Target berikutnya |
|---|---|---|---|
| Assignment manual | Candidate picker Go, fallback client | Dropdown worker diurutkan di client | Go memutuskan eligible dan alasan; web menampilkan score/load/status yang sama |
| Auto assignment | Ada melalui Go | Tidak ditemukan alur auto Go | Tambah pada web setelah validasi kapasitas/concurrency diperkuat |
| Status setelah assign | Go: pending/paid menjadi in_progress | Menulis paid | Wajib disatukan. Assignment bukan bukti pembayaran |
| Kandidat | Go mencakup worker/admin | Query hanya worker | Putuskan role yang boleh menerima tugas; samakan seluruh selector |
| Ranking | Go fairness/skill/rating; fallback lebih sederhana | Availability/cuti/load/seniority | Hilangkan ranking otoritatif di frontend, kirim evaluasi Go |
| Pengelolaan worker | Seniority/capacity/availability/cuti | Sudah ada admin edit stats, termasuk active counter manual | Pertahankan kontrol bisnis; ganti counter manual dengan recompute server/audit khusus jika diperlukan |
| Kontrol akun | Nama/username/email/password/role via Go, dengan fallback terbatas | Role change dan delete profile; belum editor akun setara | Endpoint admin aman dan audit; jangan toast sukses untuk perubahan Auth parsial |
| Invite worker | Record pending/accepted dan promosi existing | Belum ditemukan | Implementasikan lifecycle invite yang benar sebelum menyalin UI; pending tidak berarti email terkirim |
| Cari user + game UID | Ada search serta game_uids dari Go | Daftar users tanpa enrichment Go | Samakan filter dan pagination, tampilkan seperlunya berdasarkan izin |
| CRUD layanan/paket/kategori | Ada | Sudah ada | Tidak perlu dibuat ulang; pindahkan mutasi/read ke Go, satu aturan harga/aktif/arsip |
| Hapus layanan bersejarah | Go soft-delete, tetapi fallback masih hard-delete | Direct delete | Prioritas perlindungan histori; satu endpoint dengan archive semantics yang jelas |
| Finance | Revenue/escrow, rasio, split, grafik, API summary | Overview total revenue completed dan jumlah order/worker | Tambah modul finance web; bukan sekadar mengganti grafik overview |
| Alokasi/payout | Struktur allocations ada di backend; UI tidak membuktikan payout lengkap | Belum ada ledger Go | Pisahkan alokasi teoretis, payment, dan payout; jangan menyebut nominal sebagai uang sudah dibayar |
| Moderasi review | Edit/delete melalui Go dan fallback | Tidak ada subtab/handler moderasi review pada admin | Tambah modul web, recalculate rating atomik dan jejak audit |
| Statistik/grafik | Mingguan dari allOrders lokal | Kartu overview dan data daftar | Agregasi Go dengan periode/timezone/metrik eksplisit; jangan menyalin chart sebagai angka keuangan resmi |

Bukti: W6, M7, G1. Finance mobile juga menghitung sebagian tampilan di client; menambahkan web harus menunggu definisi agregasi resmi agar tidak menciptakan rumus ketiga.

## Yang tidak boleh hilang saat mengejar kesamaan

- URL publik katalog/service/review, browser back/forward, refresh halaman detail.
- Halaman reset password web, bukan hanya toast email terkirim.
- CRUD paket/kategori, alasan cancel, timeline deadline dan review yang sudah berfungsi secara struktur.
- Informasi dan kemampuan desktop untuk membandingkan banyak order.
- Isi historis order setelah katalog diarsipkan atau akun dinonaktifkan.
