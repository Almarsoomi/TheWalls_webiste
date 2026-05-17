/* ============================================================
   THE WALLS — main.js
   Single JavaScript file for all pages
   ============================================================ */

/* ── SHARED CORE ── */
/* THE WALLS — SHARED JAVASCRIPT
   All top-level variables are wrapped in IIFEs to prevent
   SyntaxError conflicts with page-level inline <script> blocks
   that may declare variables with the same name (const nav, const cursor, etc.)
   ─────────────────────────────────────────────────────────────── */

// THEME — apply immediately to prevent flash of wrong theme
(function(){
  var t = localStorage.getItem('tw_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', t);
})();

// ── THEME TOGGLE (global — called by onclick in HTML) ──────────────────────
window.toggleTheme = function() {
  var cur  = document.documentElement.getAttribute('data-theme') || 'dark';
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('tw_theme', next);
  _twThemeBtn(next);
  _twLogos(next);
};

function _twThemeBtn(theme) {
  var btn = document.getElementById('themeToggle');
  if (!btn) return;
  // Sun = offer to switch to light; Moon = offer to switch to dark
  btn.innerHTML = theme === 'dark'
    ? '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><line x1="12" y1="2" x2="12" y2="4.5"/><line x1="12" y1="19.5" x2="12" y2="22"/><line x1="2" y1="12" x2="4.5" y2="12"/><line x1="19.5" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="6.7" y2="6.7"/><line x1="17.3" y1="17.3" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="6.7" y2="17.3"/><line x1="17.3" y1="6.7" x2="19.07" y2="4.93"/></svg>'
    : '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
}

function _twLogos(theme) {
  document.querySelectorAll('.nav-logo img').forEach(function(img) {
    var src = img.getAttribute('src') || '';
    if (theme === 'light' && src.indexOf('logo-dark') === -1) {
      img.setAttribute('src', src.replace('logo.svg', 'logo-dark.svg'));
    } else if (theme === 'dark' && src.indexOf('logo-dark') !== -1) {
      img.setAttribute('src', src.replace('logo-dark.svg', 'logo.svg'));
    }
  });
}

// ── COOKIE CONSENT (global — called by onclick in injected HTML) ────────────
window.openCookieSettings = function() {
  localStorage.removeItem('tw_cookie_consent');
  if (!document.getElementById('cookieBanner')) _twInjectCookieBanner();
};

window.cookieConsent = function(choice) {
  localStorage.setItem('tw_cookie_consent', choice);
  // Fire analytics immediately when user accepts
  if (choice === 'accept' && typeof window._twLoadAnalytics === 'function') {
    window._twLoadAnalytics();
  }
  var banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.classList.remove('cookie-visible');
    banner.classList.add('cookie-hiding');
    setTimeout(function() {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    }, 420);
  }
};

function _twInjectCookieBanner() {
  var b = document.createElement('div');
  b.id = 'cookieBanner';
  b.className = 'cookie-banner';
  b.innerHTML =
    '<div class="cookie-inner">' +
      '<div class="cookie-text">' +
        '<h4 class="en-only">We value your privacy</h4>' +
        '<h4 class="ar-only">نحن نقدر خصوصيتكم</h4>' +
        '<p class="en-only">We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking “Accept All”, you consent to our use of cookies.</p>' +
        '<p class="ar-only">نحن نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح الخاصة بك، وتقديم إعلانات أو محتوى مخصص، وتحليل حركة المرور لدينا. بالنقر فوق “قبول الكل”، فإنك توافق على استخدامنا لملفات تعريف الارتباط.</p>' +
      '</div>' +
      '<div class="cookie-actions">' +
        '<button class="btn-primary en-only" onclick="cookieConsent(\'accept\')">Accept All</button>' +
        '<button class="btn-primary ar-only" onclick="cookieConsent(\'accept\')">قبول الكل</button>' +
        '<button class="btn-outline en-only" onclick="cookieConsent(\'reject\')">Reject All</button>' +
        '<button class="btn-outline ar-only" onclick="cookieConsent(\'reject\')">رفض الكل</button>' +
        '<button class="btn-outline en-only" onclick="cookieConsent(\'customize\')">Customize</button>' +
        '<button class="btn-outline ar-only" onclick="cookieConsent(\'customize\')">تخصيص</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(b);
  // Short delay lets the browser paint the translateY(100%) position before animating in
  setTimeout(function() { b.classList.add('cookie-visible'); }, 80);
}

// PAGE-LOAD PROGRESS BAR
(function(){
  var bar = document.createElement('div');
  bar.id = 'tw-progress';
  document.body.prepend(bar);
  bar.style.width = '30%';
  window.addEventListener('load', function(){
    bar.style.width = '100%';
    setTimeout(function(){ bar.classList.add('done'); }, 400);
  });
  document.addEventListener('DOMContentLoaded', function(){ bar.style.width = '70%'; });
})();

