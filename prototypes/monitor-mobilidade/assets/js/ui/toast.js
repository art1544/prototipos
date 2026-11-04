/**
 * Aviso flutuante (toast) no rodapé: confirmações curtas, como "Resumo do dia copiado".
 */
import {$} from '../util/formato.js';

let tempo = null;

/**
 * @param {string} msg texto do aviso
 * @param {boolean} [erro] em vermelho e por mais tempo (6 s em vez de 3,8 s)
 */
export function avisar(msg, erro) {
  const t = $('toast'); clearTimeout(tempo);
  t.textContent = msg; t.className = 'toast' + (erro ? ' erro' : ''); t.hidden = false; void t.offsetWidth; t.classList.add('entra');
  tempo = setTimeout(function () {
    t.classList.remove('entra'); t.classList.add('sai');
    tempo = setTimeout(function () { t.hidden = true; }, 220);
  }, erro ? 6000 : 3800);
}
