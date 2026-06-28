/* ============================================================
   THE WALLS — parametric.js
   The "Field" — a single generative louver system that gives the
   whole site the feel of the studio's CNC-routed parametric walls.

   One field engine drives several renderers:
     1. Living Wall hero  — canvas louvers that ripple toward the cursor
     2. Footer signature  — a slow undulating louver strip
     3. Slat-sweep        — a vertical-slat curtain on page navigation

   Vanilla JS, no dependencies. Injected sitewide by main.js so it runs on
   every page (and the /ar/ mirror) with zero per-page markup.
   Respects prefers-reduced-motion and re-colours with the theme toggle.
   ============================================================ */
(function () {
  'use strict';

  var mqReduce = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var REDUCE = mqReduce.matches;
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // ── THEME COLOURS ──────────────────────────────────────────────────────────
  // Read straight from the CSS custom properties so the field always matches the
  // active dark/light theme. Re-read on toggle (see theme hook at the bottom).
  var COLORS = readColors();
  function readColors() {
    var cs = getComputedStyle(document.documentElement);
    function v(name, fallback) { return (cs.getPropertyValue(name) || fallback).trim(); }
    return {
      gold:      v('--champagne', '#c9a96e'),
      goldLight: v('--champagne-light', '#e8d5aa'),
      goldMuted: v('--champagne-muted', '#8a7253')
    };
  }

  // ── VALUE NOISE ────────────────────────────────────────────────────────────
  // Cheap deterministic 1-D noise — gives the field organic, non-repeating drift
  // without pulling in a library. (No Math.random — render must be reproducible.)
  function hash(n) { var s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); }
  function noise(x) {
    var i = Math.floor(x), f = x - i;
    var u = f * f * (3 - 2 * f);
    return hash(i) * (1 - u) + hash(i + 1) * u;
  }

  // ── SHARED RENDER LOOP REGISTRY ──────────────────────────────────────────────
  // Each renderer registers a draw(t) fn + the element to watch. A single rAF loop
  // ticks all *visible* renderers; offscreen ones are skipped so idle CPU stays at 0.
  var renderers = [];
  var running = false;
  function registerRenderer(el, draw, opts) {
    var r = { el: el, draw: draw, visible: false, opts: opts || {} };
    renderers.push(r);
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { r.visible = e.isIntersecting; });
      maybeRun();
    }, { threshold: 0 });
    io.observe(el);
    // Pause the whole loop when the tab is hidden.
    document.addEventListener('visibilitychange', maybeRun);
    return r;
  }
  function anyVisible() {
    if (document.hidden) return false;
    for (var i = 0; i < renderers.length; i++) if (renderers[i].visible) return true;
    return false;
  }
  function maybeRun() {
    if (running) return;
    if (REDUCE) return; // static renderers draw once on init instead
    if (!anyVisible()) return;
    running = true;
    requestAnimationFrame(tick);
  }
  function tick(now) {
    var t = now * 0.001;
    var live = false;
    for (var i = 0; i < renderers.length; i++) {
      if (renderers[i].visible && !document.hidden) { renderers[i].draw(t); live = true; }
    }
    if (live) { requestAnimationFrame(tick); }
    else { running = false; }
  }

  // ── DPR-AWARE CANVAS SIZING ──────────────────────────────────────────────────
  function fitCanvas(canvas) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.clientWidth, h = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h, ctx: ctx };
  }
  function debounce(fn, ms) {
    var id; return function () { clearTimeout(id); id = setTimeout(fn, ms); };
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. LIVING WALL HERO
  //    Vertical champagne louvers over the hero photo. A travelling sine wave
  //    makes them breathe; the pointer parts them like a beaded screen.
  // ════════════════════════════════════════════════════════════════════════════
  function initHero() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'tw-hero-field';
    canvas.setAttribute('aria-hidden', 'true');
    // Sits above the photo/grid (z 0) but below .hero-content (z 10).
    var grid = hero.querySelector('.hero-grid-pattern');
    if (grid && grid.nextSibling) hero.insertBefore(canvas, grid.nextSibling);
    else hero.appendChild(canvas);

    var dim = fitCanvas(canvas);
    var ctx = dim.ctx, W = dim.w, H = dim.h;

    // Pointer state, eased toward the target for smooth "drag through the slats".
    var px = -9999, py = -9999, tx = -9999, ty = -9999, active = false;
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      tx = e.clientX - r.left; ty = e.clientY - r.top; active = true;
      maybeRun();
    });
    hero.addEventListener('pointerleave', function () { active = false; });

    function resize() { var d = fitCanvas(canvas); ctx = d.ctx; W = d.w; H = d.h; }
    window.addEventListener('resize', debounce(resize, 150));

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      // Slat spacing scales with width; capped for performance.
      var spacing = W < 640 ? 26 : 34;
      var count = Math.min(120, Math.max(24, Math.floor(W / spacing)));
      var step = W / count;
      var radius = Math.min(W, H) * 0.22;        // pointer influence radius
      var radius2 = radius * radius;

      // On touch / no pointer, drift a virtual pointer along a slow Lissajous path
      // so the wall still feels alive without a cursor.
      var hasPtr = active;
      if (!hasPtr && (isTouch || px < -1000)) {
        tx = W * (0.5 + 0.32 * Math.sin(t * 0.18));
        ty = H * (0.45 + 0.22 * Math.cos(t * 0.13));
        hasPtr = true;
      }
      px += (tx - px) * 0.08; py += (ty - py) * 0.08;

      var slatH = 12;                            // vertical sampling resolution
      for (var i = 0; i <= count; i++) {
        var baseX = i * step;
        ctx.beginPath();
        for (var y = 0; y <= H + slatH; y += slatH) {
          // travelling wave + organic noise drift
          var wave = 7 * Math.sin(y * 0.006 + t * 0.6 + i * 0.25)
                   + 5 * (noise(i * 0.35 + y * 0.004 + t * 0.15) - 0.5);
          // pointer push: part the slats sideways near the cursor
          var dx = baseX - px, dy = y - py;
          var d2 = dx * dx + dy * dy;
          var push = 0;
          if (hasPtr && d2 < radius2 * 4) {
            var falloff = Math.exp(-d2 / (2 * radius2));
            push = (dx >= 0 ? 1 : -1) * falloff * radius * 0.42;
          }
          var x = baseX + wave + push;
          if (y === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        // Slats brighten as they're pushed — like light raking a carved panel.
        var dcx = baseX - px;
        var nearness = hasPtr ? Math.exp(-(dcx * dcx) / (2 * radius2)) : 0;
        var alpha = 0.10 + nearness * 0.45;
        ctx.strokeStyle = hexA(nearness > 0.4 ? COLORS.goldLight : COLORS.gold, alpha);
        ctx.lineWidth = 0.6 + nearness * 1.2;
        ctx.stroke();
      }
    }

    if (REDUCE) { px = W * 0.5; py = H * 0.5; draw(0); }
    else registerRenderer(canvas, draw);
    canvas.__redraw = function () { if (REDUCE) draw(0); }; // for theme re-colour
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. FOOTER SIGNATURE — the logo's "W" as a glowing louver field, sitewide.
  //    Lead chevrons + outer ascender slats echo the brand mark.
  // ════════════════════════════════════════════════════════════════════════════
  function initFooter() {
    var footer = document.querySelector('footer');
    if (!footer || footer.querySelector('.tw-footer-field')) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'tw-footer-field';
    canvas.setAttribute('aria-hidden', 'true');
    footer.insertBefore(canvas, footer.firstChild);

    var dim = fitCanvas(canvas), ctx = dim.ctx, W = dim.w, H = dim.h;
    function resize() { var d = fitCanvas(canvas); ctx = d.ctx; W = d.w; H = d.h; if (REDUCE) draw(0); }
    window.addEventListener('resize', debounce(resize, 150));

    // The Walls "W": tops at the sides + centre, two valleys between (y runs down).
    var PTS = [[0.00, 0.00], [0.27, 1.00], [0.50, 0.32], [0.73, 1.00], [1.00, 0.00]];
    function mix(a, b, t) {                       // lerp two #rrggbb colours
      function p(h) { h = h.replace('#', ''); if (h.length === 3) h = h[0]+h[0]+h[1]+h[1]+h[2]+h[2]; var n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
      var x = p(a), y = p(b);
      return 'rgb(' + Math.round(x[0]+(y[0]-x[0])*t) + ',' + Math.round(x[1]+(y[1]-x[1])*t) + ',' + Math.round(x[2]+(y[2]-x[2])*t) + ')';
    }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      // Responsive geometry — the mark must stay in proportion at ANY footer
      // aspect ratio. Tall/narrow footers (mobile) would stretch the W into a
      // spike, so on narrow screens the drawn height is contained (Hd) and the
      // amplitude is driven by width. Tighter side padding on small phones keeps
      // the W from looking cramped. Wide/desktop path is unchanged.
      var narrow = W < 600;
      var padX = W * (W < 400 ? 0.11 : (narrow ? 0.14 : 0.17));
      var spanX = W - padX * 2;
      var Hd = narrow ? Math.min(H, W * 0.8) : H;
      var topY = Hd * 0.15;
      var band = Math.min(Hd * 0.44, spanX * 0.6, 380);   // width-capped, never giant
      var LINES = Math.max(10, Math.min(48, Math.round(Hd / 18)));
      var step = (Hd * 0.82) / LINES;
      for (var k = 0; k < LINES; k++) {
        var depth = LINES > 1 ? k / (LINES - 1) : 0;
        var dy = topY + k * step;
        var b = band * (1 - depth * 0.55);        // chevrons flatten as they descend
        ctx.beginPath();
        for (var i = 0; i < PTS.length; i++) {
          var px = padX + PTS[i][0] * spanX;
          var py = dy + PTS[i][1] * b;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        var lead = k < 3;                         // crisp glowing "mark" lines on top
        var wave = REDUCE ? 0.8 : 0.5 + 0.5 * Math.sin(t * 0.9 - k * 0.42);
        var base = lead ? 0.72 : (0.10 + 0.34 * (1 - depth));
        ctx.globalAlpha = Math.min(0.95, base * (0.6 + 0.4 * wave));
        ctx.strokeStyle = mix(COLORS.goldLight, COLORS.goldMuted, lead ? 0 : depth);
        ctx.lineWidth = lead ? 2.4 : (depth < 0.5 ? 1.6 : 1.05);
        ctx.shadowColor = hexA(COLORS.gold, 0.65);
        ctx.shadowBlur = lead ? 16 : (depth < 0.4 ? 4 : 0);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Outer vertical slats rising from the W's wing-tops — the logo's ascenders.
      var slatTop = topY * 0.30, slatBot = topY + band * 0.18;
      ctx.strokeStyle = COLORS.goldLight;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = hexA(COLORS.gold, 0.5);
      for (var s = 0; s < 6; s++) {
        var off = s * (spanX * 0.015), fade = 1 - s / 6;
        ctx.globalAlpha = 0.42 * fade * (REDUCE ? 1 : (0.7 + 0.3 * Math.sin(t * 0.9 - s * 0.5)));
        ctx.shadowBlur = s < 2 ? 6 : 0;
        ctx.beginPath(); ctx.moveTo(padX + off, slatTop); ctx.lineTo(padX + off, slatBot); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(W - padX - off, slatTop); ctx.lineTo(W - padX - off, slatBot); ctx.stroke();
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    if (REDUCE) draw(0);
    else registerRenderer(canvas, draw);
    canvas.__redraw = function () { if (REDUCE) draw(0); };
  }

  // ── helpers ──────────────────────────────────────────────────────────────────
  // Convert a #rrggbb (or shorthand) token to rgba() at a given alpha.
  function hexA(hex, a) {
    hex = (hex || '#c9a96e').replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    var r = parseInt(hex.substr(0, 2), 16) || 201;
    var g = parseInt(hex.substr(2, 2), 16) || 169;
    var b = parseInt(hex.substr(4, 2), 16) || 110;
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }

  // ── THEME RE-COLOUR HOOK ──────────────────────────────────────────────────────
  // Wrap the existing global toggleTheme so the field re-reads CSS vars on switch.
  (function () {
    var orig = window.toggleTheme;
    window.toggleTheme = function () {
      if (typeof orig === 'function') orig.apply(this, arguments);
      COLORS = readColors();
      document.querySelectorAll('.tw-hero-field, .tw-footer-field').forEach(function (c) {
        if (typeof c.__redraw === 'function') c.__redraw();
      });
    };
  })();

  // ════════════════════════════════════════════════════════════════════════════
  // 5. VORONOI MATERIAL BACKGROUND
  //    A faint cellular tessellation behind card sections — reads like the veining
  //    in Corian/stone and the modular logic of a panelled wall. Computed once
  //    (static SVG, zero runtime cost) by clipping the bounds with each site's
  //    perpendicular bisectors — cheap at this cell count.
  // ════════════════════════════════════════════════════════════════════════════
  function voronoiCells(sites, w, h) {
    // Sutherland–Hodgman clip of a polygon by the half-plane nx*x+ny*y <= d.
    function clip(poly, nx, ny, d) {
      var out = [], n = poly.length;
      for (var i = 0; i < n; i++) {
        var a = poly[i], b = poly[(i + 1) % n];
        var da = nx * a[0] + ny * a[1] - d, db = nx * b[0] + ny * b[1] - d;
        if (da <= 0) out.push(a);
        if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
          var t = da / (da - db);
          out.push([a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]);
        }
      }
      return out;
    }
    var cells = [];
    for (var i = 0; i < sites.length; i++) {
      var s = sites[i];
      var poly = [[0, 0], [w, 0], [w, h], [0, h]];
      for (var j = 0; j < sites.length && poly.length; j++) {
        if (i === j) continue;
        var p = sites[j];
        var nx = p[0] - s[0], ny = p[1] - s[1];
        poly = clip(poly, nx, ny, nx * (p[0] + s[0]) / 2 + ny * (p[1] + s[1]) / 2);
      }
      if (poly.length > 2) cells.push(poly);
    }
    return cells;
  }

  function initVoronoi() {
    var nodes = document.querySelectorAll('[data-parametric-bg]');
    if (!nodes.length) return;
    var NS = 'http://www.w3.org/2000/svg';
    nodes.forEach(function (node) {
      if (node.querySelector('.tw-voronoi')) return;
      var svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'tw-voronoi');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('preserveAspectRatio', 'none');
      node.insertBefore(svg, node.firstChild);

      function build() {
        var w = node.clientWidth || 1200, h = node.clientHeight || 600;
        svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
        while (svg.firstChild) svg.removeChild(svg.firstChild);
        var count = Math.max(14, Math.min(64, Math.round((w * h) / 26000)));
        var sites = [];
        for (var i = 0; i < count; i++) {
          sites.push([noise(i * 1.7 + 0.3) * w, noise(i * 2.3 + 9.1) * h]);
        }
        var d = '';
        voronoiCells(sites, w, h).forEach(function (poly) {
          d += 'M' + poly.map(function (pt) { return pt[0].toFixed(1) + ',' + pt[1].toFixed(1); }).join(' L') + 'Z ';
        });
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'tw-voronoi-path');
        svg.appendChild(path);
      }
      build();
      window.addEventListener('resize', debounce(build, 200));
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 6. PORTFOLIO SLAT-WIPE REVEAL
  //    Each project card is covered by a shutter of vertical slats that retract
  //    upward (staggered) as the card scrolls into view — like panels lifting off
  //    to reveal the work behind them.
  // ════════════════════════════════════════════════════════════════════════════
  function initPortfolio() {
    var cards = document.querySelectorAll('.portfolio-card, [data-slat-wipe]');
    if (!cards.length) return;
    var SLATS = 5;

    if (REDUCE) return; // cards just show normally

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-revealed'); io.unobserve(e.target); }
      });
    }, { threshold: 0.18 });

    cards.forEach(function (card) {
      if (card.querySelector('.tw-card-shutter')) return;
      var shutter = document.createElement('div');
      shutter.className = 'tw-card-shutter';
      shutter.setAttribute('aria-hidden', 'true');
      for (var i = 0; i < SLATS; i++) {
        var s = document.createElement('span');
        s.className = 'tw-cs';
        s.style.transitionDelay = (i * 0.06) + 's';
        shutter.appendChild(s);
      }
      card.appendChild(shutter);
      io.observe(card);
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 4. SLAT-SWEEP PAGE TRANSITION
  //    A curtain of vertical slats drops closed on internal navigation and
  //    retracts open on arrival — like wall panels being set into place.
  //    The destination is prefetched on hover / touch / focus, so the page swap
  //    under the curtain is instant; a "Loading…" sign shows while it's covered.
  //    Continuity is only shown between internal page moves (sessionStorage flag),
  //    so direct visits / refreshes load instantly with no overlay.
  // ════════════════════════════════════════════════════════════════════════════
  function initCurtain() {
    if (REDUCE) return; // no transition (or loader) under reduced motion

    var CLOSE_MS = 620;   // cover the screen for this long before swapping pages
    var OPEN_MS = 1050;   // how long the slower retract-open runs on arrival
    var SLATS = 12;

    var curtain = document.createElement('div');
    curtain.className = 'tw-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < SLATS; i++) {
      var s = document.createElement('span');
      s.className = 'tw-slat';
      curtain.appendChild(s);
    }
    // "Loading…" sign — revealed only while the outgoing page is being covered.
    var loader = document.createElement('div');
    loader.className = 'tw-curtain-loader';
    var isAr = document.documentElement.lang === 'ar' || /(^|\/)ar(\/|$)/.test(location.pathname);
    loader.innerHTML = '<span class="tw-loader-label">' + (isAr ? 'جارٍ التحميل' : 'Loading') +
      '</span><span class="tw-loader-dots"><i></i><i></i><i></i></span>';
    curtain.appendChild(loader);
    document.body.appendChild(curtain);

    // Retract open if we arrived here via an internal sweep.
    if (sessionStorage.getItem('tw_sweep')) {
      sessionStorage.removeItem('tw_sweep');
      curtain.classList.add('is-closed');
      curtain.getBoundingClientRect(); // flush so the curtain paints fully covered…
      // …then drop the <head> pre-paint cover. The curtain is now the cover (same
      // obsidian fill, higher z), so this hands off in a single frame with no gap.
      document.documentElement.removeAttribute('data-sweeping');
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          curtain.classList.add('is-opening');
          curtain.classList.remove('is-closed');
        });
      });
      setTimeout(function () { curtain.classList.remove('is-opening'); }, OPEN_MS);
    } else {
      // Not a sweep arrival — make sure no stale cover lingers.
      document.documentElement.removeAttribute('data-sweeping');
    }

    // Resolve an <a> to an internal cross-page destination, or null.
    function navUrl(a) {
      if (!a) return null;
      var href = a.getAttribute('href');
      if (!href || (a.target && a.target !== '_self') || a.hasAttribute('download')) return null;
      if (/^(#|mailto:|tel:|javascript:|wa\.me)/i.test(href)) return null;
      var url;
      try { url = new URL(a.href, location.href); } catch (_) { return null; }
      if (url.origin !== location.origin) return null;      // external → leave it
      if (url.pathname === location.pathname) return null;  // same page / anchor → ignore
      return url.href;
    }

    // Warm the destination in the background so the swap under the curtain is
    // instant. Driven by intent (hover / touch / focus) — only links the user
    // actually targets get fetched, and each at most once. Skipped on Data Saver.
    var warmed = {};
    var saveData = navigator.connection && navigator.connection.saveData;
    function prefetch(href) {
      if (!href || warmed[href] || saveData) return;
      warmed[href] = 1;
      var link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'document';
      link.href = href;
      document.head.appendChild(link);
    }
    function onIntent(e) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      prefetch(navUrl(a));
    }
    document.addEventListener('mouseover', onIntent, { passive: true });
    document.addEventListener('touchstart', onIntent, { passive: true });
    document.addEventListener('focusin', onIntent);

    // Intercept internal clicks: warm (if not already), drop the curtain with the
    // loader, then navigate once the screen is covered.
    var navigating = false;
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      var dest = navUrl(a);
      if (!dest) return;
      e.preventDefault();
      if (navigating) return;
      navigating = true;
      prefetch(dest);
      sessionStorage.setItem('tw_sweep', '1');
      curtain.classList.add('is-closing', 'is-closed', 'is-loading');
      setTimeout(function () { location.href = dest; }, CLOSE_MS);
    }, true);

    // Clear the overlay if the page is restored from bfcache (back/forward).
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) {
        curtain.classList.remove('is-closed', 'is-closing', 'is-opening', 'is-loading');
        document.documentElement.removeAttribute('data-sweeping');
      }
    });
  }

  // ── INIT ───────────────────────────────────────────────────────────────────
  function init() { initHero(); initFooter(); initVoronoi(); initPortfolio(); initCurtain(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
