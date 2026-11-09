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
 * @param {{erro?: boolean, espera?: boolean}} [opcoes] erro: em vermelho e por mais tempo; espera: ação em andamento,
 *   com indicador giratório e sem prazo (fica até o próximo aviso ou até fecharAviso)
 */
export function avisar(mensagem, { erro = false, espera = false } = {}) {
  const toast = $('toast');
  clearTimeout(temporizador);
  toast.textContent = mensagem;
  toast.className = erro ? 'toast erro' : espera ? 'toast espera' : 'toast';
  toast.hidden = false;
  void toast.offsetWidth; // reinicia a animação de entrada
  toast.classList.add('entra');
  if (espera) return;
  temporizador = setTimeout(() => {
    toast.classList.replace('entra', 'sai');
    temporizador = setTimeout(() => {
      toast.hidden = true;
    }, DURACAO_SAIDA_MS);
  }, erro ? DURACAO_ERRO_MS : DURACAO_MS);
}

/** Tira o aviso da tela na hora (ex.: ação em andamento interrompida por sessão expirada). */
export function fecharAviso() {
  clearTimeout(temporizador);
  $('toast').hidden = true;
}

/** Aviso de erro, com a mensagem do erro recebido. */
export const avisarErro = (prefixo, erro) => avisar(`${prefixo}${erro?.message ?? erro}`, { erro: true });
