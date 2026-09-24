// Leitura e derivação de dados para as telas (sem efeitos colaterais).

import { APP } from './config.js';
import { state } from './store.js';
import { t } from './i18n/index.js';
import { matchesSearch } from './utils.js';
import { isLeafLocation, noteTypeRequiresOrder, progressOfOpenOrders } from './api.js';

const byDateDesc = (field) => (a, b) => String(b[field] || '').localeCompare(String(a[field] || '')) || (b.id || 0) - (a.id || 0);

export function currentUser() {
  const { users } = state.db;
  return users.find((u) => u.id === APP.currentUserId) || users[0] || null;
}

export const unreadCount = () => state.db.notifications.filter((n) => !n.read).length;

export const sortedNotifications = () => [...state.db.notifications].sort(byDateDesc('createdAt'));

export const homeProgress = () => progressOfOpenOrders(state.db);

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

export function filterOrders({ tab = 'todas', search = '' } = {}) {
  return sortedOrders().filter((o) => (tab === 'todas' || o.status === tab)
    && matchesSearch(search, [o.code, o.description, o.locationCode, locationLabel(o.locationCode)]));
}

export const orderByCode = (code) => state.db.orders.find((o) => o.code === code) || null;

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

export function eventGroups({ search = '' } = {}) {
  const groups = new Map();
  state.db.events.forEach((event) => {
    const group = groups.get(event.operation) || { operation: event.operation, total: 0, pendente: 0, erro: 0, sincronizado: 0, lastAt: '' };
    group.total += 1;
    group[event.status] = (group[event.status] || 0) + 1;
    if (event.createdAt > group.lastAt) group.lastAt = event.createdAt;
    groups.set(event.operation, group);
  });
  return [...groups.values()]
    .sort((a, b) => b.lastAt.localeCompare(a.lastAt))
    .filter((g) => matchesSearch(search, [g.operation]));
}

export function eventsOf(operation, { tab = 'todos', search = '' } = {}) {
  return state.db.events
    .filter((e) => e.operation === operation)
    .sort(byDateDesc('createdAt'))
    .filter((e) => (tab === 'todos' || e.status === tab) && matchesSearch(search, [String(e.id)]));
}

export const countEvents = (operation, status) => state.db.events.filter((e) => e.operation === operation && e.status === status).length;
