// Funções utilitárias sem estado.

const pad = (n) => String(n).padStart(2, '0');

export function nowISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDateTimeBR(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
  return match ? `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}` : '';
}

export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function normalize(value) {
  return String(value == null ? '' : value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function matchesSearch(query, fields) {
  const q = normalize(query);
  return !q || fields.some((field) => normalize(field).includes(q));
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}
