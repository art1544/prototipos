/**
 * Modal "Detalhes" de uma pergunta: resposta e, para cada check, os números, achados, motivos, tabelas de apoio,
 * exemplos e como é calculado (regra, definição, elo da cadeia, consulta).
 */
import { html } from '../util/html.js';
import { $, fmt, doisDigitos } from '../util/formato.js';
import { chip } from '../util/status.js';
import { info } from '../ui/popover.js';
import { motivosOuNenhum, tabelaSimples, valorComPercentual } from '../componentes.js';
import { achadosNovos, chaveDosMotivos } from '../relatorio.js';

/** Tabelas de apoio que um check pode trazer em "resumo", com o título exibido. */
const TABELAS_DE_APOIO = [
  ['filas', 'Filas do Service Bus'],
  ['por_tipo', 'Por tipo'],
  ['por_status', 'Por status no SAP'],
];

const bloco = (titulo, conteudo) => html`<div class="det-bloco"><h5>${titulo}</h5>${conteudo}</div>`;

function numeros(check) {
  if (!check.numeros?.length) return '';
  return html`<div class="det-nums">
    ${check.numeros.map(
      (n) => html`<div class="det-num">
        <span>${n.rotulo}${info(n.explicacao, n.rotulo)}</span><b>${valorComPercentual(n)}</b>
      </div>`,
    )}
  </div>`;
}

function motivos(check) {
  const despacho = check.resumo?.despacho;
  if (!despacho || !(despacho.porMotivo || despacho.tiPorMotivo)) return '';
  const chave = chaveDosMotivos(check.id);
  const tituloNegocio = `Motivo do usuário${check.id === 'C07' ? ' ou do SAP' : ''} · negócio`;
  return html`<div class="duas">
    ${bloco(tituloNegocio, motivosOuNenhum(despacho.porMotivo, chave))}
    ${bloco('Com o sistema · TI', motivosOuNenhum(despacho.tiPorMotivo, chave, { ti: true }))}
  </div>`;
}

function comoCalculado(check) {
  const itens = [
    ['Regra', check.regra],
    ['Como é medido', check.definicao],
    ['Elo da cadeia', check.elo],
    ['Referência 7 dias', check.referencia7d != null ? `${fmt(check.referencia7d)} (mediana)` : null],
  ].filter(([, valor]) => valor);
  const definicoes = itens.map(([termo, valor]) => html`<dt>${termo}</dt><dd>${valor}</dd>`);
  if (check.consulta) definicoes.push(html`<dt>Consulta</dt><dd class="mono">${check.consulta}</dd>`);
  if (!definicoes.length) return '';
  return html`<details class="dobra"><summary>Como é calculado</summary><dl class="meta">${definicoes}</dl></details>`;
}

function secaoDoCheck(check, resposta) {
  const achados = achadosNovos(check, resposta);
  const tabelas = TABELAS_DE_APOIO.filter(([campo]) => check.resumo?.[campo]?.length);
  const amostra = check.amostra?.length
    ? html`<details class="dobra">
        <summary>Exemplos <span>${fmt(check.amostra.length)}</span></summary>${tabelaSimples(check.amostra)}
      </details>`
    : '';
  return html`<section class="det-sec">
    <div class="det-cab"><span class="num">${check.id}</span><h4>${check.titulo}</h4>${chip(check.status)}</div>
    <div class="det-corpo">
      ${check.erro ? html`<div class="aviso cr">Sem dados: ${check.erro}</div>` : ''}
      ${numeros(check)}
      ${achados.length
        ? bloco('O que foi encontrado', html`<ul class="achados">${achados.map((a) => html`<li>${a}</li>`)}</ul>`)
        : ''}
      ${motivos(check)}
      ${tabelas.map(([campo, titulo]) => bloco(titulo, tabelaSimples(check.resumo[campo])))}
      ${amostra}
      ${comoCalculado(check)}
    </div>
  </section>`;
}

/** Liga o fechar do modal (botão e clique fora). */
export function iniciarDetalhe() {
  const modal = $('dlg');
  $('dlgFechar').addEventListener('click', () => modal.close());
  modal.addEventListener('click', (evento) => {
    if (evento.target === modal) modal.close();
  });
}

/** Abre o modal com os detalhes de uma pergunta. */
export function abrirDetalhe(pergunta, porId) {
  $('dlgTit').innerHTML = html`<span class="num">${doisDigitos(pergunta.numero)}</span>${pergunta.pergunta}`;
  $('dlgCorpo').innerHTML = html`<div class="det-resp">${chip(pergunta.status)}<p>${pergunta.resposta}</p></div>
    ${pergunta.checks.map((id) => (porId[id] ? secaoDoCheck(porId[id], pergunta.resposta) : ''))}`;
  $('dlg').showModal();
}
