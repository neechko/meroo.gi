# Next objective: sinkronisasi mobile, web, dan backend Go

Tanggal: 27 November 2026. Basis kode: b93368eb357b1cf6641281b61d08004bd31a8508.
Status: **rencana pekerjaan berikutnya, belum diimplementasikan**.

Mandat pengguna pada sesi ini hanya analisis dan rangkuman di `architecture/nextobjective/`. Tidak ada perubahan aplikasi, SQL, dependency, konfigurasi, deployment, atau dokumen lama. Folder lama tetap bernama `arsitecture/`; folder `architecture/nextobjective/` dibuat mengikuti tujuan terbaru yang diminta, tanpa rename tambahan.

## Arah proyek yang ditetapkan

**Proyek menuju backend Go sebagai lapisan layanan bisnis bersama untuk mobile dan web.** Kedua frontend akan menggunakan kontrak, validasi, otorisasi, status, perhitungan harga/keuangan, dan aturan kerja yang sama. Tampilan website akan didekatkan dengan identitas mobile sambil mempertahankan kemampuan browser dan ruang desktop.

Arah tersebut belum mencerminkan keadaan sekarang: web masih mengakses Supabase langsung, mobile memakai campuran Supabase dan Go, dan Go belum menyediakan seluruh operasi yang dibutuhkan. Supabase dapat tetap digunakan sebagai infrastruktur Postgres/Auth/Storage di belakang Go. Memindahkan seluruh layanan bisnis ke Go tidak otomatis berarti mengganti database atau membangun sistem autentikasi sendiri.

## Dokumen

1. [01-perbandingan-fitur.md](01-perbandingan-fitur.md): kondisi masing-masing bagian, kekurangan web, perbedaan perilaku, dan hasil yang dituju.
2. [02-frontend-ui-ux.md](02-frontend-ui-ux.md): perbandingan tampilan/alur per layar dan batas penyamaan.
3. [03-backend-go-bersama.md](03-backend-go-bersama.md): target arsitektur, gap API, kontrak data, dan migrasi.
4. [04-roadmap-dan-penerimaan.md](04-roadmap-dan-penerimaan.md): objective berurutan, dependensi, kriteria selesai dan keputusan terbuka.
5. [05-bukti-dan-batas-analisis.md](05-bukti-dan-batas-analisis.md): referensi source, koreksi dokumentasi lama dan hasil verifikasi lingkup.

Konteks sebelumnya: [checkpoint 1.0.1](../../arsitecture/checkpoint.md), [arsitektur](../../arsitecture/arsitektur.md), [temuan terbuka](../../arsitecture/temuan.md).

## Ringkasan untuk pemilik proyek

Website sudah dapat menangani katalog, detail multi-paket, cart, checkout, daftar pesanan, progres/screenshot, chat polling, review pelanggan, profil, serta CRUD katalog dan assignment admin. Website bukan aplikasi kosong yang perlu dibangun ulang.

Kekurangan paling nyata terhadap mobile: login username/Google, profil username/contact yang konsisten, dashboard pelanggan, vault dan jembatan kode verifikasi, checklist kalender, struk, koreksi progres, workspace worker dengan histori dan kontrol availability, candidate/auto-assignment Go, invite/kontrol akun admin yang lebih lengkap, finance dengan rasio/alokasi, dan moderasi review.

Bagian yang sudah ada tetapi belum sama: assignment web menulis paid sementara Go menuju in_progress; filter berjalan berbeda; screenshot diwajibkan pada progres web tetapi opsional pada mobile; ranking kandidat berbeda; update/delete service dan review melewati jalur berbeda; bahasa, tema, font, navigasi, dialog, dan state feedback berbeda.

Mobile juga belum bisa dijadikan acuan mutlak: fallback database dapat melewati aturan API, beberapa write tidak atomik, invitation pending belum terbukti diterima otomatis, dan skema lokal belum lengkap. Sinkronisasi harus memperbaiki aturan bersama, bukan menyalin semua perilaku mobile.

## Cara menafsirkan status

- **Ada**: terlihat di source aktif; bukan bukti lulus pengujian produksi.
- **Belum ditemukan**: tidak ditemukan dalam route/komponen/query yang diperiksa.
- **Berbeda**: kedua platform mempunyai fungsi serupa dengan aturan atau hasil berbeda.
- **Target/usulan**: pekerjaan berikutnya; belum menjadi implementasi atau keputusan produk final.

Fokus laporan adalah parity dua arah dengan prioritas mengejar kekurangan web. Fungsi web yang sudah lebih jelas, misalnya halaman penyelesaian reset password dan URL detail langsung, harus dipertahankan.
