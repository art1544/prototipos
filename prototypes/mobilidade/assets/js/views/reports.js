// Reportar erro: botão flutuante, formulário de reporte, "Meus reportes" e detalhe (somente leitura).

import { APP, REPORT } from '../config.js';
import { esc, icon } from '../utils.js';
import { formatDateTime, formatNumber, t } from '../i18n/index.js';
import { isBusy, state } from '../store.js';
import { hrefFor } from '../router.js';
import { currentUser } from '../model.js';
import {
  actionBarHtml, emptyHtml, errorText, legendHtml, pillHtml, sectionTitleHtml, subheaderHtml, textareaFieldHtml, viewHtml,
} from './components.js';
import { notFoundView } from './shell.js';

export const REPORT_STATUS_PILL = { enviado: 'sincronizada', aguardando: 'pendente', falha: 'erro' };

// Print simulado (SVG) da tela no momento do reporte: título da tela e mensagem em destaque.
export function mockPrintSrc({ title = '', message = '', tone = 'neutral' }) {
  const color = tone === 'error' ? '#B3211C' : '#4A4A4A';
  const text = (value) => esc(String(value).slice(0, 48));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" font-family="Roboto,Arial,sans-serif"><rect width="360" height="640" fill="#E9E9E9"/><rect width="360" height="58" fill="#fff"/><text x="20" y="35" font-size="16" font-weight="700" fill="#2E2E2E">${esc(APP.name)}</text><rect y="58" width="360" height="56" fill="#F37021"/><text x="20" y="92" font-size="18" font-weight="700" fill="#fff">${text(title)}</text><rect x="16" y="130" width="328" height="110" rx="14" fill="#fff"/><text x="32" y="168" font-size="13" fill="${color}">${text(message)}</text><rect x="32" y="188" width="200" height="10" rx="5" fill="#E5E7EB"/><rect x="32" y="208" width="140" height="10" rx="5" fill="#E5E7EB"/><rect x="16" y="256" width="328" height="110" rx="14" fill="#fff"/><rect x="16" y="382" width="328" height="110" rx="14" fill="#fff"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const printSrc = (print) => (print.src ? print.src : mockPrintSrc(print.mock || {}));

const sizeLabel = () => t('report.dbSize', { size: formatNumber(REPORT.dbSizeMb, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) });

/* ---------- botão flutuante ---------- */

// Laranja = reporte espontâneo; vermelho = há um erro capturado. Começa só com o ícone: o primeiro
// toque expande, o segundo abre o reporte. Com erro capturado aparece o "x" para dispensar.
export function reportFabHtml() {
  const { captured, fabOpen } = state.report;
  const label = t(captured ? 'report.fabError' : 'report.fab');
  return `
  <div class="report-fab${captured ? ' report-fab--error' : ''}${fabOpen ? '' : ' report-fab--mini'}">
    ${captured && fabOpen ? `<button type="button" id="report-fab-dismiss" class="report-fab__dismiss" data-action="dismissCapturedError" aria-label="${esc(t('report.fabDismiss'))}">${icon('close', { sw: 2.5 })}</button>` : ''}
    <button type="button" id="report-fab" class="report-fab__main" data-action="reportFab" aria-expanded="${fabOpen ? 'true' : 'false'}"${fabOpen ? '' : ` aria-label="${esc(t('report.fabShow', { label }))}"`}>
      ${icon('warning')}<span>${esc(label)}</span>
    </button>
  </div>`;
}

/* ---------- blocos ---------- */

function deviceDataHtml() {
  const user = currentUser();
  const device = user.device || {};
  const item = (label, value) => `<div><dt>${esc(label)}</dt><dd>${esc(value || '—')}</dd></div>`;
  return `
  <div class="report-card">
    <dl class="report-data">
      ${item(t('report.userName'), user.name)}
      ${item(t('report.userId'), user.username)}
      ${item(t('report.deviceBrand'), device.brand)}
      ${item(t('report.deviceModel'), device.model)}
      ${item(t('report.deviceImei'), device.imei)}
      ${item(t('report.appVersion'), `${APP.version} ${APP.environment}`)}
    </dl>
  </div>`;
}

function orderTagsHtml(o) {
  return `${o.inProgress ? `<span class="report-tag">${esc(t('report.tagInProgress'))}</span>` : ''}${o.manual ? `<span class="report-tag">${esc(t('report.tagManual'))}</span>` : ''}`;
}

function orderRowsHtml(orders, { removable = false } = {}) {
  return orders.map((o, i) => `
    <li class="report-order">
      <div class="report-order__info">
        <p class="report-order__code">${esc(o.code)}${orderTagsHtml(o)}</p>
        <p class="report-order__ops">${esc(o.operations.length ? t('report.operations', { list: o.operations.join(', ') }) : t('report.noOperation'))}</p>
      </div>
      ${removable ? `<button type="button" id="rp-order-remove-${i}" class="report-order__remove" data-action="removeReportOrder" data-index="${i}" aria-label="${esc(t('report.removeOrder', { code: o.code }))}">${icon('close')}</button>` : ''}
    </li>`).join('');
}

function printGridHtml(prints, { removable = false, source = 'form' } = {}) {
  return `
  <ul class="photo-grid" role="list">
    ${prints.map((p, i) => `
      <li class="photo-grid__item">
        <button type="button" id="rp-print-${source}-${i}" class="photo-grid__thumb" data-action="viewReportPrint" data-source="${source}" data-index="${i}" aria-label="${esc(t('report.viewPrint', { n: i + 1 }))}">
          <img src="${esc(printSrc(p))}" alt="${esc(t('report.printAlt', { n: i + 1 }))}" loading="lazy">
        </button>
        ${p.label ? `<span class="report-print-label">${esc(t(p.label === 'error' ? 'report.printFromError' : 'report.printCurrent'))}</span>` : ''}
        ${removable ? `<button type="button" class="photo-grid__remove" data-action="removeReportPrint" data-index="${i}" aria-label="${esc(t('report.removePrint', { n: i + 1 }))}">${icon('close', { sw: 2.5 })}</button>` : ''}
      </li>`).join('')}
  </ul>`;
}

function databaseCardHtml(title, text) {
  return `
  <div class="report-card report-db">
    ${icon('database')}
    <div>
      <p class="report-db__title">${esc(title)}</p>
      <p class="report-db__text">${esc(text)}</p>
    </div>
  </div>`;
}

/* ---------- formulário ---------- */

export function reportView() {
  const f = state.forms.report;
  if (!f) return notFoundView();
  const e = f.errors;
  const full = f.prints.length >= REPORT.maxPrints;
  const busy = isBusy('report');
  return viewHtml(`
    ${subheaderHtml(t('report.title'), { backAction: 'leaveReport' })}
    ${legendHtml()}
    <form id="form-report" class="form" data-submit="report" novalidate>
      ${sectionTitleHtml(t('report.sectionBasic'), { first: true })}
      ${deviceDataHtml()}

      ${sectionTitleHtml(t('report.sectionOrders'))}
      <div class="panel">
        <div class="panel__header">
          <span class="panel__cols"><span>${esc(t('report.ordersRelated'))}</span></span>
          <button type="button" id="rp-orders" class="tool-btn tool-btn--primary" data-action="selectReportOrders">${icon('plus')}<span>${esc(t('common.add'))}</span></button>
        </div>
        ${f.orders.length
          ? `<ul class="report-orders" role="list">${orderRowsHtml(f.orders, { removable: true })}</ul>`
          : `<p class="panel__empty">${esc(t('report.ordersEmpty'))}</p>`}
      </div>

      ${sectionTitleHtml(t('report.sectionError'))}
      <div class="report-card report-error${f.captured ? ' report-error--captured' : ''}">
        ${icon(f.captured ? 'warning' : 'info')}
        <p>${esc(f.error)}</p>
      </div>

      ${sectionTitleHtml(t('report.sectionWhat'))}
      ${textareaFieldHtml({
        id: 'rp-text', path: 'forms.report.text', label: t('report.textLabel'), value: f.text, required: true, error: e.text,
        placeholder: t('report.textPlaceholder'), rows: 5, attrs: `maxlength="${REPORT.textMax}" data-live`,
      })}
      <p class="report-count" aria-live="polite">${esc(t('report.count', { count: f.text.length, max: REPORT.textMax }))}</p>

      ${sectionTitleHtml(t('report.sectionPrints'))}
      <div class="field${e.prints ? ' is-invalid' : ''}">
        <div class="panel">
          <div class="panel__header">
            <span class="panel__cols"><span>${esc(t('report.printsCount', { count: f.prints.length, max: REPORT.maxPrints }))}</span></span>
            <button type="button" id="rp-prints" class="tool-btn tool-btn--primary${f.printProcessing ? ' is-busy' : ''}" data-action="addReportPrint" aria-label="${esc(t('report.addPrintAria'))}"${f.printProcessing || full ? ' disabled' : ''}>${f.printProcessing ? '<span class="spinner spinner--sm spinner--light" aria-hidden="true"></span>' : icon('image')}<span>${esc(t('report.addPrint'))}</span></button>
          </div>
          ${f.prints.length ? printGridHtml(f.prints, { removable: true }) : `<p class="panel__empty">${esc(t('report.printsEmpty'))}</p>`}
        </div>
        ${e.prints ? `<p id="rp-prints-error" class="field__error">${esc(errorText(e.prints))}</p>` : `<p class="field__hint">${esc(t(f.captured ? 'report.printsHintError' : 'report.printsHintScreen'))}</p>`}
        <input id="rp-print-input" class="sr-only" type="file" accept="image/*" tabindex="-1" aria-hidden="true">
      </div>

      ${sectionTitleHtml(t('report.sectionDb'))}
      ${databaseCardHtml(t('report.dbIncluded', { size: sizeLabel() }), t('report.dbText'))}
    </form>
    ${actionBarHtml({ form: 'form-report', submitLabel: t('report.send'), busyLabel: t('common.sending'), busy, disabled: f.printProcessing, backAction: 'leaveReport' })}`, { cls: 'view--form' });
}

/* ---------- Meus reportes ---------- */

function reportCardHtml(r) {
  const orders = r.orders.length ? r.orders.map((o) => `${o.code}${o.operations.length ? ` · ${o.operations.join(', ')}` : ''}`).join(' | ') : t('report.noOrder');
  const text = r.text.length > 110 ? `${r.text.slice(0, 110)}…` : r.text;
  return `
  <li>
    <a class="report-item" href="${hrefFor(`perfil/reportes/${r.id}`)}">
      <span class="event-card__icon">${icon('warning')}</span>
      <span class="report-item__info">
        <span class="report-item__top">
          <span class="report-item__protocol">${esc(r.protocol || t('report.noProtocol'))}</span>
          <span class="report-item__time">${esc(formatDateTime(r.createdAt))}</span>
        </span>
        <span class="report-item__orders">${esc(orders)}</span>
        <span class="report-item__text">${esc(text)}</span>
        <span class="report-item__bottom">
          ${pillHtml(REPORT_STATUS_PILL[r.status], t(`reportStatus.${r.status}`))}
          <span class="report-item__more">${esc(t('report.seeDetails'))}${icon('chevronRight')}</span>
        </span>
      </span>
    </a>
  </li>`;
}

export function myReportsView() {
  const reports = state.db.reports;
  return viewHtml(`
    ${subheaderHtml(t('report.myTitle'), { fallback: 'perfil' })}
    <div class="page page--list">
      ${reports.length ? `<ul class="list" role="list">${reports.map(reportCardHtml).join('')}</ul>` : emptyHtml(t('report.myEmpty'))}
    </div>`);
}

export const reportById = (id) => state.db.reports.find((r) => String(r.id) === String(id)) || null;

export function reportDetailView() {
  const r = reportById(state.route.params.id);
  if (!r) return notFoundView({ title: t('report.notFound'), text: '' });
  const sent = r.status === 'enviado';
  const resending = isBusy(`resendReport-${r.id}`);
  const resend = r.status === 'falha' ? `
    <div class="report-head__row">
      <p>${esc(t('report.failedHint'))}</p>
      <button type="button" id="rp-resend-${r.id}" class="retry-btn${resending ? ' is-busy' : ''}" data-action="resendReport" data-id="${r.id}"${resending ? ' disabled aria-busy="true"' : ''}>${icon('sync')}<span>${esc(t('report.resend'))}</span></button>
    </div>` : '';
  return viewHtml(`
    ${subheaderHtml(r.protocol || t('report.noProtocolTitle'), { fallback: 'perfil/reportes' })}
    <div class="form form--readonly">
      <div class="report-card report-head">
        <div class="report-head__row">
          <div>
            <p class="report-order__code">${esc(r.protocol || t('report.noProtocol'))}</p>
            <p class="report-order__ops">${esc(t('report.createdAt', { date: formatDateTime(r.createdAt) }))}</p>
          </div>
          ${pillHtml(REPORT_STATUS_PILL[r.status], t(`reportStatus.${r.status}`))}
        </div>
        ${resend}
        ${r.status === 'aguardando' ? `<div class="report-head__row"><p>${esc(t('report.waitingHint'))}</p></div>` : ''}
      </div>

      ${sectionTitleHtml(t('report.sectionBasic'))}
      ${deviceDataHtml()}

      ${sectionTitleHtml(t('report.sectionOrders'))}
      <div class="report-card">
        ${r.orders.length ? `<ul class="report-orders" role="list">${orderRowsHtml(r.orders)}</ul>` : `<p class="panel__empty">${esc(t('report.ordersNone'))}</p>`}
      </div>

      ${sectionTitleHtml(t('report.sectionError'))}
      <div class="report-card"><p class="report-text">${esc(r.error || t('report.notInformed'))}</p></div>

      ${sectionTitleHtml(t('report.sectionWhat'))}
      <div class="report-card"><p class="report-text">${esc(r.text)}</p></div>

      ${sectionTitleHtml(t('report.printsTitle', { count: r.prints.length }))}
      <div class="report-card report-card--padded">
        ${r.prints.length ? printGridHtml(r.prints, { source: 'detail' }) : `<p class="panel__empty">${esc(t('report.printsNone'))}</p>`}
      </div>

      ${sectionTitleHtml(t('report.sectionDb'))}
      ${databaseCardHtml(t(sent ? 'report.dbSent' : 'report.dbAttached', { size: sizeLabel() }), t(sent ? 'report.dbSentText' : 'report.dbKeptText'))}
    </div>`);
}
