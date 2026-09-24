// Notas: lista com busca, detalhe (somente leitura) e cadastro progressivo
// (tipo → nº da ordem, quando o tipo exige → demais campos).

import { FAILURE_PROBABILITIES, LIMITS, MAINTENANCE_IMPACTS, PHOTO, PRIORITIES } from '../config.js';
import { esc, icon } from '../utils.js';
import { formatDateTime, t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { hrefFor } from '../router.js';
import { catalogLabel, catalogOptions, filterNotes, locationLabel, noteTypeLabel, requiresOrder } from '../model.js';
import {
  actionBarHtml, emptyHtml, errorText, iconButtonHtml, inputFieldHtml, legendHtml, locationFieldHtml, locationLineHtml,
  priorityChipHtml, readonlyFieldHtml, searchToolbarHtml, sectionTitleHtml, selectFieldHtml, subheaderHtml,
  textareaFieldHtml, viewHtml,
} from './components.js';
import { notFoundView } from './shell.js';

const options = (values, ns) => values.map((v) => ({ value: v, label: t(`${ns}.${v}`) }));

function noteCardHtml(n) {
  return `
  <li>
    <a class="entity-card entity-card--${esc(n.priority)}" href="${hrefFor(`notas/${encodeURIComponent(n.code)}`)}">
      <span class="entity-card__header">
        <span class="code-badge">${esc(n.code)}</span>
        ${priorityChipHtml(n.priority)}
      </span>
      <span class="entity-card__desc">${esc(n.description)}</span>
      ${locationLineHtml(locationLabel(n.locationCode))}
      <span class="entity-card__facts">
        <span><strong>${esc(t('common.typePrefix'))}</strong> ${esc(n.type)}</span>
        ${n.orderNumber ? `<span><strong>${esc(t('common.orderPrefix'))}</strong> ${esc(n.orderNumber)}</span>` : ''}
        <span><strong>${esc(t('common.startPrefix'))}</strong> ${esc(formatDateTime(n.startAt) || '—')}</span>
      </span>
    </a>
  </li>`;
}

export function notesView() {
  const ui = state.ui.notes;
  const items = filterNotes(ui);
  const search = ui.search.trim();
  return viewHtml(`
    ${subheaderHtml(t('notes.title'))}
    ${searchToolbarHtml({
      id: 'nt-search', path: 'ui.notes.search', placeholder: t('notes.search'),
      buttons: iconButtonHtml({ href: 'notas/nova', iconName: 'plus', label: t('notes.newAria') }),
    })}
    <div class="page page--list">
      ${items.length
        ? `<ul class="list list--cards" role="list">${items.map(noteCardHtml).join('')}</ul>`
        : emptyHtml(search ? t('notes.emptySearch', { term: search }) : t('notes.empty'), { clearPath: search ? 'ui.notes.search' : '' })}
    </div>`);
}

function photoGridHtml(photos, { source, removable = false, code = '' }) {
  if (!photos.length) return `<p class="panel__empty">${esc(t('notes.photosEmpty'))}</p>`;
  return `
  <ul class="photo-grid" role="list">
    ${photos.map((src, i) => `
      <li class="photo-grid__item">
        <button type="button" id="photo-${source}-${i}" class="photo-grid__thumb" data-action="viewPhoto" data-source="${source}" data-code="${esc(code)}" data-index="${i}" aria-label="${esc(t('notes.viewPhotoAria', { n: i + 1 }))}">
          <img src="${esc(src)}" alt="${esc(t('notes.photoAlt', { n: i + 1 }))}" loading="lazy">
        </button>
        ${removable ? `<button type="button" class="photo-grid__remove" data-action="removePhoto" data-index="${i}" aria-label="${esc(t('notes.removePhotoAria', { n: i + 1 }))}">${icon('close', { sw: 2.5 })}</button>` : ''}
      </li>`).join('')}
  </ul>`;
}

export function noteDetailView() {
  const note = state.db.notes.find((n) => n.code === state.route.params.code);
  if (!note) return notFoundView({ title: t('notes.notFound'), text: '' });
  const field = (key, label, value, multiline = false) => readonlyFieldHtml({ id: `nd-${key}`, label, value, multiline });
  return viewHtml(`
    ${subheaderHtml(t('notes.detailTitle'), { fallback: 'notas' })}
    <div class="page">
      <section class="summary-card">
        <div class="entity-card__header">
          <span class="summary-card__code">${esc(note.code)}</span>
          ${priorityChipHtml(note.priority)}
        </div>
        <p class="summary-card__desc">${esc(note.description)}</p>
        ${locationLineHtml(locationLabel(note.locationCode))}
      </section>
    </div>
    <div class="form form--readonly">
      ${sectionTitleHtml(t('sections.identification'), { first: true })}
      ${field('type', t('fields.noteType'), noteTypeLabel(note.type))}
      ${note.orderNumber ? field('orderNumber', t('fields.orderNumber'), note.orderNumber) : ''}
      ${sectionTitleHtml(t('sections.details'))}
      ${field('location', t('fields.location'), locationLabel(note.locationCode))}
      ${field('description', t('fields.description'), note.description)}
      ${field('longText', t('fields.longText'), note.longText, true)}
      ${sectionTitleHtml(t('sections.period'))}
      <div class="form-row">
        ${field('startAt', t('fields.start'), formatDateTime(note.startAt))}
        ${field('endAt', t('fields.end'), formatDateTime(note.endAt))}
      </div>
      ${sectionTitleHtml(t('sections.classification'))}
      <div class="form-row">
        ${field('planningGroup', t('fields.planningGroup'), catalogLabel('planningGroups', note.planningGroupId))}
        ${field('workCenter', t('fields.workCenter'), catalogLabel('workCenters', note.workCenterId))}
        ${field('probability', t('fields.failureProbability'), t(`probability.${note.failureProbability}`))}
        ${field('impact', t('fields.maintenanceImpact'), t(`impact.${note.maintenanceImpact}`))}
        ${field('priority', t('fields.priority'), t(`priority.${note.priority}`))}
      </div>
      ${sectionTitleHtml(t('sections.photos'))}
      <div class="panel">${photoGridHtml(note.photos || [], { source: 'note', code: note.code })}</div>
    </div>`);
}

export function newNoteView() {
  const f = state.forms.note;
  const e = f.errors;
  const path = (key) => `forms.note.${key}`;
  const needsOrder = f.type ? requiresOrder(f.type) : false;
  const showRest = !!f.type && (!needsOrder || f.orderNumber.trim() !== '');
  const typeOptions = state.db.noteTypes.map((nt) => ({ value: nt.id, label: noteTypeLabel(nt.id) }));
  const full = f.photos.length >= PHOTO.maxPerNote;
  const photoError = e.photos;

  const rest = `
    ${sectionTitleHtml(t('sections.details'))}
    ${locationFieldHtml({ id: 'nn-locationCode', label: t('fields.location'), value: locationLabel(f.locationCode), placeholder: t('placeholders.location'), required: true, error: e.locationCode, action: 'openLocationPicker' })}
    ${inputFieldHtml({ id: 'nn-description', path: path('description'), label: t('fields.description'), value: f.description, required: true, error: e.description, placeholder: t('placeholders.describeNote'), attrs: `maxlength="${LIMITS.shortTextMax}"` })}
    ${textareaFieldHtml({ id: 'nn-longText', path: path('longText'), label: t('fields.longText'), value: f.longText, required: true, error: e.longText, placeholder: t('placeholders.details'), rows: 3, attrs: `maxlength="${LIMITS.longTextMax}"` })}

    ${sectionTitleHtml(t('sections.period'))}
    <div class="form-row">
      ${inputFieldHtml({ id: 'nn-startAt', path: path('startAt'), label: t('fields.start'), value: f.startAt, type: 'datetime-local', required: true, error: e.startAt })}
      ${inputFieldHtml({ id: 'nn-endAt', path: path('endAt'), label: t('fields.end'), value: f.endAt, type: 'datetime-local', required: true, error: e.endAt, attrs: f.startAt ? `min="${esc(f.startAt)}"` : '' })}
    </div>

    ${sectionTitleHtml(t('sections.classification'))}
    <div class="form-row">
      ${selectFieldHtml({ id: 'nn-planningGroupId', path: path('planningGroupId'), label: t('fields.planningGroup'), value: f.planningGroupId, options: catalogOptions('planningGroups'), required: true, error: e.planningGroupId })}
      ${selectFieldHtml({ id: 'nn-workCenterId', path: path('workCenterId'), label: t('fields.workCenter'), value: f.workCenterId, options: catalogOptions('workCenters'), required: true, error: e.workCenterId })}
      ${selectFieldHtml({ id: 'nn-failureProbability', path: path('failureProbability'), label: t('fields.failureProbability'), value: f.failureProbability, options: options(FAILURE_PROBABILITIES, 'probability'), required: true, error: e.failureProbability })}
      ${selectFieldHtml({ id: 'nn-maintenanceImpact', path: path('maintenanceImpact'), label: t('fields.maintenanceImpact'), value: f.maintenanceImpact, options: options(MAINTENANCE_IMPACTS, 'impact'), required: true, error: e.maintenanceImpact })}
      ${selectFieldHtml({ id: 'nn-priority', path: path('priority'), label: t('fields.priority'), value: f.priority, options: options(PRIORITIES, 'priority'), required: true, error: e.priority })}
    </div>

    ${sectionTitleHtml(t('sections.photos'))}
    <div class="field${photoError ? ' is-invalid' : ''}">
      <div class="panel">
        <div class="panel__header">
          <span class="panel__cols"><span>${esc(t('notes.attachments'))} (${f.photos.length}/${PHOTO.maxPerNote})</span></span>
          <button type="button" id="nn-photos" class="icon-btn${f.photoProcessing ? ' is-busy' : ''}" data-action="addPhoto" aria-label="${esc(t('notes.addPhotoAria'))}"${f.photoProcessing || full ? ' disabled' : ''}${photoError ? ' aria-describedby="nn-photos-error"' : ''}>${f.photoProcessing ? '<span class="spinner spinner--sm spinner--light" aria-hidden="true"></span>' : icon('camera')}</button>
        </div>
        ${f.photoProcessing ? `<p class="panel__empty" role="status">${esc(t('notes.photoProcessing'))}</p>` : ''}
        ${photoGridHtml(f.photos, { source: 'draft', removable: true })}
      </div>
      ${photoError ? `<p id="nn-photos-error" class="field__error">${esc(errorText(photoError))}</p>` : `<p class="field__hint">${esc(t('notes.photoHint'))}</p>`}
      <input id="nn-photo-input" class="sr-only" type="file" accept="image/*" capture="environment" tabindex="-1" aria-hidden="true">
    </div>`;

  return viewHtml(`
    ${subheaderHtml(t('notes.newTitle'), { fallback: 'notas' })}
    ${legendHtml()}
    <form id="form-note" class="form" data-submit="note" novalidate>
      ${sectionTitleHtml(t('sections.identification'), { first: true })}
      ${selectFieldHtml({ id: 'nn-type', path: path('type'), label: t('fields.noteType'), value: f.type, options: typeOptions, required: true, error: e.type, placeholder: t('placeholders.noteType'), live: true })}
      ${needsOrder ? inputFieldHtml({ id: 'nn-orderNumber', path: path('orderNumber'), label: t('fields.orderNumber'), value: f.orderNumber, required: true, error: e.orderNumber, placeholder: t('placeholders.orderNumber'), live: 'empty', attrs: 'inputmode="numeric" maxlength="12"' }) : ''}
      ${showRest ? rest : `<p class="form-step-hint">${esc(t(f.type ? 'notes.stepOrder' : 'notes.stepType'))}</p>`}
    </form>
    ${actionBarHtml({ form: 'form-note', submitLabel: t('common.save'), busyLabel: t('common.saving'), busy: isBusy('note'), disabled: f.photoProcessing, fallback: 'notas' })}`, { cls: 'view--form' });
}
