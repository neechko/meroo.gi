# meroo.gi Mobile — Design System Specification
> Frosted glass cathedral in Fontaine Abyss (AuthKit Architecture × Anemo Emerald Palette)

**Theme:** Dark-first Native Mobile Glassmorphism  
**Target Platform:** React Native (Expo) — iOS & Android  

---

## 1. Core Philosophy & Native Mobile Layout
- **Native App Flow (Zero Web-Nav Feel):** No top website navbar or bulky hero banner. Screens open with a compact native header (`TEYVAT CONCIERGE` eyebrow + `meroo.gi` gradient wordmark + quick action icons), sticky search bar, horizontal pill category filters, horizontal snap-scroll spotlight cards, and a floating glass bottom dock.
- **Thumb-Zone Ergonomics:** Primary CTAs, server selectors, and tier pickers live inside native bottom-sheet modals with a top drag handle (`36×4px`) and comfortable bottom safe-area padding.
- **Monochromatic Discipline + Single Chromatic CTA:** The canvas stays strictly in cool abyss-teal dark tones. **Anemo Emerald (`#14B8A6`)** is reserved exclusively for primary action buttons (`Pesan & Bayar`, `Masuk`, active progress indicators, and active tab states).

---

## 2. Color Tokens

| Token | Name | Value | Role |
|-------|------|-------|------|
| `--color-abyss-canvas` | Abyss Canvas | `#090D10` | Base full-bleed screen background |
| `--color-carbon-teal` | Carbon Teal | `#11171D` | Elevated surface, ghost button backing |
| `--color-frosted-glass` | Frosted Glass | `rgba(204, 251, 241, 0.04)` | Translucent card plate fill |
| `--color-deep-glass` | Deep Glass | `rgba(9, 13, 16, 0.96)` | Bottom-sheet modals & floating dock |
| `--color-glass-edge` | Glass Edge | `rgba(94, 234, 212, 0.14)` | Universal 1px hairline border |
| `--color-frost-top` | Top Specular | `rgba(230, 255, 250, 0.22)` | Top-edge inset glass highlight |
| `--color-ice-highlight` | Ice Highlight | `#E6FFFA` | Primary gradient start & high-emphasis ink |
| `--color-frost-glow` | Frost Glow | `#CCFBF1` | Card titles, primary foreground, line-art icons |
| `--color-moon-mist` | Moon Mist | `#99F6E4` | Secondary labels, badges, metadata |
| `--color-fog-veil` | Fog Veil | `#8FA8A3` | Muted descriptions, placeholders |
| `--color-anemo-emerald` | Anemo Emerald | `#14B8A6` | **Sole Chromatic Primary CTA** & active progress |
| `--color-abyss-ink` | Abyss Ink | `#042F2E` | High-contrast text on Anemo Emerald CTA |

### Order Status Semantic Tokens
- `pending`: `#F59E0B` (Amber)
- `paid`: `#38BDF8` (Hydro Sky)
- `in_progress`: `#14B8A6` (Anemo Emerald)
- `completed`: `#10B981` (Success Green)
- `cancelled`: `#F43F5E` (Rose)

---

## 3. Admin Media & Image Rules (Approved: Option B — 16:9 Submerged Glass Banner)
To ensure admin-uploaded images (`services.image_url`) never clash with the dark glass aesthetic:
1. **Aspect Ratio Lock:** Every service card image container uses a fixed **`16:9`** aspect ratio (`width: 100%`, `aspectRatio: 16 / 9`) with `resizeMode="cover"`, clipped cleanly to the card's top `16px` border radius.
2. **Submerged Abyss Scrim:** Overlay a vertical gradient from top (`rgba(9, 13, 16, 0.12)`) through middle (`rgba(9, 13, 16, 0.45)`) to bottom (`rgba(9, 13, 16, 0.96)`) so the artwork melts seamlessly into the frosted card body below.
3. **Anemo Color Wash & Desaturation:** Apply a subtle teal wash (`rgba(20, 184, 166, 0.10)`) and slight desaturation (`~85%`) so bright in-game screenshots harmonize with the Abyss palette.
4. **Glass Bezel Hairline:** Inner `1px` border (`rgba(94, 234, 212, 0.18)`) around the banner frame.
5. **Smart Fallback:** If `image_url` is `null` or empty, render a `16:9` subtle blueprint-grid glass header centered with a `1.5px` stroke mono line-art icon in `#CCFBF1`.

---

## 4. Typography & Scale
- **Display & Wordmark (`Space Grotesk`, weight `500`):** Used for `meroo.gi` wordmark (`26px–28px`) and modal titles (`20px–22px`) with linear gradient fill (`#E6FFFA` → `#5EEAD4`). Never use bold (`700+`) on display headings.
- **UI & Body (`Inter`, weights `400`, `500`, `600`):**
  - `caption`: `12px` / line-height `16px`
  - `body-sm`: `13px–14px` / line-height `20px`
  - `body`: `15px–16px` / line-height `24px`
  - `subheading`: `17px–18px` / line-height `24px`
- **Eyebrow & Telemetry (`JetBrains Mono`, weight `400`, `0.10em` letter-spacing, tabular-nums):** All-caps section markers (`TEYVAT CONCIERGE`, `KATALOG JOKI`, `LIVE TRACKING`), UIDs, prices (`Rp`), and progress percentages.

---

## 5. Geometry, Spacing & Elevation
- **Base Unit:** `4px` (`4, 8, 12, 16, 20, 24, 32`)
- **Strict Radius Families (Never Mix):**
  - Cards & Bottom-Sheet Modals: `16px` (modals top corners `24px`)
  - Inputs & Category Badges: `6px`
  - All Interactive Buttons, Pills & Dock: `999px`
  - Circular Icon Tiles: `9999px`
- **Glass Elevation Stack:**
  - Card Border: `1px` solid `rgba(94, 234, 212, 0.14)` + top edge highlight `rgba(230, 255, 250, 0.20)`
  - Modal Shadow: `0 16px 32px rgba(0, 0, 0, 0.45)` + inner top specular edge