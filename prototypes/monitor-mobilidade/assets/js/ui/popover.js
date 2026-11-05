/**
 * Botão "i" das métricas: um único balão de explicação, aberto por clique (funciona no celular) e fechado com
 * outro clique, Esc, rolagem ou redimensionamento.
 */
import { html } from '../util/html.js';

const MARGEM = 12;
const DISTANCIA = 8;

let balao = null;
let origem = null;

/**
 * Botão "i". O texto vai em data-info e só vira conteúdo quando o balão abre.
 * @param {string} texto explicação; vazio não gera botão
 * @param {string} [titulo] título em negrito no balão
 */
export function info(texto, titulo) {
  if (!texto) return '';
  return html`<button type="button" class="info" aria-label="O que é esta métrica" aria-expanded="false"
    data-info="${texto}"${titulo ? html` data-titulo="${titulo}"` : ''}>i</button>`;
}

function fechar() {
  origem?.setAttribute('aria-expanded', 'false');
  origem = null;
  balao.hidden = true;
}

function posicionar(botao) {
  balao.style.left = '0px';
  balao.style.top = '0px';
  const alvo = botao.getBoundingClientRect();
  const { offsetWidth: largura, offsetHeight: altura } = balao;
  const x = Math.max(MARGEM, Math.min(alvo.left - 16, window.innerWidth - largura - MARGEM));
  let y = alvo.bottom + DISTANCIA;
  if (y + altura > window.innerHeight - DISTANCIA) y = Math.max(DISTANCIA, alvo.top - altura - DISTANCIA);
  balao.style.left = `${x}px`;
  balao.style.top = `${y}px`;
}

function abrir(botao) {
  fechar();
  origem = botao;
  botao.setAttribute('aria-expanded', 'true');
  const { titulo, info: texto } = botao.dataset;
  balao.innerHTML = html`${titulo ? html`<b>${titulo}</b>` : ''}${texto}`;
  // dentro do modal o balão precisa estar no <dialog> para ficar por cima dele
  (botao.closest('dialog') || document.body).appendChild(balao);
  balao.hidden = false;
  posicionar(botao);
}

/** Cria o balão e liga os eventos (uma vez, no início). */
export function iniciarPopover() {
  balao = Object.assign(document.createElement('div'), { id: 'pop', hidden: true });
  balao.setAttribute('role', 'tooltip');
  document.body.appendChild(balao);

  document.addEventListener(
    'click',
    (evento) => {
      const botao = evento.target.closest?.('.info');
      if (botao) {
        evento.preventDefault();
        evento.stopPropagation();
        if (origem === botao) fechar();
        else abrir(botao);
        return;
      }
      if (!evento.target.closest?.('#pop')) fechar();
    },
    true,
  );
  document.addEventListener('keydown', (evento) => {
    if (evento.key === 'Escape') fechar();
  });
  window.addEventListener('scroll', fechar, true);
  window.addEventListener('resize', fechar);
}
