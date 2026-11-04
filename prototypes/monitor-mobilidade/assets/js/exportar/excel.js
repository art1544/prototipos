/**
 * "Baixar Excel" da aba Despacho: consolidado-despacho.xlsx com a aba Resumo (indicadores, uso do app e motivos)
 * e uma aba por tabela (usuários, ordens pendentes, retornos pendentes), com autofiltro.
 */
import {pct, dataBr} from '../util/formato.js';
import {carregarSheetJS} from '../util/sheetjs.js';

/**
 * @param {object} d resultado do despacho (/despacho/atual)
 * @param {{usuarios:object, ordens:object, eventos:object}} colunas coluna → título de cada tabela
 */
export function exportarXlsx(d, colunas) {
  carregarSheetJS().then(function (X) {
    const r = d.resumo, rd = r.retornosDespacho, wb = X.utils.book_new();
    const res = [['Consolidado do despacho' + (d.despacho ? ' iniciado em ' + dataBr(d.despacho.inicio) : '')], ['Extração de ' + dataBr(d.extracao)], [],
      ['Indicador', 'Quantidade', '%'],
      ['Usuários envolvidos', r.usuariosEnvolvidos, 'base'], ['Usuários sem pendência', r.semPendencia, pct(r.semPendencia, r.usuariosEnvolvidos)],
      ['Usuários com pendência', r.comPendencia, pct(r.comPendencia, r.usuariosEnvolvidos)], ['Envios de ordem (ordem × usuário)', r.ordensEnviadas, 'base'],
      ['Ordens recebidas', r.ordensRecebidas, pct(r.ordensRecebidas, r.ordensEnviadas)], ['Ordens pendentes', r.ordensPendentes, pct(r.ordensPendentes, r.ordensEnviadas)],
      ['Fora da janela de 1 mês', r.ordensForaJanela, pct(r.ordensForaJanela, r.ordensEnviadas)],
      ['Retornos de evento pendentes', r.retornosPendentes, rd && rd.retornos ? pct(r.retornosPendentes, rd.retornos) : 'sem base'], [],
      ['Uso do app', 'Usuários', 'Ordens pendentes']].concat(r.usuariosPorUso.map(function (x) { return [x.uso, x.usuarios, x.ordensPendentes]; }))
      .concat([[], ['Motivo (ordens)', 'Ordens', 'Ação sugerida']]).concat(r.ordensPorMotivo.map(function (x) { return [x.motivo, x.ordens, x.acao]; }))
      .concat([[], ['Motivo (retornos)', 'Retornos', 'Ação sugerida']]).concat(r.retornosPorMotivo.map(function (x) { return [x.motivo, x.retornos, x.acao]; }));
    X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet(res), 'Resumo');

    function aba(dados, nomes, titulo) {
      const cols = Object.keys(nomes);
      const aoa = [cols.map(function (c) { return nomes[c]; })].concat(dados.map(function (l) {
        return cols.map(function (c) { const v = l[c]; return /^\d{4}-\d{2}-\d{2}/.test(String(v)) ? dataBr(v) : v; });
      }));
      const ws = X.utils.aoa_to_sheet(aoa);
      ws['!autofilter'] = {ref: X.utils.encode_range({s: {r: 0, c: 0}, e: {r: aoa.length - 1, c: cols.length - 1}})};
      X.utils.book_append_sheet(wb, ws, titulo);
    }
    aba(d.usuarios, colunas.usuarios, 'Usuários');
    aba(d.ordens, colunas.ordens, 'Ordens pendentes');
    aba(d.eventos, colunas.eventos, 'Retornos pendentes');
    X.writeFile(wb, 'consolidado-despacho.xlsx');
  }).catch(function (e) { alert(e.message); });
}
