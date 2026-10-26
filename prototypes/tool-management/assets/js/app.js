// Interface do protótipo: estado, telas, ações e inicialização.

import { APP, IMAGE, LIMITS, LOAN_STATUS_STYLE, LOGIN, MESSAGES, TOOL_STATUS_CHART_COLOR, TOOL_STATUS_STYLE } from './config.js';
import { esc, formatDateBR, icon, imageToDataUrl, matchesSearch, todayISO } from './utils.js';
import { ApiError, api, deriveLoanStatus, dueDateRange, storageMode, validateDueDate, validateLoanInput, validateToolInput } from './api.js';

/* ---------- state ---------- */

const EMPTY_LIST = { search: '', status: null, filterOpen: false };

function emptyToolForm() {
  return {
    code: '', name: '', categoryName: '', locationName: '',
    status: 'disponivel', nextMaintenance: '', description: '',
    image: null, imageProcessing: false, errors: {},
  };
}

function emptyLoanForm() {
  return { step: 'identificar', badge: '', inspector: null, toolId: '', dueDate: '', notes: '', errors: {} };
}

// Devolução: identifica o inspetor (ID ou rosto) e lista só os empréstimos em aberto dele.
function emptyReturnForm() {
  return { step: 'identificar', badge: '', inspector: null, loanId: '', errors: {} };
}

function emptyLoginForm() {
  return { username: '', password: '', showPassword: false, errors: {} };
}

/* ---------- session ---------- */
// Sem backend de autenticação: a sessão é só uma marca no sessionStorage (dura até fechar a aba).

function readSession() {
  try {
    return window.sessionStorage.getItem(APP.sessionKey) === '1';
  } catch {
    return false;
  }
}

function writeSession(active) {
  try {
    if (active) window.sessionStorage.setItem(APP.sessionKey, '1');
    else window.sessionStorage.removeItem(APP.sessionKey);
  } catch { /* sessão só em memória */ }
}

let state = {
  status: 'loading', // loading | ready | error
  bootError: null,
  db: null,
  view: 'dashboard',
  prevView: null,
  session: readSession(),
  redirect: null, // tela pedida antes do login
  loginForm: emptyLoginForm(),
  menuOpen: false,
  toast: null, // { message, type: 'success' | 'error' | 'warning' }
  pending: null, // operação assíncrona em andamento (bloqueia envios duplicados)
  toolList: { ...EMPTY_LIST },
  loanList: { ...EMPTY_LIST },
  toolForm: emptyToolForm(),
  loanForm: emptyLoanForm(),
  returnForm: emptyReturnForm(),
};

let toastTimer = null;

function setState(patch) {
  state = { ...state, ...patch };
  render();
}

function patchForm(formKey, patch) {
  setState({ [formKey]: { ...state[formKey], ...patch } });
}

// Agenda um toast sem renderizar (útil quando uma navegação vai renderizar em seguida).
function queueToast(message, type = 'success') {
  clearTimeout(toastTimer);
  state = { ...state, toast: { message, type } };
  toastTimer = setTimeout(() => setState({ toast: null }), type === 'success' ? APP.toastMs : APP.alertToastMs);
}

function showToast(message, type) {
  queueToast(message, type);
  render();
}

/* ---------- views & navigation ---------- */

const VIEWS = {
  login:               { route: 'login',                 title: 'Login',                render: loginView,      public: true, bare: true, autofocus: '#login-username', onEnter: () => ({ loginForm: emptyLoginForm() }) },
  dashboard:          { route: '',                      title: 'Início',               render: dashboardView },
  ferramentas:         { route: 'ferramentas',           title: 'Ferramentas',          render: toolListView },
  cadastrarFerramenta: { route: 'ferramentas/cadastrar', title: 'Cadastrar Ferramenta', render: toolFormView,   parent: 'ferramentas', autofocus: '#tool-code',     onEnter: () => ({ toolForm: emptyToolForm() }) },
  emprestimos:         { route: 'emprestimos',           title: 'Empréstimos',          render: loanListView },
  novoEmprestimo:      { route: 'emprestimos/novo',      title: 'Novo Empréstimo',      render: loanFormView,   parent: 'emprestimos', autofocus: '#loan-badge',    onEnter: () => ({ loanForm: emptyLoanForm() }) },
  registrarDevolucao:  { route: 'emprestimos/devolucao', title: 'Registrar Devolução',  render: returnFormView, parent: 'emprestimos', autofocus: '#return-badge',onEnter: () => ({ returnForm: emptyReturnForm() }) },
  notFound:            { route: null,                    title: 'Página não encontrada', render: notFoundView },
};

const NAV = [
  { view: 'dashboard', label: 'Início', icon: 'home', home: true },
  { section: 'Ferramentas' },
  { view: 'ferramentas', label: 'Listar Ferramentas', icon: 'list', color: 'var(--blue)' },
  { view: 'cadastrarFerramenta', label: 'Cadastrar Ferramenta', icon: 'plusCircle', color: 'var(--teal)' },
  { section: 'Empréstimos' },
  { view: 'emprestimos', label: 'Listar Empréstimos', icon: 'list', color: 'var(--navy)' },
  { view: 'novoEmprestimo', label: 'Novo Empréstimo', icon: 'userCheck', color: 'var(--orange)' },
  { view: 'registrarDevolucao', label: 'Registrar Devolução', icon: 'checkSquare', color: 'var(--teal)' },
];

const DASHBOARD_SECTIONS = [
  {
    title: 'Gestão de Ferramentas', columns: 2, stacked: false,
    items: [
      { view: 'ferramentas', icon: 'list', tone: 'blue', title: 'Listar Ferramentas', desc: 'Visualizar todas as ferramentas cadastradas' },
      { view: 'cadastrarFerramenta', icon: 'plusCircle', tone: 'teal', title: 'Cadastrar Ferramenta', desc: 'Adicionar nova ferramenta ao sistema' },
    ],
  },
  {
    title: 'Gestão de Empréstimos', columns: 3, stacked: true,
    items: [
      { view: 'emprestimos', icon: 'list', tone: 'navy', title: 'Listar Empréstimos', desc: 'Ver histórico completo' },
      { view: 'novoEmprestimo', icon: 'userCheck', tone: 'orange', title: 'Novo Empréstimo', desc: 'Registrar empréstimo' },
      { view: 'registrarDevolucao', icon: 'checkSquare', tone: 'teal', title: 'Registrar Devolução', desc: 'Devolver ferramenta' },
    ],
  },
];

const IS_TOUCH = window.matchMedia('(pointer: coarse)').matches;

