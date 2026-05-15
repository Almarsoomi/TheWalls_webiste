# THE WALLS — CLAUDE CODE BRIEFING
# Paste this entire file into Claude Code when you start a session
# Run: claude in your project folder

---

## PROJECT OVERVIEW

You are continuing the build of **thewalls.ae** — a Dubai-based fit-out, joinery, and interior design company.

**Company details (confirmed, use everywhere):**
- Name: The Walls
- Website: www.thewalls.ae
- WhatsApp: +971 54 499 6788 (formatted as wa.me/971544996788)
- Email: Info@thewalls.ae
- Phone: +971 54 499 6788
- Instagram: @the_walls_dubai
- Facebook: @thewallsdubai
- Location: Dubai, United Arab Emirates
- Google Maps embed: use this coordinates — Dubai, UAE (you will need to ask the client for the exact showroom address to add a precise pin; for now embed a Google Maps iframe centered on Dubai with a marker labeled "The Walls Studio")
- Tagline: "Design Build — Turn Key Solution — Custom Manufacturing"
- Founded by architects and designers
- Services: Joinery, Solid Surfaces, Aluminum Works, Interior Design, Complete Fit-Out, Architecture & Supervision

**Real Google reviews found (use in testimonials section):**
1. "Had a great experience with Eng. Mustafa from The Walls in one of the clinics in Dubai Hills Park." — Google Review
2. "Incredible woodwork from this wonderful company. My table is beautifully engraved and the wood feels utterly alive. Truly great." — Google Review
3. "The Walls Company is highly skilled in aluminum and glass work, demonstrating remarkable expertise and craftsmanship. Their attention to detail and precision are evident in every project they undertake." — Google Review
4. "I had an amazing experience with The Walls. I highly recommend them. The quality of their aluminum products is exceptional." — Google Review
5. "Is experienced in glazing and aluminum fabrication and in construction of residential, commercial buildings, villas and other facilities." — Google Review

---

## FILES ALREADY BUILT

You will find these HTML files in the project folder. READ ALL OF THEM first before making any changes:

| File | Description |
|------|-------------|
| `index.html` | Main homepage (English) — hero, marquee, about, services grid, portfolio with AI search, before/after slider, cost estimator, testimonials, process, CTA, footer |
| `thewalls-bilingual.html` | Full bilingual homepage — EN↔AR toggle, full RTL Arabic layout, Noto Naskh Arabic font, all sections translated |
| `case-study.html` | Project case study page — Palm Jumeirah Villa — uses all 5 real photos, lightbox gallery, materials spec, challenge/approach blocks |
| `booking.html` | Consultation booking form — split layout, project type chips, budget slider, date/time picker, WhatsApp auto-send on submit |
| `services.html` | All 6 service subpages — tab navigation, each with hero image, copy, items grid, mini gallery, process steps |

**Design system (apply consistently to ALL pages):**
```css
--obsidian: #0c0c0b
--obsidian-2: #141413
--obsidian-3: #1c1c1a
--obsidian-4: #252522
--champagne: #c9a96e
--champagne-light: #e8d5aa
--champagne-muted: #8a7253
--cream: #f5f0e8
--gray-mid: #9a9a96
--serif: 'Cormorant Garamond' (display headings)
--sans: 'DM Sans' (body)
--display: 'Bebas Neue' (large numbers/stats)
--arabic: 'Noto Naskh Arabic' (all Arabic text)
```

**Real photos in /assets/images/ (5 files):**
- `villa.jpg` — Master bedroom, champagne tones, tufted headboard, pendant chandelier
- `villa1.jpg` — TV joinery wall, dark walnut slats, concrete-look panel, marble floor
- `villa2.jpg` (was vill2.jpg) — Walk-in wardrobe, ivory lacquer, Hollywood mirror, geometric carpet
- `villa3.jpg` — Home office, light timber desk, marble artwork panels, neutral tones
- `villa4.jpg` — Living room, white neo-classical panelling, dark velvet sofas, sculptural chandelier

