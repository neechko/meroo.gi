# Inventaris file dan simbol

Snapshot HEAD b93368e. Inventaris ini mencakup seluruh file tracked pada snapshot, ditambah ringkasan file lokal yang relevan. Jumlah baris bukan ukuran kompleksitas. Simbol hasil ekstraksi adalah petunjuk navigasi, bukan daftar semua nested callback. Aset diinventarisasi berdasarkan nama/ukuran, tidak dinilai desainnya satu per satu.

Total file tracked: **122**.

## .gitignore

### [.gitignore](../.gitignore)

Aturan ignore, juga mengandung potongan perintah historis sebagai teks. (1063 byte)

## .npmrc

### [.npmrc](../.npmrc)

Layout node_modules hoisted. (20 byte)

## apps/api

### [apps/api/cmd/server/main.go](../apps/api/cmd/server/main.go)

Load env dan server HTTP Go. (45 baris)

Simbol: `loadDotEnv` L13, `main` L35.

### [apps/api/go.mod](../apps/api/go.mod)

Nama modul Go, versi bahasa dan dependencies. (167 byte)

### [apps/api/go.sum](../apps/api/go.sum)

Checksum dependencies Go. (505 byte)

### [apps/api/internal/crypto/vault.go](../apps/api/internal/crypto/vault.go)

AES-256-GCM encrypt/decrypt. (57 baris)

Simbol: `EncryptSecret` L12, `DecryptSecret` L32.

### [apps/api/internal/handlers/api.go](../apps/api/internal/handlers/api.go)

Handler order, vault, checklist, assignment, finance, service dan review. (875 baris)

Simbol: `writeJSON` L23, `roleDisplayLabel` L29, `GetMe` L42, `CancelOrder` L61, `GetOrderReceipt` L116, `SaveOrderCredentials` L177, `GetOrderCredentials` L231, `HandleVerificationCode` L306, `EditOrderProgress` L367, `ListChecklists` L433, `CreateChecklistItem` L450, `ToggleChecklistItem` L489, `GetWorkerCandidates` L523, `AssignWorkerToOrder` L562, `GetFinanceSummary` L658, `UpdateFinanceSettings` L720, `UpdateUserRole` L746, `DeleteService` L764, `recalculateWorkerRating` L800, `UpdateReview` L825, `DeleteReview` L860.

### [apps/api/internal/handlers/auth.go](../apps/api/internal/handlers/auth.go)

Resolver username/email publik. (46 baris)

Simbol: `ResolveIdentifier` L10.

### [apps/api/internal/handlers/profile_progress.go](../apps/api/internal/handlers/profile_progress.go)

Update profil sendiri dan pembuatan progres order. (141 baris)

Simbol: `UpdateMyProfile` L14, `CreateOrderProgress` L53.

### [apps/api/internal/handlers/workers.go](../apps/api/internal/handlers/workers.go)

Invite worker, daftar user/UID, kontrol akun Auth dan profile. (229 baris)

Simbol: `normalizeSeniority` L17, `ListWorkerInvites` L30, `InviteWorker` L39, `ListAdminUsers` L98, `UpdateUserAccount` L132.

### [apps/api/internal/middleware/rbac.go](../apps/api/internal/middleware/rbac.go)

Bearer authentication, fallback Auth Supabase, role guard. (139 baris)

Simbol: `Authenticate` L26, `RequireRoles` L72, `verifyTokenViaSupabase` L89, `fetchProfileRole` L117.

### [apps/api/internal/priority/scheduler.go](../apps/api/internal/priority/scheduler.go)

Eligibility dan ranking prioritas worker. (137 baris)

Simbol: `DefaultWeights` L43, `seniorityRank` L59, `EvaluateWorkerForTask` L71, `RankWorkersForTask` L125.

### [apps/api/internal/receipt/generator.go](../apps/api/internal/receipt/generator.go)

Struk JSON/teks dengan nomor invoice. (78 baris)

Simbol: `BuildReceipt` L27.

### [apps/api/internal/router/router.go](../apps/api/internal/router/router.go)

Dependency initialization dan seluruh registrasi endpoint chi. (91 baris)

Simbol: `New` L15.

### [apps/api/internal/supa/client.go](../apps/api/internal/supa/client.go)

