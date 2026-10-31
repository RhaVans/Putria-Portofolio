# TODO for Putria Octavianty

This portfolio website was designed and built to showcase your leadership, editorial, and organizational experience with a calm, Apple-grade design system in the Starry Night palette.

Before public launch, please review the following items that only you can authorize or customize.

---

## 1. Biography Statement Review (About Page)

In [`src/content/strings.en.json`](file:///root/projects/PUT/src/content/strings.en.json), the biography statement is drafted strictly from your verified CV records:

> *"I'm Putria, from Kebumen. At SMA Muhammadiyah Gombong I coordinated a leadership camp, edited a science textbook, led a team developing shampoo from watermelon rind waste, and served as treasurer of a student organization. My skills are public speaking and editing."*

- [ ] **Action:** Review this draft. If you wish to rewrite or emphasize different aspects, edit the `"bio"` field in [`src/content/strings.en.json`](file:///root/projects/PUT/src/content/strings.en.json). Aim for first-person, clear verbs, and under 80 words.

---

## 2. Contact & Privacy Verification (§10)

To protect your personal privacy, your phone number, national ID (NIK), home street address, and birth date were strictly excluded from the published website and sanitized CV. Only your city (*Kebumen, Indonesia*) and email address (*pramestiputria03@gmail.com*) are published.

- [ ] **Action:** Confirm that direct email is your preferred public contact method.

---

## 3. Education Status & Cohort

Your academic credential is displayed in the About grouped list as:
- **Institution:** SMA Muhammadiyah Gombong, 2023–2026, natural sciences and mathematics

- [ ] **Action:** When you graduate or enroll in higher education, update the education field in [`src/content/strings.en.json`](file:///root/projects/PUT/src/content/strings.en.json) or [`src/content/site.json`](file:///root/projects/PUT/src/content/site.json).

---

## 4. Launch Gate (§10)

Currently the website includes `<meta name="robots" content="noindex, nofollow" />` to prevent search engines from indexing the site while in draft.

- [ ] **Action:** Once you are fully satisfied with the site and ready for public search visibility, change `content="noindex, nofollow"` to `content="index, follow"` in [`src/layouts/Base.astro`](file:///root/projects/PUT/src/layouts/Base.astro).
