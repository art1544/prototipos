// Eventos: fila de sincronização com o SAP, agrupada por operação (OP), com reenvio dos que falharam.

import { esc, icon } from '../utils.js';
import { formatDateTime, t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { hrefFor } from '../router.js';
import { eventGroups, eventsOf } from '../model.js';
import { emptyHtml, filterTabsHtml, iconButtonHtml, pillHtml, searchToolbarHtml, subheaderHtml, viewHtml } from './components.js';

// Mesma cor das solicitações para "sincronizado" (pílula verde).
const PILL_KIND = { sincronizado: 'sincronizada', pendente: 'pendente', erro: 'erro' };

function groupCardHtml(g) {
  let kind = 'sincronizada';
  let summary = t('events.summarySynced', { count: g.sincronizado });
  if (g.erro) {
    kind = 'erro';
    summary = t('events.summaryError', { count: g.erro });
  } else if (g.pendente) {
    kind = 'pendente';
    summary = t('events.summaryPending', { count: g.pendente });
  }
  return `
  <li>
    <a class="row-card row-card--link" href="${hrefFor(`eventos/${encodeURIComponent(g.operation)}`)}">
      <span class="row-card__icon">${icon('clipboardSmall')}</span>
      <span class="row-card__info">
        <span class="row-card__title">${esc(t('common.opPrefix'))} ${esc(g.operation)}</span>
        <span class="row-card__meta">${esc(t('events.total', { count: g.total }))} · ${esc(formatDateTime(g.lastAt, { seconds: true }))}</span>
      </span>
      ${pillHtml(kind, summary)}
      <span class="row-card__chevron">${icon('chevronRight')}</span>
    </a>
  </li>`;
}

export function eventsView() {
  const ui = state.ui.events;
  const groups = eventGroups(ui);
  const search = ui.search.trim();
  return viewHtml(`
    ${subheaderHtml(t('events.title'))}
    ${searchToolbarHtml({ id: 'ev-search', path: 'ui.events.search', placeholder: t('events.search') })}
    <div class="page page--list">
      ${groups.length
        ? `<ul class="list" role="list">${groups.map(groupCardHtml).join('')}</ul>`
        : emptyHtml(search ? t('events.emptySearch', { term: search }) : t('events.empty'), { clearPath: search ? 'ui.events.search' : '' })}
    </div>`);
}

function eventCardHtml(ev) {
  const category = ev.category ? t(`eventCategory.${ev.category}`) : ev.categoryText || '';
  const retrying = isBusy(`reprocessEvent-${ev.id}`);
  return `
  <li class="event-card">
    <span class="event-card__icon">${icon(ev.kind === 'anexo' ? 'paperclip' : 'bell')}</span>
    <div class="event-card__info">
      <div class="event-card__top">
        <p class="event-card__id">${esc(t('common.idPrefix'))} ${esc(ev.id)}</p>
        <span class="event-card__time">${esc(formatDateTime(ev.createdAt, { seconds: true }))}</span>
      </div>
      <p class="event-card__kind">${esc(t(`eventKind.${ev.kind}`))}</p>
      ${category ? `<p class="event-card__category">${esc(category)}</p>` : ''}
      <p class="event-card__message">${esc(t(`eventMessage.${ev.message}`))}</p>
      <div class="event-card__bottom">
        ${pillHtml(PILL_KIND[ev.status] || ev.status, t(`eventStatus.${ev.status}`))}
        ${ev.status === 'erro' ? `
        <button type="button" id="ev-retry-${ev.id}" class="retry-btn${retrying ? ' is-busy' : ''}" data-action="reprocessEvent" data-id="${ev.id}" aria-label="${esc(t('events.reprocessAria', { id: ev.id }))}"${retrying ? ' disabled aria-busy="true"' : ''}>
          ${icon('sync')}<span>${esc(t('events.reprocess'))}</span>
        </button>` : ''}
      </div>
    </div>
  </li>`;
}

export function eventsOrderView() {
  const { operation } = state.route.params;
  const ui = state.ui.eventsOrder;
  const items = eventsOf(operation, ui);
  const search = ui.search.trim();
  return viewHtml(`
    ${subheaderHtml(t('events.orderTitle', { operation }), { fallback: 'eventos' })}
    ${filterTabsHtml({
      label: t('events.filterAria'),
      path: 'ui.eventsOrder.tab',
      options: [
        { value: 'todos', label: t('events.tabAll') },
        { value: 'sincronizado', label: t('events.tabSynced') },
        { value: 'pendente', label: t('events.tabPending') },
        { value: 'erro', label: t('events.tabError') },
      ],
    })}
    ${searchToolbarHtml({
      id: 'eo-search', path: 'ui.eventsOrder.search', placeholder: t('events.searchId'),
      buttons: `
        ${iconButtonHtml({ action: 'syncEvents', iconName: 'sync', label: t('events.syncAria'), busyKey: 'syncEvents' })}
        ${iconButtonHtml({ action: 'reprocessEvents', iconName: 'sync', label: t('events.reprocessAllAria'), busyKey: 'reprocessEvents', tone: 'danger' })}`,
    })}
    <div class="page page--list">
      ${items.length
        ? `<ul class="list" role="list">${items.map(eventCardHtml).join('')}</ul>`
        : emptyHtml(search ? t('events.listEmptySearch', { term: search }) : t('events.listEmpty'), { clearPath: search ? 'ui.eventsOrder.search' : '' })}
    </div>`);
}
