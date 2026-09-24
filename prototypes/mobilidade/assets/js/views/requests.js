// Solicitação de Ordens: menu de opções, Ordem Comum e Minhas Solicitações.

import { LIMITS } from '../config.js';
import { esc, icon } from '../utils.js';
import { formatDateTime, t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { hrefFor } from '../router.js';
import { filterRequests } from '../model.js';
import {
  actionBarHtml, emptyHtml, filterTabsHtml, iconButtonHtml, inputFieldHtml, legendHtml, pillHtml,
  searchToolbarHtml, subheaderHtml, viewHtml,
} from './components.js';

function optionHtml({ path, iconName, tone = '', title, desc }) {
  return `
  <a class="option-card${tone ? ` option-card--${tone}` : ''}" href="${hrefFor(path)}">
    <span class="option-card__icon">${icon(iconName)}</span>
    <span class="option-card__text">
      <span class="option-card__title">${esc(title)}</span>
      <span class="option-card__desc">${esc(desc)}</span>
    </span>
    <span class="option-card__chevron">${icon('chevronRight')}</span>
  </a>`;
}

export function requestMenuView() {
  return viewHtml(`
    ${subheaderHtml(t('request.title'))}
    <div class="page stack">
      ${optionHtml({ path: 'solicitacao/ordem-comum', iconName: 'clipboardSmall', title: t('request.commonTitle'), desc: t('request.commonDesc') })}
      ${optionHtml({ path: 'solicitacao/emergencia', iconName: 'alert', tone: 'danger', title: t('request.emergencyTitle'), desc: t('request.emergencyDesc') })}
      ${optionHtml({ path: 'solicitacao/minhas', iconName: 'history', tone: 'info', title: t('request.mineTitle'), desc: t('request.mineDesc') })}
    </div>`);
}

export function commonOrderView() {
  const f = state.forms.request;
  return viewHtml(`
    ${subheaderHtml(t('commonOrder.title'), { fallback: 'solicitacao' })}
    ${legendHtml()}
    <form id="form-request" class="form" data-submit="request" novalidate>
      ${inputFieldHtml({
        id: 'rq-orderCode', path: 'forms.request.orderCode', label: t('fields.orderCode'), value: f.orderCode, required: true,
        error: f.errors.orderCode, placeholder: t('placeholders.orderCode'), hint: t('commonOrder.hint'),
        attrs: `maxlength="${LIMITS.orderCodeMax}" autocapitalize="characters" enterkeyhint="send"`,
      })}
    </form>
    ${actionBarHtml({ form: 'form-request', submitLabel: t('common.save'), busyLabel: t('common.saving'), busy: isBusy('request'), fallback: 'solicitacao' })}`, { cls: 'view--form' });
}

function requestCardHtml(r) {
  return `
  <li class="row-card">
    <span class="row-card__icon">${icon('clipboardSmall')}</span>
    <span class="row-card__info">
      <span class="row-card__title">${esc(t('common.orderPrefix'))} ${esc(r.orderCode)}</span>
      <span class="row-card__meta">${esc(t('common.idPrefix'))} ${esc(r.id)} · ${esc(formatDateTime(r.createdAt, { seconds: true }))}</span>
    </span>
    ${pillHtml(r.status, t(`requestStatus.${r.status}`))}
  </li>`;
}

export function myRequestsView() {
  const ui = state.ui.myRequests;
  const items = filterRequests(ui);
  const search = ui.search.trim();
  return viewHtml(`
    ${subheaderHtml(t('myRequests.title'), { fallback: 'solicitacao' })}
    ${filterTabsHtml({
      label: t('myRequests.filterAria'),
      path: 'ui.myRequests.tab',
      options: [
        { value: 'todas', label: t('myRequests.tabAll') },
        { value: 'sincronizada', label: t('myRequests.tabSynced') },
        { value: 'pendente', label: t('myRequests.tabPending') },
      ],
    })}
    ${searchToolbarHtml({
      id: 'rq-search', path: 'ui.myRequests.search', placeholder: t('myRequests.search'),
      buttons: `
        ${iconButtonHtml({ href: 'solicitacao/ordem-comum', iconName: 'plus', label: t('myRequests.newAria') })}
        ${iconButtonHtml({ action: 'refreshRequests', iconName: 'sync', label: t('myRequests.refreshAria'), busyKey: 'refreshRequests' })}`,
    })}
    <div class="page page--list">
      ${items.length
        ? `<ul class="list" role="list">${items.map(requestCardHtml).join('')}</ul>`
        : emptyHtml(search ? t('myRequests.emptySearch', { term: search }) : t('myRequests.empty'), { clearPath: search ? 'ui.myRequests.search' : '' })}
    </div>`);
}
