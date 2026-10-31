# TODO for Putria Octavianty

This portfolio website was designed and built to showcase your leadership, editorial, and organizational experience with an accessible, high-performance dark glassmorphism aesthetic (Starry Night palette).

Before public launch, please review the following items that only you can authorize or customize.

---

## 1. Biography Statement Review

In [`src/content/strings.en.json`](file:///root/projects/PUT/src/content/strings.en.json), an initial biographical statement was drafted strictly from your verified CV records:

> *"I am a student at SMA Muhammadiyah Gombong (Class of 2026) focusing on natural sciences and mathematics. Through roles as General Treasurer in student leadership, project leader in organic waste recycling, and editor for junior high school science materials, I have built practical experience in financial oversight, risk planning, and event coordination. Based in Kebumen, I communicate in Javanese and English and enjoy bringing order, precision, and care to team initiatives."*

- [ ] **Action:** Review this draft. If you wish to adjust the phrasing or emphasis, edit the `"bio"` field in [`src/content/strings.en.json`](file:///root/projects/PUT/src/content/strings.en.json). Aim for 60–80 words in first person.

---

## 2. Real Project Photos (Optional Replacement for Abstract Covers)

The website currently renders custom geometric Starry Night SVG covers for your initiatives (leadership constellation, botanical synthesis, editorial layout grid, and financial balance).

If you have real photographs from:
- The Leadership Camp event
- The Watermelon Rind Shampoo research and product formulation
- The Junior High School Science Textbook draft materials
- Ikatan Pelajar Muhammadiyah Gombong activities

- [ ] **Action:** Save your photos (compressed WebP or JPG) in `public/images/projects/` and specify the image paths in [`src/content/experience.json`](file:///root/projects/PUT/src/content/experience.json).

---

## 3. Contact Preferences & WhatsApp Consent (Decision D4)

To protect your personal privacy (per safety guidelines in §10), your phone number, national ID (NIK), home street address, and birth date were strictly excluded from the published website and sanitized CV. Only your city (*Kebumen, Indonesia*) and email address (*pramestiputria03@gmail.com*) are published.

- [ ] **Action:** If you explicitly wish to add a direct WhatsApp chat button, confirm your consent and add your phone number to [`src/content/site.json`](file:///root/projects/PUT/src/content/site.json). Otherwise, keeping direct correspondence via email is recommended.

---

## 4. Education Status & Cohort (Decision D6)

Your academic credential is currently displayed as:
- **Institution:** SMA Muhammadiyah Gombong
- **Cohort:** Class of 2026 (2023 – 2026)
- **Track:** Natural Sciences & Mathematics (EQF Level 4)

- [ ] **Action:** When you graduate or enroll in higher education, update the education fields in [`src/content/site.json`](file:///root/projects/PUT/src/content/site.json).

---

## 5. Replacing the Portrait (Optional)

If you ever wish to update your portrait photograph:
1. Place the new transparent cut-out PNG in `_private/` (e.g. `_private/new-portrait.png`).
2. Run `node scripts/prepare-portrait.mjs` to automatically crop, optimize, and generate the AVIF and WebP responsive sets in `public/images/`.
3. Run `pnpm run build` to package the updated site.

---

## 6. Public Launch Gate (Search Engine Indexing)

The website is currently compiled with a **launch gate** to prevent search engine indexing until you have reviewed and approved it:
- `<meta name="robots" content="noindex, nofollow" />` in [`src/layouts/Base.astro`](file:///root/projects/PUT/src/layouts/Base.astro)
- `Disallow: /` in [`public/robots.txt`](file:///root/projects/PUT/public/robots.txt)

- [ ] **Action to Publish:**
  1. In [`src/layouts/Base.astro`](file:///root/projects/PUT/src/layouts/Base.astro), remove the `<meta name="robots" content="noindex, nofollow" />` tag.
  2. In [`public/robots.txt`](file:///root/projects/PUT/public/robots.txt), change `Disallow: /` to `Allow: /`.
  3. Rebuild with `pnpm run build` and deploy.