---

## YOUR TASKS — DO ALL OF THESE

### TASK 1 — Project structure & file organisation
Create this clean folder structure:
```
thewalls/
├── index.html                  (homepage — use bilingual version as base)
├── services.html
├── booking.html
├── portfolio.html              (NEW — see Task 5)
├── case-study-villa.html       (rename from case-study.html)
├── contact.html                (NEW — see Task 6)
├── assets/
│   ├── images/
│   │   ├── villa.jpg
│   │   ├── villa1.jpg
│   │   ├── villa2.jpg
│   │   ├── villa3.jpg
│   │   ├── villa4.jpg
│   │   └── logo.svg            (NEW — see Task 2)
│   ├── css/
│   │   └── shared.css          (extract common styles)
│   └── js/
│       └── shared.js           (extract common JS: cursor, nav scroll, reveal)
├── sitemap.xml                 (NEW)
└── robots.txt                  (NEW)
```
Fix ALL asset paths across all files after reorganising.

---

### TASK 2 — Logo SVG
Create `assets/images/logo.svg` for The Walls.

**Logo design direction:**
- Wordmark style: "THE WALLS" in two lines or one line
- Use Cormorant Garamond character — refined, architectural, thin strokes
- "THE" small, light weight above or beside "WALLS" in larger weight
- A subtle geometric element: either a thin square/rectangle outline suggesting a wall/room, OR a minimal abstract W formed from two thin vertical lines with a diagonal — something an architecture firm would use
- Color: champagne gold #c9a96e on dark, or dark #0c0c0b on light (export both versions)
- Must work at nav size (180×40px) and favicon size (32×32px)
- Style: luxury, minimal, editorial — NOT generic construction company

Create:
- `logo.svg` (full wordmark, light version — cream on transparent)
- `logo-dark.svg` (full wordmark, dark version — obsidian on transparent)
- `favicon.svg` (just the geometric mark, no text, 32×32)

Replace the text "The <span>Walls</span>" in all nav elements with the actual SVG logo img tag.

---

### TASK 3 — Google Maps integration
Add a real embedded Google Maps section to:
1. `index.html` — in the footer area, replace the plain text address with an embedded map
2. `contact.html` — prominent map section (see Task 6)

**Map embed approach:**
- Use Google Maps Embed API iframe with this location: "The Walls Dubai, UAE"
- Coordinates to center on: 25.2048° N, 55.2708° E (Dubai city center — use until client provides exact address)
- Style the iframe to match the dark obsidian aesthetic:
  - Wrap in a container with champagne border
  - Add a custom overlay label "The Walls Studio — Dubai, UAE"
  - Note below the map: "Exact showroom address available on WhatsApp"
- Map iframe dimensions: full width, 400px height on desktop, 280px on mobile
- Apply a CSS filter: `grayscale(30%) contrast(1.1)` to the iframe to match the dark palette

**Important:** Also add the location schema markup in the `<head>` of index.html:
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "The Walls",
  "telephone": "+971544996788",
  "email": "Info@thewalls.ae",
  "url": "https://thewalls.ae",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Dubai",
    "addressCountry": "AE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": "25.2048",
    "longitude": "55.2708"
  },
  "openingHours": "Mo-Fr 09:00-18:00, Sa 10:00-14:00",
  "sameAs": [
    "https://www.instagram.com/the_walls_dubai/",
    "https://www.facebook.com/thewallsdubai/"
  ]
}
```

---

### TASK 4 — Real Google reviews
Replace the 3 sample testimonials in `index.html` with the 4 REAL verified Google reviews found above.

**Testimonial card format for each:**
- Google coloured dots (G-o-o-g-l-e) in card header ✓ (already exists)
- 5 stars
- Review text in italic serif
- Reviewer name (use what's available, keep anonymous for those without names e.g. "Verified Google Review")
- Project type label below name
- "View on Google" link → `https://share.google/svuYy5mTTzA5TUwda`

