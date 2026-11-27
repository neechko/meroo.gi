# Peta pemahaman meroo.gi untuk coding agent

Snapshot analisis: 27 November 2026. Basis kode: `b93368eb357b1cf6641281b61d08004bd31a8508` pada branch `main`. Bahasa dokumentasi: Indonesia.

**Mandat sesi ini hanya analisis dan dokumentasi di `structur/`. Jangan mengubah kode, konfigurasi, database, deployment, atau file lain dengan alasan menjalankan rekomendasi dokumen ini.** Temuan adalah bahan pemahaman dan perencanaan berikutnya, bukan izin memperbaiki sekarang.

## Mulai dari sini

1. Baca [checkpoint.md](checkpoint.md) untuk perubahan 1.0.0 ke 1.0.1 dan posisi pekerjaan terakhir.
2. Baca [arsitektur.md](arsitektur.md) untuk batas aplikasi, alur data, dan aturan bisnis.
3. Baca [mobile.md](mobile.md), [web.md](web.md), serta [api.md](api.md) sesuai area tugas.
4. Baca [database.md](database.md) sebelum menyentuh operasi data atau izin akses.
5. Baca [temuan.md](temuan.md) agar tidak mengulangi asumsi yang salah.
6. Gunakan [panduan-agent.md](panduan-agent.md) untuk cara bekerja, konfigurasi, validasi, dan handoff.
7. Gunakan [inventaris.md](inventaris.md) untuk menemukan file, simbol, dan aset; [perubahan-git.md](perubahan-git.md) untuk statistik perubahan lengkap.

## Kedudukan sumber

Folder sumber lama sebenarnya bernama `structure/`, bukan `structur/`. File `structure/latest 1.0.1.txt` telah dibaca sebelum analisis; isinya transkrip sesi Antigravity, terpotong setelah judul perbaikan backend. `structure/checkpoint.md` sudah ada sebagai file kosong, belum terlacak Git, sebelum sesi ini. Keduanya dipertahankan. Folder `structur/` adalah keluaran baru sesuai nama yang diminta pengguna.

Urutan bukti yang digunakan: implementasi lokal dan diff Git untuk perilaku kode; SQL lokal untuk definisi yang tersedia; checkpoint dan laporan audit lama untuk klaim historis; screenshot `bug/` untuk gejala lama. Tidak ada akses ke database produksi, pengujian perangkat, atau verifikasi remote pada sesi ini.

Laporan audit lama juga ditemukan di `C:/Users/Lenovo/.gemini/antigravity-cli/brain/1f1abbfd-7889-4c2d-b8c2-af8cb2aa10ea/audit_and_progress.md`. Informasi pentingnya telah dirangkum di sini sehingga agent berikutnya tidak bergantung pada folder pribadi tersebut.

## Fakta yang harus langsung dipahami

- Produk adalah layanan joki/perawatan akun Genshin Impact dengan role database `consumer`, `worker`, `admin`. UI mobile sering menulis `Costumer`; jangan menjadikannya nilai role baru.
- Monorepo berisi web React/Vite, mobile Expo/React Native, backend Go, serta dua package TypeScript bersama.
- Web langsung menggunakan Supabase. Mobile menggunakan **Supabase dan Go API sekaligus**. Go memakai service-role untuk PostgREST dan Supabase Auth Admin API.
- Navigasi mobile aktual adalah pager di `App.tsx`, bukan Expo Router. Tema aktif SAGE terang; dokumen desain gelap adalah konteks lama.
- Build aplikasi bernilai 1.0.1 di `app.json`; `apps/mobile/package.json` masih 1.0.0. Tidak ada tag Git rilis yang ditemukan.
- SQL lokal dan tipe database belum mewakili seluruh kebutuhan runtime. Jangan menganggap instalasi database kosong bisa dilakukan hanya dengan menjalankan semua SQL berurutan.
- Fitur tersedia di kode tidak berarti sudah teruji pada APK, API yang dideploy, maupun skema Supabase remote.

## Standar vibe coding yang digunakan

Di sini istilah tersebut berarti konteks yang dapat dilanjutkan agent: tujuan produk, file yang relevan, alur lintas lapisan, kontrak dan invariant, bukti perubahan, ketidakpastian, pemeriksaan penerimaan, serta checkpoint yang bisa diperbarui. Ini konvensi kerja proyek, bukan klaim sertifikasi atau standar resmi. Hindari meminta agent menebak struktur dari nama file atau menganggap seluruh laporan sesi lama sebagai fakta runtime.

Lihat [verifikasi.md](verifikasi.md) untuk batas analisis, pemeriksaan dokumentasi, dan status file akhir.
