/**
 * Número em destaque com anel de percentual, e as animações de entrada: números contam até o valor, anéis enchem e
 * ganham a cor do status, cartões entram em cascata. Respeita "reduzir movimento" do sistema.
 */
import { html } from './util/html.js';
import { fmt, pct, numero } from './util/formato.js';
import { COR } from './util/status.js';
import { info } from './ui/popover.js';

const RAIO = 26;
const CIRCUNFERENCIA = (2 * Math.PI * RAIO).toFixed(2);
const DURACAO_NUMERO_MS = 900;
const DURACAO_ANEL_MS = 1100;
const CARTOES_EM_CASCATA = '.grade>.card,.tiles>.tile,.topo-rel>*,#despachoAtual>*';
const semMovimento = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Anel de progresso (valor/base). Começa vazio; animar() o preenche.
 * @param {boolean} [pequeno] versão menor, dos tiles
 */
export function anel(valor, base, status, pequeno = false) {
  const fracao = base ? Math.max(0, Math.min(1, valor / base)) : 0;
  return html`<div class="anel${pequeno ? ' p' : ''}" data-p="${fracao}" data-st="${status || ''}" role="img"
    aria-label="${pct(valor, base)}">
    <svg viewBox="0 0 64 64" aria-hidden="true">
      <circle class="trilha" cx="32" cy="32" r="${RAIO}" fill="none" stroke-width="7"/>
      <circle class="prog" cx="32" cy="32" r="${RAIO}" fill="none" stroke-width="7"
        stroke-dasharray="${CIRCUNFERENCIA}" stroke-dashoffset="${CIRCUNFERENCIA}"/>
    </svg>
    <span aria-hidden="true">0%</span>
  </div>`;
}

/**
 * Número real grande, com o % no anel quando há base.
 * @param {{valor: number, base?: number, rotulo: string, explicacao?: string}} n
 * @param {string} status cor final do anel
 * @param {{pequeno?: boolean, rotulo?: boolean, info?: boolean, sufixo?: string, canto?: unknown}} [opcoes]
 *   rotulo/info false escondem o texto e o "i"; sufixo ex.: " ms"; canto: HTML à direita do número
 */
export function destaque(n, status, { pequeno = false, rotulo = true, info: comInfo = true, sufixo, canto = '' } = {}) {
  const textoRotulo = rotulo ? n.rotulo : '';
  const de = n.base ? `de ${fmt(n.base)}${rotulo ? ` · ${n.rotulo}` : ''}` : textoRotulo;
  return html`<div class="dest2">
    ${n.base ? anel(n.valor, n.base, status, pequeno) : ''}
    <div class="valor">
      <b><span data-n="${n.valor}">${fmt(n.valor)}</span>${sufixo ? html`<small>${sufixo}</small>` : ''}</b>
      ${de ? html`<span class="de">${de}${comInfo ? info(n.explicacao, n.rotulo) : ''}</span>` : ''}
    </div>
    ${canto}
  </div>`;
}

/** Conta de 0 até o alvo em `duracao` ms (desaceleração cúbica), escrevendo com `formatar`. */
function contar(elemento, alvo, duracao, formatar) {
  if (semMovimento || !Number.isFinite(alvo)) {
    elemento.textContent = formatar(alvo);
    return;
  }
  let inicio = null;
  const quadro = (agora) => {
    inicio ??= agora;
    const progresso = Math.min(1, (agora - inicio) / duracao);
    const suavizado = 1 - (1 - progresso) ** 3;
    elemento.textContent = formatar(progresso < 1 ? alvo * suavizado : alvo);
    if (progresso < 1) requestAnimationFrame(quadro);
  };
  requestAnimationFrame(quadro);
}

function animarNumero(elemento) {
  const valor = Number(elemento.dataset.n);
  if (!Number.isFinite(valor)) return;
  const inteiro = Number.isInteger(valor);
  contar(elemento, valor, DURACAO_NUMERO_MS, (x) => numero.format(inteiro ? Math.round(x) : Math.round(x * 10) / 10));
}

function animarAnel(elemento) {
  const fracao = Number(elemento.dataset.p);
  const progresso = elemento.querySelector('.prog');
  const deslocamentoFinal = (CIRCUNFERENCIA * (1 - fracao)).toFixed(2);
  const concluir = () => {
    elemento.classList.add('fim');
    if (COR[elemento.dataset.st]) progresso.style.stroke = COR[elemento.dataset.st];
  };
  contar(elemento.querySelector('span'), fracao * 100, DURACAO_ANEL_MS, (x) => `${Math.round(x)}%`);
  if (semMovimento) {
    progresso.style.strokeDashoffset = deslocamentoFinal;
    concluir();
    return;
  }
  // dois quadros: o anel precisa ser pintado vazio antes de a transição começar
  requestAnimationFrame(() => requestAnimationFrame(() => (progresso.style.strokeDashoffset = deslocamentoFinal)));
  setTimeout(concluir, DURACAO_ANEL_MS + 50);
}

/** Anima números ([data-n]) e anéis do bloco recém-desenhado; os cartões entram em cascata (--i). */
export function animar(raiz) {
  raiz.querySelectorAll(CARTOES_EM_CASCATA).forEach((cartao, i) => cartao.style.setProperty('--i', i));
  raiz.querySelectorAll('[data-n]').forEach(animarNumero);
  raiz.querySelectorAll('.anel').forEach(animarAnel);
}
