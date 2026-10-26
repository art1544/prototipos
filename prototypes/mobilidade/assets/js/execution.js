// Ações da execução: operações da ordem (Play / Pausar / Parar / Pessoa / Tempo / Anexos / Foto /
// Nota / Detalhes / estorno), pontos de medida, carrossel, inclusão de pessoas e o
// "Concluir todas ordens". Entram no mapa de ações da interface junto com as de actions.js.

import { DEVIATION_REASONS, LIMITS, PHOTO } from './config.js';
import { esc, icon, imageToDataUrl } from './utils.js';
import { t } from './i18n/index.js';
import { isBusy, setPath, setState, state } from './store.js';
import { backTo, currentRoute, navigate } from './router.js';
import { ApiError, api, missingReadings, validateDeviation } from './api.js';
import {
  currentActiveOperation, executionOf, isBatchBlocked, openOperations, operationOf, operationStatus, orderByCode,
} from './model.js';
import { emptyBatch } from './forms.js';
import { dialogHeaderHtml, formDialog, openDialog, showToast } from './ui.js';
import { handleError, refreshDb, withBusy } from './actions.js';
import { execBusyKey, pointChartHtml } from './views/operation.js';

const orderPath = (code) => `ordens/${encodeURIComponent(code)}`;

function context(number) {
  const order = orderByCode(state.route.params.code);
  return { order, op: operationOf(order, number) };
}

const toggleIn = (list, value) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value]);

/* ---------- diálogos ---------- */

// Pergunta Sim/Não. Resolve 'yes' | 'no' | 'cancel' (fechou sem responder).
async function yesNoDialog({ title, text = '', html = '' }) {
  return openDialog(`
    ${dialogHeaderHtml(title)}
    ${text ? `<p class="dialog__text">${esc(text)}</p>` : ''}
    ${html ? `<div class="dialog__body">${html}</div>` : ''}
    <div class="dialog__actions">
      <button type="button" class="btn btn--secondary" data-dialog-close="no">${esc(t('common.no'))}</button>
      <button type="button" class="btn btn--primary" data-dialog-close="yes" autofocus>${esc(t('common.yes'))}</button>
    </div>`, { variant: 'confirm' });
}

// Lista de operações com "Selecionar tudo" (registro de desvio e inclusão de pessoas).
function checkListHtml(ops, { locked = null } = {}) {
  const row = (op, attrs, extra = '') => `
    <label class="check-row${extra}">
      ${attrs}
      <span class="check-row__number">${esc(op.number)}</span>
      <span class="check-row__title">${esc(op.title)}${op === locked ? `<small>${esc(t('people.thisOp'))}</small>` : ''}</span>
      <span class="check-circle" aria-hidden="true">${icon('check', { sw: 2.5 })}</span>
    </label>`;
  return `
  <div class="check-list">
    ${locked ? row(locked, '<input type="checkbox" checked disabled>', ' check-row--locked') : ''}
    ${ops.length ? `
    <label class="check-row check-row--all">
      <input type="checkbox" name="all">
      <span class="check-row__title"><b>${esc(t('deviation.selectAll'))}</b></span>
      <span class="check-row__count" data-count></span>
      <span class="check-circle" aria-hidden="true">${icon('check', { sw: 2.5 })}</span>
    </label>
    ${ops.map((op) => row(op, `<input type="checkbox" name="op" value="${esc(op.number)}">`)).join('')}` : ''}
  </div>`;
}

// Mantém "Selecionar tudo" e o contador coerentes com as operações marcadas.
function syncCheckList(form, event) {
  const all = form.querySelector('input[name="all"]');
  const ops = [...form.querySelectorAll('input[name="op"]')];
  if (!all) return 0;
  if (event && event.target === all) ops.forEach((input) => { input.checked = all.checked; });
  const checked = ops.filter((input) => input.checked).length;
  all.checked = checked === ops.length;
  const count = form.querySelector('[data-count]');
  if (count) count.textContent = `${checked}/${ops.length}`;
  return checked;
}

