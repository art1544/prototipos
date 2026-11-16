// Reportar erro: ações do botão flutuante, do formulário de reporte e de "Meus reportes".
// O reporte leva relato, ordens/operações, prints, dados do usuário e do aparelho e uma cópia do
// banco. Sem sinal, fica salvo no aparelho e é enviado sozinho quando a conexão volta.

import { PHOTO, REPORT } from './config.js';
import { esc, icon, imageToDataUrl, sleep } from './utils.js';
import { formatNumber, t } from './i18n/index.js';
import { isBusy, mergePath, setPath, setState, state } from './store.js';
import { back, currentRoute, navigate } from './router.js';
import { ApiError, api, orderInProgress, validateReport } from './api.js';
import { handleError, refreshDb, withBusy } from './actions.js';
import { orderByCode } from './model.js';
import { clearCaptured, currentScreenTitle, routeOrderContext, setFabOpen } from './capture.js';
import { closeDialog, confirmDialog, dialogHeaderHtml, openDialog, showToast } from './ui.js';
import { mockPrintSrc, printSrc, reportById } from './views/reports.js';

const isOffline = () => state.network === 'sem_sinal';

/* ---------- formulário ---------- */

function orderEntry(code, operations = [], { manual = false } = {}) {
  const inProgress = orderInProgress(state.db);
  return { code, operations, manual, inProgress: !!inProgress && inProgress.code === code };
}

// Abre o formulário a partir da tela atual. Com erro capturado: mensagem, ordem/operação do erro e o
// print do momento do erro. Sem erro: print da tela atual e a ordem em andamento, sem operação.
export function reportForm({ captured = state.report.captured, screen = currentScreenTitle(), context = routeOrderContext() } = {}) {
  const title = (captured && captured.screen) || screen || t('shell.navHome');
  const inProgress = orderInProgress(state.db);
  const target = captured && captured.orderCode ? captured : context;
  const orders = [];
  if (target && target.orderCode) orders.push(orderEntry(target.orderCode, target.operation ? [target.operation] : []));
  else if (inProgress) orders.push(orderEntry(inProgress.code));
  const error = captured
    ? `${captured.message}${captured.code ? ` ${t('report.errorCode', { code: captured.code })}` : ''}`
    : t('report.noCaptured', { screen: title });
  return {
    captured: !!captured,
    screen: title,
    orders,
    error,
    text: '',
    prints: [captured
      ? { mock: { title, message: captured.message, tone: 'error' }, label: 'error' }
      : { mock: { title, message: t('report.printScreenMessage'), tone: 'neutral' }, label: 'screen' }],
    printProcessing: false,
    errors: {},
  };
}

const isDirty = (f) => !!(f && (f.text.trim() || f.prints.some((p) => !p.label)));

/* ---------- seleção de ordens e operações ---------- */

function selectionDialogHtml(selection, manual) {
  const orders = state.db.orders.filter((o) => o.status !== 'concluida');
  const inProgress = orderInProgress(state.db);
  const picked = (code) => selection.find((s) => s.code === code);
  return `
  ${dialogHeaderHtml(t('report.selectTitle'))}
  <form class="dialog-form" novalidate>
    <div class="report-select">
      ${orders.map((o) => {
        const s = picked(o.code);
        return `
        <div class="report-select__order">
          <label class="report-check">
            <input type="checkbox" name="order" value="${esc(o.code)}"${s ? ' checked' : ''}>
            <span><b>${esc(o.code)}</b>${inProgress && inProgress.code === o.code ? `<span class="report-tag">${esc(t('report.tagInProgress'))}</span>` : ''}<br>${esc(o.description)}</span>
          </label>
          ${o.operations.map((op) => `
          <label class="report-check report-check--op">
            <input type="checkbox" name="op" value="${esc(op.number)}" data-order="${esc(o.code)}"${s && s.operations.includes(op.number) ? ' checked' : ''}>
            <span><b>${esc(op.number)}</b> ${esc(op.title)}</span>
          </label>`).join('')}
        </div>`;
      }).join('')}
    </div>
    <div class="field" data-name="manual">
      <label class="field__label" for="rp-manual">${esc(t('report.manualLabel'))}</label>
      <div class="report-manual">
        <input id="rp-manual" class="input" name="manual" type="text" inputmode="numeric" maxlength="${REPORT.orderCodeMax}" placeholder="${esc(t('report.manualPlaceholder'))}" autocomplete="off">
        <button type="button" class="btn btn--secondary" data-report-manual>${esc(t('common.add'))}</button>
      </div>
      <p class="field__error" data-error="manual" hidden>${esc(t('report.manualRequired'))}</p>
      <p class="field__hint" data-manual-list${manual.length ? '' : ' hidden'}>${esc(t('report.manualList', { list: manual.join(', ') }))}</p>
    </div>
    <div class="dialog__actions">
      <button type="submit" class="btn btn--primary">${esc(t('report.selectDone'))}</button>
    </div>
  </form>`;
}

