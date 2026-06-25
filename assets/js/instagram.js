/* ─────────────────────────────────────────────────────────────
   The Walls — Instagram Reels feed (home page)

   Behaviour:
   - All Reels AUTOPLAY, muted & looping, right in the page (a video wall).
     Off-screen videos pause (IntersectionObserver) to save bandwidth.
   - Clicking a Reel opens THAT specific video on Instagram in a new tab.

   Data: fetched from the Supabase `instagram-feed` Edge Function. A mock set
   renders first as an instant placeholder and as a fallback if the live call
   fails (e.g. on localhost without CORS access).
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  var USE_LIVE = true;

  var FN_BASE = 'https://xpdfohzjjomrbzfatkpy.supabase.co/functions/v1';
  var PROFILE = 'https://www.instagram.com/the_walls_dubai';
  var MAX_CARDS = 8;
  var MOCK_THUMB = './assets/images/placeholder-interior.svg';

  /* Mock reels (no video) — placeholders until the live feed loads. */
  var MOCK = [
    { id: 'm1', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Bespoke joinery — start to finish', caption_ar: 'نجارة مخصصة من البداية للنهاية' },
    { id: 'm2', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Seamless solid-surface worktops', caption_ar: 'أسطح صلبة بلا فواصل' },
    { id: 'm3', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'DIFC office reveal', caption_ar: 'افتتاح مكتب في مركز دبي المالي' },
    { id: 'm4', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Aluminium & glass detailing', caption_ar: 'تفاصيل الألمنيوم والزجاج' },
    { id: 'm5', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Inside the workshop', caption_ar: 'من داخل الورشة' },
    { id: 'm6', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Palm villa walk-through', caption_ar: 'جولة في فيلا النخلة' }
  ];

  var REEL_SVG = '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M7 2l3 5M13 2l3 5M2 7h20"/><path d="M10 11l5 3-5 3z" fill="currentColor" stroke="none"/></svg>';

  function isAr() { return document.documentElement.getAttribute('lang') === 'ar'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function captionFor(item) { return (isAr() && item.caption_ar) ? item.caption_ar : (item.caption || ''); }
  function shorten(s, n) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
  }

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Play videos only while they're in view; pause when scrolled away. */
  var playObserver = (typeof IntersectionObserver !== 'undefined')
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.play().catch(function () {}); }
          else { en.target.pause(); }
        });
      }, { threshold: 0.25 })
    : null;

  function buildCard(item) {
    var shortCap = shorten(captionFor(item), 80);
    var card = document.createElement('a');
    card.className = 'ig-card';
    card.href = item.permalink || PROFILE;     // click → this reel on Instagram
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', shortCap || 'View on Instagram');

    var media;
    if (item.media_url && !reduceMotion) {
      media = document.createElement('video');
      media.className = 'ig-card-media';
      media.src = item.media_url;
      media.muted = true; media.defaultMuted = true;
      media.loop = true; media.playsInline = true; media.autoplay = true;
      media.setAttribute('muted', ''); media.setAttribute('playsinline', '');
      media.preload = 'metadata';
      if (item.thumbnail_url) media.poster = item.thumbnail_url;
    } else {
      media = document.createElement('img');
      media.className = 'ig-card-media';
      media.src = item.thumbnail_url || MOCK_THUMB;
      media.loading = 'lazy'; media.decoding = 'async';
      media.alt = shortCap;
    }
    card.appendChild(media);

    var badge = document.createElement('div');
    badge.className = 'ig-badge';
    badge.setAttribute('aria-hidden', 'true');
    badge.innerHTML = REEL_SVG;
    card.appendChild(badge);

    if (shortCap) {
      var cap = document.createElement('div');
      cap.className = 'ig-caption';
      cap.textContent = shortCap;
      card.appendChild(cap);
    }

    if (media.tagName === 'VIDEO') {
      if (playObserver) playObserver.observe(media);
      else media.play().catch(function () {});
    }
    return card;
  }

  function render(items) {
    var rail = document.getElementById('igFeed');
    if (!rail) return;
    if (playObserver) playObserver.disconnect();
    rail.innerHTML = '';
    var list = (items || []).slice(0, MAX_CARDS);
    if (!list.length) {
      var section = document.getElementById('instagram');
      if (section) section.style.display = 'none';
      return;
    }
    list.forEach(function (item) { rail.appendChild(buildCard(item)); });
  }

  var LIVE_ITEMS = null;

  async function loadLive() {
    try {
      var res = await fetch(FN_BASE + '/instagram-feed', { method: 'GET' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length) {
        LIVE_ITEMS = data.items;
        render(LIVE_ITEMS);
        return true;
      }
    } catch (e) {
      console.warn('[instagram] live feed unavailable, using mock:', e.message);
    }
    return false;
  }

  async function init() {
    render(MOCK);                 // instant placeholder
    if (USE_LIVE) { await loadLive(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-render captions in the right language on EN/AR toggle. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('#btnEN, #btnAR');
    if (btn) setTimeout(function () {
      var rail = document.getElementById('igFeed');
      if (rail && rail.children.length) render(LIVE_ITEMS || MOCK);
    }, 0);
  });
})();
