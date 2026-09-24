// Catálogo de protótipos: lê prototypes/registry.json e monta os cartões com busca e filtro.

const REGISTRY_URL = 'prototypes/registry.json';
const PLATFORM_LABEL = { mobile: 'Mobile', web: 'Web' };

const listEl = document.getElementById('hub-list');
const countEl = document.getElementById('hub-count');
const searchEl = document.getElementById('hub-search');
const chips = [...document.querySelectorAll('.hub-chip')];

let prototypes = [];
const filters = { search: '', platform: '' };

function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const normalize = (value) => String(value || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function formatDate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || '');
  return match ? `${match[3]}/${match[2]}/${match[1]}` : '';
}

// Só aceita cores hexadecimais do registro (vão para um atributo style).
const safeColor = (value) => (/^#[0-9a-f]{3,8}$/i.test(value || '') ? value : '#16181d');

const ICON_PHONE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><line x1="11" y1="18" x2="13" y2="18"/></svg>';
const ICON_MONITOR = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="19" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>';
const ICON_ARROW = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

function cardHtml(p) {
  const mobile = p.platform === 'mobile';
  const tags = (p.tags || []).map((tag) => `<li>${esc(tag)}</li>`).join('');
  return `
  <article class="proto-card" style="--card-accent:${safeColor(p.accent)}" aria-labelledby="proto-${esc(p.id)}">
    <div class="proto-card__head">
      <img class="proto-card__icon" src="${esc(p.icon)}" alt="" width="48" height="48" loading="lazy">
      <div class="proto-card__titles">
        <h2 id="proto-${esc(p.id)}" class="proto-card__name">${esc(p.name)}</h2>
        <p class="proto-card__project">${esc([p.client, p.project].filter(Boolean).join(' · '))}</p>
      </div>
    </div>
    <p class="proto-card__desc">${esc(p.description)}</p>
    ${tags ? `<ul class="proto-card__tags" aria-label="Assuntos">${tags}</ul>` : ''}
    <p class="proto-card__meta">
      <span class="proto-card__platform">${mobile ? ICON_PHONE : ICON_MONITOR}${esc(PLATFORM_LABEL[p.platform] || p.platform)}</span>
      <span>v${esc(p.version)}${p.updatedAt ? ` · atualizado em ${esc(formatDate(p.updatedAt))}` : ''}</span>
    </p>
    <div class="proto-card__actions">
      <a class="hub-btn hub-btn--primary" href="${esc(p.path)}">Abrir protótipo ${ICON_ARROW}</a>
      ${mobile ? `<a class="hub-btn hub-btn--ghost" href="preview.html?p=${encodeURIComponent(p.id)}">${ICON_PHONE} Ver em moldura de celular</a>` : ''}
    </div>
  </article>`;
}

function matches(p) {
  if (filters.platform && p.platform !== filters.platform) return false;
  const q = normalize(filters.search);
  return !q || [p.name, p.client, p.project, p.description, ...(p.tags || [])].some((field) => normalize(field).includes(q));
}

function render() {
  const visible = prototypes.filter(matches);
  listEl.removeAttribute('aria-busy');
  countEl.textContent = visible.length === prototypes.length
    ? `${prototypes.length} ${prototypes.length === 1 ? 'protótipo' : 'protótipos'}`
    : `${visible.length} de ${prototypes.length} protótipos`;
  listEl.innerHTML = visible.length
    ? visible.map(cardHtml).join('')
    : `<div class="hub-empty"><p>Nenhum protótipo encontrado.</p><button type="button" class="hub-link" data-clear>Limpar filtros</button></div>`;
}

function renderError(message) {
  listEl.removeAttribute('aria-busy');
  countEl.textContent = '';
  listEl.innerHTML = `
    <div class="hub-empty" role="alert">
      <p><strong>Não foi possível carregar a lista de protótipos.</strong></p>
      <p>${esc(message)}</p>
      <button type="button" class="hub-btn hub-btn--primary" data-retry>Tentar novamente</button>
    </div>`;
}

async function load() {
  listEl.setAttribute('aria-busy', 'true');
  try {
    const response = await fetch(REGISTRY_URL, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`O servidor respondeu com HTTP ${response.status}.`);
    const data = await response.json();
    if (!Array.isArray(data.prototypes)) throw new Error('O arquivo de registro está inválido.');
    prototypes = data.prototypes;
    render();
  } catch (err) {
    console.error('[hub]', err);
    const hint = window.location.protocol === 'file:'
      ? 'Abra por um servidor: na raiz do repositório rode npm run dev.'
      : err.message;
    renderError(hint);
  }
}

searchEl.addEventListener('input', () => {
  filters.search = searchEl.value;
  render();
});

chips.forEach((chip) => chip.addEventListener('click', () => {
  filters.platform = chip.dataset.platform;
  chips.forEach((c) => {
    const active = c === chip;
    c.classList.toggle('is-active', active);
    c.setAttribute('aria-pressed', String(active));
  });
  render();
}));

listEl.addEventListener('click', (e) => {
  if (e.target.closest('[data-retry]')) load();
  if (e.target.closest('[data-clear]')) {
    filters.search = '';
    filters.platform = '';
    searchEl.value = '';
    chips.forEach((c) => {
      const active = c.dataset.platform === '';
      c.classList.toggle('is-active', active);
      c.setAttribute('aria-pressed', String(active));
    });
    render();
    searchEl.focus();
  }
});

load();
