/**
 * Abas da tela: Saúde do dia, Despacho e Histórico. Cada aba registra o que fazer ao ser aberta.
 */
import { $ } from '../util/formato.js';

/** @type {Map<string, () => void>} */
const aoAbrir = new Map();

/** Registra o que carregar quando a aba é aberta (ex.: o histórico é buscado a cada visita). */
export function registrarAba(nome, callback) {
  aoAbrir.set(nome, callback);
}

function selecionar(botaoAtivo) {
  const nome = botaoAtivo.dataset.aba;
  for (const botao of document.querySelectorAll('.aba')) {
    botao.setAttribute('aria-selected', String(botao === botaoAtivo));
    $(`aba-${botao.dataset.aba}`).classList.toggle('hidden', botao !== botaoAtivo);
  }
  aoAbrir.get(nome)?.();
  window.scrollTo(0, 0);
}

export function iniciarAbas() {
  for (const botao of document.querySelectorAll('.aba')) {
    botao.addEventListener('click', () => selecionar(botao));
  }
}

/** Troca de aba por código (ex.: botão "Enviar lista →" do cartão do despacho). */
export function irPara(nome) {
  selecionar(document.querySelector(`.aba[data-aba="${nome}"]`));
}
