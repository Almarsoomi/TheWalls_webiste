# The Walls — Website

Premium interior fit-out and design company based in Dubai, UAE.
Static HTML/CSS/JS · Bilingual EN/AR · Luxury dark aesthetic · GitHub Pages ready.

---

## File Structure

```
/
├── index.html                      # Homepage — entry point
├── sitemap.xml
├── robots.txt
├── .nojekyll                       # Disables Jekyll on GitHub Pages
│
├── pages/                          # All inner pages
│   ├── services.html               # 6-service tab layout
│   ├── portfolio.html              # Project grid with filters & search
│   ├── about.html                  # Company story, mission/vision, team
│   ├── contact.html                # Map, contact form, FAQ
│   ├── booking.html                # Consultation booking form
│   ├── blog.html                   # Journal listing page
│   ├── case-study-villa.html       # Palm Jumeirah Villa case study
│   ├── case-study-office.html      # DIFC Corporate Office case study
│   ├── case-study-clinic.html      # Dubai Hills Medical Clinic case study
│   ├── privacy-policy.html
│   └── terms-of-use.html
│
├── blog/                           # Blog article pages
│   ├── villa-fitout-timeline-dubai.html
│   ├── office-fitout-difc-dmcc-checklist.html
│   ├── solid-surfaces-corian-vs-quartz.html
│   ├── joinery-vs-offshelf-furniture.html
│   └── hiring-fitout-contractor-uae.html
│
└── assets/
    ├── css/
    │   └── style.css               # Single stylesheet for all pages
    ├── js/
    │   └── main.js                 # Single JavaScript file for all pages
    └── images/
        ├── logo.svg
        ├── logo-dark.svg
        ├── favicon.svg
        ├── placeholder-interior.svg
        ├── before.png / after.jpg
        ├── Palm_PROJ/              # Palm Jumeirah villa photos
        ├── Office/                 # Office project photos
        └── VIC_PROJ/               # Victoria project photos

> Lento project photos are now served from Cloudflare Images
> (`imagedelivery.net/B0K744mvCN7KCJEt14pPFw/…`), not the local folder.
```

---

## Local Preview

```bash
npx serve . -l 3000
# Opens at http://localhost:3000
```

---

## Deploy to GitHub Pages

1. Push to `main` branch — GitHub Pages serves from root automatically.
2. The `.nojekyll` file is already present to bypass Jekyll processing.
3. Custom domain: add a `CNAME` file at the root containing `thewalls.ae`.

---

## Key Features

- **Bilingual EN/AR** — every page toggles between English and Arabic with full RTL layout. Preference saved in `localStorage`.
- **Dark / Light theme** — toggled via the nav button, saved in `localStorage`.
- **WhatsApp CTAs** — phone `971544996788` appears throughout all pages as pre-filled message links.
- **Booking form** — `pages/booking.html` has per-field validation, UAE phone format check, and weekend detection.
- **Page-load progress bar** — champagne-coloured top bar on every page.
- **Custom cursor** — animated dot + ring, hidden on touch devices.
- **Scroll-reveal animations** — `.reveal` elements animate in as they enter the viewport.
- **Mobile hamburger nav** — full-screen overlay, no layout shift.
- **Google Maps embed** — in `index.html` and `pages/contact.html`, pinned to The Walls DXB (25.1226°N, 55.2210°E).
- **3 case study pages** — villa → office → clinic, looped via "Next Project" links.

---

## Updating the WhatsApp Number

The number `971544996788` appears in all pages. To change it:

```bash
# Find every occurrence
grep -r "971544996788" --include="*.html" .
```

Then bulk-replace in your editor.

---

## Updating the Google Maps Pin

1. Go to [maps.google.com](https://maps.google.com), search the new address.
2. Click **Share → Embed a map → Copy HTML**.
3. Replace the `<iframe src="...">` in:
   - `index.html` — map strip above the footer
   - `pages/contact.html` — map section

---

## Replacing the Logo

Both `assets/images/logo.svg` (dark mode) and `assets/images/logo-dark.svg` (light mode) are placeholders.
Replace both files with the final client artwork at the same filenames.

---

## Adding a New Case Study

1. Copy `pages/case-study-office.html` as the template.
2. Update `<title>`, `<meta>`, and `<link rel="canonical">`.
3. Edit the hero crumb, title, meta-row (location, type, area, duration, scope).
4. Update overview text, stats grid, gallery labels, challenge/approach blocks, materials grid.
5. Update the result quote and the "Next Project" link to keep the rotation loop.
6. Add the new page to `sitemap.xml`.
7. Add a portfolio card in `pages/portfolio.html` with `data-link="./new-case-study.html"`.

---

## Adding a New Blog Article

1. Copy any existing file from `blog/` as the template.
2. Update `<title>`, `<meta>`, breadcrumb, tag, `<h1>`, and article body.
3. Update the canonical URL.
4. Add a card in `pages/blog.html` linking to `../blog/your-new-article.html`.
5. Add the URL to `sitemap.xml`.
