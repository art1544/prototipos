// Ponto de entrada: rotas, desenho da tela, eventos e inicialização.

import { APP, EXECUTION, NETWORK } from './config.js';
import { initLocale, t } from './i18n/index.js';
import { assignState, setPath, setState, state, subscribe } from './store.js';
import { currentRoute, navigate, startRouter } from './router.js';
import { ApiError, api, storageMode } from './api.js';
import { patch } from './dom.js';
import { closeDialog, showToast } from './ui.js';
import { closeTip, initTooltips } from './tooltip.js';
import { hasSession } from './session.js';
import { ACTIONS, CHANGES, SUBMITS, attachPhoto, onFieldInput, reportUnexpected } from './actions.js';
import {
  EXECUTION_ACTIONS, TIP_ACTIONS, onCarouselScroll, onPointInput, onPointScale, restoreCarousels,
} from './execution.js';
import {
  defaultUi, emergencyForm, emptyBatch, loginForm, noteForm, operationForm, peopleForm, pickerState, registrationForm, requestForm,
} from './forms.js';
import { executionOf, needsRegistration, noteByCode, operationOf, orderByCode } from './model.js';
import { bootErrorView, bottomNavHtml, crashView, isLockedShell, loadingView, notFoundView, topbarHtml } from './views/shell.js';
import { loginView } from './views/login.js';
import { homeView, profileView } from './views/home.js';
import { notificationsView } from './views/notifications.js';
import { commonOrderView, myRequestsView, requestMenuView } from './views/requests.js';
import { emergencyView, operationView } from './views/emergency.js';
import { locationPickerView } from './views/location.js';
import { newNoteView, noteDetailView, notesView } from './views/notes.js';
import { ORDER_DETAIL_TABS, orderDetailView, ordersView } from './views/orders.js';
import { peopleView } from './views/people.js';
import { eventsGroupView, eventsView } from './views/events.js';
import { firstAccessView, registrationView } from './views/registration.js';

Object.assign(ACTIONS, EXECUTION_ACTIONS);
CHANGES.pointScale = onPointScale;

/* ---------- rotas ---------- */

// Ordem importa: rotas fixas antes das com parâmetro (notas/nova antes de notas/:code).
const ROUTES = [
  { name: 'login', path: 'login' },
  { name: 'firstAccess', path: 'primeiro-acesso' },
  { name: 'home', path: '' },
  { name: 'profile', path: 'perfil' },
  { name: 'notifications', path: 'notificacoes' },
  { name: 'orders', path: 'ordens' },
  { name: 'orderDetail', path: 'ordens/:code' },
  { name: 'operationPeople', path: 'ordens/:code/operacoes/:op/pessoas' },
  { name: 'operationNote', path: 'ordens/:code/operacoes/:op/nota' },
  { name: 'operationNoteLocation', path: 'ordens/:code/operacoes/:op/nota/local' },
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
  { name: 'noteEdit', path: 'notas/:code/editar' },
  { name: 'noteEditLocation', path: 'notas/:code/editar/local' },
  { name: 'events', path: 'eventos' },
  { name: 'eventsGroup', path: 'eventos/:type/:code' },
  { name: 'registration', path: 'matricula' },
];

// Voltando de uma tela "filha" (detalhe, seletor), a tela mantém filtros e rascunho.
const cameFromChild = (route, previous) => !!previous && route.path !== '' && previous.path.startsWith(`${route.path}/`);
const keepOr = (route, previous, keep, patchFn) => (cameFromChild(route, previous) && keep ? null : patchFn());

const orderPathOf = (r) => `ordens/${encodeURIComponent(r.params.code)}`;

// Operação da rota (ordens/:code/operacoes/:op/…).
function routeOperation(r) {
  const order = orderByCode(r.params.code);
  return { order, op: operationOf(order, r.params.op) };
}

function notePicker(returnTo) {
  return { picker: pickerState({ target: 'note', selected: state.forms.note.locationCode, returnTo }) };
}

