/**
 * Aba "Histórico": mapa de calor pergunta × dia e as séries dos principais números, em barras.
 * Os dados vêm de /historico, que o backend guarda por 180 dias (MONITOR_EXECUCAO).
 */
import { LIMITES } from '../config.js';
import { html } from '../util/html.js';
import { $, fmt, dataBr, diaMes, doisDigitos } from '../util/formato.js';
import { ROTULO, rotuloDe } from '../util/status.js';
import { estado } from '../estado.js';
import { buscarHistorico } from '../api.js';
import { EXPLICACOES } from '../textos.js';
import { info } from '../ui/popover.js';
import { mostrarCarregando, mostrarFalha } from '../componentes.js';
import { perguntasDe } from '../relatorio.js';

const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
/** Perguntas mostradas quando o relatório do dia ainda não foi carregado. */
const PERGUNTAS_PADRAO = [1, 2, 3, 4, 5, 6, 7, 8];
const STATUS_DA_LEGENDA = ['OK', 'ATENCAO', 'CRITICO', 'FORA', 'SEM_DADOS'];
/** Séries exibidas: id do check e título do gráfico. */
const SERIES = [
  ['C06', 'Ordens pendentes (envios)'],
  ['C07', 'Retornos pendentes'],
  ['C03', 'Apontamentos esgotados'],
  ['C09', 'Login: tempo de resposta (ms)'],
];
const ATRASO_CELULA_MS = 25;
const ATRASO_BARRA_MS = 35;
const ALTURA_MINIMA_BARRA = 1.5;

// ---------- mapa de calor ----------

function cabecalhoDoDia(dia, ultimo) {
  const m = String(dia.data).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const semana = m ? DIAS_DA_SEMANA[new Date(+m[1], +m[2] - 1, +m[3]).getDay()] : null;
  return html`<div class="mh-dia${ultimo ? ' hoje' : ''}" title="${dataBr(dia.data)}">
    ${semana ? html`${semana}<b>${m[3]}</b>` : ''}
  </div>`;
}

/** Uma linha do mapa: rótulo, uma célula por dia e o total de dias OK. */
function linhaDoMapa(dias, { rotulo, classe = '', numero = null, statusDoDia }) {
  let ok = 0;
  let comStatus = 0;
  const celulas = dias.map((dia, i) => {
    const status = statusDoDia(dia);
    if (status) comStatus++;
    if (status === 'OK') ok++;
    const descricao = status ? rotuloDe(status) : 'sem relatório';
    return html`<div class="mh-cel ${status || 'vazia'}${i === dias.length - 1 ? ' ult' : ''}"
      style="animation-delay:${i * ATRASO_CELULA_MS}ms" title="${dataBr(dia.data)} · ${rotulo}: ${descricao}"></div>`;
  });
  return html`<div class="mh-rot ${classe}" title="${rotulo}">
      ${numero ? html`<span class="num">${numero}</span>` : ''}<span>${rotulo}</span>
    </div>
    ${celulas}
    <div class="mh-tot"><b>${ok}</b>/${comStatus}</div>`;
}

/** Grade pergunta × dia (mais recente à direita), com o total de dias OK em cada linha. */
function mapaDeCalor(historico) {
  // números e títulos das perguntas: do relatório do dia, quando já carregado
  const perguntas = estado.relatorio ? perguntasDe(estado.relatorio) : [];
  const numeros = estado.relatorio ? perguntas.map((p) => p.numero) : PERGUNTAS_PADRAO;
  const titulos = Object.fromEntries(perguntas.map((p) => [p.numero, p.pergunta]));
  const dias = [...historico].reverse();

  const linhaVeredito = linhaDoMapa(dias, {
    rotulo: 'Veredito do dia',
    classe: 'ver-d',
    statusDoDia: (dia) => dia.veredito,
  });
  const linhasPerguntas = numeros.map((n) =>
    linhaDoMapa(dias, {
      rotulo: titulos[n] || `Pergunta ${n}`,
      numero: doisDigitos(n),
      statusDoDia: (dia) => dia.perguntas?.[String(n)],
    }),
  );
  return html`<div class="card pad">
    <div class="cab-sec">
      <h2 class="titulo-card">Respostas por dia${info(EXPLICACOES.matriz)}</h2>
      <span class="tiny">${dias.length} dia(s) · mais recente à direita</span>
    </div>
    <div class="mapa-h" style="--dias:${dias.length}">
      <div></div>
      ${dias.map((dia, i) => cabecalhoDoDia(dia, i === dias.length - 1))}
      <div class="mh-tot">OK</div>
      ${linhaVeredito}
      <div class="mh-sep"></div>
      ${linhasPerguntas}
    </div>
    <div class="mh-leg">
      ${STATUS_DA_LEGENDA.map((status) => html`<span><i class="mh-cel ${status}"></i>${ROTULO[status]}</span>`)}
    </div>
  </div>`;
}

