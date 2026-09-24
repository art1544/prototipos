// Funções utilitárias sem estado: datas, texto, imagens, arquivos e ícones.

/* ---------- dates ---------- */
// Datas circulam como ISO local: "AAAA-MM-DD" (data) ou "AAAA-MM-DDTHH:mm:ss" (data e hora).
// A formatação para exibição (por idioma) fica em i18n/index.js.

const pad = (n) => String(n).padStart(2, '0');

export function toISODate(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toISODateTime(date) {
  return `${toISODate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export const todayISO = () => toISODate(new Date());
export const nowISO = () => toISODateTime(new Date());

// Valor aceito por <input type="datetime-local">: AAAA-MM-DDTHH:mm
export function nowForInput() {
  return nowISO().slice(0, 16);
}

export function parseISO(iso) {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(iso || '');
  if (!match) return null;
  const [, y, m, d, hh = '0', mm = '0', ss = '0'] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
  return date.getMonth() === Number(m) - 1 && date.getDate() === Number(d) ? date : null;
}

export function isValidISO(iso) {
  return parseISO(iso) !== null;
}

// Converte o valor do input datetime-local (sem segundos) para ISO completo.
export function inputToISO(value) {
  if (!value) return '';
  return value.length === 16 ? `${value}:00` : value;
}

// Soma dias preservando a parte de hora, se houver.
export function addDaysISO(iso, days) {
  const date = parseISO(iso);
  if (!date) return iso;
  date.setDate(date.getDate() + days);
  return toISODate(date) + iso.slice(10);
}

export function daysBetween(fromIso, toIso) {
  const a = parseISO(fromIso);
  const b = parseISO(toIso);
  if (!a || !b) return 0;
  const utc = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

/* ---------- text ---------- */

export function esc(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Compara sem diferenciar maiúsculas nem acentos ("balanca" encontra "BALANÇA").
export function normalize(value) {
  return String(value == null ? '' : value).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function matchesSearch(query, fields) {
  const q = normalize(query);
  return !q || fields.some((field) => normalize(field).includes(q));
}

export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

export const firstName = (name) => String(name || '').trim().split(/\s+/)[0] || '';

/* ---------- async ---------- */

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function randomBetween(min, max) {
  return Math.round(min + Math.random() * (max - min));
}

/* ---------- files ---------- */

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

export function downloadText(filename, text, type = 'application/json') {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- icons ---------- */
// Traços no estilo do app original (24×24, stroke 2). Uso: icon('bell'), icon('search', { size: 18 }).

const ICONS = {
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>',
  back: '<polyline points="15 18 9 12 15 6"/>',
  chevronRight: '<polyline points="9 6 15 12 9 18"/>',
  chevronDown: '<polyline points="6 9 12 15 18 9"/>',
  clipboard: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z"/><line x1="8.5" y1="11" x2="15.5" y2="11"/><line x1="8.5" y1="14.5" x2="15.5" y2="14.5"/><line x1="8.5" y1="18" x2="12.5" y2="18"/>',
  clipboardSmall: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1Z"/><line x1="8.5" y1="11" x2="15.5" y2="11"/><line x1="8.5" y1="14.5" x2="15.5" y2="14.5"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  bookmark: '<path d="M6 4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16l-6-3.5L6 20Z"/>',
  checklist: '<path d="m3.5 6 1.3 1.3L7.5 4.5"/><line x1="10.5" y1="6" x2="21" y2="6"/><path d="m3.5 12 1.3 1.3L7.5 10.5"/><line x1="10.5" y1="12" x2="21" y2="12"/><path d="m3.5 18 1.3 1.3L7.5 16.5"/><line x1="10.5" y1="18" x2="21" y2="18"/>',
  download: '<path d="M12 3v12"/><polyline points="7 10 12 15 17 10"/><path d="M5 19h14"/>',
  sync: '<path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><polyline points="21 3 21 8 16 8"/><polyline points="3 21 3 16 8 16"/>',
  edit: '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.4 2.6a2.1 2.1 0 1 1 3 3L12 15l-4 1 1-4Z"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
  alert: '<path d="M12 3 2 20h20L12 3Z"/><line x1="12" y1="10" x2="12" y2="14.5"/><circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none"/>',
  warning: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/><polyline points="12 8 12 12.5 15.5 14.5"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4.5"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/>',
  success: '<circle cx="12" cy="12" r="9"/><polyline points="8 12.5 11 15.5 16 9"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  pin: '<path d="M12 21s-7-6.02-7-11a7 7 0 0 1 14 0c0 4.98-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>',
  file: '<path d="M14 3v4a1 1 0 0 0 1 1h4"/><path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/>',
  lockOpen: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7.4-2.1"/>',
  lockClosed: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
  people: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  clock: '<circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15.5 14"/>',
  paperclip: '<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57a4 4 0 1 1 5.66 5.66l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/>',
  reset: '<path d="M3 12a9 9 0 1 0 3-6.7"/><polyline points="3 4 3 9 8 9"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/>',
};

export function icon(name, { size, cls = '', sw = 2 } = {}) {
  const dims = size ? ` width="${size}" height="${size}"` : '';
  return `<svg class="icon${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24"${dims} fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
}

// Ícone de sinal da rede: barras preenchidas conforme o nível.
export function signalIcon(activeBars) {
  const bars = [
    { x: 0.5, y: 12, h: 6 },
    { x: 5.5, y: 8.5, h: 9.5 },
    { x: 10.5, y: 5, h: 13 },
    { x: 15.5, y: 1.5, h: 16.5 },
  ];
  const rects = bars.map((b, i) => `<rect x="${b.x}" y="${b.y}" width="3.5" height="${b.h}" rx="1"${i < activeBars ? '' : ' opacity="0.3"'}/>`).join('');
  return `<svg class="icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" focusable="false">${rects}</svg>`;
}
