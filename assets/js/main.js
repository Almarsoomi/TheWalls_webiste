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

// ── rAF SCROLL THROTTLE ──────────────────────────────────────────────────────
// Wraps a scroll handler so its (often layout-reading) work runs at most once
// per animation frame instead of on every scroll event — avoids layout thrash.
function _twRafThrottle(fn) {
  var ticking = false;
  return function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { fn(); ticking = false; });
  };
}

// ── THEME TOGGLE (global — called by onclick in HTML) ──────────────────────
window.toggleTheme = function() {
  var cur  = document.documentElement.getAttribute('data-theme') || 'dark';
  var next = cur === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('tw_theme', next);
  _twThemeBtn(next);
  _twLogos(next);
  _twFonts(next);
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

function _twFonts(theme) {
  // Fonts are the same in both modes — no switching
}

// ── COOKIE CONSENT (global — called by onclick in injected HTML) ────────────
window.openCookieSettings = function() {
  localStorage.removeItem('tw_cookie_consent');
  if (!document.getElementById('cookieBanner')) _twInjectCookieBanner();
};

window.cookieConsent = function(choice) {
  localStorage.setItem('tw_cookie_consent', choice);
  if (choice === 'accept') {
    localStorage.setItem('tw_cookie_analytics', 'true');
    localStorage.setItem('tw_cookie_personalization', 'true');
    _twFireAnalytics();
  } else if (choice === 'reject') {
    localStorage.setItem('tw_cookie_analytics', 'false');
    localStorage.setItem('tw_cookie_personalization', 'false');
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

// Fires GA (defined in each page's <head>) + Microsoft Clarity
function _twFireAnalytics() {
  if (typeof window._twLoadAnalytics === 'function') window._twLoadAnalytics();
  if (!window._twClarityLoaded) {
    window._twClarityLoaded = true;
    (function(c,l,a,r,i,t,y){
      c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
      t=l.createElement(r);t.async=1;t.src='https://www.clarity.ms/tag/'+i;
      y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    })(window,document,'clarity','script','wwp0sbrkx6');
  }
}

window.openCookieCustomize = function() {
  if (document.getElementById('cookieModalOverlay')) return;

  // Build toggle switches via DOM so no smart-quote issues with type/id attrs
  function mkToggle(id, defaultChecked, disabled) {
    var lbl = document.createElement('label');
    lbl.className = 'cp-toggle';
    var inp = document.createElement('input');
    inp.type = 'checkbox';
    if (id) inp.id = id;
    inp.checked = !!defaultChecked;
    if (disabled) inp.disabled = true;
    var trk = document.createElement('span');
    trk.className = 'cp-toggle-track';
    lbl.appendChild(inp);
    lbl.appendChild(trk);
    return lbl;
  }

  function mkBullets(items) {
    var ul = document.createElement('ul');
    ul.className = 'cookie-pref-bullets';
    items.forEach(function(t) {
      var li = document.createElement('li');
      li.textContent = t;
      ul.appendChild(li);
    });
    return ul;
  }

  function mkCategory(name, toggleId, defaultChecked, alwaysOn, subText, bullets) {
    var item = document.createElement('div');
    item.className = 'cookie-pref-item';
    var hdr = document.createElement('div');
    hdr.className = 'cookie-pref-header';
    var nameEl = document.createElement('span');
    nameEl.className = 'cookie-pref-name';
    nameEl.textContent = name;
    hdr.appendChild(nameEl);
    if (alwaysOn) {
      var wrap = document.createElement('div');
      wrap.style.cssText = 'display:flex;align-items:center;gap:10px';
      var badge = document.createElement('span');
      badge.className = 'cookie-pref-badge';
      badge.textContent = 'Always On';
      wrap.appendChild(badge);
      wrap.appendChild(mkToggle(null, true, true));
      hdr.appendChild(wrap);
    } else {
      hdr.appendChild(mkToggle(toggleId, defaultChecked, false));
    }
    item.appendChild(hdr);
    var sub = document.createElement('p');
    sub.className = 'cookie-pref-sub';
    sub.textContent = subText;
    item.appendChild(sub);
    item.appendChild(mkBullets(bullets));
    return item;
  }

  var overlay = document.createElement('div');
  overlay.id = 'cookieModalOverlay';
  overlay.className = 'cookie-modal-overlay';

  var modal = document.createElement('div');
  modal.className = 'cookie-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');

  var hdr = document.createElement('div');
  hdr.className = 'cookie-modal-header';
  var titleEl = document.createElement('span');
  titleEl.className = 'cookie-modal-title';
  titleEl.textContent = 'Cookie Preferences';
  var closeBtn = document.createElement('button');
  closeBtn.className = 'cookie-modal-close-btn';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.onclick = function() { window.closeCookieModal(); };
  hdr.appendChild(titleEl);
  hdr.appendChild(closeBtn);
  modal.appendChild(hdr);

  // Scrollable body — desc + categories scroll; action buttons stay outside
  var body = document.createElement('div');
  body.className = 'cookie-modal-body';

  var descEl = document.createElement('p');
  descEl.className = 'cookie-modal-desc';
  descEl.textContent = 'Choose which cookies you allow. Essential cookies are always active as they are required for the site to function properly.';
  body.appendChild(descEl);

  var savedAnalytics = localStorage.getItem('tw_cookie_analytics');
  var savedPersonalization = localStorage.getItem('tw_cookie_personalization');
  var analyticsDefault = savedAnalytics !== null ? savedAnalytics === 'true' : false;
  var personalizationDefault = savedPersonalization !== null ? savedPersonalization === 'true' : true;

  var list = document.createElement('div');
  list.className = 'cookie-pref-list';
  list.appendChild(mkCategory('Personalization', 'pref-personalization', personalizationDefault, false,
    'Remembers your preferences to give you a personalised experience.',
    ['Remember your language preference', 'Store theme settings (dark mode, etc.)']));
  list.appendChild(mkCategory('Analytics & Performance', 'pref-analytics', analyticsDefault, false,
    'Helps us understand how visitors interact with the site so we can improve it.',
    ['Track how users interact with the site', 'Measure page load times and user behaviour', 'Help developers understand which features are used most']));
  list.appendChild(mkCategory('Session Management', null, true, true,
    'Essential for normal site operation.',
    ['Track your preferences during a browsing session']));
  list.appendChild(mkCategory('Security', null, true, true,
    'Protects you and the site from fraud and unauthorised access.',
    ['Verify you are who you claim to be', 'Prevent fraud and unauthorised access', 'Store security tokens']));
  body.appendChild(list);
  modal.appendChild(body);

  var actions = document.createElement('div');
  actions.className = 'cookie-modal-actions';
  var saveBtn = document.createElement('button');
  saveBtn.className = 'btn-primary';
  saveBtn.textContent = 'Save Preferences';
  saveBtn.onclick = function() { window.saveCookiePrefs(); };
  var acceptBtn = document.createElement('button');
  acceptBtn.className = 'btn-outline';
  acceptBtn.textContent = 'Accept All';
  acceptBtn.onclick = function() { window.cookieConsent('accept'); window.closeCookieModal(); };
  var rejectBtn = document.createElement('button');
  rejectBtn.className = 'btn-outline';
  rejectBtn.textContent = 'Reject All';
  rejectBtn.onclick = function() { window.cookieConsent('reject'); window.closeCookieModal(); };
  actions.appendChild(saveBtn);
  actions.appendChild(acceptBtn);
  actions.appendChild(rejectBtn);
  modal.appendChild(actions);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  setTimeout(function() { overlay.classList.add('cm-visible'); }, 40);
};

window.closeCookieModal = function() {
  var overlay = document.getElementById('cookieModalOverlay');
  if (!overlay) return;
  overlay.classList.remove('cm-visible');
  setTimeout(function() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }, 350);
};

window.saveCookiePrefs = function() {
  var analytics = document.getElementById('pref-analytics');
  var personalization = document.getElementById('pref-personalization');
  var analyticsOn = analytics ? analytics.checked : false;
  var personalizationOn = personalization ? personalization.checked : true;

  localStorage.setItem('tw_cookie_consent', 'custom');
  localStorage.setItem('tw_cookie_analytics', analyticsOn ? 'true' : 'false');
  localStorage.setItem('tw_cookie_personalization', personalizationOn ? 'true' : 'false');

  if (analyticsOn) _twFireAnalytics();

  window.closeCookieModal();

  // Brief success toast
  var toast = document.createElement('div');
  toast.className = 'tw-toast';
  toast.textContent = 'Preferences saved';
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('tw-toast-visible'); }, 30);
  setTimeout(function() {
    toast.classList.remove('tw-toast-visible');
    setTimeout(function() { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 350);
  }, 2200);

  // Also dismiss the banner
  var banner = document.getElementById('cookieBanner');
  if (banner) {
    banner.classList.remove('cookie-visible');
    banner.classList.add('cookie-hiding');
    setTimeout(function() {
      if (banner && banner.parentNode) banner.parentNode.removeChild(banner);
    }, 420);
  }
};