const checkedOps = (form) => [...form.querySelectorAll('input[name="op"]:checked')].map((input) => input.value);

// Registro de desvio: motivo, detalhe e operações adicionais (quando houver outras abertas).
// Resolve { reason, text, extraOps } ou null.
export function deviationDialog({ order = null, op = null, withExtraOps = true } = {}) {
  const others = withExtraOps && order ? openOperations(order, op) : [];
  const required = '<span class="req" aria-hidden="true">*</span>';
  const html = `
    ${dialogHeaderHtml(t('deviation.title'))}
    <form class="dialog-form" novalidate>
      <div class="field is-required" data-name="reason">
        <label class="field__label" for="dv-reason">${esc(t('deviation.reason'))} ${required}</label>
        <div class="select-wrap">
          <select id="dv-reason" class="input" name="reason" aria-required="true">
            <option value="">—</option>
            ${DEVIATION_REASONS.map((id) => `<option value="${id}">${esc(t(`deviation.reasons.${id}`))}</option>`).join('')}
          </select>
        </div>
        <p class="field__error" data-error="reason" hidden></p>
      </div>
      <div class="field is-required" data-name="text">
        <label class="field__label" for="dv-text">${esc(t('deviation.text'))} ${required}</label>
        <textarea id="dv-text" class="input" name="text" rows="3" maxlength="${LIMITS.longTextMax}" aria-required="true"></textarea>
        <p class="field__error" data-error="text" hidden></p>
      </div>
      ${withExtraOps ? `
      <div class="field is-required" data-name="extraOps">
        <span class="field__label">${esc(t('deviation.extraOps'))} ${others.length ? required : ''}</span>
        ${others.length ? checkListHtml(others) : `<p class="field__hint">${esc(t('deviation.noOtherOps'))}</p>`}
        <p class="field__error" data-error="extraOps" hidden></p>
      </div>` : ''}
      <div class="dialog__actions">
        <button type="button" class="btn btn--secondary" data-dialog-close="cancel">${esc(t('common.cancel'))}</button>
        <button type="submit" class="btn btn--primary">${esc(t('common.confirm'))}</button>
      </div>
    </form>`;
  return formDialog(html, {
    read: (form) => ({ reason: form.elements.reason.value, text: form.elements.text.value, extraOps: checkedOps(form) }),
    validate: (values) => validateDeviation(values, { needsExtraOps: others.length > 0 }),
    onChange: syncCheckList,
  });
}

// Título da foto tirada pela câmera. Resolve o texto (ou o padrão) ou null.
function photoTitleDialog() {
  const html = `
    ${dialogHeaderHtml(t('execution.photoTitle'))}
    <form class="dialog-form" novalidate>
      <div class="field" data-name="title">
        <label class="field__label" for="ph-title">${esc(t('execution.photoTitleLabel'))}</label>
        <input id="ph-title" class="input" name="title" type="text" maxlength="${LIMITS.shortTextMax}" autocomplete="off" autofocus>
      </div>
      <div class="dialog__actions">
        <button type="button" class="btn btn--secondary" data-dialog-close="cancel">${esc(t('common.cancel'))}</button>
        <button type="submit" class="btn btn--primary">${esc(t('common.save'))}</button>
      </div>
    </form>`;
  return formDialog(html, { read: (form) => form.elements.title.value.trim() || t('execution.photoDefault') });
}

/* ---------- arquivos ---------- */

// Abre o seletor de arquivos do aparelho. Precisa rodar dentro do clique do usuário.
function pickFiles({ capture = false, multiple = false }) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = multiple;
    if (capture) input.setAttribute('capture', 'environment');
    input.addEventListener('change', () => resolve([...(input.files || [])].filter((f) => f.type.startsWith('image/'))));
    input.click();
  });
}

