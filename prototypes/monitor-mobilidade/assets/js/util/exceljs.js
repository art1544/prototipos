/**
 * Carrega o ExcelJS sob demanda, só no "Baixar Excel" do despacho (gera o .xlsx com cores, bordas e logos).
 */
import { URLS } from '../config.js';

let carregando = null;

/** @returns {Promise<any>} o objeto global ExcelJS */
export function carregarExcelJS() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  carregando ??= new Promise((resolver, rejeitar) => {
    const script = document.createElement('script');
    script.src = URLS.exceljs;
    script.integrity = URLS.exceljsIntegridade;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolver(window.ExcelJS);
    script.onerror = () => {
      carregando = null;
      script.remove();
      rejeitar(new Error('Não foi possível carregar o gerador de Excel.'));
    };
    document.head.appendChild(script);
  });
  return carregando;
}
