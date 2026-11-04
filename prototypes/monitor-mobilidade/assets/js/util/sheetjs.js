/**
 * Carrega o SheetJS (xlsx 0.18.5) sob demanda: só quando o usuário lê uma planilha ou baixa o Excel.
 * No protótipo vem de assets/js/vendor/ (cópia do cdnjs): a CSP do catálogo só aceita scripts do próprio site.
 * A planilha é lida no navegador; só os números das ordens vão para o servidor.
 */
const URL_SHEETJS = 'assets/js/vendor/xlsx.full.min.js';

/** @returns {Promise<any>} o objeto global XLSX */
export function carregarSheetJS() {
  return new Promise(function (ok, nao) {
    if (window.XLSX) return ok(window.XLSX);
    const s = document.createElement('script');
    s.src = URL_SHEETJS;
    s.onload = function () { ok(window.XLSX); };
    s.onerror = function () { nao(new Error('Não foi possível carregar o leitor de planilhas.')); };
    document.head.appendChild(s);
  });
}