Also add a **Google rating strip** above the testimonials grid:
```
★★★★★  5.0  ·  Based on Google reviews  ·  [View all reviews →]
```

---

### TASK 5 — Portfolio page (NEW)
Create `portfolio.html` — a full portfolio/projects page.

**Layout:**
- Page hero: "Our <em>Work</em>" — same style as services.html page hero
- Filter bar: All · Residential · Office · Retail · Hospitality · Joinery Only
- Masonry-style or asymmetric grid of project cards
- Each card: project photo, category tag, project name, location, year
- Clicking a card → links to case study page

**Projects to list (use real photos where available, styled placeholder blocks for others):**

| # | Name | Type | Location | Year | Photo |
|---|------|------|----------|------|-------|
| 1 | Palm Jumeirah Villa | Residential | Palm Jumeirah | 2024 | villa4.jpg |
| 2 | Master Suite — Private Villa | Residential | Emirates Hills | 2024 | villa.jpg |
| 3 | Walk-in Wardrobe — Villa | Residential | Jumeirah | 2024 | villa2.jpg |
| 4 | Home Office & Study | Residential | Arabian Ranches | 2023 | villa3.jpg |
| 5 | TV Feature Wall — Villa | Residential | Al Barsha | 2023 | villa1.jpg |
| 6 | Corporate Office Fit-Out | Office | DIFC | 2024 | styled placeholder |
| 7 | Medical Clinic — Dubai Hills | Office/Medical | Dubai Hills Park | 2024 | styled placeholder |
| 8 | Retail Boutique | Retail | Mall of the Emirates | 2023 | styled placeholder |
| 9 | Oxygen Gym Fit-Out | Hospitality/Gym | Dubai | 2024 | styled placeholder |

**Styled placeholder blocks** (for projects without photos): use gradient backgrounds with geometric line overlays — same obsidian palette, champagne accent lines, italic project name centered. They should look intentional, not broken.

**AI search bar** — same as homepage smart search, at top of portfolio grid.

---

### TASK 6 — Contact page (NEW)
Create `contact.html`.

**Sections:**
1. **Hero**: "Get in <em>touch</em>" — same page-hero style
2. **Contact methods grid** (3 columns):
   - WhatsApp: +971 54 499 6788 — "Fastest response" badge — button opens wa.me/971544996788
   - Email: Info@thewalls.ae — button opens mailto
   - Instagram: @the_walls_dubai — button opens instagram.com/the_walls_dubai
3. **Map section**: Full-width embedded Google Maps (see Task 3)
4. **Office info strip**: Hours (Mon–Fri 9am–6pm, Sat 10am–2pm), Location (Dubai, UAE), Languages (English · Arabic)
5. **Quick contact form**: Name, Phone/WhatsApp, Message, Submit → fires WhatsApp with form content pre-filled
6. **FAQ accordion** (6 questions):
   - "Do you offer a free consultation?" → Yes, 30-minute free consult with our architects
   - "How long does a typical fit-out take?" → Depends on scope: joinery-only 2-4 weeks, full villa 8-16 weeks, office fit-out 6-10 weeks
   - "Do you work outside Dubai?" → Yes, across UAE and GCC on request
   - "Can you work from my existing design drawings?" → Yes, we can build from any approved drawings or work with your existing interior designer
   - "What is the minimum project size?" → No minimum — we do single custom pieces (wardrobes, TV units) up to complete fit-outs
   - "Do you provide a warranty?" → Yes, all joinery and installation work carries a 1-year workmanship warranty

---

### TASK 7 — Arabic versions of new pages
The existing `thewalls-bilingual.html` has full EN↔AR toggle on the homepage. Now apply the same bilingual toggle pattern to:

- `services.html` — translate all 6 service names, descriptions, items lists, process steps
- `booking.html` — translate all form labels, chip options, time slots, success message
- `contact.html` — translate all contact info, FAQ questions and answers, form labels

**Arabic translations to use:**