function viewFromHash() {
  let route = '';
  try {
    route = decodeURIComponent(location.hash.replace(/^#\/?/, '')).replace(/\/+$/, '');
  } catch {
    return 'notFound';
  }
  if (!route) return 'dashboard';
  return Object.keys(VIEWS).find((key) => VIEWS[key].route === route) || 'notFound';
}

function updateTitle(view) {
  document.title = view === 'dashboard' ? APP.name : `${VIEWS[view].title} – ${APP.name}`;
}

function closedFilters() {
  return {
    toolList: { ...state.toolList, filterOpen: false },
    loanList: { ...state.loanList, filterOpen: false },
  };
}

// Sem sessão, toda tela interna leva ao login (e volta para ela depois de entrar).
function resolveView(view) {
  if (!VIEWS[view]) return 'notFound';
  if (!state.session && !VIEWS[view].public) {
    state = { ...state, redirect: view === 'notFound' ? null : view };
    return 'login';
  }
  if (state.session && view === 'login') return 'dashboard';
  return view;
}

function goTo(requested, patch = {}) {
  const view = resolveView(requested);
  const def = VIEWS[view];
  const changed = view !== state.view;

  state = {
    ...state,
    ...(def.onEnter ? def.onEnter() : null),
    ...patch,
    view,
    prevView: changed && state.view !== 'notFound' ? state.view : state.prevView,
    menuOpen: false,
  };
  state = { ...state, ...closedFilters() };

  if (def.route !== null) {
    const hash = `#/${def.route}`;
    if (location.hash !== hash) location.hash = hash;
  }
  updateTitle(view);
  render();
  if (changed) window.scrollTo(0, 0);
  focusViewStart(def);
}

const stillOn = (view) => state.view === view;

// Em formulários foca o primeiro campo (útil para leitor de crachá);
// no celular foca só o título, para não abrir o teclado sozinho.
function focusViewStart(def) {
  const target = (!IS_TOUCH && def.autofocus && document.querySelector(def.autofocus)) || document.getElementById('page-title');
  if (target) target.focus({ preventScroll: true });
}

function focusElement(selector) {
  const el = document.querySelector(selector);
  if (el) el.focus({ preventScroll: true });
}

/* ---------- selectors ---------- */

function byId(table, id) {
  return state.db[table].find((row) => row.id === id) || null;
}

function labelOf(table, id) {
  const row = byId(table, id);
  return row ? row.label : id;
}

function currentUser() {
  return state.db ? byId('users', APP.currentUserId) : null;
}

function decoratedTools() {
  return state.db.tools.map((tool) => {
    const category = byId('categories', tool.categoryId);
    const location = byId('locations', tool.locationId);
    return {
      ...tool,
      categoryName: category ? category.name : 'Sem categoria',
      locationName: location ? location.name : '',
      statusLabel: labelOf('toolStatuses', tool.status),
    };
  });
}

function decoratedLoans() {
  const today = todayISO();
  return state.db.loans
    .map((loan) => {
      const status = deriveLoanStatus(loan, today);
      return {
        ...loan,
        status,
        statusLabel: labelOf('loanStatuses', status),
        tool: byId('tools', loan.toolId) || { code: '—', name: 'Ferramenta removida' },
        inspector: byId('inspectors', loan.inspectorId) || { name: 'Inspetor desconhecido', badge: '—' },
      };
    })
    .sort((a, b) => b.loanDate.localeCompare(a.loanDate) || b.id - a.id);
}

function openLoans() {
  return decoratedLoans().filter((l) => l.status !== 'devolvido');
}

function availableTools() {
  return state.db.tools.filter((t) => t.status === 'disponivel');
}

function countTools(status) {
  return state.db.tools.filter((t) => t.status === status).length;
}

function nextToolCode() {
  const max = state.db.tools.reduce((acc, t) => {
    const match = /^TRN-(\d+)$/.exec(t.code);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  return `TRN-${String(max + 1).padStart(3, '0')}`;
}

function namesOf(table) {
  return state.db[table].map((row) => row.name).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

/* ---------- markup helpers ---------- */

function optionHtml(value, label, selected) {
  return `<option value="${esc(value)}"${selected ? ' selected' : ''}>${esc(label)}</option>`;
}

function badgeHtml(label, style) {
  const s = style || { bg: 'var(--bg)', color: 'var(--muted)' };
  return `<span class="badge" style="background:${s.bg};color:${s.color};">${esc(label)}</span>`;
}

function datalistHtml(id, values) {
  return `<datalist id="${id}">${values.map((v) => `<option value="${esc(v)}"></option>`).join('')}</datalist>`;
}

// Atributos comuns dos campos: vínculo com o estado, acessibilidade e mensagens.
function fieldAttrs({ id, field, error, hint, live = false, required = false }) {
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ');
  return `id="${id}" data-field="${field}"${live ? ' data-live' : ''}${required ? ' aria-required="true"' : ''}${error ? ' aria-invalid="true"' : ''}${describedBy ? ` aria-describedby="${describedBy}"` : ''}`;
}

function formFieldHtml({ id, label, required = false, error, hint, control }) {
  return `
  <div class="form-group">
    <label class="form-label" for="${id}">${esc(label)}${required ? ' <span class="req" aria-hidden="true">*</span>' : ''}</label>
    ${control}
    ${error ? `<span id="${id}-error" class="field-error">${esc(error)}</span>` : ''}
    ${hint ? `<span id="${id}-hint" class="field-hint">${esc(hint)}</span>` : ''}
  </div>`;
}

function submitButtonHtml({ id, label, busyLabel, busy, disabled }) {
  return `<button type="submit" id="${id}" class="btn btn--primary${busy ? ' is-loading' : ''}"${busy || disabled ? ' disabled' : ''}${busy ? ' aria-busy="true"' : ''}>${esc(busy ? busyLabel : label)}</button>`;
}

function pageHeaderHtml(title, subtitle) {
  return `
  <div>
    <h1 id="page-title" class="page-title" tabindex="-1">${esc(title)}</h1>
    <p class="page-subtitle">${esc(subtitle)}</p>
  </div>`;
}

function stateCardHtml({ tone, iconName, title, text, hint = '', actions }) {
  return `
  <div class="page page--sm">
    <section class="card panel state-card">
      <span class="tile tone-${tone}">${icon(iconName, 22)}</span>
      <h1 id="page-title" class="page-title" tabindex="-1">${esc(title)}</h1>
      <p class="page-subtitle">${esc(text)}</p>
      ${hint ? `<p class="field-hint">${hint}</p>` : ''}
      <div class="form-actions">${actions}</div>
    </section>
  </div>`;
}

/* ---------- markup: shell ---------- */

function headerHtml() {
  const user = currentUser();
  return `
  <header class="topbar">
    <div class="topbar__left">
      <button type="button" id="menu-toggle" class="icon-btn icon-btn--menu" data-action="toggleMenu" aria-label="${state.menuOpen ? 'Fechar menu' : 'Abrir menu'}" aria-expanded="${state.menuOpen}"${state.status === 'ready' ? '' : ' disabled'}>
        ${icon('menu', 20, { sw: 1.9 })}
      </button>
      <button type="button" class="brand" data-action="go" data-view="dashboard" aria-label="${esc(APP.name)} – ir para o início">
        <img class="brand__logo" src="assets/img/logo.png" alt="" width="26" height="26">
        <span class="brand__name">${esc(APP.name)}</span>
      </button>
      <span class="topbar__divider" aria-hidden="true"></span>
      <span class="topbar__version">${esc(APP.version)}</span>
    </div>
    <div class="topbar__right">
      ${user ? `
      <div class="user-chip">
        ${icon('user', 16, { sw: 1.8 })}
        <span class="user-chip__name">${esc(user.name)}</span>
      </div>` : ''}
      <button type="button" class="icon-btn icon-btn--sm" data-action="logout" aria-label="Sair" title="Sair">
        ${icon('logout', 16, { sw: 1.8 })}
      </button>
    </div>
  </header>`;
}

function sidebarHtml() {
  if (!state.menuOpen || state.status !== 'ready') return '';
  const items = NAV.map((item) => (item.section ? `<div class="nav-section">${esc(item.section)}</div>` : navItemHtml(item))).join('');
  const resetting = state.pending === 'reset';
  return `
  <div class="backdrop" data-action="closeMenu"></div>
  <nav class="sidebar" aria-label="Menu principal">
    ${items}
    <div class="sidebar__footer">
      <div class="nav-section">Protótipo</div>
      <button type="button" class="nav-item" data-action="resetData"${state.pending ? ' disabled' : ''}>
        ${icon('refresh', 18, { style: 'color:var(--muted)' })}
        ${resetting ? 'Restaurando…' : 'Restaurar dados de exemplo'}
      </button>
      <a class="nav-item" href="${esc(APP.overdueEmailUrl)}" target="_blank" rel="noopener">
        ${icon('mail', 18, { style: 'color:var(--muted)' })}
        E-mail de devolução em atraso
      </a>
      <a class="nav-item" href="${esc(APP.hubUrl)}">
        ${icon('grid', 18, { style: 'color:var(--muted)' })}
        Todos os protótipos
      </a>
    </div>
  </nav>`;
}

function navItemHtml(item) {
  const active = state.view === item.view;
  const classes = ['nav-item', item.home && 'nav-item--home', active && 'is-active'].filter(Boolean).join(' ');
  return `
  <button type="button" class="${classes}" data-action="go" data-view="${item.view}"${active ? ' aria-current="page"' : ''}>
    ${icon(item.icon, 18, { style: item.color ? `color:${item.color}` : '' })}
    ${esc(item.label)}
  </button>`;
}

function toastHtml() {
  if (!state.toast) return '';
  const { message, type } = state.toast;
  return `<div class="toast toast--${type}" role="${type === 'error' ? 'alert' : 'status'}" aria-live="${type === 'error' ? 'assertive' : 'polite'}">${esc(message)}</div>`;
}

/* ---------- markup: loading & error states ---------- */

function loadingView() {
  return `
  <div class="state-screen" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <span>Carregando dados…</span>
  </div>`;
}

function bootErrorView() {
  const error = state.bootError;
  const hint = location.protocol === 'file:'
    ? 'O protótipo precisa ser aberto por um servidor: rode <code>npm run dev</code> na raiz do repositório ou use o endereço publicado na Vercel.'
    : '';
  return stateCardHtml({
    tone: 'red', iconName: 'alert',
    title: 'Não foi possível carregar os dados',
    text: error && error.message ? error.message : MESSAGES.unexpected,
    hint,
    actions: '<button type="button" class="btn btn--primary" data-action="retryBoot">Tentar novamente</button>',
  });
}

function notFoundView() {
  return stateCardHtml({
    tone: 'blue', iconName: 'search',
    title: 'Página não encontrada',
    text: 'O endereço acessado não existe ou foi movido.',
    actions: '<button type="button" class="btn btn--primary" data-action="go" data-view="dashboard">Voltar ao início</button>',
  });
}

function crashView() {
  return stateCardHtml({
    tone: 'red', iconName: 'alert',
    title: 'Algo deu errado ao exibir esta tela',
    text: 'Tente recarregar. Se o problema continuar, use “Restaurar dados de exemplo” no menu.',
    actions: `
      <button type="button" class="btn btn--secondary" data-action="go" data-view="dashboard">Voltar ao início</button>
      <button type="button" class="btn btn--primary" data-action="reload">Recarregar</button>`,
  });
}

/* ---------- markup: dashboard ---------- */

function dashboardView() {
  const user = currentUser();
  const activeLoans = decoratedLoans().filter((l) => l.status === 'ativo').length;
  const stats = [
    { value: countTools('disponivel'), label: 'Ferramentas Disponíveis', icon: 'box', tone: 'teal', view: 'ferramentas', status: 'disponivel' },
    { value: activeLoans, label: 'Empréstimos Ativos', icon: 'clipboard', tone: 'orange', view: 'emprestimos', status: 'ativo' },
    { value: countTools('em_uso'), label: 'Ferramentas Em Uso', icon: 'wrench', tone: 'blue', view: 'ferramentas', status: 'em_uso' },
    { value: countTools('manutencao'), label: 'Em Manutenção', icon: 'alert', tone: 'amber', view: 'ferramentas', status: 'manutencao' },
  ];

  return `
  <div class="page page--dashboard">
    <section class="card card--hover welcome">
      <div class="welcome__avatar">${icon('user', 26)}</div>
      <div>
        <h1 id="page-title" class="welcome__title" tabindex="-1">Olá ${esc(user ? user.name : '')}, <span class="nowrap">bem-vindo</span></h1>
        <p class="welcome__subtitle">Gestão de Ferramentas ${esc(APP.company)}</p>
      </div>
    </section>

    <div class="grid grid--4">${stats.map(statCardHtml).join('')}</div>

    ${availabilityHtml()}

    ${DASHBOARD_SECTIONS.map(dashboardSectionHtml).join('')}
  </div>`;
}

function statCardHtml(stat) {
  return `
  <button type="button" class="card card--hover stat-card" data-action="go" data-view="${stat.view}" data-status="${esc(stat.status)}">
    <span class="tile tone-${stat.tone}">${icon(stat.icon, 22)}</span>
    <span>
      <span class="stat-card__value">${stat.value}</span>
      <span class="stat-card__label">${esc(stat.label)}</span>
    </span>
  </button>`;
}

// Gráfico de rosca (% disponível) com legenda clicável e barras empilhadas por categoria.
function availabilityHtml() {
  const tools = decoratedTools();
  const total = tools.length;
  const pct = (count) => (total ? Math.round((count / total) * 100) : 0);
  const segments = state.db.toolStatuses.map((s) => {
    const count = tools.filter((t) => t.status === s.id).length;
    return { ...s, count, pct: pct(count), color: TOOL_STATUS_CHART_COLOR[s.id] || 'var(--subtle)' };
  });
  const available = segments.find((s) => s.id === 'disponivel') || { count: 0, pct: 0 };

  const R = 70;
  const C = 2 * Math.PI * R;
  const visible = segments.filter((s) => s.count);
  const gap = visible.length > 1 ? 3 : 0;
  let offset = 0;
  const arcs = visible.map((s) => {
    const len = (s.count / total) * C;
    const arc = `<circle cx="100" cy="100" r="${R}" fill="none" stroke="${s.color}" stroke-width="26" stroke-dasharray="${Math.max(len - gap, 0.1)} ${C}" stroke-dashoffset="${-offset}" transform="rotate(-90 100 100)"/>`;
    offset += len;
    return arc;
  }).join('');

  const legend = segments.map((s) => `
    <button type="button" class="legend-item" data-action="go" data-view="ferramentas" data-status="${esc(s.id)}">
      <span class="legend-item__swatch" style="background:${s.color};"></span>
      <span class="legend-item__label">${esc(s.label)}</span>
      <span class="legend-item__count">${s.count}</span>
      <span class="legend-item__pct">${s.pct}%</span>
    </button>`).join('');

  const byCategory = {};
  tools.forEach((t) => {
    const c = byCategory[t.categoryName] || (byCategory[t.categoryName] = { name: t.categoryName, total: 0, counts: {} });
    c.total += 1;
    c.counts[t.status] = (c.counts[t.status] || 0) + 1;
  });
  const bars = Object.values(byCategory)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'pt-BR'))
    .map((c) => {
      const free = c.counts.disponivel || 0;
      const segs = segments.filter((s) => c.counts[s.id])
        .map((s) => `<span title="${esc(s.label)}: ${c.counts[s.id]}" style="width:${(c.counts[s.id] / c.total) * 100}%;background:${s.color};"></span>`).join('');
      return `
      <div class="category-bar">
        <div class="category-bar__head">
          <span class="category-bar__name">${esc(c.name)}</span>
          <span class="category-bar__value">${free} de ${c.total} ${c.total === 1 ? 'disponível' : 'disponíveis'}</span>
        </div>
        <div class="category-bar__track">${segs}</div>
      </div>`;
    }).join('');

  return `
  <section class="section">
    <h2 class="section-title">Disponibilidade das Ferramentas</h2>
    <div class="card card--hover availability">
      <div class="availability__summary">
        <svg class="donut" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Disponibilidade: ${available.count} de ${total} ferramentas disponíveis">
          <circle cx="100" cy="100" r="${R}" fill="none" stroke="#eef0f3" stroke-width="26"/>
          ${total ? arcs : ''}
          <text x="100" y="100" text-anchor="middle" class="donut__value">${available.pct}%</text>
          <text x="100" y="122" text-anchor="middle" class="donut__label">disponível</text>
        </svg>
        <div class="legend">
          <div class="legend__total">${total} ${total === 1 ? 'ferramenta cadastrada' : 'ferramentas cadastradas'}</div>
          ${legend}
        </div>
      </div>
      <div class="availability__categories">
        <div class="availability__subtitle">Por categoria</div>
        ${bars || '<div class="field-hint">Nenhuma ferramenta cadastrada.</div>'}
      </div>
    </div>
  </section>`;
}

function dashboardSectionHtml(section) {
  const cards = section.items.map((item) => `
    <button type="button" class="card card--hover action-card${section.stacked ? ' action-card--stack' : ''}" data-action="go" data-view="${item.view}">
      <span class="tile tone-${item.tone}">${icon(item.icon, 22)}</span>
      <span class="action-card__body">
        <span class="action-card__title">${esc(item.title)}</span>
        <span class="action-card__desc">${esc(item.desc)}</span>
      </span>
      ${section.stacked ? '' : icon('chevronRight', 18, { sw: 1.8, cls: 'chevron' })}
    </button>`).join('');

  return `
  <section class="section">
    <h2 class="section-title">${esc(section.title)}</h2>
    <div class="grid grid--${section.columns}">${cards}</div>
  </section>`;
}

/* ---------- markup: lists ---------- */

function toolbarHtml({ list, placeholder, statuses }) {
  const { search, status, filterOpen } = state[list];
  const options = [{ id: null, label: 'Todos' }, ...statuses];
  const currentLabel = status ? (statuses.find((s) => s.id === status) || {}).label : '';
  const dropdown = !filterOpen ? '' : `
    <div class="click-away" data-action="closeFilters"></div>
    <div class="dropdown" role="menu" aria-label="Filtrar por status">
      <div class="dropdown__title">Status</div>
      ${options.map((opt, i) => `
        <button type="button" id="${list}-opt-${i}" role="menuitemradio" aria-checked="${opt.id === status}" class="dropdown__item${opt.id === status ? ' is-selected' : ''}" data-action="setFilter" data-list="${list}" data-status="${esc(opt.id || '')}">${esc(opt.label)}</button>`).join('')}
    </div>`;

  return `
  <div class="toolbar">
    <label class="searchbox">
      ${icon('search', 18, { sw: 1.8 })}
      <input id="${list}-search" type="search" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" value="${esc(search)}" data-field="${list}.search" data-live autocomplete="off">
    </label>
    <button type="button" id="${list}-filter" class="filter-btn${status ? ' is-active' : ''}" data-action="toggleFilter" data-list="${list}" aria-label="Filtrar por status${currentLabel ? ` (filtro atual: ${esc(currentLabel)})` : ''}" aria-haspopup="true" aria-expanded="${filterOpen}">
      ${icon('filter', 19, { sw: 1.8 })}
    </button>
    ${dropdown}
  </div>`;
}

function emptyStateHtml(list, message) {
  const { search, status } = state[list];
  return `
  <div class="empty-state">
    <span>${esc(message)}</span>
    ${search || status ? `<button type="button" class="link-btn" data-action="clearList" data-list="${list}">Limpar busca e filtros</button>` : ''}
  </div>`;
}

function toolListView() {
  const { search, status } = state.toolList;
  const tools = decoratedTools().filter((t) => (!status || t.status === status)
    && matchesSearch(search, [t.name, t.code, t.categoryName, t.locationName]));

  return `
  <div class="page">
    ${pageHeaderHtml('Ferramentas', 'Gerencie o inventário de ferramentas cadastradas')}
    ${toolbarHtml({ list: 'toolList', placeholder: 'Buscar ferramentas...', statuses: state.db.toolStatuses })}
    ${tools.length
      ? `<div class="grid grid--2">${tools.map(toolCardHtml).join('')}</div>`
      : emptyStateHtml('toolList', 'Nenhuma ferramenta encontrada para esse filtro.')}
  </div>`;
}

function toolCardHtml(tool) {
  const maintenance = tool.nextMaintenance ? formatDateBR(tool.nextMaintenance) : 'não agendada';
  return `
  <article class="card card--hover tool-card">
    <div class="tool-card__thumb">${tool.imageUrl ? `<img src="${esc(tool.imageUrl)}" alt="">` : icon('wrench', 22)}</div>
    <div class="tool-card__body">
      <div class="card-head">
        <h3 class="card-title">${esc(tool.name)}</h3>
        ${badgeHtml(tool.statusLabel, TOOL_STATUS_STYLE[tool.status])}
      </div>
      <div class="card-meta">Código: ${esc(tool.code)}</div>
      <div class="meta-list">
        ${metaRowHtml('tag', tool.categoryName)}
        ${metaRowHtml('pin', tool.locationName || 'Localização não informada')}
        ${metaRowHtml('calendar', `Próxima manutenção: ${maintenance}`)}
      </div>
    </div>
  </article>`;
}

function metaRowHtml(iconName, text) {
  return `<div class="meta-row">${icon(iconName, 14, { sw: 1.6 })}<span>${esc(text)}</span></div>`;
}

function loanListView() {
  const { search, status } = state.loanList;
  const loans = decoratedLoans().filter((l) => (!status || l.status === status)
    && matchesSearch(search, [l.tool.name, l.tool.code, l.inspector.name, l.inspector.badge, l.notes]));

  return `
  <div class="page">
    ${pageHeaderHtml('Empréstimos', 'Acompanhe os empréstimos de ferramentas registrados')}
    ${toolbarHtml({ list: 'loanList', placeholder: 'Buscar empréstimos...', statuses: state.db.loanStatuses })}
    ${loans.length
      ? `<div class="grid grid--2">${loans.map(loanCardHtml).join('')}</div>`
      : emptyStateHtml('loanList', 'Nenhum empréstimo encontrado para esse filtro.')}
  </div>`;
}

function loanCardHtml(loan) {
  return `
  <article class="card card--hover loan-card">
    <div class="card-head">
      <h3 class="card-title">${esc(loan.tool.name)}</h3>
      ${badgeHtml(loan.statusLabel, LOAN_STATUS_STYLE[loan.status])}
    </div>
    <div class="card-meta">Código: ${esc(loan.tool.code)}</div>
    <div class="divider"></div>
    <div class="detail-list">
      ${detailRowHtml('user', 'Inspetor:', `${loan.inspector.name} (${loan.inspector.badge})`, { strong: true })}
      ${detailRowHtml('calendar', 'Empréstimo:', formatDateBR(loan.loanDate))}
      ${detailRowHtml('clock', 'Prev. Devolução:', formatDateBR(loan.dueDate))}
      ${loan.returnedDate ? detailRowHtml('checkCircle', 'Devolvido em:', formatDateBR(loan.returnedDate)) : ''}
      ${detailRowHtml('file', 'Observações:', loan.notes || 'Sem observações', { accent: true, top: true })}
    </div>
  </article>`;
}

function detailRowHtml(iconName, label, value, { strong = false, accent = false, top = false } = {}) {
  const valueClass = ['detail-row__value', strong && 'detail-row__value--strong', accent && 'detail-row__value--accent'].filter(Boolean).join(' ');
  return `
  <div class="detail-row${top ? ' detail-row--top' : ''}">
    ${icon(iconName, 14, { sw: 1.6 })}
    <span class="detail-row__label">${esc(label)}</span>
    <span class="${valueClass}">${esc(value)}</span>
  </div>`;
}

/* ---------- markup: cadastrar ferramenta ---------- */

function toolFormView() {
  const f = state.toolForm;
  const saving = state.pending === 'createTool';
  const statuses = state.db.toolStatuses.filter((s) => s.selectableOnCreate);

  return `
  <div class="page page--form">
    ${pageHeaderHtml('Cadastrar Ferramenta', 'Adicione uma nova ferramenta ao inventário')}
    <form class="card panel" data-submit="cadastrarFerramenta" novalidate>
      <div class="grid grid--2">
        ${toolInputHtml('code', { label: 'Código', required: true, placeholder: `Ex: ${nextToolCode()}`, extraClass: 'input--upper', attrs: 'maxlength="20" autocapitalize="characters"' })}
        ${toolInputHtml('categoryName', { label: 'Categoria', required: true, placeholder: 'Ex: Instrumentos de Medição', list: 'tool-categories' })}
      </div>
      ${toolInputHtml('name', { label: 'Nome da Ferramenta', required: true, placeholder: 'Ex: Multímetro Digital', attrs: 'maxlength="120"' })}
      ${toolInputHtml('locationName', { label: 'Localização', placeholder: 'Ex: Almoxarifado Central - A1', list: 'tool-locations' })}
      <div class="grid grid--2">
        ${formFieldHtml({
          id: 'tool-status', label: 'Status Inicial', required: true, error: f.errors.status,
          hint: 'O status “Em Uso” é aplicado automaticamente ao registrar um empréstimo.',
          control: `<select ${fieldAttrs({ id: 'tool-status', field: 'toolForm.status', error: f.errors.status, hint: true, required: true })} class="input${f.errors.status ? ' is-invalid' : ''}">
            ${statuses.map((s) => optionHtml(s.id, s.label, s.id === f.status)).join('')}
          </select>`,
        })}
        ${toolInputHtml('nextMaintenance', { label: 'Próxima Manutenção', type: 'date', extraClass: 'input--muted', attrs: `min="${todayISO()}"`, hint: 'Opcional. Deixe em branco se ainda não estiver agendada.' })}
      </div>
      ${formFieldHtml({
        id: 'tool-description', label: 'Descrição', error: f.errors.description,
        control: `<textarea ${fieldAttrs({ id: 'tool-description', field: 'toolForm.description', error: f.errors.description })} class="input${f.errors.description ? ' is-invalid' : ''}" rows="4" maxlength="500" placeholder="Descrição detalhada da ferramenta...">${esc(f.description)}</textarea>`,
      })}
      ${dropzoneHtml(f)}
      <div class="form-actions form-actions--inset">
        <button type="button" class="btn btn--secondary" data-action="cancel">Cancelar</button>
        ${submitButtonHtml({ id: 'tool-submit', label: 'Cadastrar Ferramenta', busyLabel: 'Salvando…', busy: saving, disabled: f.imageProcessing })}
      </div>
    </form>
    ${datalistHtml('tool-categories', namesOf('categories'))}
    ${datalistHtml('tool-locations', namesOf('locations'))}
  </div>`;
}

function toolInputHtml(key, { label, required = false, placeholder = '', type = 'text', list = '', hint = '', extraClass = '', attrs = '' }) {
  const f = state.toolForm;
  const id = `tool-${key}`;
  const error = f.errors[key];
  const classes = ['input', extraClass, error && 'is-invalid'].filter(Boolean).join(' ');
  const control = `<input ${fieldAttrs({ id, field: `toolForm.${key}`, error, hint, required })} class="${classes}" type="${type}" value="${esc(f[key])}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ''}${list ? ` list="${list}"` : ''} autocomplete="off" ${attrs}>`;
  return formFieldHtml({ id, label, required, error, hint, control });
}

function dropzoneHtml(f) {
  const error = f.errors.image;
  const text = f.imageProcessing ? 'Processando imagem…'
    : f.image ? `Arquivo selecionado: ${f.image.name}`
    : 'Clique para fazer upload ou arraste a imagem';
  const classes = ['dropzone', error && 'is-invalid', f.imageProcessing && 'is-busy'].filter(Boolean).join(' ');

  return `
  <div class="form-group">
    <span id="tool-image-label" class="form-label">Imagem da Ferramenta</span>
    <label class="${classes}">
      ${f.image ? `<img class="dropzone__preview" src="${esc(f.image.dataUrl)}" alt="">` : icon('upload', 26)}
      <span class="dropzone__text">${esc(text)}</span>
      <span class="dropzone__btn">${icon('uploadSmall', 14)}${f.image ? 'Trocar Arquivo' : 'Selecionar Arquivo'}</span>
      <input id="tool-image" class="sr-only" type="file" accept="${IMAGE.acceptedTypes.join(',')}" aria-labelledby="tool-image-label"${error ? ' aria-invalid="true" aria-describedby="tool-image-error"' : ''}${f.imageProcessing ? ' disabled' : ''}>
    </label>
    <div class="dropzone-footer">
      ${error ? `<span id="tool-image-error" class="field-error">${esc(error)}</span>` : `<span class="field-hint">PNG, JPG, WEBP ou GIF de até ${IMAGE.maxFileMb} MB.</span>`}
      ${f.image ? '<button type="button" class="link-btn" data-action="removeImage">Remover imagem</button>' : ''}
    </div>
  </div>`;
}

/* ---------- markup: novo empréstimo ---------- */

function loanFormView() {
  const f = state.loanForm;
  const identifying = f.step === 'identificar';
  return `
  <div class="page page--md">
    ${pageHeaderHtml('Novo Empréstimo', identifying
      ? 'Identifique o inspetor para iniciar o registro do empréstimo'
      : 'Selecione a ferramenta e a previsão de devolução')}
    ${identifying ? identifyStepHtml('loanForm') : loanDetailsStepHtml(f)}
  </div>`;
}

// Formulários que começam identificando o inspetor (ID do crachá ou reconhecimento facial).
const IDENTIFY = {
  loanForm:   { view: 'novoEmprestimo',     prefix: 'loan',   next: '#loan-toolId' },
  returnForm: { view: 'registrarDevolucao', prefix: 'return', next: '#return-loanId' },
};

function identifyStepHtml(formKey) {
  const f = state[formKey];
  const { prefix } = IDENTIFY[formKey];
  const error = f.errors.badge;
  const checking = state.pending === 'findInspector';
  const recognizing = state.pending === 'recognizeFace';

  return `
  <div class="grid grid--2">
    <form class="card identify-card" data-submit="confirmId" data-form="${formKey}" novalidate>
      <h2 class="identify-card__title">Inserir ID Manualmente</h2>
      <div class="identify-card__icon">${icon('barcode', 26, { sw: 1.8 })}</div>
      <p class="identify-card__text">Digite ou escaneie o ID do inspetor</p>
      <div class="form-group">
        <label class="form-label" for="${prefix}-badge">ID do Inspetor</label>
        <div class="searchbox searchbox--field${error ? ' is-invalid' : ''}">
          ${icon('barcode', 16, { sw: 1.8 })}
          <input ${fieldAttrs({ id: `${prefix}-badge`, field: `${formKey}.badge`, error })} type="text" inputmode="numeric" autocomplete="off" maxlength="20" placeholder="Digite ou escaneie o ID" value="${esc(f.badge)}">
        </div>
        ${error ? `<span id="${prefix}-badge-error" class="field-error">${esc(error)}</span>` : ''}
      </div>
      <button type="submit" id="${prefix}-badge-submit"class="btn btn--primary btn--block mt-4${checking ? ' is-loading' : ''}"${state.pending ? ' disabled' : ''}>${checking ? 'Verificando…' : 'Confirmar Identificação'}</button>
    </form>

    <div class="card identify-card">
      <h2 class="identify-card__title">Reconhecimento Facial</h2>
      <div class="camera-box">
        ${icon('faceScan', 40, { sw: 1.6 })}
        <p class="identify-card__text">Posicione seu rosto na câmera para identificação automática</p>
        ${f.errors.face ? `<span class="field-error" role="alert">${esc(f.errors.face)}</span>` : ''}
      </div>
      <button type="button" id="${prefix}-face" class="btn btn--primary btn--block btn--bottom${recognizing ? ' is-loading' : ''}" data-action="facialRecognition" data-form="${formKey}"${state.pending ? ' disabled' : ''}${recognizing ? ' aria-busy="true"' : ''}>
        ${icon('camera', 16, { sw: 1.8 })}
        ${recognizing ? 'Reconhecendo…' : 'Iniciar Reconhecimento'}
      </button>
    </div>
  </div>`;
}

function inspectorNoticeHtml(inspector) {
  return `
    <div class="notice-success" role="status">
      <div class="notice-success__icon">${icon('user', 18, { sw: 1.8 })}</div>
      <div>
        <div class="notice-success__eyebrow">Inspetor(a) identificado(a)</div>
        <div class="notice-success__title">${esc(inspector.name)}</div>
        <div class="notice-success__meta">ID: ${esc(inspector.badge)}${inspector.department ? ` · ${esc(inspector.department)}` : ''}</div>
      </div>
    </div>`;
}

function loanDetailsStepHtml(f) {
  const tools = availableTools();
  const saving = state.pending === 'createLoan';
  const range = dueDateRange();
  const liveDueError = f.dueDate ? validateDueDate(f.dueDate) : '';
  const dueError = f.errors.dueDate || liveDueError;
  const dueHint = dueError ? '' : `Até ${LIMITS.loanMaxDays} dias: de ${formatDateBR(range.min)} a ${formatDateBR(range.max)}.`;
  const toolError = f.errors.toolId;
  const canSubmit = tools.some((t) => String(t.id) === f.toolId) && !!f.dueDate && !liveDueError;

  return `
  <div class="form-stack">
    ${inspectorNoticeHtml(f.inspector)}

    <form class="card panel" data-submit="registrarEmprestimo" novalidate>
      ${formFieldHtml({
        id: 'loan-toolId', label: 'Ferramenta', required: true, error: toolError,
        control: `<select ${fieldAttrs({ id: 'loan-toolId', field: 'loanForm.toolId', error: toolError, live: true, required: true })} class="input${toolError ? ' is-invalid' : ''}"${tools.length ? '' : ' disabled'}>
          ${optionHtml('', tools.length ? 'Selecione uma ferramenta' : 'Nenhuma ferramenta disponível no momento', false)}
          ${tools.map((t) => optionHtml(t.id, `${t.code} - ${t.name}`, String(t.id) === f.toolId)).join('')}
        </select>`,
      })}
      ${formFieldHtml({
        id: 'loan-dueDate', label: 'Previsão de Devolução', required: true, error: dueError, hint: dueHint,
        control: `<input ${fieldAttrs({ id: 'loan-dueDate', field: 'loanForm.dueDate', error: dueError, hint: dueHint, live: true, required: true })} class="input input--muted${dueError ? ' is-invalid' : ''}" type="date" min="${range.min}" max="${range.max}" value="${esc(f.dueDate)}">`,
      })}
      ${formFieldHtml({
        id: 'loan-notes', label: 'Observações', error: f.errors.notes,
        control: `<textarea ${fieldAttrs({ id: 'loan-notes', field: 'loanForm.notes', error: f.errors.notes })} class="input${f.errors.notes ? ' is-invalid' : ''}" rows="4" maxlength="500" placeholder="Observações sobre o empréstimo...">${esc(f.notes)}</textarea>`,
      })}
      <div class="form-actions form-actions--inset">
        <button type="button" class="btn btn--secondary" data-action="backToIdentify" data-form="loanForm"${saving ? ' disabled' : ''}>Voltar</button>
        ${submitButtonHtml({ id: 'loan-submit', label: 'Registrar Empréstimo', busyLabel: 'Registrando…', busy: saving, disabled: !canSubmit })}
      </div>
    </form>
  </div>`;
}

/* ---------- markup: registrar devolução ---------- */

function returnFormView() {
  const f = state.returnForm;
  const identifying = f.step === 'identificar';
  return `
  <div class="page ${identifying ? 'page--md' : 'page--sm'}">
    ${pageHeaderHtml('Registrar Devolução', identifying
      ? 'Identifique o inspetor para listar os empréstimos ativos'
      : 'Selecione o empréstimo ativo para registrar a devolução da ferramenta')}
    ${identifying ? identifyStepHtml('returnForm') : returnDetailsStepHtml(f)}
  </div>`;
}

// Lista os empréstimos em aberto do inspetor identificado, inclusive os atrasados.
function returnDetailsStepHtml(f) {
  const loans = openLoans().filter((l) => l.inspectorId === f.inspector.id);
  const selected = loans.find((l) => String(l.id) === f.loanId);
  const saving = state.pending === 'returnLoan';
  const error = f.errors.loanId;
  const optionLabel = (l) => `${l.tool.code} - ${l.tool.name}${l.status === 'atrasado' ? ' · Atrasado' : ''}`;
  const selectClass = ['input', selected && 'is-selected', error && 'is-invalid'].filter(Boolean).join(' ');

  return `
  <div class="form-stack">
    ${inspectorNoticeHtml(f.inspector)}
    <form class="card panel" data-submit="registrarDevolucao" novalidate>
      ${formFieldHtml({
        id: 'return-loanId', label: 'Empréstimo Ativo', required: true, error,
        control: `<select ${fieldAttrs({ id: 'return-loanId', field: 'returnForm.loanId', error, live: true, required: true })} class="${selectClass}"${loans.length ? '' : ' disabled'}>
          ${optionHtml('', loans.length ? 'Selecione um empréstimo' : 'Nenhum empréstimo ativo', false)}
          ${loans.map((l) => optionHtml(l.id, optionLabel(l), selected && l.id === selected.id)).join('')}
        </select>`,
      })}
      ${loans.length ? '' : '<p class="notice-muted">Este inspetor não possui empréstimos ativos para devolução.</p>'}
      ${selected ? loanSummaryHtml(selected) : ''}
      <div class="form-actions form-actions--inset">
        <button type="button" class="btn btn--secondary" data-action="backToIdentify" data-form="returnForm"${saving ? ' disabled' : ''}>Voltar</button>
        ${submitButtonHtml({ id: 'return-submit', label: 'Registrar Devolução', busyLabel: 'Registrando…', busy: saving, disabled: !selected })}
      </div>
    </form>
  </div>`;
}

function loanSummaryHtml(loan) {
  const late = loan.status === 'atrasado';
  const item = (label, value, danger = false) => `
    <div>
      <div class="summary__label">${esc(label)}</div>
      <div class="summary__value${danger ? ' summary__value--danger' : ''}">${esc(value)}</div>
    </div>`;

  return `
  <div class="summary">
    <div class="summary__title">Detalhes do Empréstimo</div>
    <div class="summary__grid">
      ${item('Ferramenta:', loan.tool.name)}
      ${item('Inspetor:', loan.inspector.name)}
      ${item('Data Empréstimo:', formatDateBR(loan.loanDate))}
      ${item('Prev. Devolução:', `${formatDateBR(loan.dueDate)}${late ? ' (atrasado)' : ''}`, late)}
    </div>
  </div>`;
}

/* ---------- markup: login ---------- */

function loginView() {
  const f = state.loginForm;
  const busy = state.pending === 'login';
  const userError = f.errors.username;
  const passError = f.errors.password;

  return `
  <div class="login">
    <section class="login__brand">
      <img class="login__mark" src="assets/img/marca-login.png" alt="" width="92">
      <p class="login__title">${esc(APP.name)}</p>
      <p class="login__subtitle">Sistema de Gestão de Ferramentas</p>
      <span class="login__version">${esc(APP.version)}</span>
    </section>

    <section class="login__panel">
      <img class="login__org" src="assets/img/ternium.png" alt="${esc(APP.company)}">
      <form class="login__box" data-submit="login" novalidate>
        <h1 id="page-title" class="login__heading" tabindex="-1">Fazer Login</h1>
        <p class="page-subtitle">Acesse a gestão de ferramentas</p>

        <div class="form-group">
          <div class="login__label-row">
            <label class="form-label" for="login-username">Usuário</label>
            <span class="login__counter" aria-hidden="true">${f.username.length}/${LIMITS.usernameMax}</span>
          </div>
          <div class="searchbox searchbox--field${userError ? ' is-invalid' : ''}">
            ${icon('user', 16, { sw: 1.8 })}
            <input ${fieldAttrs({ id: 'login-username', field: 'loginForm.username', error: userError, live: true, required: true })} type="text" maxlength="${LIMITS.usernameMax}" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Digite seu usuário 8ID" value="${esc(f.username)}">
          </div>
          ${userError ? `<span id="login-username-error" class="field-error">${esc(userError)}</span>` : ''}
        </div>

        <div class="form-group">
          <div class="login__label-row">
            <label class="form-label" for="login-password">Senha</label>
            <a class="login__forgot" href="${esc(LOGIN.forgotPasswordUrl)}" target="_blank" rel="noopener noreferrer">Esqueci minha senha</a>
          </div>
          <div class="searchbox searchbox--field${passError ? ' is-invalid' : ''}">
            ${icon('lock', 16, { sw: 1.8 })}
            <input ${fieldAttrs({ id: 'login-password', field: 'loginForm.password', error: passError, required: true })} type="${f.showPassword ? 'text' : 'password'}" autocomplete="current-password" placeholder="Digite sua senha" value="${esc(f.password)}">
            <button type="button" id="login-toggle-password" class="icon-btn icon-btn--sm" data-action="togglePassword" aria-label="${f.showPassword ? 'Ocultar senha' : 'Mostrar senha'}" aria-pressed="${f.showPassword}">
              ${icon(f.showPassword ? 'eyeOff' : 'eye', 18, { sw: 1.8 })}
            </button>
          </div>
          ${passError ? `<span id="login-password-error" class="field-error">${esc(passError)}</span>` : ''}
        </div>

        <button type="submit" id="login-submit" class="btn btn--primary btn--block login__submit${busy ? ' is-loading' : ''}"${state.pending ? ' disabled' : ''}${busy ? ' aria-busy="true"' : ''}>${busy ? 'Entrando…' : 'Entrar'}</button>
        <p class="field-hint login__hint">Protótipo: qualquer usuário e senha entram.</p>
        <a class="login__hub" href="${esc(APP.hubUrl)}">${icon('grid', 14, { sw: 1.8 })}Todos os protótipos</a>
      </form>
    </section>
  </div>`;
}

/* ---------- error handling ---------- */

let reporting = false;

// Erro inesperado (bug): registra no console e avisa o usuário sem derrubar a tela.
function reportUnexpected(err) {
  console.error('[app]', err);
  if (reporting || state.status !== 'ready') return;
  reporting = true;
  try {
    showToast(MESSAGES.unexpected, 'error');
  } catch (renderErr) {
    console.error('[app] Falha ao exibir o erro.', renderErr);
  } finally {
    reporting = false;
  }
}

// Erro de operação: mensagens de campo vão para o formulário; o resto vira toast.
function handleError(err, { form, prefix, alias = {} } = {}) {
  if (!(err instanceof ApiError)) {
    reportUnexpected(err);
    return;
  }
  if (state.db) state = { ...state, db: api.snapshot() }; // reflete mudanças feitas por outra operação

  const fields = err.fields ? Object.fromEntries(Object.entries(err.fields).map(([k, v]) => [alias[k] || k, v])) : null;
  const visibleFields = fields && form ? Object.keys(fields).filter((key) => document.getElementById(`${prefix}-${key}`)) : [];

  if (visibleFields.length) {
    showFieldErrors(form, prefix, fields);
    if (err.status === 409) showToast(err.message, 'error');
  } else {
    showToast(err.message, 'error');
  }
}

function showFieldErrors(form, prefix, errors) {
  patchForm(form, { errors: { ...state[form].errors, ...errors } });
  const first = Object.keys(errors).find((key) => errors[key]);
  if (first) focusElement(`#${prefix}-${first}`);
}

// Executa uma operação assíncrona marcando-a como pendente (desabilita botões, evita duplo envio).
async function withPending(key, task) {
  if (state.pending) return;
  setState({ pending: key });
  try {
    await task();
  } finally {
    if (state.pending === key) setState({ pending: null });
  }
}

/* ---------- actions ---------- */

const ACTIONS = {
  toggleMenu: () => setState({ menuOpen: !state.menuOpen, ...closedFilters() }),
  closeMenu: () => setState({ menuOpen: false }),
  logout: () => {
    writeSession(false);
    state = { ...state, session: false, redirect: null };
    goTo('login');
  },
  togglePassword: () => patchForm('loginForm', { showPassword: !state.loginForm.showPassword }),
  reload: () => window.location.reload(),
  retryBoot: () => boot(),

  go: ({ view, status }) => {
    if (state.status !== 'ready') return;
    const patch = {};
    if (view === 'ferramentas') patch.toolList = { ...EMPTY_LIST, status: status || null };
    if (view === 'emprestimos') patch.loanList = { ...EMPTY_LIST, status: status || null };
    goTo(view, patch);
  },

  cancel: () => goTo(state.prevView || VIEWS[state.view].parent || 'dashboard'),

  toggleFilter: ({ list }) => {
    const opening = !state[list].filterOpen;
    setState({ ...closedFilters(), [list]: { ...state[list], filterOpen: opening } });
    if (opening) focusElement(`#${list}-opt-0`);
  },

  setFilter: ({ list, status }) => {
    setState({ [list]: { ...state[list], status: status || null, filterOpen: false } });
    focusElement(`#${list}-filter`);
  },

  closeFilters: () => setState(closedFilters()),

  clearList: ({ list }) => {
    setState({ [list]: { ...EMPTY_LIST } });
    focusElement(`#${list}-search`);
  },

  removeImage: () => {
    patchForm('toolForm', { image: null, errors: { ...state.toolForm.errors, image: null } });
    focusElement('#tool-image');
  },

  facialRecognition: ({ form }) => withPending('recognizeFace', async () => {
    const { view } = IDENTIFY[form];
    patchForm(form, { errors: {} });
    try {
      const inspector = await api.recognizeFace();
      if (stillOn(view)) identifyInspector(form, inspector);
    } catch (err) {
      if (!stillOn(view)) return;
      if (err instanceof ApiError && err.code === 'NOT_RECOGNIZED') patchForm(form, { errors: { face: err.message } });
      else handleError(err);
    }
  }),

  backToIdentify: ({ form }) => {
    setState({ [form]: form === 'loanForm' ? emptyLoanForm() : emptyReturnForm() });
    if (!IS_TOUCH) focusElement(`#${IDENTIFY[form].prefix}-badge`);
  },

  resetData: () => {
    const ok = window.confirm('Restaurar os dados de exemplo? Tudo o que foi cadastrado neste navegador será descartado.');
    if (!ok) return undefined;
    return withPending('reset', async () => {
      try {
        const db = await api.reset();
        queueToast('Dados de exemplo restaurados.');
        goTo('dashboard', { db, pending: null, toolList: { ...EMPTY_LIST }, loanList: { ...EMPTY_LIST } });
      } catch (err) {
        handleError(err);
      }
    });
  },
};

function identifyInspector(form, inspector) {
  setState({ pending: null, [form]: { ...state[form], step: 'formulario', inspector, errors: {} } });
  if (!IS_TOUCH) focusElement(IDENTIFY[form].next);
}

function toolInputFromForm(f) {
  return {
    code: f.code,
    name: f.name,
    categoryName: f.categoryName,
    locationName: f.locationName,
    status: f.status,
    nextMaintenance: f.nextMaintenance,
    description: f.description,
    imageUrl: f.image ? f.image.dataUrl : null,
  };
}

const SUBMITS = {
  cadastrarFerramenta: () => {
    const f = state.toolForm;
    if (f.imageProcessing) return undefined;
    const input = toolInputFromForm(f);
    const errors = validateToolInput(input, state.db);
    if (errors.imageUrl) { errors.image = errors.imageUrl; delete errors.imageUrl; }
    if (Object.keys(errors).length) return showFieldErrors('toolForm', 'tool', errors);

    return withPending('createTool', async () => {
      try {
        await api.createTool(input);
        queueToast('Ferramenta cadastrada com sucesso!');
        if (stillOn('cadastrarFerramenta')) goTo('ferramentas', { db: api.snapshot(), pending: null, toolList: { ...EMPTY_LIST } });
        else setState({ db: api.snapshot() });
      } catch (err) {
        handleError(err, { form: 'toolForm', prefix: 'tool', alias: { imageUrl: 'image' } });
      }
    });
  },

  login: () => {
    const { username, password } = state.loginForm;
    const errors = {};
    if (!username.trim()) errors.username = MESSAGES.required;
    if (!password) errors.password = MESSAGES.required;
    if (Object.keys(errors).length) return showFieldErrors('loginForm', 'login', errors);

    return withPending('login', async () => {
      try {
        await api.login({ username, password });
        if (!stillOn('login')) return;
        writeSession(true);
        const target = state.redirect || 'dashboard';
        state = { ...state, session: true, redirect: null, pending: null };
        goTo(target);
      } catch (err) {
        if (stillOn('login')) handleError(err, { form: 'loginForm', prefix: 'login' });
      }
    });
  },

  confirmId: ({ form }) => {
    const { view, prefix } = IDENTIFY[form];
    const badge = state[form].badge.trim();
    if (!badge) return showFieldErrors(form, prefix, { badge: MESSAGES.badgeRequired });

    return withPending('findInspector', async () => {
      try {
        const inspector = await api.findInspectorByBadge(badge);
        if (stillOn(view)) identifyInspector(form, inspector);
      } catch (err) {
        if (stillOn(view)) handleError(err, { form, prefix });
      }
    });
  },

  registrarEmprestimo: () => {
    const f = state.loanForm;
    const input = { inspectorId: f.inspector.id, toolId: Number(f.toolId) || null, dueDate: f.dueDate, notes: f.notes };
    const errors = validateLoanInput(input, state.db);
    if (Object.keys(errors).length) return showFieldErrors('loanForm', 'loan', errors);

    return withPending('createLoan', async () => {
      try {
        await api.createLoan(input);
        queueToast('Empréstimo registrado com sucesso!');
        if (stillOn('novoEmprestimo')) goTo('emprestimos', { db: api.snapshot(), pending: null, loanList: { ...EMPTY_LIST } });
        else setState({ db: api.snapshot() });
      } catch (err) {
        handleError(err, { form: 'loanForm', prefix: 'loan' });
      }
    });
  },

  registrarDevolucao: () => {
    const loanId = Number(state.returnForm.loanId);
    if (!loanId) return showFieldErrors('returnForm', 'return', { loanId: MESSAGES.required });

    return withPending('returnLoan', async () => {
      try {
        await api.returnLoan(loanId, state.returnForm.inspector.id);
        queueToast('Devolução registrada com sucesso!');
        if (stillOn('registrarDevolucao')) goTo('emprestimos', { db: api.snapshot(), pending: null, loanList: { ...EMPTY_LIST } });
        else setState({ db: api.snapshot() });
      } catch (err) {
        handleError(err, { form: 'returnForm', prefix: 'return' });
      }
    });
  },
};

// Campos com data-live re-renderizam a cada digitação (busca, selects que habilitam botões).
// Os demais só atualizam o estado, o que preserva o foco e as sugestões do datalist.
function onFieldInput(el) {
  const [group, key] = el.dataset.field.split('.');
  const current = state[group];
  const hadError = !!(current.errors && current.errors[key]);
  const next = { ...current, [key]: el.value };
  if (hadError) next.errors = { ...current.errors, [key]: null };

  if ('live' in el.dataset || hadError) setState({ [group]: next });
  else state = { ...state, [group]: next };
}

async function setToolImage(file) {
  if (!file || !stillOn('cadastrarFerramenta') || state.toolForm.imageProcessing) return;
  const setImageError = (message) => patchForm('toolForm', { imageProcessing: false, errors: { ...state.toolForm.errors, image: message } });

  if (!IMAGE.acceptedTypes.includes(file.type)) return setImageError(MESSAGES.imageType);
  if (file.size > IMAGE.maxFileMb * 1024 * 1024) return setImageError(MESSAGES.imageSize);

  patchForm('toolForm', { imageProcessing: true, errors: { ...state.toolForm.errors, image: null } });
  try {
    const dataUrl = await imageToDataUrl(file, IMAGE);
    if (!stillOn('cadastrarFerramenta')) return undefined;
    if (dataUrl.length > IMAGE.maxStoredChars) return setImageError(MESSAGES.imageTooLarge);
    patchForm('toolForm', { imageProcessing: false, image: { name: file.name, dataUrl } });
  } catch (err) {
    console.warn('[app] Falha ao processar a imagem.', err);
    if (stillOn('cadastrarFerramenta')) setImageError(MESSAGES.imageRead);
  }
  return undefined;
}

/* ---------- render ---------- */

const appEl = document.getElementById('app');

function captureFocus() {
  const el = document.activeElement;
  if (!el || !el.id) return null;
  const info = { id: el.id };
  try {
    if (typeof el.selectionStart === 'number') { info.selStart = el.selectionStart; info.selEnd = el.selectionEnd; }
  } catch { /* inputs sem seleção (date, file) */ }
  return info;
}

function restoreFocus(saved) {
  if (!saved) return;
  const el = document.getElementById(saved.id);
  if (!el) return;
  el.focus({ preventScroll: true });
  if (typeof saved.selStart === 'number' && typeof el.setSelectionRange === 'function') {
    try { el.setSelectionRange(saved.selStart, saved.selEnd); } catch { /* ignore */ }
  }
}

function mainHtml() {
  if (state.status === 'loading') return loadingView();
  if (state.status === 'error') return bootErrorView();
  try {
    return VIEWS[state.view].render();
  } catch (err) {
    console.error('[render]', err);
    return crashView();
  }
}

function render() {
  const saved = captureFocus();
  const bare = state.status === 'ready' && VIEWS[state.view].bare; // login: tela cheia, sem topo e menu
  appEl.innerHTML = `
    ${bare ? '' : headerHtml()}
    ${bare ? '' : sidebarHtml()}
    <main id="main">${mainHtml()}</main>
    ${toastHtml()}`;
  restoreFocus(saved);
}

/* ---------- events ---------- */

// Executa um handler capturando erros síncronos e assíncronos.
function run(handler, ...args) {
  try {
    const result = handler(...args);
    if (result && typeof result.catch === 'function') result.catch(reportUnexpected);
  } catch (err) {
    reportUnexpected(err);
  }
}

appEl.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const handler = ACTIONS[el.dataset.action];
  if (handler) run(handler, el.dataset, el);
});

appEl.addEventListener('input', (e) => {
  if (e.target.dataset && e.target.dataset.field) run(onFieldInput, e.target);
});

appEl.addEventListener('change', (e) => {
  if (e.target.id === 'tool-image') run(setToolImage, e.target.files && e.target.files[0]);
});

appEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const handler = SUBMITS[e.target.dataset.submit];
  if (handler) run(handler, e.target.dataset);
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || state.status !== 'ready') return;
  const openList = ['toolList', 'loanList'].find((list) => state[list].filterOpen);
  if (openList) {
    setState(closedFilters());
    focusElement(`#${openList}-filter`);
  } else if (state.menuOpen) {
    setState({ menuOpen: false });
    focusElement('#menu-toggle');
  }
});