Client HTTP PostgREST service-role. (64 baris)

Simbol: `NewClient` L18, `Request` L26.

### [apps/api/server.exe](../apps/api/server.exe)

Binary Go Windows lokal; jangan gunakan sebagai bukti build saat ini. (9675264 byte)

### [apps/api/vercel.json](../apps/api/vercel.json)

Konfigurasi deploy/rewrite khusus aplikasi. (5 baris)

## apps/mobile

### [apps/mobile/.claude/settings.json](../apps/mobile/.claude/settings.json)

Konfigurasi plugin Expo untuk Claude pada subproject mobile. (5 baris)

### [apps/mobile/.gitignore](../apps/mobile/.gitignore)

Aturan ignore, juga mengandung potongan perintah historis sebagai teks. (440 byte)

### [apps/mobile/AGENTS.md](../apps/mobile/AGENTS.md)

Instruksi agent yang berlaku pada subtree aplikasi. (41 baris)

### [apps/mobile/App.tsx](../apps/mobile/App.tsx)

Entry React, auth/state/navigasi dan komposisi layar. (851 baris)

Simbol: `parseOAuthCallback` L36, `normalizeRole` L48, `WallpaperLoadingScreen` L52, `MainApp` L65, `goToTab` L116, `syncWorkspace` L203, `handleLogin` L277, `handleForgotPassword` L298, `handleRegister` L325, `handleGoogleLogin` L371, `App` L743.

### [apps/mobile/LICENSE](../apps/mobile/LICENSE)

Ketentuan lisensi repository/subproject. (1106 byte)

### [apps/mobile/app.json](../apps/mobile/app.json)

Konfigurasi Expo/native/version/scheme/updates/plugins/assets. (64 baris)

### [apps/mobile/assets/adaptive-icon.png](../apps/mobile/assets/adaptive-icon.png)

Aset visual statis. (988738 byte)

### [apps/mobile/assets/android-icon-background.png](../apps/mobile/assets/android-icon-background.png)

Aset visual statis. (988738 byte)

### [apps/mobile/assets/android-icon-foreground.png](../apps/mobile/assets/android-icon-foreground.png)

Aset visual statis. (988738 byte)

### [apps/mobile/assets/android-icon-monochrome.png](../apps/mobile/assets/android-icon-monochrome.png)

Aset visual statis. (988738 byte)

### [apps/mobile/assets/favicon.png](../apps/mobile/assets/favicon.png)

Aset visual statis. (93499 byte)

### [apps/mobile/assets/icon.png](../apps/mobile/assets/icon.png)

Aset visual statis. (988738 byte)

### [apps/mobile/assets/splash-icon.png](../apps/mobile/assets/splash-icon.png)

Aset visual statis. (988738 byte)

### [apps/mobile/assets/splash-wallpaper.jpg](../apps/mobile/assets/splash-wallpaper.jpg)

Aset visual statis. (113978 byte)

### [apps/mobile/design.md](../apps/mobile/design.md)

Spesifikasi desain mobile historis, berbeda dengan SAGE aktif. (72 baris)

### [apps/mobile/eas.json](../apps/mobile/eas.json)

Profile build/channel EAS; nilai environment tidak disalin. (2249 byte)

### [apps/mobile/index.ts](../apps/mobile/index.ts)

Entry/export publik modul; periksa simbol di bawah. (8 baris)

### [apps/mobile/metro.config.js](../apps/mobile/metro.config.js)

Resolver dan watch folder monorepo Expo. (15 baris)

### [apps/mobile/package.json](../apps/mobile/package.json)

Manifest dependency, versi, scripts, dan entry package. (1 baris)

### [apps/mobile/src/components/AbyssMeshBackground.tsx](../apps/mobile/src/components/AbyssMeshBackground.tsx)

Latar visual berbasis tokens gelap. (51 baris)

Simbol: `AbyssMeshBackground` L6.

### [apps/mobile/src/components/AstralCanvasBackdrop.tsx](../apps/mobile/src/components/AstralCanvasBackdrop.tsx)

Latar visual astral alternatif. (107 baris)

Simbol: `AstralCanvasBackdrop` L16.

### [apps/mobile/src/components/BotanicalStats.tsx](../apps/mobile/src/components/BotanicalStats.tsx)

