// Serviços de interface fora do ciclo de render: toast e diálogo modal.
// Ficam fora de #app para não serem recriados (e reanimados) a cada redesenho da tela.

import { APP } from './config.js';
import { esc, icon } from './utils.js';
import { t } from './i18n/index.js';

/* ---------- toast ---------- */

const toastEl = document.getElementById('toast');
let toastTimer = null;

// type: 'info' | 'success' | 'error'
export function showToast(message, type = 'info') {
  if (!toastEl) return;
  clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.dataset.type = type;
  toastEl.classList.add('is-visible');
  toastTimer = setTimeout(hideToast, type === 'error' ? APP.alertToastMs : APP.toastMs);
}

export function hideToast() {
  if (toastEl) toastEl.classList.remove('is-visible');
}

/* ---------- dialog ---------- */

const dialogEl = document.getElementById('dialog');
let resolveDialog = null;
let returnFocusId = null;

// Resolve a promessa do diálogo aberto (uma única vez).
function settle(value) {
  const resolve = resolveDialog;
  resolveDialog = null;
  if (resolve) resolve(value);
}

function cleanup() {
  dialogEl.innerHTML = '';
  const target = returnFocusId && document.getElementById(returnFocusId);
  returnFocusId = null;
  if (target) target.focus({ preventScroll: true });
}

// Fecha e resolve na hora, sem esperar o evento "close" (que o navegador pode adiar
// quando a aba está em segundo plano).
export function closeDialog(value = 'cancel') {
  if (!dialogEl || !dialogEl.open) return;
  settle(value);
  dialogEl.close(value);
  cleanup();
}

if (dialogEl) {
  // Clique no fundo escurecido fecha (o conteúdo ocupa toda a caixa do <dialog>).
  dialogEl.addEventListener('click', (e) => {
    const closer = e.target.closest('[data-dialog-close]');
    if (closer) closeDialog(closer.dataset.dialogClose || 'cancel');
    else if (e.target === dialogEl) closeDialog('cancel');
  });
  // Esc ou "voltar" do Android: o navegador fecha sozinho.
  dialogEl.addEventListener('cancel', () => settle('cancel'));
  dialogEl.addEventListener('close', () => {
    if (dialogEl.open) return; // evento atrasado de um diálogo anterior
    settle(dialogEl.returnValue || 'cancel');
    if (dialogEl.innerHTML) cleanup();
  });
}

// Abre o diálogo com o HTML informado. Resolve com o valor de fechamento.
export function openDialog(html, { labelledBy = 'dialog-title', variant = '' } = {}) {
  if (!dialogEl) return Promise.resolve('cancel');
  closeDialog('cancel');
  returnFocusId = document.activeElement && document.activeElement.id ? document.activeElement.id : null;
  dialogEl.className = `dialog${variant ? ` dialog--${variant}` : ''}`;
  dialogEl.setAttribute('aria-labelledby', labelledBy);
  dialogEl.returnValue = '';
  dialogEl.innerHTML = `<div class="dialog__sheet">${html}</div>`;
  dialogEl.showModal();
  return new Promise((resolve) => { resolveDialog = resolve; });
}

export function dialogHeaderHtml(title) {
  return `
  <div class="dialog__header">
    <h2 id="dialog-title" class="dialog__title">${esc(title)}</h2>
    <button type="button" class="dialog__close" data-dialog-close="cancel" aria-label="${esc(t('common.close'))}">${icon('close')}</button>
  </div>`;
}

// Confirmação estilizada no lugar do window.confirm. Resolve true/false.
// `html` (confiável) entra abaixo do texto, ex.: um aviso destacado.
export async function confirmDialog({ title, text = '', html = '', confirmLabel = t('common.confirm'), cancelLabel = t('common.cancel'), danger = false }) {
  const result = await openDialog(`
    ${dialogHeaderHtml(title)}
    ${text ? `<p class="dialog__text">${esc(text)}</p>` : ''}
    ${html ? `<div class="dialog__body">${html}</div>` : ''}
    <div class="dialog__actions">
      <button type="button" class="btn btn--secondary" data-dialog-close="cancel">${esc(cancelLabel)}</button>
      <button type="button" class="btn ${danger ? 'btn--danger' : 'btn--primary'}" data-dialog-close="confirm" autofocus>${esc(confirmLabel)}</button>
    </div>`, { variant: 'confirm' });
  return result === 'confirm';
}

// Mensagens de erro nos campos do diálogo: <p data-error="campo"> e o contêiner [data-name="campo"].
function showDialogErrors(errors) {
  dialogEl.querySelectorAll('[data-error]').forEach((el) => {
    const error = errors[el.dataset.error];
    el.textContent = error ? t(error.key, error.vars) : '';
    el.hidden = !error;
  });
  dialogEl.querySelectorAll('[data-name]').forEach((el) => el.classList.toggle('is-invalid', !!errors[el.dataset.name]));
  const first = Object.keys(errors).map((name) => dialogEl.querySelector(`[data-name="${name}"] input, [data-name="${name}"] select, [data-name="${name}"] textarea`)).find(Boolean);
  if (first) first.focus();
}

// Diálogo com formulário (registro de desvio, título da foto, inclusão de pessoas…).
// O HTML traz um <form> com botão submit. `read(form)` lê os valores e `validate(values)` devolve
// erros por campo ({ campo: { key, vars } }): com erro o diálogo continua aberto e mostra as
// mensagens. `onChange(form, event)` trata interações (ex.: "Selecionar tudo").
// Resolve com os valores confirmados ou null (cancelado).
export async function formDialog(html, { read, validate = () => ({}), onChange = null } = {}) {
  let values = null;
  const controller = new AbortController();
  const { signal } = controller;
  const result = openDialog(html, { variant: 'form' });

  dialogEl.addEventListener('submit', (e) => {
    e.preventDefault();
    const current = read(e.target);
    const errors = validate(current);
    if (Object.keys(errors).length) {
      showDialogErrors(errors);
      return;
    }
    values = current;
    closeDialog('confirm');
  }, { signal });

  const changed = (e) => {
    const wrap = e.target.closest('[data-name]');
    if (wrap && wrap.classList.contains('is-invalid')) {
      wrap.classList.remove('is-invalid');
      const error = dialogEl.querySelector(`[data-error="${wrap.dataset.name}"]`);
      if (error) error.hidden = true;
    }
    if (onChange) onChange(e.target.form || dialogEl.querySelector('form'), e);
  };
  dialogEl.addEventListener('change', changed, { signal });
  dialogEl.addEventListener('input', changed, { signal });

  const closed = await result;
  controller.abort();
  return closed === 'confirm' ? values : null;
}
