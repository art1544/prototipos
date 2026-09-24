// Ações da interface: cliques (ACTIONS), envios de formulário (SUBMITS) e mudanças (CHANGES).
// Cada ação lê o estado, chama a camada de dados e atualiza o estado; as telas só desenham.

import { APP, EMERGENCY_ORDER, PHOTO } from './config.js';
import { downloadText, esc, icon, imageToDataUrl, inputToISO, todayISO } from './utils.js';
import { formatDate, setLocale, t } from './i18n/index.js';
import { assignState, getPath, isBusy, mergePath, setBusy, setPath, setState, state } from './store.js';
import { back, backTo, currentRoute, navigate } from './router.js';
import {
  ApiError, api, validateEmergencyInput, validateNoteInput, validateOperationInput, validateRegistration, validateRequestInput,
} from './api.js';
import { countEvents, currentUser, noteByCode, orderByCode } from './model.js';
import { defaultUi } from './forms.js';
import { confirmDialog, dialogHeaderHtml, openDialog, showToast } from './ui.js';

const hasErrors = (errors) => Object.keys(errors).length > 0;
const stillOn = (routeName) => currentRoute() && currentRoute().name === routeName;
const refreshDb = () => assignState({ db: api.snapshot() });

/* ---------- erros ---------- */

// Erro inesperado (bug): registra no console e avisa sem derrubar a tela.
export function reportUnexpected(err) {
  console.error('[app]', err);
  if (state.status === 'ready') showToast(t('errors.unexpected'), 'error');
}

function focusField(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.focus({ preventScroll: true });
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
}

// Mostra os erros abaixo dos campos e leva o foco ao primeiro inválido.
function showFieldErrors(form, prefix, errors) {
  mergePath(`forms.${form}`, { errors: { ...errors } });
  const first = Object.keys(errors).find((key) => errors[key] && document.getElementById(`${prefix}-${key}`));
  if (first) focusField(`${prefix}-${first}`);
  showToast(t('errors.checkFields'), 'error');
}

// Erro de operação: mensagens de campo vão para o formulário; o resto vira toast.
function handleError(err, { form, prefix } = {}) {
  if (!(err instanceof ApiError)) {
    reportUnexpected(err);
    return;
  }
  if (state.db) refreshDb(); // reflete o que mudou enquanto a operação rodava
  const fields = err.fields || {};
  const visible = form ? Object.keys(fields).filter((key) => document.getElementById(`${prefix}-${key}`)) : [];
  if (visible.length) showFieldErrors(form, prefix, fields);
  else {
    setState({});
    showToast(t(err.key, err.vars), 'error');
  }
}

// Marca a operação como em andamento (botão ocupado, sem envio duplicado) enquanto ela roda.
async function withBusy(key, task) {
  if (isBusy(key)) return;
  setBusy(key, true);
  try {
    await task();
  } finally {
    setBusy(key, false);
  }
}

// Sincronização "de fachada" (catálogos, locais, matrículas, ordens): toast de início e de fim.
function simpleSync(key, startKey, doneKey) {
  return withBusy(key, async () => {
    showToast(t(startKey));
    try {
      await api.sync();
      showToast(t(doneKey), 'success');
    } catch (err) {
      handleError(err);
    }
  });
}

/* ---------- diálogos ---------- */

function openAbout() {
  openDialog(`
    <div class="dialog__header">
      <div class="about">
        <img class="about__icon" src="assets/img/logo.png" alt="" width="44" height="44">
        <div>
          <h2 id="dialog-title" class="dialog__title">${esc(APP.name)}</h2>
          <span class="version-chip">${esc(t('shell.versionLabel', { version: APP.version, environment: APP.environment }))}</span>
        </div>
      </div>
      <button type="button" class="dialog__close" data-dialog-close="cancel" aria-label="${esc(t('common.close'))}">${icon('close')}</button>
    </div>
    <p class="dialog__meta">${esc(t('about.updatedAt', { date: formatDate(APP.releasedAt) }))}</p>
    <h3 class="dialog__section">${esc(t('about.whatsNew'))}</h3>
    <ul class="changelog">
      ${APP.changelog.map((key) => `<li>${icon('check')}<span>${esc(t(key))}</span></li>`).join('')}
    </ul>
    <button type="button" class="btn btn--secondary btn--block" data-dialog-close="cancel">${esc(t('common.close'))}</button>`);
}

