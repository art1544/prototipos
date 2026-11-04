/**
 * Botão "i" das métricas: um único balão de explicação, aberto por clique (funciona no celular) e fechado
 * com outro clique, Esc, rolagem ou redimensionamento.
 */
import {esc} from '../util/formato.js';

/**
 * HTML do botão "i". O texto vai em data-info e só vira conteúdo quando o balão abre.
 * @param {string} texto explicação; vazio não gera botão
 * @param {string} [titulo] título em negrito no balão
 */
export function info(texto, titulo) {
  if (!texto) return '';
  return '<button type="button" class="info" aria-label="O que é esta métrica" aria-expanded="false" data-info="' + esc(texto) + '"' +
    (titulo ? ' data-titulo="' + esc(titulo) + '"' : '') + '>i</button>';
}

let pop = null;
let popDe = null;

function fecharPop() {
  if (popDe) popDe.setAttribute('aria-expanded', 'false');
  popDe = null; pop.hidden = true;
}

function abrirPop(b) {
  fecharPop(); popDe = b; b.setAttribute('aria-expanded', 'true');
  pop.innerHTML = (b.dataset.titulo ? '<b>' + esc(b.dataset.titulo) + '</b>' : '') + esc(b.dataset.info);
  // dentro do modal o balão precisa estar no <dialog> para ficar por cima dele
  const dlg = b.closest('dialog'); (dlg || document.body).appendChild(pop);
  pop.hidden = false; pop.style.left = '0px'; pop.style.top = '0px';
  const r = b.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  const x = Math.max(12, Math.min(r.left - 16, window.innerWidth - w - 12));
  let y = r.bottom + 8; if (y + h > window.innerHeight - 8) y = Math.max(8, r.top - h - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
}

/** Cria o balão e liga os eventos (uma vez, no início). */
export function iniciarPopover() {
  pop = document.createElement('div'); pop.id = 'pop'; pop.hidden = true; pop.setAttribute('role', 'tooltip'); document.body.appendChild(pop);
  document.addEventListener('click', function (ev) {
    const b = ev.target.closest && ev.target.closest('.info');
    if (b) { ev.preventDefault(); ev.stopPropagation(); if (popDe === b) fecharPop(); else abrirPop(b); return; }
    if (!(ev.target.closest && ev.target.closest('#pop'))) fecharPop();
  }, true);
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') fecharPop(); });
  window.addEventListener('scroll', fecharPop, true);
  window.addEventListener('resize', fecharPop);
}
