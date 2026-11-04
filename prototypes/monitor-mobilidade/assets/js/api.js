/**
 * Camada de dados do protótipo: a única parte que sabe de onde vêm os dados.
 *
 * Na tela real, as chamadas vão para o MonitorLocal.java, que as repassa (com a chave do APIM) para as rotas
 * /v2/monitor/* do backend. Aqui `servidor()` responde essas mesmas rotas sobre data/db.json + localStorage, com as
 * mesmas regras e mensagens do backend, e devolve um Response de verdade: o resto da tela não muda.
 *
 *   POST login               qualquer usuário e senha preenchidos entram (sessão de 8 h)
 *   GET  ambiente            PROTÓTIPO
 *   GET  hoje                relatório do dia, chave "ativo" e execuções
 *   GET  historico?dias=30   série dos últimos dias
 *   GET  relatorio/aaaa-mm-dd?formato=md   relatório completo em Markdown
 *   GET  despacho/atual      resultado do despacho para a área de negócio
 *   POST despacho            nova lista: depois de API_CONFIG.calculoMs o despacho e o relatório do dia são "refeitos"
 *   POST executar            "Rodar agora": refaz a análise depois de API_CONFIG.calculoMs (1 a cada 10 min)
 *   POST ativo               liga ou desliga o monitor
 *   POST pdf                 501: sem gerador de PDF, a tela usa a impressão do navegador
 *
 * Para ligar no backend real, troque `servidor` por `fetch` (é o que a tela do MonitorLocal faz).
 */
import {estado} from './estado.js';
import {esc} from './util/formato.js';
import {API_CONFIG, AMBIENTE, MESSAGES, REGRAS} from './config.js';

// ---------- servidor simulado ----------

const TABELAS = ['config', 'relatorio', 'historico', 'despachoAtual', 'relatorioMarkdown', 'execucoes', 'envios'];
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
const sorteio = (min, max) => Math.round(min + Math.random() * (max - min));
const pad = (n) => String(n).padStart(2, '0');

/** Data e hora locais no formato do backend (aaaa-mm-ddThh:mm:ss). */
function agoraIso(ms) {
  const d = ms == null ? new Date() : new Date(ms);
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
}

const armazenamento = (() => {
  try {
    window.localStorage.setItem('__teste__', '1');
    window.localStorage.removeItem('__teste__');
    return window.localStorage;
  } catch (e) {
    return null;
  }
})();

let db = null;

function formatoValido(dados) {
  return Boolean(dados) && TABELAS.every(function (t) { return t in dados; });
}

function lerSalvo() {
  if (!armazenamento) return null;
  try {
    const salvo = JSON.parse(armazenamento.getItem(API_CONFIG.storageKey) || 'null');
    return salvo && salvo.schemaVersion === API_CONFIG.schemaVersion && formatoValido(salvo.data) ? salvo.data : null;
  } catch (e) {
    return null;
  }
}

function salvar() {
  if (!armazenamento) return;
  try {
    armazenamento.setItem(API_CONFIG.storageKey, JSON.stringify({schemaVersion: API_CONFIG.schemaVersion, savedAt: agoraIso(), data: db}));
  } catch (e) { /* sem espaço: segue em memória */ }
}

async function carregar() {
  if (db) return db;
  db = lerSalvo();
  if (db) return db;
  const controle = new AbortController();
  const timer = setTimeout(function () { controle.abort(); }, API_CONFIG.requestTimeoutMs);
  let r;
  try {
    r = await fetch(API_CONFIG.dbUrl, {signal: controle.signal, cache: 'no-cache'});
  } catch (e) {
    throw new Error(e.name === 'AbortError' ? MESSAGES.timeout : MESSAGES.network);
  } finally {
    clearTimeout(timer);
  }
  if (!r.ok) throw new Error('O servidor respondeu com erro (HTTP ' + r.status + ').');
  const base = await r.json().catch(function () { return null; });
  if (!formatoValido(base)) throw new Error(MESSAGES.invalidData);
  db = {};
  TABELAS.forEach(function (t) { db[t] = base[t]; });
  salvar();
  return db;
}

/** Latência e falhas de teste (?latencia, ?erros). Devolve true quando a chamada deve falhar. */
async function simularRede() {
  const espera = API_CONFIG.latencyMs != null ? API_CONFIG.latencyMs : sorteio(API_CONFIG.latencyRangeMs[0], API_CONFIG.latencyRangeMs[1]);
  if (espera > 0) await sleep(espera);
  return API_CONFIG.failureRate > 0 && Math.random() < API_CONFIG.failureRate;
}

function responder(status, corpo, tipo) {
  const texto = typeof corpo === 'string' ? corpo : JSON.stringify(corpo);
  return new Response(texto, {status: status, headers: {'Content-Type': tipo || 'application/json; charset=utf-8', 'Cache-Control': 'no-store'}});
}
const erro = (status, mensagem) => responder(status, {message: mensagem});

// ---------- sessão (JWT sem assinatura: a tela só lê o nameid; o backend real assina e valida) ----------

