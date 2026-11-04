/**
 * Blocos de HTML usados em mais de uma tela: linhas de números, barras de motivos e tabela simples.
 * Todos devolvem string; o texto vindo da API passa por esc()/fmt().
 */
import {esc, fmt, pct, dataBr, humano} from './util/formato.js';
import {info} from './ui/popover.js';

/** Lista "rótulo ........ valor (%)" dos números secundários de uma pergunta. */
export function linhas(nums) {
  if (!nums.length) return '';
  return '<div class="linhas rl">' + nums.map(function (n) {
    return '<div><span>' + esc(n.rotulo) + info(n.explicacao, n.rotulo) + '</span><b>' + fmt(n.valor) + (n.base ? '<small>' + pct(n.valor, n.base) + '</small>' : '') + '</b></div>';
  }).join('') + '</div>';
}

/**
 * Barras horizontais por motivo, proporcionais ao maior.
 * @param {Array<{motivo:string, acao?:string}>} itens
 * @param {'ordens'|'retornos'} chave campo com a quantidade
 * @param {boolean} [ti] estilo das pendências da TI
 * @returns {string} vazio quando não há itens
 */
export function listaMotivos(itens, chave, ti) {
  if (!itens || !itens.length) return '';
  const max = Math.max.apply(null, itens.map(function (x) { return x[chave] || 0; })) || 1;
  return '<div class="motivos rl">' + itens.map(function (x) {
    return '<div class="mot' + (ti ? ' ti' : '') + '"><span class="lbl">' + esc(x.motivo) + '</span><span class="qt">' + fmt(x[chave]) + '</span>' +
      '<div class="barra"><i style="width:' + (x[chave] * 100 / max).toFixed(1) + '%"></i></div>' + (x.acao ? '<span class="acao">Ação: ' + esc(x.acao) + '</span>' : '') + '</div>';
  }).join('') + '</div>';
}

/** Cópia dos motivos sem a ação sugerida (no cartão a ação fica só no "Detalhes"). */
export function semAcao(l) {
  return (l || []).map(function (x) { const y = {}; for (const k in x) if (k !== 'acao') y[k] = x[k]; return y; });
}

/** Tabela com as colunas do primeiro objeto; números à direita, datas ISO em dd/mm/aaaa. */
export function tabelaSimples(dados) {
  const cols = Object.keys(dados[0]);
  return '<div class="tbl"><table><thead><tr>' + cols.map(function (c) { return '<th>' + esc(humano(c)) + '</th>'; }).join('') + '</tr></thead><tbody>' +
    dados.map(function (l) {
      return '<tr>' + cols.map(function (c) {
        const v = l[c];
        return typeof v === 'number' ? '<td class="n">' + fmt(v) + '</td>' : '<td>' + (/^\d{4}-\d{2}-\d{2}T/.test(String(v)) ? dataBr(v) : esc(v)) + '</td>';
      }).join('') + '</tr>';
    }).join('') +
    '</tbody></table></div>';
}
