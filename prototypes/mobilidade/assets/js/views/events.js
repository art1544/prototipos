// Eventos: fila de sincronização com o SAP, agrupada por ordem (eventos das operações) ou por nota
// (eventos gerados em Notas). Status: PE/PER (no aparelho), LE (no SAP), PR/PRE (processado) e ER (erro).

import { esc, icon } from '../utils.js';
import { formatDateTime, t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { hrefFor } from '../router.js';
import { eventGroups, eventsOf, groupLabel, noteByCode, noteTypeLabel } from '../model.js';
import { emptyHtml, filterTabsHtml, pillHtml, searchToolbarHtml, subheaderHtml, toolButtonHtml, viewHtml } from './components.js';

const KIND_ICON = { nova_nota: 'bookmark', anexo_nota: 'paperclip', anexo_operacao: 'paperclip', notificacao: 'bell' };

export const groupPath = (group) => `eventos/${group.type}/${encodeURIComponent(group.code)}`;

// Resumo do grupo: mostra a situação que merece mais atenção (erro > pendente > no SAP > processado).
function summaryPillHtml(g) {
  let kind = 'sincronizada';
  let text = t('events.summaryProcessed', { count: g.processado });
  if (g.erro) {
    kind = 'erro';
    text = t('events.summaryError', { count: g.erro });
  } else if (g.pendente) {
    kind = 'pendente';
    text = t('events.summaryPending', { count: g.pendente });
  } else if (g.aguardando) {
    kind = 'andamento';
    text = t('events.summaryWaiting', { count: g.aguardando });
  }
  return pillHtml(kind, text, { tip: t('events.summaryTip') });
}

function groupCardHtml(g) {
  return `
  <li>
    <a class="row-card row-card--link" href="${hrefFor(groupPath(g))}">
      <span class="row-card__icon">${icon(g.type === 'nota' ? 'bookmark' : 'clipboardSmall')}</span>
      <span class="row-card__info">
        <span class="row-card__title">${esc(groupLabel(g))}</span>
        ${g.description ? `<span class="row-card__meta row-card__meta--clip">${esc(g.description)}</span>` : ''}
        <span class="row-card__meta">${esc(t('events.total', { count: g.total }))} · <span class="nowrap">${esc(formatDateTime(g.lastAt, { seconds: true }))}</span></span>
      </span>
      ${summaryPillHtml(g)}
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

const STATUS_PILL = { PE: 'pendente', PER: 'reenvio', LE: 'andamento', PR: 'sincronizada', PRE: 'processado', ER: 'erro' };

function eventCardHtml(ev) {
  const note = ev.noteCode ? noteByCode(ev.noteCode) : null;
  const category = note ? noteTypeLabel(note.type) : ev.category ? t(`eventCategory.${ev.category}`) : ev.categoryText || '';
  const retrying = isBusy(`reprocessEvent-${ev.id}`);
  return `
  <li class="event-card">
    <span class="event-card__icon">${icon(KIND_ICON[ev.kind] || 'bell')}</span>
    <div class="event-card__info">
      <div class="event-card__top">
        <p class="event-card__id">${esc(t('common.idPrefix'))} ${esc(ev.id)}</p>
        ${pillHtml(STATUS_PILL[ev.status] || 'erro', t(`eventStatus.${ev.status}`), { tip: t(`eventTips.${ev.status}`), focusable: true })}
      </div>
      <p class="event-card__kind">${esc(t(`eventKind.${ev.kind}`))}</p>
      ${category ? `<p class="event-card__category">${esc(category)}</p>` : ''}
      ${note ? `<p class="event-card__note"><span class="code-badge">${esc(note.code)}</span><span>${esc(note.description)}</span></p>` : ''}
      ${ev.operation ? `<p class="event-card__category">${esc(t('events.operationLabel', { op: ev.operation }))}</p>` : ''}
      <p class="event-card__message">${esc(t(`eventMessage.${ev.status}`))}</p>
      <div class="event-card__bottom">
        <span class="event-card__time">${esc(formatDateTime(ev.createdAt, { seconds: true }))}</span>
        ${ev.status === 'ER' ? `
        <button type="button" id="ev-retry-${ev.id}" class="retry-btn${retrying ? ' is-busy' : ''}" data-action="reprocessEvent" data-id="${ev.id}" aria-label="${esc(t('events.reprocessAria', { id: ev.id }))}"${retrying ? ' disabled aria-busy="true"' : ''}>
          ${icon('sync')}<span>${esc(t('events.reprocess'))}</span>
        </button>` : ''}
      </div>
    </div>
  </li>`;
}

export function eventsGroupView() {
  const { type, code } = state.route.params;
  const group = { type, code };
  const ui = state.ui.eventsGroup;
  const items = eventsOf(group, ui);
  const search = ui.search.trim();
  return viewHtml(`
    ${subheaderHtml(t(type === 'nota' ? 'events.noteTitle' : 'events.orderTitle', { code }), { fallback: 'eventos' })}
    ${filterTabsHtml({
      label: t('events.filterAria'),
      path: 'ui.eventsGroup.tab',
      options: [
        { value: 'todos', label: t('events.tabAll') },
        { value: 'pendente', label: t('events.tabPending') },
        { value: 'aguardando', label: t('events.tabWaiting') },
        { value: 'processado', label: t('events.tabProcessed') },
        { value: 'erro', label: t('events.tabError') },
      ],
    })}
    ${searchToolbarHtml({
      id: 'eo-search', path: 'ui.eventsGroup.search', placeholder: t('events.searchId'),
      buttons: `
        ${toolButtonHtml({ action: 'syncEvents', iconName: 'sync', label: t('events.syncButton'), tone: 'primary', busyKey: 'syncEvents' })}
        ${toolButtonHtml({ action: 'reprocessEvents', iconName: 'sync', label: t('events.reprocessButton'), tone: 'danger', busyKey: 'reprocessEvents' })}`,
    })}
    <div class="page page--list">
      ${items.length
        ? `<ul class="list" role="list">${items.map(eventCardHtml).join('')}</ul>`
        : emptyHtml(search ? t('events.listEmptySearch', { term: search }) : t('events.listEmpty'), { clearPath: search ? 'ui.eventsGroup.search' : '' })}
    </div>`);
}
