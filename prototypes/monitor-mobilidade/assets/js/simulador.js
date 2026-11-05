/**
 * Backend simulado do protótipo: responde as mesmas rotas que o MonitorLocal.java repassa para /v2/monitor/*, sobre
 * data/db.json + localStorage, com as mesmas regras e mensagens do backend, e devolve um Response de verdade. O resto
 * da tela não sabe que é simulado (ver http.js).
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
 */
import { API_CONFIG, AMBIENTE, MESSAGES, REGRAS } from './config.js';

const TABELAS = ['config', 'relatorio', 'historico', 'despachoAtual', 'relatorioMarkdown', 'execucoes', 'envios'];
const LIMITE_BRUTO_ORDENS = 20_000;
const TOLERANCIA_FUTURO_MS = 5 * 60_000;

const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));
const sortear = (min, max) => Math.round(min + Math.random() * (max - min));
const doisDigitos = (n) => String(n).padStart(2, '0');
const ultimo = (lista) => lista.at(-1) ?? null;
const minutosDesde = (iso) => (iso ? (Date.now() - new Date(iso).getTime()) / 60_000 : Infinity);

/** Data e hora locais no formato do backend (aaaa-mm-ddThh:mm:ss). */
function agoraIso(ms = Date.now()) {
  const d = new Date(ms);
  const data = [d.getFullYear(), doisDigitos(d.getMonth() + 1), doisDigitos(d.getDate())].join('-');
  const hora = [d.getHours(), d.getMinutes(), d.getSeconds()].map(doisDigitos).join(':');
  return `${data}T${hora}`;
}

// ---------- persistência ----------

const armazenamento = (() => {
  try {
    localStorage.setItem('__teste__', '1');
    localStorage.removeItem('__teste__');
    return localStorage;
  } catch {
    return null; // modo privado ou armazenamento bloqueado: segue só em memória
  }
})();

let db = null;

const formatoValido = (dados) => Boolean(dados) && TABELAS.every((tabela) => tabela in dados);

function lerSalvo() {
  if (!armazenamento) return null;
  try {
    const salvo = JSON.parse(armazenamento.getItem(API_CONFIG.storageKey) || 'null');
    const valido = salvo?.schemaVersion === API_CONFIG.schemaVersion && formatoValido(salvo.data);
    return valido ? salvo.data : null;
  } catch {
    return null;
  }
}

function salvar() {
  if (!armazenamento) return;
  const registro = { schemaVersion: API_CONFIG.schemaVersion, savedAt: agoraIso(), data: db };
  try {
    armazenamento.setItem(API_CONFIG.storageKey, JSON.stringify(registro));
  } catch {
    // sem espaço: segue em memória
  }
}

async function baixarBase() {
  const controle = new AbortController();
  const prazo = setTimeout(() => controle.abort(), API_CONFIG.requestTimeoutMs);
  try {
    const resposta = await fetch(API_CONFIG.dbUrl, { signal: controle.signal, cache: 'no-cache' });
    if (!resposta.ok) throw new Error(`O servidor respondeu com erro (HTTP ${resposta.status}).`);
    return await resposta.json().catch(() => null);
  } catch (erro) {
    if (erro.name === 'AbortError') throw new Error(MESSAGES.timeout);
    if (erro instanceof TypeError) throw new Error(MESSAGES.network);
    throw erro;
  } finally {
    clearTimeout(prazo);
  }
}

async function carregar() {
  db ??= lerSalvo();
  if (db) return;
  const base = await baixarBase();
  if (!formatoValido(base)) throw new Error(MESSAGES.invalidData);
  db = Object.fromEntries(TABELAS.map((tabela) => [tabela, base[tabela]]));
  salvar();
}

// ---------- rede e respostas ----------

/** Latência e falhas de teste (?latencia, ?erros). Devolve true quando a chamada deve falhar. */
async function simularRede() {
  const espera = API_CONFIG.latencyMs ?? sortear(...API_CONFIG.latencyRangeMs);
  if (espera > 0) await esperar(espera);
  return API_CONFIG.failureRate > 0 && Math.random() < API_CONFIG.failureRate;
}

function responder(status, corpo, tipo = 'application/json; charset=utf-8') {
  const texto = typeof corpo === 'string' ? corpo : JSON.stringify(corpo);
  return new Response(texto, { status, headers: { 'Content-Type': tipo, 'Cache-Control': 'no-store' } });
}

const erro = (status, mensagem) => responder(status, { message: mensagem });

