# Arabic SEO Plan — real `/ar/` pages for organic Arabic traffic

> Goal: rank in Arabic search (e.g. «تشطيب دبي», «نجارة دبي», «ديكور داخلي دبي»)
> by serving genuine Arabic documents — Arabic `<title>`/meta, `lang="ar"`,
> self-canonical Arabic URLs — instead of the current JS `?lang=ar` toggle.
> Decisions (2026-06-25): **script-generated** Arabic pages · **`/ar/` subdirectory** ·
> **phased rollout, top pages first.**

## STATUS — Phase 1 ✅ done (2026-06-25)
13 Arabic pages generated under `/ar/` (home, 6 service pages, 4 case studies,
services, contact) via `scripts/build-ar.js` (`npm run build:ar`). Each: Arabic
`<head>` + `lang="ar"`, self-canonical, hreflang both ways, localized JSON-LD,
root-absolute assets, AR↔EN links, and a language toggle that navigates between
the two URLs (setting the `tw_lang` preference first). English pages were patched
so their «عربي» button + `ar` hreflang point to the `/ar/` URLs. `?lang=ar` on an
English page now canonicalises to the real `/ar/` URL (via `main.js`), so no Vercel
redirect was needed. `index.html` and `contact.html` keep both languages (their
inline JS manipulates the language spans); all other AR pages are English-stripped.
**To regenerate after editing an English page: `npm run build:ar`.**
**Remaining:** Phase 2 (about, portfolio, shop, faq, quote, blog + 5 posts, legal),
then submit `/ar/` in Search Console after deploy + native review of Arabic head copy.

## Why this is needed
The site already contains full Arabic body text inline (shown via `dir="rtl"`),
and we added `hreflang` + `?lang=ar`. But on every page the **`<title>`, meta
description and `<html lang>` are still English** — the strongest ranking
signals. Arabic queries need Arabic titles/descriptions, which only real Arabic
pages can provide. `?lang=ar` also depends on Google's JS rendering and is one
URL. Real `/ar/` pages fix all of this.

## URL structure
| English | Arabic |
|---|---|
| `https://thewalls.ae/` | `https://thewalls.ae/ar/` |
| `https://thewalls.ae/pages/joinery-dubai.html` | `https://thewalls.ae/ar/pages/joinery-dubai.html` |

- Arabic tree **mirrors** the English tree under `/ar/` (so relative links inside
  `/ar/` resolve to other Arabic pages automatically).
- `.html` kept to match the existing English convention (no Vercel rewrites needed).

## The generator — `scripts/build-ar.js` (re-runnable Node script)
For each English source page in its known set, it writes the `/ar/` counterpart by transforming:

1. **Lang/dir:** `<html lang="en" dir="ltr">` → `<html lang="ar" dir="rtl">`.
2. **Head → Arabic** (from a per-page translations map authored in the script):
   - `<title>`, `meta description`, `meta keywords` → Arabic.
   - `canonical` → the Arabic URL (self-canonical).
   - `hreflang`: `en` → EN URL, `ar` → AR URL, `x-default` → EN URL.
   - `og:title` / `og:description` / `og:url` → Arabic + AR URL; add `og:locale=ar_AE`.
3. **JSON-LD:** localize `name`/`description`, BreadcrumbList names, FAQ Q&As
   (reuse the Arabic text already in the page's FAQ accordion), set `inLanguage:"ar"`,
   and point `@id`/`url` to the AR URL.
4. **Asset paths → root-absolute** (`/assets/...`, favicons, manifest) so depth
   under `/ar/` never matters.
5. **Inter-page links:** rewrite to Arabic equivalents that exist in the AR set
   (root-absolute `/ar/...`); links to not-yet-generated pages fall back to the
   English URL so nothing 404s mid-rollout.
6. **Language toggle becomes navigation:** on AR pages the “EN” button links to the
   English URL (AR marked active); the script also patches each English page's
   “عربي” button to link to its Arabic counterpart. (Generic convention:
   AR = `/ar` + EN path; EN = AR path minus `/ar`.)
7. **Clean Arabic document (recommended):** strip `.en-only` nodes from AR output
   so the Arabic page is purely Arabic (smaller, stronger signal) — with layout QA.

Re-run `node scripts/build-ar.js` after any English content edit to regenerate.

## Sitemap & robots
- Add every Arabic URL to `sitemap.xml` with `xhtml:link` hreflang alternates
  pairing EN↔AR (and `x-default`).
- Confirm `robots.txt` doesn't block `/ar/`.
- Once `/ar/` exists, point the English pages' `ar` hreflang at the `/ar/` URL
  (not `?lang=ar`) and add a Vercel redirect `?lang=ar` → `/ar/...` to retire the
  stopgap and avoid duplicate signals.

## Rollout
**Phase 1 (now) — top ~13 pages:** home, the 6 service pages, 4 case studies,
`services.html`, `contact.html`. Build generator + these pages, update sitemap,
patch EN toggles, deploy, then submit `/ar/` in Google Search Console and watch
indexing/coverage.

**Phase 2 — the rest:** about, portfolio, shop, faq, quote, blog hub + 5 blog
posts, privacy, terms.

**Phase 3 — optimise:** use Search Console Arabic query data to refine Arabic
titles/descriptions and add Arabic-specific copy where it helps.

## Arabic keyword targets (draft — native review recommended)
- Home: ذا وولز · تشطيب وديكور داخلي في دبي
- Joinery: نجارة مخصصة دبي · أعمال خشبية دبي · خزائn / غرف ملابس دبي
- Solid surfaces: أسطح صلبة دبي · كوريان دبي · ديكتون دبي · أسطح مطابخ
- Aluminum: أعمال ألمنيوم دبي · نوافذ وأبواب ألمنيوم · واجهات زجاجية
- Interior design: تصميم داخلي دبي · ديكور داخلي · مهندس ديكور دبي
- Fit-out: تشطيب دبي · شركة تشطيبات دبي · تشطيب مكاتب / فلل
- Architecture & supervision: إشراف هندسي دبي · رسومات تنفيذية · إدارة مشاريع

## Risks / notes
- **Translation quality:** I'll draft Arabic titles/meta; a native speaker should
  review before/after launch (the body Arabic already exists on the site).
- **Maintenance:** the generator keeps EN as the single source of truth; AR is
  always regenerated, so the two can't drift as long as we re-run it.
- **Indexing latency:** Arabic pages take days–weeks to index; Search Console
  submission + internal links (the toggle + hreflang) speed it up.

## Definition of done (Phase 1)
`/ar/` versions of the 13 pages live with Arabic head metadata, self-canonical +
hreflang both ways, working EN⇄AR toggle, sitemap updated, `?lang=ar` redirecting
to `/ar/`, and the section submitted to Search Console.