Services:
- Joinery & Carpentry → النجارة والأعمال الخشبية
- Solid Surfaces → الأسطح الصلبة
- Aluminum Works → الأعمال الألمنيوم
- Interior Design → التصميم الداخلي
- Complete Fit-Out → التشطيب الكامل
- Architecture & Supervision → الهندسة المعمارية والإشراف

Booking form:
- Book your consultation → احجز استشارتك
- First name → الاسم الأول
- Last name → اسم العائلة
- WhatsApp / Phone → واتساب / الهاتف
- Project type → نوع المشروع
- Confirm Booking Request → تأكيد طلب الحجز
- Villa/Apartment → فيلا / شقة
- Office → مكتب
- Retail/Showroom → محل / معرض

Contact FAQ (Arabic):
- هل تقدمون استشارة مجانية؟ → نعم، استشارة مجانية لمدة 30 دقيقة مع مهندسينا المعماريين
- كم يستغرق التشطيب عادةً؟ → يعتمد على النطاق: النجارة فقط 2-4 أسابيع، الفيلا الكاملة 8-16 أسبوعاً، المكتب 6-10 أسابيع
- هل تعملون خارج دبي؟ → نعم، في جميع أنحاء الإمارات ودول الخليج بناءً على الطلب
- هل يمكنكم العمل من رسوماتي الموجودة؟ → نعم، يمكننا البناء من أي رسومات معتمدة أو التنسيق مع مصممك الداخلي
- ما هو الحد الأدنى لحجم المشروع؟ → لا يوجد حد أدنى — من قطعة خشبية مفردة حتى التشطيب الكامل
- هل تقدمون ضماناً؟ → نعم، جميع أعمال النجارة والتركيب تحمل ضمان صناعة لمدة سنة واحدة

---

### TASK 8 — SEO & meta tags
Add to `<head>` of every page:

```html
<!-- Primary Meta -->
<meta name="description" content="The Walls — Dubai specialists in joinery, solid surfaces, aluminum works, and complete interior fit-out. Founded by architects. Serving UAE & GCC."/>
<meta name="keywords" content="fit out Dubai, joinery Dubai, interior design Dubai, aluminum works UAE, custom wardrobes Dubai, office fit out Dubai, villa fit out Dubai"/>
<meta name="author" content="The Walls LLC"/>
<link rel="canonical" href="https://thewalls.ae/[page-name]"/>

<!-- Open Graph -->
<meta property="og:type" content="website"/>
<meta property="og:url" content="https://thewalls.ae/"/>
<meta property="og:title" content="The Walls — Fit-Out & Interior Design, Dubai"/>
<meta property="og:description" content="Specialists in joinery, solid surfaces, aluminum works and complete fit-out. Founded by architects. Dubai, UAE."/>
<meta property="og:image" content="https://thewalls.ae/assets/images/og-image.jpg"/>
<meta property="og:locale" content="en_AE"/>
<meta property="og:locale:alternate" content="ar_AE"/>

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image"/>
<meta name="twitter:title" content="The Walls — Fit-Out & Interior Design, Dubai"/>
<meta name="twitter:description" content="Custom joinery, solid surfaces, aluminum works & complete fit-out. Dubai, UAE."/>

<!-- Hreflang for bilingual -->
<link rel="alternate" hreflang="en" href="https://thewalls.ae/"/>
<link rel="alternate" hreflang="ar" href="https://thewalls.ae/?lang=ar"/>
```

Also create `sitemap.xml`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://thewalls.ae/</loc><priority>1.0</priority></url>
  <url><loc>https://thewalls.ae/services.html</loc><priority>0.9</priority></url>
  <url><loc>https://thewalls.ae/portfolio.html</loc><priority>0.9</priority></url>
  <url><loc>https://thewalls.ae/booking.html</loc><priority>0.8</priority></url>
  <url><loc>https://thewalls.ae/contact.html</loc><priority>0.8</priority></url>
  <url><loc>https://thewalls.ae/case-study-villa.html</loc><priority>0.7</priority></url>