// Arrastar e soltar imagem na área de upload. Fora dela o drop é ignorado,
// para o navegador não abrir o arquivo e perder o que foi preenchido.
document.addEventListener('dragover', (e) => {
  e.preventDefault();
  const zone = e.target.closest && e.target.closest('.dropzone');
  if (e.dataTransfer) e.dataTransfer.dropEffect = zone ? 'copy' : 'none';
  if (zone) zone.classList.add('is-dragover');
});

document.addEventListener('dragleave', (e) => {
  const zone = e.target.closest && e.target.closest('.dropzone');
  if (zone && !zone.contains(e.relatedTarget)) zone.classList.remove('is-dragover');
});

document.addEventListener('drop', (e) => {
  e.preventDefault();
  const zone = e.target.closest && e.target.closest('.dropzone');
  if (!zone) return;
  zone.classList.remove('is-dragover');
  run(setToolImage, e.dataTransfer && e.dataTransfer.files[0]);
});

// Botões voltar/avançar do navegador e links diretos (#/ferramentas, #/emprestimos/novo…).
window.addEventListener('hashchange', () => {
  if (state.status !== 'ready') return;
  const view = viewFromHash();
  if (view !== state.view) goTo(view);
});

// Rede de segurança para erros não tratados (ignora erros de extensões do navegador).
window.addEventListener('error', (e) => {
  if (e.filename && !e.filename.startsWith(window.location.origin)) return;
  reportUnexpected(e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => {
  reportUnexpected(e.reason);
});

/* ---------- boot ---------- */

async function boot() {
  setState({ status: 'loading', bootError: null });
  try {
    const db = await api.load();
    const requested = viewFromHash();
    const view = resolveView(requested);
    const def = VIEWS[view];
    state = { ...state, ...(def.onEnter ? def.onEnter() : null), db, view, status: 'ready' };
    if (view !== requested && def.route !== null) history.replaceState(null, '', `#/${def.route}`);
    if (storageMode === 'memory') queueToast(MESSAGES.storageUnavailable, 'warning');
    updateTitle(view);
    render();
  } catch (err) {
    console.error('[boot]', err);
    document.title = `Erro – ${APP.name}`;
    setState({ status: 'error', bootError: err instanceof ApiError ? err : new ApiError(MESSAGES.unexpected) });
  }
}

boot();
