// Camada de dados do protótipo.
//
// Simula o backend (SAP/serviço do app): carrega a base de exemplo (data/db.json), guarda as
// alterações no localStorage, aplica as regras de negócio e devolve erros padronizados (ApiError).
// Para ligar num backend real, basta reimplementar os métodos de `api` com fetch mantendo as
// mesmas assinaturas e o mesmo formato de erro; a interface não precisa mudar.
//
// Mensagens são chaves de i18n (ex.: 'validation.required'); a interface traduz na exibição.

import {
  APP, API_CONFIG, DEVIATION_REASONS, EMERGENCY_ORDER, EVENT_STATUS_GROUP, EXECUTION, FAILURE_PROBABILITIES, LIMITS,
  MAINTENANCE_IMPACTS, PHOTO, PRIORITIES,
} from './config.js';
import { addDaysISO, addHoursISO, daysBetween, isValidISO, normalize, nowISO, randomBetween, sleep, todayISO } from './utils.js';

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
const conflict = (key, vars = null) => new ApiError(key, { status: 409, code: 'CONFLICT', vars });
const notFound = (key) => new ApiError(key, { status: 404, code: 'NOT_FOUND' });

/* ---------- schema ---------- */

const TABLES = [
  'users', 'inspectors', 'planningGroups', 'workCenters', 'plants', 'activityTypes', 'noteTypes', 'locations',
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

// Datas dentro das ordens (documentos, confirmações de tempo, histórico dos pontos de medida).
function shiftOrder(order, shift) {
  return {
    ...order,
    documents: order.documents.map((d) => ({ ...d, createdAt: shift(d.createdAt) })),
    operations: order.operations.map((op) => {
      const next = { ...op };
      if (op.execution) {
        next.execution = {
          ...op.execution,
          confirmations: op.execution.confirmations.map((c) => ({ ...c, start: shift(c.start), end: shift(c.end) })),
        };
      }
      if (op.info) {
        next.info = {
          ...op.info,
          safety: op.info.safety ? { ...op.info.safety, createdAt: shift(op.info.safety.createdAt) } : null,
          points: op.info.points.map((p) => ({ ...p, history: (p.history || []).map(([date, value]) => [shift(date), value]) })),
        };
      }
      return next;
    }),
  };
}

function rebaseDates(seed) {
  const reference = seed._meta && seed._meta.referenceDate;
  if (!isValidISO(reference)) return seed;
  const offset = daysBetween(reference, todayISO());
  if (!offset) return seed;
  const shift = (value) => (value ? addDaysISO(value, offset) : value);

  const shifted = { ...seed };
  Object.entries(DATE_FIELDS).forEach(([table, fields]) => {
    shifted[table] = seed[table].map((row) => {
      const next = { ...row };
      fields.forEach((field) => { next[field] = shift(next[field]); });
      return next;
    });
  });
  shifted.orders = shifted.orders.map((order) => shiftOrder(order, shift));
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
const currentUserOf = (data) => byId(data.users, APP.currentUserId);

/* ---------- domain rules ---------- */

export function isLeafLocation(data, code) {
  return data.locations.some((l) => l.code === code) && !data.locations.some((l) => l.parent === code);
}

export function noteTypeRequiresOrder(data, typeId) {
  const type = data.noteTypes.find((nt) => nt.id === typeId);
  return !!(type && type.requiresOrder);
}

/* execução das operações */

const EMPTY_EXECUTION = Object.freeze({
  started: false, paused: false, autoPaused: false, finished: false, deviationReason: null, deviationText: '',
  people: [], confirmations: [], attachments: [], noteIds: [],
});

// Estado de execução da operação (operações nunca iniciadas não têm o objeto gravado).
export const executionOf = (op) => ({ ...EMPTY_EXECUTION, ...(op.execution || {}) });

function ensureExecution(op) {
  if (!op.execution) op.execution = clone(EMPTY_EXECUTION);
  return op.execution;
}

export const isFinished = (op) => !!(op.execution && op.execution.finished);
export const isRunning = (op) => !!(op.execution && op.execution.started);

// Ordens sequenciais (PM02 com atividade INM ou sem atividade): só a primeira operação
// não finalizada fica liberada; ao finalizá-la, libera a próxima.
export function isSequential(order) {
  const { orderType, activityTypes } = EXECUTION.sequential;
  return order.type === orderType && (!order.activityTypeId || activityTypes.includes(order.activityTypeId));
}

// liberada | bloqueada | andamento | pausada | finalizada
export function operationStatus(order, op) {
  const ex = executionOf(op);
  if (order.status === 'concluida' || ex.finished) return 'finalizada';
  if (ex.started && ex.paused) return 'pausada';
  if (ex.started) return 'andamento';
  if (isSequential(order)) {
    const first = order.operations.find((x) => !isFinished(x));
    return first === op ? 'liberada' : 'bloqueada';
  }
  return 'liberada';
}

// Status exibido: a ordem em andamento com operação pausada aparece como "pausada".
export function orderDisplayStatus(order) {
  if (order.status === 'andamento' && order.operations.some((op) => isRunning(op) && op.execution.paused)) return 'pausada';
  return order.status;
}

// Só uma operação pode estar iniciada (em andamento ou pausada) por vez em todo o aparelho.
export function activeOperation(data) {
  for (const order of data.orders) {
    const op = order.operations.find(isRunning);
    if (op) return { order, op };
  }
  return null;
}

// Pontos de medida da operação que ainda não têm leitura.
export function missingReadings(op) {
  return ((op.info && op.info.points) || []).filter((p) => p.value === null || p.value === undefined || p.value === '');
}

export function openOperations(order, except = null) {
  return order.operations.filter((op) => op !== except && !isFinished(op));
}

// Ordem em andamento (só uma por vez) e % de operações finalizadas dela, para o card do Início.
export function orderInProgress(data) {
  return data.orders.find((o) => o.status === 'andamento') || null;
}

export function progressOf(order) {
  if (!order || !order.operations.length) return 0;
  return Math.round((order.operations.filter(isFinished).length / order.operations.length) * 100);
}

/* encerramento em lote */

// Ordens que podem ser concluídas em lote: não iniciadas no SAP (I0002); PM10 só com aviso vinculado.
export const isBatchCandidate = (order) => order.sapStatus === 'I0002' && order.status !== 'concluida' && (order.type !== EMERGENCY_ORDER.type || order.linkedNotice);

// Não pode ser selecionada com operação iniciada ou eventos ainda não sincronizados.
export const isBatchBlocked = (order) => !!order.unsyncedEvents || order.operations.some(isRunning);

/* eventos */

export const eventGroupOf = (event) => (event.noteCode ? { type: 'nota', code: event.noteCode } : { type: 'ordem', code: event.orderCode });
const inGroup = (event, group) => (group.type === 'nota' ? event.noteCode === group.code : event.orderCode === group.code);
export const eventStatusGroup = (status) => EVENT_STATUS_GROUP[status] || 'erro';

// Pausa automática: operação ativa (não pausada) há mais de EXECUTION.autoPauseHours horas.
function autoPause(data, now = nowISO()) {
  let changed = false;
  data.orders.forEach((order) => {
    order.operations.forEach((op) => {
      const ex = op.execution;
      if (!ex || !ex.started || ex.paused || ex.finished) return;
      const open = ex.confirmations.filter((c) => !c.end);
      const limit = open.map((c) => addHoursISO(c.start, EXECUTION.autoPauseHours)).sort()[0];
      if (!limit || limit > now) return;
      open.forEach((c) => { c.end = addHoursISO(c.start, EXECUTION.autoPauseHours); c.reason = 'auto6h'; });
      Object.assign(ex, { paused: true, autoPaused: true, deviationReason: 'auto6h' });
      order.sapStatus = 'I0010';
      changed = true;
    });
  });
  return changed;
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

export function validateLogin(input) {
  const errors = {};
  if (!String(input.username || '').trim()) errors.username = msg('login.userRequired');
  if (!String(input.password || '')) errors.password = msg('login.passwordRequired');
  return errors;
}

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
  if (!text) errors.registration = msg(user && user.registration ? 'validation.registrationRequired' : 'validation.registrationFirst');
  else if (!pattern.test(text)) errors.registration = msg('validation.registrationInvalid', { min: LIMITS.registrationMin, max: LIMITS.registrationMax });
  else if (user && user.registration && text === user.registration) errors.registration = msg('validation.registrationSame');
  return errors;
}

// Registro de desvio: motivo e detalhe obrigatórios; com outras operações abertas na ordem,
// ao menos uma operação adicional precisa ser marcada.
export function validateDeviation(input, { needsExtraOps = false } = {}) {
  const errors = {};
  if (!DEVIATION_REASONS.includes(input.reason)) errors.reason = msg('deviation.reasonRequired');
  if (!String(input.text || '').trim()) errors.text = msg('deviation.textRequired');
  else if (String(input.text).trim().length > LIMITS.longTextMax) errors.text = msg('validation.tooLong', { max: LIMITS.longTextMax });
  if (needsExtraOps && !(input.extraOps || []).length) errors.extraOps = msg('deviation.extraOpsRequired');
  return errors;
}

function requireValid(errors) {
  if (hasErrors(errors)) throw validationError(errors);
}

const trimmed = (value) => String(value || '').trim();

/* ---------- auxiliares das operações ---------- */

function findOrder(data, code) {
  const order = data.orders.find((o) => o.code === code);
  if (!order) throw notFound('validation.orderNotFound');
  return order;
}

function findOperation(order, number) {
  const op = order.operations.find((x) => x.number === number);
  if (!op) throw notFound('validation.operationNotFound');
  return op;
}

function requireRunning(op) {
  if (!isRunning(op)) throw conflict('execution.startFirst');
}

function openConfirmations(ex, now) {
  ex.people.forEach((p) => ex.confirmations.push({ registration: p.registration, name: p.name, start: now, end: null, reason: null }));
}

function closeConfirmations(ex, now, reason) {
  ex.confirmations.forEach((c) => {
    if (c.end) return;
    c.end = now;
    c.reason = reason || null;
  });
}

function pushEvent(draft, event) {
  draft.events.push({ id: nextId(draft.events), noteCode: null, orderCode: null, operation: null, category: null, categoryText: null, createdAt: nowISO(), status: 'PE', ...event });
}

function finishOrder(order, now) {
  Object.assign(order, { status: 'concluida', sapStatus: 'I0045', systemStatus: 'TECO CNPA', finishedAt: now });
}

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
    if (autoPause(db)) saveSeed(db);
    return clone(db);
  },

  snapshot() {
    return clone(db);
  },

  // Descarta as alterações locais e recarrega data/db.json.
  async reset() {
    const fresh = await loadSeed();
    clearStored();
    autoPause(fresh);
    saveSeed(fresh);
    db = fresh;
    return clone(db);
  },

  // Verifica a pausa automática (chamado periodicamente pela interface). true se algo mudou.
  checkAutoPause() {
    const draft = clone(db);
    if (!autoPause(draft)) return false;
    persist(draft);
    db = draft;
    return true;
  },

  // Exportação do banco local (card "Baixar banco de dados").
  async exportDatabase() {
    await simulateNetwork();
    return { exportedAt: nowISO(), schemaVersion: API_CONFIG.schemaVersion, data: clone(db) };
  },

  // Sincronizações sem efeito nos dados do protótipo (catálogos, locais, matrículas, ordens, documentos).
  async sync() {
    await simulateNetwork();
  },

  /* sessão */

  // POST /auth/login (mock: qualquer usuário e senha preenchidos entram como o usuário atual)
  async login(input) {
    requireValid(validateLogin(input));
    await simulateNetwork();
    return clone(currentUserOf(db));
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

  // PUT /me/registration (também usado no primeiro acesso, quando a matrícula ainda está vazia)
  async updateRegistration(value) {
    await simulateNetwork();
    const user = currentUserOf(db);
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

  // POST /orders (Ordem de Emergência, tipo PM10). Nasce não iniciada (I0002).
  async createEmergencyOrder(input) {
    await simulateNetwork();
    requireValid(validateEmergencyInput(input, db));
    return commit((draft) => {
      const location = draft.locations.find((l) => l.code === input.locationCode);
      const order = {
        id: nextId(draft.orders),
        code: nextCode(draft.orders, 'OS', 58000),
        type: EMERGENCY_ORDER.type,
        sapStatus: 'I0002',
        linkedNotice: false,
        unsyncedEvents: false,
        description: trimmed(input.description),
        longText: trimmed(input.longText),
        priority: input.priority,
        status: 'pendente',
        locationCode: input.locationCode,
        workCenterId: input.workCenterId,
        plantId: input.plantId,
        planningGroupId: input.planningGroupId,
        activityTypeId: input.activityTypeId,
        startedAt: input.startAt,
        finishedAt: null,
        desiredStart: input.startAt.slice(0, 10),
        desiredEnd: input.endAt.slice(0, 10),
        systemStatus: 'LIB CNPA',
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
          duration: '1.0',
        })),
        documents: [],
      };
      draft.orders.push(order);
      return order;
    });
  },

  // POST /orders/:code/close — encerramento técnico (I0045 + evento CTEC).
  async closeOrder(code) {
    await simulateNetwork();
    const order = findOrder(db, code);
    if (order.status === 'concluida') throw conflict('execution.orderClosed');
    if (openOperations(order).length) throw conflict('execution.openOperations');
    return commit((draft) => {
      const target = findOrder(draft, code);
      finishOrder(target, nowISO());
      return target;
    });
  },

  // POST /orders/close — "Concluir todas ordens": confirmação final das operações abertas (CRNT),
  // I0002 → I0045 e evento CTEC para cada ordem selecionada.
  async closeOrders(codes, deviation = null) {
    await simulateNetwork();
    if (!codes.length) throw conflict('batch.empty');
    const orders = codes.map((code) => findOrder(db, code));
    if (orders.some((o) => !isBatchCandidate(o) || isBatchBlocked(o))) throw conflict('batch.blocked');
    const needsDeviation = orders.some((o) => openOperations(o).length);
    if (needsDeviation) requireValid(validateDeviation(deviation || {}));
    return commit((draft) => {
      const now = nowISO();
      codes.forEach((code) => {
        const order = findOrder(draft, code);
        openOperations(order).forEach((op) => {
          Object.assign(ensureExecution(op), { started: false, paused: false, autoPaused: false, finished: true, deviationReason: deviation ? deviation.reason : null, deviationText: deviation ? trimmed(deviation.text) : '' });
        });
        finishOrder(order, now);
      });
      return codes.length;
    });
  },

  /* execução das operações */

  // POST /orders/:code/operations/:number/start
  async startOperation(code, number) {
    await simulateNetwork();
    const order = findOrder(db, code);
    const op = findOperation(order, number);
    const user = currentUserOf(db);
    const status = operationStatus(order, op);
    if (status === 'finalizada') throw conflict('execution.alreadyFinished');
    if (status === 'bloqueada') throw conflict('execution.blockedLock');
    const active = activeOperation(db);
    if (active) throw conflict('execution.anotherActive', { op: active.op.number, order: active.order.code });
    if (!user.registration) throw conflict('execution.registrationMissing');

    return commit((draft) => {
      const target = findOrder(draft, code);
      const ex = ensureExecution(findOperation(target, number));
      const now = nowISO();
      Object.assign(ex, { started: true, paused: false, autoPaused: false });
      // O inspetor logado entra na operação; todos (logado + adicionados) passam a ter o tempo contado.
      if (!ex.people.some((p) => p.registration === user.registration)) ex.people.unshift({ registration: user.registration, name: user.name });
      openConfirmations(ex, now);
      if (target.status === 'pendente') target.status = 'andamento';
      return ex;
    });
  },

  // POST …/pause — sempre com registro de desvio; a ordem fica confirmada parcialmente (I0010).
  async pauseOperation(code, number, deviation) {
    await simulateNetwork();
    const order = findOrder(db, code);
    const op = findOperation(order, number);
    requireRunning(op);
    if (op.execution.paused) return undefined;
    requireValid(validateDeviation(deviation, { needsExtraOps: openOperations(order, op).length > 0 }));

    return commit((draft) => {
      const target = findOrder(draft, code);
      const ex = ensureExecution(findOperation(target, number));
      closeConfirmations(ex, nowISO(), deviation.reason);
      Object.assign(ex, { paused: true, autoPaused: false, deviationReason: deviation.reason, deviationText: trimmed(deviation.text) });
      (deviation.extraOps || []).forEach((n) => {
        const extra = target.operations.find((x) => x.number === n);
        if (extra) Object.assign(ensureExecution(extra), { deviationReason: deviation.reason, deviationText: trimmed(deviation.text) });
      });
      target.sapStatus = 'I0010';
      return ex;
    });
  },

  // POST …/resume — reabre a contagem de tempo de cada pessoa da operação.
  async resumeOperation(code, number) {
    await simulateNetwork();
    const op = findOperation(findOrder(db, code), number);
    requireRunning(op);
    if (!op.execution.paused) return undefined;
    return commit((draft) => {
      const ex = ensureExecution(findOperation(findOrder(draft, code), number));
      Object.assign(ex, { paused: false, autoPaused: false });
      openConfirmations(ex, nowISO());
      return ex;
    });
  },

  // POST …/stop — confirmação final. Ponto de medida sem leitura exige registro de desvio.
  // Devolve quantas operações continuam abertas (sem nenhuma, a interface oferece encerrar a ordem).
  async stopOperation(code, number, deviation = null) {
    await simulateNetwork();
    const order = findOrder(db, code);
    const op = findOperation(order, number);
    requireRunning(op);
    if (missingReadings(op).length) requireValid(validateDeviation(deviation || {}, { needsExtraOps: openOperations(order, op).length > 0 }));

    return commit((draft) => {
      const target = findOrder(draft, code);
      const targetOp = findOperation(target, number);
      const ex = ensureExecution(targetOp);
      closeConfirmations(ex, nowISO(), deviation ? deviation.reason : null);
      Object.assign(ex, {
        started: false, paused: false, autoPaused: false, finished: true,
        deviationReason: deviation ? deviation.reason : null, deviationText: deviation ? trimmed(deviation.text) : '',
      });
      (deviation && deviation.extraOps ? deviation.extraOps : []).forEach((n) => {
        const extra = target.operations.find((x) => x.number === n);
        if (extra) Object.assign(ensureExecution(extra), { deviationReason: deviation.reason, deviationText: trimmed(deviation.text) });
      });
      const remaining = openOperations(target, targetOp).length;
      if (remaining) target.sapStatus = 'I0010';
      return { remaining };
    });
  },

  // POST …/reverse — estorno da confirmação final (as notas criadas na operação permanecem).
  async reverseOperation(code, number) {
    await simulateNetwork();
    const order = findOrder(db, code);
    const op = findOperation(order, number);
    if (order.status === 'concluida') throw conflict('execution.orderClosed');
    if (!isFinished(op)) return undefined;
    return commit((draft) => {
      const ex = ensureExecution(findOperation(findOrder(draft, code), number));
      ex.finished = false;
      return ex;
    });
  },

  // POST …/people — inclui inspetores na operação e, opcionalmente, em outras operações abertas.
  async addPeople(code, numbers, registrations) {
    await simulateNetwork();
    if (!registrations.length) throw conflict('people.empty');
    const order = findOrder(db, code);
    numbers.forEach((n) => findOperation(order, n));
    const people = registrations.map((reg) => db.inspectors.find((i) => i.registration === reg)).filter(Boolean);
    if (people.length !== registrations.length) throw notFound('people.notFound');

    return commit((draft) => {
      const target = findOrder(draft, code);
      const now = nowISO();
      numbers.forEach((n) => {
        const ex = ensureExecution(findOperation(target, n));
        people.forEach((p) => {
          if (ex.people.some((x) => x.registration === p.registration)) return;
          ex.people.push({ registration: p.registration, name: p.name });
          // Operação em execução: o tempo do novo inspetor passa a contar agora.
          if (ex.started && !ex.paused) ex.confirmations.push({ registration: p.registration, name: p.name, start: now, end: null, reason: null });
        });
      });
      return people.length;
    });
  },

  // POST …/attachments — imagens da galeria ou foto da câmera (a foto gera evento para o SAP).
  async addAttachments(code, number, files) {
    await simulateNetwork();
    const order = findOrder(db, code);
    requireRunning(findOperation(order, number));
    const user = currentUserOf(db);
    return commit((draft) => {
      const target = findOrder(draft, code);
      const ex = ensureExecution(findOperation(target, number));
      files.forEach((file) => {
        ex.attachments.push({ id: nextId(ex.attachments), name: trimmed(file.name) || 'Foto', kind: file.kind, author: user.registration, dataUrl: file.dataUrl, createdAt: nowISO() });
        if (file.kind === 'foto') pushEvent(draft, { orderCode: code, operation: number, kind: 'anexo_operacao', categoryText: trimmed(file.name) });
      });
      return ex.attachments.length;
    });
  },

  // DELETE …/attachments/:id — só quem anexou pode excluir.
  async deleteAttachment(code, number, id) {
    await simulateNetwork();
    const op = findOperation(findOrder(db, code), number);
    const attachment = executionOf(op).attachments.find((a) => a.id === id);
    if (!attachment) throw notFound('attachments.notFound');
    if (attachment.author !== currentUserOf(db).registration) throw new ApiError('attachments.notAuthor', { status: 403, code: 'FORBIDDEN' });
    commit((draft) => {
      const ex = ensureExecution(findOperation(findOrder(draft, code), number));
      ex.attachments = ex.attachments.filter((a) => a.id !== id);
    });
  },

  // Leitura de um ponto de medida (gravada no aparelho, sem rede). Só com a operação em execução.
  setPointValue(code, number, index, value) {
    const op = findOperation(findOrder(db, code), number);
    requireRunning(op);
    const point = op.info && op.info.points[index];
    if (!point) throw notFound('validation.pointNotFound');
    commit((draft) => {
      findOperation(findOrder(draft, code), number).info.points[index].value = value;
    });
  },

  /* notas */

  // POST /notes. `link` (opcional) vincula a nota à operação e à etapa do carrossel de onde foi criada;
  // notas avulsas geram o evento "Nova Nota" para o SAP.
  async createNote(input, link = null) {
    await simulateNetwork();
    requireValid(validateNoteInput(input, db));
    if (link) findOperation(findOrder(db, link.orderCode), link.operation);
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
      if (link) {
        const op = findOperation(findOrder(draft, link.orderCode), link.operation);
        ensureExecution(op).noteIds.push(note.id);
        const point = Number.isInteger(link.point) && op.info ? op.info.points[link.point] : null;
        if (point) (point.noteIds = point.noteIds || []).push(note.id);
      } else {
        pushEvent(draft, { noteCode: note.code, kind: 'nova_nota' });
      }
      return note;
    });
  },

  // PUT /notes/:code — tipo e número da ordem não mudam depois de criada.
  async updateNote(code, input) {
    await simulateNetwork();
    const note = db.notes.find((n) => n.code === code);
    if (!note) throw notFound('notes.notFound');
    const full = { ...input, type: note.type, orderNumber: note.orderNumber };
    requireValid(validateNoteInput(full, db));
    return commit((draft) => {
      const target = draft.notes.find((n) => n.code === code);
      Object.assign(target, {
        locationCode: full.locationCode,
        description: trimmed(full.description),
        longText: trimmed(full.longText),
        startAt: full.startAt,
        endAt: full.endAt,
        planningGroupId: full.planningGroupId,
        workCenterId: full.workCenterId,
        failureProbability: full.failureProbability,
        maintenanceImpact: full.maintenanceImpact,
        priority: full.priority,
        photos: (full.photos || []).slice(),
        updatedAt: nowISO(),
      });
      return target;
    });
  },

  /* eventos (fila de sincronização com o SAP) */

  // POST /events/sync — o que já estava no SAP volta processado (LE → PR) e o que estava no
  // aparelho sai para o SAP (PE/PER → LE).
  async syncEvents(group) {
    await simulateNetwork();
    const count = db.events.filter((e) => inGroup(e, group) && ['PE', 'PER', 'LE'].includes(e.status)).length;
    if (!count) return 0;
    commit((draft) => {
      draft.events.forEach((e) => {
        if (!inGroup(e, group)) return;
        if (e.status === 'LE') e.status = 'PR';
        else if (e.status === 'PE' || e.status === 'PER') e.status = 'LE';
      });
    });
    return count;
  },

  // POST /events/reprocess — eventos com erro voltam para a fila do aparelho (ER → PER).
  async reprocessEvents(group) {
    await simulateNetwork();
    const count = db.events.filter((e) => inGroup(e, group) && e.status === 'ER').length;
    if (!count) return 0;
    commit((draft) => { draft.events.forEach((e) => { if (inGroup(e, group) && e.status === 'ER') e.status = 'PER'; }); });
    return count;
  },

  // POST /events/:id/reprocess
  async reprocessEvent(id) {
    await simulateNetwork();
    const event = byId(db.events, id);
    if (!event) throw notFound('validation.eventNotFound');
    if (event.status !== 'ER') return;
    commit((draft) => { byId(draft.events, id).status = 'PER'; });
  },
};
