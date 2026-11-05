/**
 * "Exportar PDF": monta o relatório do dia como um HTML estático (sem scripts, A4, com o pdf.css e o logo embutidos)
 * e o envia ao MonitorLocal, que o imprime em PDF com o Edge/Chrome em modo headless. Sem Edge/Chrome, abre a
 * impressão do próprio navegador ("Salvar como PDF"). O texto continua selecionável.
 */
import { APP, URLS } from '../config.js';
import { html, raw } from '../util/html.js';
import { $, fmt, pct, dataBr, horaDe, doisDigitos } from '../util/formato.js';
import { rotuloDe, tituloVeredito } from '../util/status.js';
import { estado, ambienteDeTeste } from '../estado.js';
import { gerarPdf } from '../api.js';
import { avisar, avisarErro } from '../ui/toast.js';
import {
  achadosNovos,
  chaveDosMotivos,
  checksDa,
  checksPorId,
  contarStatus,
  destaquesDoDia,
  perguntasDe,
  principal,
} from '../relatorio.js';

const FONTES =
  'https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@600;700&family=Red+Hat+Text:wght@400;500;600' +
  '&family=Red+Hat+Mono:wght@500;600&display=block';
const ESPERA_IMPRESSAO_MS = 500;
const VIDA_IFRAME_MS = 60_000;

/** Contagem por status no veredito, do pior para o melhor; OK aparece sempre. */
const CONTAGEM = [
  ['CRITICO', (n) => `${n} crítica(s)`],
  ['ATENCAO', (n) => `${n} com atenção`],
  ['OK', (n) => `${n} ok`, true],
  ['FORA', (n) => `${n} fora do monitor`],
  ['SEM', (n) => `${n} sem dados`],
];

// ---------- recursos embutidos ----------

let recursos = null;

function lerComoDataUri(blob) {
  return new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolver(leitor.result);
    leitor.onerror = rejeitar;
    leitor.readAsDataURL(blob);
  });
}

async function buscarRecursos() {
  const [respostaCss, respostaLogo] = await Promise.all([fetch(URLS.pdfCss), fetch(URLS.logo)]);
  if (!respostaCss.ok) throw new Error(`${URLS.pdfCss}: ${respostaCss.status}`);
  return { css: await respostaCss.text(), logo: await lerComoDataUri(await respostaLogo.blob()) };
}

/** CSS do PDF e logo em data URI, carregados uma vez: o HTML do relatório precisa ser autossuficiente. */
function carregarRecursos() {
  recursos ??= buscarRecursos().catch((erro) => {
    recursos = null; // tenta de novo no próximo clique
    throw erro;
  });
  return recursos;
}

// ---------- HTML do relatório ----------

/** Nome do arquivo sem extensão: monitor-mobilidade-aaaa-mm-dd (com o ambiente quando não é produção). */
function nomeDoArquivo(relatorio) {
  const ambiente = ambienteDeTeste();
  return `monitor-mobilidade-${relatorio.dataRef}${ambiente ? `-${ambiente.toLowerCase()}` : ''}`;
}

const status = (codigo) => html`<span class="st ${codigo}">${rotuloDe(codigo)}</span>`;

function tabelaDeMotivos(itens, chave) {
  if (!itens?.length) return html`<p class="nenhum">Nenhum.</p>`;
  return html`<table class="mot">
    <tbody>
      ${itens.map(
        (item) => html`<tr>
          <td>${item.motivo}${item.acao ? html`<span class="acao">Ação: ${item.acao}</span>` : ''}</td>
          <td class="n">${fmt(item[chave])}</td>
        </tr>`,
      )}
    </tbody>
  </table>`;
}

/** Indicador do topo do PDF; sem número mostra "—" e o motivo. */
function indicador(rotulo, n, { sufixo = '', vazio }) {
  if (!n) return html`<div class="kpi"><span>${rotulo}</span><b>—</b><small>${vazio}</small></div>`;
  const barra = n.base
    ? html`<small>de ${fmt(n.base)} · ${pct(n.valor, n.base)}</small>
        <div class="bar"><i style="width:${Math.min(100, (n.valor * 100) / n.base).toFixed(1)}%"></i></div>`
    : '';
  return html`<div class="kpi"><span>${rotulo}</span><b>${fmt(n.valor)}${sufixo}</b>${barra}</div>`;
}

