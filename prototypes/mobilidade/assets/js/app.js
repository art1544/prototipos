// Ponto de entrada: rotas, desenho da tela, eventos e inicialização.

import { APP, NETWORK } from './config.js';
import { initLocale, t } from './i18n/index.js';
import { assignState, setPath, setState, state, subscribe } from './store.js';
import { currentRoute, navigate, startRouter } from './router.js';
import { ApiError, api, storageMode } from './api.js';
import { patch } from './dom.js';
import { closeDialog, showToast } from './ui.js';
import { ACTIONS, CHANGES, SUBMITS, attachPhoto, onFieldInput, reportUnexpected } from './actions.js';
import {
  defaultUi, emergencyForm, noteForm, operationForm, pickerState, registrationForm, requestForm,
} from './forms.js';
import { bootErrorView, bottomNavHtml, crashView, loadingView, notFoundView, topbarHtml } from './views/shell.js';
import { homeView, profileView } from './views/home.js';
import { notificationsView } from './views/notifications.js';
import { commonOrderView, myRequestsView, requestMenuView } from './views/requests.js';
import { emergencyView, operationView } from './views/emergency.js';
import { locationPickerView } from './views/location.js';
import { newNoteView, noteDetailView, notesView } from './views/notes.js';
import { ORDER_DETAIL_TABS, orderDetailView, ordersView } from './views/orders.js';
import { eventsOrderView, eventsView } from './views/events.js';
import { registrationView } from './views/registration.js';

/* ---------- rotas ---------- */

// Ordem importa: rotas fixas antes das com parâmetro (notas/nova antes de notas/:code).
const ROUTES = [
  { name: 'home', path: '' },
  { name: 'profile', path: 'perfil' },
  { name: 'notifications', path: 'notificacoes' },
  { name: 'orders', path: 'ordens' },
  { name: 'orderDetail', path: 'ordens/:code' },
  { name: 'request', path: 'solicitacao' },
  { name: 'commonOrder', path: 'solicitacao/ordem-comum' },
  { name: 'myRequests', path: 'solicitacao/minhas' },
  { name: 'emergency', path: 'solicitacao/emergencia' },
  { name: 'emergencyOperation', path: 'solicitacao/emergencia/operacao' },
  { name: 'emergencyLocation', path: 'solicitacao/emergencia/local' },
  { name: 'notes', path: 'notas' },
  { name: 'newNote', path: 'notas/nova' },
  { name: 'newNoteLocation', path: 'notas/nova/local' },
  { name: 'noteDetail', path: 'notas/:code' },
  { name: 'events', path: 'eventos' },
  { name: 'eventsOrder', path: 'eventos/:operation' },
  { name: 'registration', path: 'matricula' },
];

// Voltando de uma tela "filha" (detalhe, seletor), a tela mantém filtros e rascunho.
const cameFromChild = (route, previous) => !!previous && route.path !== '' && previous.path.startsWith(`${route.path}/`);
const keepOr = (route, previous, keep, patchFn) => (cameFromChild(route, previous) && keep ? null : patchFn());

