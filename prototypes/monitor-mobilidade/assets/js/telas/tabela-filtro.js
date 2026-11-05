/**
 * Tabela com busca em todas as colunas, filtros por lista e ordenação por coluna (clique no cabeçalho).
 * Mostra no máximo LIMITES.linhasTabela linhas; o Excel do despacho leva todas.
 */
import { LIMITES } from '../config.js';
import { html } from '../util/html.js';
import { fmt, dataBr, ehDataIso } from '../util/formato.js';

/** Colunas de texto longo: cortadas em uma linha, com o texto inteiro no title. */
const COLUNAS_LONGAS = new Set(['motivo', 'acao', 'mensagemSap', 'descricao']);

const textoDe = (valor) => String(valor ?? '');

function comparar(a, b) {
  if (typeof a === 'number' || typeof b === 'number') return (a || 0) - (b || 0);
  return textoDe(a).localeCompare(textoDe(b), 'pt-BR');
}

function seletorDeFiltro(dados, coluna, rotulo) {
  const preenchidos = dados.map((linha) => linha[coluna]).filter((valor) => valor != null && valor !== '');
  const valores = [...new Set(preenchidos.map(String))].sort();
  return html`<select data-k="${coluna}" aria-label="${rotulo}">
    <option value="">${rotulo}: todos</option>
    ${valores.map((valor) => html`<option>${valor}</option>`)}
  </select>`;
}

/**
 * @param {HTMLElement} elemento onde desenhar
 * @param {object[]} dados linhas
 * @param {Object<string, string>} titulos coluna → título (a ordem define a ordem das colunas)
 * @param {Object<string, string>} filtros coluna → rótulo do filtro de lista
 */
export function tabelaFiltro(elemento, dados, titulos, filtros) {
  if (!dados?.length) {
    elemento.innerHTML = html`<div class="vazio">Nenhuma linha.</div>`;
    return;
  }
  const colunas = Object.keys(titulos).filter((coluna) => coluna in dados[0]);
  const numerica = Object.fromEntries(
    colunas.map((coluna) => [coluna, dados.some((linha) => typeof linha[coluna] === 'number')]),
  );
  const visao = { busca: '', filtros: {}, ordem: null, decrescente: false };

  elemento.innerHTML = html`<div class="filtros">
      <input type="search" placeholder="Buscar em todas as colunas" aria-label="Buscar">
      ${Object.entries(filtros).map(([coluna, rotulo]) => seletorDeFiltro(dados, coluna, rotulo))}
      <span class="tiny" data-n></span>
    </div>
    <div class="tbl"><table><thead></thead><tbody></tbody></table></div>`;
  const cabecalho = elemento.querySelector('thead');
  const corpo = elemento.querySelector('tbody');
  const contador = elemento.querySelector('[data-n]');

  function celula(linha, coluna) {
    const valor = linha[coluna];
    if (numerica[coluna]) return html`<td class="n">${valor == null ? '' : fmt(valor)}</td>`;
    if (coluna === 'situacao') {
      return valor === 'Pendente'
        ? html`<td><span class="chip ATENCAO">Pendente</span></td>`
        : html`<td><span class="chip OK">Sem pendência</span></td>`;
    }
    if (ehDataIso(valor)) return html`<td>${dataBr(valor)}</td>`;
    if (COLUNAS_LONGAS.has(coluna)) {
      return html`<td class="largo"><div class="corta" title="${valor}">${valor}</div></td>`;
    }
    return html`<td>${valor}</td>`;
  }

  function titulo(coluna) {
    const seta = visao.ordem === coluna ? (visao.decrescente ? ' ▼' : ' ▲') : '';
    const classe = numerica[coluna] ? html` class="n"` : '';
    return html`<th data-c="${coluna}"${classe}>${titulos[coluna]}${seta}</th>`;
  }

  function filtrar() {
    const busca = visao.busca.toLowerCase();
    const filtradas = dados.filter(
      (linha) =>
        Object.entries(visao.filtros).every(([coluna, valor]) => !valor || String(linha[coluna]) === valor) &&
        (!busca || colunas.some((coluna) => textoDe(linha[coluna]).toLowerCase().includes(busca))),
    );
    if (!visao.ordem) return filtradas;
    const sinal = visao.decrescente ? -1 : 1;
    return filtradas.sort((a, b) => sinal * comparar(a[visao.ordem], b[visao.ordem]));
  }

  function desenhar() {
    const linhas = filtrar();
    const limite = LIMITES.linhasTabela;
    contador.textContent =
      `${fmt(linhas.length)} de ${fmt(dados.length)} linhas` + (linhas.length > limite ? ` (mostrando ${limite})` : '');
    corpo.innerHTML = html`${linhas
      .slice(0, limite)
      .map((linha) => html`<tr>${colunas.map((coluna) => celula(linha, coluna))}</tr>`)}`;
    cabecalho.innerHTML = html`<tr>${colunas.map(titulo)}</tr>`;
  }

  elemento.querySelector('input').addEventListener('input', (evento) => {
    visao.busca = evento.target.value;
    desenhar();
  });
  for (const seletor of elemento.querySelectorAll('select')) {
    seletor.addEventListener('change', () => {
      visao.filtros[seletor.dataset.k] = seletor.value;
      desenhar();
    });
  }
  // números começam do maior; texto, de A a Z; clicar de novo inverte
  cabecalho.addEventListener('click', (evento) => {
    const coluna = evento.target.closest('th')?.dataset.c;
    if (!coluna) return;
    visao.decrescente = visao.ordem === coluna ? !visao.decrescente : numerica[coluna];
    visao.ordem = coluna;
    desenhar();
  });
  desenhar();
}