function _mkBtn(cls, text, fn) {
  var btn = document.createElement('button');
  btn.className = cls;
  btn.textContent = text;
  btn.onclick = fn;
  return btn;
}

function _twInjectCookieBanner() {
  var b = document.createElement('div');
  b.id = 'cookieBanner';
  b.className = 'cookie-banner';

  var inner = document.createElement('div');
  inner.className = 'cookie-inner';

  var textDiv = document.createElement('div');
  textDiv.className = 'cookie-text';
  var h4en = document.createElement('h4');
  h4en.className = 'en-only';
  h4en.textContent = 'We value your privacy';
  var h4ar = document.createElement('h4');
  h4ar.className = 'ar-only';
  h4ar.textContent = 'نحن نقدر خصوصيتكم';
  var pen = document.createElement('p');
  pen.className = 'en-only';
  pen.textContent = 'We use cookies to enhance your browsing experience, serve personalised content, and analyse our traffic. By clicking “Accept All”, you consent to our use of cookies.';
  var par = document.createElement('p');
  par.className = 'ar-only';
  par.textContent = 'نحن نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح وتقديم محتوى مخصص. بالنقر فوق “قبول الكل” توافق على استخدامنا.';
  textDiv.appendChild(h4en); textDiv.appendChild(h4ar);
  textDiv.appendChild(pen); textDiv.appendChild(par);

  var actDiv = document.createElement('div');
  actDiv.className = 'cookie-actions';
  actDiv.appendChild(_mkBtn('btn-primary en-only', 'Accept All', function(){ window.cookieConsent('accept'); }));
  actDiv.appendChild(_mkBtn('btn-primary ar-only', 'قبول الكل', function(){ window.cookieConsent('accept'); }));
  actDiv.appendChild(_mkBtn('btn-outline en-only', 'Reject All', function(){ window.cookieConsent('reject'); }));
  actDiv.appendChild(_mkBtn('btn-outline ar-only', 'رفض الكل', function(){ window.cookieConsent('reject'); }));
  actDiv.appendChild(_mkBtn('btn-outline en-only', 'Customize', function(){ window.openCookieCustomize(); }));
  actDiv.appendChild(_mkBtn('btn-outline ar-only', 'تخصيص', function(){ window.openCookieCustomize(); }));

  inner.appendChild(textDiv);
  inner.appendChild(actDiv);
  b.appendChild(inner);
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

// THEME BUTTON INIT + LOGO INIT + FONT INIT + COOKIE BANNER INIT + ANALYTICS
document.addEventListener('DOMContentLoaded', function(){
  var theme = document.documentElement.getAttribute('data-theme') || 'dark';
  _twThemeBtn(theme);
  _twLogos(theme);
  _twFonts(theme);

  var consent = localStorage.getItem('tw_cookie_consent');
  if (!consent) {
    _twInjectCookieBanner();
  } else if (consent === 'custom' && localStorage.getItem('tw_cookie_analytics') === 'true') {
    // Head script only fires GA on 'accept'; handle 'custom' + Clarity here
    _twFireAnalytics();
  } else if (consent === 'accept') {
    // Clarity may not have been loaded yet (head script loads GA only)
    _twFireAnalytics();
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
  window.addEventListener('scroll', _twRafThrottle(function() {
    if (nav) nav.classList.toggle('sc', window.scrollY > 20);
  }), { passive: true });
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

// GLOBAL LANGUAGE TOGGLE — shared across all pages
// Fallback for pages with no inline setLang (e.g. about, blog, booking, etc.)
window.setLang = window.setLang || function(lang) {
  var root  = document.documentElement;
  var btnEN = document.getElementById('btnEN');
  var btnAR = document.getElementById('btnAR');
  root.setAttribute('lang', lang);
  root.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
  if (btnEN) btnEN.classList.toggle('active', lang !== 'ar');
  if (btnAR) btnAR.classList.toggle('active', lang === 'ar');
  // localStorage persistence + nav-link text are applied once by the
  // DOMContentLoaded wrapper below (kept out of here to avoid doing it twice).
};

document.addEventListener('DOMContentLoaded', function() {
  // Wrap any page-specific setLang so that:
  // 1. localStorage always persists on every click (even if page version forgot)
  // 2. Nav link text always updates in Arabic/English (not all page versions do this)
  var _orig = window.setLang;
  window.setLang = function(lang) {
    localStorage.setItem('tw_lang', lang);
    if (_orig) _orig(lang);
    document.querySelectorAll('.nav-links a[data-en]').forEach(function(a) {
      a.textContent = lang === 'ar' ? (a.dataset.ar || a.textContent) : (a.dataset.en || a.textContent);
    });
  };
  // Language is decided by the URL now that EN and AR have separate pages:
  // /ar/* → Arabic, every other page → English (a ?lang= override still works
  // for the legacy soft variant). We intentionally do NOT fall back to the stored
  // tw_lang preference, otherwise an English URL would render Arabic (with the
  // wrong toggle button active) for anyone who previously viewed an Arabic page.
  var _isArPage = window.location.pathname.indexOf('/ar/') === 0;
  var _params = new URLSearchParams(window.location.search);
  var _urlLang = _params.get('lang');
  var _lang = _isArPage ? 'ar'
            : (_urlLang === 'ar' || _urlLang === 'en') ? _urlLang
            : 'en';
  window.setLang(_lang);
  // For an English page hit with ?lang=ar, canonicalise to the real Arabic URL
  // (its `ar` hreflang) if one exists, else self-canonical to the ?lang=ar variant.
  if (!_isArPage && _urlLang === 'ar') {
    var _canon = document.querySelector('link[rel="canonical"]');
    var _arAlt = document.querySelector('link[rel="alternate"][hreflang="ar"]');
    if (_canon) _canon.setAttribute('href', _arAlt ? _arAlt.getAttribute('href') : (_canon.getAttribute('href').split('?')[0] + '?lang=ar'));
  }
});

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

  // Add Client Login (portal) link
  var portal = document.createElement('a');
  portal.href = window.location.pathname.includes('/blog/')
    ? '../pages/portal.html'
    : window.location.pathname.includes('/pages/')
      ? './portal.html'
      : './pages/portal.html';
  portal.className = 'mob-portal';
  portal.textContent = 'Client Login';
  overlay.appendChild(portal);

  // Add Get a Quote CTA
  var cta = document.createElement('a');
  cta.href = window.location.pathname.includes('/blog/')
    ? '../pages/quote.html'
    : window.location.pathname.includes('/pages/')
      ? './quote.html'
      : './pages/quote.html';
  cta.className = 'mob-cta';
  cta.textContent = 'Get a Quote';
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
    window.addEventListener('scroll', _twRafThrottle(checkFooter), { passive: true });
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

/* ── FAQ ACCORDION ── */
function toggleFAQ(item) {
  document.querySelectorAll('.faq-item').forEach(i => {
    if (i !== item) i.classList.remove('open');
  });
  item.classList.toggle('open');
}

// ── HERO WORD CYCLE ──────────────────────────────────────────────────────────
(function () {
  const sequences = [
    ['craft',    'design',    'build',    'shape'   ],
    ['spaces',   'interiors', 'villas',   'offices' ],
    ['endure',   'inspire',   'impress',  'perform' ],
  ];
  let idx = 0;

  function swapSlots() {
    idx = (idx + 1) % sequences[0].length;
    document.querySelectorAll('.hero-h1.en-only .hero-cycle-slot').forEach(function (slot, i) {
      const word = slot.querySelector('.hero-cycle-word');
      // slide current word up and out
      word.classList.add('is-out');
      setTimeout(function () {
        // jump next word in from below (no transition)
        word.textContent = sequences[i][idx];
        word.classList.remove('is-out');
        word.classList.add('is-in');
        // force reflow so the no-transition reset registers
        word.getBoundingClientRect();
        // now animate it into place
        word.classList.remove('is-in');
      }, 480);
    });
  }

  setInterval(swapSlots, 3200);
}());

// ── PROCESS LINE FILL ON SCROLL ──────────────────────────────────────────────
(function () {
  var fill = document.querySelector('#pt-main .pt-line-fill');
  var timeline = document.getElementById('pt-main');
  if (!fill || !timeline) return;

  function updateFill() {
    var rect = timeline.getBoundingClientRect();
    var vh = window.innerHeight;
    // start filling when top of timeline enters bottom of viewport
    // finish filling when bottom of timeline reaches top of viewport
    var progress = (vh - rect.top) / (rect.height + vh * 0.3);
    progress = Math.max(0, Math.min(1, progress));
    fill.style.height = (progress * 100) + '%';
  }

  window.addEventListener('scroll', _twRafThrottle(updateFill), { passive: true });
  updateFill();
}());

// ── PROCESS TIMELINE SCROLL ACTIVATION ───────────────────────────────────────
(function () {
  var steps = document.querySelectorAll('.pt-step');
  if (!steps.length) return;

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('is-active', entry.isIntersecting);
    });
  }, { threshold: 0.35 });

  steps.forEach(function (step) { obs.observe(step); });

  // reveal footer link when last step activates
  var footer = document.querySelector('.pt-footer');
  if (footer) {
    var lastStep = steps[steps.length - 1];
    var footerObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        setTimeout(function () { footer.classList.add('is-visible'); }, 300);
        footerObs.disconnect();
      }
    }, { threshold: 0.5 });
    footerObs.observe(lastStep);
  }
}());