function base64url(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  let bin = '';
  bytes.forEach(function (b) { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function emitirToken(usuario) {
  const exp = Math.floor((Date.now() + REGRAS.sessaoMs) / 1000);
  return base64url({alg: 'none', typ: 'JWT'}) + '.' + base64url({nameid: 'TERNIUM\\' + usuario, exp: exp}) + '.prototipo';
}

/** Usuário da sessão (minúsculo, sem domínio) ou null se o token faltar ou tiver expirado. */
function usuarioDoToken(cabecalho) {
  const tk = String(cabecalho || '').replace(/^Bearer\s+/i, '');
  try {
    const b = tk.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const bin = atob(b + '==='.slice((b.length + 3) % 4));
    const c = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, function (ch) { return ch.charCodeAt(0); })));
    if (!c.exp || c.exp * 1000 < Date.now()) return null;
    return String(c.nameid).split('\\').pop().toLowerCase();
  } catch (e) {
    return null;
  }
}

// ---------- o que o backend calcula em segundo plano ----------

const ultimo = (lista) => (lista.length ? lista[lista.length - 1] : null);
function minutosDesde(iso) { return iso ? (Date.now() - new Date(iso).getTime()) / 60000 : Infinity; }

/** A análise refeita gera um relatório MANUAL com a hora nova (os números de exemplo continuam os mesmos). */
function refazerAnalise(ms) {
  db.relatorio.geradoEm = agoraIso(ms);
  db.relatorio.tipo = 'MANUAL';
}

/** Conclui o que já passou do tempo de cálculo: despachos enviados e análises manuais. */
function concluirPendentes() {
  let mudou = false;
  db.envios.forEach(function (e) {
    if (e.concluido || Date.now() < e.prontoEm) return;
    e.concluido = true; mudou = true;
    db.despachoAtual.despacho = {id: e.id, inicio: e.inicio};
    db.despachoAtual.extracao = agoraIso(e.prontoEm).slice(0, 16);
    db.relatorio.despacho = Object.assign({}, db.relatorio.despacho, {id: e.id, inicio: e.inicio, total: e.ordens, enviadoPor: e.usuario, enviadoEm: e.enviadoEm.slice(0, 16)});
    refazerAnalise(e.prontoEm);
  });
  db.execucoes.forEach(function (x) {
    if (x.status !== 'EXECUTANDO' || Date.now() < x.prontoEm) return;
    x.status = 'OK'; mudou = true;
    refazerAnalise(x.prontoEm);
  });
  if (mudou) salvar();
}

/** Ordens válidas e distintas (até 12 dígitos; zeros à esquerda não contam), como no MonitorService. */
function normalizarOrdens(brutas) {
  const vistas = {};
  (brutas || []).forEach(function (o) {
    const n = String(o == null ? '' : o).trim();
    if (/^\d{1,12}$/.test(n)) vistas[n.replace(/^0+(?=\d)/, '')] = 1;
  });
  return Object.keys(vistas);
}

// ---------- rotas ----------

/**
 * Responde uma rota do monitor como o MonitorLocal + backend responderiam.
 * @param {string} caminho rota relativa, ex.: 'hoje', 'historico?dias=30'
 * @param {RequestInit} [init] method, headers (objeto simples) e body
 * @returns {Promise<Response>}
 */