</urlset>
```

---

### TASK 9 — Navigation (update across ALL pages)
Every page nav must have these links and be consistent:

```
[LOGO SVG]    Services  Portfolio  About  Contact    [EN | عربي]    [Book Consultation →]
```

- Logo → index.html
- Services → services.html
- Portfolio → portfolio.html
- About → index.html#about
- Contact → contact.html
- EN/AR toggle → works on every page (saves preference to localStorage)
- Book Consultation → booking.html
- Mobile: hamburger menu that slides in from right, same links

---

### TASK 10 — WhatsApp integration (finalise everywhere)
Replace ALL placeholder WhatsApp links with the real number: **+971544996788**

Pre-filled messages per page:
- Homepage hero CTA: `"Hi, I would like to discuss a fit-out project."`
- Homepage floating button: `"Hi The Walls, I found you on your website and would like to get a quote."`
- Services page: `"Hi, I was browsing your services page and would like to discuss [service name] for my project."`
- Booking form submit: auto-generates full booking details message (already implemented)
- Case study page: `"Hi, I saw the [project name] case study and would like to discuss a similar project."`
- Contact page: `"Hi The Walls, I'd like to get in touch about a project."`

---

### TASK 11 — PENDING FEATURES (from original plan — build these now)

#### 11a — AI Project Inquiry Chatbot (upgrade existing)
The basic chatbot widget exists in index.html. Upgrade it to use the **Anthropic API** directly:

```javascript
// API endpoint: https://api.anthropic.com/v1/messages
// Model: claude-sonnet-4-20250514
// No API key needed — it's handled by the environment

const systemPrompt = `You are the virtual assistant for The Walls, a Dubai-based fit-out and interior design company. 
You help qualify leads and answer questions about:
- Services: joinery, solid surfaces, aluminum works, interior design, complete fit-out, architecture & supervision
- Project types: villas, offices, retail, restaurants, medical clinics
- Pricing: standard AED 800-1200/sqm, premium AED 1800-2500/sqm, luxury AED 3500-5000/sqm
- Timeline: joinery 2-4 weeks, full villa 8-16 weeks, office 6-10 weeks
- Location: Dubai, UAE, also serve GCC
- Contact: WhatsApp +971544996788, email Info@thewalls.ae
- Free 30-minute consultations available

Always be helpful, concise, and professional. If the user wants a quote or consultation, direct them to WhatsApp +971544996788 or the booking page. Never make up specific prices for projects without knowing the sqm and scope. Respond in the same language the user writes in (English or Arabic).`;
```

Connect the existing chatbot UI to the real API. Show a typing indicator while waiting. Handle errors gracefully (fallback to WhatsApp CTA if API fails).

#### 11b — Online Consultation Booking (upgrade existing)
The booking form in `booking.html` currently sends to WhatsApp. Keep that as the primary flow but ADD:
- Email confirmation simulation (show "Confirmation sent to [email]" on success screen)
- Form validation with inline error messages per field (not just a global error)
- Phone number format validation for UAE numbers (+971 or 05X format)
- Auto-detect if it's a weekday/weekend and grey out unavailable slots

#### 11c — Client Testimonials + Google Reviews (live pull)
In `index.html` testimonials section, add a "Load more reviews" button that:
- Links to: `https://share.google/svuYy5mTTzA5TUwda`
- Shows the 4 real reviews already in the design
- Displays overall star rating: ★★★★★ 5.0 based on Google reviews

#### 11d — Project Case Studies Section
`portfolio.html` (Task 5) IS this feature. Each project card links to a dedicated case study page.
Template is already built as `case-study-villa.html`.
Create 2 more case study pages using the same template:
- `case-study-office.html` — Corporate Office, DIFC (use villa3.jpg + placeholders)
- `case-study-clinic.html` — Medical Clinic, Dubai Hills Park (reference the real Eng. Mustafa Google review)

