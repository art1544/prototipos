// Ordens: lista com abas por status + busca, e detalhe com as abas Operações / Dados Básicos / Documentos.

import { esc, icon } from '../utils.js';
import { formatDate, formatDateTime, t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { hrefFor } from '../router.js';
import { catalogLabel, filterOrders, locationLabel, orderByCode } from '../model.js';
import {
  emptyHtml, filterTabsHtml, iconButtonHtml, locationLineHtml, pillHtml, priorityChipHtml, readonlyFieldHtml,
  searchToolbarHtml, sectionTitleHtml, subheaderHtml, viewHtml,
} from './components.js';
import { notFoundView } from './shell.js';

const statusPill = (status) => pillHtml(status, t(`orderStatus.${status}`));

function orderCardHtml(o) {
  return `
  <li>
    <a class="entity-card entity-card--${esc(o.priority)}" href="${hrefFor(`ordens/${encodeURIComponent(o.code)}`)}">
      <span class="entity-card__header">
        <span class="entity-card__code">${esc(o.code)}</span>
        ${statusPill(o.status)}
      </span>
      <span class="entity-card__desc">${esc(o.description)}</span>
      ${locationLineHtml(locationLabel(o.locationCode))}
      <span class="entity-card__facts">
        <span><strong>${esc(t('common.startPrefix'))}</strong> ${esc(formatDateTime(o.startedAt) || '—')}</span>
        <span><strong>${esc(t('common.endPrefix'))}</strong> ${esc(formatDateTime(o.finishedAt) || '—')}</span>
      </span>
      <span class="entity-card__footer">${priorityChipHtml(o.priority)}</span>
    </a>
  </li>`;
}

export function ordersView() {
  const ui = state.ui.orders;
  const items = filterOrders(ui);
  const search = ui.search.trim();
  return viewHtml(`
    ${subheaderHtml(t('orders.title'))}
    ${filterTabsHtml({
      label: t('orders.filterAria'),
      path: 'ui.orders.tab',
      options: [
        { value: 'todas', label: t('orders.tabAll') },
        { value: 'andamento', label: t('orders.tabInProgress') },
        { value: 'concluida', label: t('orders.tabDone') },
      ],
    })}
    ${searchToolbarHtml({
      id: 'or-search', path: 'ui.orders.search', placeholder: t('orders.search'),
      buttons: `
        ${iconButtonHtml({ href: 'solicitacao', iconName: 'plus', label: t('orders.newAria') })}
        ${iconButtonHtml({ action: 'refreshOrders', iconName: 'sync', label: t('orders.refreshAria'), busyKey: 'refreshOrders' })}`,
    })}
    <div class="page page--list">
      ${items.length
        ? `<ul class="list list--cards" role="list">${items.map(orderCardHtml).join('')}</ul>`
        : emptyHtml(search ? t('orders.emptySearch', { term: search }) : t('orders.empty'), { clearPath: search ? 'ui.orders.search' : '' })}
    </div>`);
}

/* ---------- detalhe ---------- */

const DETAIL_TABS = [
  { id: 'operacoes', label: 'orderDetail.tabOperations' },
  { id: 'dados', label: 'orderDetail.tabBasic' },
  { id: 'documentos', label: 'orderDetail.tabDocuments' },
];

function operationsTabHtml(order) {
  if (!order.operations.length) return emptyHtml(t('orderDetail.opsEmpty'));
  return `
  <ul class="list" role="list">
    ${order.operations.map((op) => `
      <li class="op-card">
        <div class="op-card__header">
          ${icon('chevronRight', { cls: 'op-card__chevron' })}
          <span class="op-card__number">${esc(op.number)}</span>
          <span class="op-card__title">${esc(op.title)}</span>
          <span class="op-card__lock op-card__lock--${op.released ? 'open' : 'closed'}" role="img" aria-label="${esc(t(op.released ? 'orderDetail.released' : 'orderDetail.blocked'))}">${icon(op.released ? 'lockOpen' : 'lockClosed')}</span>
        </div>
        <span class="op-card__code">${esc(op.code)}</span>
        <span class="op-card__equipment">${esc(op.equipment)}</span>
        <span class="op-card__center">${esc(op.workCenter)}</span>
        <div class="op-card__footer">
          <span class="op-card__fact" aria-label="${esc(t('orderDetail.peopleAria', { count: op.people }))}">${icon('people')}<span aria-hidden="true">${esc(op.people)}</span></span>
          <span class="op-card__fact" aria-label="${esc(t('orderDetail.durationAria', { value: op.duration || '—' }))}">${icon('clock')}<span aria-hidden="true">${esc(op.duration ? `${op.duration} MIN` : '—')}</span></span>
        </div>
      </li>`).join('')}
  </ul>`;
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
  return `
  <ul class="doc-list" role="list">
    ${order.documents.map((doc) => {
      const deleting = isBusy(`deleteDocument-${doc.id}`);
      return `
      <li class="doc-row">
        ${icon('chevronRight', { cls: 'doc-row__chevron' })}
        <span class="doc-row__number">${esc(doc.operation)}</span>
        <span class="doc-row__name">${esc(doc.name)}</span>
        <span class="doc-row__actions">
          <button type="button" id="doc-download-${doc.id}" class="doc-row__btn" data-action="downloadDocument" data-id="${doc.id}" aria-label="${esc(t('orderDetail.downloadAria', { name: doc.name }))}">${icon('file')}</button>
          <button type="button" id="doc-delete-${doc.id}" class="doc-row__btn doc-row__btn--danger${deleting ? ' is-busy' : ''}" data-action="deleteDocument" data-id="${doc.id}" aria-label="${esc(t('orderDetail.deleteAria', { name: doc.name }))}"${deleting ? ' disabled aria-busy="true"' : ''}>${icon('trash')}</button>
        </span>
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
          ${statusPill(order.status)}
        </div>
        <p class="summary-card__desc">${esc(order.description)}</p>
        <div>${priorityChipHtml(order.priority)}</div>
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