const valorComPercentual = (n) => html`${fmt(n.valor)}${n.base ? html`<small>${pct(n.valor, n.base)}</small>` : ''}`;

function cabecalho(relatorio, logo) {
  const ambiente = estado.ambiente?.nome;
  return html`<div class="cab">
      <img alt="Mobilidade" src="${logo}">
      <div class="t">
        <h1>${APP.nome}${ambiente ? html`<span class="amb ${ambiente}">${ambiente}</span>` : ''}</h1>
        <div class="sub">Relatório diário de saúde do app Mobilidade</div>
      </div>
      <div class="dt"><b>${dataBr(relatorio.dataRef)}</b><span>gerado às ${horaDe(relatorio.geradoEm)} (Brasília)</span></div>
    </div>
    <div class="faixa"></div>`;
}

function veredito(relatorio, perguntas) {
  const total = contarStatus(perguntas);
  const consultas = relatorio.completo ? 'todas as consultas responderam' : 'alguma consulta não respondeu';
  const contagem = CONTAGEM.filter(([codigo, , sempre]) => sempre || total[codigo]).map(
    ([codigo, texto]) => html`<span><i data-st="${codigo}"></i>${texto(total[codigo])}</span>`,
  );
  return html`<div class="ver ${relatorio.veredito}">
    <div class="corpo">
      <h2>${tituloVeredito(relatorio.veredito)}</h2>
      <div class="c">${contagem}</div>
      <div class="n">${perguntas.length} perguntas da rotina diária · ${consultas}</div>
    </div>
    ${status(relatorio.veredito)}
  </div>`;
}

function indicadores(porId) {
  const { recebidas, entregues, esgotados, login } = destaquesDoDia(porId);
  return html`<div class="kpis">${[
    indicador('Ordens recebidas', recebidas, { vazio: 'sem lista do despacho' }),
    indicador('Retornos entregues', entregues, { vazio: 'sem lista do despacho' }),
    indicador('Apontamentos esgotados', esgotados, { vazio: 'sem dados' }),
    indicador('Login do app', login, { sufixo: ' ms', vazio: 'sem dados' }),
  ]}</div>`;
}

function indice(perguntas, porId) {
  const linhas = perguntas.map((p) => {
    const numPrincipal = principal(p, porId);
    return html`<tr>
      <td class="num">${doisDigitos(p.numero)}</td>
      <td>${p.pergunta}</td>
      <td class="n">${numPrincipal ? valorComPercentual(numPrincipal) : '—'}</td>
      <td>${status(p.status)}</td>
    </tr>`;
  });
  return html`<h3 class="sec">Resumo das perguntas</h3>
    <table class="indice">
      <thead><tr><th>#</th><th>Pergunta</th><th class="n">Principal</th><th>Status</th></tr></thead>
      <tbody>${linhas}</tbody>
    </table>`;
}

function despacho(dados) {
  if (!dados) return '';
  return html`<h3 class="sec">Despacho analisado</h3>
    <dl class="desp">
      <dt>Início</dt><dd>${dataBr(dados.inicio)}</dd>
      <dt>Ordens na lista</dt><dd>${fmt(dados.total)}</dd>
      <dt>Enviada por</dt><dd>${dados.enviadoPor} em ${dataBr(dados.enviadoEm)}</dd>
    </dl>`;
}

function detalheDoCheck(check, pergunta, numPrincipal, varios) {
  const numeros = (check.numeros || []).filter((n) => n !== numPrincipal);
  const motivos = check.resumo?.despacho;
  const chave = chaveDosMotivos(check.id);
  const achados = achadosNovos(check, pergunta.resposta);
  return html`${numeros.length
      ? html`<table>
          <thead><tr><th>Indicador${varios ? ` · ${check.titulo}` : ''}</th><th class="n">Valor</th></tr></thead>
          <tbody>${numeros.map((n) => html`<tr><td>${n.rotulo}</td><td class="n">${valorComPercentual(n)}</td></tr>`)}</tbody>
        </table>`
      : ''}
    ${motivos && (motivos.porMotivo || motivos.tiPorMotivo)
      ? html`<div class="duas">
          <div><h5>Por motivo do usuário · negócio</h5>${tabelaDeMotivos(motivos.porMotivo, chave)}</div>
          <div><h5>Com o sistema · TI</h5>${tabelaDeMotivos(motivos.tiPorMotivo, chave)}</div>
        </div>`
      : ''}
    ${achados.length
      ? html`<h5>O que foi encontrado</h5><ul class="ach">${achados.map((a) => html`<li>${a}</li>`)}</ul>`
      : ''}
    ${check.erro ? html`<p class="regra"><b>Sem dados:</b> ${check.erro}</p>` : ''}
    ${check.regra
      ? html`<p class="regra"><b>Regra:</b> ${check.regra}${check.elo ? html` · <b>Elo:</b> ${check.elo}` : ''}</p>`
      : ''}`;
}