// render: desenha a tela · bar: 'nav' (navegação inferior), 'actions' (barra própria de ações) ou
// 'none' · shell: 'bare' (sem barra superior) · title: título da aba · onEnter: estado inicial ao
// entrar · guard: redireciona se faltar contexto
const VIEWS = {
  login: {
    render: loginView, bar: 'none', shell: 'bare', title: () => t('login.submit'),
    onEnter: () => (state.forms.login ? null : { 'forms.login': loginForm() }),
  },
  firstAccess: {
    render: firstAccessView, bar: 'actions', title: () => t('registration.firstTitle'),
    onEnter: () => ({ 'forms.registration': registrationForm() }),
  },
  home: { render: homeView, bar: 'nav' },
  profile: { render: profileView, bar: 'nav', nav: 'profile', title: () => currentUserName() },
  notifications: { render: notificationsView, bar: 'nav', title: () => t('notifications.title') },
  orders: {
    render: ordersView, title: () => t('orders.title'),
    bar: () => (state.ui.orders.batch.active ? 'actions' : 'nav'),
    onEnter: (r, prev) => keepOr(r, prev, state.ui.orders, () => ({ 'ui.orders': { tab: r.query.aba || 'todas', search: '', batch: emptyBatch() } })),
  },
  orderDetail: {
    render: orderDetailView, bar: 'nav', title: () => route().params.code,
    onEnter: (r, prev) => keepOr(r, prev, state.ui.orderDetail, () => ({
      'ui.orderDetail': { ...defaultUi().orderDetail, tab: ORDER_DETAIL_TABS.includes(r.query.aba) ? r.query.aba : 'operacoes' },
    })),
  },
  operationPeople: {
    render: peopleView, bar: 'actions', title: () => t('people.title'),
    guard: (r) => {
      const { op } = routeOperation(r);
      if (!op) return 'ordens';
      return executionOf(op).started || r.query.iniciar === '1' ? null : orderPathOf(r);
    },
    onEnter: (r) => ({ 'forms.people': peopleForm({ orderCode: r.params.code, operation: r.params.op, start: r.query.iniciar === '1' }) }),
  },
  operationNote: {
    render: newNoteView, bar: 'actions', title: () => t('notes.newTitle'),
    guard: (r) => {
      const { op } = routeOperation(r);
      if (!op) return 'ordens';
      return executionOf(op).started ? null : orderPathOf(r);
    },
    onEnter: (r, prev) => keepOr(r, prev, state.forms.note && state.forms.note.link, () => {
      const { order } = routeOperation(r);
      const point = r.query.etapa !== undefined && r.query.etapa !== '' ? Number(r.query.etapa) : null;
      return { 'forms.note': noteForm(state.db, { link: { orderCode: order.code, operation: r.params.op, point, locationCode: order.locationCode } }) };
    }),
  },
  operationNoteLocation: {
    render: locationPickerView, bar: 'actions', title: () => t('locationPicker.title'),
    guard: (r) => (state.forms.note && state.forms.note.link ? null : orderPathOf(r)),
    onEnter: (r) => notePicker(`${orderPathOf(r)}/operacoes/${r.params.op}/nota`),
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
    onEnter: (r, prev) => keepOr(r, prev, state.forms.note && !state.forms.note.link && !state.forms.note.editCode, () => ({ 'forms.note': noteForm(state.db) })),
  },
  newNoteLocation: {
    render: locationPickerView, bar: 'actions', title: () => t('locationPicker.title'),
    guard: () => (state.forms.note ? null : 'notas/nova'),
    onEnter: () => notePicker('notas/nova'),
  },
  noteDetail: { render: noteDetailView, bar: 'nav', title: () => route().params.code },
  noteEdit: {
    render: newNoteView, bar: 'actions', title: () => t('notes.editTitle'),
    guard: (r) => (noteByCode(r.params.code) ? null : 'notas'),
    onEnter: (r, prev) => keepOr(r, prev, state.forms.note && state.forms.note.editCode === r.params.code, () => ({
      'forms.note': noteForm(state.db, { note: noteByCode(r.params.code) }),
    })),
  },
  noteEditLocation: {
    render: locationPickerView, bar: 'actions', title: () => t('locationPicker.title'),
    guard: (r) => (state.forms.note && state.forms.note.editCode === r.params.code ? null : `notas/${encodeURIComponent(r.params.code)}`),
    onEnter: (r) => notePicker(`notas/${encodeURIComponent(r.params.code)}/editar`),
  },
  events: {
    render: eventsView, bar: 'nav', title: () => t('events.title'),
    onEnter: (r, prev) => keepOr(r, prev, state.ui.events, () => ({ 'ui.events': { search: '' } })),
  },
  eventsGroup: {
    render: eventsGroupView, bar: 'nav',
    title: () => t(route().params.type === 'nota' ? 'events.noteTitle' : 'events.orderTitle', { code: route().params.code }),
    guard: (r) => (['ordem', 'nota'].includes(r.params.type) ? null : 'eventos'),
    onEnter: () => ({ 'ui.eventsGroup': { tab: 'todos', search: '' } }),
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
    return { html: def.render(), bar: typeof def.bar === 'function' ? def.bar() : def.bar };
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
  const bare = def && def.shell === 'bare';
  patch(appEl, `
    ${bare ? '' : topbarHtml({ locked: isLockedShell() })}
    <main id="main" class="app-main">${html}</main>
    ${bar === 'nav' ? bottomNavHtml((def && def.nav) || 'home') : ''}`);
  document.body.dataset.bar = bar;
  document.body.dataset.shell = bare ? 'bare' : 'app';
  updateTitle(def);
  restoreFocus(saved);
  restoreCarousels(appEl);
}

subscribe(render);

/* ---------- navegação ---------- */

function applyPatch(patchObject) {
  if (!patchObject) return;
  Object.entries(patchObject).forEach(([path, value]) => setPath(path, value, { silent: true }));
}

const fullPath = (r) => {
  const query = new URLSearchParams(r.query).toString();
  return `${r.path}${query ? `?${query}` : ''}`;
};

// Sem sessão, tudo leva ao login; sem matrícula, ao primeiro acesso. Guarda a tela pedida para depois.
function sessionRedirect(next) {
  const session = hasSession();
  if (!session) {
    if (next.name === 'login') return null;
    if (next.name !== 'notFound' && next.name !== 'firstAccess') assignState({ redirect: fullPath(next) });
    return 'login';
  }
  const pending = needsRegistration();
  if (next.name === 'login') return pending ? 'primeiro-acesso' : '';
  if (pending && next.name !== 'firstAccess') {
    if (next.name !== 'notFound') assignState({ redirect: fullPath(next) });
    return 'primeiro-acesso';
  }
  if (!pending && next.name === 'firstAccess') return '';
  return null;
}

function onRoute(next, { type, previous, scrollY }) {
  assignState({ route: next });
  if (state.status !== 'ready') return;

  const def = VIEWS[next.name] || VIEWS.notFound;
  const sessionTarget = sessionRedirect(next);
  const redirect = sessionTarget !== null ? sessionTarget : def.guard && def.guard(next);
  if (redirect !== null && redirect !== undefined) {
    navigate(redirect, { replace: true });
    return;
  }
  applyPatch(def.onEnter ? def.onEnter(next, previous) : null);
  closeDialog();
  closeTip();
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

// Toque longo (data-longpress="ação"): dispara a ação e engole o clique que vem em seguida.
let longPress = null;
let swallowClick = false;

function cancelLongPress() {
  if (longPress) clearTimeout(longPress.timer);
  longPress = null;
}

appEl.addEventListener('pointerdown', (e) => {
  const el = e.target.closest('[data-longpress]');
  if (!el || e.button > 0) return;
  cancelLongPress();
  longPress = {
    x: e.clientX,
    y: e.clientY,
    timer: setTimeout(() => {
      longPress = null;
      swallowClick = true;
      const handler = ACTIONS[el.dataset.longpress];
      if (handler) run(handler, { ...el.dataset });
    }, EXECUTION.longPressMs),
  };
});

appEl.addEventListener('pointermove', (e) => {
  if (longPress && Math.hypot(e.clientX - longPress.x, e.clientY - longPress.y) > 10) cancelLongPress();
});
['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => appEl.addEventListener(type, cancelLongPress));
appEl.addEventListener('contextmenu', (e) => {
  if (e.target.closest('[data-longpress]')) e.preventDefault();
});

appEl.addEventListener('click', (e) => {
  if (swallowClick) {
    swallowClick = false;
    e.preventDefault();
    e.stopPropagation();
  }
}, true);

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
  if (!el.dataset) return;
  if (el.dataset.field) run(onFieldInput, el, { composing: e.isComposing });
  else if ('pointInput' in el.dataset) run(onPointInput, el);
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

/* carrossel de informações da operação */

// Rolagem (toque, arrasto ou botões) atualiza abas, pontos e setas.
appEl.addEventListener('scroll', (e) => {
  if (e.target.classList && e.target.classList.contains('op-car')) onCarouselScroll(e.target);
}, true);

// Mouse (desktop): arrastar para rolar; no celular a rolagem por toque é nativa.
let drag = null;
appEl.addEventListener('pointerdown', (e) => {
  const car = e.target.closest('.op-car');
  if (!car || e.pointerType !== 'mouse' || e.target.closest('input, button, label, a')) return;
  drag = { car, x: e.clientX, left: car.scrollLeft };
  car.classList.add('is-dragging');
});
window.addEventListener('pointermove', (e) => {
  if (drag) drag.car.scrollLeft = drag.left - (e.clientX - drag.x);
});
window.addEventListener('pointerup', () => {
  if (!drag) return;
  const { car } = drag;
  drag = null;
  car.classList.remove('is-dragging');
  car.scrollTo({ left: Math.round(car.scrollLeft / car.clientWidth) * car.clientWidth, behavior: 'smooth' });
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

/* ---------- pausa automática e tempo das confirmações ---------- */

// A cada minuto: pausa operações ativas há mais de EXECUTION.autoPauseHours horas e atualiza
// as durações em curso no detalhe da ordem.
setInterval(() => {
  if (state.status !== 'ready') return;
  if (api.checkAutoPause()) setState({ db: api.snapshot() });
  else if (currentRoute() && currentRoute().name === 'orderDetail') setState({});
}, 60_000);

/* ---------- inicialização ---------- */

let routerStarted = false;

ACTIONS.retryBoot = () => boot();

async function boot() {
  setState({ status: 'loading', bootError: null });
  try {
    const db = await api.load();
    assignState({ db, ui: defaultUi(), forms: {}, picker: null, redirect: null, status: 'ready' });
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
initTooltips((action, data) => {
  const handler = TIP_ACTIONS[action];
  if (handler) run(handler, data);
});
boot();
