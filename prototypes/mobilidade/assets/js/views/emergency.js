// Ordem de Emergência (PM10) e o subformulário "Adicionar Operação".

import { EMERGENCY_ORDER, LIMITS, PRIORITIES } from '../config.js';
import { esc, icon } from '../utils.js';
import { t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { hrefFor } from '../router.js';
import { catalogOptions, locationLabel } from '../model.js';
import {
  actionBarHtml, errorText, inputFieldHtml, legendHtml, locationFieldHtml, readonlyFieldHtml,
  sectionTitleHtml, selectFieldHtml, subheaderHtml, textareaFieldHtml, viewHtml,
} from './components.js';

const priorityOptions = () => PRIORITIES.map((p) => ({ value: p, label: t(`priority.${p}`) }));

function operationsHtml(f) {
  const error = f.errors.operations;
  const rows = f.operations.length
    ? `<ul class="op-list" role="list">${f.operations.map((op) => `
        <li class="op-row">
          <span class="op-row__number">${esc(op.number)}</span>
          <span class="op-row__desc">${esc(op.description)}</span>
          <button type="button" class="op-row__remove" data-action="removeOperation" data-number="${esc(op.number)}" aria-label="${esc(t('emergency.removeOpAria', { number: op.number }))}">${icon('trash')}</button>
        </li>`).join('')}</ul>`
    : `<p class="panel__empty">${esc(t('emergency.opsEmpty'))}</p>`;

  return `
  <div class="field is-required${error ? ' is-invalid' : ''}">
    ${sectionTitleHtml(t('sections.operations'), { required: true })}
    <div class="panel">
      <div class="panel__header">
        <span class="panel__cols"><span>${esc(t('emergency.colOperation'))}</span><span>${esc(t('emergency.colDescription'))}</span></span>
        <a id="em-operations" class="icon-btn" href="${hrefFor('solicitacao/emergencia/operacao')}" aria-label="${esc(t('emergency.addOpAria'))}"${error ? ' aria-describedby="em-operations-error"' : ''}>${icon('plus')}</a>
      </div>
      ${rows}
    </div>
    ${error ? `<p id="em-operations-error" class="field__error">${esc(errorText(error))}</p>` : ''}
  </div>`;
}

export function emergencyView() {
  const f = state.forms.emergency;
  const e = f.errors;
  const path = (key) => `forms.emergency.${key}`;
  return viewHtml(`
    ${subheaderHtml(t('emergency.title'), { fallback: 'solicitacao' })}
    ${legendHtml()}
    <form id="form-emergency" class="form" data-submit="emergency" novalidate>
      ${sectionTitleHtml(t('sections.identification'), { first: true })}
      ${readonlyFieldHtml({ id: 'em-type', label: t('fields.orderType'), value: EMERGENCY_ORDER.type })}
      ${locationFieldHtml({ id: 'em-locationCode', label: t('fields.location'), value: locationLabel(f.locationCode), placeholder: t('placeholders.location'), required: true, error: e.locationCode, action: 'openLocationPicker' })}
      ${inputFieldHtml({ id: 'em-description', path: path('description'), label: t('fields.description'), value: f.description, required: true, error: e.description, placeholder: t('placeholders.describeProblem'), attrs: `maxlength="${LIMITS.shortTextMax}"` })}
      ${textareaFieldHtml({ id: 'em-longText', path: path('longText'), label: t('fields.longText'), value: f.longText, required: true, error: e.longText, placeholder: t('placeholders.details'), rows: 3, attrs: `maxlength="${LIMITS.longTextMax}"` })}

      ${sectionTitleHtml(t('sections.period'))}
      <div class="form-row">
        ${inputFieldHtml({ id: 'em-startAt', path: path('startAt'), label: t('fields.start'), value: f.startAt, type: 'datetime-local', required: true, error: e.startAt })}
        ${inputFieldHtml({ id: 'em-endAt', path: path('endAt'), label: t('fields.end'), value: f.endAt, type: 'datetime-local', required: true, error: e.endAt, attrs: f.startAt ? `min="${esc(f.startAt)}"` : '' })}
      </div>

      ${sectionTitleHtml(t('sections.classification'))}
      <div class="form-row">
        ${selectFieldHtml({ id: 'em-planningGroupId', path: path('planningGroupId'), label: t('fields.planningGroup'), value: f.planningGroupId, options: catalogOptions('planningGroups'), required: true, error: e.planningGroupId })}
        ${selectFieldHtml({ id: 'em-workCenterId', path: path('workCenterId'), label: t('fields.workCenter'), value: f.workCenterId, options: catalogOptions('workCenters'), required: true, error: e.workCenterId })}
        ${selectFieldHtml({ id: 'em-priority', path: path('priority'), label: t('fields.priority'), value: f.priority, options: priorityOptions(), required: true, error: e.priority })}
        ${selectFieldHtml({ id: 'em-plantId', path: path('plantId'), label: t('fields.plant'), value: f.plantId, options: catalogOptions('plants'), required: true, error: e.plantId })}
        ${selectFieldHtml({ id: 'em-activityTypeId', path: path('activityTypeId'), label: t('fields.activityType'), value: f.activityTypeId, options: catalogOptions('activityTypes'), required: true, error: e.activityTypeId })}
      </div>

      ${operationsHtml(f)}
    </form>
    ${actionBarHtml({ form: 'form-emergency', submitLabel: t('common.save'), busyLabel: t('common.sending'), busy: isBusy('emergency'), fallback: 'solicitacao' })}`, { cls: 'view--form' });
}

export function operationView() {
  const f = state.forms.operation;
  const e = f.errors;
  const path = (key) => `forms.operation.${key}`;
  const emergency = state.forms.emergency;
  return viewHtml(`
    ${subheaderHtml(t('operation.title'), { fallback: 'solicitacao/emergencia' })}
    ${legendHtml()}
    <form id="form-operation" class="form" data-submit="operation" novalidate>
      ${locationFieldHtml({ id: 'op-location', label: t('fields.location'), value: locationLabel(emergency.locationCode), placeholder: t('placeholders.location'), disabled: true })}
      ${inputFieldHtml({ id: 'op-description', path: path('description'), label: t('fields.description'), value: f.description, required: true, error: e.description, placeholder: t('placeholders.describeOperation'), attrs: `maxlength="${LIMITS.shortTextMax}"` })}
      ${textareaFieldHtml({ id: 'op-longText', path: path('longText'), label: t('fields.longText'), value: f.longText, error: e.longText, placeholder: t('placeholders.details'), rows: 2, attrs: `maxlength="${LIMITS.longTextMax}"` })}
      <div class="form-row">
        ${selectFieldHtml({ id: 'op-plantId', path: path('plantId'), label: t('fields.plant'), value: f.plantId, options: catalogOptions('plants'), error: e.plantId })}
        ${selectFieldHtml({ id: 'op-workCenterId', path: path('workCenterId'), label: t('fields.workCenter'), value: f.workCenterId, options: catalogOptions('workCenters'), required: true, error: e.workCenterId })}
      </div>
      ${inputFieldHtml({ id: 'op-people', path: path('people'), label: t('fields.people'), value: f.people, type: 'number', required: true, error: e.people, attrs: `min="1" max="${LIMITS.peopleMax}" step="1" inputmode="numeric"` })}
    </form>
    ${actionBarHtml({ form: 'form-operation', submitLabel: t('common.add'), busyLabel: t('common.add'), fallback: 'solicitacao/emergencia' })}`, { cls: 'view--form' });
}