#### 11e — WhatsApp CTA Integration (finalise)
Already built — just ensure:
- Floating button present on ALL pages
- Pulse animation working
- Pre-filled message is page-specific (see Task 10)
- On mobile, button is 48×48px minimum touch target
- Button does NOT overlap form submit buttons on booking.html

---

### TASK 12 — Performance & polish
- Lazy load all images: add `loading="lazy"` to all `<img>` tags except above-the-fold hero
- Add `<link rel="preload">` for hero images in each page
- Minify shared.css and shared.js for production
- Add smooth page transitions: a champagne-colored thin bar that animates across the top on page load (like a progress bar)
- Ensure all pages pass basic accessibility: alt text on all images, aria-labels on icon buttons, sufficient colour contrast
- Test and fix mobile layout on 375px width (iPhone SE) for all pages

---

### TASK 13 — Deployment prep
Create a `README.md` with:
- Project structure overview
- How to replace placeholder images with real project photos
- How to update the Google Maps pin with exact showroom address
- How to update the WhatsApp number if it changes
- How to add new case study pages (template instructions)
- Recommended hosting: Vercel (zero-config, free SSL, fast CDN in UAE region)
- Deploy command: `vercel --prod`

---

## IMPORTANT NOTES FOR CLAUDE CODE

1. **Read all existing HTML files first** before writing any new code. The design system is fully established — do not deviate from it.

2. **WhatsApp number is +971544996788** — replace every instance of `+971XXXXXXXX` or `971XXXXXXXX` across all files.

3. **Real reviews are confirmed** — replace sample testimonials with the 4 real ones listed in Task 4.

4. **Arabic RTL pattern** — the bilingual toggle pattern in `thewalls-bilingual.html` is the reference. Apply the same `[dir="rtl"]` CSS override pattern and `.en-only` / `.ar-only` class pattern to all new pages.

5. **Logo** — The client has not yet provided a logo file. Create the SVG logo as described in Task 2 and use it. Leave a comment in the code: `<!-- TODO: Replace with final client logo when provided -->`.

6. **Exact office address** — not yet confirmed by client. Use Dubai, UAE as location. Leave a comment: `<!-- TODO: Update with exact showroom address -->`.

7. **Google Maps API key** — use the free embed URL format (no API key required):
   `https://www.google.com/maps/embed?pb=...` — generate the correct embed URL for Dubai.

8. **Do not break the existing bilingual homepage** — it is the most complex file. Test it after any changes.

9. **Commit frequently** with clear messages: `git add . && git commit -m "feat: add portfolio page"`

10. **When done**, run a quick audit: open every page in browser, check all links work, all images load, WhatsApp links open correctly, Arabic toggle works on all pages.

---

## SUMMARY OF WHAT TO BUILD/FIX

| # | Task | Status |
|---|------|--------|
| 1 | Clean folder structure + fix all asset paths | TODO |
| 2 | Logo SVG (wordmark + favicon) | TODO |
| 3 | Google Maps in footer + contact page | TODO |
| 4 | Replace testimonials with real Google reviews | TODO |
| 5 | Portfolio page (NEW) | TODO |
| 6 | Contact page (NEW) | TODO |
| 7 | Arabic versions of services, booking, contact | TODO |
| 8 | SEO meta tags + sitemap.xml | TODO |
| 9 | Unified navigation across all pages | TODO |
| 10 | WhatsApp real number everywhere | TODO |
| 11a | AI chatbot → real Anthropic API | TODO |
| 11b | Booking form validation upgrade | TODO |
| 11c | Google reviews section | TODO |
| 11d | 2 more case study pages | TODO |
| 11e | WhatsApp float on all pages | TODO |
| 12 | Performance, accessibility, mobile polish | TODO |
| 13 | README + deployment prep | TODO |

Start with Task 10 (WhatsApp number) and Task 1 (folder structure) first, then work through the list in order.

Good luck — the design is already world-class, now let's make the engineering match it.
