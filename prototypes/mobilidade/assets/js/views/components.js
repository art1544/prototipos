// Blocos de marcação reutilizados pelas telas. Todo texto dinâmico passa por esc().

import { esc, icon } from '../utils.js';
import { t, tHtml } from '../i18n/index.js';
import { getPath, isBusy } from '../store.js';
import { hrefFor } from '../router.js';

export const errorText = (error) => (error ? t(error.key, error.vars) : '');

/* ---------- estrutura da tela ---------- */

// Barra laranja com "voltar" e o título (h1 recebe o foco ao trocar de tela).
// `end`: botão opcional à direita (ex.: editar). `noBack`: sem voltar (primeiro acesso).
export function subheaderHtml(title, { fallback = '', end = '', noBack = false } = {}) {
  return `
  <header class="subheader">
    ${noBack ? '' : `<button type="button" class="subheader__back" data-action="back" data-fallback="${esc(fallback)}" aria-label="${esc(t('common.back'))}">${icon('back')}</button>`}
    <h1 id="page-title" class="subheader__title" tabindex="-1">${esc(title)}</h1>
    ${end}
  </header>`;
}

export function viewHtml(content, { cls = '' } = {}) {
  return `<div class="view${cls ? ` ${cls}` : ''}">${content}</div>`;
}

export function emptyHtml(text, { clearPath = '' } = {}) {
  return `
  <div class="empty">
    <p>${esc(text)}</p>
    ${clearPath ? `<button type="button" class="link-btn" data-action="clearSearch" data-path="${esc(clearPath)}">${esc(t('common.clearSearch'))}</button>` : ''}
  </div>`;
}

export function sectionTitleHtml(text, { first = false, required = false } = {}) {
  return `<h2 class="form-section${first ? ' form-section--first' : ''}">${esc(text)}${required ? ' <span class="req" aria-hidden="true">*</span>' : ''}</h2>`;
}

export function legendHtml() {
  return `<p class="form-legend">${tHtml('common.requiredLegend', { asterisk: '<span class="req" aria-hidden="true">*</span>' })}</p>`;
}

// Barra fixa no rodapé com Voltar + ação principal (sempre alcançável em formulários longos).
export function actionBarHtml({ submitLabel, busyLabel, busy = false, disabled = false, form = '', fallback = '', noBack = false }) {
  return `
  <div class="action-bar">
    ${noBack ? '' : `<button type="button" class="btn btn--secondary" data-action="back" data-fallback="${esc(fallback)}">${esc(t('common.back'))}</button>`}
    <button type="submit"${form ? ` form="${esc(form)}"` : ''} class="btn btn--primary${busy ? ' is-busy' : ''}"${busy || disabled ? ' disabled' : ''}${busy ? ' aria-busy="true"' : ''}>${esc(busy ? busyLabel : submitLabel)}</button>
  </div>`;
}

/* ---------- barras de ferramentas ---------- */

export function iconButtonHtml({ action = '', href = '', iconName, label, busyKey = '', tone = '', data = {}, id = '' }) {
  const busy = busyKey && isBusy(busyKey);
  const attrs = Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  const cls = `icon-btn${tone ? ` icon-btn--${tone}` : ''}${busy ? ' is-busy' : ''}`;
  const idAttr = id ? ` id="${esc(id)}"` : '';
  if (href) return `<a${idAttr} class="${cls}" href="${esc(hrefFor(href))}" aria-label="${esc(label)}" title="${esc(label)}">${icon(iconName)}</a>`;
  return `<button type="button"${idAttr} class="${cls}" data-action="${esc(action)}"${attrs} aria-label="${esc(label)}" title="${esc(label)}"${busy ? ' disabled aria-busy="true"' : ''}>${icon(iconName)}</button>`;
}

