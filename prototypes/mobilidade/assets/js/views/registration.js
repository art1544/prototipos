// Modificar Matrícula (atalho em Ferramentas, no Início).

import { LIMITS } from '../config.js';
import { esc, icon } from '../utils.js';
import { t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { currentUser } from '../model.js';
import { actionBarHtml, inputFieldHtml, legendHtml, readonlyFieldHtml, subheaderHtml, viewHtml } from './components.js';

export function registrationView() {
  const f = state.forms.registration;
  const syncing = isBusy('syncRegistrations');
  return viewHtml(`
    ${subheaderHtml(t('registration.title'))}
    ${legendHtml()}
    <form id="form-registration" class="form" data-submit="registration" novalidate>
      ${readonlyFieldHtml({ id: 'rg-current', label: t('fields.registrationCurrent'), value: currentUser().registration })}
      <button type="button" class="text-action${syncing ? ' is-busy' : ''}" data-action="syncRegistrations"${syncing ? ' disabled aria-busy="true"' : ''}>
        ${icon('sync')}<span>${esc(syncing ? t('common.updating') : t('registration.refresh'))}</span>
      </button>
      ${inputFieldHtml({
        id: 'rg-registration', path: 'forms.registration.value', label: t('fields.registrationNew'), value: f.value, required: true,
        error: f.errors.registration, placeholder: t('placeholders.registration'),
        attrs: `inputmode="numeric" maxlength="${LIMITS.registrationMax}" enterkeyhint="done"`,
      })}
    </form>
    ${actionBarHtml({ form: 'form-registration', submitLabel: t('common.save'), busyLabel: t('common.saving'), busy: isBusy('registration') })}`, { cls: 'view--form' });
}
