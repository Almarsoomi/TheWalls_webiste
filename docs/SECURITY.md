# Security Review & Hardening Guide — The Walls Website

> Audience: developer/owner. Scope: this repo (static HTML/CSS/JS on GitHub Pages)
> + Supabase backend (Edge Functions, Postgres with RLS, Auth magic links) +
> Cloudflare Turnstile. Last reviewed: 2026-06-18.

This document explains **how to check** the security of the site and the
**concrete fixes** to make the database and APIs safe. Items are tagged by
severity: 🔴 High · 🟠 Medium · 🟢 Low/Hardening.

---

## 0. How to run a security check (repeatable process)

Do this before every release and after any backend change.

1. **Dependency / secret scan**
   - `git log -p | grep -iE "service_role|secret|password|apikey"` — confirm no
     secrets were ever committed. The **service role key** and **ADMIN_PASSWORD**
     must NEVER appear in the repo or client JS — only in Supabase env vars.
   - GitHub → Settings → Secret scanning / Push protection: turn **on**.
2. **Supabase Advisors** (built-in): Dashboard → Advisors → Security. Resolve
   every "RLS disabled", "exposed key", and "function search_path" warning.
3. **RLS smoke test** (see §3) — prove that one client cannot read another
   client's project.
4. **API abuse test** (see §2) — try calling each Edge Function directly with
   `curl` (no token, wrong token, other-origin) and confirm it rejects.
5. **Headers / TLS check**: run the production URL through
   `https://securityheaders.com` and `https://www.ssllabs.com/ssltest/`.
6. **Front-end audit**: Chrome DevTools → Lighthouse (Best Practices) + console
   for mixed-content or CSP errors.

---

## 1. Authentication & Access Control

### 🔴 1.1 Admin login can be brute-forced at the API level
`pages/admin.html` stores the password in `localStorage` and sends it as the
`x-admin-key` header. `admin-projects` only verifies Turnstile **when a token is
present**:
```ts
if (turnstileToken && !(await verifyTurnstile(turnstileToken))) return 403
if (!adminKey || adminKey !== ADMIN_PASSWORD) return unauthorized()
```
An attacker who calls the endpoint directly **without** a token skips the bot
check entirely and can guess the password unlimited times. The Turnstile widget
only protects the browser UI, not the API.

**Fixes (pick one, in order of preference):**
- **Best:** migrate admin to **Supabase Auth** (a real user account + role claim)
  instead of a shared password. Gate data with RLS / `auth.role()`.
- **Good:** add **rate limiting / lockout** keyed by IP in the Edge Function
  (e.g. store attempt counts in a `login_attempts` table or Upstash Redis; block
  after N failures for M minutes).
- **Minimum:** require a **valid Turnstile token on every credential check**
  (remove the `turnstileToken &&` short-circuit so a missing token = reject),
  and use a long, high-entropy password (32+ random chars).

### 🟠 1.2 Admin password lives in `localStorage`
Any XSS on an admin page would exfiltrate it, and it persists indefinitely.
- Prefer a short-lived **session token** returned on login over storing the raw
  password. Clear it on logout and add an idle timeout.
- At minimum, document that admin pages must never embed third-party scripts.

### 🟠 1.3 Magic-link redirect allow-list (open-redirect / token theft)
`portal.html` passes `emailRedirectTo: base + 'portal-project.html'`. If the
allow-list is loose, an attacker could redirect the auth token elsewhere.
- Supabase → Auth → URL Configuration → **Redirect URLs**: list ONLY the exact
  production URLs (e.g. `https://thewalls.ae/pages/portal-project.html`). Remove
  wildcards and `localhost` before go-live.

### 🟢 1.4 Magic-link UX is correct, keep it
Email existence is checked server-side via `check-client` before sending a link —
good. Keep `shouldCreateUser` behavior in mind: a link is still only useful to
someone who controls the inbox.

---

## 2. API / Edge Function security

### 🔴 2.1 CORS is wide open (`Access-Control-Allow-Origin: '*'`)
Every function (`save-contact`, `save-booking`, `save-estimate`, `check-client`,
`admin-projects`, `admin-content`) allows **any** website to call it. That lets
third-party sites drive your APIs (spam inserts, admin-login guessing, email
enumeration).

**Fix:** validate the `Origin` header and echo back only allowed origins:
```ts
const ALLOWED = new Set([
  'https://thewalls.ae',
  'https://www.thewalls.ae',
  'https://almarsoomi.github.io',
])
const origin = req.headers.get('Origin') ?? ''
const cors = {
  'Access-Control-Allow-Origin': ALLOWED.has(origin) ? origin : 'https://thewalls.ae',
  'Vary': 'Origin',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-key, x-turnstile-token',
}
```
(CORS is a browser control, not a hard server boundary — still pair it with the
auth/rate-limit fixes above.)