function detalheDaPergunta(pergunta, porId) {
  const checks = checksDa(pergunta, porId);
  const numPrincipal = principal(pergunta, porId);
  const destaque =
    numPrincipal && pergunta.status !== 'FORA'
      ? html`<div class="dest">
          <b>${fmt(numPrincipal.valor)}</b>
          <span>${numPrincipal.base
              ? `de ${fmt(numPrincipal.base)} (${pct(numPrincipal.valor, numPrincipal.base)}) · `
              : ''}${numPrincipal.rotulo}</span>
        </div>`
      : '';
  return html`<div class="perg">
    <div class="pc">
      <span class="num">${doisDigitos(pergunta.numero)}</span>
      <h4>${pergunta.pergunta}</h4>
      ${status(pergunta.status)}
    </div>
    <div class="pb">
      ${destaque}
      <p class="resp">${pergunta.resposta}</p>
      ${checks.map((check) => detalheDoCheck(check, pergunta, numPrincipal, checks.length > 1))}
    </div>
  </div>`;
}

/**
 * HTML completo do relatório: cabeçalho, veredito, indicadores, índice das perguntas, despacho e, a partir da
 * página 2, cada pergunta em detalhe.
 */
function htmlDoRelatorio(relatorio, css, logo) {
  const perguntas = perguntasDe(relatorio);
  const porId = checksPorId(relatorio);
  // o título vira o nome sugerido em "Salvar como PDF" na impressão do navegador
  const documento = html`<!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8">
        <title>${nomeDoArquivo(relatorio)}</title>
        <link rel="stylesheet" href="${FONTES}">
        <style>${raw(css)}</style>
      </head>
      <body>
        ${cabecalho(relatorio, logo)}
        ${veredito(relatorio, perguntas)}
        ${indicadores(porId)}
        ${indice(perguntas, porId)}
        ${despacho(relatorio.despacho)}
        <h3 class="sec quebra">Respostas em detalhe</h3>
        ${perguntas.map((pergunta) => detalheDaPergunta(pergunta, porId))}
      </body>
    </html>`;
  return String(documento);
}

// ---------- saída ----------

/** Impressão do navegador, num iframe invisível (removido depois de 1 min). */
function imprimirNoNavegador(documento) {
  const quadro = Object.assign(document.createElement('iframe'), { srcdoc: documento, className: 'impressao' });
  quadro.onload = () =>
    setTimeout(() => {
      quadro.contentWindow.print();
      setTimeout(() => quadro.remove(), VIDA_IFRAME_MS);
    }, ESPERA_IMPRESSAO_MS);
  document.body.appendChild(quadro);
}

/** Baixa o PDF gerado pelo MonitorLocal. */
function baixar(blob, nome) {
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: nome });
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 2000);
}

async function exportar() {
  const relatorio = estado.relatorio;
  if (!relatorio) {
    avisar('Ainda não há relatório para exportar.', { erro: true });
    return;
  }
  const botao = $('bPdf');
  const rotulo = botao.querySelector('.rot');
  const textoOriginal = rotulo.textContent;
  const nome = `${nomeDoArquivo(relatorio)}.pdf`;
  botao.disabled = true;
  rotulo.textContent = 'Gerando…';
  try {
    const { css, logo } = await carregarRecursos();
    const documento = htmlDoRelatorio(relatorio, css, logo);
    const pdf = await gerarPdf(nome, documento);
    if (pdf) baixar(pdf, nome);
    else imprimirNoNavegador(documento);
  } catch (erro) {
    avisarErro('Não foi possível gerar o PDF: ', erro);
  } finally {
    botao.disabled = false;
    rotulo.textContent = textoOriginal;
  }
}

export function iniciarPdf() {
  carregarRecursos().catch(() => {}); // adianta o download; se falhar, tenta de novo no clique
  $('bPdf').addEventListener('click', exportar);
}
