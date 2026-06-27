/* ============================================================
   THE WALLS — parametric.js
   The "Field" — a single generative louver system that gives the
   whole site the feel of the studio's CNC-routed parametric walls.

   One field engine drives several renderers:
     1. Living Wall hero  — canvas louvers that ripple toward the cursor
     2. Contour dividers  — stacked sine ribbons that draw on when scrolled to
     3. Footer signature  — a slow undulating louver strip
     4. Slat-sweep        — a vertical-slat curtain on page navigation

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
  // 2. CONTOUR DIVIDERS
  //    Replace the flat scaleX line with stacked sine "contour" paths (think wood
  //    grain / topographic CNC passes) that draw on via stroke-dashoffset.
  // ════════════════════════════════════════════════════════════════════════════
  function initDividers() {
    var nodes = document.querySelectorAll('[data-divider], .scroll-divider');
    if (!nodes.length) return;
    var VBW = 1200, VBH = 48, LINES = 3;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-drawn'); io.unobserve(e.target); }
      });
    }, { threshold: 0, rootMargin: '-30% 0px -30% 0px' });

    nodes.forEach(function (node, idx) {
      if (node.querySelector('.tw-contour')) return;
      node.classList.add('tw-divider');
      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'tw-contour');
      svg.setAttribute('viewBox', '0 0 ' + VBW + ' ' + VBH);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('aria-hidden', 'true');
      for (var l = 0; l < LINES; l++) {
        var amp = 5 + l * 3.5;
        var freq = 0.012 + l * 0.004;
        var phase = idx * 0.7 + l * 1.3;
        var d = 'M 0 ' + VBH / 2;
        for (var x = 0; x <= VBW; x += 12) {
          var y = VBH / 2 + amp * Math.sin(x * freq + phase) + (amp * 0.4) * Math.sin(x * freq * 2.3 + phase);
          d += ' L ' + x + ' ' + y.toFixed(1);
        }
        var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        path.setAttribute('class', 'tw-contour-path tw-contour-path--' + l);
        svg.appendChild(path);
      }
      node.appendChild(svg);
      if (REDUCE) node.classList.add('is-drawn');
      else io.observe(node);
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 3. FOOTER SIGNATURE — a calm louver strip as a brand sign-off, sitewide.
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

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      var spacing = W < 640 ? 18 : 26;
      var count = Math.min(140, Math.floor(W / spacing));
      var step = W / count;
      for (var i = 0; i <= count; i++) {
        var baseX = i * step;
        ctx.beginPath();
        for (var y = 0; y <= H; y += 10) {
          var amp = 3 + 6 * (y / H);             // splay wider toward the bottom edge
          var x = baseX + amp * Math.sin(y * 0.02 + t * 0.4 + i * 0.3)
                        + 3 * (noise(i * 0.4 + t * 0.1) - 0.5);
          if (y === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = hexA(COLORS.goldMuted, 0.22 + 0.08 * Math.sin(i * 0.5 + t * 0.3));
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
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
  // 4. SLAT-SWEEP PAGE TRANSITION
  //    A curtain of vertical slats drops closed on internal navigation and
  //    retracts open on arrival — like wall panels being set into place.
  //    Continuity is only shown between internal page moves (sessionStorage flag),
  //    so direct visits / refreshes load instantly with no overlay.
  // ════════════════════════════════════════════════════════════════════════════
  function initCurtain() {
    if (REDUCE) return; // no transition under reduced motion
    var SLATS = 12;
    var curtain = document.createElement('div');
    curtain.className = 'tw-curtain';
    curtain.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < SLATS; i++) {
      var s = document.createElement('span');
      s.className = 'tw-slat';
      curtain.appendChild(s);
    }
    document.body.appendChild(curtain);

    // Retract open if we arrived here via an internal sweep.
    if (sessionStorage.getItem('tw_sweep')) {
      sessionStorage.removeItem('tw_sweep');
      curtain.classList.add('is-closed');
      curtain.getBoundingClientRect(); // flush the covered state before animating
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          curtain.classList.add('is-opening');
          curtain.classList.remove('is-closed');
        });
      });
      setTimeout(function () { curtain.classList.remove('is-opening'); }, 750);
    }

    function destFor(a, e) {
      if (!a || e.defaultPrevented || e.button !== 0 ||
          e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
      var href = a.getAttribute('href');
      if (!href || (a.target && a.target !== '_self') || a.hasAttribute('download')) return null;
      if (/^(#|mailto:|tel:|javascript:|wa\.me)/i.test(href)) return null;
      var url;
      try { url = new URL(a.href, location.href); } catch (_) { return null; }
      if (url.origin !== location.origin) return null;            // external → let it go
      if (url.pathname === location.pathname && url.hash) return null; // same-page anchor
      return url.href;
    }

    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a') : null;
      var dest = destFor(a, e);
      if (!dest) return;
      e.preventDefault();
      sessionStorage.setItem('tw_sweep', '1');
      curtain.classList.add('is-closing', 'is-closed');
      setTimeout(function () { location.href = dest; }, 480);
    }, true);

    // Clear the overlay if the page is restored from bfcache (back/forward).
    window.addEventListener('pageshow', function (ev) {
      if (ev.persisted) curtain.classList.remove('is-closed', 'is-closing', 'is-opening');
    });
  }

  // ── INIT ───────────────────────────────────────────────────────────────────
  function init() { initHero(); initDividers(); initFooter(); initCurtain(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