// render: desenha a tela · bar: 'nav' (navegação inferior) ou 'actions' (barra própria de ações)
// title: título da aba · onEnter: estado inicial ao entrar · guard: redireciona se faltar contexto
const VIEWS = {
  home: { render: homeView, bar: 'nav' },
  profile: { render: profileView, bar: 'nav', nav: 'profile', title: () => currentUserName() },
  notifications: { render: notificationsView, bar: 'nav', title: () => t('notifications.title') },
  orders: {
    render: ordersView, bar: 'nav', title: () => t('orders.title'),
    onEnter: (route, prev) => keepOr(route, prev, state.ui.orders, () => ({ 'ui.orders': { tab: route.query.aba || 'todas', search: '' } })),
  },
  orderDetail: {
    render: orderDetailView, bar: 'nav', title: () => route().params.code,
    onEnter: (r) => ({ 'ui.orderDetail': { tab: ORDER_DETAIL_TABS.includes(r.query.aba) ? r.query.aba : 'operacoes' } }),
  },
  request: { render: requestMenuView, bar: 'nav', title: () => t('request.title') },
  commonOrder: { render: commonOrderView, bar: 'actions', title: () => t('commonOrder.title'), onEnter: () => ({ 'forms.request': requestForm() }) },
  myRequests: {
    render: myRequestsView, bar: 'nav', title: () => t('myRequests.title'),
    onEnter: () => ({ 'ui.myRequests': { tab: 'todas', search: '' } }),
  },
  emergency: {
    render: emergencyView, bar: 'actions', title: () => t('emergency.title'),
    onEnter: (r, prev) => keepOr(r, prev, state.forms.emergency, () => ({ 'forms.emergency': emergencyForm(state.db) })),
  },
  emergencyOperation: {
    render: operationView, bar: 'actions', title: () => t('operation.title'),
    guard: () => (state.forms.emergency ? null : 'solicitacao/emergencia'),
    onEnter: () => ({ 'forms.operation': operationForm(state.forms.emergency) }),
  },
  emergencyLocation: {
    render: locationPickerView, bar: 'actions', title: () => t('locationPicker.title'),
    guard: () => (state.forms.emergency ? null : 'solicitacao/emergencia'),
    onEnter: () => ({ picker: pickerState({ target: 'emergency', selected: state.forms.emergency.locationCode, returnTo: 'solicitacao/emergencia' }) }),
  },
  notes: {
    render: notesView, bar: 'nav', title: () => t('notes.title'),
    onEnter: (r, prev) => keepOr(r, prev, state.ui.notes, () => ({ 'ui.notes': { search: '' } })),
  },
  newNote: {
    render: newNoteView, bar: 'actions', title: () => t('notes.newTitle'),
    onEnter: (r, prev) => keepOr(r, prev, state.forms.note, () => ({ 'forms.note': noteForm(state.db) })),
  },
  newNoteLocation: {
    render: locationPickerView, bar: 'actions', title: () => t('locationPicker.title'),
    guard: () => (state.forms.note ? null : 'notas/nova'),
    onEnter: () => ({ picker: pickerState({ target: 'note', selected: state.forms.note.locationCode, returnTo: 'notas/nova' }) }),
  },
  noteDetail: { render: noteDetailView, bar: 'nav', title: () => route().params.code },
  events: {
    render: eventsView, bar: 'nav', title: () => t('events.title'),
    onEnter: (r, prev) => keepOr(r, prev, state.ui.events, () => ({ 'ui.events': { search: '' } })),
  },
  eventsOrder: {
    render: eventsOrderView, bar: 'nav', title: () => t('events.orderTitle', { operation: route().params.operation }),
    onEnter: () => ({ 'ui.eventsOrder': { tab: 'todos', search: '' } }),
  },
  registration: { render: registrationView, bar: 'actions', title: () => t('registration.title'), onEnter: () => ({ 'forms.registration': registrationForm() }) },
  notFound: { render: notFoundView, bar: 'nav', title: () => t('errors.notFoundTitle') },
};

const route = () => state.route;

function currentUserName() {
  const user = state.db && state.db.users.find((u) => u.id === APP.currentUserId);
  return user ? user.name : '';
}

/* ---------- render ---------- */

const appEl = document.getElementById('app');

function captureFocus() {
  const el = document.activeElement;
  if (!el || !el.id || !appEl.contains(el)) return null;
  const info = { id: el.id };
  try {
    if (typeof el.selectionStart === 'number') { info.selStart = el.selectionStart; info.selEnd = el.selectionEnd; }
  } catch { /* inputs sem seleção (date, number) */ }
  return info;
}

// O morph preserva o elemento focado; isto só age se ele tiver sido recriado.
function restoreFocus(saved) {
  if (!saved || (document.activeElement && document.activeElement.id === saved.id)) return;
  const el = document.getElementById(saved.id);
  if (!el) return;
  el.focus({ preventScroll: true });
  if (typeof saved.selStart === 'number' && typeof el.setSelectionRange === 'function') {
    try { el.setSelectionRange(saved.selStart, saved.selEnd); } catch { /* ignore */ }
  }
}

function currentDef() {
  return state.status === 'ready' && state.route ? VIEWS[state.route.name] || VIEWS.notFound : null;
}

function mainHtml(def) {
  if (state.status === 'loading') return { html: loadingView(), bar: 'none' };
  if (state.status === 'error') return { html: bootErrorView(), bar: 'none' };
  try {
    return { html: def.render(), bar: def.bar };
  } catch (err) {
    console.error('[render]', err);
    return { html: crashView(), bar: 'nav' };
  }
}

function updateTitle(def) {
  let title = '';
  try { title = def && def.title ? def.title() : ''; } catch { title = ''; }
  document.title = title ? `${title} – ${APP.name}` : APP.name;
}

function render() {
  const saved = captureFocus();
  const def = currentDef();
  const { html, bar } = mainHtml(def);
  patch(appEl, `
    ${topbarHtml()}
    <main id="main" class="app-main">${html}</main>
    ${bar === 'nav' ? bottomNavHtml((def && def.nav) || 'home') : ''}`);
  document.body.dataset.bar = bar;
  updateTitle(def);
  restoreFocus(saved);
}

subscribe(render);

/* ---------- navegação ---------- */

function applyPatch(patchObject) {
  if (!patchObject) return;
  Object.entries(patchObject).forEach(([path, value]) => setPath(path, value, { silent: true }));
}

function onRoute(next, { type, previous, scrollY }) {
  assignState({ route: next });
  if (state.status !== 'ready') return;

  const def = VIEWS[next.name] || VIEWS.notFound;
  const redirect = def.guard && def.guard(next);
  if (redirect !== null && redirect !== undefined) {
    navigate(redirect, { replace: true });
    return;
  }
  applyPatch(def.onEnter ? def.onEnter(next, previous) : null);
  closeDialog();
  render();

  window.scrollTo(0, type === 'pop' ? scrollY : 0);
  if (type !== 'init') {
    const title = document.getElementById('page-title');
    if (title) title.focus({ preventScroll: true });
  }
}