// ---------- séries ----------

function variacao(atual, anterior) {
  if (anterior == null) return '';
  const diferenca = atual - anterior;
  if (diferenca === 0) return html`<span class="g-delta">igual a ontem</span>`;
  const sobe = diferenca > 0;
  return html`<span class="g-delta ${sobe ? 'sobe' : 'desce'}">
    ${sobe ? '▲' : '▼'} ${fmt(Math.abs(diferenca))} vs. dia anterior
  </span>`;
}

function barra(dia, valor, i, { ultimo, maximo }) {
  const data = diaMes(dia.data);
  if (valor == null) return html`<div class="g-col vazia" title="${data}: sem dado"><i></i></div>`;
  const altura = Math.max(ALTURA_MINIMA_BARRA, (valor * 100) / maximo).toFixed(1);
  return html`<div class="g-col${i === ultimo ? ' ult' : ''}" title="${data}: ${fmt(valor)}">
    <i style="height:${altura}%;animation-delay:${i * ATRASO_BARRA_MS}ms">
      ${i === ultimo ? html`<span class="g-tag">${fmt(valor)}</span>` : ''}
    </i>
  </div>`;
}

/**
 * Série de um número ao longo dos dias, em barras HTML (não SVG: a fonte fica no tamanho real em qualquer largura
 * de cartão). Mostra o último valor, a variação contra o dia anterior, mínimo, média e máximo.
 * @returns {string | import('../util/html.js').HtmlSeguro} vazio quando nenhum dia tem o valor
 */
function serie(historico, idCheck, titulo) {
  const dias = [...historico].reverse();
  const pontos = dias.map((dia) => dia.valores?.[idCheck] ?? null);
  const valores = pontos.filter((v) => v != null);
  if (!valores.length) return '';

  const maximo = Math.max(...valores) || 1;
  const minimo = Math.min(...valores);
  const media = valores.reduce((soma, v) => soma + v, 0) / valores.length;
  const ultimo = pontos.findLastIndex((v) => v != null);
  const anterior = pontos.slice(0, ultimo).findLast((v) => v != null) ?? null;
  const mediaArredondada = fmt(Math.round(media));

  return html`<div class="card pad serie">
    <span class="tiny g-tit">${titulo}${info(EXPLICACOES[idCheck], titulo)}</span>
    <div class="g-cab"><b data-n="${pontos[ultimo]}">${fmt(pontos[ultimo])}</b>${variacao(pontos[ultimo], anterior)}</div>
    <div class="g-resumo">
      <span>Mín. <b>${fmt(minimo)}</b></span><span>Média <b>${mediaArredondada}</b></span><span>Máx. <b>${fmt(maximo)}</b></span>
    </div>
    <div class="grafico" style="--n:${pontos.length}">
      <div class="g-area">
        <div class="g-media" style="bottom:${((media * 100) / maximo).toFixed(1)}%"><span>média ${mediaArredondada}</span></div>
        ${pontos.map((valor, i) => barra(dias[i], valor, i, { ultimo, maximo }))}
      </div>
      <div class="g-datas">
        ${dias.map((dia, i) => html`<span${i === ultimo ? html` class="ult"` : ''}>${diaMes(dia.data)}</span>`)}
      </div>
    </div>
  </div>`;
}

// ---------- tela ----------

/** Busca o histórico e redesenha a aba (a cada visita). */
export async function carregarHistorico() {
  const aba = $('aba-historico');
  mostrarCarregando(aba);
  try {
    const historico = await buscarHistorico(LIMITES.diasHistorico);
    if (!historico.length) {
      aba.innerHTML = html`<div class="card vazio">Sem histórico ainda.</div>`;
      return;
    }
    aba.innerHTML = html`<div class="topo-rel hist">
      ${mapaDeCalor(historico)}
      <div class="series">${SERIES.map(([id, titulo]) => serie(historico, id, titulo))}</div>
    </div>`;
  } catch (erro) {
    mostrarFalha(aba, erro);
  }
}
