/**
 * Camada de dados do protótipo: a única parte que sabe de onde vêm os dados.
 *
 *   carregarBase()       data/db.json → { sessao, dominio, usuarios, recebedores }
 *   carregarImagens(m)   { nome: caminho } → { nome: data URI } (os relatórios embutem as imagens)
 *
 * Simula a API: latência (?latencia=<ms>), falhas (?erros=<0..1>) e erros padronizados (ApiError).
 * As alterações feitas nas telas ficam em memória: recarregar volta à base. Os demais cadastros
 * de exemplo (planos, veículos, pontos…) ainda ficam nas próprias telas (assets/js/telas/).
 * Para ligar num backend real, só este arquivo muda.
 */
import { API_CONFIG, MESSAGES } from './config.js';

export class ApiError extends Error {
  constructor(message, { status = 0, code = 'erro' } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const TABELAS = ['sessao', 'dominio', 'usuarios', 'recebedores'];
const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));

async function simularRede() {
  const [min, max] = API_CONFIG.latencyRangeMs;
  await sleep(API_CONFIG.latencyMs ?? Math.round(min + Math.random() * (max - min)));
  if (Math.random() < API_CONFIG.failureRate) throw new ApiError(MESSAGES.unavailable, { status: 503, code: 'indisponivel' });
}

async function buscar(url) {
  const controle = new AbortController();
  const timer = setTimeout(() => controle.abort(), API_CONFIG.requestTimeoutMs);
  try {
    const r = await fetch(url, { signal: controle.signal, cache: 'no-cache' });
    if (!r.ok) throw new ApiError(MESSAGES.network, { status: r.status, code: 'http' });
    return r;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(e.name === 'AbortError' ? MESSAGES.timeout : MESSAGES.network, { code: e.name === 'AbortError' ? 'timeout' : 'rede' });
  } finally {
    clearTimeout(timer);
  }
}

export async function carregarBase() {
  await simularRede();
  let db;
  try {
    db = await (await buscar(API_CONFIG.dbUrl)).json();
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(MESSAGES.invalidData, { code: 'dados' });
  }
  if (!db || !db._meta || db._meta.schemaVersion !== API_CONFIG.schemaVersion) throw new ApiError(MESSAGES.schema, { code: 'versao' });
  if (!TABELAS.every((t) => t in db)) throw new ApiError(MESSAGES.invalidData, { code: 'dados' });
  return db;
}

function paraDataUri(blob) {
  return new Promise((ok, falha) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(leitor.result);
    leitor.onerror = () => falha(leitor.error);
    leitor.readAsDataURL(blob);
  });
}

export async function carregarImagens(mapa) {
  const pares = await Promise.all(Object.entries(mapa).map(async ([nome, url]) => [nome, await paraDataUri(await (await buscar(url)).blob())]));
  return Object.fromEntries(pares);
}
