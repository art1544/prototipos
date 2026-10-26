// Sessão do protótipo: só uma marca no sessionStorage (dura até fechar a aba). Sem armazenamento
// disponível, vale até recarregar a página.

import { SESSION } from './config.js';

let memory = false;

export function hasSession() {
  try {
    return window.sessionStorage.getItem(SESSION.storageKey) === '1';
  } catch {
    return memory;
  }
}

export function setSession(active) {
  memory = active;
  try {
    if (active) window.sessionStorage.setItem(SESSION.storageKey, '1');
    else window.sessionStorage.removeItem(SESSION.storageKey);
  } catch { /* só em memória */ }
}
