# Temuan terbuka dan batas kepastian

Status semua temuan di bawah: **belum diperbaiki pada sesi dokumentasi**. Prioritas membantu agent berikutnya memilih urutan investigasi; bukan hasil penetration test atau bukti kondisi produksi.

## Utama sebelum melanjutkan fitur

| ID | Bukti lokal | Dampak dan pemeriksaan lanjutan |
|---|---|---|
| T01 | router.New + crypto.EncryptSecret | Fallback key panjang 30 byte, crypto meminta 32. Vault gagal bila env tidak tepat; periksa konfigurasi tanpa mencetak nilainya |
| T02 | List/Create/ToggleChecklist di api.go | Authenticated saja, query memakai service-role tanpa ownership/staff check; perlu pengujian akses lintas order |
| T03 | schema.sql profiles policy + handle_new_user | Role dapat dipengaruhi melalui update kolom/metadata bila tidak ada pembatas tambahan remote; audit privilege dan trigger |
| T04 | database.md daftar drift | Instalasi database kosong belum reproducible; login username, tiers, invite bisa gagal |
| T05 | AdminScreen.handleDeleteService fallback | Go soft-delete bisa diikuti direct hard-delete saat Go error; schema cascade dapat menghapus histori |
| T06 | CatalogScreen checkout + orders RLS | Harga dikirim client dan role booking baru guard UI; server-side integrity belum ditunjukkan |
| T07 | WorkerScreen fallback + CreateOrderProgress | Insert progress dan patch order tidak atomik; timeout/retry bisa menghasilkan duplikasi atau state parsial |
| T08 | AssignWorkerToOrder | Manual worker_id tidak divalidasi eligibility seperti auto; assignment + allocation tidak atomik dan error allocation diabaikan |
| T09 | Banyak .catch fallback di mobile | Semua jenis error API bisa mengaktifkan jalur Supabase, termasuk penolakan bisnis; makna sukses tidak selalu sama |

## Konsistensi dan operasional

| ID | Bukti | Batas yang perlu diketahui |
|---|---|---|
| T10 | UpdateUserAccount mobile fallback | Email/password Auth tidak berubah pada fallback profile, tetapi toast umum bisa menyiratkan semua berhasil |
| T11 | InviteWorker + v3 trigger | Pending invite tersimpan; automatic acceptance saat Google login tidak terlihat dalam source |
| T12 | SaveOrderCredentials | Tidak menolak completed/cancelled; password bisa disimpan kembali setelah wipe bila dipanggil pemilik |
| T13 | GetOrderCredentials | Query/decrypt error tidak selalu muncul sebagai error; configured false/password kosong dapat menyamarkan masalah |
| T14 | sync_worker_active_orders | Reopen, delete, kombinasi reassignment/status perlu diuji; counter bukan recompute total |
| T15 | update_worker_rating trigger | Hanya insert; fallback edit/delete review langsung dapat membuat agregat stale |
| T16 | finance summary vs allocations | Rasio terkini dipakai ulang untuk summary; tidak sama dengan ledger allocation historis |
| T17 | imageCompressor | Data URI tetap fallback terakhir; komentar batas 120KB bukan enforcement; savedPct dijepit minimum 5 sehingga bukan pengukuran mentah |
| T18 | Mobile forgot password | Ada pengiriman email, tetapi flow recovery akhir dan redirect belum terbukti |
| T19 | Profile contact_info vs phone | Field kontak yang diedit tidak selalu field phone yang dipakai join/receipt |
| T20 | Chat polling + syncWorkspace | Chat 3,5 detik tidak menyegarkan semua data order/vault secara realtime; network/load/error tetap perlu pengujian |
| T21 | cart state dan submitting | Keranjang hanya memori; guard tombol bukan jaminan idempotency lintas retry |
| T22 | Receipt generator | Teks berlabel WIB tanpa konversi zona eksplisit; cek tanggal/jam sebenarnya |
| T23 | AGENTS/design vs runtime | Expo Router/dark theme dalam dokumen berbeda dengan pager/SAGE aktif; jangan migrasi diam-diam |
| T24 | .gitignore | Isi bercampur potongan PowerShell lama; perlakukan sebagai teks, bukan script |
| T25 | Build/testing | Tidak ada test suite khusus yang ditemukan; laporan lama tidak menggantikan hasil tes saat ini |

## Tujuh screenshot bug yang sudah dilihat

Semua berada di `bug/`, tanggal 26 November 2026, dan menunjukkan kondisi historis. Nama berikut tanpa awalan `WhatsApp Image 2026-11-26 at `.

| Screenshot | Pengamatan |
|---|---|
| 16.40.41(1).jpeg | Modal booking dengan toast sesi tidak valid |
| 16.40.41.jpeg | Daftar beberapa order layanan yang sama, terkait laporan spam submit |
| 16.40.42.jpeg | Beranda dengan pesanan berulang dan tata letak bawah |
| 17.14.55.jpeg | Admin assignment dengan toast sesi tidak valid, subtab/kartu sempit |
| 17.17.16.jpeg | Vault belum terkonfigurasi dan kontrol checklist pada detail |
| 17.17.45.jpeg | Dialog konfirmasi pembatalan |
| 17.50.42(1).jpeg | Riwayat chat dan input pesan |

Screenshot tidak bisa sendiri membuktikan penyebab error, role login, keberhasilan cancel, atau latency chat. Pemetaan ke perbaikan 1.0.1 ada di checkpoint. Data pribadi dalam gambar tidak disalin.

## Hal yang belum diverifikasi

Skema/RLS/buckets/redirect Supabase remote, environment backend, versi deployment Vercel, isi APK hasil build, akses unduhan EAS saat ini, install pada perangkat, seluruh gesture/keyboard, pembayaran nyata, delivery invite, dan regresi web. Tidak ada klaim bahwa semua bug sudah selesai.
