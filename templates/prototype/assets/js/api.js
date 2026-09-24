// Camada de dados do protótipo: simula a API REST sobre data/db.json + localStorage.
// Para ligar num backend real, reimplemente os métodos de `api` com fetch mantendo as
// assinaturas e o formato de erro (ApiError); a interface não muda.

import { API_CONFIG, MESSAGES } from './config.js';
import { nowISO, randomBetween, sleep } from './utils.js';

export class ApiError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL', fields = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const TABLES = ['items'];
const TITLE_MAX = 120;

function assertShape(data) {
  const missing = TABLES.filter((table) => !Array.isArray(data && data[table]));
  if (missing.length) throw new ApiError(`${MESSAGES.invalidData} Tabelas ausentes: ${missing.join(', ')}.`, { code: 'INVALID_DATA' });
}

/* ---------- armazenamento ---------- */

const storage = (() => {
  try {
    window.localStorage.setItem('__test__', '1');
    window.localStorage.removeItem('__test__');
    return window.localStorage;
  } catch {
    return null;
  }
})();

function readStored() {
  if (!storage) return null;
  try {
    const saved = JSON.parse(storage.getItem(API_CONFIG.storageKey) || 'null');
    if (!saved || saved.schemaVersion !== API_CONFIG.schemaVersion) return null;
    assertShape(saved.data);
    return saved.data;
  } catch {
    return null;
  }
}

function persist(data) {
  if (!storage) return;
  try {
    storage.setItem(API_CONFIG.storageKey, JSON.stringify({ schemaVersion: API_CONFIG.schemaVersion, savedAt: nowISO(), data }));
  } catch {
    throw new ApiError(MESSAGES.storageFull, { status: 507, code: 'STORAGE_FULL' });
  }
}

/* ---------- transporte ---------- */

async function fetchJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_CONFIG.requestTimeoutMs);
  let response;
  try {
    response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
  } catch (err) {
    const timedOut = err.name === 'AbortError';
    throw new ApiError(timedOut ? MESSAGES.timeout : MESSAGES.network, { status: 0, code: timedOut ? 'TIMEOUT' : 'NETWORK' });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) throw new ApiError(`O servidor respondeu com erro (HTTP ${response.status}).`, { status: response.status, code: 'HTTP_ERROR' });
  try {
    return await response.json();
  } catch {
    throw new ApiError(MESSAGES.invalidData, { code: 'INVALID_DATA' });
  }
}

async function simulateNetwork() {
  const { latencyMs, latencyRangeMs, failureRate } = API_CONFIG;
  const wait = latencyMs ?? randomBetween(...latencyRangeMs);
  if (wait > 0) await sleep(wait);
  if (failureRate > 0 && Math.random() < failureRate) throw new ApiError(MESSAGES.unavailable, { status: 503, code: 'UNAVAILABLE' });
}

/* ---------- banco ---------- */

let db = null;
const clone = (value) => structuredClone(value);
const nextId = (rows) => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;

async function loadSeed() {
  const seed = await fetchJSON(API_CONFIG.dbUrl);
  assertShape(seed);
  return Object.fromEntries(TABLES.map((table) => [table, seed[table]]));
}

// Aplica a mutação numa cópia e só confirma se conseguir salvar.
function commit(mutate) {
  const draft = clone(db);
  const result = mutate(draft);
  persist(draft);
  db = draft;
  return clone(result);
}

/* ---------- regras ---------- */

export function validateItemInput(input) {
  const errors = {};
  const title = String(input.title || '').trim();
  if (!title) errors.title = MESSAGES.required;
  else if (title.length > TITLE_MAX) errors.title = MESSAGES.tooLong(TITLE_MAX);
  return errors;
}

/* ---------- endpoints ---------- */

export const api = {
  async load() {
    db = readStored() || await loadSeed();
    try { persist(db); } catch { /* segue em memória */ }
    return clone(db);
  },

  snapshot() {
    return clone(db);
  },

  async reset() {
    db = await loadSeed();
    persist(db);
    return clone(db);
  },

  // POST /items
  async createItem(input) {
    await simulateNetwork();
    const errors = validateItemInput(input);
    if (Object.keys(errors).length) throw new ApiError(MESSAGES.checkFields, { status: 422, code: 'VALIDATION', fields: errors });
    return commit((draft) => {
      const item = { id: nextId(draft.items), title: String(input.title).trim(), createdAt: nowISO() };
      draft.items.push(item);
      return item;
    });
  },
};
