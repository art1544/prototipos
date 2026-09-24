// Camada de dados do protótipo.
//
// Simula o backend (SAP/serviço do app): carrega a base de exemplo (data/db.json), guarda as
// alterações no localStorage, aplica as regras de negócio e devolve erros padronizados (ApiError).
// Para ligar num backend real, basta reimplementar os métodos de `api` com fetch mantendo as
// mesmas assinaturas e o mesmo formato de erro; a interface não precisa mudar.
//
// Mensagens são chaves de i18n (ex.: 'validation.required'); a interface traduz na exibição.

import { APP, API_CONFIG, EMERGENCY_ORDER, FAILURE_PROBABILITIES, LIMITS, MAINTENANCE_IMPACTS, PHOTO, PRIORITIES } from './config.js';
import { addDaysISO, daysBetween, isValidISO, normalize, nowISO, randomBetween, sleep, todayISO } from './utils.js';

/* ---------- errors ---------- */

// `key`/`vars` identificam a mensagem; `status` segue a semântica HTTP (0 = sem resposta);
// `fields` mapeia campo → { key, vars }.
export class ApiError extends Error {
  constructor(key, { status = 500, code = 'INTERNAL', fields = null, vars = null } = {}) {
    super(key);
    this.name = 'ApiError';
    this.key = key;
    this.vars = vars;
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export const msg = (key, vars = null) => ({ key, vars });
const hasErrors = (errors) => Object.keys(errors).length > 0;
const validationError = (fields) => new ApiError('errors.checkFields', { status: 422, code: 'VALIDATION', fields });

/* ---------- schema ---------- */

const TABLES = [
  'users', 'planningGroups', 'workCenters', 'plants', 'activityTypes', 'noteTypes', 'locations',
  'orders', 'requests', 'events', 'notes', 'notifications',
];

// Campos de data deslocados na primeira carga (ver _meta.referenceDate em db.json).
const DATE_FIELDS = {
  orders: ['startedAt', 'finishedAt', 'desiredStart', 'desiredEnd'],
  requests: ['createdAt'],
  events: ['createdAt'],
  notes: ['startAt', 'endAt', 'createdAt'],
  notifications: ['createdAt'],
};

function assertShape(data) {
  const missing = TABLES.filter((table) => !Array.isArray(data && data[table]));
  if (missing.length) {
    console.error(`[api] Tabelas ausentes em ${API_CONFIG.dbUrl}: ${missing.join(', ')}`);
    throw new ApiError('errors.invalidData', { code: 'INVALID_DATA' });
  }
}

/* ---------- storage ---------- */

const storage = (() => {
  try {
    const key = '__mobilidade-test__';
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
    throw new ApiError('errors.storageFull', { status: 507, code: 'STORAGE_FULL' });
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
    throw new ApiError(timedOut ? 'errors.timeout' : 'errors.network', { status: 0, code: timedOut ? 'TIMEOUT' : 'NETWORK' });
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) {
    if (response.status === 404) throw new ApiError('errors.dataNotFound', { status: 404, code: 'HTTP_ERROR' });
    throw new ApiError('errors.httpError', { status: response.status, code: 'HTTP_ERROR', vars: { status: response.status } });
  }
  try {
    return await response.json();
  } catch {
    throw new ApiError('errors.invalidData', { code: 'INVALID_DATA' });
  }
}

// Atraso e falhas simuladas (ver API_CONFIG) para exercitar os estados de carregamento e erro.
async function simulateNetwork() {
  const { latencyMs, latencyRangeMs, failureRate } = API_CONFIG;
  const wait = latencyMs ?? randomBetween(...latencyRangeMs);
  if (wait > 0) await sleep(wait);
  if (failureRate > 0 && Math.random() < failureRate) {
    throw new ApiError('errors.unavailable', { status: 503, code: 'UNAVAILABLE' });
  }
}

/* ---------- database ---------- */

let db = null;

const clone = (value) => structuredClone(value);

function rebaseDates(seed) {
  const reference = seed._meta && seed._meta.referenceDate;
  if (!isValidISO(reference)) return seed;
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
  return result === undefined ? undefined : clone(result);
}

const nextId = (rows) => rows.reduce((max, row) => Math.max(max, row.id || 0), 0) + 1;

function nextCode(rows, prefix, fallback) {
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  const max = rows.reduce((acc, row) => {
    const match = pattern.exec(row.code);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, fallback);
  return `${prefix}-${max + 1}`;
}

const byId = (rows, id) => rows.find((row) => row.id === id) || null;
const optionExists = (rows, id) => rows.some((row) => row.id === id);

/* ---------- domain rules ---------- */

export function isLeafLocation(data, code) {
  return data.locations.some((l) => l.code === code) && !data.locations.some((l) => l.parent === code);
}

export function noteTypeRequiresOrder(data, typeId) {
  const type = data.noteTypes.find((nt) => nt.id === typeId);
  return !!(type && type.requiresOrder);
}

// Ordens em andamento: % de operações concluídas (card "Atividades em andamento" do Início).
export function progressOfOpenOrders(data) {
  const operations = data.orders.filter((o) => o.status === 'andamento').flatMap((o) => o.operations);
  if (!operations.length) return null;
  return Math.round((operations.filter((op) => op.completed).length / operations.length) * 100);
}

function checkText(errors, field, value, { requiredKey, max }) {
  const text = String(value || '').trim();
  if (requiredKey && !text) errors[field] = msg(requiredKey);
  else if (max && text.length > max) errors[field] = msg('validation.tooLong', { max });
}

function checkPeriod(errors, startAt, endAt) {
  if (!startAt) errors.startAt = msg('validation.startDate');
  else if (!isValidISO(startAt)) errors.startAt = msg('validation.invalidDate');
  if (!endAt) errors.endAt = msg('validation.endDate');
  else if (!isValidISO(endAt)) errors.endAt = msg('validation.invalidDate');
  else if (!errors.startAt && endAt <= startAt) errors.endAt = msg('validation.endBeforeStart');
}

function checkOption(errors, field, valid) {
  if (!valid) errors[field] = msg('validation.invalidOption');
}

// Validações compartilhadas: a interface usa para feedback imediato e a API revalida.

export function validateRequestInput(input, data) {
  const errors = {};
  const code = String(input.orderCode || '').trim();
  if (!code) errors.orderCode = msg('validation.orderCodeRequired');
  else if (code.length > LIMITS.orderCodeMax || !/^[A-Za-z0-9-]+$/.test(code)) errors.orderCode = msg('validation.orderCodeInvalid', { max: LIMITS.orderCodeMax });
  else if (data.requests.some((r) => normalize(r.orderCode) === normalize(code))) errors.orderCode = msg('validation.orderCodeDuplicate');
  return errors;
}

export function validateOperationInput(input, data) {
  const errors = {};
  checkText(errors, 'description', input.description, { requiredKey: 'validation.descriptionOperation', max: LIMITS.shortTextMax });
  checkText(errors, 'longText', input.longText, { max: LIMITS.longTextMax });
  checkOption(errors, 'plantId', optionExists(data.plants, input.plantId));
  checkOption(errors, 'workCenterId', optionExists(data.workCenters, input.workCenterId));
  const people = Number(input.people);
  if (!Number.isInteger(people) || people < 1 || people > LIMITS.peopleMax) errors.people = msg('validation.people', { max: LIMITS.peopleMax });
  return errors;
}

export function validateEmergencyInput(input, data) {
  const errors = {};
  if (!input.locationCode || !data.locations.some((l) => l.code === input.locationCode)) errors.locationCode = msg('validation.location');
  checkText(errors, 'description', input.description, { requiredKey: 'validation.descriptionOrder', max: LIMITS.shortTextMax });
  checkText(errors, 'longText', input.longText, { requiredKey: 'validation.longText', max: LIMITS.longTextMax });
  checkPeriod(errors, input.startAt, input.endAt);
  checkOption(errors, 'planningGroupId', optionExists(data.planningGroups, input.planningGroupId));
  checkOption(errors, 'workCenterId', optionExists(data.workCenters, input.workCenterId));
  checkOption(errors, 'priority', PRIORITIES.includes(input.priority));
  checkOption(errors, 'plantId', optionExists(data.plants, input.plantId));
  checkOption(errors, 'activityTypeId', optionExists(data.activityTypes, input.activityTypeId));
  const operations = input.operations || [];
  if (!operations.length) errors.operations = msg('validation.operations');
  else if (operations.some((op) => hasErrors(validateOperationInput(op, data)))) errors.operations = msg('errors.checkFields');
  return errors;
}

export function validateNoteInput(input, data) {
  const errors = {};
  if (!data.noteTypes.some((nt) => nt.id === input.type)) {
    errors.type = msg('validation.noteType');
    return errors; // o restante do formulário só aparece depois do tipo
  }
  if (noteTypeRequiresOrder(data, input.type)) {
    const number = String(input.orderNumber || '').trim();
    if (!number) errors.orderNumber = msg('validation.orderNumber');
    else if (!/^\d{1,12}$/.test(number)) errors.orderNumber = msg('validation.orderNumberInvalid', { max: 12 });
  }
  if (!input.locationCode || !data.locations.some((l) => l.code === input.locationCode)) errors.locationCode = msg('validation.location');
  checkText(errors, 'description', input.description, { requiredKey: 'validation.descriptionNote', max: LIMITS.shortTextMax });
  checkText(errors, 'longText', input.longText, { requiredKey: 'validation.longText', max: LIMITS.longTextMax });
  checkPeriod(errors, input.startAt, input.endAt);
  checkOption(errors, 'planningGroupId', optionExists(data.planningGroups, input.planningGroupId));
  checkOption(errors, 'workCenterId', optionExists(data.workCenters, input.workCenterId));
  checkOption(errors, 'failureProbability', FAILURE_PROBABILITIES.includes(input.failureProbability));
  checkOption(errors, 'maintenanceImpact', MAINTENANCE_IMPACTS.includes(input.maintenanceImpact));
  checkOption(errors, 'priority', PRIORITIES.includes(input.priority));
  if ((input.photos || []).length > PHOTO.maxPerNote) errors.photos = msg('validation.photoLimit', { max: PHOTO.maxPerNote });
  return errors;
}

export function validateRegistration(value, user) {
  const errors = {};
  const text = String(value || '').trim();
  const pattern = new RegExp(`^\\d{${LIMITS.registrationMin},${LIMITS.registrationMax}}$`);
  if (!text) errors.registration = msg('validation.registrationRequired');
  else if (!pattern.test(text)) errors.registration = msg('validation.registrationInvalid', { min: LIMITS.registrationMin, max: LIMITS.registrationMax });
  else if (user && text === user.registration) errors.registration = msg('validation.registrationSame');
  return errors;
}

function requireValid(errors) {
  if (hasErrors(errors)) throw validationError(errors);
}

const trimmed = (value) => String(value || '').trim();

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

  // Exportação do banco local (card "Baixar banco de dados").
  async exportDatabase() {
    await simulateNetwork();
    return { exportedAt: nowISO(), schemaVersion: API_CONFIG.schemaVersion, data: clone(db) };
  },

  // Sincronizações sem efeito nos dados do protótipo (catálogos, locais, matrículas, ordens).
  async sync() {
    await simulateNetwork();
  },

  /* notificações (locais, sem rede) */

  markNotificationRead(id) {
    const target = byId(db.notifications, id);
    if (!target || target.read) return;
    commit((draft) => { byId(draft.notifications, id).read = true; });
  },

  markAllNotificationsRead() {
    if (!db.notifications.some((n) => !n.read)) return;
    commit((draft) => { draft.notifications.forEach((n) => { n.read = true; }); });
  },

  /* usuário */

  // PUT /me/registration
  async updateRegistration(value) {
    await simulateNetwork();
    const user = byId(db.users, APP.currentUserId);
    requireValid(validateRegistration(value, user));
    return commit((draft) => {
      const target = byId(draft.users, user.id);
      target.registration = trimmed(value);
      return target;
    });
  },

  /* solicitações (Ordem Comum) */

  // POST /requests
  async createRequest(input) {
    await simulateNetwork();
    requireValid(validateRequestInput(input, db));
    return commit((draft) => {
      const request = { id: nextId(draft.requests), orderCode: trimmed(input.orderCode), createdAt: nowISO(), status: 'pendente' };
      draft.requests.push(request);
      return request;
    });
  },

  // POST /requests/sync — as pendentes passam a sincronizadas.
  async refreshRequests() {
    await simulateNetwork();
    const pending = db.requests.filter((r) => r.status === 'pendente').length;
    if (!pending) return 0;
    commit((draft) => { draft.requests.forEach((r) => { if (r.status === 'pendente') r.status = 'sincronizada'; }); });
    return pending;
  },

  /* ordens */

  // POST /orders (Ordem de Emergência, tipo PM10)
  async createEmergencyOrder(input) {
    await simulateNetwork();
    requireValid(validateEmergencyInput(input, db));
    return commit((draft) => {
      const location = draft.locations.find((l) => l.code === input.locationCode);
      const order = {
        id: nextId(draft.orders),
        code: nextCode(draft.orders, 'OS', 58000),
        type: EMERGENCY_ORDER.type,
        description: trimmed(input.description),
        longText: trimmed(input.longText),
        priority: input.priority,
        status: 'andamento',
        locationCode: input.locationCode,
        workCenterId: input.workCenterId,
        plantId: input.plantId,
        planningGroupId: input.planningGroupId,
        activityTypeId: input.activityTypeId,
        startedAt: input.startAt,
        finishedAt: null,
        desiredStart: input.startAt.slice(0, 10),
        desiredEnd: input.endAt.slice(0, 10),
        systemStatus: 'CRTD',
        userStatus: '',
        headerText: trimmed(input.description),
        operations: input.operations.map((op) => ({
          number: op.number,
          title: trimmed(op.description).toUpperCase(),
          longText: trimmed(op.longText),
          code: input.locationCode,
          equipment: location ? location.description : '',
          workCenter: op.workCenterId,
          plantId: op.plantId,
          people: Number(op.people),
          duration: null,
          released: false,
          completed: false,
        })),
        documents: [],
      };
      draft.orders.push(order);
      return order;
    });
  },

  // DELETE /orders/:id/documents/:documentId
  async deleteDocument(orderId, documentId) {
    await simulateNetwork();
    const order = byId(db.orders, orderId);
    if (!order) throw new ApiError('validation.orderNotFound', { status: 404, code: 'NOT_FOUND' });
    if (!byId(order.documents, documentId)) throw new ApiError('validation.documentNotFound', { status: 404, code: 'NOT_FOUND' });
    commit((draft) => {
      const target = byId(draft.orders, orderId);
      target.documents = target.documents.filter((d) => d.id !== documentId);
    });
  },

  /* notas */

  // POST /notes
  async createNote(input) {
    await simulateNetwork();
    requireValid(validateNoteInput(input, db));
    return commit((draft) => {
      const now = nowISO();
      const note = {
        id: nextId(draft.notes),
        code: nextCode(draft.notes, 'NT', 1000),
        type: input.type,
        orderNumber: noteTypeRequiresOrder(draft, input.type) ? trimmed(input.orderNumber) : '',
        locationCode: input.locationCode,
        description: trimmed(input.description),
        longText: trimmed(input.longText),
        startAt: input.startAt,
        endAt: input.endAt,
        planningGroupId: input.planningGroupId,
        workCenterId: input.workCenterId,
        failureProbability: input.failureProbability,
        maintenanceImpact: input.maintenanceImpact,
        priority: input.priority,
        photos: (input.photos || []).slice(),
        createdAt: now,
      };
      draft.notes.push(note);
      return note;
    });
  },

  /* eventos (fila de sincronização com o SAP) */

  // POST /events/sync?operation= — pendentes viram sincronizados.
  async syncEvents(operation) {
    await simulateNetwork();
    const count = db.events.filter((e) => e.operation === operation && e.status === 'pendente').length;
    if (!count) return 0;
    commit((draft) => { draft.events.forEach((e) => { if (e.operation === operation && e.status === 'pendente') e.status = 'sincronizado'; }); });
    return count;
  },

  // POST /events/reprocess?operation= — eventos com erro são reenviados.
  async reprocessEvents(operation) {
    await simulateNetwork();
    const count = db.events.filter((e) => e.operation === operation && e.status === 'erro').length;
    if (!count) return 0;
    commit((draft) => { draft.events.forEach((e) => { if (e.operation === operation && e.status === 'erro') e.status = 'sincronizado'; }); });
    return count;
  },

  // POST /events/:id/reprocess
  async reprocessEvent(id) {
    await simulateNetwork();
    const event = byId(db.events, id);
    if (!event) throw new ApiError('validation.eventNotFound', { status: 404, code: 'NOT_FOUND' });
    if (event.status !== 'erro') return;
    commit((draft) => { byId(draft.events, id).status = 'sincronizado'; });
  },
};
