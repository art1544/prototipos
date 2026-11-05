/**
 * Carrega o SheetJS sob demanda: só quando o usuário lê uma planilha ou baixa o Excel.
 * A planilha é lida no navegador; só os números das ordens vão para o servidor.
 */
import { URLS } from '../config.js';

let carregando = null;

/** @returns {Promise<any>} o objeto global XLSX */
export function carregarSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  carregando ??= new Promise((resolver, rejeitar) => {
    const script = document.createElement('script');
    script.src = URLS.sheetjs;
    if (URLS.sheetjsIntegridade) {
      script.integrity = URLS.sheetjsIntegridade;
      script.crossOrigin = 'anonymous';
    }
    script.onload = () => resolver(window.XLSX);
    script.onerror = () => {
      carregando = null;
      script.remove();
      rejeitar(new Error('Não foi possível carregar o leitor de planilhas.'));
    };
    document.head.appendChild(script);
  });
  return carregando;
}
