/**
 * Aba "Saúde do dia": veredito, quatro destaques, um cartão por pergunta da rotina diária e o cartão do despacho em
 * análise. Também liga o "Rodar agora" do menu.
 */
import { HORARIOS, LIMITES } from '../config.js';
import { html } from '../util/html.js';
import { $, fmt, dataBr, horaDe, doisDigitos } from '../util/formato.js';
import { COR, ICONE, chip, tituloVeredito } from '../util/status.js';
import { estado } from '../estado.js';
import { buscarHoje, definirAtivo, executarAgora, sessaoExpirada } from '../api.js';
import { EXPLICACOES } from '../textos.js';
import { info } from '../ui/popover.js';
import { avisar, avisarErro, fecharAviso } from '../ui/toast.js';
import { ocupar } from '../ui/ocupado.js';
import { irPara } from '../ui/abas.js';
import { destaque, animar } from '../graficos.js';
import { linhas, motivosOuNenhum, mostrarFalha } from '../componentes.js';
import {
  CHECKS_DO_DESPACHO,
  chaveDosMotivos,
  checksDa,
  checksPorId,
  contarStatus,
  destaquesDoDia,
  diagnosticoDe,
  naoEnviados,
  naoEnviadosDoDestaque,
  numerosDa,
  perguntasDe,
  principal,
  statusDe,
  cantoDa,
} from '../relatorio.js';
import { abrirDetalhe } from './detalhe.js';

/** Contagem por status no cabeçalho, do pior para o melhor; OK aparece sempre. */
const CONTAGEM = [
  ['CRITICO', (n) => `${n} crítica(s)`],
  ['ATENCAO', (n) => `${n} com atenção`],
  ['OK', (n) => `${n} ok`, true],
  ['FORA', (n) => `${n} fora do monitor`],
  ['SEM', (n) => `${n} sem dados`],
];

// ---------- avisos ----------

function avisoDesligado(dados) {
  return html`<div class="aviso cr">
    <b>Monitor desligado.</b> ${dados.pausaMotivo || 'A chave "ativo" está em 0.'}<button class="btn" id="bLigar"
      type="button">Religar</button>
  </div>`;
}

function avisoAtrasado(dados) {
  const critico = new Date().getHours() >= LIMITES.horaRelatorioAtrasado;
  const dia = dados.dataRelatorio ? dataBr(dados.dataRelatorio) : 'nenhum dia';
  return html`<div class="aviso${critico ? ' cr' : ''}"><b>Relatório de ${dia}.</b> O de hoje ainda não foi gerado
    (a análise roda às ${HORARIOS.analise}, com novas tentativas às ${HORARIOS.novasTentativas}).</div>`;
}

function avisos(dados) {
  const falhas = (dados.execucoesHoje || []).filter((execucao) => execucao.status === 'FALHOU');
  return html`${dados.ativo ? '' : avisoDesligado(dados)}${dados.desatualizado ? avisoAtrasado(dados) : ''}${falhas.map(
    (e) => html`<div class="aviso">Execução ${e.tipo} falhou na tentativa ${e.tentativa}: ${e.erro}</div>`,
  )}`;
}

// ---------- cabeçalho ----------

function contagem(perguntas) {
  const total = contarStatus(perguntas);
  return CONTAGEM.filter(([status, , sempre]) => sempre || total[status]).map(
    ([status, texto]) => html`<span><i data-st="${status}"></i>${texto(total[status])}</span>`,
  );
}

function cabecalho(relatorio, perguntas, porId) {
  const veredito = relatorio.veredito;
  const consultas = relatorio.completo ? 'todas as consultas responderam' : 'alguma consulta não respondeu';
  return html`<div class="topo-rel">
    <div class="card pad">
      <div class="resumo">
        <div class="selo ${veredito}">${ICONE[veredito] || ICONE.SEM_DADOS}</div>
        <div>
          <h2>${tituloVeredito(veredito)}${info(EXPLICACOES.veredito, 'Veredito do dia')}</h2>
          <div class="contagem">${contagem(perguntas)}</div>
          <div class="tiny resumo-nota">${perguntas.length} perguntas da rotina diária · ${consultas}</div>
        </div>
      </div>
    </div>
    <div class="tiles">${tilesDoDia(porId)}</div>
  </div>`;
}

function tile(rotulo, n, { status = null, vazio, sufixo, faltam = null } = {}) {
  const conteudo = n
    ? destaque(n, status, { pequeno: true, rotulo: false, info: false, sufixo, faltam })
    : html`<div class="valor sem-valor"><b>—</b><span class="de">${vazio}</span></div>`;
  return html`<div class="tile"><span>${rotulo}${n ? info(n.explicacao, n.rotulo) : ''}</span>${conteudo}</div>`;
}

