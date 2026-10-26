// Adicionar pessoas à operação: quem já está nela (o usuário logado como "Você"), busca por
// matrícula ou nome e a bandeja das pessoas escolhidas. Salvar abre a confirmação, que pode
// aplicar a inclusão em outras operações abertas da ordem.

import { esc, icon, firstName, matchesSearch } from '../utils.js';
import { t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { currentUser, executionOf, inspectorsAvailable, operationOf, orderByCode } from '../model.js';
import { emptyHtml, subheaderHtml, viewHtml } from './components.js';
import { notFoundView } from './shell.js';

const avatar = (small = false) => `<span class="avatar-sm${small ? '' : ' avatar-sm--lg'}" aria-hidden="true">${icon('avatar')}</span>`;

export function peopleView() {
  const f = state.forms.people;
  const order = orderByCode(state.route.params.code);
  const op = operationOf(order, state.route.params.op);
  if (!f || !op) return notFoundView({ title: t('validation.operationNotFound'), text: '' });

  const user = currentUser();
  const ex = executionOf(op);
  const inOperation = [
    { registration: user.registration, name: user.name, you: true },
    ...ex.people.filter((p) => p.registration !== user.registration),
  ];
  const available = inspectorsAvailable(op);
  const visible = available.filter((i) => matchesSearch(f.search, [i.registration, i.name]));
  const selected = available.filter((i) => f.selected.includes(i.registration));
  const busy = isBusy('addPeople');

  let list;
  if (!available.length) list = emptyHtml(t('people.allIn'));
  else if (!visible.length) list = emptyHtml(t('people.none'), { clearPath: 'forms.people.search' });
  else {
    list = `<ul class="people-list" role="list">${visible.map((i) => {
      const isSelected = f.selected.includes(i.registration);
      return `
      <li>
        <button type="button" id="person-${esc(i.registration)}" class="person-row${isSelected ? ' is-selected' : ''}" data-action="togglePerson" data-registration="${esc(i.registration)}" aria-pressed="${isSelected}">
          ${avatar()}
          <span class="person-row__info"><b>${esc(i.name)}</b><small>${esc(t('people.registration', { registration: i.registration }))}</small></span>
          <span class="check-circle" aria-hidden="true">${icon('check', { sw: 2.5 })}</span>
        </button>
      </li>`;
    }).join('')}</ul>`;
  }

  return viewHtml(`
    ${subheaderHtml(t('people.title'), { fallback: `ordens/${encodeURIComponent(order.code)}` })}
    <div class="page">
      <div class="op-badge-row"><span class="op-badge-row__number">${esc(op.number)}</span><span class="op-badge-row__title">${esc(op.title)}</span></div>

      <h2 class="people-section"><span>${esc(t('people.inOperation'))}</span><span>${inOperation.length}</span></h2>
      <div class="people-chips">
        ${inOperation.map((p) => `<span class="person-chip">${avatar(true)}${esc(p.name)} <small>${esc(p.you ? t('common.you') : p.registration)}</small></span>`).join('')}
      </div>

      <h2 class="people-section"><span>${esc(t('people.add'))}</span><span>${esc(t('people.available', { count: available.length }))}</span></h2>
    </div>
    <div class="toolbar toolbar--flush">
      <div class="searchbox">
        ${icon('search')}
        <input id="pp-search" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(t('people.search'))}" aria-label="${esc(t('people.search'))}" value="${esc(f.search)}" data-field="forms.people.search" data-live>
      </div>
    </div>
    <div class="page page--list">${list}</div>
    ${selected.length ? `
    <div class="people-tray" aria-live="polite">
      ${selected.map((i) => `<button type="button" class="person-tag" data-action="togglePerson" data-registration="${esc(i.registration)}" aria-label="${esc(t('people.remove', { name: i.name }))}">${esc(firstName(i.name))}<span aria-hidden="true">${icon('close', { sw: 2.5 })}</span></button>`).join('')}
    </div>` : ''}
    <div class="action-bar">
      <button type="button" class="btn btn--secondary" data-action="back" data-fallback="ordens/${esc(encodeURIComponent(order.code))}">${esc(t('common.cancel'))}</button>
      <button type="button" class="btn btn--primary${busy ? ' is-busy' : ''}" data-action="savePeople"${busy || !selected.length ? ' disabled' : ''}${busy ? ' aria-busy="true"' : ''}>${esc(t('people.save', { count: selected.length }))}</button>
    </div>`, { cls: 'view--form' });
}
