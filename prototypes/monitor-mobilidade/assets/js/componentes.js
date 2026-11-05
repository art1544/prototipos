/**
 * Blocos de HTML usados em mais de uma tela: linhas de números, barras de motivos, tabela simples e mensagens.
 */
import { html } from './util/html.js';
import { fmt, pct, dataBr, humano } from './util/formato.js';
import { sessaoExpirada } from './api.js';
import { info } from './ui/popover.js';

/** Valor com o percentual menor ao lado, quando há base. */
export const valorComPercentual = (n) =>
  html`${fmt(n.valor)}${n.base ? html`<small>${pct(n.valor, n.base)}</small>` : ''}`;

/** Lista "rótulo ........ valor (%)" dos números secundários de uma pergunta. */
export function linhas(numeros) {
  if (!numeros.length) return '';
  return html`<div class="linhas rl">
    ${numeros.map(
      (n) => html`<div><span>${n.rotulo}${info(n.explicacao, n.rotulo)}</span><b>${valorComPercentual(n)}</b></div>`,
    )}
  </div>`;
}

/**
 * Barras horizontais por motivo, proporcionais ao maior.
 * @param {Array<{motivo: string, acao?: string}>} itens
 * @param {'ordens' | 'retornos'} chave campo com a quantidade
 * @param {{ti?: boolean, comAcao?: boolean}} [opcoes] ti: estilo das pendências da TI; comAcao false esconde a ação
 * @returns {string | import('./util/html.js').HtmlSeguro} vazio quando não há itens
 */
export function listaMotivos(itens, chave, { ti = false, comAcao = true } = {}) {
  if (!itens?.length) return '';
  const maior = Math.max(...itens.map((item) => item[chave] || 0)) || 1;
  return html`<div class="motivos rl">
    ${itens.map(
      (item) => html`<div class="mot${ti ? ' ti' : ''}">
        <span class="lbl">${item.motivo}</span>
        <span class="qt">${fmt(item[chave])}</span>
        <div class="barra"><i style="width:${((item[chave] * 100) / maior).toFixed(1)}%"></i></div>
        ${comAcao && item.acao ? html`<span class="acao">Ação: ${item.acao}</span>` : ''}
      </div>`,
    )}
  </div>`;
}

/** Motivos ou, sem nenhum, o texto "Nenhum." / "Nenhuma.". */
export const motivosOuNenhum = (itens, chave, opcoes, vazio = 'Nenhum.') =>
  listaMotivos(itens, chave, opcoes) || html`<span class="tiny">${vazio}</span>`;

/** Tabela com as colunas do primeiro objeto; números à direita, datas ISO em dd/mm/aaaa. */
export function tabelaSimples(dados) {
  const colunas = Object.keys(dados[0]);
  const celula = (valor) =>
    typeof valor === 'number'
      ? html`<td class="n">${fmt(valor)}</td>`
      : html`<td>${/^\d{4}-\d{2}-\d{2}T/.test(String(valor)) ? dataBr(valor) : valor}</td>`;
  return html`<div class="tbl">
    <table>
      <thead><tr>${colunas.map((coluna) => html`<th>${humano(coluna)}</th>`)}</tr></thead>
      <tbody>${dados.map((linha) => html`<tr>${colunas.map((coluna) => celula(linha[coluna]))}</tr>`)}</tbody>
    </table>
  </div>`;
}

/** Mostra o erro no lugar do conteúdo (na sessão expirada a tela já voltou ao login). */
export function mostrarFalha(elemento, erro, classe = 'aviso cr') {
  if (sessaoExpirada(erro)) return;
  elemento.innerHTML = html`<div class="${classe}">${erro.message}</div>`;
}

/** Mensagem de carregamento no lugar do conteúdo. */
export function mostrarCarregando(elemento, texto = 'Carregando…') {
  elemento.innerHTML = html`<div class="carregando">${texto}</div>`;
}
