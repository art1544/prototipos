/**
 * Ambiente (DEV, PRODUÇÃO, LOCAL...) para o qual o MonitorLocal repassa as chamadas; no protótipo, PROTÓTIPO. Aparece ao lado do título
 * e no login (em vermelho quando é produção), no título da aba do navegador e no nome do PDF.
 */
import {estado} from './estado.js';
import {servidor} from './api.js';

export function carregarAmbiente() {
  servidor('ambiente').then(function (r) { return r.ok ? r.json() : null; }).then(function (a) {
    if (!a || !a.nome) return;
    estado.ambiente = a;
    document.querySelectorAll('.amb').forEach(function (el) { el.textContent = a.nome; el.className = 'amb ' + a.nome; el.title = a.url; el.hidden = false; });
    document.title = 'Monitor Mobilidade · ' + a.nome;
  }).catch(function () { /* sem o MonitorLocal (arquivo aberto direto): segue sem ambiente */ });
}