// Botão com ícone e texto das barras de ferramentas.
// tone: primary (laranja cheio) | blue | green | danger | '' (laranja claro)
export function toolButtonHtml({ action = '', href = '', iconName, label, tone = '', busyKey = '', active = false, data = {}, id = '' }) {
  const busy = busyKey && isBusy(busyKey);
  const attrs = Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  const cls = ['tool-btn', tone && `tool-btn--${tone}`, active && 'is-active', busy && 'is-busy'].filter(Boolean).join(' ');
  const idAttr = id ? ` id="${esc(id)}"` : '';
  const content = `${icon(iconName)}<span>${esc(label)}</span>`;
  if (href) return `<a${idAttr} class="${cls}" href="${esc(hrefFor(href))}">${content}</a>`;
  return `<button type="button"${idAttr} class="${cls}" data-action="${esc(action)}"${attrs}${active ? ' aria-pressed="true"' : ''}${busy ? ' disabled aria-busy="true"' : ''}>${content}</button>`;
}

// Busca + botões. Com botões de texto (toolButtonHtml), eles descem para a linha de baixo.
export function searchToolbarHtml({ id, path, placeholder, buttons = '' }) {
  const value = getPath(path) || '';
  const labeled = buttons.includes('tool-btn');
  return `
  <div class="toolbar${labeled ? ' toolbar--labeled' : ''}">
    <div class="searchbox">
      ${icon('search')}
      <input id="${esc(id)}" type="search" enterkeyhint="search" autocomplete="off" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}" value="${esc(value)}" data-field="${esc(path)}" data-live>
    </div>
    ${labeled ? `<div class="toolbar__buttons">${buttons}</div>` : buttons}
  </div>`;
}

// Abas de filtro (Todas / Em andamento / …). Não são painéis: cada botão aplica um filtro à lista.
export function filterTabsHtml({ label, path, options }) {
  const current = getPath(path);
  return `
  <div class="tabs" role="group" aria-label="${esc(label)}">
    ${options.map((opt) => `<button type="button" class="tab${opt.value === current ? ' is-active' : ''}" data-action="setFilter" data-path="${esc(path)}" data-value="${esc(opt.value)}" aria-pressed="${opt.value === current}">${esc(opt.label)}</button>`).join('')}
  </div>`;
}

/* ---------- badges ---------- */

// Atributos de quem abre uma dica ao ser tocado (ver tooltip.js). Fora de links, recebe foco.
export function tipAttrs(text, { focusable = false, action = '', actionLabel = '', data = {} } = {}) {
  if (!text) return '';
  const extra = Object.entries(data).map(([k, v]) => ` data-${k}="${esc(v)}"`).join('');
  return ` data-tip="${esc(text)}"${action ? ` data-tip-action="${esc(action)}" data-tip-action-label="${esc(actionLabel)}"` : ''}${extra}${focusable ? ' tabindex="0" role="button"' : ''}`;
}

export function pillHtml(kind, label, { tip = '', focusable = false, iconName = '' } = {}) {
  return `<span class="pill pill--${esc(kind)}"${tipAttrs(tip, { focusable })}>${esc(label)}${iconName ? icon(iconName, { cls: 'pill__icon' }) : ''}</span>`;
}

export function priorityChipHtml(priority) {
  return `<span class="chip chip--${esc(priority)}">${esc(t(`priority.${priority}`))}</span>`;
}

export function locationLineHtml(text) {
  return text ? `<span class="meta-line">${icon('pin')}<span>${esc(text)}</span></span>` : '';
}

/* ---------- campos de formulário ---------- */

function describedBy(id, error, hint) {
  const ids = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean).join(' ');
  return ids ? ` aria-describedby="${ids}"` : '';
}

export function fieldHtml({ id, label, required = false, error = null, hint = '', locked = false, control, labelFor = true }) {
  const classes = ['field', required && 'is-required', error && 'is-invalid', locked && 'is-locked'].filter(Boolean).join(' ');
  const labelTag = labelFor ? `<label class="field__label" for="${esc(id)}">` : `<span class="field__label" id="${esc(id)}-label">`;
  return `
  <div class="${classes}">
    ${labelTag}${esc(label)}${required ? ' <span class="req" aria-hidden="true">*</span>' : ''}${labelFor ? '</label>' : '</span>'}
    ${control}
    ${error ? `<p id="${esc(id)}-error" class="field__error">${esc(errorText(error))}</p>` : ''}
    ${hint ? `<p id="${esc(id)}-hint" class="field__hint">${esc(hint)}</p>` : ''}
  </div>`;
}