async function selectReportOrders() {
  const f = state.forms.report;
  if (!f) return;
  const manual = f.orders.filter((o) => o.manual).map((o) => o.code);
  const controller = new AbortController();
  const { signal } = controller;
  let result = null;
  const closed = openDialog(selectionDialogHtml(f.orders, manual), { variant: 'form' });
  const dialog = document.getElementById('dialog');
  const form = dialog.querySelector('form');

  dialog.addEventListener('change', (e) => {
    const el = e.target;
    if (el.name === 'order' && !el.checked) {
      form.querySelectorAll(`input[name="op"][data-order="${CSS.escape(el.value)}"]`).forEach((op) => { op.checked = false; });
    }
    if (el.name === 'op' && el.checked) {
      const order = form.querySelector(`input[name="order"][value="${CSS.escape(el.dataset.order)}"]`);
      if (order) order.checked = true;
    }
  }, { signal });

  const addManual = () => {
    const input = form.elements.manual;
    const value = input.value.trim();
    const wrap = form.querySelector('[data-name="manual"]');
    const error = form.querySelector('[data-error="manual"]');
    wrap.classList.toggle('is-invalid', !value);
    error.hidden = !!value;
    if (!value) {
      input.focus();
      return;
    }
    if (!manual.includes(value) && !state.db.orders.some((o) => o.code === value)) manual.push(value);
    input.value = '';
    const list = form.querySelector('[data-manual-list]');
    list.textContent = t('report.manualList', { list: manual.join(', ') });
    list.hidden = false;
    showToast(t('report.manualAdded', { code: value }), 'success');
  };
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-report-manual]')) addManual();
  }, { signal });
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.name === 'manual') {
      e.preventDefault();
      addManual();
    }
  }, { signal });
  dialog.addEventListener('submit', (e) => {
    e.preventDefault();
    const ops = [...form.querySelectorAll('input[name="op"]:checked')];
    const device = [...form.querySelectorAll('input[name="order"]:checked')].map((el) => orderEntry(
      el.value,
      ops.filter((op) => op.dataset.order === el.value).map((op) => op.value).sort(),
    ));
    result = [...device, ...manual.map((code) => orderEntry(code, [], { manual: true }))];
    closeDialog('confirm');
  }, { signal });

  await closed;
  controller.abort();
  if (result && state.forms.report) mergePath('forms.report', { orders: result });
}

/* ---------- prints ---------- */

export async function attachReportPrint(file) {
  const f = state.forms.report;
  if (!file || !f || f.printProcessing) return;
  const setError = (key, vars) => mergePath('forms.report', { printProcessing: false, errors: { ...state.forms.report.errors, prints: { key, vars } } });
  if (f.prints.length >= REPORT.maxPrints) return setError('report.printLimit', { max: REPORT.maxPrints });
  if (!file.type.startsWith('image/')) return setError('validation.photoType');
  if (file.size > PHOTO.maxFileMb * 1024 * 1024) return setError('validation.photoSize', { max: PHOTO.maxFileMb });
  mergePath('forms.report', { printProcessing: true, errors: { ...f.errors, prints: null } });
  try {
    const src = await imageToDataUrl(file, PHOTO);
    if (!state.forms.report) return undefined;
    mergePath('forms.report', { printProcessing: false, prints: [...state.forms.report.prints, { src, label: '' }] });
    showToast(t('report.printAttached'), 'success');
  } catch (err) {
    console.warn('[app] Falha ao processar o print.', err);
    if (state.forms.report) setError('validation.photoRead');
  }
  return undefined;
}