/** Tile do login: o diagnóstico em destaque e o tempo de resposta embaixo. */
function tileDiagnostico(rotulo, diagnostico, tempo) {
  return html`<div class="tile">
    <span>${rotulo}${tempo ? info(tempo.explicacao, tempo.rotulo) : ''}</span>
    <div class="dest2"><div class="valor">
      <b style="color:${COR[diagnostico.status] ?? COR.SEM_DADOS}">${diagnostico.curto}</b>
      ${tempo ? html`<span class="de">${fmt(tempo.valor)} ms</span>` : ''}
    </div></div>
  </div>`;
}

function tilesDoDia(porId) {
  const { recebidas, entregues, esgotados, login, diagnosticoLogin } = destaquesDoDia(porId);
  return [
    tile('Ordens recebidas', recebidas, { status: statusDe(porId, 'C06'), vazio: 'sem lista', faltam: naoEnviados(recebidas) }),
    tile('Retornos entregues', entregues, { status: statusDe(porId, 'C07'), vazio: 'sem lista', faltam: naoEnviados(entregues) }),
    tile('Apontamentos esgotados', esgotados, { vazio: 'sem dados' }),
    diagnosticoLogin
      ? tileDiagnostico('Login do app', diagnosticoLogin, login)
      : tile('Login do app', login, { vazio: 'sem dados', sufixo: ' ms' }),
  ];
}

// ---------- cartões ----------

/** Números e motivos negócio × TI das perguntas do despacho, lado a lado. */
function ladoDespacho(checks, numeros) {
  const despacho = checks.findLast((check) => check.resumo?.despacho)?.resumo.despacho;
  let motivos = html`<div class="tiny">Envie a lista do despacho para separar por motivo.</div>`;
  if (despacho) {
    const chave = chaveDosMotivos(checks[0].id);
    motivos = html`<div>
      <h4>Por motivo do usuário${info(EXPLICACOES.motivoUsuario)}</h4>
      ${motivosOuNenhum(despacho.porMotivo, chave, { comAcao: false })}
      <h4 class="depois-lista">Com o sistema (TI)${info(EXPLICACOES.motivoSistema)}</h4>
      ${motivosOuNenhum(despacho.tiPorMotivo, chave, { ti: true })}
    </div>`;
  }
  return html`<div class="lado"><div><h4>Números</h4>${linhas(numeros)}</div>${motivos}</div>`;
}

/**
 * Números do canto, ao lado do principal: total do despacho com todos os usuários (C06/C07), fila de mortas (C01, na cor
 * do status) e os esgotados por XML (C03).
 */
function cantoDoCartao(itens, status) {
  if (!itens.length) return '';
  return html`<div class="dest-canto">
    ${itens.map(
      (item) => html`<div class="canto-item">
        <b style="${item.alerta ? `color:${COR[status] ?? COR.SEM_DADOS}` : ''}">${fmt(item.numero.valor)}</b>
        <span>${item.texto}${info(item.numero.explicacao, item.numero.rotulo)}</span>
      </div>`,
    )}
  </div>`;
}

function blocoDiagnostico(diagnostico) {
  return html`<div class="dest2 diag">
    <div class="selo ${diagnostico.status}">${ICONE[diagnostico.status] || ICONE.SEM_DADOS}</div>
    <div class="valor"><b>${diagnostico.titulo}</b><span class="de">${diagnostico.detalhe}</span></div>
  </div>`;
}

/** Cartão de uma pergunta: número principal ou diagnóstico em destaque, demais números e, no despacho, motivos negócio × TI. */
function cartaoPergunta(pergunta, porId) {
  const checks = checksDa(pergunta, porId);
  const numPrincipal = principal(pergunta, porId);
  const diagnostico = diagnosticoDe(pergunta, porId);
  const canto = cantoDa(pergunta, porId);
  const noCanto = new Set(canto.map((item) => item.numero));
  const outros = numerosDa(pergunta, porId).filter((n) => n !== numPrincipal && !noCanto.has(n));
  const largo = checks.some((check) => CHECKS_DO_DESPACHO.has(check.id));
  const fora = pergunta.status === 'FORA';

  let corpo = html``;
  if (fora) corpo = html`<div class="dest fora"><b>Fora do monitor</b></div>`;
  else if (diagnostico) corpo = blocoDiagnostico(diagnostico);
  else if (numPrincipal) {
    corpo = destaque(numPrincipal, pergunta.status, {
      canto: cantoDoCartao(canto, pergunta.status),
      faltam: naoEnviadosDoDestaque(numPrincipal),
    });
  }
  // o texto da resposta fica no "Detalhes"; no cartão só quando não há número nem diagnóstico para mostrar
  if ((!numPrincipal && !diagnostico) || fora) corpo = html`${corpo}<p class="resp-c">${pergunta.resposta}</p>`;
  if (largo) corpo = html`${corpo}${ladoDespacho(checks, outros)}`;
  else if (outros.length) corpo = html`${corpo}${linhas(outros)}`;

  return html`<article class="card rel ${pergunta.status}${largo ? ' largo2' : ''}" id="p${pergunta.numero}">
    <div class="rel-cab">
      <div class="num">${doisDigitos(pergunta.numero)}</div>
      <h3>${pergunta.pergunta}</h3>
      ${chip(pergunta.status)}
    </div>
    <div class="rel-corpo">
      ${corpo}
      <button class="ver" type="button" data-det="${pergunta.numero - 1}">Detalhes →</button>
    </div>
  </article>`;
}

