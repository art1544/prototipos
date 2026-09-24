// Tradução e formatação por idioma. Chaves em notação de ponto: t('orders.title').

import { LOCALE } from '../config.js';
import { esc, parseISO, todayISO, addDaysISO } from '../utils.js';
import pt from './pt.js';
import en from './en.js';
import es from './es.js';

const DICTIONARIES = { pt, en, es };

let current = LOCALE.default;
const warned = new Set();

function lookup(dict, key) {
  return key.split('.').reduce((node, part) => (node && typeof node === 'object' ? node[part] : undefined), dict);
}

function interpolate(text, vars) {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in vars ? String(vars[name]) : match));
}

// Plural: com vars.count, usa a variante `chave_one` quando a regra do idioma pede singular.
function pluralKey(key, vars) {
  if (!vars || typeof vars.count !== 'number') return key;
  const form = new Intl.PluralRules(localeTag()).select(vars.count);
  return form === 'one' && typeof lookup(DICTIONARIES[current], `${key}_one`) === 'string' ? `${key}_one` : key;
}

// Texto puro (sem HTML). Faltando no idioma atual, cai para o português e, por fim, para a própria chave.
export function t(rawKey, vars) {
  const key = pluralKey(rawKey, vars);
  let text = lookup(DICTIONARIES[current], key);
  if (typeof text !== 'string') text = lookup(DICTIONARIES[LOCALE.default], key);
  if (typeof text !== 'string') {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn(`[i18n] Chave sem tradução: ${key}`);
    }
    return key;
  }
  return interpolate(text, vars);
}

// Texto já escapado para HTML, com trechos de HTML confiável no lugar de {nome}.
export function tHtml(key, htmlVars = {}) {
  const text = esc(t(key));
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in htmlVars ? htmlVars[name] : match));
}

export const getLocale = () => current;

export function localeTag(id = current) {
  const entry = LOCALE.available.find((l) => l.id === id);
  return entry ? entry.tag : 'pt-BR';
}

function readSavedLocale() {
  try {
    return window.localStorage.getItem(LOCALE.storageKey);
  } catch {
    return null;
  }
}

export function setLocale(id, { persist = true } = {}) {
  if (!DICTIONARIES[id]) return false;
  current = id;
  document.documentElement.lang = localeTag(id);
  if (persist) {
    try { window.localStorage.setItem(LOCALE.storageKey, id); } catch { /* armazenamento bloqueado: vale só nesta sessão */ }
  }
  return true;
}

export function initLocale() {
  const saved = readSavedLocale();
  setLocale(saved && DICTIONARIES[saved] ? saved : LOCALE.default, { persist: false });
}

/* ---------- formatting ---------- */

const formatters = new Map();

function formatter(options) {
  const cacheKey = `${current}|${JSON.stringify(options)}`;
  if (!formatters.has(cacheKey)) formatters.set(cacheKey, new Intl.DateTimeFormat(localeTag(), options));
  return formatters.get(cacheKey);
}

export function formatDate(iso) {
  const date = parseISO(iso);
  return date ? formatter({ day: '2-digit', month: '2-digit', year: 'numeric' }).format(date) : '';
}

export function formatTime(iso, { seconds = false } = {}) {
  const date = parseISO(iso);
  if (!date) return '';
  return formatter({ hour: '2-digit', minute: '2-digit', ...(seconds ? { second: '2-digit' } : {}) }).format(date);
}

// Data e hora sem vírgula ("21/09/2026 08:15"), no padrão do app.
export function formatDateTime(iso, { seconds = false } = {}) {
  if (!parseISO(iso)) return '';
  return `${formatDate(iso)} ${formatTime(iso, { seconds })}`;
}

// Hoje → só a hora; ontem → "Ontem"; antes disso → a data.
export function formatRelative(iso) {
  if (!parseISO(iso)) return '';
  const day = iso.slice(0, 10);
  const today = todayISO();
  if (day === today) return formatTime(iso);
  if (day === addDaysISO(today, -1)) return t('common.yesterday');
  return formatDate(iso);
}

export function formatNumber(value, options) {
  return new Intl.NumberFormat(localeTag(), options).format(value);
}

export const dictionaries = DICTIONARIES;
