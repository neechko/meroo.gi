# Backend Go dan kontrak API

## Struktur

Entry `cmd/server/main.go` membaca `.env` dari working directory tanpa mengganti environment yang sudah ada, lalu menjalankan HTTP pada `PORT` atau 8080. `router.New()` membentuk dependency Supabase client/master key, logging, panic recovery, CORS, dan route chi.

`internal/supa/client.go` mengirim HTTP ke `/rest/v1/` dengan apikey dan Authorization service-role. HTTP error diteruskan sebagai error Go; tidak ada transaksi database yang membungkus sejumlah request handler. `middleware/rbac.go` memeriksa Bearer token secara HMAC lokal, fallback ke Supabase `/auth/v1/user`, mengambil role asli dari profiles, lalu memasang user ID/role ke context.

## Seluruh route terdaftar

Semua path berikut berawalan `/v1` kecuali health. Akses pada tabel adalah pemeriksaan aktual dalam source, bukan janji bahwa semua endpoint sudah aman.

| Method/path | Handler | Akses dan payload utama |
|---|---|---|
| GET /health | inline router | Publik; status ok, bukan tes database |
| POST /auth/resolve-identifier | ResolveIdentifier | Publik; identifier ? email; username di-query ilike |
| GET /me | GetMe | Login; identitas, role, role_label, profile |
| PATCH /me/profile | UpdateMyProfile | Login; full_name, username, contact_info, avatar_url nonkosong |
| POST /orders/{id}/cancel | CancelOrder | Pemilik/admin, status pending/paid; reason |
| GET /orders/{id}/receipt | GetOrderReceipt | Pemilik, assigned worker, admin; JSON dengan printable_text |
| POST /orders/{id}/credentials | SaveOrderCredentials | Pemilik; game_uid, login_identifier, password; belum memeriksa status terminal |
| GET /orders/{id}/credentials | GetOrderCredentials | Peserta/admin; pemilik mendapat metadata, staff aktif dapat password |
| POST /orders/{id}/credentials/verification | HandleVerificationCode | request: assigned worker/admin; submit: pemilik/admin; order harus belum terminal |
| GET /orders/{id}/checklists | ListChecklists | Login saja; date opsional, belum ada ownership check handler |
| POST /orders/{id}/checklists | CreateChecklistItem | Login saja; task_date/cadence/key/label/detail, belum dibatasi staff/order |
| PATCH /checklists/{itemId} | ToggleChecklistItem | Login saja; is_done/target_detail, belum memeriksa peserta |
| POST /orders/{id}/progress | CreateOrderProgress | Role worker/admin dan assigned worker/admin; menolak cancelled |
| PATCH /orders/{id}/progress/{progressId} | EditOrderProgress | Role worker/admin dan assignment; menolak cancelled |
| GET /admin/orders/{id}/worker-candidates | GetWorkerCandidates | Admin; ranking semua worker/admin |
| POST /admin/orders/{id}/assign | AssignWorkerToOrder | Admin; worker_id opsional, kosong berarti otomatis |
| GET /admin/finance/summary | GetFinanceSummary | Admin; revenue, escrow, share, allocations |
| PATCH /admin/finance/settings | UpdateFinanceSettings | Admin; worker_share_pct, admin_share_pct, studio_treasury_pct |
| GET /admin/users | ListAdminUsers | Admin; profiles beserta game_uids dari order |
| PATCH /admin/users/{id}/role | UpdateUserRole | Admin; consumer/worker/admin |
| PATCH /admin/users/{id}/account | UpdateUserAccount | Admin; profil, role, email/password, kapasitas/seniority/status |
| GET /admin/workers/invites | ListWorkerInvites | Admin; daftar worker_invites |
| POST /admin/workers/invite | InviteWorker | Admin; email, seniority_level, max_capacity |
| DELETE /admin/services/{id} | DeleteService | Admin; soft delete bila punya order, hard delete jika tidak |
| PATCH /admin/reviews/{id} | UpdateReview | Admin; rating/comment dan recalculate worker |
| DELETE /admin/reviews/{id} | DeleteReview | Admin; delete dan recalculate worker |

Tidak ada route API checkout, chat, katalog CRUD lengkap, payment webhook, atau checklist DELETE. Jalur tersebut menggunakan Supabase langsung atau belum diimplementasikan. `goApi.ts` adalah wrapper mobile aktif; `packages/shared/src/api.ts` adalah client terpisah dengan cakupan lebih kecil dan tanpa mekanisme retry/timeout mobile.

## Detail kontrak penting

- Action verifikasi canonical: `request` / `submit`; backend menerima alias lama `request_code` / `submit_code`. Status credential: idle, waiting_code, submitted, verified; schema menerima verified tetapi tidak ada action khusus untuk menandainya pada handler ini.
- Save credential upsert berdasarkan order_id. Password menggunakan AES-256-GCM dengan nonce acak, disimpan base64. Master key wajib 32 byte. Fallback hardcoded router bukan solusi konfigurasi: panjangnya 30 byte sehingga ditolak fungsi crypto.
- Get credential bisa mengembalikan configured false ketika query credential gagal karena error query diabaikan. Gagal decrypt menghasilkan password kosong. Pesan UI belum cukup untuk membedakan kosong dari error.
- Create progress menerima percentage/notes/screenshot_url, clamp 0?100, default notes, lalu insert progress dan patch order paralel. Salah satu bisa sukses sendiri. Retry/fallback berpotensi menduplikasi progress.
- Edit progress mengubah progress tertentu lalu aggregate order; 100 mengisi completed_at, koreksi dari completed ke bawah 100 membuka kembali in_progress. Tidak mengembalikan password yang sudah dihapus trigger.
- Cancel patch order, kemudian mencoba wipe vault; error wipe tidak diteruskan. Trigger DB tetap penting.
- Assign otomatis mengevaluasi kelayakan; assign manual hanya memakai ID yang diberikan. Setelah patch order, allocation upsert dijalankan dengan error diabaikan.
- InviteWorker menerima alamat yang mengandung @, bukan Gmail-only secara teknis. Akun existing dipromosikan dan invite accepted; akun belum ada hanya dicatat pending. Tidak terlihat pengiriman email undangan atau proses otomatis menerima invite ketika login pada source yang diperiksa.
- UpdateUserAccount menggunakan Supabase Auth Admin API untuk email/password, lalu patch profile. Bukan satu transaksi, sehingga perubahan parsial mungkin.
- DeleteService mengabaikan error query pengecekan order; fallback frontend bahkan bisa melakukan hard delete. Jangan menyamakan seluruh jalur dengan jaminan pelestarian histori.
- Format error lazim `{error: "..."}`, tetapi middleware memakai http.Error. Jangan mengandalkan Content-Type JSON selalu konsisten.

## Modul lain

`priority/scheduler.go` adalah fungsi ranking murni. `receipt/generator.go` menghasilkan nomor INV-tanggal-ID pendek dan printable text, bukan PDF atau integrasi printer. Label WIB pada format tanggal tidak disertai konversi zona eksplisit di generator; jangan menganggap timestamp sudah dikonversi. `server.exe` adalah binary lokal, bukan bukti deployment saat ini.

CORS router mengizinkan origin wildcard dan credentials; belum ada rate limiter khusus pada resolver login. Dokumentasi ini hanya mencatat konfigurasi source.

Validasi rasio Go memakai pembulatan jumlah ke 100, tanpa pemeriksaan nonnegatif per komponen; UI mobile memeriksa jumlah tepat 100 tetapi juga belum membatasi setiap angka nonnegatif. Ini belum merupakan validasi domain finance yang lengkap.
