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
