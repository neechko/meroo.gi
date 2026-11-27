# Database, tipe, storage, dan drift

## Definisi lokal

| Sumber | Isi | Batas |
|---|---|---|
| database/schema.sql | Skema dasar v2.1, delapan tabel, indexes, triggers, RLS, storage policy | Bukan snapshot lengkap kebutuhan 1.0.1 |
| database/migration.sql | Upaya menambah constraints/indexes, mengganti sebagian trigger/policy lama | Bukan migration chain aman yang terbukti; juga menghapus kumpulan policy existing |
| database/migration_v3.sql | Tambahan vault/checklist/finance, metadata OAuth, soft delete, policy admin | Belum menambah seluruh prasyarat kolom/tabel |
| database/seed.sql | Data awal layanan/kategori | Periksa kompatibilitas schema dan data sebelum dipakai |
| packages/supabase/src/database.ts | Tipe Database untuk shared client | Tidak mencakup seluruh fitur Go baru |
| apps/web/src/types/database.ts | Salinan tipe untuk web | Sumber tipe kedua yang perlu dijaga |
| backup/*.sql | Referensi historis permission dan reset/delete | Bukan instruksi deployment; sebagian destruktif |

**Tidak satu pun SQL dijalankan pada sesi ini.** Urutan schema ? migration ? v3 belum terbukti membentuk database 1.0.1 yang lengkap. Jangan menjadikan urutan tersebut runbook produksi.

## Entitas dan relasi

| Tabel | Relasi dan atribut utama |
|---|---|
| profiles | PK = auth.users.id; role, nama/email/phone/avatar, seniority, kapasitas, availability/cuti, rating |
| categories | slug unique; kategori service melalui slug |
| services | category ? categories.slug; base_price, estimated_hours, is_active; v3 required_seniority dan deleted_at |
| service_tiers | service_id ? services; schema dasar memiliki price_modifier; client/types memakai fixed_price |
| orders | consumer/worker ? profiles; service ? services; harga, UID/server/notes, status/progres, deadline, cancel/completed timestamps |
| progress_updates | order_id ? orders; percentage, notes, screenshot_url, created_at |
| messages | order_id ? orders, sender_id ? profiles; content/is_read |
| reviews | order_id unique, reviewer/reviewee ? profiles, service_id ? services, rating 1?5 |
| order_credentials | order_id unique; login_identifier, encrypted_password, verification fields, audit akses |
| order_checklists | order_id, task_date, cadence, task_key/label/detail, done dan pelaksana/waktu |
| finance_settings | singleton id=1; rasio pembagian dan updated_at |
| financial_allocations | order_id unique; worker dan gross/worker/admin/treasury amount, payout_status/paid_at |
| worker_invites | Dibutuhkan handler/UI; DDL tidak ditemukan di database/ |

Price menggunakan nominal integer rupiah pada order/service/alokasi, sedangkan rasio berupa numerik. Tier tidak disimpan sebagai relasi order; nama paket dan total hanya disalin ke order, sehingga perubahan katalog berikutnya tidak otomatis memperbarui snapshot order.

## Triggers

| Trigger/fungsi | Perilaku lokal |
|---|---|
| on_auth_user_created / handle_new_user | Membuat profile saat auth.users insert; v3 mengambil nama/avatar Google dan username |
| trigger_sync_worker_active_orders | Mengubah counter saat insert/assignment/perubahan menjadi terminal |
| trigger_set_order_deadline | BEFORE UPDATE order; mengisi assigned_at/deadline dari total_estimated_hours atau service |
| trigger_update_worker_rating | AFTER INSERT review saja; menambah count/rata-rata |
| trigger_set_review_service_id | Mengisi service_id review dari order bila belum disediakan |
| trigger_wipe_order_credentials (v3) | AFTER UPDATE order menjadi completed/cancelled dari nonterminal; password/kode dikosongkan |

Counter active orders tidak menangani semua transisi reopen/delete pada definisi lokal. Rating update/delete bergantung recalculate Go; perubahan review langsung dari client tidak memicu recalculate yang sama. Reopen setelah completed juga tidak memulihkan vault.

## Drift yang terbukti dari pencarian lokal

1. `profiles.username` dipakai auth/register/v3 trigger, tetapi tidak ada ADD COLUMN/definisi pada schema dasar.
2. `profiles.contact_info` dipakai update profile, tetapi belum didefinisikan pada SQL lokal.
3. `service_tiers.fixed_price` ada di tipe dan query UI; schema.sql masih mendefinisikan price_modifier. UI admin juga menulis estimated_hours tier yang perlu dicocokkan ke skema remote.
4. `worker_invites` dipakai API dan mobile tetapi tidak ditemukan CREATE TABLE.
5. Tipe database belum mencakup order_credentials, order_checklists, finance_settings, financial_allocations, dan worker_invites.
6. v3 sudah menambah services.required_seniority/deleted_at dan empat tabel baru; pernyataan checkpoint lama bahwa semuanya belum ada harus diperbarui.
7. v3 mengaktifkan RLS finance_settings tanpa menambahkan policy tabel itu. Go service-role dapat memakai jalurnya, fallback client tidak otomatis diizinkan.
8. Schema dasar memakai cascade service ? orders; v3 mengubah FK review ? service menjadi SET NULL, bukan menghapus cascade service ? orders.

9. Seed memasukkan categories.icon, sementara schema dasar tidak mendefinisikan kolom icon. Seed juga bukan data produksi.

Mungkin remote telah ditambal manual, tetapi sesi ini tidak punya bukti. Untuk membuktikan, sesi implementasi terpisah harus membandingkan kolom, FK, triggers, policies, privileges, storage buckets, dan auth redirect aktual dengan kode.

## RLS bukan sekadar nama policy

- profiles SELECT publik; UPDATE sendiri/admin pada schema lokal tidak membatasi kolom role. Audit privileges/trigger remote diperlukan sebelum menganggap perubahan role hanya admin.
- Trigger pembuatan profile mengambil role dari raw_user_meta_data; perlu menilai siapa dapat menentukan metadata tersebut.
- orders INSERT hanya memastikan consumer_id = auth.uid(), tidak memeriksa role consumer atau menghitung harga terpercaya.
- orders UPDATE pemilik cukup luas; policy worker memiliki status nonterminal di USING dan WITH CHECK, yang dapat berkonflik dengan fallback worker yang mengubah status ke completed.
- reviews INSERT memeriksa reviewer_id dan role, tetapi belum mengikat reviewer ke pemilik order completed.
- order_credentials SELECT policy mengizinkan baris peserta. Policy berjudul status bukan column mask; encrypted_password dan verification_code tetap kolom pada baris tersebut bila privileges mengizinkan SELECT.
- Checklist direct client dibatasi policy peserta/staff; endpoint Go service-role tidak mendapatkan perlindungan policy tersebut secara otomatis.

## Storage

Bucket yang dirujuk: avatars, screenshots, fallback lama meroogi-media. Schema hanya menyediakan policy dan komentar agar avatars/screenshots dibuat manual sebagai public; bukan CREATE bucket. Policy update/delete bertajuk own sebenarnya mengecek bucket dan authenticated, belum ownership objek. Screenshot dan avatar berupa public URL, sehingga materi yang diunggah perlu dipahami sifat aksesnya. Tidak ada data credential asli disalin ke dokumentasi ini.