Visual grafik batang/stem dan donut finance. (172 baris)

Simbol: `BotanicalStemChart` L11, `FinanceDonutChart` L40.

### [apps/mobile/src/components/CrystalGlass.tsx](../apps/mobile/src/components/CrystalGlass.tsx)

Komponen glass berbasis token alternatif. (99 baris)

Simbol: `CrystalGlass` L18.

### [apps/mobile/src/components/MerooBrandMark.tsx](../apps/mobile/src/components/MerooBrandMark.tsx)

Komponen identitas merek visual. (85 baris)

Simbol: `MerooBrandMark` L6.

### [apps/mobile/src/components/MotionPrimitives.tsx](../apps/mobile/src/components/MotionPrimitives.tsx)

Counter/progress/pulse/stagger dan primitive animasi. (278 baris)

Simbol: `AnimatedCounter` L13, `AnimatedProgressBar` L58, `StaggerItem` L142, `LivePulseDot` L178, `SpinTouchable` L233, `handlePress` L237.

### [apps/mobile/src/components/OrderBottomSheetModal.tsx](../apps/mobile/src/components/OrderBottomSheetModal.tsx)

Komponen booking bottom-sheet alternatif; periksa import sebelum menganggap aktif. (501 baris)

Simbol: `ServiceTierItem` L29, `OrderBottomSheetModal` L45, `dismissWithAnimation` L75, `handleCreateOrder` L176.

### [apps/mobile/src/components/OrderDetailModal.tsx](../apps/mobile/src/components/OrderDetailModal.tsx)

Detail order aktif: checklist/vault/progress/chat/cancel/review/receipt. (1443 baris)

Simbol: `OrderDetailModal` L29, `focusSection` L130, `handleAnimatedClose` L265, `toggleSection` L289, `loadAll` L334, `updateChecklistState` L377, `shiftDate` L386, `handleOpenReceipt` L396, `handleDownloadOrShareReceipt` L420, `handleCancelOrder` L432, `confirmCancelOrder` L437, `handleSubmitReview` L463, `handleSaveVault` L491, `handleRequestCode` L511, `handleSubmitCode` L521, `handleAddPreset` L534, `handleAddCustomTask` L571, `handleToggleCheck` L603, `handleConfirmDeleteCheck` L619, `handleSaveProgressEdit` L640, `handleSendChat` L653.

### [apps/mobile/src/components/ProgressRing.tsx](../apps/mobile/src/components/ProgressRing.tsx)

Indikator progres berbentuk ring. (72 baris)

Simbol: `ProgressRing` L12.

### [apps/mobile/src/components/SageFeedback.tsx](../apps/mobile/src/components/SageFeedback.tsx)

Provider toast dan dialog SAGE. (155 baris)

Simbol: `useSageFeedback` L25, `SageFeedbackProvider` L29, `showToast` L35, `showDialog` L44.

### [apps/mobile/src/components/SanctuaryPond.tsx](../apps/mobile/src/components/SanctuaryPond.tsx)

Visual kolam animasi dan ringkasan aktivitas. (497 baris)

Simbol: `SanctuaryPond` L15, `triggerRipple` L180.

### [apps/mobile/src/components/ServiceCatalogCard.tsx](../apps/mobile/src/components/ServiceCatalogCard.tsx)

Komponen kartu katalog reusable alternatif. (363 baris)

Simbol: `ServiceCardItem` L19, `ElementalHeaderArt` L35, `ServiceCatalogCard` L108.

### [apps/mobile/src/components/SpringTouchable.tsx](../apps/mobile/src/components/SpringTouchable.tsx)

Touchable dengan feedback spring. (33 baris)

Simbol: `SpringTouchable` L11, `animateTo` L14.

### [apps/mobile/src/context/BlurContext.tsx](../apps/mobile/src/context/BlurContext.tsx)

Context state blur untuk komponen pendukung. (18 baris)

Simbol: `BlurTargetProvider` L7, `useBlurTarget` L16.

### [apps/mobile/src/lib/goApi.ts](../apps/mobile/src/lib/goApi.ts)

Client Go mobile: resolve URL, token refresh, timeout/retry dan endpoint. (161 baris)

