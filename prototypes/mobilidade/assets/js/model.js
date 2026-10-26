// Leitura e derivação de dados para as telas (sem efeitos colaterais).

import { APP, EVENT_STATUS_GROUP } from './config.js';
import { state } from './store.js';
import { t } from './i18n/index.js';
import { matchesSearch } from './utils.js';
import {
  activeOperation, eventGroupOf, eventStatusGroup, executionOf, isBatchBlocked, isBatchCandidate, isFinished, isLeafLocation,
  noteTypeRequiresOrder, openOperations, operationStatus, orderDisplayStatus, orderInProgress, progressOf,
} from './api.js';

const byDateDesc = (field) => (a, b) => String(b[field] || '').localeCompare(String(a[field] || '')) || (b.id || 0) - (a.id || 0);

export function currentUser() {
  const { users } = state.db;
  return users.find((u) => u.id === APP.currentUserId) || users[0] || null;
}

// Sem matrícula o app pede o "primeiro acesso" antes de liberar o Início.
export const needsRegistration = () => !currentUser().registration;

export const unreadCount = () => state.db.notifications.filter((n) => !n.read).length;

export const sortedNotifications = () => [...state.db.notifications].sort(byDateDesc('createdAt'));

/* ---------- catálogos ---------- */

export function catalogLabel(table, id) {
  const row = state.db[table].find((r) => r.id === id);
  return row ? `${row.id} - ${row.name}` : id || '';
}

export function catalogOptions(table) {
  return state.db[table].map((row) => ({ value: row.id, label: `${row.id} - ${row.name}` }));
}

export const noteTypeLabel = (id) => (id ? `${id} - ${t(`noteTypes.${id}`)}` : '');

export const requiresOrder = (typeId) => noteTypeRequiresOrder(state.db, typeId);

/* ---------- locais de instalação ---------- */

export const locationByCode = (code) => state.db.locations.find((l) => l.code === code) || null;

export function locationLabel(code) {
  const location = locationByCode(code);
  return location ? `${location.code} - ${location.description}` : code || '';
}

export const locationChildren = (parent) => state.db.locations.filter((l) => l.parent === parent);

export const isLeaf = (code) => isLeafLocation(state.db, code);

// Códigos dos ancestrais (para abrir a árvore já no local selecionado).
export function locationAncestors(code) {
  const chain = [];
  let node = locationByCode(code);
  while (node && node.parent) {
    chain.unshift(node.parent);
    node = locationByCode(node.parent);
  }
  return chain;
}

export function searchLeafLocations(query) {
  return state.db.locations.filter((l) => isLeaf(l.code) && matchesSearch(query, [l.code, l.description]));
}

/* ---------- ordens ---------- */

export const sortedOrders = () => [...state.db.orders].sort(byDateDesc('startedAt'));

// Abas: todas | pendente (não iniciadas) | andamento (inclui as pausadas) | concluida
export function filterOrders({ tab = 'todas', search = '', batch = null } = {}) {
  const base = batch && batch.active ? sortedOrders().filter(isBatchCandidate) : sortedOrders().filter((o) => tab === 'todas' || o.status === tab);
  return base.filter((o) => matchesSearch(search, [o.code, o.description, o.locationCode, locationLabel(o.locationCode)]));
}

export const orderByCode = (code) => state.db.orders.find((o) => o.code === code) || null;

export const displayStatus = (order) => orderDisplayStatus(order);

export { executionOf, isBatchBlocked, isBatchCandidate, isFinished, openOperations, operationStatus };

export function operationOf(order, number) {
  return order ? order.operations.find((op) => op.number === number) || null : null;
}

export const currentActiveOperation = () => activeOperation(state.db);

// Card "Ordem em andamento" do Início.
export function homeOrder() {
  const order = orderInProgress(state.db);
  if (!order) return null;
  const autoPaused = order.operations.find((op) => {
    const ex = executionOf(op);
    return ex.started && ex.paused && ex.autoPaused;
  }) || null;
  return { order, progress: progressOf(order), paused: orderDisplayStatus(order) === 'pausada', autoPaused };
}

