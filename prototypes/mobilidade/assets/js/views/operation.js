// Cartão de uma operação no detalhe da ordem: status (cadeado), ações (Play / Pausar / Parar / Pessoa /
// Tempo / Anexos / Foto / Nota / Detalhes), painéis que abrem no próprio cartão e o carrossel de
// informações (segurança, instruções e pontos de medida).

import { esc, durationHMS, icon } from '../utils.js';
import { formatDate, formatDateTime, formatNumber, t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { hrefFor } from '../router.js';
import { currentUser, executionOf, notesByIds, operationStatus } from '../model.js';
import { priorityChipHtml, tipAttrs } from './components.js';

const LOCK_ICON = { liberada: 'lockOpen', bloqueada: 'lockClosed', andamento: 'progress', pausada: 'pause', finalizada: 'flag' };

export const execBusyKey = (number) => `exec-${number}`;

/* ---------- pontos de medida ---------- */

const isEmpty = (value) => value === null || value === undefined || value === '';
const LEVEL_COLORS = ['#16a34a', '#eab308', '#f97316', '#dc2626'];
const levels = () => [1, 2, 3, 4].map((n) => t(`info.level${n}`));

// Situação da leitura: ok (verde), bad (vermelho) ou vazia.
export function pointState(point) {
  if (point.type === 'num') {
    if (isEmpty(point.value)) return { cls: '', text: t('info.enterReading') };
    return point.value < point.min || point.value > point.max
      ? { cls: 'bad', text: `⚠ ${t('info.outOfRange')}` }
      : { cls: 'ok', text: `✓ ${t('info.inRange')}` };
  }
  if (point.type === 'quali') {
    if (isEmpty(point.value)) return { cls: '', text: t('info.selectResult') };
    return point.value === 'ok' ? { cls: 'ok', text: `✓ ${t('info.compliant')}` } : { cls: 'bad', text: `⚠ ${t('info.nonCompliant')}` };
  }
  if (isEmpty(point.value)) return { cls: '', text: t('info.selectLevel') };
  const level = Number(point.value);
  return level === 1 ? { cls: 'ok', text: `✓ ${levels()[0]}` } : { cls: 'bad', text: `⚠ ${levels()[level - 1]}` };
}

export const pointMark = (cls) => (cls === 'ok' ? '✓' : cls === 'bad' ? '⚠' : '○');

// Gráfico do histórico do ponto (diálogo "Histórico").
export function pointChartHtml(point) {
  const numeric = point.type === 'num';
  const history = point.history || [];
  const W = 300; const H = 170; const L = 26; const B = 20; const T = 8; const R = 8;
  const ymax = numeric ? Math.ceil((Math.max(point.max, ...history.map((x) => x[1])) + 10) / 20) * 20 : 1;
  const X = (i) => L + (history.length < 2 ? 0 : (i * (W - L - R)) / (history.length - 1));
  const Y = (v) => T + (H - T - B) * (1 - v / ymax);
  const line = (v, color) => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="${color}" stroke-width="2"/>`;

  let svg = `<line x1="${L}" y1="${T}" x2="${L}" y2="${H - B}" stroke="#6b7280"/><line x1="${L}" y1="${H - B}" x2="${W - R}" y2="${H - B}" stroke="#6b7280"/>`;
  if (numeric) {
    for (let v = 0; v <= ymax; v += 20) svg += `<text x="${L - 3}" y="${Y(v) + 3}" font-size="8" text-anchor="end">${v}</text>`;
    svg += line(point.min, '#d1d5db') + line(point.max, '#8b8b8b') + line(point.target, '#ffa500');
    svg += `<polyline fill="none" stroke="#ef0000" stroke-width="2" points="${history.map((x, i) => `${X(i)},${Y(x[1])}`).join(' ')}"/>`;
  }
  history.forEach(([date, value], i) => {
    const anchor = i === 0 ? 'start' : i === history.length - 1 ? 'end' : 'middle';
    svg += `<circle cx="${X(i)}" cy="${Y(value)}" r="3" fill="${numeric || i === history.length - 1 ? '#ef0000' : '#16a34a'}"/>`;
    svg += `<text x="${X(i)}" y="${H - 6}" font-size="7" text-anchor="${anchor}">${esc(formatDate(date))}</text>`;
  });

  const legend = numeric
    ? `<span><i style="background:#d1d5db"></i>${esc(t('info.minimum'))} ${point.min}</span><span><i style="background:#8b8b8b"></i>${esc(t('info.maximum'))} ${point.max}</span><span><i style="background:#ffa500"></i>${esc(t('info.target'))} ${point.target}</span>`
    : `<span><i style="background:#ef0000"></i><b>${esc(t('info.measured'))}</b></span>`;
  return `
  <div class="chart">
    <p class="chart__code">${esc(point.code)}</p>
    <div class="chart__legend">${legend}</div>
    <svg class="chart__svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(t('info.history'))}">${svg}</svg>
    <dl class="chart__meta">
      <dt>${esc(t('info.class'))}</dt><dd>${esc(point.class || '—')}</dd>
      <dt>${esc(t('info.characteristic'))}</dt><dd>${esc(point.characteristic || '—')}</dd>
      <dt>${esc(t('info.unit'))}</dt><dd>${esc(point.unit || '—')}</dd>
    </dl>
  </div>`;
}

/* ---------- carrossel de informações ---------- */

function noteItemHtml(note) {
  return `
  <li>
    <a class="op-note" href="${hrefFor(`notas/${encodeURIComponent(note.code)}`)}">
      <span class="op-note__top"><b>${esc(note.code)}</b>${priorityChipHtml(note.priority)}</span>
      <span class="op-note__desc">${esc(note.description)}</span>
      <small>${esc(t('common.typePrefix'))} ${esc(note.type)} · ${esc(t('common.startPrefix'))} ${esc(formatDateTime(note.startAt) || '—')}</small>
    </a>
  </li>`;
}

function pointControlHtml(op, point, k, editable) {
  const dis = editable ? '' : ' disabled';
  const id = `pt-${op.number}-${k}`;
  if (point.type === 'num') {
    const invalid = pointState(point).cls === 'bad';
    return `
      <p class="op-point__range">${esc(t('info.range'))}: <b>${point.min} – ${point.max}${point.unit ? ` ${esc(point.unit)}` : ''}</b></p>
      <div class="op-point__numrow">
        <input id="${id}" class="op-point__input${invalid ? ' is-invalid' : ''}" type="number" inputmode="decimal" step="any" value="${isEmpty(point.value) ? '' : esc(point.value)}" data-point-input data-op="${esc(op.number)}" data-point="${k}" aria-label="${esc(point.name)}"${dis}>
        ${point.unit ? `<span class="op-point__unit">${esc(point.unit)}</span>` : ''}
      </div>`;
  }
  if (point.type === 'quali') {
    const option = (value, mark, label) => `<button type="button" id="${id}-${value}" class="op-point__quali op-point__quali--${value}${point.value === value ? ' is-selected' : ''}" data-action="setPointQuali" data-op="${esc(op.number)}" data-point="${k}" data-value="${value}" aria-pressed="${point.value === value}"${dis}>${mark} ${esc(label)}</button>`;
    return `<div class="op-point__qualis">${option('ok', '✓', t('info.compliant'))}${option('nok', '✕', t('info.nonCompliant'))}</div>`;
  }
  return `
    <div class="op-point__scale" role="radiogroup" aria-label="${esc(point.name)}">
      ${levels().map((label, j) => {
        const value = String(j + 1);
        const checked = String(point.value) === value;
        return `<label class="op-tile${checked ? ' is-selected' : ''}${editable ? '' : ' is-disabled'}"><input type="radio" id="${id}-${value}" name="${id}" value="${value}" data-change="pointScale" data-op="${esc(op.number)}" data-point="${k}"${checked ? ' checked' : ''}${dis}><i style="background:${LEVEL_COLORS[j]}"></i>${value} - ${esc(label)}</label>`;
      }).join('')}
    </div>`;
}

function infoHtml(op, editable) {
  const info = op.info;
  if (!info) return '';
  const slides = [];
  const chips = [];

  if (info.safety) {
    const s = info.safety;
    const fields = [
      ['createdAt', formatDate(s.createdAt)], ['createdBy', s.createdBy], ['partialDoc', s.partialDoc], ['version', s.version],
      ['component', s.component], ['panelNumber', s.panelNumber], ['panelCoordinate', s.panelCoordinate], ['position', s.position],
    ];
    slides.push(`
      <div class="op-slide__in op-slide__in--safety">
        <p class="op-safety__title">${icon('shield')}${esc(t('info.safetyTitle'))}</p>
        <p class="op-safety__desc">${esc(s.description || '')}</p>
        <div class="op-safety__padlock">${icon('padlock')}<div><span class="op-label">${esc(t('info.padlock'))}</span><b>${esc(s.padlock || '—')}</b></div></div>
        <div class="op-data">${fields.map(([key, value]) => `<div><span class="op-label">${esc(t(`info.${key}`))}</span><b>${esc(value || '—')}</b></div>`).join('')}</div>
      </div>`);
    chips.push({ label: t('info.safety'), cls: 'safety' });
  }

  if (info.text) {
    slides.push(`
      <div class="op-slide__in">
        <div class="op-slide__head"><span class="op-badge">${esc(t('info.instructions'))}</span></div>
        <p class="op-text__title">${esc(info.title || op.title)}</p>
        <p class="op-text">${esc(info.text)}</p>
        <div class="op-place">
          <div><span class="op-label">${esc(t('info.location'))}</span><b>${esc(info.location || '')}</b><small>${esc(info.locationCode || '')}</small></div>
          <div><span class="op-label">${esc(t('info.equipment'))}</span><b>${esc(info.equipment || '')}</b><small>${esc(info.equipmentCode || '')}</small></div>
        </div>
      </div>`);
    chips.push({ label: t('info.instructions'), cls: '' });
  }

  (info.points || []).forEach((point, k) => {
    const st = pointState(point);
    const notes = notesByIds(point.noteIds);
    slides.push(`
      <div class="op-slide__in">
        <div class="op-slide__head op-slide__head--end">
          <button type="button" class="op-hist" data-action="pointHistory" data-op="${esc(op.number)}" data-point="${k}">${icon('chart')}${esc(t('info.history'))}</button>
        </div>
        <button type="button" class="op-point__name" data-action="pointHistory" data-op="${esc(op.number)}" data-point="${k}">${esc(point.name)}</button>
        <p class="op-point__code">${esc(point.code)}</p>
        ${pointControlHtml(op, point, k, editable)}
        <p id="pt-status-${esc(op.number)}-${k}" class="op-point__status${st.cls ? ` op-point__status--${st.cls}` : ''}" aria-live="polite">${esc(st.text)}</p>
        <div class="op-point__notes">
          <div class="op-point__notes-head">
            <span>${esc(t('info.stepNotes'))} (${notes.length})</span>
            <button type="button" class="op-point__note-add" data-action="newNoteFromOperation" data-op="${esc(op.number)}" data-point="${k}">${esc(t('info.addNote'))}</button>
          </div>
          ${notes.length ? `<ul class="op-notes" role="list">${notes.map(noteItemHtml).join('')}</ul>` : ''}
        </div>
        ${editable ? '' : `<p class="op-point__hint">${esc(t('info.startToRecord'))}</p>`}
        <div class="op-place"><div><b>${esc(info.location || '')}</b><small>${esc(info.locationCode || '')}</small></div></div>
      </div>`);
    chips.push({ label: t('info.step', { n: k + 1 }), cls: st.cls, mark: pointMark(st.cls), point: k });
  });

  const at = Math.min(state.ui.orderDetail.slides[op.number] || 0, slides.length - 1);
  return `
  <div class="op-info">
    <p class="op-info__title">${esc(t('info.title'))}</p>
    <div class="op-chips" id="chips-${esc(op.number)}">
      ${chips.map((chip, i) => `<button type="button" class="op-chip${chip.cls ? ` op-chip--${chip.cls}` : ''}${i === at ? ' is-on' : ''}" data-action="carouselGo" data-op="${esc(op.number)}" data-slide="${i}" aria-label="${esc(t('info.goToSlide', { name: chip.label }))}"${chip.point !== undefined ? ` data-chip-point="${chip.point}"` : ''}>${esc(chip.label)}${chip.mark ? ` <span class="op-chip__mark">${chip.mark}</span>` : ''}</button>`).join('')}
    </div>
    <div class="op-car" id="car-${esc(op.number)}" data-op="${esc(op.number)}" data-slide="${at}">
      ${slides.map((slide) => `<div class="op-slide">${slide}</div>`).join('')}
    </div>
    <div class="op-nav">
      <button type="button" class="op-nav__btn" data-action="carouselStep" data-op="${esc(op.number)}" data-dir="-1" aria-label="${esc(t('info.previous'))}"${at === 0 ? ' disabled' : ''}>‹</button>
      <div class="op-dots">${slides.map((_, i) => `<button type="button" class="op-dot${i === at ? ' is-on' : ''}" data-action="carouselGo" data-op="${esc(op.number)}" data-slide="${i}" aria-label="${esc(t('info.goToSlide', { name: chips[i].label }))}"></button>`).join('')}</div>
      <button type="button" class="op-nav__btn" data-action="carouselStep" data-op="${esc(op.number)}" data-dir="1" aria-label="${esc(t('info.next'))}"${at === slides.length - 1 ? ' disabled' : ''}>›</button>
    </div>
  </div>`;
}

/* ---------- painéis do cartão ---------- */

function timePanelHtml(op, ex) {
  if (!ex.confirmations.length) return `<p class="op-panel__empty">${esc(t('execution.timeEmpty'))}</p>`;
  const closed = state.ui.orderDetail.closedConfirmations;
  return `
  <ul class="conf-list" role="list">
    ${ex.confirmations.map((c, i) => {
      const key = `${op.number}:${i}`;
      const open = !closed.includes(key);
      const reason = c.reason === 'auto6h' ? t('execution.autoReason') : c.reason ? t(`deviation.reasons.${c.reason}`) : '—';
      return `
      <li class="conf${open ? ' is-open' : ''}">
        <button type="button" class="conf__head" data-action="toggleConfirmation" data-key="${esc(key)}" aria-expanded="${open}" aria-label="${esc(t('execution.toggleConfirmationAria', { name: c.name }))}">
          ${icon('chevronRight', { cls: 'conf__chevron' })}
          <span class="conf__reg">${esc(c.registration)}</span>
          <span class="conf__name">${esc(c.name || '—')}</span>
          <span class="conf__duration">${esc(durationHMS(c.start, c.end))}</span>
        </button>
        ${open ? `
        <dl class="conf__body">
          <div><dt>${esc(t('execution.start'))}</dt><dd>${esc(formatDateTime(c.start, { seconds: true }))}</dd></div>
          <div><dt>${esc(t('execution.end'))}</dt><dd>${esc(c.end ? formatDateTime(c.end, { seconds: true }) : t('execution.ongoing'))}</dd></div>
          <div class="conf__full"><dt>${esc(t('execution.reason'))}</dt><dd>${esc(reason)}</dd></div>
        </dl>` : ''}
      </li>`;
    }).join('')}
  </ul>`;
}

function attachmentsPanelHtml(op, ex) {
  const user = currentUser();
  const list = ex.attachments.length
    ? `<ul class="op-attachments" role="list">${ex.attachments.map((a) => `
        <li class="op-attachment">
          ${a.dataUrl ? `<img src="${esc(a.dataUrl)}" alt="${esc(a.name)}" loading="lazy">` : `<span class="op-attachment__ph">${icon('photo')}</span>`}
          <span class="op-attachment__name">${esc(a.name)}</span>
          ${a.author === user.registration ? `<button type="button" class="op-attachment__del" data-action="deleteAttachment" data-op="${esc(op.number)}" data-id="${a.id}" aria-label="${esc(t('execution.deleteAttachmentAria', { name: a.name }))}">${icon('trash')}</button>` : ''}
        </li>`).join('')}</ul>`
    : `<p class="op-panel__empty">${esc(t('execution.attachmentsEmpty'))}</p>`;
  return `${list}<button type="button" class="btn btn--secondary btn--block op-panel__add" data-action="galleryOperation" data-op="${esc(op.number)}">${esc(t('execution.addFromGallery'))}</button>`;
}

function notesPanelHtml(op, ex) {
  const notes = notesByIds(ex.noteIds);
  return `
    ${notes.length ? `<ul class="op-notes" role="list">${notes.map(noteItemHtml).join('')}</ul>` : `<p class="op-panel__empty">${esc(t('execution.notesEmpty'))}</p>`}
    <button type="button" class="btn btn--secondary btn--block op-panel__add" data-action="newNoteFromOperation" data-op="${esc(op.number)}">${esc(t('execution.newNote'))}</button>`;
}

function detailsPanelHtml(op) {
  const text = op.longText || `${op.number} - ${op.title}\n${op.equipment}\n${op.code}\n${op.workCenter}`;
  return `<p class="op-panel__text">${esc(text)}</p>`;
}

const PANELS = { relogio: timePanelHtml, anexos: attachmentsPanelHtml, notas: notesPanelHtml, lupa: detailsPanelHtml };

/* ---------- ações ---------- */

function actionsHtml(order, op, ex, status, panel) {
  const busy = isBusy(execBusyKey(op.number));
  const main = (action, iconName, label, tone, extra = '') => `<button type="button" class="op-act op-act--${tone}${busy ? ' is-busy' : ''}${extra}" data-action="${action}" data-op="${esc(op.number)}"${busy ? ' disabled aria-busy="true"' : ''}>${icon(iconName)}<span>${esc(label)}</span></button>`;
  const off = ex.started ? '' : ' is-off';
  const secondary = ({ action, iconName, label, aria, panelName = '', count = null, cls = '' }) => {
    const active = panelName && panel === panelName;
    return `<button type="button" class="op-sec${cls}${active ? ' is-active' : ''}" data-action="${action}" data-op="${esc(op.number)}"${panelName ? ` data-panel="${panelName}" aria-expanded="${active}"` : ''} aria-label="${esc(aria)}" title="${esc(aria)}">${icon(iconName)}${count !== null ? `<span class="op-sec__count">(${count})</span>` : ''}<small>${esc(label)}</small></button>`;
  };

  const mainButtons = ex.started
    ? main('pauseOperation', ex.paused ? 'play' : 'pause', t(ex.paused ? 'execution.resume' : 'execution.pause'), 'pause') + main('stopOperation', 'stop', t('execution.stop'), 'stop')
    : main('playOperation', 'play', t('execution.play'), 'play', status === 'liberada' ? '' : ' is-off');

  return `
  ${ex.started && ex.paused && ex.autoPaused ? `<p class="op-alert" role="status">${icon('clock')}<span>${esc(t('execution.autoPausedAlert'))}</span></p>` : ''}
  <div class="op-actions">
    <div class="op-actions__main">${mainButtons}</div>
    <div class="op-actions__sec">
      ${secondary({ action: 'personOperation', iconName: 'userAdd', label: t('execution.person'), aria: t('execution.personAria'), cls: off })}
      ${secondary({ action: 'panelOperation', iconName: 'clock', label: t('execution.time'), aria: t('execution.timeAria'), panelName: 'relogio' })}
      ${secondary({ action: 'panelOperation', iconName: 'clip', label: t('execution.attachments'), aria: t('execution.attachmentsAria', { count: ex.attachments.length }), panelName: 'anexos', count: ex.attachments.length })}
      ${secondary({ action: 'cameraOperation', iconName: 'photo', label: t('execution.camera'), aria: t('execution.cameraAria'), cls: off })}
      ${secondary({ action: 'panelOperation', iconName: 'bookmark', label: t('execution.note'), aria: t('execution.noteAria', { count: ex.noteIds.length }), panelName: 'notas', count: ex.noteIds.length })}
      ${secondary({ action: 'panelOperation', iconName: 'details', label: t('execution.details'), aria: t('execution.detailsAria'), panelName: 'lupa' })}
    </div>
  </div>
  ${panel && PANELS[panel] ? `<div class="op-panel">${PANELS[panel](op, ex)}</div>` : ''}`;
}

function teamHtml(ex) {
  if (!ex.people.length) return '';
  const user = currentUser();
  return `
  <div class="op-team">
    <p class="op-team__title"><span>${esc(t('execution.team'))}</span><span>${ex.people.length}</span></p>
    <div class="op-team__chips">
      ${ex.people.map((p) => `<span class="person-chip"><span class="avatar-sm" aria-hidden="true">${icon('avatar')}</span>${esc(p.name)} <small>${esc(p.registration === user.registration ? t('common.you') : p.registration)}</small></span>`).join('')}
    </div>
  </div>`;
}

function durationText(op) {
  const value = parseFloat(op.duration);
  if (Number.isNaN(value)) return String(op.duration || '—');
  return t('orderDetail.minutes', { count: value, value: formatNumber(value) });
}

export function operationCardHtml(order, op) {
  const ex = executionOf(op);
  const status = operationStatus(order, op);
  const ui = state.ui.orderDetail;
  const expanded = !ui.collapsed.includes(op.number);
  const panel = ui.panels[op.number] || null;
  const canReverse = status === 'finalizada' && order.status !== 'concluida';
  const lock = `<span class="lock-pill lock-pill--${status}"${tipAttrs(t(`opTips.${status}`), { focusable: true, action: canReverse ? 'reverseOperation' : '', actionLabel: t('execution.reverseAction'), data: { op: op.number } })}>${icon(LOCK_ICON[status])}<span>${esc(t(`opStatus.${status}`))}</span></span>`;

  return `
  <li id="op-${esc(op.number)}" class="op-card${expanded ? ' is-open' : ''}">
    <div class="op-card__header">
      <button type="button" class="op-card__toggle" data-action="toggleOperation" data-op="${esc(op.number)}" aria-expanded="${expanded}" aria-label="${esc(t('orderDetail.toggleOpAria', { number: op.number }))}">
        ${icon('chevronRight', { cls: 'op-card__chevron' })}
        <span class="op-card__number">${esc(op.number)}</span>
        <span class="op-card__title">${esc(op.title)}</span>
      </button>
      ${lock}
    </div>
    ${expanded ? `
    <span class="op-card__code">${esc(op.code)}</span>
    <span class="op-card__equipment">${esc(op.equipment)}</span>
    <span class="op-card__center">${esc(op.workCenter)}</span>
    <div class="op-card__footer">
      <span class="op-card__fact">${icon('people')}<span>${esc(t('orderDetail.inspectors', { count: Number(op.people) || 0 }))}</span></span>
      <span class="op-card__fact">${icon('clock')}<span>${esc(durationText(op))}</span></span>
    </div>
    ${teamHtml(ex)}
    ${actionsHtml(order, op, ex, status, panel)}
    ${infoHtml(op, ex.started && !ex.finished)}` : ''}
  </li>`;
}
