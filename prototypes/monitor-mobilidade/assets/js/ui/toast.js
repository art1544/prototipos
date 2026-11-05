/**
 * Aviso flutuante (toast) no rodapé: confirmações curtas ("Resumo do dia copiado") e erros de ações.
 */
import { $ } from '../util/formato.js';

const DURACAO_MS = 3800;
const DURACAO_ERRO_MS = 6000;
const DURACAO_SAIDA_MS = 220;

let temporizador = null;

/**
 * @param {string} mensagem texto do aviso
 * @param {{erro?: boolean}} [opcoes] erro: em vermelho e por mais tempo
 */
export function avisar(mensagem, { erro = false } = {}) {
  const toast = $('toast');
  clearTimeout(temporizador);
  toast.textContent = mensagem;
  toast.className = erro ? 'toast erro' : 'toast';
  toast.hidden = false;
  void toast.offsetWidth; // reinicia a animação de entrada
  toast.classList.add('entra');
  temporizador = setTimeout(() => {
    toast.classList.replace('entra', 'sai');
    temporizador = setTimeout(() => {
      toast.hidden = true;
    }, DURACAO_SAIDA_MS);
  }, erro ? DURACAO_ERRO_MS : DURACAO_MS);
}

/** Aviso de erro, com a mensagem do erro recebido. */
export const avisarErro = (prefixo, erro) => avisar(`${prefixo}${erro?.message ?? erro}`, { erro: true });