function openPhoto(src, index) {
  if (!src) return;
  openDialog(`
    ${dialogHeaderHtml(t('notes.photoDialogTitle'))}
    <img class="dialog__photo" src="${esc(src)}" alt="${esc(t('notes.photoAlt', { n: index + 1 }))}">`, { variant: 'photo' });
}

/* ---------- fotos da nota ---------- */

export async function attachPhoto(file) {
  const form = state.forms.note;
  if (!file || !form || form.photoProcessing) return;
  const { draftId } = form;
  const setPhotoError = (key, vars) => mergePath('forms.note', { photoProcessing: false, errors: { ...state.forms.note.errors, photos: { key, vars } } });

  if (form.photos.length >= PHOTO.maxPerNote) return setPhotoError('validation.photoLimit', { max: PHOTO.maxPerNote });
  if (!file.type.startsWith('image/')) return setPhotoError('validation.photoType');
  if (file.size > PHOTO.maxFileMb * 1024 * 1024) return setPhotoError('validation.photoSize', { max: PHOTO.maxFileMb });

  mergePath('forms.note', { photoProcessing: true, errors: { ...form.errors, photos: null } });
  try {
    const dataUrl = await imageToDataUrl(file, PHOTO);
    const current = state.forms.note;
    if (!current || current.draftId !== draftId) return undefined; // o rascunho foi descartado
    mergePath('forms.note', { photoProcessing: false, photos: [...current.photos, dataUrl] });
    showToast(t('notes.photoAttached'), 'success');
  } catch (err) {
    console.warn('[app] Falha ao processar a foto.', err);
    if (state.forms.note && state.forms.note.draftId === draftId) setPhotoError('validation.photoRead');
  }
  return undefined;
}

/* ---------- cliques ---------- */