function controlAttrs({ id, path, error, hint, required, live }) {
  // live: true → redesenha a cada digitação; 'empty' → só quando o campo fica vazio/preenchido.
  const liveAttr = live ? ` data-live="${live === 'empty' ? 'empty' : ''}"` : '';
  return `id="${esc(id)}" data-field="${esc(path)}"${liveAttr}${required ? ' aria-required="true"' : ''}${error ? ' aria-invalid="true"' : ''}${describedBy(id, error, hint)}`;
}

// Campo de texto ligado ao estado por `path` (ex.: 'forms.note.description').
export function inputFieldHtml({ id, path, label, value = '', type = 'text', required = false, error = null, hint = '', placeholder = '', live = false, attrs = '' }) {
  const control = `<input class="input" ${controlAttrs({ id, path, error, hint, required, live })} type="${type}" value="${esc(value)}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ''} autocomplete="off" ${attrs}>`;
  return fieldHtml({ id, label, required, error, hint, control });
}

export function textareaFieldHtml({ id, path, label, value = '', required = false, error = null, hint = '', placeholder = '', rows = 3, attrs = '' }) {
  const control = `
    <div class="textarea-wrap">
      <textarea class="input" ${controlAttrs({ id, path, error, hint, required })} rows="${rows}"${placeholder ? ` placeholder="${esc(placeholder)}"` : ''} ${attrs}>${esc(value)}</textarea>
      ${icon('pen', { cls: 'textarea-wrap__icon' })}
    </div>`;
  return fieldHtml({ id, label, required, error, hint, control });
}

export function selectFieldHtml({ id, path, label, value = '', options, required = false, error = null, hint = '', placeholder = '', live = false }) {
  const opts = [
    placeholder ? `<option value=""${value ? '' : ' selected'}>${esc(placeholder)}</option>` : '',
    ...options.map((o) => `<option value="${esc(o.value)}"${o.value === value ? ' selected' : ''}>${esc(o.label)}</option>`),
  ].join('');
  const control = `<div class="select-wrap"><select class="input" ${controlAttrs({ id, path, error, hint, required, live })}>${opts}</select></div>`;
  return fieldHtml({ id, label, required, error, hint, control });
}

// Campo somente leitura (detalhes da ordem/nota e campos bloqueados).
export function readonlyFieldHtml({ id, label, value, multiline = false }) {
  const control = multiline
    ? `<textarea class="input" id="${esc(id)}" rows="3" readonly>${esc(value || '')}</textarea>`
    : `<input class="input" id="${esc(id)}" type="text" value="${esc(value || '')}" readonly>`;
  return fieldHtml({ id, label, locked: true, control });
}

// Botão que abre o seletor de local de instalação.
export function locationFieldHtml({ id, label, value, placeholder, required = false, error = null, action = '', disabled = false }) {
  const control = `
    <button type="button" id="${esc(id)}" class="picker-field${value ? '' : ' is-empty'}"${action && !disabled ? ` data-action="${esc(action)}"` : ''}${disabled ? ' disabled' : ''} aria-labelledby="${esc(id)}-label ${esc(id)}-value"${error ? ' aria-invalid="true"' : ''}${describedBy(id, error, '')}>
      <span id="${esc(id)}-value">${esc(value || placeholder)}</span>
      ${icon('pin')}
    </button>`;
  return fieldHtml({ id, label, required, error, locked: disabled, control, labelFor: false });
}

/* ---------- telas de estado ---------- */

export function stateScreenHtml({ tone = 'info', iconName = 'info', title, text, actions = '' }) {
  return `
  <div class="state-screen">
    <span class="state-screen__icon state-screen__icon--${esc(tone)}">${icon(iconName)}</span>
    <h1 id="page-title" class="state-screen__title" tabindex="-1">${esc(title)}</h1>
    ${text ? `<p class="state-screen__text">${esc(text)}</p>` : ''}
    ${actions ? `<div class="state-screen__actions">${actions}</div>` : ''}
  </div>`;
}
