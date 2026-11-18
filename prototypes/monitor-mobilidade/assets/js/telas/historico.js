/**
 * Aba "Histórico": consulta do relatório de um dia anterior, mapa de calor pergunta × dia e as séries dos principais
 * números, em barras. Os dados vêm de /historico e /relatorio/{dia}, que o backend guarda por 180 dias (MONITOR_EXECUCAO).
 */
import { LIMITES } from '../config.js';
import { html } from '../util/html.js';
import { $, fmt, dataBr, diaMes, doisDigitos, horaDe } from '../util/formato.js';
import { ROTULO, rotuloDe } from '../util/status.js';
import { estado } from '../estado.js';
import { ApiError, buscarHistorico, buscarRelatorio, sessaoExpirada } from '../api.js';
import { EXPLICACOES } from '../textos.js';
import { info } from '../ui/popover.js';
import { ocupar } from '../ui/ocupado.js';
import { mostrarCarregando, mostrarFalha } from '../componentes.js';
import { perguntasDe } from '../relatorio.js';
import { htmlDoRelatorio, ligarRelatorio } from './hoje.js';

/** Dias guardados no backend (MONITOR_EXECUCAO): limite da consulta de um dia anterior. */
const DIAS_GUARDADOS = 180;

const DIAS_DA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
/** Perguntas mostradas quando o relatório do dia ainda não foi carregado. */
const PERGUNTAS_PADRAO = [1, 2, 3, 4, 5, 6, 7, 8];
/**
 * Número de cada pergunta nas células do mapa: valor do primeiro check dela (o mesmo de MonitorPerguntas.java).
 * Com o relatório do dia carregado, vale a lista de checks que vem nele.
 */
const CHECK_PRINCIPAL = { 1: 'C01', 2: 'C02', 3: 'C03', 4: 'C05', 5: 'C06', 6: 'C07', 7: 'C09' };
/** Medida do número de cada check nas células: [singular, plural]. */
const MEDIDA = {
  C01: ['fila', 'filas'],
  C02: ['deadlock', 'deadlocks'],
  C03: ['evento', 'eventos'],
  C05: ['ordem', 'ordens'],
  C06: ['ordem', 'ordens'],
  C07: ['evento', 'eventos'],
  C09: ['ms', 'ms'],
};

/** Medida de um valor ("1 ordem", "2 ordens"); vazia quando o check não tem medida conhecida. */
const medidaDe = (idCheck, valor) => (MEDIDA[idCheck] ? MEDIDA[idCheck][valor === 1 ? 0 : 1] : '');
const STATUS_DA_LEGENDA =['OK', 'ATENCAO', 'CRITICO', 'FORA', 'SEM_DADOS'];
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

/** Cabeçalho de uma coluna do mapa: clicar abre o relatório daquele dia logo acima. */
function cabecalhoDoDia(dia, ultimo) {
  const m = String(dia.data).match(/^(\d{4})-(\d{2})-(\d{2})/);
  const semana = m ? DIAS_DA_SEMANA[new Date(+m[1], +m[2] - 1, +m[3]).getDay()] : null;
  if (!m) return html`<div class="mh-dia"></div>`;
  return html`<button class="mh-dia${ultimo ? ' hoje' : ''}" type="button" data-dia="${m[0]}"
    title="Ver o relatório de ${dataBr(dia.data)}">${semana}<b>${m[3]}</b></button>`;
}

/**
 * Uma linha do mapa: rótulo, uma célula por dia (cor do status e, quando houver, o número exato da pergunta naquele
 * dia com a medida: "1.716 ordens") e o total de dias OK.
 */
