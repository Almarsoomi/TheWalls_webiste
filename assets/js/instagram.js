/* ─────────────────────────────────────────────────────────────
   The Walls — Instagram Reels feed (home page)

   PHASE A (now): renders MOCK reels so the section is visible while
   the backend is being set up.
   PHASE B (later): set USE_LIVE = true. The script then fetches
   /functions/v1/instagram-feed (Supabase Edge Function), which
   returns the real Reels from the Instagram Graph API. If the live
   call fails for any reason, it silently falls back to the mock set
   so the page never looks broken.

   Live response shape expected from the Edge Function:
     { items: [ { id, permalink, thumbnail_url, media_url, caption } ] }
   media_url = the .mp4 (used for hover-to-play); thumbnail_url = poster.
   ───────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  /* Live: fetches real Reels from the Supabase `instagram-feed` function.
     Mock still renders first as an instant placeholder / fallback. */
  var USE_LIVE = true;

  var FN_BASE = 'https://xpdfohzjjomrbzfatkpy.supabase.co/functions/v1';
  var PROFILE = 'https://www.instagram.com/the_walls_dubai';
  var MAX_CARDS = 8;

  /* Placeholder visual until real Reels load. */
  var MOCK_THUMB = './assets/images/placeholder-interior.svg';

  /* Mock reels — captions are bilingual; real reels use the IG caption. */
  var MOCK = [
    { id: 'm1', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Bespoke joinery — start to finish', caption_ar: 'نجارة مخصصة من البداية للنهاية' },
    { id: 'm2', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Seamless solid-surface worktops', caption_ar: 'أسطح صلبة بلا فواصل' },
    { id: 'm3', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'DIFC office reveal', caption_ar: 'افتتاح مكتب في مركز دبي المالي' },
    { id: 'm4', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Aluminium & glass detailing', caption_ar: 'تفاصيل الألمنيوم والزجاج' },
    { id: 'm5', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Inside the workshop', caption_ar: 'من داخل الورشة' },
    { id: 'm6', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Palm villa walk-through', caption_ar: 'جولة في فيلا النخلة' },
    { id: 'm7', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Custom wardrobe install', caption_ar: 'تركيب خزانة مخصصة' },
    { id: 'm8', permalink: PROFILE, thumbnail_url: MOCK_THUMB, media_url: null, caption: 'Material selection day', caption_ar: 'يوم اختيار المواد' }
  ];

  var REEL_SVG = '<svg viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M7 2l3 5M13 2l3 5M2 7h20"/><path d="M10 11l5 3-5 3z" fill="currentColor" stroke="none"/></svg>';
  var PLAY_SVG = '<svg viewBox="0 0 24 24"><polygon points="6 4 20 12 6 20 6 4"/></svg>';

  function isAr() { return document.documentElement.getAttribute('lang') === 'ar'; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function captionFor(item) {
    if (isAr() && item.caption_ar) return item.caption_ar;
    return item.caption || '';
  }

  /* Hover-to-play: lazily swap in a muted, looping <video> on enter,
     restore the poster on leave. Only runs when a media_url exists. */
  function wireHoverPlay(card, item) {
    if (!item.media_url) return;
    var video = null;
    card.addEventListener('mouseenter', function () {
      if (video) { video.play().catch(function () {}); return; }
      video = document.createElement('video');
      video.className = 'ig-card-media';
      video.src = item.media_url;
      video.muted = true; video.loop = true; video.playsInline = true;
      video.setAttribute('preload', 'none');
      if (item.thumbnail_url) video.poster = item.thumbnail_url;
      card.insertBefore(video, card.firstChild);
      video.play().catch(function () {});
    });
    card.addEventListener('mouseleave', function () {
      if (video) { video.pause(); video.currentTime = 0; }
    });
  }

  function shorten(s, n) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1).trim() + '…' : s;
  }

  function buildCard(item) {
    var caption = captionFor(item);
    var shortCap = shorten(caption, 80);
    var card = document.createElement('a');
    card.className = 'ig-card';
    card.href = item.permalink || PROFILE;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', shortCap || 'View on Instagram');

    card.innerHTML =
      '<img class="ig-card-media" src="' + esc(item.thumbnail_url || MOCK_THUMB) + '" alt="' + esc(shortCap) + '" loading="lazy" decoding="async" />' +
      '<div class="ig-badge" aria-hidden="true">' + REEL_SVG + '</div>' +
      '<div class="ig-play" aria-hidden="true"><div class="ig-play-icon">' + PLAY_SVG + '</div></div>' +
      (shortCap ? '<div class="ig-caption">' + esc(shortCap) + '</div>' : '');

    wireHoverPlay(card, item);
    return card;
  }

  function render(items) {
    var rail = document.getElementById('igFeed');
    if (!rail) return;
    rail.innerHTML = '';
    var list = (items || []).slice(0, MAX_CARDS);
    if (!list.length) {
      /* Hide the whole section if there is genuinely nothing to show. */
      var section = document.getElementById('instagram');
      if (section) section.style.display = 'none';
      return;
    }
    list.forEach(function (item) { rail.appendChild(buildCard(item)); });
  }

  async function loadLive() {
    try {
      var res = await fetch(FN_BASE + '/instagram-feed', { method: 'GET' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      if (data && Array.isArray(data.items) && data.items.length) {
        render(data.items);
        return true;
      }
    } catch (e) {
      console.warn('[instagram] live feed unavailable, using mock:', e.message);
    }
    return false;
  }

  async function init() {
    /* Show mock immediately so the section is never empty on first paint. */
    render(MOCK);
    if (USE_LIVE) { await loadLive(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Re-render captions in the right language when the user toggles EN/AR. */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('#btnEN, #btnAR');
    if (btn) { setTimeout(function () {
      var rail = document.getElementById('igFeed');
      if (rail && rail.children.length) {
        /* Cheap refresh: rebuild from whichever set is currently shown.
           Mock keeps bilingual captions; live captions are single-language. */
        if (!USE_LIVE) render(MOCK);
      }
    }, 0); }
  });
})();
