/* ============================================================
   THE WALLS — home.js
   Home-page-only modules (index.html). Loaded after main.js,
   ONLY on the homepage, so inner pages don't download, parse,
   or run home-specific behaviour.
   Modules: before/after slider, project search, pulse-glow.
   ============================================================ */

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

/* ── SEARCH ── */
const PROJECTS = [
  { name: 'Palm Jumeirah Villa', type: 'Residential', location: 'Palm Jumeirah', tags: 'villa joinery luxury residential', link: './pages/case-study-villa.html' },
  { name: 'DIFC Corporate HQ', type: 'Office', location: 'DIFC', tags: 'office fit-out corporate joinery', link: './pages/case-study-office.html' },
  { name: 'Dubai Hills Medical Clinic', type: 'Medical', location: 'Dubai Hills', tags: 'clinic medical healthcare fit-out', link: './pages/case-study-clinic.html' },
  { name: 'Modern Penthouse — Downtown', type: 'Residential', location: 'Downtown Dubai', tags: 'penthouse residential luxury', link: './pages/portfolio.html' },
  { name: 'Jumeirah Retail Boutique', type: 'Retail', location: 'Jumeirah', tags: 'retail boutique shop fitout', link: './pages/portfolio.html' },
  { name: 'Business Bay Apartment', type: 'Residential', location: 'Business Bay', tags: 'apartment residential modern', link: './pages/portfolio.html' },
  { name: 'JBR Hospitality Suite', type: 'Hospitality', location: 'JBR', tags: 'hotel suite hospitality luxury', link: './pages/portfolio.html' },
  { name: 'Al Barsha Restaurant', type: 'Hospitality', location: 'Al Barsha', tags: 'restaurant hospitality fit-out', link: './pages/portfolio.html' },
  { name: 'Mirdif Family Villa', type: 'Residential', location: 'Mirdif', tags: 'villa residential family joinery', link: './pages/portfolio.html' },
  { name: 'Lento Restaurant', type: 'Hospitality', location: 'Um Al Sheif', tags: 'restaurant hospitality fit-out', link: './pages/case-study-lento.html' },
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

// Self-wire the home hero search (previously called inline before main.js
// had loaded, which threw a ReferenceError — now reliably wired here).
document.addEventListener('DOMContentLoaded', function () {
  wireSearch('searchInputEN', 'searchResults');
  wireSearch('searchInputAR', 'searchResults');
});

/* ── PULSE GLOW — Before/After instruction text ─────────────────────────────── */
(function () {
  var targets = document.querySelectorAll('.shimmer-text');
  if (!targets.length) return;

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('pulse-active');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.8 });

  targets.forEach(function (el) { obs.observe(el); });
}());
