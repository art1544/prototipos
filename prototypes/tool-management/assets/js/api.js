// Camada de dados do protótipo.
//
// Simula um backend REST: carrega a base de exemplo (data/db.json), guarda as alterações no
// localStorage, aplica as regras de negócio e devolve erros padronizados (ApiError).
// Para ligar num backend real, basta reimplementar os métodos de `api` com fetch mantendo
// as mesmas assinaturas e o mesmo formato de erro; a interface não precisa mudar.

import { APP, API_CONFIG, IMAGE, LIMITS, MESSAGES } from './config.js';
import { addDaysISO, daysBetween, isValidISODate, normalize, nowISO, randomBetween, sleep, todayISO } from './utils.js';

/* ---------- errors ---------- */

// status segue a semântica HTTP (0 = sem resposta); `fields` mapeia campo → mensagem.
export class ApiError extends Error {
  constructor(message, { status = 500, code = 'INTERNAL', fields = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

const validationError = (fields) => new ApiError(MESSAGES.checkFields, { status: 422, code: 'VALIDATION', fields });

/* ---------- schema ---------- */

const TABLES = ['users', 'inspectors', 'categories', 'locations', 'toolStatuses', 'loanStatuses', 'tools', 'loans'];

// Campos de data deslocados na primeira carga (ver _meta.referenceDate em db.json).
const DATE_FIELDS = {
  tools: ['nextMaintenance', 'createdAt', 'updatedAt'],
  loans: ['loanDate', 'dueDate', 'returnedDate', 'createdAt', 'updatedAt'],
};

function assertShape(data) {
  const missing = TABLES.filter((table) => !Array.isArray(data && data[table]));
  if (missing.length) {
    throw new ApiError(`${MESSAGES.invalidData} Tabelas ausentes: ${missing.join(', ')}.`, { code: 'INVALID_DATA' });
  }
}

/* ---------- storage ---------- */

const storage = (() => {
  try {
    const key = '__tool-management-test__';
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return window.localStorage;
  } catch {
    return null;
  }
})();

// 'local' = dados persistem no navegador; 'memory' = somente até recarregar a página.
export const storageMode = storage ? 'local' : 'memory';

function readStored() {
  if (!storage) return null;
  try {
    const raw = storage.getItem(API_CONFIG.storageKey);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (saved.schemaVersion !== API_CONFIG.schemaVersion) return null;
    assertShape(saved.data);
    return saved.data;
  } catch (err) {
    console.warn('[api] Dados salvos no navegador estão inválidos; recarregando a base de exemplo.', err);
    try { storage.removeItem(API_CONFIG.storageKey); } catch { /* ignore */ }
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

function clearStored() {
  if (!storage) return;
  try { storage.removeItem(API_CONFIG.storageKey); } catch { /* ignore */ }
}

/* ---------- transport ---------- */

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
  if (!response.ok) {
    const message = response.status === 404
      ? `O arquivo de dados (${url}) não foi encontrado no servidor.`
      : `O servidor respondeu com erro (HTTP ${response.status}).`;
    throw new ApiError(message, { status: response.status, code: 'HTTP_ERROR' });
  }
  try {
    return await response.json();
  } catch {
    throw new ApiError(MESSAGES.invalidData, { code: 'INVALID_DATA' });
  }
}

// Atraso e falhas simuladas (ver API_CONFIG) para exercitar os estados de carregamento e erro.
async function simulateNetwork() {
  const { latencyMs, latencyRangeMs, failureRate } = API_CONFIG;
  const wait = latencyMs ?? randomBetween(...latencyRangeMs);
  if (wait > 0) await sleep(wait);
  if (failureRate > 0 && Math.random() < failureRate) {
    throw new ApiError(MESSAGES.unavailable, { status: 503, code: 'UNAVAILABLE' });
  }
}

/* ---------- database ---------- */

let db = null;

const clone = (value) => structuredClone(value);

function rebaseDates(seed) {
  const reference = seed._meta && seed._meta.referenceDate;
  if (!isValidISODate(reference)) return seed;
  const offset = daysBetween(reference, todayISO());
  if (!offset) return seed;

  const shifted = { ...seed };
  Object.entries(DATE_FIELDS).forEach(([table, fields]) => {
    shifted[table] = seed[table].map((row) => {
      const next = { ...row };
      fields.forEach((field) => { if (next[field]) next[field] = addDaysISO(next[field], offset); });
      return next;
    });
  });
  return shifted;
}

async function loadSeed() {
  const seed = await fetchJSON(API_CONFIG.dbUrl);
  assertShape(seed);
  const data = rebaseDates(seed);
  return Object.fromEntries(TABLES.map((table) => [table, data[table]]));
}

function saveSeed(data) {
  try {
    persist(data);
  } catch (err) {
    console.warn('[api] Não foi possível salvar a base de exemplo no navegador.', err);
  }
}

// Aplica a mutação numa cópia e só confirma se conseguir salvar (evita estado pela metade).
function commit(mutate) {
  const draft = clone(db);
  const result = mutate(draft);
  persist(draft);
  db = draft;
  return clone(result);
}

const nextId = (rows) => rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
const findByName = (rows, name) => rows.find((row) => normalize(row.name) === normalize(name));

/* ---------- domain rules ---------- */

export function deriveLoanStatus(loan, today = todayISO()) {
  if (loan.returnedDate) return 'devolvido';
  return loan.dueDate < today ? 'atrasado' : 'ativo';
}

export function normalizeToolInput(input) {
  return {
    code: String(input.code || '').trim().toUpperCase(),
    name: String(input.name || '').trim(),
    categoryName: String(input.categoryName || '').trim(),
    locationName: String(input.locationName || '').trim(),
    status: input.status,
    nextMaintenance: input.nextMaintenance || null,
    description: String(input.description || '').trim(),
    imageUrl: input.imageUrl || null,
  };
}

// Validações compartilhadas: a interface usa para feedback imediato e a API revalida.
export function validateToolInput(rawInput, data) {
  const input = normalizeToolInput(rawInput);
  const errors = {};

  if (!input.code) errors.code = MESSAGES.required;
  else if (input.code.length > LIMITS.codeMax || !/^[A-Z0-9][A-Z0-9-]*$/.test(input.code)) errors.code = MESSAGES.invalidCode;
  else if (data.tools.some((t) => t.code === input.code)) errors.code = MESSAGES.duplicateCode;

  if (!input.name) errors.name = MESSAGES.required;
  else if (input.name.length > LIMITS.nameMax) errors.name = MESSAGES.tooLong(LIMITS.nameMax);

  if (!input.categoryName) errors.categoryName = MESSAGES.required;
  else if (input.categoryName.length > LIMITS.nameMax) errors.categoryName = MESSAGES.tooLong(LIMITS.nameMax);

  if (input.locationName.length > LIMITS.nameMax) errors.locationName = MESSAGES.tooLong(LIMITS.nameMax);

  const status = data.toolStatuses.find((s) => s.id === input.status);
  if (!status || !status.selectableOnCreate) errors.status = MESSAGES.invalidStatus;

  if (input.nextMaintenance) {
    if (!isValidISODate(input.nextMaintenance)) errors.nextMaintenance = MESSAGES.invalidDate;
    else if (input.nextMaintenance < todayISO()) errors.nextMaintenance = MESSAGES.pastMaintenance;
  }

  if (input.description.length > LIMITS.textMax) errors.description = MESSAGES.tooLong(LIMITS.textMax);
  if (input.imageUrl && input.imageUrl.length > IMAGE.maxStoredChars) errors.imageUrl = MESSAGES.imageTooLarge;

  return errors;
}

export function validateLoanInput(input, data) {
  const errors = {};
  const tool = data.tools.find((t) => t.id === input.toolId);

  if (!input.toolId) errors.toolId = MESSAGES.toolRequired;
  else if (!tool || tool.status !== 'disponivel') errors.toolId = MESSAGES.toolUnavailable;

  if (!input.dueDate) errors.dueDate = MESSAGES.required;
  else if (!isValidISODate(input.dueDate)) errors.dueDate = MESSAGES.invalidDate;
  else if (input.dueDate < todayISO()) errors.dueDate = MESSAGES.pastDueDate;

  if (String(input.notes || '').length > LIMITS.textMax) errors.notes = MESSAGES.tooLong(LIMITS.textMax);

  return errors;
}

const hasErrors = (errors) => Object.keys(errors).length > 0;

/* ---------- endpoints ---------- */

export const api = {
  // GET inicial: dados salvos no navegador ou, na primeira visita, a base de exemplo.
  async load() {
    const stored = readStored();
    if (stored) {
      db = stored;
    } else {
      db = await loadSeed();
      saveSeed(db);
    }
    return clone(db);
  },

  snapshot() {
    return clone(db);
  },

  // Descarta as alterações locais e recarrega data/db.json.
  async reset() {
    const fresh = await loadSeed();
    clearStored();
    saveSeed(fresh);
    db = fresh;
    return clone(db);
  },

  // POST /tools
  async createTool(rawInput) {
    await simulateNetwork();
    const errors = validateToolInput(rawInput, db);
    if (hasErrors(errors)) throw validationError(errors);
    const input = normalizeToolInput(rawInput);

    return commit((draft) => {
      const now = nowISO();
      let category = findByName(draft.categories, input.categoryName);
      if (!category) {
        category = { id: nextId(draft.categories), name: input.categoryName };
        draft.categories.push(category);
      }
      let location = input.locationName ? findByName(draft.locations, input.locationName) : null;
      if (input.locationName && !location) {
        location = { id: nextId(draft.locations), name: input.locationName, type: 'almoxarifado' };
        draft.locations.push(location);
      }
      const tool = {
        id: nextId(draft.tools),
        code: input.code,
        name: input.name,
        description: input.description,
        categoryId: category.id,
        locationId: location ? location.id : null,
        status: input.status,
        nextMaintenance: input.nextMaintenance,
        imageUrl: input.imageUrl,
        createdBy: APP.currentUserId,
        createdAt: now,
        updatedAt: now,
      };
      draft.tools.push(tool);
      return tool;
    });
  },

  // GET /inspectors?badge=
  async findInspectorByBadge(badge) {
    const value = String(badge || '').trim();
    if (!value) throw validationError({ badge: MESSAGES.badgeRequired });
    await simulateNetwork();
    const inspector = db.inspectors.find((i) => i.badge === value);
    if (!inspector) throw new ApiError(MESSAGES.badgeNotFound, { status: 404, code: 'NOT_FOUND', fields: { badge: MESSAGES.badgeNotFound } });
    if (!inspector.active) throw new ApiError(MESSAGES.inspectorInactive, { status: 403, code: 'INACTIVE', fields: { badge: MESSAGES.inspectorInactive } });
    return clone(inspector);
  },

  // POST /inspectors/recognize (mock: devolve o primeiro inspetor com rosto cadastrado)
  async recognizeFace() {
    await simulateNetwork();
    const inspector = db.inspectors.find((i) => i.faceEnrolled && i.active);
    if (!inspector) throw new ApiError(MESSAGES.faceNotRecognized, { status: 404, code: 'NOT_RECOGNIZED' });
    return clone(inspector);
  },

  // POST /loans
  async createLoan(input) {
    await simulateNetwork();
    const inspector = db.inspectors.find((i) => i.id === input.inspectorId);
    if (!inspector || !inspector.active) {
      throw new ApiError(MESSAGES.inspectorInactive, { status: 403, code: 'INACTIVE' });
    }
    const errors = validateLoanInput(input, db);
    if (hasErrors(errors)) {
      const conflict = errors.toolId === MESSAGES.toolUnavailable;
      throw new ApiError(conflict ? MESSAGES.toolUnavailable : MESSAGES.checkFields, { status: conflict ? 409 : 422, code: conflict ? 'CONFLICT' : 'VALIDATION', fields: errors });
    }

    return commit((draft) => {
      const now = nowISO();
      const loan = {
        id: nextId(draft.loans),
        toolId: input.toolId,
        inspectorId: input.inspectorId,
        loanDate: todayISO(),
        dueDate: input.dueDate,
        returnedDate: null,
        notes: String(input.notes || '').trim(),
        createdBy: APP.currentUserId,
        receivedBy: null,
        createdAt: now,
        updatedAt: now,
      };
      draft.loans.push(loan);
      const tool = draft.tools.find((t) => t.id === input.toolId);
      Object.assign(tool, { status: 'em_uso', updatedAt: now });
      return loan;
    });
  },

  // POST /loans/:id/return
  async returnLoan(loanId) {
    await simulateNetwork();
    const loan = db.loans.find((l) => l.id === loanId);
    if (!loan) throw new ApiError(MESSAGES.loanNotFound, { status: 404, code: 'NOT_FOUND', fields: { loanId: MESSAGES.loanNotFound } });
    if (loan.returnedDate) throw new ApiError(MESSAGES.loanAlreadyReturned, { status: 409, code: 'CONFLICT', fields: { loanId: MESSAGES.loanAlreadyReturned } });

    return commit((draft) => {
      const now = nowISO();
      const target = draft.loans.find((l) => l.id === loanId);
      Object.assign(target, { returnedDate: todayISO(), receivedBy: APP.currentUserId, updatedAt: now });
      const tool = draft.tools.find((t) => t.id === target.toolId);
      if (tool && tool.status === 'em_uso') Object.assign(tool, { status: 'disponivel', updatedAt: now });
      return target;
    });
  },
};