### 🟠 2.2 Email enumeration via `check-client`
`check-client` returns `{ exists: true|false }` for any email. This is inherent
to the requested UX ("email not registered"), but it lets someone probe which
emails are clients.
- Mitigate: add Turnstile verification + IP rate limiting to `check-client`, and
  keep the response to a bare boolean (no names/IDs — already the case).
- Accept the residual risk knowingly, or switch to a neutral message ("If this
  email is registered, you'll receive a link") and drop the explicit popup.

### 🟠 2.3 Input validation & abuse on public forms
`save-contact` / `save-booking` / `save-estimate` insert directly from the body.
- Enforce server-side: max lengths, email/phone format, required fields, and
  reject oversized payloads. Turnstile already blocks most bots — keep it.
- Add a per-IP rate limit to prevent DB flooding.

### 🟢 2.4 Keep `verify_jwt` decisions intentional
All functions run with `verify_jwt: false` because they use custom auth
(Turnstile / `x-admin-key`) or are public. That's fine — just document it so it
isn't "fixed" by mistake. The **service role key stays server-side only**.

---

## 3. Database & RLS (Postgres)

### 🟢 3.1 RLS is enabled and scoped — good baseline
`001_portal_tables.sql` enables RLS on all portal tables and restricts clients to
rows where `client_email = auth.jwt() ->> 'email'`. Verify it actually holds:

```sql
-- As an authenticated client (anon key + a logged-in session), this must return
-- ONLY that client's rows:
select id, client_email from projects;
-- Attempt to read someone else's project by id — must return 0 rows.
```

### 🟠 3.2 Confirm no table is readable by `anon`
The public anon key is in the client. Make sure **only** intended tables are
reachable and only through RLS. The contact/booking/estimate tables are written
via the **service role** in Edge Functions — confirm those tables have **no anon
SELECT policy** (they should be invisible to the public key).

### 🟠 3.3 Storage buckets (project photos & documents)
The portal serves `project_photos` / `project_documents`. Verify:
- Buckets are **private**, served via short-lived **signed URLs** (not public).
- Storage RLS ties each object to the owning client, mirroring the table RLS.
- Admin uploads go through the service-role function, not the client.

### 🟢 3.4 Function `search_path`
For any Postgres functions/triggers, set `search_path = ''` (or schema-qualify)
to avoid search-path hijacking. Check Supabase Advisors for this warning.

### 🟢 3.5 Backups
Confirm Point-in-Time Recovery / daily backups are on for the project, and test
a restore once before launch.

---

## 4. Front-end / hosting hardening

### 🟠 4.1 Security headers + WAF (GitHub Pages can't set these)
GitHub Pages cannot send CSP/HSTS/etc. Put **Cloudflare** in front of the custom
domain to add:
- `Content-Security-Policy` (allow self + the specific CDNs you use:
  `challenges.cloudflare.com`, `cdn.jsdelivr.net`, `fonts.googleapis.com`,
  `fonts.gstatic.com`, `*.supabase.co`, `imagedelivery.net`, Clarity).
- `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`.
- Cloudflare **WAF + rate limiting + Bot Fight Mode** in front of the Supabase
  function calls' origin (or rate-limit at the function level — see §2).

### 🟢 4.2 Pin third-party scripts
`portal.html` loads `@supabase/supabase-js@2` from jsDelivr (floating major).
Pin to an exact version and ideally add **Subresource Integrity (SRI)** hashes
so a compromised CDN can't inject code.

### 🟢 4.3 Keep admin/portal out of search
`admin.html` and `portal.html` are `noindex,nofollow` — good. The footer "©"
admin link is `rel="nofollow"`. Keep it that way and exclude them in `robots.txt`
/ `sitemap.xml`.

---

## 5. Priority checklist (do these first)

- [ ] 🔴 Add rate-limiting/lockout (or Supabase Auth) to admin login — §1.1
- [ ] 🔴 Lock down CORS to known origins on all functions — §2.1
- [ ] 🟠 Set strict Supabase Auth redirect allow-list — §1.3
- [ ] 🟠 Verify storage buckets are private + signed URLs — §3.3
- [ ] 🟠 Add Turnstile + rate limit to `check-client` and public forms — §2.2/2.3
- [ ] 🟠 Put Cloudflare in front for CSP/HSTS/WAF — §4.1
- [ ] 🟢 Pin + SRI the supabase-js CDN script — §4.2
- [ ] 🟢 Resolve all Supabase Security Advisors — §0.2
- [ ] 🟢 Rotate `ADMIN_PASSWORD` to 32+ random chars; confirm no secrets in git
