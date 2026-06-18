# Pre-Deploy Checklist & Recommendations — The Walls Website

> Run top-to-bottom before pointing the public domain at the site. Check each box.
> Last updated: 2026-06-18. Stack: GitHub Pages (static) + Supabase + Cloudflare
> Turnstile, bilingual EN/AR.

---

## 1. Content & placeholders (don't ship demo data)
- [ ] Replace the before/after demo images — `index.html` still has TODOs:
      `assets/images/before.png` and `after.jpg` are placeholders.
- [ ] Replace any Lorem/placeholder copy in case studies, services, blog.
- [ ] Verify all stats are real (250+ projects, 8+ years, 100% custom).
- [ ] Confirm contact details everywhere: phone `+971 54 499 6788`,
      `info@thewalls.ae`, address, WhatsApp number, social links.
- [ ] Proofread EN **and** AR copy on every page (native-speaker review for AR).

## 2. Configuration & environment
- [ ] Supabase env vars set in **production**: `SUPABASE_URL`,
      `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `TURNSTILE_SECRET_KEY`.
- [ ] **Turnstile site key** in the HTML matches the **secret key** in Supabase,
      and the Turnstile widget is configured for the **production domain**
      (`thewalls.ae`) in the Cloudflare dashboard — otherwise it fails in prod.
- [ ] Supabase Auth → **Redirect URLs** = exact production portal URLs only
      (remove localhost/wildcards).
- [ ] All Edge Functions deployed at their latest version:
      `check-client`, `admin-projects`, `admin-content`, `save-contact`,
      `save-booking`, `save-estimate`, `notify-email`.
- [ ] **Rotate** `ADMIN_PASSWORD` to a fresh 32+ char random value before launch.
- [ ] Set the **email sender** (Supabase Auth SMTP) to a branded address with
      SPF/DKIM/DMARC so magic links don't land in spam.

## 3. Domain, DNS & HTTPS
- [ ] Custom domain configured (GitHub Pages `CNAME` + DNS), HTTPS enforced.
- [ ] Recommend routing the domain through **Cloudflare** for TLS, caching, WAF
      and security headers (see SECURITY.md §4.1).
- [ ] `www` ↔ apex redirect works; no mixed-content warnings.
- [ ] Update `sitemap.xml` + `robots.txt` to the final domain; resubmit sitemap
      in Google Search Console.

## 4. Security gate (summary — full detail in SECURITY.md)
- [ ] CORS locked to known origins on every function (not `*`).
- [ ] Admin login has rate-limiting/lockout (or moved to Supabase Auth).
- [ ] RLS verified: a logged-in client can read ONLY their own project/photos/docs.
- [ ] Storage buckets private + signed URLs.
- [ ] No secrets in git history; GitHub secret-scanning + push protection on.
- [ ] All **Supabase Security Advisors** resolved.

## 5. Functionality test pass (on the production domain, real devices)
- [ ] Contact form → submits, Turnstile passes, row appears in DB, team notified.
- [ ] Booking form → same end-to-end.
- [ ] Estimator → produces a result and saves.
- [ ] **Portal happy path:** registered email → receives magic link → lands in
      `portal-project.html` → sees the correct project, milestones, photos, docs.
- [ ] **Portal negative path:** unregistered email → no link sent → "Email not
      registered" popup with working WhatsApp button.
- [ ] **Admin:** Turnstile + correct password → dashboard; wrong password → error;
      forged/empty Turnstile via API → 403.
- [ ] Theme toggle (dark/light) persists; language toggle (EN/AR) persists.
- [ ] Mobile hamburger: all links incl. "Client Login" work; before/after slider
      nudge animation runs and stops on touch.
- [ ] Test on iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari/Edge.

## 6. SEO & social
- [ ] Unique `<title>` + meta description per page.
- [ ] Open Graph + Twitter Card tags with a branded share image per key page.
- [ ] `hreflang` for EN/AR; canonical URLs set.
- [ ] Favicons / app icons present (already referenced — confirm files exist).
- [ ] Structured data (LocalBusiness, FAQ, Article) validates in Google's Rich
      Results Test.

## 7. Performance
- [ ] Lighthouse on mobile ≥ 90 Performance/SEO/Best-Practices/Accessibility.
- [ ] Images optimized (WebP/AVIF, responsive `srcset`, lazy-load offscreen).
- [ ] Fonts: preconnect (done) + `font-display: swap`; subset if possible.
- [ ] Pin CDN script versions (supabase-js) + add SRI.
- [ ] No blocking console errors anywhere.

## 8. Analytics, monitoring & legal
- [ ] Microsoft Clarity (and Google Analytics if used) firing on production only.
- [ ] Cookie consent gates analytics until accepted (verify Clarity respects it).
- [ ] Privacy Policy + Terms reviewed for the real entity name and UAE law;
      contact email correct.
- [ ] Error monitoring for Edge Functions (Supabase logs / alerting) so failed
      form posts and login errors are visible.
- [ ] DB backups / PITR enabled and a restore tested once.

## 9. Resilience & housekeeping
- [ ] Custom branded **404 page**.
- [ ] Broken-link crawl (e.g. `npx linkinator https://thewalls.ae`).
- [ ] Graceful failure messaging when Supabase is unreachable (forms show a clear
      retry message — already partly implemented).
- [ ] `.gitignore` excludes `node_modules`, local env files, build junk.
- [ ] Tag a release (e.g. `v1.0.0`) so you can roll back.

---

## Launch-day quick run (15 min)
1. Submit one real contact + one booking → confirm DB rows + team email.
2. Send yourself a portal magic link with a **registered** test project → log in.
3. Try an **unregistered** email → confirm popup, no email sent.
4. Log into admin with Turnstile → load dashboard → log out.
5. Open the homepage on a phone in **Arabic** → scan every section for layout.
6. Run Lighthouse once → screenshot the scores for your baseline.

> Keep SECURITY.md and IMPROVEMENTS.md alongside this file. Re-run sections 4 & 5
> after any backend change.