async function toDataUrls(files) {
  const results = [];
  for (const file of files) {
    if (file.size > PHOTO.maxFileMb * 1024 * 1024) {
      showToast(t('validation.photoSize', { max: PHOTO.maxFileMb }), 'error');
      continue;
    }
    try {
      results.push({ name: file.name, dataUrl: await imageToDataUrl(file, PHOTO) });
    } catch (err) {
      console.warn('[app] Falha ao processar a imagem.', err);
      showToast(t('validation.photoRead'), 'error');
    }
  }
  return results;
}

/* ---------- execução ---------- */

function startOperation(code, number) {
  return withBusy(execBusyKey(number), async () => {
    try {
      await api.startOperation(code, number);
      refreshDb();
      showToast(t('execution.started', { op: number }), 'success');
    } catch (err) {
      handleError(err);
    }
  });
}

function requireStarted(op) {
  if (executionOf(op).started) return true;
  showToast(t('execution.startFirst'));
  return false;
}

async function stop(order, op) {
  let deviation = null;
  if (missingReadings(op).length) {
    deviation = await deviationDialog({ order, op });
    if (!deviation) return;
  }
  let result = null;
  await withBusy(execBusyKey(op.number), async () => {
    try {
      result = await api.stopOperation(order.code, op.number, deviation);
      refreshDb();
    } catch (err) {
      handleError(err);
    }
  });
  if (!result) return;
  if (result.remaining) {
    showToast(t('execution.stopped', { op: op.number }), 'success');
    return;
  }
  // Era a última operação aberta: pergunta se encerra a ordem tecnicamente.
  const answer = await yesNoDialog({ title: t('execution.closeOrderTitle'), text: t('execution.closeOrderText') });
  if (answer !== 'yes') {
    showToast(t('execution.finalOnly'), 'success');
    return;
  }
  await withBusy(`closeOrder-${order.code}`, async () => {
    try {
      await api.closeOrder(order.code);
      refreshDb();
      showToast(t('execution.orderClosedDone'), 'success');
    } catch (err) {
      handleError(err);
    }
  });
}

async function reverse(code, number) {
  const note = `<p class="notice notice--warning"><b>${esc(t('execution.reverseNote'))}</b> ${esc(t('execution.reverseNoteText'))}</p>`;
  const answer = await yesNoDialog({ title: t('execution.reverseTitle'), html: note });
  if (answer !== 'yes') return;
  await withBusy(execBusyKey(number), async () => {
    try {
      await api.reverseOperation(code, number);
      refreshDb();
      showToast(t('execution.reversed'), 'success');
    } catch (err) {
      handleError(err);
    }
  });
}

/* ---------- pessoas ---------- */

async function confirmPeople(order, op, selected) {
  const others = openOperations(order, op);
  const people = state.db.inspectors.filter((i) => selected.includes(i.registration));
  const summary = (count) => (count ? t('people.applyCount', { count: count + 1 }) : t('people.onlyThis'));
  const html = `
    ${dialogHeaderHtml(t('people.confirmTitle'))}
    <form class="dialog-form" novalidate>
      <p class="dialog__section">${esc(t('people.toAdd', { count: people.length }))}</p>
      <div class="people-chips">${people.map((p) => `<span class="person-chip"><span class="avatar-sm" aria-hidden="true">${icon('avatar')}</span>${esc(p.name)}</span>`).join('')}</div>
      <p class="dialog__section">${esc(t('people.applyOthers'))}</p>
      ${checkListHtml(others, { locked: op })}
      ${others.length ? '' : `<p class="field__hint">${esc(t('deviation.noOtherOps'))}</p>`}
      <p class="notice" data-summary>${esc(summary(0))}</p>
      <div class="dialog__actions">
        <button type="button" class="btn btn--secondary" data-dialog-close="cancel">${esc(t('common.cancel'))}</button>
        <button type="submit" class="btn btn--primary">${esc(t('common.confirm'))}</button>
      </div>
    </form>`;
  return formDialog(html, {
    read: (form) => checkedOps(form),
    onChange: (form, event) => {
      const count = syncCheckList(form, event);
      form.querySelector('[data-summary]').textContent = summary(count);
    },
  });
}