function viewPrint(src, n) {
  openDialog(`
    ${dialogHeaderHtml(t('report.printTitle'))}
    <img class="dialog__photo" src="${esc(src)}" alt="${esc(t('report.printAlt', { n }))}">`, { variant: 'photo' });
}

/* ---------- envio ---------- */

function summaryHtml(f) {
  const ops = f.orders.reduce((total, o) => total + o.operations.length, 0);
  const row = (label, value) => `<li><span>${esc(label)}</span><b>${esc(value)}</b></li>`;
  return `
  <ul class="report-summary">
    ${row(t('report.summaryText'), t('report.summaryChars', { count: f.text.trim().length }))}
    ${row(t('report.summaryOrders'), f.orders.length)}
    ${row(t('report.summaryOps'), ops)}
    ${row(t('report.summaryPrints'), f.prints.length)}
    ${row(t('report.summaryDb'), t('report.dbSize', { size: formatNumber(REPORT.dbSizeMb, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) }))}
  </ul>`;
}

function progressHtml() {
  return `
  <h2 id="dialog-title" class="dialog__title">${esc(t('report.sendingTitle'))}</h2>
  <p class="dialog__text report-progress__step" id="rp-step">${esc(t(REPORT.sendSteps[0]))}</p>
  <div class="report-progress" role="progressbar" aria-labelledby="rp-step" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span id="rp-bar"></span></div>
  <p class="report-progress__hint">${esc(t('report.sendingHint'))}</p>`;
}

async function runProgress() {
  const steps = REPORT.sendSteps;
  for (let i = 0; i < steps.length; i += 1) {
    await sleep(REPORT.stepMs);
    const step = document.getElementById('rp-step');
    const bar = document.getElementById('rp-bar');
    if (!step || !bar) return;
    const pct = Math.round(((i + 1) / steps.length) * 100);
    step.textContent = t(steps[i]);
    bar.style.width = `${pct}%`;
    bar.parentElement.setAttribute('aria-valuenow', String(pct));
  }
}

const RESULT = {
  enviado: { icon: 'check', tone: 'ok', title: 'report.sentTitle', text: 'report.sentText' },
  aguardando: { icon: 'clock', tone: 'wait', title: 'report.savedTitle', text: 'report.savedText' },
  falha: { icon: 'warning', tone: 'fail', title: 'report.failedTitle', text: 'report.failedText' },
};

function resultHtml(report) {
  const r = RESULT[report.status];
  return `
  <div class="report-result">
    <span class="report-result__icon report-result__icon--${r.tone}">${icon(r.icon, { sw: 2.5 })}</span>
    <h2 id="dialog-title" class="dialog__title">${esc(t(r.title))}</h2>
    ${report.protocol ? `<p class="report-result__protocol">${esc(report.protocol)}</p>` : ''}
    <p class="dialog__text">${esc(t(r.text))}</p>
  </div>
  <div class="dialog__actions">
    <button type="button" class="btn btn--secondary" data-dialog-close="mine">${esc(t('report.myTitle'))}</button>
    <button type="button" class="btn btn--primary" data-dialog-close="done" autofocus>${esc(t('report.done'))}</button>
  </div>`;
}

async function submitReport() {
  const f = state.forms.report;
  if (!f || isBusy('report')) return;
  const input = { orders: f.orders, error: f.error, text: f.text, prints: f.prints };
  const errors = validateReport(input);
  if (Object.keys(errors).length) {
    mergePath('forms.report', { errors });
    const field = document.getElementById(errors.text ? 'rp-text' : 'rp-prints');
    if (field) {
      field.focus({ preventScroll: true });
      field.scrollIntoView({ block: 'center' });
    }
    showToast(t('errors.checkFields'), 'error');
    return;
  }
  const ok = await confirmDialog({ title: t('report.confirmTitle'), text: t('report.confirmText'), html: summaryHtml(f), confirmLabel: t('report.send'), cancelLabel: t('common.back') });
  if (!ok) return;

  let report = null;
  await withBusy('report', async () => {
    try {
      // Os prints simulados viram imagem no envio (como a captura de tela real).
      const prints = f.prints.map((p) => (p.src ? p : { src: mockPrintSrc(p.mock || {}), label: p.label }));
      if (isOffline()) {
        report = await api.createReport({ ...input, prints });
      } else {
        openDialog(progressHtml(), { variant: 'confirm', lock: true });
        const [created] = await Promise.all([api.createReport({ ...input, prints }), runProgress()]);
        report = created;
      }
    } catch (err) {
      closeDialog();
      handleError(err);
    }
  });
  if (!report) return;
  if (f.captured) clearCaptured();
  refreshDb();
  setState({});
  const choice = await openDialog(resultHtml(report), { variant: 'confirm', lock: false });
  setPath('forms.report', null, { silent: true });
  if (choice === 'mine') navigate('perfil/reportes', { replace: true });
  else back('');
}

