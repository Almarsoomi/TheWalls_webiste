# Refactor Log — JS/CSS Audit Implementation

Date: 2026-06-25. Scope implemented: **CRITICAL + HIGH** items from the audit.
All changes are local commits (not yet pushed at time of writing).

---

## Summary

| # | Change | Impact | Commit |
|---|--------|--------|--------|
| 1 | Extract shared case-study CSS | −522 lines duplicated inline CSS → 1 shared file | `1f6a6f8` |
| 2 | Split home-only JS into `home.js` | `main.js` 781→654 lines; fixes a search bug | `9cc2477` |
| 3 | rAF-throttle scroll handlers | smoother scroll, less layout thrash | `46acd79` |
| 4 | De-duplicate `setLang` work | nav-link/localStorage applied once, not twice | `44e8fb8` |

## New files
- `assets/css/case-study.css` — shared styles for all 4 case-study pages (loaded after `style.css`).
- `assets/js/home.js` — home-page-only modules (before/after slider, project search, pulse-glow, scroll-divider).

## Modified files
- `pages/case-study-lento.html` — inline `<style>` removed; links `case-study.css`.
- `pages/case-study-villa.html` — inline `<style>` reduced to a 1-rule hero override; links `case-study.css`.
- `pages/case-study-clinic.html` / `case-study-office.html` — inline `<style>` reduced to the placeholder-gallery variant overrides; links `case-study.css`.
- `assets/js/main.js` — removed 4 home-only modules; added `_twRafThrottle` helper; trimmed `setLang` fallback.
- `index.html` — removed broken inline `wireSearch()` block; now loads `main.js` then `home.js`.

## Path / loading changes to know
- Case-study pages: add `<link rel="stylesheet" href="../assets/css/case-study.css"/>` **after** the `style.css` link and **before** any page-specific inline `<style>` (cascade order matters).
- `index.html`: scripts now load in order `main.js` → `home.js`. Any new home-only behavior goes in `home.js`; anything shared by 2+ pages goes in `main.js`.

## Behavior change (intentional bug fix)
- The home hero search previously called `wireSearch()` in an inline `<script>` **before** `main.js` loaded → `ReferenceError`, search not wired. `home.js` now self-wires on `DOMContentLoaded`, so search works.

## Not done (deliberately)
- **Item 5 (config.js):** net-negative for a static site (2 values, would touch ~30 files).
- **Item 6 (`.bg-cover`):** only 7 instances of the pattern — not worth a utility class.
- **Item 7 (hex→tokens):** the literal hex live in `html[data-theme="light"]` overrides and are **intentional** (light theme redefines the tokens); replacing them would break light-mode colors.
- **Item 8 (shared CORS helper):** would require redeploying all 13 edge functions.
- **Item 9 (purge unused CSS):** needs PurgeCSS + a safelist for JS-added classes (`.vis`, `.sc`, `.pulse-active`, …).

## Verification
```bash
node --check assets/js/main.js
node --check assets/js/home.js
# visual: open index.html (search + slider + smooth scroll),
# and the 4 case-study pages (galleries/lightbox unchanged)
```

## Rollback
Each item is an isolated commit — revert individually:
```bash
git revert 44e8fb8   # setLang dedup
git revert 46acd79   # scroll throttle
git revert 9cc2477   # home.js split
git revert 1f6a6f8   # case-study CSS extract
```
Or reset to before the refactor (destructive): `git reset --hard 134d4b7`.
