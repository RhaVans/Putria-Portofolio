# Putria Octavianty — Portfolio Website

A calm, precise, Apple-grade portfolio website designed for **Putria Octavianty** (Event coordinator, editor, and student leader based in Kebumen, Indonesia).

Built with **Astro**, **TypeScript**, **Inter variable font**, and a disciplined **Starry Night glassmorphism** visual system.

---

## Design System & Architecture

- **Palette:** Starry Night tokens (`--night-950`, `--night-900`, `--night-700`, `--sky-400`, `--moon-400`, `--starlight-200`). Exactly one Moon-yellow primary action per viewport.
- **Typography:** Self-hosted `Inter` variable font with optical sizing (`font-optical-sizing: auto`). Scaled from 14px captions to clamp hero display.
- **Surfaces:**
  - **Glass:** Navigation controls (desktop top capsule, mobile bottom floating tab bar), secondary buttons, detail sheets.
  - **Surface:** Flat grouped list surface without blur (`rgb(247 243 227 / 0.05)`) with hairlines for structured details.
  - **Canvas:** Content sits directly on the dark starry field without redundant card boxing.
- **Hero:** Mobile and desktop composed layout with zero text overlap over the portrait cut-out. Scarf silhouette separation against warm crescent glow.
- **Performance & Privacy:** 
  - Zero private CV data published (§10).
  - Responsive AVIF/WebP image sets (hero mobile image ≤ 90 KB).
  - Native scrolling on mobile, optional Lenis smooth scrolling on desktop pointer devices.
  - Fluid view transitions with directional morphing.

---

## Project Structure

```text
├── public/
│   ├── cv.pdf                 # Sanitized student CV
│   ├── favicon.svg            # Monogram favicon
│   ├── fonts/                 # Self-hosted Inter variable woff2
│   └── images/                # Responsive portrait AVIF/WebP & OG image
├── src/
│   ├── components/
│   │   ├── AmbientBackground.astro # Two calm radial depth gradients
│   │   ├── Footer.astro            # Minimal one-line footer
│   │   ├── Hero.astro              # Composed hero chapter
│   │   ├── HowIWork.astro          # Scroll-linked fluid statements
│   │   ├── SayHello.astro          # Closing contact chapter
│   │   ├── TabBar.astro            # Mobile bottom floating glass capsule
│   │   ├── TopNav.astro            # Desktop top floating glass capsule
│   │   └── WorkRows.astro          # Hairline-separated initiative rows
│   ├── content/
│   │   ├── experience.json         # Verifiable student leadership records
│   │   ├── site.json               # Identity & metadata
│   │   └── strings.en.json         # Verbatim first-person copy deck
│   ├── layouts/
│   │   └── Base.astro              # Document shell, SEO, View Transitions
│   └── styles/
│       ├── tokens.css              # Color, spacing, type scale tokens
│       ├── glass.css               # Apple-grade glass and surface recipes
│       └── global.css              # Base resets, typography, view transition styles
```

---

## Development & Build

```bash
# Run local dev server with network host
pnpm run dev

# Static production build
pnpm run build

# Preview production build
pnpm run preview
```
