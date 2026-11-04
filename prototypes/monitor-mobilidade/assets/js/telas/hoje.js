/**
 * Aba "Saúde do dia": veredito, quatro destaques, um cartão por pergunta da rotina diária e o cartão do
 * despacho em análise. Também liga o "Rodar agora" do menu.
 */
import {$, esc, fmt, dataBr} from '../util/formato.js';
import {ICONE, chip, tituloVeredito} from '../util/status.js';
import {estado} from '../estado.js';
import {api, falha} from '../api.js';
import {EXPL} from '../textos.js';
import {info} from '../ui/popover.js';
import {destaque, animar} from '../graficos.js';
import {linhas, listaMotivos, semAcao} from '../componentes.js';
import {perguntasDe, checksPorId, numeroDe, statusDe, contarStatus} from '../relatorio.js';
import {abrirDetalhe} from './detalhe.js';

/** Checks que ocupam duas colunas na grade (perguntas do despacho, com motivos lado a lado). */
const LARGAS_P = {C06: 1, C07: 1};

/** Busca /hoje e redesenha a aba, com os avisos (monitor desligado, relatório atrasado, execução que falhou). */
export function carregarHoje() {
  api('hoje').then(function (d) {
    estado.relatorio = d.relatorio;
    let av = '';
    if (!d.ativo) av += '<div class="aviso cr"><b>Monitor desligado.</b> ' + esc(d.pausaMotivo || 'A chave "ativo" está em 0.') + '<button class="btn" id="bLigar" type="button">Religar</button></div>';
    if (d.desatualizado) av += '<div class="aviso' + (new Date().getHours() >= 8 ? ' cr' : '') + '"><b>Relatório de ' + (d.dataRelatorio ? dataBr(d.dataRelatorio) : 'nenhum dia') + '.</b> O de hoje ainda não foi gerado (a análise roda às 05:30, com novas tentativas às 06:30 e 08:00).</div>';
    (d.execucoesHoje || []).forEach(function (e) { if (e.status === 'FALHOU') av += '<div class="aviso">Execução ' + esc(e.tipo) + ' falhou na tentativa ' + esc(e.tentativa) + ': ' + esc(e.erro) + '</div>'; });
    desenharHoje(d.relatorio, av);
    if ($('bLigar')) $('bLigar').addEventListener('click', function () { api('ativo', {method: 'POST', corpo: {ativo: true}}).then(carregarHoje); });
    $('sub').textContent = d.relatorio ? 'Relatório de ' + dataBr(d.relatorio.dataRef) + ' · gerado às ' + String(d.relatorio.geradoEm).slice(11, 16) : 'Sem relatório';
  }).catch(function (e) { falha($('aba-hoje'), e); });
}

/** Liga o "Rodar agora" do menu (o backend limita a uma análise manual a cada 10 min). */
export function iniciarHoje() {
  $('bRodar').addEventListener('click', function () {
    api('executar', {method: 'POST'}).then(function (r) { alert(r.mensagem); }).catch(function (e) { if (e.message !== '401') alert(e.message); });
  });
}

function desenharHoje(r, avisos) {
  const el = $('aba-hoje');
  if (!r) { el.innerHTML = avisos + '<div class="card vazio">Ainda não há relatório. A análise roda todo dia às 05:30; use "Rodar agora" para gerar o primeiro.</div>'; return; }
  const ps = perguntasDe(r), porId = checksPorId(r), cont = contarStatus(ps);

  // cabeçalho: veredito + destaques do dia
  let h = avisos + '<div class="topo-rel"><div class="card pad"><div class="resumo"><div class="selo ' + esc(r.veredito) + '">' + (ICONE[r.veredito] || ICONE.SEM_DADOS) + '</div><div>' +
    '<h2>' + esc(tituloVeredito(r.veredito)) + info(EXPL.veredito, 'Veredito do dia') + '</h2><div class="contagem">' +
    (cont.CRITICO ? '<span><i style="background:var(--cr)"></i>' + cont.CRITICO + ' crítica(s)</span>' : '') +
    (cont.ATENCAO ? '<span><i style="background:var(--at-dot)"></i>' + cont.ATENCAO + ' com atenção</span>' : '') +
    '<span><i style="background:var(--ok)"></i>' + cont.OK + ' ok</span>' +
    (cont.FORA ? '<span><i style="background:var(--fora)"></i>' + cont.FORA + ' fora do monitor</span>' : '') +
    (cont.SEM ? '<span><i style="background:var(--texto-3)"></i>' + cont.SEM + ' sem dados</span>' : '') +
    '</div><div class="tiny" style="margin-top:4px">' + ps.length + ' perguntas da rotina diária · ' + (r.completo ? 'todas as consultas responderam' : 'alguma consulta não respondeu') + '</div></div></div></div>' +
    '<div class="tiles">' + destaques(porId) + '</div></div>';

  // grade: perguntas em ordem; as do despacho ocupam 2 colunas
  h += '<div class="grade">';
  ps.forEach(function (p) { h += cardPergunta(p, porId); });
  h += cardDespacho(r.despacho);
  el.innerHTML = h + '</div>';
  animar(el);
  el.querySelectorAll('[data-det]').forEach(function (b) { b.addEventListener('click', function () { abrirDetalhe(ps[+b.dataset.det], porId); }); });
  if ($('irDespacho')) $('irDespacho').addEventListener('click', function () { document.querySelector('[data-aba=despacho]').click(); });
}