Simbol: `resolveGoApiUrl` L4, `GO_API_BASE_URL` L19, `getValidAccessToken` L21, `goFetch` L38, `goApi` L82.

### [apps/mobile/src/lib/imageCompressor.ts](../apps/mobile/src/lib/imageCompressor.ts)

Kompresi/upload Expo dengan bucket/data URI fallback. (100 baris)

Simbol: `CompressedUploadResult` L5, `base64ToArrayBuffer` L12, `pickAndCompressImage` L35.

### [apps/mobile/src/lib/supabase.ts](../apps/mobile/src/lib/supabase.ts)

Inisialisasi client Supabase untuk platform terkait. (15 baris)

Simbol: `supabase` L8.

### [apps/mobile/src/screens/AdminScreen.tsx](../apps/mobile/src/screens/AdminScreen.tsx)

Finance, assignment, akun/worker, CRUD katalog dan review. (1450 baris)

Simbol: `normalizeSeniorityClient` L34, `AdminScreen` L40, `loadAdminExtras` L133, `openUserControl` L159, `handleSaveUserControl` L172, `handleSaveSplit` L214, `handleInviteWorker` L253, `openAssignPicker` L297, `handleAssignWorker` L327, `openServiceModal` L366, `handleSaveService` L387, `handleToggleServiceActive` L420, `handleDeleteService` L426, `openPkgModal` L449, `handleSavePkg` L470, `handleDeletePkg` L503, `openCatModal` L513, `handleSaveCat` L530, `handleDeleteCat` L562, `handleSaveReviewEdit` L577, `handleDeleteReview` L596.

### [apps/mobile/src/screens/CatalogScreen.tsx](../apps/mobile/src/screens/CatalogScreen.tsx)

Katalog, booking tier, cart lokal dan review. (762 baris)

Simbol: `CatalogScreen` L33, `openBooking` L88, `toggleTier` L98, `getComputedPrice` L104, `getComputedHours` L115, `getSelectedTierNames` L124, `validateBookingForm` L130, `handleAddToCart` L150, `handleCheckoutDirect` L171, `handleCheckoutCart` L230, `openServiceReviews` L262.

### [apps/mobile/src/screens/HomeScreen.tsx](../apps/mobile/src/screens/HomeScreen.tsx)

Dashboard pelanggan, pond, panduan order dan overdue. (293 baris)

Simbol: `HomeScreen` L26.

### [apps/mobile/src/screens/OrdersScreen.tsx](../apps/mobile/src/screens/OrdersScreen.tsx)

Daftar/filter order dan navigasi detail. (238 baris)

Simbol: `OrdersScreen` L26, `selectFilter` L48.

### [apps/mobile/src/screens/ProfileScreen.tsx](../apps/mobile/src/screens/ProfileScreen.tsx)

Identitas/contact/avatar dan akses workspace. (293 baris)

Simbol: `ProfileScreen` L19, `handlePickAvatar` L37, `handleSaveProfile` L66.

### [apps/mobile/src/screens/WorkerScreen.tsx](../apps/mobile/src/screens/WorkerScreen.tsx)

Status worker, tugas, upload/progres dan riwayat. (410 baris)

Simbol: `WorkerScreen` L21, `handleToggleAvailability` L46, `handleAttachScreenshot` L61, `handlePostProgress` L82.

### [apps/mobile/src/theme/sage.ts](../apps/mobile/src/theme/sage.ts)

Tema SAGE aktif, fonts, formatter, preset lokal mobile. (54 baris)

Simbol: `SAGE` L1, `FONTS` L26, `CHECKLIST_PRESETS` L37, `formatIDR` L46, `roleLabel` L50.

### [apps/mobile/src/theme/tokens.ts](../apps/mobile/src/theme/tokens.ts)

Token visual alternatif/lama bertema gelap. (124 baris)

Simbol: `COLORS` L1, `ElementMotif` L33, `ElementTheme` L35, `getServiceElementTheme` L44, `ORDER_STATUS_COLORS` L90, `FONTS` L98, `RADIUS` L108, `SPACING` L117.

### [apps/mobile/tsconfig.json](../apps/mobile/tsconfig.json)

Konfigurasi TypeScript compiler. (6 baris)

## apps/web