// LAZY LOADING — add loading="lazy" to all below-fold images not already marked
document.addEventListener('DOMContentLoaded', function(){
  document.querySelectorAll('img:not([loading])').forEach(function(img, i){
    if(i > 0) img.setAttribute('loading', 'lazy');
  });
});

// THEME BUTTON INIT + LOGO INIT + COOKIE BANNER INIT
document.addEventListener('DOMContentLoaded', function(){
  var theme = document.documentElement.getAttribute('data-theme') || 'dark';
  _twThemeBtn(theme);
  _twLogos(theme);
  if (!localStorage.getItem('tw_cookie_consent')) {
    _twInjectCookieBanner();
  }
});

// CUSTOM CURSOR — smooth ring follow + hover expand
// Skips home page (id="cursor") since it has its own full inline cursor implementation.
// Cooperates with inner-page inline cursor scripts: shared.js provides rAF easing
// for ring (harmless if page also has rAF since both target same position).
(function(){
  var dot  = document.querySelector('.cursor');
  var ring = document.querySelector('.cursor-ring');
  if (!dot || !ring) return;
  if (dot.id === 'cursor') return; // home page owns its cursor

  var mx = 0, my = 0, rx = 0, ry = 0;

  document.addEventListener('mousemove', function(e) {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';
  });

  // Smooth ring with lerp easing — matches home page feel
  (function tick() {
    rx += (mx - rx) * 0.18;
    ry += (my - ry) * 0.18;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(tick);
  })();

  // Hover expand on interactive elements (adds .h class matching page CSS)
  document.querySelectorAll('a, button, .project-card, .service-card, .testimonial-card').forEach(function(el) {
    el.addEventListener('mouseenter', function() { dot.classList.add('h'); ring.classList.add('h'); });
    el.addEventListener('mouseleave', function() { dot.classList.remove('h'); ring.classList.remove('h'); });
  });
})();

// NAV SCROLL DETECTION — wrapped in IIFE to avoid const conflict with page scripts
(function(){
  var nav = document.querySelector('nav');
  window.addEventListener('scroll', function() {
    if (nav) nav.classList.toggle('sc', window.scrollY > 20);
  });
})();

// REVEAL ON SCROLL ANIMATION — wrapped in IIFE to avoid const conflict
(function(){
  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) entry.target.classList.add('vis');
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(function(el) { observer.observe(el); });
})();

// Language init handled per-page via setLang() + tw_lang localStorage key

// MOBILE HAMBURGER NAV
// Uses a body-level overlay to avoid the backdrop-filter containing-block bug:
// nav.sc applies backdrop-filter:blur which makes nav a CSS containing block,
// so position:fixed inside it is constrained to nav height instead of viewport.
(function () {
  var toggle = document.getElementById('navToggle');
  if (!toggle) return;

  // Build full-screen overlay as a direct child of <body>
  var overlay = document.createElement('div');
  overlay.id = 'mobOverlay';
  overlay.className = 'mob-overlay';

  // Clone existing nav links into overlay
  var navLinks = document.querySelector('.nav-links');
  if (navLinks) {
    var clone = navLinks.cloneNode(true);
    overlay.appendChild(clone);
  }

  // Add Book Consultation CTA
  var cta = document.createElement('a');
  cta.href = window.location.pathname.includes('/blog/')
    ? '../pages/booking.html'
    : window.location.pathname.includes('/pages/')
      ? './booking.html'
      : './pages/booking.html';
  cta.className = 'mob-cta';
  cta.textContent = 'Book Consultation';
  overlay.appendChild(cta);

  // Add close button inside overlay (top-right X)
  var closeBtn = document.createElement('button');
  closeBtn.className = 'mob-close';
  closeBtn.setAttribute('aria-label', 'Close menu');
  closeBtn.innerHTML = '<span></span><span></span>';
  overlay.appendChild(closeBtn);

  document.body.appendChild(overlay);

  function openMenu() {
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  toggle.addEventListener('click', function () {
    document.body.classList.contains('nav-open') ? closeMenu() : openMenu();
  });

  closeBtn.addEventListener('click', closeMenu);

  // Close when any overlay link is clicked
  overlay.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', closeMenu);
  });

  // Close on Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });
})();