// Contagem das operações por status (resumo da ordem).
export function operationSummary(order) {
  const counts = {};
  order.operations.forEach((op) => {
    const status = operationStatus(order, op);
    counts[status] = (counts[status] || 0) + 1;
  });
  return { counts, finished: counts.finalizada || 0, total: order.operations.length };
}

// Eventos da ordem por status (resumo da ordem): erros têm prioridade, depois os pendentes.
export function eventSummary(order) {
  const events = state.db.events.filter((e) => e.orderCode === order.code);
  const counts = {};
  events.forEach((e) => { counts[e.status] = (counts[e.status] || 0) + 1; });
  const errors = counts.ER || 0;
  const pending = (counts.PE || 0) + (counts.PER || 0) + (counts.LE || 0);
  return { counts, total: events.length, errors, pending };
}

export const noteById = (id) => state.db.notes.find((n) => n.id === id) || null;

export function notesByIds(ids) {
  return (ids || []).map(noteById).filter(Boolean);
}

// Inspetores que podem ser incluídos na operação (o usuário logado entra sozinho ao iniciar).
export function inspectorsAvailable(op) {
  const ex = executionOf(op);
  const user = currentUser();
  return state.db.inspectors.filter((i) => i.registration !== user.registration && !ex.people.some((p) => p.registration === i.registration));
}

/* ---------- solicitações (Ordem Comum) ---------- */

export function filterRequests({ tab = 'todas', search = '' } = {}) {
  return [...state.db.requests].sort(byDateDesc('createdAt'))
    .filter((r) => (tab === 'todas' || r.status === tab) && matchesSearch(search, [r.orderCode, String(r.id)]));
}

/* ---------- notas ---------- */

export function filterNotes({ search = '' } = {}) {
  return [...state.db.notes].sort(byDateDesc('createdAt'))
    .filter((n) => matchesSearch(search, [n.code, n.description, n.locationCode, locationLabel(n.locationCode), n.orderNumber]));
}

export const noteByCode = (code) => state.db.notes.find((n) => n.code === code) || null;

/* ---------- eventos ---------- */

const groupKey = (group) => `${group.type}:${group.code}`;

export const groupLabel = (group) => t(group.type === 'nota' ? 'events.noteGroup' : 'events.orderGroup', { code: group.code });

// Grupos (uma ordem ou uma nota) com a contagem por grupo de status.
export function eventGroups({ search = '' } = {}) {
  const groups = new Map();
  state.db.events.forEach((event) => {
    const group = eventGroupOf(event);
    const key = groupKey(group);
    const entry = groups.get(key) || { ...group, total: 0, pendente: 0, aguardando: 0, processado: 0, erro: 0, lastAt: '' };
    entry.total += 1;
    entry[eventStatusGroup(event.status)] += 1;
    if (event.createdAt > entry.lastAt) entry.lastAt = event.createdAt;
    groups.set(key, entry);
  });
  return [...groups.values()]
    .map((g) => ({ ...g, description: g.type === 'nota' ? (noteByCode(g.code) || {}).description || '' : '' }))
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt))
    .filter((g) => matchesSearch(search, [g.code, groupLabel(g), g.description]));
}

const inGroup = (event, group) => (group.type === 'nota' ? event.noteCode === group.code : event.orderCode === group.code);

// Abas: todos | pendente | aguardando (no SAP) | processado | erro
export function eventsOf(group, { tab = 'todos', search = '' } = {}) {
  return state.db.events
    .filter((e) => inGroup(e, group))
    .sort(byDateDesc('createdAt'))
    .filter((e) => (tab === 'todos' || EVENT_STATUS_GROUP[e.status] === tab) && matchesSearch(search, [String(e.id)]));
}

export const countEvents = (group, statuses) => state.db.events.filter((e) => inGroup(e, group) && statuses.includes(e.status)).length;
