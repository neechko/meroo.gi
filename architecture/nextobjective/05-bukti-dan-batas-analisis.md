# Bukti source, koreksi, dan batas analisis

Analisis dilakukan pada HEAD b93368eb357b1cf6641281b61d08004bd31a8508. Dokumentasi lama dibaca sebagai konteks, kemudian bagian web dibandingkan ulang dengan source. Tidak ada pemeriksaan layanan remote.

## Peta bukti

Path di tabel ini relatif terhadap root repository. Nomor baris dapat berubah setelah implementasi; gunakan nama fungsi sebagai penunjuk utama.

| ID | Sumber | Hal yang mendasari perbandingan |
|---|---|---|
| W1 | apps/web/src/pages/Login.tsx, Register.tsx, ResetPassword.tsx | Login email, recovery route, pilihan role registrasi, native alert |
| W2 | apps/web/src/App.tsx | Root katalog publik, navbar/hamburger, role guard /worker versus /admin |
| W3 | apps/web/src/pages/Catalog.tsx, ServiceDetail.tsx, Cart.tsx; context/CartContext.tsx | Search/kategori, multi-tier, review detail, cart/checkout direct Supabase, state memori |
| W4 | apps/web/src/pages/MyOrders.tsx, OrderTracking.tsx; components/OrderChat.tsx | Filter status, cancel/reason, timeline deadline, progres, review, chat polling |
| W5 | apps/web/src/pages/WorkerDashboard.tsx | Query hanya aktif, screenshot wajib, tidak ditemukan self-toggle availability/history |
| W6 | apps/web/src/pages/AdminDashboard.tsx | Tab overview/orders/users/workers/services/packages/categories; assign paid; CRUD dan worker stats |
| W7 | apps/web/tailwind.config.ts, src/index.css | Dark/indigo, monospace body, glass utility, fokus global dan animasi |
| W8 | apps/web/src/lib/dialog.tsx, components/ConfirmModal.tsx; AGENTS.md | Custom dialog, aturan bahasa Inggris/dark dan larangan native dialog |
| W9 | apps/web/src/pages/Profile.tsx, lib/supabase.ts | phone/avatar, typed Supabase client |
| M1 | apps/mobile/App.tsx | Email/username/Google/forgot, root state, nav role, workspace sync |
| M2 | apps/mobile/src/screens/CatalogScreen.tsx | Review card, multi-tier, direct booking, cart, credential warning |
| M3 | apps/mobile/src/components/OrderDetailModal.tsx | Checklist, vault/kode, receipt/share, edit progres, cancel/review, polling 3500 ms |
| M4 | apps/mobile/src/screens/WorkerScreen.tsx | Aktif/riwayat, availability/cuti, workload/rating, progress presets, screenshot opsional |
| M5 | apps/mobile/src/screens/ProfileScreen.tsx | Username/contact_info/avatar dan pintu workspace |
| M6 | apps/mobile/src/screens/HomeScreen.tsx, OrdersScreen.tsx | Dashboard, guide, overdue, paid dalam filter berjalan |
| M7 | apps/mobile/src/screens/AdminScreen.tsx | Finance/client metrics, assignment/candidates, invite/account, katalog/review CRUD |
| M8 | apps/mobile/src/theme/sage.ts; packages/shared/src/theme.ts | SAGE/fonts, token shared belum sepenuhnya identik dengan local |
| G1 | apps/api/internal/router/router.go; handlers/*.go | Route tersedia dan gap list/checkout/chat/catalog, auth/role/ownership, finance dan assignment |
| D1 | database/schema.sql, migration_v3.sql; packages/supabase/src/database.ts | Schema drift, triggers/RLS, data yang diperlukan kedua frontend |

Referensi lintas sesi: [checkpoint lama](../../arsitecture/checkpoint.md), [database lama](../../arsitecture/database.md), [temuan lama](../../arsitecture/temuan.md). Dokumen lama tidak diubah pada sesi ini.

## Temuan source yang memperjelas atau mengoreksi ringkasan sebelumnya

1. WorkerDashboard web belum memiliki self-toggle online/cuti atau riwayat terminal; kontrol availability yang ditemukan berada di AdminDashboard. Jangan memakai kalimat ringkasan lama sebagai bukti fitur self-service web.
2. Overview admin web menghitung totalRevenue dari completed; tidak ditemukan modul finance escrow/settings/allocations setara mobile. Pernyataan bahwa web sudah memiliki rumus finance lengkap terlalu luas.
3. Web bukan sepenuhnya English-only: reset/login memuat pesan Indonesia; Register masih memakai alert native walaupun AGENTS melarangnya.
4. Admin web mengassign dengan status paid, sedangkan Go memindahkan pending/paid ke in_progress. Ini perbedaan bisnis, bukan perbedaan label.
5. Multi-paket, cart, review pelanggan dan deadline timeline sudah ada di web. Menganggap seluruh fitur tersebut belum ada akan menghasilkan pekerjaan ulang.
6. Web sudah memakai tab admin horizontal overflow. Kebutuhan berikutnya adalah konsistensi pengelompokan dan responsivitas, bukan penambahan tab scroll dari nol.
7. Perbandingan UI berdasarkan konfigurasi/style/JSX, bukan screenshot terbaru web. Kontras, clipping, gesture dan kemampuan keyboard lengkap perlu uji runtime.
8. Tidak ditemukan pemakaian Go client, /v1, vault/checklist/receipt flow dalam source web yang dicari. Ini kesimpulan atas snapshot lokal, bukan klaim website deployment pasti identik.

## Metode dan batas

Membaca dokumentasi sebelumnya; membaca ulang entry/auth/profile, business handlers web, katalog/cart/order/worker/admin, styling/config dan instruksi lokal; mencocokkan dengan mobile dan router Go; mencari simbol/jalur terkait gap. Satu pencarian awal memakai sintaks brace shell yang tidak didukung PowerShell dan gagal sebelum membaca file; pencarian diulang dengan path yang benar. Tidak ada perubahan dari kegagalan tersebut.

Tidak menjalankan aplikasi, build, test, install dependency, Expo/EAS, SQL, deploy, fetch/commit/push, atau request produksi. Karena itu dokumen menggunakan kata ada di source, belum ditemukan, target, dan belum diverifikasi.

Tidak menyalin env, token, password, atau data pelanggan. Link eksternal tidak diperlukan untuk perbandingan implementasi lokal dan tidak diverifikasi.

## Lingkup perubahan sesi

Status awal:
- arsitecture/ sudah ada sebagai untracked.
- structure/checkpoint.md sudah ada sebagai untracked kosong.
- Tidak ada perubahan tracked source yang terlihat.

Hasil yang diizinkan hanya enam file Markdown di architecture/nextobjective/. Tidak mengubah arsitecture/, structure/, aplikasi, atau SQL. Folder tujuan baru mengikuti ejaan architecture yang diminta pengguna pada sesi ini.

Pemeriksaan akhir: target tautan lokal tersedia; diff tracked source tetap kosong; daftar file baru hanya berada dalam folder objective baru selain untracked yang sudah ada. Ini verifikasi dokumentasi dan lingkup, bukan sertifikasi kualitas aplikasi.