export const ACTIONS = {
  back: ({ fallback }) => back(fallback || ''),
  // Sem tela de login no protótipo: sair leva de volta ao catálogo de protótipos
  // (na janela principal, mesmo quando o protótipo está dentro da moldura de celular).
  logout: () => window.top.location.assign(new URL(APP.hubUrl, window.location.href).href),
  reload: () => window.location.reload(),

  setFilter: ({ path, value }) => setPath(path, value),

  clearSearch: ({ path }) => {
    setPath(path, '');
    const input = document.querySelector(`[data-field="${path}"]`);
    if (input) input.focus();
  },

  /* início */

  downloadDatabase: () => withBusy('downloadDatabase', async () => {
    showToast(t('tools.preparingDb'));
    try {
      const dump = await api.exportDatabase();
      const file = `mobilidade-banco-${todayISO()}.json`;
      downloadText(file, JSON.stringify(dump, null, 2));
      showToast(t('tools.dbExported', { file }), 'success');
    } catch (err) {
      handleError(err);
    }
  }),

  syncCatalogs: () => simpleSync('syncCatalogs', 'tools.updatingCatalogs', 'tools.catalogsUpdated'),
  syncLocations: () => simpleSync('syncLocations', 'tools.updatingLocations', 'tools.locationsUpdated'),
  syncRegistrations: () => simpleSync('syncRegistrations', 'registration.syncing', 'registration.synced'),
  refreshOrders: () => simpleSync('refreshOrders', 'orders.syncing', 'orders.synced'),

  /* perfil */

  openAbout,

  resetData: async () => {
    if (isBusy('resetData')) return;
    const ok = await confirmDialog({ title: t('profile.resetTitle'), text: t('profile.resetText'), confirmLabel: t('profile.resetConfirm'), danger: true });
    if (!ok) return;
    await withBusy('resetData', async () => {
      try {
        const db = await api.reset();
        assignState({ db, ui: defaultUi(), forms: {}, picker: null });
        showToast(t('profile.resetDone'), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },

  /* notificações */

  toggleNotification: ({ id }) => {
    const notificationId = Number(id);
    const { expanded } = state.ui.notifications;
    const next = expanded.includes(notificationId) ? expanded.filter((x) => x !== notificationId) : [...expanded, notificationId];
    try {
      api.markNotificationRead(notificationId);
    } catch (err) {
      handleError(err);
    }
    refreshDb();
    setPath('ui.notifications.expanded', next);
  },

  markAllRead: () => {
    try {
      api.markAllNotificationsRead();
    } catch (err) {
      handleError(err);
      return;
    }
    refreshDb();
    setState({});
    showToast(t('notifications.allRead'), 'success');
  },

  /* solicitações */

  refreshRequests: () => withBusy('refreshRequests', async () => {
    showToast(t('myRequests.refreshing'));
    try {
      await api.refreshRequests();
      refreshDb();
      showToast(t('myRequests.refreshed'), 'success');
    } catch (err) {
      handleError(err);
    }
  }),

  /* ordem de emergência */

  removeOperation: ({ number }) => {
    const form = state.forms.emergency;
    mergePath('forms.emergency', { operations: form.operations.filter((op) => op.number !== number) });
  },

  openLocationPicker: () => navigate(`${currentRoute().path}/local`),

  /* seletor de local */

  toggleLocation: ({ code }) => {
    const { expanded } = state.picker;
    setPath('picker.expanded', expanded.includes(code) ? expanded.filter((c) => c !== code) : [...expanded, code]);
  },

  selectLocation: ({ code }) => setPath('picker.selected', code),

  confirmLocation: () => {
    const { target, selected, returnTo } = state.picker;
    const form = state.forms[target];
    if (!selected || !form) return;
    mergePath(`forms.${target}`, { locationCode: selected, errors: { ...form.errors, locationCode: null } }, { silent: true });
    back(returnTo);
  },

  /* notas */

  addPhoto: () => {
    const input = document.getElementById('nn-photo-input');
    if (input) input.click();
  },

  removePhoto: ({ index }) => {
    const form = state.forms.note;
    mergePath('forms.note', { photos: form.photos.filter((_, i) => i !== Number(index)), errors: { ...form.errors, photos: null } });
  },

  viewPhoto: ({ source, code, index }) => {
    const photos = source === 'draft' ? state.forms.note.photos : ((noteByCode(code) || {}).photos || []);
    openPhoto(photos[Number(index)], Number(index));
  },

  /* detalhe da ordem */

  orderTab: ({ tab }) => {
    setPath('ui.orderDetail.tab', tab);
    const button = document.getElementById(`od-tab-${tab}`);
    if (button) button.focus();
  },

  downloadDocument: ({ id }) => {
    const order = orderByCode(state.route.params.code);
    const doc = order && order.documents.find((d) => d.id === Number(id));
    if (!doc) return undefined;
    return withBusy(`downloadDocument-${doc.id}`, async () => {
      showToast(t('orderDetail.downloading'));
      try {
        await api.sync();
        showToast(t('orderDetail.downloaded', { name: doc.name }), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },

  deleteDocument: async ({ id }) => {
    const order = orderByCode(state.route.params.code);
    const doc = order && order.documents.find((d) => d.id === Number(id));
    if (!doc || isBusy(`deleteDocument-${doc.id}`)) return;
    const ok = await confirmDialog({ title: t('orderDetail.deleteTitle'), text: t('orderDetail.deleteText', { name: doc.name }), confirmLabel: t('common.delete'), danger: true });
    if (!ok) return;
    await withBusy(`deleteDocument-${doc.id}`, async () => {
      try {
        await api.deleteDocument(order.id, doc.id);
        refreshDb();
        showToast(t('orderDetail.deleted'), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },

  /* eventos */

  syncEvents: () => {
    const { operation } = state.route.params;
    if (!countEvents(operation, 'pendente')) return showToast(t('events.nonePending'));
    return withBusy('syncEvents', async () => {
      showToast(t('events.syncing'));
      try {
        await api.syncEvents(operation);
        refreshDb();
        showToast(t('events.synced'), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },

  reprocessEvents: () => {
    const { operation } = state.route.params;
    if (!countEvents(operation, 'erro')) return showToast(t('events.noneError'));
    return withBusy('reprocessEvents', async () => {
      showToast(t('events.reprocessing'));
      try {
        await api.reprocessEvents(operation);
        refreshDb();
        showToast(t('events.reprocessed'), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },

  reprocessEvent: ({ id }) => withBusy(`reprocessEvent-${id}`, async () => {
    showToast(t('events.reprocessingOne'));
    try {
      await api.reprocessEvent(Number(id));
      refreshDb();
      showToast(t('events.reprocessedOne'), 'success');
    } catch (err) {
      handleError(err);
    }
  }),
};

/* ---------- formulários ---------- */

export const SUBMITS = {
  request: () => {
    const input = { orderCode: state.forms.request.orderCode };
    const errors = validateRequestInput(input, state.db);
    if (hasErrors(errors)) return showFieldErrors('request', 'rq', errors);
    return withBusy('request', async () => {
      try {
        const created = await api.createRequest(input);
        refreshDb();
        showToast(t('commonOrder.saved', { code: created.orderCode }), 'success');
        if (stillOn('commonOrder')) navigate('solicitacao/minhas', { replace: true });
      } catch (err) {
        handleError(err, { form: 'request', prefix: 'rq' });
      }
    });
  },

  emergency: () => {
    const f = state.forms.emergency;
    const input = {
      locationCode: f.locationCode,
      description: f.description,
      longText: f.longText,
      startAt: inputToISO(f.startAt),
      endAt: inputToISO(f.endAt),
      planningGroupId: f.planningGroupId,
      workCenterId: f.workCenterId,
      priority: f.priority,
      plantId: f.plantId,
      activityTypeId: f.activityTypeId,
      operations: f.operations,
    };
    const errors = validateEmergencyInput(input, state.db);
    if (hasErrors(errors)) return showFieldErrors('emergency', 'em', errors);
    return withBusy('emergency', async () => {
      try {
        const order = await api.createEmergencyOrder(input);
        refreshDb();
        showToast(t('emergency.sent', { code: order.code }), 'success');
        if (stillOn('emergency')) navigate(`ordens/${encodeURIComponent(order.code)}`, { replace: true });
      } catch (err) {
        handleError(err, { form: 'emergency', prefix: 'em' });
      }
    });
  },

  operation: () => {
    const f = state.forms.operation;
    const input = { description: f.description.trim(), longText: f.longText.trim(), plantId: f.plantId, workCenterId: f.workCenterId, people: Number(f.people) };
    const errors = validateOperationInput(input, state.db);
    if (hasErrors(errors)) return showFieldErrors('operation', 'op', errors);
    const emergency = state.forms.emergency;
    const last = emergency.operations.reduce((max, op) => Math.max(max, Number(op.number)), 0);
    const number = String(last + EMERGENCY_ORDER.operationStep).padStart(4, '0');
    mergePath('forms.emergency', {
      operations: [...emergency.operations, { number, ...input }],
      errors: { ...emergency.errors, operations: null },
    }, { silent: true });
    showToast(t('operation.added', { number }), 'success');
    return back('solicitacao/emergencia');
  },

  note: () => {
    const f = state.forms.note;
    if (f.photoProcessing) return undefined;
    const input = {
      type: f.type,
      orderNumber: f.orderNumber,
      locationCode: f.locationCode,
      description: f.description,
      longText: f.longText,
      startAt: inputToISO(f.startAt),
      endAt: inputToISO(f.endAt),
      planningGroupId: f.planningGroupId,
      workCenterId: f.workCenterId,
      failureProbability: f.failureProbability,
      maintenanceImpact: f.maintenanceImpact,
      priority: f.priority,
      photos: f.photos,
    };
    const errors = validateNoteInput(input, state.db);
    if (hasErrors(errors)) return showFieldErrors('note', 'nn', errors);
    return withBusy('note', async () => {
      try {
        const note = await api.createNote(input);
        refreshDb();
        setPath('ui.notes.search', '', { silent: true }); // a nota nova precisa aparecer na lista
        showToast(t('notes.saved', { code: note.code }), 'success');
        if (stillOn('newNote')) backTo('notas');
      } catch (err) {
        handleError(err, { form: 'note', prefix: 'nn' });
      }
    });
  },

  registration: () => {
    const { value } = state.forms.registration;
    const errors = validateRegistration(value, currentUser());
    if (hasErrors(errors)) return showFieldErrors('registration', 'rg', errors);
    return withBusy('registration', async () => {
      try {
        await api.updateRegistration(value);
        refreshDb();
        showToast(t('registration.saved'), 'success');
        if (stillOn('registration')) back('');
      } catch (err) {
        handleError(err, { form: 'registration', prefix: 'rg' });
      }
    });
  },
};

/* ---------- mudanças em campos especiais ---------- */

export const CHANGES = {
  setLocale: (el) => {
    if (setLocale(el.value)) setState({});
  },
};

// Digitação em campos ligados ao estado (data-field). Campos com data-live redesenham a tela
// (buscas, campos que mostram/ocultam partes do formulário); os demais só atualizam o estado.
export function onFieldInput(el, { composing = false } = {}) {
  const path = el.dataset.field;
  const value = el.value;
  const previous = getPath(path);
  const [root, group, key] = path.split('.');

  let rerender = false;
  if ('live' in el.dataset && !composing) {
    rerender = el.dataset.live === 'empty'
      ? !!String(previous || '').trim() !== !!value.trim()
      : true;
  }

  const errors = root === 'forms' && state.forms[group] && state.forms[group].errors;
  if (errors && errors[key]) {
    setPath(`forms.${group}.errors.${key}`, null, { silent: true });
    rerender = true;
  }
  setPath(path, value, { silent: !rerender });
}