/** Os quatro destaques do topo: ordens recebidas, retornos entregues, apontamentos esgotados e login. */
function destaques(porId) {
  const rec = numeroDe(porId, 'C06', 'Recebidos'), ent = numeroDe(porId, 'C07', 'Entregues aos aparelhos');
  const esg = numeroDe(porId, 'C03', 'Apontamentos esgotados'), lg = numeroDe(porId, 'C09', 'Tempo de resposta do login (ms)');
  return tileN('Ordens recebidas', rec && rec.base ? rec : null, statusDe(porId, 'C06'), 'sem lista') +
    tileN('Retornos entregues', ent && ent.base ? ent : null, statusDe(porId, 'C07'), 'sem lista') +
    tileN('Apontamentos esgotados', esg, null, 'sem dados') +
    tileN('Login do app', lg, null, 'sem dados', ' ms');
}

function tileN(rot, n, status, vazio, sufixo) {
  return '<div class="tile"><span>' + esc(rot) + (n ? info(n.explicacao, n.rotulo) : '') + '</span>' +
    (n ? destaque(n, status, {peq: true, rotulo: false, info: false, sufixo: sufixo}) : '<div class="valor" style="margin-top:8px"><b>—</b><span class="de">' + esc(vazio) + '</span></div>') + '</div>';
}

/** Cartão de uma pergunta: número principal em destaque, demais números e, no despacho, motivos negócio × TI. */
function cardPergunta(p, porId) {
  const cs = p.checks.map(function (id) { return porId[id]; }).filter(Boolean);
  const nums = []; cs.forEach(function (c) { (c.numeros || []).forEach(function (n) { nums.push(n); }); });
  const largo = cs.some(function (c) { return LARGAS_P[c.id]; });
  let princ = null;
  nums.forEach(function (n) { if (!princ && n.base) princ = n; });
  if (!princ) princ = nums[0] || null;
  let h = '<article class="card rel ' + esc(p.status) + (largo ? ' largo2' : '') + '" id="p' + p.numero + '">' +
    '<div class="rel-cab"><div class="num">' + String(p.numero).padStart(2, '0') + '</div><h3>' + esc(p.pergunta) + '</h3>' + chip(p.status) + '</div><div class="rel-corpo">';
  if (p.status === 'FORA') h += '<div class="dest fora"><b>Fora do monitor</b></div>';
  else if (princ) h += destaque(princ, p.status);
  // o texto da resposta fica no "Detalhes"; no card só quando não há número para mostrar
  if (!princ || p.status === 'FORA') h += '<p class="resp-c">' + esc(p.resposta) + '</p>';
  const resto = nums.filter(function (n) { return n !== princ; });
  if (largo) {
    let d = null; cs.forEach(function (c) { if (c.resumo && c.resumo.despacho) d = c.resumo.despacho; });
    h += '<div class="lado"><div><h4>Números</h4>' + linhas(resto) + '</div>';
    if (d) {
      const chave = cs[0].id === 'C06' ? 'ordens' : 'retornos';
      h += '<div><h4>Por motivo do usuário' + info(EXPL.motivoUsuario) + '</h4>' + (listaMotivos(semAcao(d.porMotivo), chave) || '<span class="tiny">Nenhum.</span>') +
        '<h4 style="margin-top:14px">Com o sistema (TI)' + info(EXPL.motivoSistema) + '</h4>' + (listaMotivos(d.tiPorMotivo, chave, true) || '<span class="tiny">Nenhum.</span>') + '</div>';
    } else h += '<div class="tiny">Envie a lista do despacho para separar por motivo.</div>';
    h += '</div>';
  } else if (resto.length) h += linhas(resto);
  return h + '<button class="ver" type="button" data-det="' + (p.numero - 1) + '">Detalhes →</button></div></article>';
}

/** Cartão do despacho em análise, ou o convite para enviar a lista. */
function cardDespacho(d) {
  const h = '<article class="card rel largo2 desp-card"><div class="rel-cab"><div class="num" aria-hidden="true">D</div><h3>Despacho em análise</h3></div><div class="rel-corpo">';
  if (!d) return h + '<p class="resp-c">Nenhuma lista enviada. Suba a lista de ordens e o início do despacho para responder às perguntas 4, 5 e 6.</p><button class="ver" type="button" id="irDespacho">Enviar lista →</button></div></article>';
  return h + '<dl><dt>Início</dt><dd>' + dataBr(d.inicio) + '</dd><dt>Ordens na lista</dt><dd>' + fmt(d.total) + '</dd><dt>Enviada por</dt><dd>' + esc(d.enviadoPor) + ' em ' + dataBr(d.enviadoEm) + '</dd></dl>' +
    (d.erro ? '<div class="aviso cr">Falha ao calcular: ' + esc(d.erro) + '</div>' : '') +
    '<button class="ver" type="button" id="irDespacho">Resultado para o negócio →</button></div></article>';
}