/* ---------- eventos ---------- */

// Executa um handler capturando erros síncronos e assíncronos.
function run(handler, ...args) {
  try {
    const result = handler(...args);
    if (result && typeof result.catch === 'function') result.catch(reportUnexpected);
  } catch (err) {
    reportUnexpected(err);
  }
}

const isModifiedClick = (e) => e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey;

appEl.addEventListener('click', (e) => {
  const actionEl = e.target.closest('[data-action]');
  if (actionEl && appEl.contains(actionEl)) {
    if (actionEl.disabled || actionEl.getAttribute('aria-disabled') === 'true') return;
    const handler = ACTIONS[actionEl.dataset.action];
    if (handler) {
      e.preventDefault();
      run(handler, { ...actionEl.dataset }, actionEl);
    }
    return;
  }
  // Links internos (#/…) passam pelo roteador para registrar a profundidade no histórico.
  const link = e.target.closest('a[href^="#/"]');
  if (link && !isModifiedClick(e) && state.status === 'ready') {
    e.preventDefault();
    navigate(link.getAttribute('href').slice(2));
  }
});

appEl.addEventListener('input', (e) => {
  const el = e.target;
  if (el.dataset && el.dataset.field) run(onFieldInput, el, { composing: e.isComposing });
});

// Teclados com composição (acentos, sugestões do Android): aplica o valor final ao terminar.
appEl.addEventListener('compositionend', (e) => {
  const el = e.target;
  if (el.dataset && el.dataset.field) run(onFieldInput, el);
});

appEl.addEventListener('change', (e) => {
  const el = e.target;
  if (el.id === 'nn-photo-input') {
    const file = el.files && el.files[0];
    el.value = ''; // permite escolher a mesma foto de novo
    run(attachPhoto, file);
    return;
  }
  const handler = el.dataset && CHANGES[el.dataset.change];
  if (handler) run(handler, el);
});

appEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const handler = SUBMITS[e.target.dataset.submit];
  if (handler) run(handler);
});

// Abas do detalhe da ordem: setas, Home e End movem entre as abas (padrão WAI-ARIA).
appEl.addEventListener('keydown', (e) => {
  const tab = e.target.closest && e.target.closest('[role="tab"]');
  if (!tab) return;
  const tabs = [...tab.parentElement.querySelectorAll('[role="tab"]')];
  const index = tabs.indexOf(tab);
  const moves = { ArrowRight: index + 1, ArrowLeft: index - 1, Home: 0, End: tabs.length - 1 };
  if (!(e.key in moves)) return;
  e.preventDefault();
  const next = tabs[(moves[e.key] + tabs.length) % tabs.length];
  run(ACTIONS.orderTab, { ...next.dataset });
});

// Rede de segurança para erros não tratados (ignora erros de extensões do navegador).
window.addEventListener('error', (e) => {
  if (e.filename && !e.filename.startsWith(window.location.origin)) return;
  reportUnexpected(e.error || e.message);
});

window.addEventListener('unhandledrejection', (e) => reportUnexpected(e.reason));

/* ---------- qualidade da rede ---------- */

function detectNetwork() {
  if (NETWORK.forced && NETWORK.levels[NETWORK.forced]) return NETWORK.forced;
  if (navigator.onLine === false) return 'sem_sinal';
  const connection = navigator.connection;
  if (!connection || !connection.effectiveType) return NETWORK.fallback;
  if (connection.effectiveType === '4g') return connection.downlink >= 10 ? 'excelente' : 'boa';
  if (connection.effectiveType === '3g') return 'regular';
  return 'ruim';
}

function watchNetwork() {
  const update = () => {
    const level = detectNetwork();
    if (level !== state.network) setState({ network: level });
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  if (navigator.connection && navigator.connection.addEventListener) navigator.connection.addEventListener('change', update);
  assignState({ network: detectNetwork() });
}

/* ---------- inicialização ---------- */

let routerStarted = false;

ACTIONS.retryBoot = () => boot();

async function boot() {
  setState({ status: 'loading', bootError: null });
  try {
    const db = await api.load();
    assignState({ db, ui: defaultUi(), forms: {}, picker: null, status: 'ready' });
    if (storageMode === 'memory') showToast(t('errors.storageUnavailable'), 'error');
    if (routerStarted) {
      onRoute(currentRoute(), { type: 'init', previous: null, scrollY: 0 });
    } else {
      routerStarted = true;
      startRouter(ROUTES, onRoute);
    }
  } catch (err) {
    console.error('[boot]', err);
    document.title = APP.name;
    setState({ status: 'error', bootError: err instanceof ApiError ? err : new ApiError('errors.unexpected') });
  }
}

initLocale();
watchNetwork();
boot();
