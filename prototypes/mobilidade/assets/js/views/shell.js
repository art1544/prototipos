// Casco do app: barra superior, navegação inferior e telas de estado (carregando, erro, 404).

import { APP, NETWORK } from '../config.js';
import { esc, firstName, icon, signalIcon } from '../utils.js';
import { t } from '../i18n/index.js';
import { state } from '../store.js';
import { hrefFor } from '../router.js';
import { currentUser, unreadCount } from '../model.js';
import { stateScreenHtml } from './components.js';

export function topbarHtml() {
  const ready = state.status === 'ready';
  const unread = ready ? unreadCount() : 0;
  const level = NETWORK.levels[state.network] ? state.network : NETWORK.fallback;
  const levelLabel = t(`network.${level}`);
  const bellLabel = unread ? t('shell.notifications', { count: unread }) : t('shell.notificationsNone');

  return `
  <header class="topbar">
    <a class="topbar__brand" href="${hrefFor('')}" aria-label="${esc(APP.name)} – ${esc(t('shell.navHome'))}">
      <img class="topbar__logo" src="assets/img/logo.png" alt="" width="34" height="34">
      <span class="topbar__name">${esc(APP.name)}</span>
      <span class="topbar__version"> | ${esc(t('shell.versionLabel', { version: APP.version, environment: APP.environment }))}</span>
    </a>
    <div class="topbar__actions">
      <span class="signal signal--${esc(level)}" role="img" aria-label="${esc(t('shell.network', { level: levelLabel }))}">
        ${signalIcon(NETWORK.levels[level].bars)}
        <span class="signal__label" aria-hidden="true">${esc(levelLabel)}</span>
      </span>
      ${ready ? `
      <a id="topbar-bell" class="topbar__btn" href="${hrefFor('notificacoes')}" aria-label="${esc(bellLabel)}">
        ${icon('bell')}
        ${unread ? `<span class="topbar__badge" aria-hidden="true">${unread > 9 ? '9+' : unread}</span>` : ''}
      </a>` : ''}
      <button type="button" id="topbar-logout" class="topbar__btn" data-action="logout" aria-label="${esc(t('shell.logout'))}" title="${esc(t('shell.logout'))}">${icon('logout')}</button>
    </div>
  </header>`;
}

export function bottomNavHtml(active) {
  const user = currentUser();
  const profileLabel = user ? `${firstName(user.name)} (${user.username})` : '';
  const item = (key, path, iconName, label, ariaLabel) => `
    <a class="bottom-nav__item${active === key ? ' is-active' : ''}" href="${hrefFor(path)}"${active === key ? ' aria-current="page"' : ''}${ariaLabel ? ` aria-label="${esc(ariaLabel)}"` : ''}>
      ${icon(iconName)}
      <span>${esc(label)}</span>
    </a>`;
  return `
  <nav class="bottom-nav" aria-label="${esc(t('shell.navLabel'))}">
    ${item('home', '', 'home', t('shell.navHome'))}
    ${item('profile', 'perfil', 'user', profileLabel, user ? t('shell.navProfile', { name: user.name }) : '')}
  </nav>`;
}

/* ---------- telas de estado ---------- */

export function loadingView() {
  return `
  <div class="state-screen" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span>
    <p class="state-screen__text">${esc(t('shell.loading'))}</p>
  </div>`;
}

export function bootErrorView() {
  const error = state.bootError;
  return stateScreenHtml({
    tone: 'danger',
    iconName: 'warning',
    title: t('errors.bootTitle'),
    text: error ? t(error.key, error.vars) : t('errors.unexpected'),
    actions: `<button type="button" class="btn btn--primary" data-action="retryBoot">${esc(t('common.retry'))}</button>`,
  });
}

export function notFoundView({ title = t('errors.notFoundTitle'), text = t('errors.notFoundText') } = {}) {
  return stateScreenHtml({
    tone: 'info',
    iconName: 'search',
    title,
    text,
    actions: `<a class="btn btn--primary" href="${hrefFor('')}">${esc(t('common.goHome'))}</a>`,
  });
}

export function crashView() {
  return stateScreenHtml({
    tone: 'danger',
    iconName: 'warning',
    title: t('errors.crashTitle'),
    text: t('errors.crashText'),
    actions: `
      <a class="btn btn--secondary" href="${hrefFor('')}">${esc(t('common.goHome'))}</a>
      <button type="button" class="btn btn--primary" data-action="reload">${esc(t('common.reload'))}</button>`,
  });
}
