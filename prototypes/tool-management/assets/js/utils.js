// Funções utilitárias sem estado: datas, texto, imagens e ícones.

/* ---------- dates ---------- */
// Datas circulam como ISO local: "AAAA-MM-DD" (data) ou "AAAA-MM-DDTHH:mm:ss" (data e hora).
// Só viram DD/MM/AAAA na exibição.

const pad = (n) => String(n).padStart(2, '0');

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function nowISO() {
  const d = new Date();
  return `${toISODate(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function parseISODate(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
  if (!match) return null;
  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);
  return date.getMonth() === m - 1 && date.getDate() === d ? date : null;
}

export function isValidISODate(iso) {
  return parseISODate(iso) !== null;
}

// Soma dias preservando a parte de hora, se houver.
export function addDaysISO(iso, days) {
  const date = parseISODate(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return toISODate(date) + iso.slice(10);
}

export function daysBetween(fromIso, toIso) {
  const a = parseISODate(fromIso);
  const b = parseISODate(toIso);
  if (!a || !b) return 0;
  const utc = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

export function formatDateBR(iso) {
  const date = parseISODate(iso);
  return date ? `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}` : '';
}

/* ---------- text ---------- */

export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Compara sem diferenciar maiúsculas nem acentos ("multimetro" encontra "Multímetro").
export function normalize(value) {
  return String(value == null ? '' : value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function matchesSearch(query, fields) {
  const q = normalize(query);
  return !q || fields.some((field) => normalize(field).includes(q));
}

/* ---------- async ---------- */

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

/* ---------- images ---------- */

// Reduz a imagem e converte para JPEG em data URL, para poder ser salva junto com os dados.
export function imageToDataUrl(file, { maxDimension, quality }) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const width = img.naturalWidth || maxDimension;
        const height = img.naturalHeight || maxDimension;
        const scale = Math.min(1, maxDimension / Math.max(width, height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao decodificar a imagem.'));
    };
    img.src = url;
  });
}

/* ---------- icons ---------- */

const ICONS = {
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2-2z"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20a8 8 0 0 1 16 0"/>',
  logout: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><path d="M10 17l5-5-5-5"/><path d="M15 12H3"/>',
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/>',
  plusCircle: '<circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/>',
  userCheck: '<path d="M15 19v-1.5a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4V19"/><circle cx="8" cy="7" r="3.5"/><path d="M16 12l2 2 3.5-3.5"/>',
  checkSquare: '<rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  checkCircle: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5L16 9.5"/>',
  box: '<path d="M21 8L12 3 3 8v8l9 5 9-5V8z"/><path d="M3 8l9 5 9-5"/><path d="M12 13v8"/>',
  clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6M9 15h6"/>',
  alert: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  chevronRight: '<path d="M9 6l6 6-6 6"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5z"/>',
  tag: '<path d="M12.5 3H5a2 2 0 0 0-2 2v7.5a2 2 0 0 0 .59 1.41l8.5 8.5a2 2 0 0 0 2.82 0l7.5-7.5a2 2 0 0 0 0-2.82l-8.5-8.5A2 2 0 0 0 12.5 3z"/><circle cx="8" cy="8" r="1.1"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.4"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M8 3v4M16 3v4M3.5 9.5h17"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  file: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/>',
  barcode: '<path d="M4 5v14M8 5v14M11 5v14M15 5v14M17 5v14M20 5v14"/>',
  faceScan: '<path d="M4 8V6a2 2 0 0 1 2-2h2M4 16v2a2 2 0 0 0 2 2h2M20 8V6a2 2 0 0 0-2-2h-2M20 16v2a2 2 0 0 1-2 2h-2"/><rect x="7" y="8" width="10" height="8" rx="2"/>',
  camera: '<path d="M4 8a2 2 0 0 1 2-2h1l1-2h4l1 2h1a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.2"/>',
  upload: '<path d="M12 20V6"/><path d="M6 11l6-6 6 6"/><path d="M4 20h16"/>',
  uploadSmall: '<path d="M12 20V6"/><path d="M6 11l6-6 6 6"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
};

export function icon(name, size = 18, { sw = 1.7, cls = '', style = '' } = {}) {
  return `<svg class="icon${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${style ? ` style="${style}"` : ''}>${ICONS[name] || ''}</svg>`;
}
