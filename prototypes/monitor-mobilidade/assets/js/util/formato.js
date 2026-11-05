/**
 * Atalhos de DOM e formatação pt-BR. As funções de formatação devolvem texto puro: o escape fica com html``.
 */

/** Atalho para document.getElementById. */
export const $ = (id) => document.getElementById(id);

/** Formatador de números do Brasil (1.234). */
export const numero = new Intl.NumberFormat('pt-BR');

const PERCENTUAL = { minimumFractionDigits: 1, maximumFractionDigits: 1 };

/** Número formatado ("1.234"); texto passa como está; vazio vira "—". */
export function fmt(valor) {
  if (valor == null || valor === '') return '—';
  return typeof valor === 'number' ? numero.format(valor) : String(valor);
}

/** Percentual de parte sobre total com 1 casa ("12,5%"); sem total vira "—". */
export function pct(parte, total) {
  return total ? `${((parte * 100) / total).toLocaleString('pt-BR', PERCENTUAL)}%` : '—';
}

/** "2026-11-04" ou "2026-11-04T05:30" para "04/11/2026" ou "04/11/2026 05:30" (sem conversão de fuso). */
export function dataBr(valor) {
  if (!valor) return '';
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  if (!m) return String(valor);
  const [, ano, mes, dia, hora, minuto] = m;
  return `${dia}/${mes}/${ano}${hora ? ` ${hora}:${minuto}` : ''}`;
}

/** "dd/mm" de uma data ISO. */
export const diaMes = (valor) => dataBr(valor).slice(0, 5);

/** "hh:mm" de um carimbo ISO ("2026-11-04T05:31:10" → "05:31"). */
export const horaDe = (carimbo) => String(carimbo ?? '').slice(11, 16);

/** Valor parece data ISO (aaaa-mm-dd...). */
export const ehDataIso = (valor) => /^\d{4}-\d{2}-\d{2}/.test(String(valor));

/** Nome de coluna técnico para rótulo ("por_status" → "Por status"). */
export function humano(chave) {
  const texto = String(chave).replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Número com dois dígitos ("3" → "03"), como nas perguntas. */
export const doisDigitos = (n) => String(n).padStart(2, '0');

/** Lê a mensagem de qualquer erro (ApiError, Error ou texto). */
export const mensagemDe = (erro) => erro?.message ?? String(erro);