// SCROLL TO TOP
(function(){
  function init() {
    var btn = document.getElementById('scrollTop');
    var footerEl = document.querySelector('footer');
    if (!btn || !footerEl) return;
    function checkFooter() {
      btn.classList.toggle('visible', footerEl.getBoundingClientRect().top < window.innerHeight);
    }
    window.addEventListener('scroll', checkFooter, { passive: true });
    checkFooter();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// NAV LINK ACTIVE STATE
(function(){
  function setActiveNav() {
    var links = document.querySelectorAll('.nav-links a');
    var currentPath = window.location.pathname;

    links.forEach(function(link) {
      var href = link.getAttribute('href');
      if (!href) return;

      try {
        var linkPath = new URL(href, window.location.origin + window.location.pathname).pathname;
        if (linkPath === currentPath || (currentPath === '/' && (linkPath === '/index.html' || linkPath === '/'))) {
          link.classList.add('act');
        } else {
          link.classList.remove('act');
        }
      } catch(e) { /* ignore invalid URLs */ }
    });
  }

  document.addEventListener('DOMContentLoaded', setActiveNav);
})();

/* ── BEFORE / AFTER SLIDER ── */
(function() {
  const slider = document.getElementById('baSlider');
  const after = document.getElementById('baAfter');
  if (!slider || !after) return;

  let dragging = false;

  function setBA(pct) {
    const p = Math.max(0, Math.min(100, pct));
    after.style.clipPath = `inset(0 ${100 - p}% 0 0)`;
    document.getElementById('baDivider').style.left = p + '%';
    document.getElementById('baHandle').style.left = p + '%';
  }

  setBA(50);
  slider.addEventListener('mousedown', () => dragging = true);
  slider.addEventListener('touchstart', () => dragging = true, { passive: true });
  window.addEventListener('mouseup', () => dragging = false);
  window.addEventListener('touchend', () => dragging = false);
  window.addEventListener('mousemove', e => {
    if (!dragging) return;
    const r = slider.getBoundingClientRect();
    setBA((e.clientX - r.left) / r.width * 100);
  });
  window.addEventListener('touchmove', e => {
    if (!dragging) return;
    const r = slider.getBoundingClientRect();
    setBA((e.touches[0].clientX - r.left) / r.width * 100);
  }, { passive: true });
})();

/* ── FAQ ACCORDION ── */
function toggleFAQ(item) {
  document.querySelectorAll('.faq-item').forEach(i => {
    if (i !== item) i.classList.remove('open');
  });
  item.classList.toggle('open');
}

/* ── SEARCH ── */
const PROJECTS = [
  { name: 'Palm Jumeirah Villa', type: 'Residential', location: 'Palm Jumeirah', tags: 'villa joinery luxury residential', link: './case-study-villa.html' },
  { name: 'DIFC Corporate HQ', type: 'Office', location: 'DIFC', tags: 'office fit-out corporate joinery', link: './case-study-office.html' },
  { name: 'Dubai Hills Medical Clinic', type: 'Medical', location: 'Dubai Hills', tags: 'clinic medical healthcare fit-out', link: './case-study-clinic.html' },
  { name: 'Modern Penthouse — Downtown', type: 'Residential', location: 'Downtown Dubai', tags: 'penthouse residential luxury', link: './portfolio.html' },
  { name: 'Jumeirah Retail Boutique', type: 'Retail', location: 'Jumeirah', tags: 'retail boutique shop fitout', link: './portfolio.html' },
  { name: 'Business Bay Apartment', type: 'Residential', location: 'Business Bay', tags: 'apartment residential modern', link: './portfolio.html' },
  { name: 'JBR Hospitality Suite', type: 'Hospitality', location: 'JBR', tags: 'hotel suite hospitality luxury', link: './portfolio.html' },
  { name: 'Al Barsha Restaurant', type: 'Hospitality', location: 'Al Barsha', tags: 'restaurant hospitality fit-out', link: './portfolio.html' },
  { name: 'Mirdif Family Villa', type: 'Residential', location: 'Mirdif', tags: 'villa residential family joinery', link: './portfolio.html' },
];

let _searchTimer = null;

function doSearch(inputId, resultsId) {
  const inputEl = document.getElementById(inputId);
  const container = document.getElementById(resultsId);
  if (!inputEl || !container) return;

  const q = inputEl.value.trim().toLowerCase();
  if (!q || q.length < 2) {
    container.classList.remove('show');
    return;
  }

  const matches = PROJECTS.filter(p =>
    [p.name, p.type, p.location, p.tags].some(f => f.toLowerCase().includes(q))
  );

  container.innerHTML = matches.length
    ? matches.map(p =>
        `<a class="search-result-item" href="${p.link}">
           <span class="sr-name">${p.name}</span>
           <span class="sr-meta">${p.type} &middot; ${p.location}</span>
         </a>`
      ).join('')
    : `<p class="sr-empty">No results for "${q}"</p>`;

  container.classList.toggle('show', true);
}

function wireSearch(inputId, resultsId) {
  const el = document.getElementById(inputId);
  if (!el) return;
  el.addEventListener('input', () => {
    clearTimeout(_searchTimer);
    _searchTimer = setTimeout(() => doSearch(inputId, resultsId), 200);
  });
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter') doSearch(inputId, resultsId);
  });
  document.addEventListener('click', e => {
    if (!el.contains(e.target)) {
      const c = document.getElementById(resultsId);
      if (c) c.classList.remove('show');
    }
  });
}