function linhaDoMapa(dias, { rotulo, classe = '', numero = null, statusDoDia, idCheck = null }) {
  let ok = 0;
  let comStatus = 0;
  const celulas = dias.map((dia, i) => {
    const status = statusDoDia(dia);
    const valor = idCheck ? dia.valores?.[idCheck] : null;
    if (status) comStatus++;
    if (status === 'OK') ok++;
    const descricao = status ? rotuloDe(status) : 'sem relatório';
    const temValor = typeof valor === 'number';
    const medida = temValor ? medidaDe(idCheck, valor) : '';
    const conteudo = temValor ? html`<b>${fmt(valor)}</b>${medida ? html`<small>${medida}</small>` : ''}` : '';
    return html`<div class="mh-cel ${status || 'vazia'}${temValor ? ' com-valor' : ''}${i === dias.length - 1 ? ' ult' : ''}"
      style="animation-delay:${i * ATRASO_CELULA_MS}ms"
      title="${dataBr(dia.data)} · ${rotulo}: ${descricao}${temValor ? ` · ${fmt(valor)} ${medida}` : ''}">${conteudo}</div>`;
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
  const checks = { ...CHECK_PRINCIPAL, ...Object.fromEntries(perguntas.filter((p) => p.checks?.length).map((p) => [p.numero, p.checks[0]])) };
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
      idCheck: checks[n],
    }),
  );
  return html`<div class="card pad">
    <div class="cab-sec">
      <h2 class="titulo-card">Respostas por dia${info(EXPLICACOES.matriz)}</h2>
      <span class="tiny">${dias.length} dia(s) · mais recente à direita</span>
    </div>
    <div class="mapa-rolagem">
      <div class="mapa-h" style="--dias:${dias.length}">
        <div></div>
        ${dias.map((dia, i) => cabecalhoDoDia(dia, i === dias.length - 1))}
        <div class="mh-tot">OK</div>
        ${linhaVeredito}
        <div class="mh-sep"></div>
        ${linhasPerguntas}
      </div>
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

// ---------- relatório de um dia anterior ----------

/** Data local no formato do input date (aaaa-mm-dd). */
const isoDoDia = (data) =>
  `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;

function cartaoConsulta(diaInicial) {
  const hoje = new Date();
  const limite = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - DIAS_GUARDADOS);
  return html`<div class="card pad">
    <form class="consulta-dia" id="fDia">
      <div class="campo">
        <label for="diaConsulta">Consultar o relatório de um dia</label>
        <input id="diaConsulta" type="date" required value="${diaInicial}" min="${isoDoDia(limite)}" max="${isoDoDia(hoje)}">
      </div>
      <button class="btn prim" id="bDia" type="submit">Ver relatório</button>
      <span class="tiny">Ou clique no dia, no topo do mapa abaixo. Ficam guardados os últimos ${DIAS_GUARDADOS} dias.</span>
    </form>
  </div>
  <div id="histDia"></div>`;
}

/** Busca o relatório do dia e desenha os cartões dele (como na Saúde do dia) acima do mapa. */
async function abrirDia(dia) {
  const alvo = $('histDia');
  const campo = $('diaConsulta');
  if (!alvo || !dia) return;
  campo.value = dia;
  const liberar = ocupar($('bDia'), 'Buscando…');
  mostrarCarregando(alvo);
  try {
    const relatorio = await buscarRelatorio(dia);
    alvo.innerHTML = html`<div class="dia-consultado">
      <div class="cab-sec">
        <h2 class="titulo-card">Relatório de ${dataBr(relatorio.dataRef || dia)}</h2>
        <span class="tiny">gerado às ${horaDe(relatorio.geradoEm)}</span>
        <button class="btn" id="bFecharDia" type="button">Fechar</button>
      </div>
      ${htmlDoRelatorio(relatorio, { prefixoId: 'h', comDespacho: false })}
    </div>`;
    ligarRelatorio(alvo, relatorio);
    $('bFecharDia').addEventListener('click', () => (alvo.innerHTML = ''));
    alvo.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (erro) {
    if (erro instanceof ApiError && erro.status === 404) {
      alvo.innerHTML = html`<div class="card vazio">Sem relatório em ${dataBr(dia)}.</div>`;
    } else if (!sessaoExpirada(erro)) {
      mostrarFalha(alvo, erro);
    }
  } finally {
    liberar();
  }
}

// ---------- tela ----------

/** Busca o histórico e redesenha a aba (a cada visita). */
export async function carregarHistorico() {
  const aba = $('aba-historico');
  mostrarCarregando(aba);
  try {
    const historico = await buscarHistorico(LIMITES.diasHistorico);
    // o dia sugerido é o anterior ao mais recente (o mais recente é o da Saúde do dia)
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const sugerido = String(historico[1]?.data ?? isoDoDia(ontem)).slice(0, 10);
    aba.innerHTML = html`<div class="topo-rel hist">
      ${cartaoConsulta(sugerido)}
      ${historico.length ? mapaDeCalor(historico) : html`<div class="card vazio">Sem histórico ainda.</div>`}
      <div class="series">${SERIES.map(([id, titulo]) => serie(historico, id, titulo))}</div>
    </div>`;
    $('fDia').addEventListener('submit', (evento) => {
      evento.preventDefault();
      abrirDia($('diaConsulta').value);
    });
    for (const botao of aba.querySelectorAll('[data-dia]')) {
      botao.addEventListener('click', () => abrirDia(botao.dataset.dia));
    }
  } catch (erro) {
    mostrarFalha(aba, erro);
  }
}
