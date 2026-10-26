// Dica de status: tocar num status (pílula, cadeado, resumo, qualidade da rede) explica o que ele
// significa. O texto vem pronto em data-tip ("Título: explicação"). Com data-tip-action, a dica
// ganha um botão que dispara essa ação (ex.: estornar uma operação finalizada).

import { esc } from './utils.js';

let bubble = null;
let anchor = null;
let onAction = () => {};

export function closeTip() {
  if (!bubble) return;
  bubble.remove();
  bubble = null;
  anchor = null;
}

function position(target) {
  const rect = target.getBoundingClientRect();
  const width = bubble.offsetWidth;
  const height = bubble.offsetHeight;
  const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8));
  const top = rect.bottom + 8 + height > window.innerHeight ? Math.max(8, rect.top - height - 8) : rect.bottom + 8;
  bubble.style.left = `${left}px`;
  bubble.style.top = `${top}px`;
}

function open(target) {
  closeTip();
  const text = target.dataset.tip;
  const split = text.indexOf(': ');
  bubble = document.createElement('div');
  bubble.className = 'tip';
  bubble.setAttribute('role', 'tooltip');
  bubble.innerHTML = split > -1
    ? `<strong>${esc(text.slice(0, split))}</strong>${esc(text.slice(split + 2))}`
    : esc(text);
  if (target.dataset.tipAction) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tip__action';
    button.textContent = target.dataset.tipActionLabel || '';
    const data = { ...target.dataset };
    button.addEventListener('click', () => {
      closeTip();
      onAction(data.tipAction, data);
    });
    bubble.appendChild(button);
  }
  document.body.appendChild(bubble);
  anchor = target;
  position(target);
}

// handler(actionName, dataset) recebe os cliques nos botões das dicas.
export function initTooltips(handler) {
  onAction = handler;
  // Captura: a dica tem prioridade sobre o clique do cartão (link) em que o status está.
  document.addEventListener('click', (e) => {
    if (bubble && bubble.contains(e.target)) return;
    const target = e.target.closest('[data-tip]');
    if (!target) {
      closeTip();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (anchor === target) closeTip();
    else open(target);
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeTip();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-tip][tabindex]')) {
      e.preventDefault();
      if (anchor === e.target) closeTip();
      else open(e.target);
    }
  });
  window.addEventListener('scroll', closeTip, true);
  window.addEventListener('resize', closeTip);
}