/* ---------- encerramento em lote ---------- */

function toggleBatchSelection(code) {
  const order = orderByCode(code);
  if (!order) return;
  if (isBatchBlocked(order)) {
    showToast(t('batch.blocked'), 'error');
    return;
  }
  setPath('ui.orders.batch.selected', toggleIn(state.ui.orders.batch.selected, code));
}

/* ---------- ações ---------- */

export const EXECUTION_ACTIONS = {
  /* cartão da operação */

  toggleOperation: ({ op }) => setPath('ui.orderDetail.collapsed', toggleIn(state.ui.orderDetail.collapsed, op)),

  panelOperation: ({ op, panel }) => {
    const panels = state.ui.orderDetail.panels;
    setPath('ui.orderDetail.panels', { ...panels, [op]: panels[op] === panel ? null : panel });
  },

  toggleConfirmation: ({ key }) => setPath('ui.orderDetail.closedConfirmations', toggleIn(state.ui.orderDetail.closedConfirmations, key)),

  playOperation: async ({ op: number }) => {
    const { order, op } = context(number);
    if (!op || isBusy(execBusyKey(number))) return;
    const status = operationStatus(order, op);
    if (status === 'finalizada') return showToast(t('execution.alreadyFinished'));
    if (status === 'bloqueada') return showToast(t('execution.blockedLock'));
    const active = currentActiveOperation();
    if (active) return showToast(t('execution.anotherActive', { op: active.op.number, order: active.order.code }), 'error');
    if (Number(op.people) > 1) {
      // Planejada para mais de um usuário: oferece incluir pessoas antes de iniciar.
      const answer = await yesNoDialog({ title: t('execution.play'), text: t('execution.morePeople') });
      if (answer === 'cancel') return undefined;
      if (answer === 'yes') return navigate(`${orderPath(order.code)}/operacoes/${number}/pessoas?iniciar=1`);
    }
    return startOperation(order.code, number);
  },

  pauseOperation: async ({ op: number }) => {
    const { order, op } = context(number);
    if (!op || isBusy(execBusyKey(number))) return;
    const ex = executionOf(op);
    if (ex.paused) {
      await withBusy(execBusyKey(number), async () => {
        try {
          await api.resumeOperation(order.code, number);
          refreshDb();
          showToast(t('execution.resumed'), 'success');
        } catch (err) {
          handleError(err);
        }
      });
      return;
    }
    // Pausar sempre pede o registro de desvio (a ordem fica confirmada parcialmente, I0010).
    const deviation = await deviationDialog({ order, op });
    if (!deviation) return;
    await withBusy(execBusyKey(number), async () => {
      try {
        await api.pauseOperation(order.code, number, deviation);
        refreshDb();
        showToast(t('execution.paused'), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },

  stopOperation: ({ op: number }) => {
    const { order, op } = context(number);
    if (!op || isBusy(execBusyKey(number))) return undefined;
    return stop(order, op);
  },

  // Vem do botão "Estornar operação" da dica do cadeado (operação finalizada).
  reverseOperation: ({ op: number }) => {
    const { order, op } = context(number);
    if (!op) return undefined;
    return reverse(order.code, number);
  },

  personOperation: ({ op: number }) => {
    const { order, op } = context(number);
    if (!op || !requireStarted(op)) return;
    navigate(`${orderPath(order.code)}/operacoes/${number}/pessoas`);
  },

  cameraOperation: async ({ op: number }) => {
    const { order, op } = context(number);
    if (!op || !requireStarted(op)) return;
    const [file] = await pickFiles({ capture: true });
    if (!file) return;
    const [photo] = await toDataUrls([file]);
    if (!photo) return;
    const title = await photoTitleDialog();
    if (title === null) return;
    await withBusy(execBusyKey(number), async () => {
      try {
        await api.addAttachments(order.code, number, [{ name: title, kind: 'foto', dataUrl: photo.dataUrl }]);
        refreshDb();
        showToast(t('execution.photoSaved'), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },

  galleryOperation: async ({ op: number }) => {
    const { order, op } = context(number);
    if (!op || !requireStarted(op)) return;
    const files = await pickFiles({ multiple: true });
    if (!files.length) return;
    const images = await toDataUrls(files);
    if (!images.length) return;
    await withBusy(execBusyKey(number), async () => {
      try {
        await api.addAttachments(order.code, number, images.map((img) => ({ ...img, kind: 'arquivo' })));
        refreshDb();
        setPath('ui.orderDetail.panels', { ...state.ui.orderDetail.panels, [number]: 'anexos' }, { silent: true });
        showToast(t('execution.attached', { count: images.length }), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },

  deleteAttachment: async ({ op: number, id }) => {
    const { order } = context(number);
    const answer = await yesNoDialog({ title: t('execution.deleteAttachmentTitle') });
    if (answer !== 'yes') return;
    await withBusy(execBusyKey(number), async () => {
      try {
        await api.deleteAttachment(order.code, number, Number(id));
        refreshDb();
        showToast(t('execution.attachmentDeleted'), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },

  newNoteFromOperation: ({ op: number, point }) => {
    const { order, op } = context(number);
    if (!op || !requireStarted(op)) return;
    navigate(`${orderPath(order.code)}/operacoes/${number}/nota${point !== undefined ? `?etapa=${point}` : ''}`);
  },

  /* pontos de medida */

  setPointQuali: ({ op: number, point, value }) => {
    const { order, op } = context(number);
    const current = op.info.points[Number(point)].value;
    try {
      api.setPointValue(order.code, number, Number(point), current === value ? null : value);
      refreshDb();
      setState({});
    } catch (err) {
      handleError(err);
    }
  },

  pointHistory: ({ op: number, point }) => {
    const { op } = context(number);
    const target = op && op.info && op.info.points[Number(point)];
    if (!target) return;
    openDialog(`
      ${dialogHeaderHtml(target.name)}
      ${pointChartHtml(target)}
      <button type="button" class="btn btn--secondary btn--block" data-dialog-close="cancel">${esc(t('common.close'))}</button>`);
  },

  /* carrossel */

  carouselGo: ({ op, slide }) => {
    const car = document.getElementById(`car-${op}`);
    if (!car) return;
    const index = Math.max(0, Math.min(car.children.length - 1, Number(slide)));
    car.scrollTo({ left: index * car.clientWidth, behavior: 'smooth' });
  },

  carouselStep: ({ op, dir }) => {
    const current = state.ui.orderDetail.slides[op] || 0;
    EXECUTION_ACTIONS.carouselGo({ op, slide: current + Number(dir) });
  },

  /* adicionar pessoas */

  togglePerson: ({ registration }) => setPath('forms.people.selected', toggleIn(state.forms.people.selected, registration)),

  savePeople: async () => {
    const f = state.forms.people;
    const order = orderByCode(f.orderCode);
    const op = operationOf(order, f.operation);
    if (!op) return;
    if (!f.selected.length) {
      showToast(t('people.empty'));
      return;
    }
    const extra = await confirmPeople(order, op, f.selected);
    if (extra === null) return;
    await withBusy('addPeople', async () => {
      try {
        await api.addPeople(order.code, [op.number, ...extra], f.selected);
        if (f.start) await api.startOperation(order.code, op.number);
        refreshDb();
        showToast(t(f.start ? 'execution.started' : 'people.added', { op: op.number }), 'success');
        if (currentRoute().name === 'operationPeople') backTo(orderPath(order.code));
      } catch (err) {
        handleError(err);
      }
    });
  },

  /* concluir todas ordens */

  toggleBatch: () => {
    const active = !state.ui.orders.batch.active;
    setPath('ui.orders.batch', { ...emptyBatch(), active });
  },

  // Toque longo num cartão: seleciona (ou desmarca) a ordem.
  batchSelect: ({ code }) => toggleBatchSelection(code),

  // Toque simples: só depois que a primeira ordem foi escolhida com toque longo.
  batchTap: ({ code }) => {
    if (!state.ui.orders.batch.selected.length) {
      showToast(t('batch.hint'));
      return;
    }
    toggleBatchSelection(code);
  },

  confirmBatch: async () => {
    const codes = state.ui.orders.batch.selected;
    if (!codes.length) {
      showToast(t('batch.empty'));
      return;
    }
    const orders = codes.map(orderByCode).filter(Boolean);
    let deviation = null;
    if (orders.some((o) => openOperations(o).length)) {
      deviation = await deviationDialog({ withExtraOps: false });
      if (!deviation) return;
    }
    await withBusy('closeOrders', async () => {
      try {
        const count = await api.closeOrders(codes, deviation);
        refreshDb();
        setPath('ui.orders.batch', emptyBatch(), { silent: true });
        showToast(t('batch.done', { count }), 'success');
      } catch (err) {
        handleError(err);
      }
    });
  },
};

// Tooltip: botões dentro das dicas (ex.: "Estornar operação").
export const TIP_ACTIONS = {
  reverseOperation: (data) => EXECUTION_ACTIONS.reverseOperation(data),
};

// Leituras digitadas nos pontos de medida (gravadas no aparelho a cada digitação).
export function onPointInput(el) {
  const { op: number, point } = el.dataset;
  const { order } = context(number);
  const raw = el.value.trim();
  const value = raw === '' || Number.isNaN(Number(raw)) ? null : Number(raw);
  try {
    api.setPointValue(order.code, number, Number(point), value);
    refreshDb();
    setState({});
  } catch (err) {
    if (err instanceof ApiError) showToast(t(err.key, err.vars), 'error');
    else throw err;
  }
}

// Escala (1 a 4) dos pontos de medida.
export function onPointScale(el) {
  const { op: number, point } = el.dataset;
  const { order } = context(number);
  try {
    api.setPointValue(order.code, number, Number(point), el.value);
    refreshDb();
    setState({});
  } catch (err) {
    handleError(err);
  }
}

// Slide atual do carrossel (rolagem por toque, arrasto ou botões): atualiza abas, pontos e setas
// sem redesenhar a tela (o estado é guardado para a próxima vez que a operação for desenhada).
export function onCarouselScroll(car) {
  if (!car.clientWidth) return;
  const index = Math.round(car.scrollLeft / car.clientWidth);
  const { op } = car.dataset;
  if ((state.ui.orderDetail.slides[op] || 0) === index && car.dataset.slide === String(index)) return;
  setPath('ui.orderDetail.slides', { ...state.ui.orderDetail.slides, [op]: index }, { silent: true });
  car.dataset.slide = String(index);
  const info = car.closest('.op-info');
  info.querySelectorAll('.op-dot').forEach((dot, i) => dot.classList.toggle('is-on', i === index));
  const chips = info.querySelector('.op-chips');
  info.querySelectorAll('.op-chip').forEach((chip, i) => {
    chip.classList.toggle('is-on', i === index);
    if (i === index) chips.scrollLeft = chip.offsetLeft - (chips.clientWidth - chip.offsetWidth) / 2;
  });
  const [prev, next] = info.querySelectorAll('.op-nav__btn');
  prev.disabled = index === 0;
  next.disabled = index === car.children.length - 1;
}

// Depois de redesenhar: coloca cada carrossel no slide guardado (ex.: ao voltar de uma nota).
export function restoreCarousels(root) {
  root.querySelectorAll('.op-car').forEach((car) => {
    const index = Number(car.dataset.slide) || 0;
    if (car.clientWidth && Math.round(car.scrollLeft / car.clientWidth) !== index) car.scrollLeft = index * car.clientWidth;
  });
}
