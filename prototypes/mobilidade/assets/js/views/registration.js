// Modificar Matrícula (atalho em Ferramentas, no Início) e o primeiro acesso, logo depois do login:
// sem matrícula o app não libera o Início (a única saída além de salvar é encerrar a sessão).

import { LIMITS } from '../config.js';
import { esc, icon } from '../utils.js';
import { t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { currentUser } from '../model.js';
import { actionBarHtml, inputFieldHtml, legendHtml, readonlyFieldHtml, subheaderHtml, viewHtml } from './components.js';

export function registrationView({ first = false } = {}) {
  const f = state.forms.registration;
  const syncing = isBusy('syncRegistrations');
  return viewHtml(`
    ${subheaderHtml(t(first ? 'registration.firstTitle' : 'registration.title'), { noBack: first })}
    ${first ? `<p class="page-hint page-hint--intro">${esc(t('registration.firstHint'))}</p>` : legendHtml()}
    <form id="form-registration" class="form" data-submit="registration" novalidate>
      ${first ? '' : readonlyFieldHtml({ id: 'rg-current', label: t('fields.registrationCurrent'), value: currentUser().registration })}
      <button type="button" class="text-action${syncing ? ' is-busy' : ''}" data-action="syncRegistrations"${syncing ? ' disabled aria-busy="true"' : ''}>
        ${icon('sync')}<span>${esc(syncing ? t('common.updating') : t('registration.refresh'))}</span>
      </button>
      ${inputFieldHtml({
        id: 'rg-registration', path: 'forms.registration.value', label: t(first ? 'fields.registration' : 'fields.registrationNew'), value: f.value, required: true,
        error: f.errors.registration, placeholder: t(first ? 'placeholders.registrationFirst' : 'placeholders.registration'),
        attrs: `maxlength="${LIMITS.registrationMax}" autocapitalize="none" autocomplete="off" spellcheck="false" enterkeyhint="done"`,
      })}
    </form>
    ${actionBarHtml({ form: 'form-registration', submitLabel: t('common.save'), busyLabel: t('common.saving'), busy: isBusy('registration'), noBack: first })}`, { cls: 'view--form' });
}

export const firstAccessView = () => registrationView({ first: true });
