// Ordens: lista com abas por status, busca e "Concluir todas ordens" (encerramento em lote), e o
// detalhe com as abas Operações / Dados Básicos / Documentos.

import { esc, icon } from '../utils.js';
import { formatDate, formatDateTime, t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { hrefFor } from '../router.js';
import {
  catalogLabel, displayStatus, eventSummary, filterOrders, isBatchBlocked, locationLabel, operationSummary, orderByCode,
} from '../model.js';
import {
  emptyHtml, filterTabsHtml, locationLineHtml, pillHtml, priorityChipHtml, readonlyFieldHtml, searchToolbarHtml,
  sectionTitleHtml, subheaderHtml, tipAttrs, toolButtonHtml, viewHtml,
} from './components.js';
import { operationCardHtml } from './operation.js';
import { notFoundView } from './shell.js';

// Ícone ao lado do status: ►► em andamento, pausa, tracejado (não iniciada) e bandeira (concluída).
const STATUS_ICON = { andamento: 'progress', pausada: 'pause', pendente: 'notStarted', concluida: 'flag' };

export function orderStatusPillHtml(order, { focusable = false } = {}) {
  const status = displayStatus(order);
  return pillHtml(status, t(`orderStatus.${status}`), { tip: t(`orderTips.${status}`), focusable, iconName: STATUS_ICON[status] });
}

const EVENT_DETAIL_ORDER = ['PE', 'PER', 'LE', 'PR', 'ER'];

// Resumo compacto (como no app antigo): operações finalizadas e situação dos eventos; o detalhe
// aparece ao tocar.
export function orderSummaryHtml(order, { focusable = false } = {}) {
  const ops = operationSummary(order);
  const details = ['liberada', 'andamento', 'pausada', 'bloqueada', 'finalizada']
    .filter((s) => ops.counts[s]).map((s) => `${t(`opStatus.${s}`)} (${ops.counts[s]})`).join(', ');
  const opsTip = `${t('orders.summaryOps', { finished: ops.finished, total: ops.total })} ${details}`;
  const opsHtml = `<span class="summary-icon${ops.counts.andamento ? ' summary-icon--blue' : ''}"${tipAttrs(opsTip, { focusable })}>${icon('listCheck')}<b>${ops.finished}/${ops.total}</b></span>`;

  const ev = eventSummary(order);
  let evHtml = '';
  if (ev.total) {
    const counts = { ...ev.counts, PR: (ev.counts.PR || 0) + (ev.counts.PRE || 0) }; // PRE e PR aparecem como "Processado SAP"
    const evDetails = EVENT_DETAIL_ORDER.filter((s) => counts[s]).map((s) => `${t(`eventStatus.${s}`)} (${counts[s]})`).join(', ');
    const tone = ev.errors ? 'red' : ev.pending ? 'amber' : 'green';
    const iconName = ev.errors ? 'errorCircle' : ev.pending ? 'syncCircle' : 'done';
    evHtml = `<span class="summary-icon summary-icon--${tone}"${tipAttrs(t('orders.summaryEvents', { details: evDetails }), { focusable })}>${icon(iconName)}<b>${ev.errors || ev.pending || ev.total}</b></span>`;
  }
  return `<span class="summary-icons">${opsHtml}${evHtml}</span>`;
}

function orderCardBodyHtml(o) {
  return `
      <span class="entity-card__header">
        <span class="entity-card__code">${esc(o.code)}</span>
        ${orderStatusPillHtml(o)}
      </span>
      <span class="entity-card__desc">${esc(o.description)}</span>
      ${locationLineHtml(locationLabel(o.locationCode))}
      <span class="entity-card__facts">
        <span><strong>${esc(t('common.startPrefix'))}</strong> ${esc(formatDateTime(o.startedAt) || '—')}</span>
        <span><strong>${esc(t('common.endPrefix'))}</strong> ${esc(formatDateTime(o.finishedAt) || '—')}</span>
      </span>
      <span class="entity-card__footer">${priorityChipHtml(o.priority)}${orderSummaryHtml(o)}</span>`;
}

function orderCardHtml(o) {
  return `
  <li>
    <a class="entity-card entity-card--${esc(o.priority)}" href="${hrefFor(`ordens/${encodeURIComponent(o.code)}`)}">${orderCardBodyHtml(o)}</a>
  </li>`;
}

// No modo "Concluir todas ordens" o cartão vira um botão de seleção (toque longo / toque simples).
function batchCardHtml(o, selected) {
  const isSelected = selected.includes(o.code);
  const blocked = isBatchBlocked(o);
  return `
  <li>
    <button type="button" id="batch-${esc(o.code)}" class="entity-card entity-card--${esc(o.priority)} entity-card--selectable${isSelected ? ' is-selected' : ''}${blocked ? ' is-blocked' : ''}" data-action="batchTap" data-code="${esc(o.code)}" data-longpress="batchSelect" aria-pressed="${isSelected}">
      ${orderCardBodyHtml(o)}
      ${isSelected ? `<span class="entity-card__check" aria-hidden="true">${icon('check')}</span>` : ''}
    </button>
  </li>`;
}

export function ordersView() {
  const ui = state.ui.orders;
  const { batch } = ui;
  const items = filterOrders(ui);
  const search = ui.search.trim();
  let list;
  if (items.length) {
    list = `<ul class="list list--cards" role="list">${items.map((o) => (batch.active ? batchCardHtml(o, batch.selected) : orderCardHtml(o))).join('')}</ul>`;
  } else if (batch.active) {
    list = emptyHtml(t('batch.none'));
  } else {
    list = emptyHtml(search ? t('orders.emptySearch', { term: search }) : t('orders.empty'), { clearPath: search ? 'ui.orders.search' : '' });
  }

  return viewHtml(`
    ${subheaderHtml(t('orders.title'))}
    ${batch.active ? '' : filterTabsHtml({
      label: t('orders.filterAria'),
      path: 'ui.orders.tab',
      options: [
        { value: 'todas', label: t('orders.tabAll') },
        { value: 'pendente', label: t('orders.tabNotStarted') },
        { value: 'andamento', label: t('orders.tabInProgress') },
        { value: 'concluida', label: t('orders.tabDone') },
      ],
    })}
    ${searchToolbarHtml({
      id: 'or-search', path: 'ui.orders.search', placeholder: t('orders.search'),
      buttons: `
        ${toolButtonHtml({ href: 'solicitacao', iconName: 'plus', label: t('orders.newButton'), tone: 'primary' })}
        ${toolButtonHtml({ action: 'toggleBatch', iconName: 'flag', label: t('orders.batchButton'), tone: 'green', active: batch.active, id: 'or-batch' })}
        ${toolButtonHtml({ action: 'refreshOrders', iconName: 'sync', label: t('orders.refreshButton'), tone: 'blue', busyKey: 'refreshOrders' })}`,
    })}
    <div class="page page--list">
      ${batch.active ? `<p class="batch-hint" role="status">${esc(t('batch.hint'))}</p>` : ''}
      ${list}
    </div>
    ${batch.active ? `
    <div class="action-bar">
      <button type="button" class="btn btn--secondary" data-action="toggleBatch">${esc(t('common.cancel'))}</button>
      <button type="button" class="btn btn--primary${isBusy('closeOrders') ? ' is-busy' : ''}" data-action="confirmBatch"${isBusy('closeOrders') ? ' disabled aria-busy="true"' : ''}>${esc(t('batch.confirm', { count: batch.selected.length }))}</button>
    </div>` : ''}`, { cls: batch.active ? 'view--form' : '' });
}

/* ---------- detalhe ---------- */

const DETAIL_TABS = [
  { id: 'operacoes', label: 'orderDetail.tabOperations' },
  { id: 'dados', label: 'orderDetail.tabBasic' },
  { id: 'documentos', label: 'orderDetail.tabDocuments' },
];

function operationsTabHtml(order) {
  if (!order.operations.length) return emptyHtml(t('orderDetail.opsEmpty'));
  return `<ul class="list" role="list">${order.operations.map((op) => operationCardHtml(order, op)).join('')}</ul>`;
}

function basicTabHtml(order) {
  const field = (key, label, value) => readonlyFieldHtml({ id: `od-${key}`, label, value });
  return `
  <div class="form form--readonly form--flush">
    <div class="form-row">
      ${field('systemStatus', t('fields.systemStatus'), order.systemStatus)}
      ${field('userStatus', t('fields.userStatus'), order.userStatus)}
    </div>
    ${field('headerText', t('fields.headerText'), order.headerText)}
    <div class="form-row">
      ${field('desiredStart', t('fields.desiredStart'), formatDate(order.desiredStart))}
      ${field('desiredEnd', t('fields.desiredEnd'), formatDate(order.desiredEnd))}
    </div>
    ${field('activityType', t('fields.activityTypeDetail'), catalogLabel('activityTypes', order.activityTypeId))}
    ${sectionTitleHtml(t('sections.other'))}
    ${field('type', t('fields.orderType'), order.type)}
    ${field('location', t('fields.location'), locationLabel(order.locationCode))}
    <div class="form-row">
      ${field('workCenter', t('fields.workCenter'), catalogLabel('workCenters', order.workCenterId))}
      ${field('plant', t('fields.plant'), catalogLabel('plants', order.plantId))}
    </div>
  </div>`;
}

function documentsTabHtml(order) {
  if (!order.documents.length) return emptyHtml(t('orderDetail.docsEmpty'));
  const item = (label, value, full = false) => `
    <div class="doc-card__field${full ? ' doc-card__field--full' : ''}">
      <span class="doc-card__label">${esc(label)}</span>
      <span>${esc(value || '—')}</span>
    </div>`;
  return `
  <ul class="doc-list" role="list">
    ${order.documents.map((doc) => {
      const busy = isBusy(`downloadDocument-${doc.id}`);
      return `
      <li class="doc-card">
        <div class="doc-card__head">
          <span class="doc-card__number">${esc(doc.operation)}</span>
          <span class="doc-card__code">${esc(doc.code)}</span>
          <button type="button" id="doc-download-${doc.id}" class="doc-card__btn${busy ? ' is-busy' : ''}" data-action="downloadDocument" data-id="${doc.id}" aria-label="${esc(t('orderDetail.downloadAria', { name: doc.code }))}"${busy ? ' disabled aria-busy="true"' : ''}>${icon('download')}</button>
        </div>
        ${doc.thumbnail ? `<img class="doc-card__thumb" src="${esc(doc.thumbnail)}" alt="${esc(doc.file || doc.description || '')}" width="96" height="96" loading="lazy">` : ''}
        <div class="doc-card__fields">
          ${item(t('orderDetail.docDescription'), doc.description, true)}
          ${item(t('orderDetail.docCreatedAt'), formatDate(doc.createdAt))}
          ${item(t('orderDetail.docCreatedBy'), doc.createdBy)}
          ${item(t('orderDetail.docPartial'), doc.partialDoc)}
          ${item(t('orderDetail.docVersion'), doc.version)}
        </div>
      </li>`;
    }).join('')}
  </ul>`;
}

export function orderDetailView() {
  const order = orderByCode(state.route.params.code);
  if (!order) return notFoundView({ title: t('orderDetail.notFound'), text: '' });
  const active = state.ui.orderDetail.tab;
  const panels = { operacoes: operationsTabHtml, dados: basicTabHtml, documentos: documentsTabHtml };

  return viewHtml(`
    ${subheaderHtml(t('orderDetail.title'), { fallback: 'ordens' })}
    <div class="page">
      <section class="summary-card">
        <div class="entity-card__header">
          <span class="summary-card__code">${esc(order.code)}</span>
          ${orderStatusPillHtml(order, { focusable: true })}
        </div>
        <p class="summary-card__desc">${esc(order.description)}</p>
        <div class="entity-card__footer">${priorityChipHtml(order.priority)}${orderSummaryHtml(order, { focusable: true })}</div>
      </section>
    </div>
    <div class="tabs tabs--detail" role="tablist" aria-label="${esc(t('orderDetail.tabsAria'))}">
      ${DETAIL_TABS.map((tab) => {
        const selected = tab.id === active;
        return `<button type="button" role="tab" id="od-tab-${tab.id}" class="tab${selected ? ' is-active' : ''}" aria-selected="${selected}" aria-controls="od-panel" tabindex="${selected ? 0 : -1}" data-action="orderTab" data-tab="${tab.id}">${esc(t(tab.label))}</button>`;
      }).join('')}
    </div>
    <div id="od-panel" class="page" role="tabpanel" aria-labelledby="od-tab-${esc(active)}">
      ${panels[active](order)}
    </div>`);
}

export const ORDER_DETAIL_TABS = DETAIL_TABS.map((tab) => tab.id);
