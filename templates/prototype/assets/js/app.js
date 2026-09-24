// Interface do protótipo: estado, rotas (#/…), telas, ações e inicialização.
// Ponto de partida mínimo: uma lista com busca e um formulário de cadastro.

import { APP, MESSAGES } from './config.js';
import { esc, formatDateTimeBR, matchesSearch } from './utils.js';
import { ApiError, api, validateItemInput } from './api.js';

/* ---------- estado ---------- */

let state = {
  status: 'loading', // loading | ready | error
  error: null,
  db: null,
  view: 'list',
  search: '',
  form: { title: '', errors: {} },
  saving: false,
};

function setState(patch) {
  state = { ...state, ...patch };
  render();
}

let toastTimer = null;
function toast(message) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-visible'), APP.toastMs);
}

/* ---------- rotas ---------- */

const VIEWS = {
  list: { route: '', title: 'Itens', render: listView },
  create: { route: 'novo', title: 'Novo item', render: createView },
  notFound: { route: null, title: 'Página não encontrada', render: notFoundView },
};

function viewFromHash() {
  const route = window.location.hash.replace(/^#\/?/, '').replace(/\/+$/, '');
  return Object.keys(VIEWS).find((key) => VIEWS[key].route === route) || 'notFound';
}

function go(view) {
  window.location.hash = `#/${VIEWS[view].route}`;
}

/* ---------- telas ---------- */

function headerHtml() {
  return `
  <header class="topbar">
    <a class="topbar__brand" href="#/">${esc(APP.name)}</a>
    <a class="topbar__link" href="${esc(APP.hubUrl)}">Todos os protótipos</a>
  </header>`;
}

function listView() {
  const items = state.db.items.filter((item) => matchesSearch(state.search, [item.title]));
  return `
  <section class="page">
    <div class="page__header">
      <h1 id="page-title" tabindex="-1">Itens</h1>
      <a class="btn btn--primary" href="#/novo">Novo item</a>
    </div>
    <input id="search" class="input" type="search" placeholder="Buscar…" aria-label="Buscar itens" value="${esc(state.search)}" data-field="search">
    ${items.length
      ? `<ul class="list">${items.map((item) => `<li class="card"><strong>${esc(item.title)}</strong><span>${esc(formatDateTimeBR(item.createdAt))}</span></li>`).join('')}</ul>`
      : '<p class="empty">Nenhum item encontrado.</p>'}
    <button type="button" class="link" data-action="reset">Restaurar dados de exemplo</button>
  </section>`;
}

function createView() {
  const { form } = state;
  const error = form.errors.title;
  return `
  <section class="page page--narrow">
    <h1 id="page-title" tabindex="-1">Novo item</h1>
    <form class="card form" data-submit="create" novalidate>
      <label class="label" for="title">Título <span aria-hidden="true">*</span></label>
      <input id="title" class="input${error ? ' is-invalid' : ''}" value="${esc(form.title)}" data-field="form.title" maxlength="120"${error ? ' aria-invalid="true" aria-describedby="title-error"' : ''}>
      ${error ? `<p id="title-error" class="error">${esc(error)}</p>` : ''}
      <div class="actions">
        <a class="btn" href="#/">Cancelar</a>
        <button type="submit" class="btn btn--primary"${state.saving ? ' disabled' : ''}>${state.saving ? 'Salvando…' : 'Salvar'}</button>
      </div>
    </form>
  </section>`;
}

function notFoundView() {
  return `<section class="page"><h1 id="page-title" tabindex="-1">Página não encontrada</h1><a class="btn" href="#/">Voltar ao início</a></section>`;
}

function mainHtml() {
  if (state.status === 'loading') return '<p class="state" role="status">Carregando…</p>';
  if (state.status === 'error') {
    return `<section class="page"><h1 id="page-title">Não foi possível carregar os dados</h1><p>${esc(state.error)}</p><button type="button" class="btn btn--primary" data-action="retry">Tentar novamente</button></section>`;
  }
  return VIEWS[state.view].render();
}

const appEl = document.getElementById('app');

// Redesenha a tela inteira; o campo que estava em foco volta com o cursor no mesmo lugar.
function render() {
  const active = document.activeElement;
  const focus = active && active.id ? { id: active.id, start: active.selectionStart, end: active.selectionEnd } : null;
  appEl.innerHTML = `${headerHtml()}<main id="main">${mainHtml()}</main>`;
  document.title = state.view === 'list' ? APP.name : `${VIEWS[state.view].title} – ${APP.name}`;
  const el = focus && document.getElementById(focus.id);
  if (!el) return;
  el.focus();
  if (typeof focus.start === 'number' && el.setSelectionRange) el.setSelectionRange(focus.start, focus.end);
}

/* ---------- ações ---------- */

const ACTIONS = {
  retry: () => boot(),
  reset: async () => {
    if (!window.confirm('Restaurar os dados de exemplo?')) return;
    setState({ db: await api.reset(), search: '' });
    toast('Dados de exemplo restaurados.');
  },
};

const SUBMITS = {
  create: async () => {
    const errors = validateItemInput(state.form);
    if (Object.keys(errors).length) return setState({ form: { ...state.form, errors } });
    setState({ saving: true });
    try {
      await api.createItem(state.form);
      state = { ...state, db: api.snapshot(), saving: false };
      toast('Item cadastrado com sucesso!');
      go('list');
    } catch (err) {
      setState({ saving: false, form: { ...state.form, errors: (err instanceof ApiError && err.fields) || {} } });
      if (!(err instanceof ApiError && err.fields)) toast(err instanceof ApiError ? err.message : MESSAGES.unexpected);
    }
    return undefined;
  },
};

appEl.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (el && ACTIONS[el.dataset.action]) ACTIONS[el.dataset.action]();
});

appEl.addEventListener('input', (e) => {
  const path = e.target.dataset && e.target.dataset.field;
  if (!path) return;
  if (path === 'search') setState({ search: e.target.value });
  else state = { ...state, form: { ...state.form, title: e.target.value, errors: {} } };
});

appEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const handler = SUBMITS[e.target.dataset.submit];
  if (handler) handler();
});

window.addEventListener('hashchange', () => {
  if (state.status !== 'ready') return;
  const view = viewFromHash();
  setState({ view, form: view === 'create' ? { title: '', errors: {} } : state.form });
  const title = document.getElementById('page-title');
  if (title) title.focus();
});

/* ---------- inicialização ---------- */

async function boot() {
  setState({ status: 'loading' });
  try {
    const db = await api.load();
    setState({ status: 'ready', db, view: viewFromHash() });
  } catch (err) {
    console.error('[boot]', err);
    setState({ status: 'error', error: err instanceof ApiError ? err.message : MESSAGES.unexpected });
  }
}

boot();
