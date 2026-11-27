# Mobile UI correction - 27 November 2026

Status: implemented and published to Expo OTA preview for Android runtime 1.0.1; device QA pending.

## Scope and design

Read bug.txt and all four November 27 screenshots. Preserve the existing SAGE identity and layout. Design direction: ENERGY 1, RHYTHM 1, MOTION 1 for this focused repair. No new assets, business logic, dependency, native configuration or web changes.

## Changes

- Disable user dragging on the outer horizontal pager so it does not intercept child category/filter/admin tab gestures. Bottom navigation still scrolls the pager programmatically with animation. This intentionally replaces swipe-between-main-pages with bottom-tab navigation.
- Admin and Orders horizontal tab strips have nested scrolling, bounded growth, rounded clipping and visible scroll indicators.
- Bottom navigation constrains each label to its own cell and provides accessible tab names/selection and 48-point minimum height.
- Press feedback uses smaller scale and lower bounce; stops the previous animation before starting another.
- Counter duration capped at 450ms, progress at 400ms; card stagger reduced to 120ms maximum with no bounce. Effect animations stop on cleanup.
- Device reduce-motion preference supported for pager transitions, spring buttons, counter/progress, stagger and pulse primitives. This does not claim every existing decorative/modal animation has been converted.

## Verification

- Mobile pnpm exec tsc --noEmit: PASS after final source edit.
- Oxlint on six changed/new source files: exit 0, warnings remain (Animated refs, render-time Date, existing unused state/effect dependency). First attempt used relative paths containing .. and was rejected; rerun with absolute paths succeeded.
- Expo Android export: PASS, 973 modules, Hermes bundle and 59 assets in .tmp-mobile-ui-export at repository root. This is a local bundle, not an APK or published update.
- git diff --check: PASS.
- No Android adb/emulator found in PATH or standard SDK location checked. No device click-through or FPS measurement was performed.

## Delivery gate

Hard gate: source checks/build passed; device layout, contrast and interaction verification still pending. No fabricated metrics or production-success claims.
Purpose gate: existing sage palette, rounded tab strips and press animation retained to preserve identity and make selection/feedback clear.
Liveliness: restrained motion; primary focal point remains the current screen content and selected tab.
Craftsmanship: focused diff, accessible bottom tabs, animation cleanup and reduced-motion support. Overall visual delivery remains provisional until device QA, not an all-PASS claim.

## Device QA required

1. Admin: drag top strip both directions to reach catalog/reviews; drag status filters without changing main page.
2. Orders: drag through all filters, tap filters and repeatedly switch bottom tabs; check labels on the screenshot device and larger text settings.
3. Catalog: drag all categories and use cart/booking; confirm vertical scrolling and keyboard still work.
4. Worker/Profile/Home: navigate rapidly and scroll long lists; confirm state remains intact.
5. Order detail: open/close, expand sections, calendar, keyboard/chat, receipt and image zoom. Existing modal animations were inspected for native driver usage, not device-tested.
6. Enable reduce motion and repeat affected controls; progress and selected-page state must still update.
7. Inspect frame timing in a release build before claiming all movements smooth.

## Expo OTA vs APK

These changes do not add native dependencies or change app.json/eas.json. Existing app version/runtime policy remains 1.0.1/appVersion. OTA is suitable for a compatible installed binary. Do not increment appVersion solely for this OTA: runtime selection must match the installed APK.

The historical 1.0.1 APK was built with preview; verify actual installed build channel and server channel-to-branch mapping before publishing. Both preview and production profiles exist. EAS Update export must use the correct public API/Supabase environment; eas.json build env does not by itself prove the update command uses identical values.

Expo OTA was published on 27 November 2026 with user authorization. No new APK build, commit or Git push was performed. Native SDK/plugin/permission changes or incompatible runtime would require a new binary, but none were introduced here.

## Published OTA

- Project: @meroohihi/mobile (0a7175af-0b7d-4efc-8449-d768d9c535e1).
- Verified existing APK build d05512dd-09a2-4e58-8222-704ba6dd40b2: FINISHED, Android, preview channel, app/runtime 1.0.1.
- Verified active preview channel maps to preview branch.
- EAS preview environment was empty. Synchronized the four EXPO_PUBLIC variables from local .env after verifying exact equality with eas.json preview build values. Values are intentionally omitted here.
- Published Android only using channel preview and environment preview. Runtime: 1.0.1.
- Update group: da07f630-2590-4128-b42b-1f48e6db5c7e.
- Android update: 01a21bec-23d8-7d73-8b00-c36e31fc17bb.
- Dashboard: https://expo.dev/accounts/meroohihi/projects/mobile/updates/da07f630-2590-4128-b42b-1f48e6db5c7e
- Message: Fix mobile filter gestures, bottom tabs and motion feedback.
- Published from the working tree based on b93368eb357b1cf6641281b61d08004bd31a8508, including the uncommitted fixes and new reduced-motion hook. OTA contains the current mobile bundle, not only a patch of changed files.
- Publication export passed: 973 modules; bundle index-f0449774a81e25ed34a38b89ecb7b631.hbc matches the previously validated local export.
- Compatible installed APKs can fetch the update online at startup. Fully close/reopen the app; allow download/reload, reopening again if needed. No reinstall is required for this verified preview 1.0.1 APK. Other channels/runtimes are not targeted.
- Publication success does not establish installation on any particular device or verify visual behavior/FPS. Device QA above remains pending.

References:
- https://docs.expo.dev/eas-update/runtime-versions/
- https://docs.expo.dev/eas-update/deployment/
- https://reactnative.dev/docs/scrollview
- https://reactnative.dev/docs/accessibilityinfo