// ---------- sessão (JWT sem assinatura: a tela só lê o nameid; o backend real assina e valida) ----------

function base64url(objeto) {
  const binario = String.fromCharCode(...new TextEncoder().encode(JSON.stringify(objeto)));
  return btoa(binario).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function emitirToken(usuario) {
  const exp = Math.floor((Date.now() + REGRAS.sessaoMs) / 1000);
  return `${base64url({ alg: 'none', typ: 'JWT' })}.${base64url({ nameid: `TERNIUM\\${usuario}`, exp })}.prototipo`;
}

/** Usuário da sessão (minúsculo, sem domínio) ou null se o token faltar ou tiver expirado. */
function usuarioDoToken(cabecalho) {
  const token = String(cabecalho || '').replace(/^Bearer\s+/i, '');
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const binario = atob(base64 + '==='.slice((base64.length + 3) % 4));
    const claims = JSON.parse(new TextDecoder().decode(Uint8Array.from(binario, (c) => c.charCodeAt(0))));
    if (!claims.exp || claims.exp * 1000 < Date.now()) return null;
    return String(claims.nameid).split('\\').pop().toLowerCase();
  } catch {
    return null;
  }
}

// ---------- o que o backend calcula em segundo plano ----------

/** A análise refeita gera um relatório MANUAL com a hora nova (os números de exemplo continuam os mesmos). */
function refazerAnalise(ms) {
  db.relatorio.geradoEm = agoraIso(ms);
  db.relatorio.tipo = 'MANUAL';
}

/** Conclui o que já passou do tempo de cálculo: despachos enviados e análises manuais. */
function concluirPendentes() {
  let mudou = false;
  for (const envio of db.envios) {
    if (envio.concluido || Date.now() < envio.prontoEm) continue;
    envio.concluido = true;
    mudou = true;
    db.despachoAtual.despacho = { id: envio.id, inicio: envio.inicio };
    db.despachoAtual.extracao = agoraIso(envio.prontoEm).slice(0, 16);
    db.relatorio.despacho = {
      ...db.relatorio.despacho,
      id: envio.id,
      inicio: envio.inicio,
      total: envio.ordens,
      enviadoPor: envio.usuario,
      enviadoEm: envio.enviadoEm.slice(0, 16),
    };
    refazerAnalise(envio.prontoEm);
  }
  for (const execucao of db.execucoes) {
    if (execucao.status !== 'EXECUTANDO' || Date.now() < execucao.prontoEm) continue;
    execucao.status = 'OK';
    mudou = true;
    refazerAnalise(execucao.prontoEm);
  }
  if (mudou) salvar();
}

/** Ordens válidas e distintas (até 12 dígitos; zeros à esquerda não contam), como no MonitorService. */
function normalizarOrdens(brutas = []) {
  const validas = brutas.map((ordem) => String(ordem ?? '').trim()).filter((ordem) => /^\d{1,12}$/.test(ordem));
  return [...new Set(validas.map((ordem) => ordem.replace(/^0+(?=\d)/, '')))];
}

// ---------- rotas autenticadas ----------

function hoje() {
  return responder(200, {
    dataRelatorio: db.relatorio.dataRef,
    relatorio: db.relatorio,
    desatualizado: false,
    ativo: db.config.ativo,
    pausaMotivo: db.config.pausaMotivo || '',
    execucoesHoje: db.execucoes
      .filter((execucao) => execucao.status !== 'EXECUTANDO')
      .map(({ tipo, status, tentativa, erro: falha }) => ({ tipo, status, tentativa, erro: falha })),
  });
}

function relatorioMarkdown(rota) {
  const dia = rota.slice('relatorio/'.length);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dia)) return erro(400, MESSAGES.invalidDate);
  if (dia !== db.relatorio.dataRef) return erro(404, MESSAGES.noReport);
  return responder(200, db.relatorioMarkdown, 'text/markdown; charset=utf-8');
}