### [apps/web/.oxlintrc.json](../apps/web/.oxlintrc.json)

Konfigurasi oxlint: plugin react/oxc, hooks error, only-export-components warning. (8 baris)

### [apps/web/AGENTS.md](../apps/web/AGENTS.md)

Instruksi agent yang berlaku pada subtree aplikasi. (101 baris)

### [apps/web/README.md](../apps/web/README.md)

Dokumentasi bawaan subproject; bandingkan dengan source aktual. (124 baris)

### [apps/web/index.html](../apps/web/index.html)

Shell HTML Vite. (849 byte)

### [apps/web/package.json](../apps/web/package.json)

Manifest dependency, versi, scripts, dan entry package. (35 baris)

### [apps/web/postcss.config.js](../apps/web/postcss.config.js)

Konfigurasi pemrosesan CSS. (6 baris)

### [apps/web/public/favicon.png](../apps/web/public/favicon.png)

Aset visual statis. (96626 byte)

### [apps/web/public/icons.svg](../apps/web/public/icons.svg)

Aset visual statis. (5031 byte)

### [apps/web/src/App.css](../apps/web/src/App.css)

Stylesheet aplikasi web. (184 baris)

### [apps/web/src/App.tsx](../apps/web/src/App.tsx)

Entry React, auth/state/navigasi dan komposisi layar. (267 baris)

Simbol: `CartBadge` L25, `AppContent` L35, `checkUser` L60, `fetchProfile` L74, `handleLogout` L83, `App` L261.

### [apps/web/src/assets/hero.png](../apps/web/src/assets/hero.png)

Aset visual statis. (13057 byte)

### [apps/web/src/assets/react.svg](../apps/web/src/assets/react.svg)

Aset visual statis. (4126 byte)

### [apps/web/src/components/ConfirmModal.tsx](../apps/web/src/components/ConfirmModal.tsx)

Komponen dialog konfirmasi web. (125 baris)

Simbol: `ConfirmOptions` L3, `getIcon` L18, `ConfirmModal` L47.

### [apps/web/src/components/OrderChat.tsx](../apps/web/src/components/OrderChat.tsx)

Chat order via Supabase polling 3 detik. (188 baris)

Simbol: `OrderChat` L20, `fetchMessages` L56, `handleSendMessage` L69.

### [apps/web/src/context/CartContext.tsx](../apps/web/src/context/CartContext.tsx)

Cart React Context berbasis memori. (58 baris)

Simbol: `CartItem` L3, `CartProvider` L27, `useCart` L54.

### [apps/web/src/index.css](../apps/web/src/index.css)

Stylesheet global/Tailwind dan utility visual. (182 baris)

### [apps/web/src/lib/dialog.tsx](../apps/web/src/lib/dialog.tsx)

Helper imperative dialog custom web. (174 baris)

Simbol: `showConfirm` L8, `showAlert` L34, `PromptModal` L82, `showPrompt` L153.

### [apps/web/src/lib/imageUtils.ts](../apps/web/src/lib/imageUtils.ts)

Kompresi gambar browser. (34 baris)

Simbol: `compressImage` L7.

### [apps/web/src/lib/supabase.ts](../apps/web/src/lib/supabase.ts)

Inisialisasi client Supabase untuk platform terkait. (6 baris)

Simbol: `supabase` L6.

### [apps/web/src/main.tsx](../apps/web/src/main.tsx)

Bootstrap React DOM et chargement CSS. (10 baris)

### [apps/web/src/pages/AdminDashboard.tsx](../apps/web/src/pages/AdminDashboard.tsx)

Operasi admin web berbasis Supabase langsung. (1688 baris)

Simbol: `AdminDashboard` L47, `fetchAllData` L121, `handleChangeRole` L160, `handleDeleteUser` L174, `handleAssignWorker` L193, `handleSaveWorkerStats` L217, `openAddService` L247, `openEditService` L258, `handleSaveService` L269, `handleToggleActive` L300, `handleDeleteService` L307, `openAddCategory` L319, `openEditCategory` L323, `generateSlug` L332, `handleSaveCategory` L338, `handleToggleCategoryActive` L371, `handleDeleteCategory` L378, `openAddPackage` L402, `openEditPackage` L415, `handleSavePackage` L428, `handleTogglePackageActive` L463, `handleDeletePackage` L471.

