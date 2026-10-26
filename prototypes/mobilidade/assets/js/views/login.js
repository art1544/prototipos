// Login (tela inicial, sem barra superior nem navegação). Qualquer usuário e senha preenchidos entram.

import { APP, SESSION } from '../config.js';
import { esc, icon } from '../utils.js';
import { t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { errorText } from './components.js';

function loginFieldHtml({ id, key, label, type, placeholder, iconName, value, error, autocomplete, trailing = '' }) {
  return `
  <div class="login-field${error ? ' is-invalid' : ''}">
    <label class="login-field__label" for="${id}">${esc(label)}</label>
    <div class="login-field__row">
      ${icon(iconName)}
      <input id="${id}" type="${type}" data-field="forms.login.${key}" value="${esc(value)}" placeholder="${esc(placeholder)}" autocomplete="${autocomplete}" autocapitalize="none" spellcheck="false" aria-required="true"${error ? ` aria-invalid="true" aria-describedby="${id}-error"` : ''}>
      ${trailing}
    </div>
    ${error ? `<p id="${id}-error" class="field__error">${esc(errorText(error))}</p>` : ''}
  </div>`;
}

export function loginView() {
  const f = state.forms.login;
  const busy = isBusy('login');
  const toggle = `
    <button type="button" id="lg-toggle" class="login-field__toggle" data-action="togglePassword" aria-label="${esc(t(f.showPassword ? 'login.hidePassword' : 'login.showPassword'))}" aria-pressed="${f.showPassword}">
      ${icon(f.showPassword ? 'eyeOff' : 'eye')}
    </button>`;

  return `
  <div class="view view--login">
    <header class="login-header">
      <img class="login-header__badge" src="assets/img/logo.png" alt="" width="76" height="76">
      <div>
        <h1 id="page-title" class="login-header__title" tabindex="-1">${esc(APP.name)}</h1>
        <p class="login-header__subtitle">${esc(t('login.subtitle'))}</p>
      </div>
    </header>
    <form id="form-login" class="login-card" data-submit="login" novalidate>
      ${loginFieldHtml({ id: 'lg-username', key: 'username', label: t('login.user'), type: 'text', placeholder: t('login.userPlaceholder'), iconName: 'user', value: f.username, error: f.errors.username, autocomplete: 'username' })}
      ${loginFieldHtml({ id: 'lg-password', key: 'password', label: t('login.password'), type: f.showPassword ? 'text' : 'password', placeholder: t('login.passwordPlaceholder'), iconName: 'lock', value: f.password, error: f.errors.password, autocomplete: 'current-password', trailing: toggle })}
      <button type="submit" class="btn btn--primary btn--block${busy ? ' is-busy' : ''}"${busy ? ' disabled aria-busy="true"' : ''}>${esc(busy ? t('login.submitting') : t('login.submit'))}</button>
      <a class="login-card__link" href="${esc(SESSION.forgotPasswordUrl)}" target="_blank" rel="noopener noreferrer">${esc(t('login.forgot'))}</a>
      <p class="login-card__hint">${esc(t('login.hint'))}</p>
    </form>
    <footer class="login-footer">
      <span>${esc(t('login.version', { version: APP.version, environment: APP.environment }))}</span>
      <a href="${esc(APP.hubUrl)}" target="_top">${icon('grid')}${esc(t('login.catalog'))}</a>
    </footer>
  </div>`;
}