function receberDespacho(corpo, usuario) {
  if (!corpo.inicio || !Array.isArray(corpo.ordens)) return erro(400, MESSAGES.missingDispatch);
  if (corpo.ordens.length > LIMITE_BRUTO_ORDENS) return erro(400, 'Lista grande demais.');
  const inicio = String(corpo.inicio).slice(0, 16);
  const inicioValido = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(inicio) && !Number.isNaN(new Date(inicio).getTime());
  if (!inicioValido) return erro(400, MESSAGES.invalidStart);
  const anterior = ultimo(db.envios);
  if (anterior && minutosDesde(anterior.enviadoEm) < REGRAS.minutosEntreManuais) {
    return erro(429, MESSAGES.listTooSoon(REGRAS.minutosEntreManuais));
  }
  const ordens = normalizarOrdens(corpo.ordens);
  if (!ordens.length) return erro(400, MESSAGES.noValidOrders);
  if (ordens.length > REGRAS.maxOrdens) return erro(400, MESSAGES.tooManyOrders);
  if (new Date(inicio).getTime() > Date.now() + TOLERANCIA_FUTURO_MS) return erro(400, MESSAGES.futureStart);

  const id = Math.max(db.despachoAtual?.despacho?.id ?? 0, anterior?.id ?? 0) + 1;
  db.envios.push({
    id,
    inicio,
    ordens: ordens.length,
    usuario,
    enviadoEm: agoraIso(),
    prontoEm: Date.now() + API_CONFIG.calculoMs,
    concluido: false,
  });
  salvar();
  return responder(200, { id, ordens: ordens.length, duplicadasOuInvalidas: corpo.ordens.length - ordens.length });
}

/** Como no backend: a resposta é sempre a mesma; a análise só roda se a última manual tiver mais de 10 min. */
function executarAgora() {
  const manual = ultimo(db.execucoes.filter((execucao) => execucao.tipo === 'MANUAL'));
  const liberado = !manual || minutosDesde(manual.iniciadaEm) >= REGRAS.minutosEntreManuais;
  if (db.config.ativo && liberado) {
    db.execucoes.push({
      tipo: 'MANUAL',
      status: 'EXECUTANDO',
      tentativa: 1,
      erro: null,
      iniciadaEm: agoraIso(),
      prontoEm: Date.now() + API_CONFIG.calculoMs,
    });
    salvar();
  }
  return responder(200, { mensagem: MESSAGES.manualRequested });
}

function definirAtivo(corpo) {
  const ligar = corpo.ativo === true;
  db.config.ativo = ligar;
  if (ligar) db.config.pausaMotivo = '';
  salvar();
  return responder(200, { ativo: ligar });
}

function login(corpo) {
  const usuario = String(corpo.usuario || '').trim();
  const senha = String(corpo.senha || '').trim();
  if (!usuario || !senha) return erro(400, MESSAGES.loginRequired);
  const id = usuario.split('\\').pop().split('@')[0];
  return responder(200, { token: emitirToken(id), expires: new Date(Date.now() + REGRAS.sessaoMs).toISOString() });
}

// ---------- entrada ----------

function lerCorpo(init) {
  try {
    return JSON.parse(init.body || '{}');
  } catch {
    return {};
  }
}

/**
 * Responde uma rota do monitor como o MonitorLocal + backend responderiam. Mesma assinatura do fetch.
 * @param {string} caminho rota relativa, ex.: 'hoje', 'historico?dias=30'
 * @param {RequestInit} [init]
 * @returns {Promise<Response>}
 */
export async function servidor(caminho, init = {}) {
  const metodo = String(init.method || 'GET').toUpperCase();
  const rota = String(caminho).split('?')[0];
  const pedido = `${metodo} ${rota}`;

  if (pedido === 'GET ambiente') return responder(200, AMBIENTE);
  if (pedido === 'POST pdf') return erro(501, MESSAGES.pdfUnavailable);

  if (await simularRede()) return erro(503, MESSAGES.unavailable);
  try {
    await carregar();
  } catch (falha) {
    return erro(502, falha.message);
  }

  if (pedido === 'POST login') return login(lerCorpo(init));

  const usuario = usuarioDoToken(new Headers(init.headers).get('Authorization'));
  if (!usuario) return erro(401, MESSAGES.sessionExpired);
  concluirPendentes();

  if (pedido === 'GET hoje') return hoje();
  if (pedido === 'GET historico') return responder(200, db.historico);
  if (metodo === 'GET' && rota.startsWith('relatorio/')) return relatorioMarkdown(rota);
  if (pedido === 'GET despacho/atual') {
    return db.despachoAtual ? responder(200, db.despachoAtual) : erro(404, MESSAGES.noDispatch);
  }
  if (pedido === 'POST despacho') return receberDespacho(lerCorpo(init), usuario);
  if (pedido === 'POST executar') return executarAgora();
  if (pedido === 'POST ativo') return definirAtivo(lerCorpo(init));

  return erro(404, MESSAGES.routeNotFound);
}
