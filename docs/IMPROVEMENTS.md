# Improvement Ideas — Features, Pages & Functionality

> What to add next to make The Walls site convert better and stand out vs. other
> Dubai/UAE interior fit-out & design studios. Each item has **Why it matters**,
> rough **Effort** (S/M/L), and **Priority**. Last updated: 2026-06-18.

## What you already have (so we don't duplicate)
Homepage hero + cycling words, before/after slider, services tabs, portfolio with
filters/search, case studies, blog/journal, contact + booking forms (Turnstile +
Supabase), 360° tours section, testimonials, estimator, **client project portal**
(magic-link), **admin dashboard**, bilingual EN/AR, dark/light theme, cookie
consent, privacy/terms, WhatsApp float, Microsoft Clarity analytics.

That's already ahead of most local competitors. The ideas below are the gaps.

---

## A. Lead generation & conversion (highest ROI)

1. **Multi-step "Get a Quote" wizard with file upload** — *Why:* serious fit-out
   leads have floor plans/inspiration images; capturing them qualifies the lead
   and impresses. Add upload (to a private Supabase bucket) + budget range + space
   type. *Effort: M · Priority: High.*
2. **Downloadable brochure / lookbook PDF (gated by email)** — *Why:* builds the
   mailing list and gives a soft CTA for visitors not ready to call. *Effort: S ·
   Priority: High.*
3. **Real appointment scheduling** — upgrade `booking.html` from a form to actual
   calendar slots (Cal.com/Calendly embed or a `bookings` table + availability).
   Confirmation + reminder email. *Why:* removes back-and-forth. *Effort: M ·
   Priority: High.*
4. **Transparent pricing / "starting from" tiers per service** — *Why:* the #1
   question in fit-out is cost; even ranges reduce drop-off and unqualified
   inquiries. *Effort: S · Priority: High.*
5. **Exit-intent / scroll-triggered consultation CTA** — *Why:* recover leaving
   visitors. Keep it tasteful for a luxury brand. *Effort: S · Priority: Med.*

## B. Trust & credibility

6. **Google Reviews integration** (live rating + count) next to the static
   testimonials. *Why:* third-party proof beats self-quoted praise. *Effort: S.*
7. **Awards, certifications & memberships page** (Dubai Municipality approvals,
   DCD, ISO, free-zone vendor registrations). *Why:* fit-out clients vet
   compliance heavily. *Effort: S · Priority: High for UAE market.*
8. **"Our Process" interactive timeline** with real durations + what the client
   does at each stage. *Why:* sets expectations, reduces fear. *Effort: M.*
9. **Detailed case studies with metrics** (timeline, sqm, budget band, before/
   after, client quote, video walkthrough). Expand the existing ones into a
   repeatable template. *Effort: M · Priority: High.*
10. **Press / media kit page** (logos, coverage, downloadable assets). *Effort: S.*

## C. Product & service depth

11. **Material & finish explorer** (joinery veneers, solid-surface colors,
    aluminum finishes) with a **"request a sample"** action. *Why:* signature to
    your craft niche; nothing local does this well. *Effort: M · Priority: High.*
12. **Per-service landing pages** (Joinery, Solid Surfaces, Aluminum, Furniture,
    Turnkey Fit-out, MEP) each SEO-optimized for "<service> Dubai". *Why:* huge
    organic search opportunity. *Effort: M · Priority: High for SEO.*
13. **Room/space cost calculator** (kitchen, wardrobe, office) — extends the
    estimator into specific verticals. *Effort: M.*
14. **AR / 3D preview or configurator** for a wardrobe or TV unit. *Why:* wow
    factor; few competitors have it. *Effort: L · Priority: Low (later).*

## D. Client portal & post-sale (extend what you built)

15. **In-portal messaging / approvals** — client approves milestones, signs off
    on shop drawings, leaves comments. *Why:* turns the portal from read-only into
    a workflow tool. *Effort: M.*
16. **Document e-signature & invoices/payments** (quotes, contracts, payment
    schedule, Stripe/Telr/PayTabs for UAE). *Effort: L · Priority: Med.*
17. **Warranty & aftercare / snagging request** section in the portal. *Why:*
    fit-out has a defects-liability period; owning this is a differentiator.
    *Effort: M.*
18. **Automated email notifications** (milestone done, new photo, message) — you
    already have a `notify-email` function; extend it to clients. *Effort: S.*

## E. Content, SEO & growth

19. **Structured data (schema.org)**: `LocalBusiness`/`HomeAndConstructionBusiness`,
    `FAQPage`, `Article` for blog, `BreadcrumbList`. *Why:* rich results + local
    SEO. *Effort: S · Priority: High.*
20. **`hreflang` tags for EN/AR** + per-language URLs. *Why:* correct bilingual
    indexing. *Effort: S · Priority: High.*
21. **Newsletter + email automation** (welcome, nurture, seasonal offers).
    *Effort: S.*
22. **Careers / "Join us" page** with open roles + application form. *Why:*
    growing studios need talent and it signals stability. *Effort: S.*
23. **Sustainability / responsible-sourcing page** — increasingly expected by
    corporate & hospitality clients. *Effort: S.*
24. **Trade / architect partner program** page + portal. *Why:* B2B referral
    channel. *Effort: M.*
25. **FAQ page** (cost, timelines, permits, warranty) — feeds FAQ schema and
    deflects repetitive inquiries. *Effort: S · Priority: High.*

## F. UX, performance & accessibility

26. **Custom 404 page** matching the brand. *Effort: S.*
27. **Image optimization**: serve responsive `srcset`/AVIF/WebP, lazy-load below
    the fold. *Why:* hero/portfolio are image-heavy; speed = SEO + conversion.
    *Effort: M · Priority: High.*
28. **Accessibility pass** (WCAG AA): focus states, alt text, color contrast in
    light theme, keyboard nav for the slider/menus, `prefers-reduced-motion`
    (already partly done). *Effort: M.*
29. **Full Arabic QA** across every page (you just fixed the hero) — audit all
    sections for RTL spacing/format parity. *Effort: M.*

---

## Suggested first sprint (impact ÷ effort)
1. Per-service SEO landing pages (#12) + schema/hreflang (#19, #20)
2. Pricing tiers (#4) + FAQ page (#25)
3. Brochure capture (#2) + Google Reviews (#6) + Awards page (#7)
4. Image optimization (#27) + custom 404 (#26)
5. Real scheduling (#3)

## Competitor inspiration (for benchmarking, not copying)
Look at premium fit-out/joinery and design studios for patterns to beat:
Depa, ALEC Fitout, Summertown Interiors, Bond Interiors, Sneha Divias Atelier,
XBD Collective, Roar (Pallavi Dean), Zynka, Brewer Smith Brewer. Note how they
present **process transparency, certifications, sector case studies, and
sustainability** — areas where you can leapfrog with the portal + craft niche.