### [apps/web/src/pages/Cart.tsx](../apps/web/src/pages/Cart.tsx)

Checkout cart dan bulk insert orders. (123 baris)

Simbol: `Cart` L7.

### [apps/web/src/pages/Catalog.tsx](../apps/web/src/pages/Catalog.tsx)

Halaman katalog publik. (238 baris)

Simbol: `Catalog` L11, `fetchData` L23.

### [apps/web/src/pages/HowToOrder.tsx](../apps/web/src/pages/HowToOrder.tsx)

Panduan pemesanan web. (132 baris)

Simbol: `HowToOrder` L4.

### [apps/web/src/pages/Login.tsx](../apps/web/src/pages/Login.tsx)

Login dan permintaan reset password. (203 baris)

Simbol: `Login` L6, `handleLogin` L15, `handleResetPassword` L35.

### [apps/web/src/pages/MyOrders.tsx](../apps/web/src/pages/MyOrders.tsx)

Order consumer dan pembatalan. (289 baris)

Simbol: `MyOrders` L15, `fetchOrders` L25, `handleCancelOrder` L46.

### [apps/web/src/pages/OrderTracking.tsx](../apps/web/src/pages/OrderTracking.tsx)

Timeline/progres/review/chat per order. (365 baris)

Simbol: `OrderTracking` L18, `fetchOrder` L41, `handleProgressUpdate` L71, `handleSubmitReview` L102.

### [apps/web/src/pages/Profile.tsx](../apps/web/src/pages/Profile.tsx)

Profile/avatar web. (265 baris)

Simbol: `Profile` L9, `fetchProfile` L28, `handleUpdateProfile` L54, `handleLogout` L121.

### [apps/web/src/pages/Register.tsx](../apps/web/src/pages/Register.tsx)

Registrasi Supabase. (181 baris)

Simbol: `Register` L10, `handleRegister` L20.

### [apps/web/src/pages/ResetPassword.tsx](../apps/web/src/pages/ResetPassword.tsx)

Penyelesaian reset password. (147 baris)

Simbol: `ResetPassword` L5, `handleResetPassword` L22.

### [apps/web/src/pages/ServiceDetail.tsx](../apps/web/src/pages/ServiceDetail.tsx)

Service detail, tier selection dan add-to-cart. (371 baris)

Simbol: `ServiceDetail` L14, `checkUserRole` L39, `fetchServiceData` L49, `handleAddToCart` L132.

### [apps/web/src/pages/ServiceReviews.tsx](../apps/web/src/pages/ServiceReviews.tsx)

Daftar review layanan. (148 baris)

Simbol: `ServiceReviews` L10, `fetchReviews` L22.

### [apps/web/src/pages/WorkerDashboard.tsx](../apps/web/src/pages/WorkerDashboard.tsx)

Dashboard worker web. (395 baris)

Simbol: `WorkerDashboard` L19, `fetchOrders` L35, `handleUploadProgress` L57.

### [apps/web/src/types/database.ts](../apps/web/src/types/database.ts)

Definisi TypeScript tabel Row/Insert/Update/Relationships. (1061 baris)

### [apps/web/src/vite-env.d.ts](../apps/web/src/vite-env.d.ts)

Deklarasi tipe lingkungan Vite. (10 baris)

### [apps/web/tailwind.config.ts](../apps/web/tailwind.config.ts)

Tema dan konfigurasi Tailwind. (52 baris)

### [apps/web/tsconfig.json](../apps/web/tsconfig.json)

Konfigurasi TypeScript compiler. (21 baris)

### [apps/web/tsconfig.node.json](../apps/web/tsconfig.node.json)

Konfigurasi TypeScript compiler. (10 baris)

### [apps/web/vercel.json](../apps/web/vercel.json)

Konfigurasi deploy/rewrite khusus aplikasi. (5 baris)

### [apps/web/vite.config.ts](../apps/web/vite.config.ts)

Konfigurasi bundler Vite/plugin React. (7 baris)

## database

### [database/migration.sql](../database/migration.sql)

Migrasi historis constraints/policies; bukan runbook yang telah diverifikasi. (124 baris)

