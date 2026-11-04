/**
 * Utilitários de DOM e de formatação (pt-BR). Toda saída que vai para innerHTML passa por esc() ou fmt().
 */

/** Atalho para document.getElementById. */
export const $ = (id) => document.getElementById(id);

/** Escapa texto para uso seguro em HTML (conteúdo e atributos). */
export function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
    return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c];
  });
}

/** Formatador de números do Brasil (1.234). */
export const nf = new Intl.NumberFormat('pt-BR');

/** Número formatado; texto vem escapado; vazio vira "—". */
export function fmt(n) {
  return n == null || n === '' ? '—' : (typeof n === 'number' ? nf.format(n) : esc(n));
}

/** Percentual de a sobre b com 1 casa ("12,5%"); sem base vira "—". */
export function pct(a, b) {
  return b ? (a * 100 / b).toLocaleString('pt-BR', {minimumFractionDigits: 1, maximumFractionDigits: 1}) + '%' : '—';
}

/** "2026-11-04" ou "2026-11-04T05:30" para "04/11/2026" ou "04/11/2026 05:30" (sem conversão de fuso). */
export function dataBr(v) {
  if (!v) return '';
  const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  return m ? m[3] + '/' + m[2] + '/' + m[1] + (m[4] ? ' ' + m[4] + ':' + m[5] : '') : esc(v);
}

/** Nome de coluna técnico para rótulo ("por_status" para "Por status"). */
export function humano(k) {
  const s = String(k).replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