/** Cartão do despacho em análise, ou o convite para enviar a lista. */
function cartaoDespacho(despacho) {
  const corpo = despacho
    ? html`<dl>
          <dt>Início</dt><dd>${dataBr(despacho.inicio)}</dd>
          <dt>Ordens na lista</dt><dd>${fmt(despacho.total)}</dd>
          <dt>Enviada por</dt><dd>${despacho.enviadoPor} em ${dataBr(despacho.enviadoEm)}</dd>
        </dl>
        ${despacho.erro ? html`<div class="aviso cr">Falha ao calcular: ${despacho.erro}</div>` : ''}
        <button class="ver" type="button" id="irDespacho">Resultado para o negócio →</button>`
    : html`<p class="resp-c">Nenhuma lista enviada. Suba a lista de ordens e o início do despacho para responder às
          perguntas 4, 5 e 6.</p>
        <button class="ver" type="button" id="irDespacho">Enviar lista →</button>`;
  return html`<article class="card rel largo2 desp-card">
    <div class="rel-cab"><div class="num" aria-hidden="true">D</div><h3>Despacho em análise</h3></div>
    <div class="rel-corpo">${corpo}</div>
  </article>`;
}

// ---------- tela ----------

function desenhar(relatorio, htmlAvisos) {
  const aba = $('aba-hoje');
  if (!relatorio) {
    aba.innerHTML = html`${htmlAvisos}<div class="card vazio">Ainda não há relatório. A análise roda todo dia às ${HORARIOS.analise};
      use "Rodar agora" para gerar o primeiro.</div>`;
    return;
  }
  const perguntas = perguntasDe(relatorio);
  const porId = checksPorId(relatorio);
  const cartoes = [...perguntas.map((pergunta) => cartaoPergunta(pergunta, porId)), cartaoDespacho(relatorio.despacho)];
  aba.innerHTML = html`${htmlAvisos}${cabecalho(relatorio, perguntas, porId)}<div class="grade">${cartoes}</div>`;
  animar(aba);
  for (const botao of aba.querySelectorAll('[data-det]')) {
    botao.addEventListener('click', () => abrirDetalhe(perguntas[Number(botao.dataset.det)], porId));
  }
  $('irDespacho')?.addEventListener('click', () => irPara('despacho'));
}

function subtitulo(relatorio) {
  return relatorio
    ? `Relatório de ${dataBr(relatorio.dataRef)} · gerado às ${horaDe(relatorio.geradoEm)}`
    : 'Sem relatório';
}

async function religar() {
  const liberar = ocupar($('bLigar'), 'Religando…');
  try {
    await definirAtivo(true);
    await carregarHoje();
  } catch (erro) {
    if (!sessaoExpirada(erro)) avisarErro('Não foi possível religar o monitor: ', erro);
  } finally {
    liberar();
  }
}

/** Busca /hoje e redesenha a aba, com os avisos (monitor desligado, relatório atrasado, execução que falhou). */
export async function carregarHoje() {
  try {
    const dados = await buscarHoje();
    estado.relatorio = dados.relatorio;
    desenhar(dados.relatorio, avisos(dados));
    $('bLigar')?.addEventListener('click', religar);
    $('sub').textContent = subtitulo(dados.relatorio);
  } catch (erro) {
    mostrarFalha($('aba-hoje'), erro);
  }
}

/** Liga o "Rodar agora" do menu (o backend limita a uma análise manual a cada 10 min). */
export function iniciarHoje() {
  const botao = $('bRodar');
  botao.addEventListener('click', async () => {
    botao.disabled = true;
    avisar('Solicitando a análise…', { espera: true });
    try {
      const { mensagem } = await executarAgora();
      avisar(mensagem);
    } catch (erro) {
      if (sessaoExpirada(erro)) fecharAviso();
      else avisarErro('', erro);
    } finally {
      botao.disabled = false;
    }
  });
}