// SERVICES NAV DROPDOWN — inject a sub-menu of the per-service landing pages.
// Runs after the mobile-nav clone above, so the mobile overlay keeps the simple
// "Services" link while desktop gets the hover dropdown. Paths are computed from
// the current location so it works from root, /pages/ and /blog/.
(function () {
  var link = document.querySelector('.nav-links a[data-en="Services"]');
  if (!link || link.closest('.nav-dd')) return;

  var p = window.location.pathname;
  var base = p.indexOf('/blog/') > -1 ? '../pages/'
           : p.indexOf('/pages/') > -1 ? './'
           : './pages/';

  var items = [
    { h: 'services.html',                       en: 'All Services',              ar: 'كل الخدمات' },
    { h: 'joinery-dubai.html',                  en: 'Joinery',                   ar: 'النجارة' },
    { h: 'solid-surfaces-dubai.html',           en: 'Solid Surfaces',            ar: 'الأسطح الصلبة' },
    { h: 'aluminum-works-dubai.html',           en: 'Aluminum Works',            ar: 'الأعمال الألمنيوم' },
    { h: 'interior-design-dubai.html',          en: 'Interior Design',           ar: 'التصميم الداخلي' },
    { h: 'complete-fit-out-dubai.html',         en: 'Complete Fit-Out',          ar: 'التشطيب الكامل' },
    { h: 'architecture-supervision-dubai.html', en: 'Architecture & Supervision', ar: 'الهندسة والإشراف' }
  ];

  var lang = localStorage.getItem('tw_lang') || 'en';
  var wrap = document.createElement('div');
  wrap.className = 'nav-dd';
  link.parentNode.insertBefore(wrap, link);
  wrap.appendChild(link);

  var menu = document.createElement('div');
  menu.className = 'nav-dd-menu';
  items.forEach(function (it) {
    var a = document.createElement('a');
    a.href = base + it.h;
    a.setAttribute('data-en', it.en);
    a.setAttribute('data-ar', it.ar);
    a.textContent = lang === 'ar' ? it.ar : it.en;
    menu.appendChild(a);
  });
  wrap.appendChild(menu);
})();
