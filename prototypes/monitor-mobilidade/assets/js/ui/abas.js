/**
 * Abas da tela: Saúde do dia, Despacho e Histórico. O despacho carrega na primeira visita; o histórico, a cada visita.
 */
import {$} from '../util/formato.js';
import {estado} from '../estado.js';
import {carregarDespacho} from '../telas/despacho.js';
import {carregarHistorico} from '../telas/historico.js';

const ABAS = ['hoje', 'despacho', 'historico'];

export function iniciarAbas() {
  document.querySelectorAll('.aba').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.aba').forEach(function (t) { t.setAttribute('aria-selected', t === b ? 'true' : 'false'); });
      ABAS.forEach(function (a) { $('aba-' + a).classList.toggle('hidden', a !== b.dataset.aba); });
      if (b.dataset.aba === 'despacho' && !estado.despacho) carregarDespacho();
      if (b.dataset.aba === 'historico') carregarHistorico();
      window.scrollTo(0, 0);
    });
  });
}

/** Troca de aba por código (ex.: botão "Enviar lista →" do cartão do despacho). */
export function irPara(aba) {
  document.querySelector('[data-aba=' + aba + ']').click();
}