export async function servidor(caminho, init) {
  init = init || {};
  const metodo = String(init.method || 'GET').toUpperCase();
  const rota = String(caminho).split('?')[0];
  const cab = init.headers || {};
  const corpo = function () { try { return JSON.parse(init.body || '{}'); } catch (e) { return {}; } };

  if (metodo === 'GET' && rota === 'ambiente') return responder(200, AMBIENTE);
  if (metodo === 'POST' && rota === 'pdf') return erro(501, MESSAGES.pdfUnavailable);

  if (await simularRede()) return erro(503, MESSAGES.unavailable);
  try {
    await carregar();
  } catch (e) {
    return erro(502, e.message);
  }

  if (metodo === 'POST' && rota === 'login') {
    const c = corpo(), usuario = String(c.usuario || '').trim(), senha = String(c.senha || '').trim();
    if (!usuario || !senha) return erro(400, MESSAGES.loginRequired);
    const id = usuario.split('\\').pop().split('@')[0];
    return responder(200, {token: emitirToken(id), expires: new Date(Date.now() + REGRAS.sessaoMs).toISOString()});
  }

  const usuario = usuarioDoToken(cab.Authorization || cab.authorization);
  if (!usuario) return erro(401, MESSAGES.sessionExpired);
  concluirPendentes();

  if (metodo === 'GET' && rota === 'hoje') {
    return responder(200, {
      dataRelatorio: db.relatorio.dataRef, relatorio: db.relatorio, desatualizado: false,
      ativo: db.config.ativo, pausaMotivo: db.config.pausaMotivo || '',
      execucoesHoje: db.execucoes.filter(function (x) { return x.status !== 'EXECUTANDO'; })
        .map(function (x) { return {tipo: x.tipo, status: x.status, tentativa: x.tentativa, erro: x.erro}; }),
    });
  }
  if (metodo === 'GET' && rota === 'historico') return responder(200, db.historico);
  if (metodo === 'GET' && rota.indexOf('relatorio/') === 0) {
    const dia = rota.slice('relatorio/'.length);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return erro(400, MESSAGES.invalidDate);
    if (dia !== db.relatorio.dataRef) return erro(404, MESSAGES.noReport);
    return responder(200, db.relatorioMarkdown, 'text/markdown; charset=utf-8');
  }
  if (metodo === 'GET' && rota === 'despacho/atual') return db.despachoAtual ? responder(200, db.despachoAtual) : erro(404, MESSAGES.noDispatch);

  if (metodo === 'POST' && rota === 'despacho') {
    const c = corpo();
    if (!c.inicio || !Array.isArray(c.ordens)) return erro(400, MESSAGES.missingDispatch);
    if (c.ordens.length > 20000) return erro(400, 'Lista grande demais.');
    const inicio = String(c.inicio).slice(0, 16);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(inicio) || isNaN(new Date(inicio).getTime())) return erro(400, MESSAGES.invalidStart);
    const anterior = ultimo(db.envios);
    if (anterior && minutosDesde(anterior.enviadoEm) < REGRAS.minutosEntreManuais) return erro(429, MESSAGES.listTooSoon(REGRAS.minutosEntreManuais));
    const ordens = normalizarOrdens(c.ordens);
    if (!ordens.length) return erro(400, MESSAGES.noValidOrders);
    if (ordens.length > REGRAS.maxOrdens) return erro(400, MESSAGES.tooManyOrders);
    if (new Date(inicio).getTime() > Date.now() + 5 * 60000) return erro(400, MESSAGES.futureStart);
    const atual = db.despachoAtual && db.despachoAtual.despacho ? db.despachoAtual.despacho.id : 0;
    const id = Math.max(atual, anterior ? anterior.id : 0) + 1;
    db.envios.push({id: id, inicio: inicio, ordens: ordens.length, usuario: usuario, enviadoEm: agoraIso(), prontoEm: Date.now() + API_CONFIG.calculoMs, concluido: false});
    salvar();
    return responder(200, {id: id, ordens: ordens.length, duplicadasOuInvalidas: c.ordens.length - ordens.length});
  }

  if (metodo === 'POST' && rota === 'executar') {
    // como no backend: a resposta é sempre a mesma; a análise só roda se a última manual tiver mais de 10 min
    const manual = ultimo(db.execucoes.filter(function (x) { return x.tipo === 'MANUAL'; }));
    if (db.config.ativo && (!manual || minutosDesde(manual.iniciadaEm) >= REGRAS.minutosEntreManuais)) {
      db.execucoes.push({tipo: 'MANUAL', status: 'EXECUTANDO', tentativa: 1, erro: null, iniciadaEm: agoraIso(), prontoEm: Date.now() + API_CONFIG.calculoMs});
      salvar();
    }
    return responder(200, {mensagem: MESSAGES.manualRequested});
  }

  if (metodo === 'POST' && rota === 'ativo') {
    const ligar = corpo().ativo === true;
    db.config.ativo = ligar;
    if (ligar) db.config.pausaMotivo = '';
    salvar();
    return responder(200, {ativo: ligar});
  }

  return erro(404, MESSAGES.routeNotFound);
}

// ---------- cliente usado pelas telas (igual ao da tela real, com servidor no lugar de fetch) ----------

let aoExpirar = () => {};

/** Define o que fazer quando o backend responde 401 (sessão expirada): no main.js, voltar ao login. */
export function quandoExpirar(fn) { aoExpirar = fn; }

/** Cabeçalhos JSON, com o token quando há sessão. */
export function cabecalhos() {
  const cab = {'Content-Type': 'application/json'};
  if (estado.token) cab['Authorization'] = 'Bearer ' + estado.token;
  return cab;
}

/**
 * Chama uma rota do monitor.
 * @param {string} caminho rota relativa, ex.: 'hoje', 'historico?dias=30'
 * @param {{method?: string, corpo?: object, texto?: boolean}} [opcoes] corpo vai como JSON; texto devolve string em vez de JSON
 * @returns {Promise<any>} rejeita com Error(mensagem do backend); em 401 com Error('401'), depois de voltar ao login
 */
export function api(caminho, opcoes) {
  opcoes = opcoes || {};
  return servidor(caminho, {method: opcoes.method || 'GET', headers: cabecalhos(), body: opcoes.corpo ? JSON.stringify(opcoes.corpo) : undefined})
    .then(function (r) {
      if (r.status === 401) { aoExpirar('Sessão expirada. Entre de novo.'); throw new Error('401'); }
      if (!r.ok) return r.text().then(function (t) { let m = t; try { m = JSON.parse(t).message || t; } catch (e) { /* texto puro */ } throw new Error(m); });
      return opcoes.texto ? r.text() : r.json();
    });
}

/** Mostra o erro no lugar do conteúdo (o 401 já foi tratado com a volta ao login). */
export function falha(el, e) {
  if (e.message !== '401') el.innerHTML = '<div class="aviso cr">' + esc(e.message) + '</div>';
}