### [database/migration_v3.sql](../database/migration_v3.sql)

Tambahan schema/policies vault/checklist/finance dan OAuth. (217 baris)

### [database/schema.sql](../database/schema.sql)

Definisi schema dasar, triggers, RLS, policy storage. (386 baris)

### [database/seed.sql](../database/seed.sql)

Dummy seed; memerlukan penyesuaian terhadap schema aktual. (47 baris)

## package.json

### [package.json](../package.json)

Manifest dependency, versi, scripts, dan entry package. (1 baris)

## packages/shared

### [packages/shared/package.json](../packages/shared/package.json)

Manifest dependency, versi, scripts, dan entry package. (11 baris)

### [packages/shared/src/api.ts](../packages/shared/src/api.ts)

MerooApiClient bersama; bukan wrapper aktif mobile. (82 baris)

Simbol: `MerooApiClient` L1.

### [packages/shared/src/checklists.ts](../packages/shared/src/checklists.ts)

Tipe/preset checklist bersama. (15 baris)

Simbol: `ChecklistPreset` L1, `GENSHIN_CHECKLIST_PRESETS` L8.

### [packages/shared/src/constants.ts](../packages/shared/src/constants.ts)

Brand, daftar server Genshin dan label status. (20 baris)

Simbol: `BRAND` L1, `GENSHIN_SERVERS` L7, `ORDER_STATUS_LABELS` L14.

### [packages/shared/src/formatters.ts](../packages/shared/src/formatters.ts)

Format harga IDR dan estimasi waktu. (16 baris)

Simbol: `formatIDR` L1, `formatEstimatedHours` L10.

### [packages/shared/src/index.ts](../packages/shared/src/index.ts)

Entry/export publik modul; periksa simbol di bawah. (5 baris)

### [packages/shared/src/theme.ts](../packages/shared/src/theme.ts)

Subset token SAGE bersama. (14 baris)

Simbol: `SAGE_THEME` L1.

## packages/supabase

### [packages/supabase/package.json](../packages/supabase/package.json)

Manifest dependency, versi, scripts, dan entry package. (14 baris)

### [packages/supabase/src/client.ts](../packages/supabase/src/client.ts)

Factory typed Supabase client. (13 baris)

Simbol: `createSupabaseClient` L4.

### [packages/supabase/src/database.ts](../packages/supabase/src/database.ts)

Definisi TypeScript tabel Row/Insert/Update/Relationships. (530 baris)

Simbol: `Json` L1, `Database` L9, `Tables` L413, `TablesInsert` L442, `TablesUpdate` L467, `Enums` L492, `CompositeTypes` L509, `Constants` L526.

### [packages/supabase/src/index.ts](../packages/supabase/src/index.ts)

Entry/export publik modul; periksa simbol di bawah. (2 baris)

## pnpm-lock.yaml

### [pnpm-lock.yaml](../pnpm-lock.yaml)

Resolusi dependency terkunci; bukan source bisnis. (281008 byte)

## pnpm-workspace.yaml

### [pnpm-workspace.yaml](../pnpm-workspace.yaml)

Daftar workspaces dan allowBuilds. (5 baris)

## structure

### [structure/latest 1.0.1.txt](../structure/latest%201.0.1.txt)

Transkrip historis terpotong; sumber checkpoint awal. (12562 byte)

## turbo.json

### [turbo.json](../turbo.json)

Task graph build/dev/lint. (1 baris)

## File lokal di luar tracked source

- `structure/checkpoint.md`: sudah ada sebelum sesi, kosong dan untracked; dipertahankan.
- `bug/bug.txt` dan tujuh JPEG: laporan gejala; seluruh screenshot dilihat, ringkasannya pada temuan.md.
- `backup/adminpermission.sql`, `delete.sql`, `deletedata.sql`, `guide.txt`: script/panduan historis izin dan penghapusan. Tidak dijalankan.
- `plan.txt`: catatan rencana lokal; jangan salin nilai sensitif.
- `apps/web/.env`, `apps/mobile/.env`: konfigurasi lokal; isi tidak dimuat dalam inventaris.
- `node_modules/` serta folder cache build/tool: dependency/generated, bukan source produk.
- `structur/`: kumpulan dokumen audit ini.
