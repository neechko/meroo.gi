# Bukti perubahan Git 1.0.1

Baseline: 35075b6. Target: b93368e. Tidak ada tag rilis; alasan pemilihan baseline ada pada checkpoint.md.

| File | Ditambah | Dihapus |
|---|---:|---:|
| `.gitignore` | 1 | 0 |
| `.npmrc` | 1 | 0 |
| `apps/api/internal/handlers/api.go` | 164 | 14 |
| `apps/api/internal/handlers/auth.go` | 2 | 1 |
| `apps/api/internal/handlers/profile_progress.go` | 22 | 0 |
| `apps/api/internal/handlers/workers.go` | 28 | 4 |
| `apps/api/internal/middleware/rbac.go` | 41 | 11 |
| `apps/mobile/App.tsx` | 161 | 15 |
| `apps/mobile/app.json` | 1 | 1 |
| `apps/mobile/src/components/OrderDetailModal.tsx` | 278 | 32 |
| `apps/mobile/src/lib/goApi.ts` | 9 | 4 |
| `apps/mobile/src/lib/imageCompressor.ts` | 11 | 7 |
| `apps/mobile/src/screens/AdminScreen.tsx` | 946 | 167 |
| `apps/mobile/src/screens/CatalogScreen.tsx` | 593 | 76 |
| `apps/mobile/src/screens/HomeScreen.tsx` | 88 | 9 |
| `apps/mobile/src/screens/OrdersScreen.tsx` | 117 | 48 |
| `apps/mobile/src/screens/ProfileScreen.tsx` | 3 | 1 |
| `apps/mobile/src/screens/WorkerScreen.tsx` | 255 | 72 |
| `database/migration_v3.sql` | 217 | 0 |
| `packages/shared/src/api.ts` | 82 | 0 |
| `packages/shared/src/checklists.ts` | 15 | 0 |
| `packages/shared/src/index.ts` | 4 | 1 |
| `packages/shared/src/theme.ts` | 14 | 0 |
| `pnpm-lock.yaml` | 4791 | 170 |
| `structure/latest 1.0.1.txt` | 187 | 0 |

```text
25 files changed, 8031 insertions(+), 633 deletions(-)
```

## Riwayat commit lokal

```text
b93368e 2026-11-27T02:19:34+07:00 update code for fix major bug and release it on 1.0.1 version
1dc5e71 2026-11-27T02:07:39+07:00 update code for fix major bug and release it on 1.0.1 version
35075b6 2026-11-26T19:43:27+07:00 feat(mobile): custom splash wallpaper, keyboard-safe modals, segmented navigation, and percentage progress bar
50f72f9 2026-11-26T19:32:37+07:00 feat(mobile): separate Admin/Worker pages and segmented sub-tabs
1e72ce8 2026-11-26T18:59:21+07:00 fix animations bug
f12c2f4 2026-11-26T17:33:21+07:00 fix(mobile): fix ScrollView ref typing and keyboard responsiveness
c357c9e 2026-11-26T17:00:37+07:00 feat(mobile): water wave animations and smooth panel transitions
9c018ba 2026-11-26T15:42:58+07:00 fix(api): output linux go binary to VERCEL_OUTPUT_FILE
44dd29e 2026-11-26T15:34:32+07:00 fix(api): bypass turbo and pnpm during  go build on vercel
1c6ac9b 2026-11-26T15:28:47+07:00 fix(api): write vercel.json without utf8 bom
13c2895 2026-11-25T19:47:03+07:00 feat(api): add vercel serverless entrypoint for go api
f5c48f2 2026-11-24T16:33:45+07:00 chore: rebrand web identify to meroo.gi
4435a02 2026-11-24T16:00:39+07:00 feat: add shared supabase and helper packages
45a34ce 2026-11-24T15:31:37+07:00 chore: initial monorepo setup for meroo.gi
```

Perintah reproduksi baca-saja: `git diff 35075b6 b93368e -- <path>` dan `git show <commit> -- <path>`. Statistik bukan bukti tes runtime.