/* ---------- ações ---------- */

export const REPORT_ACTIONS = {
  // 1º toque expande o botão; 2º toque abre o reporte.
  reportFab: () => {
    if (!state.report.fabOpen) {
      setFabOpen(true);
      return;
    }
    setFabOpen(false);
    navigate('reportar');
  },
  dismissCapturedError: () => clearCaptured(),

  // "Reportar" num evento com erro no SAP: abre o reporte com a mensagem e a ordem/operação do evento.
  reportEvent: ({ id }) => {
    const ev = state.db.events.find((e) => e.id === Number(id));
    if (!ev) return;
    const order = ev.orderCode ? orderByCode(ev.orderCode) : null;
    const where = [order ? order.code : ev.noteCode, ev.operation ? t('events.operationLabel', { op: ev.operation }) : ''].filter(Boolean).join(' · ');
    setState({
      report: {
        fabOpen: false,
        captured: {
          message: t('report.eventError', { id: ev.id, where, message: t(`eventMessage.${ev.status}`) }),
          code: `SAP ${ev.status}`,
          screen: currentScreenTitle(),
          orderCode: order ? order.code : null,
          operation: ev.operation || null,
        },
      },
    });
    navigate('reportar');
  },

  leaveReport: async () => {
    if (isDirty(state.forms.report)) {
      const ok = await confirmDialog({ title: t('report.discardTitle'), text: t('report.discardText'), confirmLabel: t('report.discard'), cancelLabel: t('report.keepEditing'), danger: true });
      if (!ok) return;
    }
    setPath('forms.report', null, { silent: true });
    back('');
  },

  selectReportOrders,
  removeReportOrder: ({ index }) => {
    const orders = state.forms.report.orders.filter((_, i) => i !== Number(index));
    mergePath('forms.report', { orders });
  },

  addReportPrint: () => {
    const input = document.getElementById('rp-print-input');
    if (input) input.click();
  },
  removeReportPrint: ({ index }) => {
    const prints = state.forms.report.prints.filter((_, i) => i !== Number(index));
    mergePath('forms.report', { prints, errors: { ...state.forms.report.errors, prints: null } });
  },
  viewReportPrint: ({ source, index }) => {
    const list = source === 'detail' ? (reportById(currentRoute().params.id) || { prints: [] }).prints : state.forms.report.prints;
    const print = list[Number(index)];
    if (print) viewPrint(printSrc(print), Number(index) + 1);
  },

  resendReport: ({ id }) => withBusy(`resendReport-${id}`, async () => {
    try {
      const report = await api.resendReport(Number(id));
      refreshDb();
      setState({});
      if (report.status === 'enviado') showToast(t('report.resent', { protocol: report.protocol }), 'success');
      else showToast(t('report.resendOffline'));
    } catch (err) {
      handleError(err);
    }
  }),
};

export const REPORT_SUBMITS = { report: submitReport };

/* ---------- conexão ---------- */

// Chamado quando a qualidade da rede muda. Voltando a conexão, envia os reportes guardados.
export function onNetworkChange(previous, next) {
  api.setOnline(next !== 'sem_sinal');
  if (previous === undefined || previous === next || state.status !== 'ready') return;
  if (next === 'sem_sinal') {
    showToast(t('report.offline'));
    return;
  }
  if (previous !== 'sem_sinal') return;
  let sent = [];
  try {
    sent = api.flushReports();
  } catch (err) {
    if (!(err instanceof ApiError)) throw err;
  }
  if (sent.length) {
    refreshDb();
    setState({});
    showToast(sent.length === 1 ? t('report.flushedOne', { protocol: sent[0].protocol }) : t('report.flushed', { count: sent.length }), 'success');
  } else showToast(t('report.online'), 'success');
}
