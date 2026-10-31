# Design Notes: Putria Octavianty Portfolio Redesign (v2)

Apple-grade refinement replacing template tells with calm, content-led precision.

---

## 1. Core Visual Tokens & Materials

### Palette (Starry Night, Disciplined)
- `--night-950`: `#0F0F26` (base foundation, deep shadow)
- `--night-900`: `#191939` (page base, theme-color)
- `--night-700`: `#1B3A68` (glass base, restrained glow source)
- `--sky-400`: `#6FB8E6` (interactive links, cool accent)
- `--moon-400`: `#ECB44D` (**Single action token**: exactly one primary action per viewport)
- `--starlight-200`: `#F2E199` (rare micro-specular hairline highlight only)
- `--text-1`: `#F7F3E3` (15.2:1 contrast against `#191939`; crisp, confident typography)
- `--text-2`: `rgb(247 243 227 / 0.72)` (8.4:1 contrast; descriptions, secondary details)
- `--text-3`: `rgb(247 243 227 / 0.52)` (5.0:1 contrast; captions ≥ 14px only on night-900/950)
- `--hairline`: `rgb(247 243 227 / 0.12)` (row borders)

### Typography (Single Family: Inter Variable)
- Family: `Inter` variable (`opsz` 14–32, `wght` 400, 500, 600) with `font-optical-sizing: auto`
- Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- Size scale:
  - Hero H1: `clamp(2.5rem, 13vw, 7rem)` (600 weight, -0.035em tracking, 1.02 line-height)
  - Page H1 / Section H2: `clamp(2rem, 6.5vw, 3.5rem)` (600 weight, -0.03em tracking, 1.06 line-height)
  - Row Title: `clamp(1.375rem, 3vw, 1.75rem)` (600 weight, -0.015em tracking, 1.2 line-height)
  - Statement Lines: `clamp(1.75rem, 6vw, 3.5rem)` (600 weight, -0.025em tracking, 1.1 line-height)
  - Body: `1.0625rem` (17px, 400 weight, 1.5 line-height, max 62ch)
  - UI Label: `0.9375rem` (15px, 500 weight, 1.3 line-height)
  - Caption: `0.875rem` (14px, 400 weight, 1.4 line-height)

### Surfaces & Materials
- **Glass controls**: Navigation bar (desktop), floating capsule tab bar (mobile), secondary buttons, detail sheets.
  - Recipe: `background: linear-gradient(180deg, rgb(255 255 255 / .10), rgb(255 255 255 / .03)), rgb(27 58 104 / .30);`
  - Blur: `backdrop-filter: blur(var(--glass-blur, 24px)) saturate(170%);` (16px on mobile)
  - Edge: `inset 0 0 0 1px rgb(255 255 255 / .10), inset 0 1px 0 rgb(255 255 255 / .22)`
- **Surface**: Flat translucent grouped container (`rgb(247 243 227 / 0.05)` with `28px` radius and hairlines) for About/Detail lists.
- **Content canvas**: Paragraphs, section headings, and statement lines sit directly on the night sky.

---

## 2. Wireframes & Layout Composition

### Mobile Hero (360×640 to 430×932)
```text
┌──────────────────────────────────────┐
│ [gutter: 20px]                       │
│ Putria                               │  H1 (Inter 600, text-1)
│ Octavianty                           │  Never overlaps portrait
│                                      │
│ Event coordinator, editor and        │  Role line (Inter 400, text-2)
│ student leader.                      │
│                                      │
│ [ View work ]  [ Download CV ]       │  1 Moon primary + 1 glass secondary
│                                      │
│            ╭──────────╮              │  Glow + crescent arc behind head
│            │          │              │  Portrait bottom-anchored
│            │  (face)  │              │  Scarf silhouetted against glow
│            │          │              │  Runs behind tab bar
│ ╭──────────────────────────────────╮ │
│ │  Home    About    Work   Contact │ │  Floating glass tab bar
│ ╰──────────────────────────────────╯ │
└──────────────────────────────────────┘
```

### Desktop Hero (≥ 1024px)
```text
┌────────────────────────────────────────────────────────────────────────┐
│               ╭────────────────────────────────────────╮               │
│               │   Home     About     Work     Contact  │               │
│               ╰────────────────────────────────────────╯               │
│                                                                        │
│  Putria Octavianty                   │        ╭──────────────╮         │
│                                      │        │ (warm halo)  │         │
│  Event coordinator, editor and       │        │  (crescent)  │         │
│  student leader.                     │        │   portrait   │         │
│                                      │        │  max 80vh    │         │
│  [ View work ]   [ Download CV ]     │        │ bottom-align │         │
│                                      │                                 │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Self-Critique & Slop Eviction

| Old Slop Element | Critique | Replacement in v2 |
|---|---|---|
| Name behind portrait | Illegible gimmick: user only sees chopped fragments of her name. | Name placed above (mobile) or left (desktop). Clear, confident typography with zero overlap. |
| 6-card capability grid | Generic AI template filler repeating CV bullets with icons in boxes. | Deleted. Content is conveyed naturally in the Work rows and About grouped list. |
| 4-step process cards (01–04) | Artificial numbers on non-linear achievements. | Replaced by fluid, scroll-linked typography statements ("How I work") without boxes or numbers. |
| Stat bar | Tiny numbers (4 roles, 2 orgs) inflated into a dashboard widget. | Deleted. Quality and real descriptions speak for themselves. |
| Dual fonts (Bodoni + Sans) | Ornamental serif clashed with technical student leadership and editorial clarity. | Unified under self-hosted Inter variable font with optical sizing. |
| Floating sparkle stars | Decorative visual noise carrying zero information. | Deleted completely. Pure astronomical radial depth and clear silhouette glow only. |
| Mobile top bar collision | Covered hero portrait on mobile devices. | Removed top bar on mobile; clean floating bottom capsule tab bar only. |
| Multiple yellow buttons | Accent color diluted across multiple blocks. | Exactly one Crescent Moon primary action button per viewport. |
