// Captura de erros para o "Reportar erro": guarda o último erro mostrado ao usuário (mensagem,
// código, tela e ordem/operação em contexto) e expande o botão flutuante, que fica vermelho.
// Não importa ações nem telas, para poder ser usado por qualquer módulo sem import circular.

import { APP, REPORT } from './config.js';
import { nowISO } from './utils.js';
import { state, setState } from './store.js';
import { orderByCode } from './model.js';

let fabTimer = null;
let fabOpenedAt = 0;

// Momento em que o botão foi expandido (para o "toque fora" não recolher no mesmo toque).
export const fabOpenedSince = () => fabOpenedAt;

// Título da tela atual (sem o " – Mobilidade" da aba).
export function currentScreenTitle() {
  const suffix = ` – ${APP.name}`;
  const title = document.title.endsWith(suffix) ? document.title.slice(0, -suffix.length) : '';
  return title || null;
}

// Ordem/operação da tela atual (detalhe da ordem, operação, eventos da ordem).
export function routeOrderContext() {
  const r = state.route;
  if (!r || !r.params) return null;
  const code = r.params.code && (r.name.startsWith('order') || r.name.startsWith('operation') || (r.name === 'eventsGroup' && r.params.type === 'ordem')) ? r.params.code : null;
  if (!code || !orderByCode(code)) return null;
  return { orderCode: code, operation: r.params.op || null };
}

export function setFabOpen(open, ms = REPORT.fabExpandedMs) {
  clearTimeout(fabTimer);
  if (open) {
    fabOpenedAt = performance.now();
    fabTimer = setTimeout(() => setFabOpen(false), ms);
  }
  if (state.report.fabOpen !== open) setState({ report: { ...state.report, fabOpen: open } });
}

// `orderCode`/`operation` opcionais: sem eles, usa a ordem da tela atual.
export function captureError({ message, code = '', status = null, orderCode = null, operation = null, screen = null }) {
  if (state.status !== 'ready' || !message) return;
  const context = orderCode ? { orderCode, operation } : routeOrderContext();
  const detail = [code, status ? String(status) : ''].filter(Boolean).join(' ');
  const captured = {
    message,
    code: detail,
    screen: screen || currentScreenTitle(),
    at: nowISO(),
    orderCode: context ? context.orderCode : null,
    operation: context ? context.operation : null,
  };
  setState({ report: { ...state.report, captured } });
  setFabOpen(true, REPORT.fabErrorMs);
}

export function clearCaptured() {
  clearTimeout(fabTimer);
  setState({ report: { captured: null, fabOpen: false } });
}
