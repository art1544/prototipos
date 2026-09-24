// Início (hero + atalhos) e Perfil (idioma, sobre o app, opções do protótipo).

import { APP, LOCALE } from '../config.js';
import { esc, icon, initials } from '../utils.js';
import { getLocale, t } from '../i18n/index.js';
import { isBusy } from '../store.js';
import { hrefFor } from '../router.js';
import { currentUser, homeProgress } from '../model.js';
import { viewHtml } from './components.js';

function dotsHtml(active) {
  return `<span class="dots" aria-hidden="true">${[0, 1].map((i) => `<span class="dot${i === active ? ' is-active' : ''}"></span>`).join('')}</span>`;
}

function linkCardHtml(path, iconName, label) {
  return `<a class="action-card" href="${hrefFor(path)}">${icon(iconName)}<span>${esc(label)}</span></a>`;
}

// Atalho que dispara uma sincronização: mostra "Atualizando..." e gira o ícone enquanto roda.
function syncCardHtml({ action, iconName, label, busyLabel }) {
  const busy = isBusy(action);
  return `
  <button type="button" class="action-card${busy ? ' is-busy' : ''}" data-action="${action}"${busy ? ' disabled aria-busy="true"' : ''}>
    ${busy && action === 'downloadDatabase' ? '<span class="spinner spinner--sm" aria-hidden="true"></span>' : icon(iconName)}
    <span>${esc(busy ? busyLabel : label)}</span>
  </button>`;
}

function progressCardHtml() {
  const pct = homeProgress();
  const text = pct === null ? t('home.progressNone') : t('home.progressText', { pct });
  return `
  <a class="progress-card" href="${hrefFor('ordens?aba=andamento')}">
    <span class="progress-card__title">${esc(t('home.progressTitle'))}</span>
    <span class="progress-card__text">${esc(text)}</span>
    <span class="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct || 0}" aria-label="${esc(t('home.progressTitle'))}">
      <span class="progress-fill" style="width:${pct || 0}%"></span>
    </span>
  </a>`;
}

export function homeView() {
  const user = currentUser();
  return viewHtml(`
    <section class="hero">
      <p class="hero__greeting">${esc(t('home.greeting'))}</p>
      <h1 id="page-title" class="hero__name" tabindex="-1">${esc(user.name)}</h1>
      <p class="hero__id">${esc(t('home.userPrefix'))} ${esc(user.username)}</p>
      <div class="hero__meta">
        <p>${esc(t('home.registrationPrefix'))} ${esc(user.registration)}</p>
        <p>${esc(t('home.devicePrefix'))} ${esc(user.deviceId)}</p>
      </div>
      ${progressCardHtml()}
    </section>

    <section class="section" aria-labelledby="home-activities">
      <div class="section__header">
        <h2 id="home-activities">${esc(t('home.sectionActivities'))}</h2>
        ${dotsHtml(0)}
      </div>
      <div class="card-grid">
        ${linkCardHtml('ordens', 'clipboard', t('home.cardOrders'))}
        ${linkCardHtml('solicitacao', 'plus', t('home.cardRequest'))}
        ${linkCardHtml('notas', 'bookmark', t('home.cardNotes'))}
        ${linkCardHtml('eventos', 'checklist', t('home.cardEvents'))}
      </div>
    </section>

    <section class="section" aria-labelledby="home-tools">
      <div class="section__header">
        <h2 id="home-tools">${esc(t('home.sectionTools'))}</h2>
        ${dotsHtml(1)}
      </div>
      <div class="card-grid">
        ${syncCardHtml({ action: 'downloadDatabase', iconName: 'download', label: t('home.cardDownloadDb'), busyLabel: t('common.downloading') })}
        ${syncCardHtml({ action: 'syncCatalogs', iconName: 'sync', label: t('home.cardCatalogs'), busyLabel: t('common.updating') })}
        ${linkCardHtml('matricula', 'edit', t('home.cardRegistration'))}
        ${syncCardHtml({ action: 'syncLocations', iconName: 'sync', label: t('home.cardLocations'), busyLabel: t('common.updating') })}
      </div>
    </section>`, { cls: 'view--home' });
}

function menuRowHtml({ action = '', href = '', iconName, label, busy = false, busyLabel = '' }) {
  const content = `
    <span class="menu-row__icon">${icon(iconName)}</span>
    <span class="menu-row__label">${esc(busy ? busyLabel : label)}</span>
    <span class="menu-row__chevron">${icon('chevronRight')}</span>`;
  if (href) return `<a class="menu-row" href="${esc(href)}" target="_top">${content}</a>`;
  return `<button type="button" id="menu-${esc(action)}" class="menu-row" data-action="${esc(action)}"${busy ? ' disabled aria-busy="true"' : ''}>${content}</button>`;
}

export function profileView() {
  const user = currentUser();
  const locale = getLocale();
  return viewHtml(`
    <div class="page">
      <section class="profile-card">
        <span class="avatar" aria-hidden="true">${esc(initials(user.name))}</span>
        <div class="profile-card__info">
          <h1 id="page-title" class="profile-card__name" tabindex="-1">${esc(user.name)}</h1>
          <p>${esc(t(`roles.${user.role}`))}</p>
          <p class="profile-card__email">${esc(user.email)}</p>
          <div class="profile-card__extra">
            <p>${esc(t('home.registrationPrefix'))} ${esc(user.registration)}</p>
            <p>${esc(t('home.devicePrefix'))} ${esc(user.deviceId)}</p>
          </div>
        </div>
      </section>

      <h2 class="group-title" id="profile-language-label">${esc(t('profile.language'))}</h2>
      <div class="card card--padded">
        <div class="select-wrap">
          <select id="profile-language" class="input" data-change="setLocale" aria-labelledby="profile-language-label">
            ${LOCALE.available.map((l) => `<option value="${l.id}" lang="${l.tag}"${l.id === locale ? ' selected' : ''}>${esc(l.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="menu-card">
        ${menuRowHtml({ action: 'openAbout', iconName: 'info', label: t('profile.about') })}
      </div>

      <h2 class="group-title">${esc(t('profile.prototypeSection'))}</h2>
      <div class="menu-card">
        ${menuRowHtml({ action: 'resetData', iconName: 'reset', label: t('profile.reset'), busy: isBusy('resetData'), busyLabel: t('profile.resetting') })}
        ${menuRowHtml({ href: APP.hubUrl, iconName: 'grid', label: t('profile.catalog') })}
      </div>
    </div>`);
}
