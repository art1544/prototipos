/**
 * Número em destaque com anel de percentual, e as animações de entrada: números contam até o valor,
 * anéis enchem e ganham a cor do status, cartões entram em cascata. Respeita "reduzir movimento" do sistema.
 */
import {esc, fmt, pct, nf} from './util/formato.js';
import {COR} from './util/status.js';
import {info} from './ui/popover.js';

const CIRC = 2 * Math.PI * 26;
const semMov = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Anel de progresso (valor/base). Começa vazio; animar() o preenche. peq = versão menor dos tiles. */
export function anel(valor, base, status, peq) {
  const p = base ? Math.max(0, Math.min(1, valor / base)) : 0;
  return '<div class="anel' + (peq ? ' p' : '') + '" data-p="' + p + '" data-st="' + esc(status || '') + '" role="img" aria-label="' + pct(valor, base) + '">' +
    '<svg viewBox="0 0 64 64" aria-hidden="true"><circle class="trilha" cx="32" cy="32" r="26" fill="none" stroke-width="7"/>' +
    '<circle class="prog" cx="32" cy="32" r="26" fill="none" stroke-width="7" stroke-dasharray="' + CIRC.toFixed(2) + '" stroke-dashoffset="' + CIRC.toFixed(2) + '"/></svg>' +
    '<span aria-hidden="true">0%</span></div>';
}

/**
 * Número real grande, com o % no anel quando há base.
 * @param {{valor:number, base?:number, rotulo:string, explicacao?:string}} n
 * @param {string} status cor final do anel
 * @param {{peq?:boolean, rotulo?:boolean, info?:boolean, sufixo?:string}} [opc] rotulo/info false escondem o texto/"i"; sufixo ex.: " ms"
 */
export function destaque(n, status, opc) {
  opc = opc || {};
  const de = n.base ? 'de ' + fmt(n.base) + (opc.rotulo === false ? '' : ' · ' + esc(n.rotulo)) : (opc.rotulo === false ? '' : esc(n.rotulo));
  return '<div class="dest2">' + (n.base ? anel(n.valor, n.base, status, opc.peq) : '') +
    '<div class="valor"><b><span data-n="' + esc(n.valor) + '">' + fmt(n.valor) + '</span>' + (opc.sufixo ? '<small>' + esc(opc.sufixo) + '</small>' : '') + '</b>' +
    (de || opc.info ? '<span class="de">' + de + (opc.info !== false ? info(n.explicacao, n.rotulo) : '') + '</span>' : '') + '</div></div>';
}

/** Conta de 0 até o alvo em dur ms (desaceleração cúbica), escrevendo com fmtF. */
function contar(el, alvo, dur, fmtF) {
  if (semMov || !isFinite(alvo)) { el.textContent = fmtF(alvo); return; }
  let ini = null;
  function quadro(t) {
    if (ini == null) ini = t;
    const k = Math.min(1, (t - ini) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmtF(k < 1 ? alvo * e : alvo);
    if (k < 1) requestAnimationFrame(quadro);
  }
  requestAnimationFrame(quadro);
}

/** Anima números ([data-n]) e anéis do bloco recém-desenhado; os cartões entram em cascata (--i). */
export function animar(raiz) {
  raiz.querySelectorAll('.grade>.card,.tiles>.tile,.topo-rel>*,#despachoAtual>*').forEach(function (c, i) { c.style.setProperty('--i', i); });
  raiz.querySelectorAll('[data-n]').forEach(function (el) {
    const v = Number(el.dataset.n); if (!isFinite(v)) return;
    const inteiro = Math.round(v) === v;
    contar(el, v, 900, function (x) { return nf.format(inteiro ? Math.round(x) : Math.round(x * 10) / 10); });
  });
  raiz.querySelectorAll('.anel').forEach(function (a) {
    const p = Number(a.dataset.p), c = a.querySelector('.prog'), s = a.querySelector('span');
    const fim = function () { a.classList.add('fim'); if (COR[a.dataset.st]) c.style.stroke = COR[a.dataset.st]; };
    contar(s, p * 100, 1100, function (x) { return Math.round(x) + '%'; });
    if (semMov) { c.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(2); fim(); return; }
    requestAnimationFrame(function () { requestAnimationFrame(function () { c.style.strokeDashoffset = (CIRC * (1 - p)).toFixed(2); }); });
    setTimeout(fim, 1150);
  });
}
