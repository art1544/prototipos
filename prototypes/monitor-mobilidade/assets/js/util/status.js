/**
 * Status das perguntas e do veredito (OK, ATENCAO, CRITICO...): rótulos, cores, ícones e etiqueta.
 */
import { html, raw } from './html.js';

/** Rótulo de cada status, como aparece para o usuário. */
export const ROTULO = {
  OK: 'OK',
  ATENCAO: 'Atenção',
  CRITICO: 'Crítico',
  SEM_DADOS: 'Sem dados',
  SEM_LISTA: 'Sem lista',
  FORA: 'Fora do monitor',
};

/** Cor final do anel de progresso por status (tokens do CSS). */
export const COR = {
  OK: 'var(--ok)',
  ATENCAO: 'var(--at-dot)',
  CRITICO: 'var(--cr)',
  FORA: 'var(--fora)',
  SEM_DADOS: 'var(--texto-3)',
  SEM_LISTA: 'var(--texto-3)',
};

const svg = (atributos, desenho) =>
  raw(`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ${atributos}>${desenho}</svg>`);

/** Ícone do selo do veredito. */
export const ICONE = {
  OK: svg('stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"', '<path d="M20 6 9 17l-5-5"/>'),
  ATENCAO: svg('stroke-width="2.2" stroke-linecap="round"', '<path d="M12 3 2 20h20L12 3z"/><path d="M12 10v4M12 17h.01"/>'),
  CRITICO: svg('stroke-width="2.2" stroke-linecap="round"', '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16h.01"/>'),
  SEM_DADOS: svg('stroke-width="2.2" stroke-linecap="round"', '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>'),
};

const VEREDITO = {
  OK: 'Tudo certo hoje',
  ATENCAO: 'Há pontos de atenção',
  CRITICO: 'Há problemas críticos',
  SEM_DADOS: 'Sem dados suficientes',
};

/** Frase do veredito do dia ("Há pontos de atenção"). */
export const tituloVeredito = (veredito) => VEREDITO[veredito] || ROTULO[veredito];

/** Rótulo de um status, ou o próprio código quando não é conhecido. */
export const rotuloDe = (status) => ROTULO[status] || status;

/** Etiqueta de status (ponto + texto). */
export const chip = (status) => html`<span class="chip ${status}">${rotuloDe(status)}</span>`;
