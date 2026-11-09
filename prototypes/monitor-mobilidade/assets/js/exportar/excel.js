/**
 * "Baixar Excel" da aba Despacho: consolidado-despacho.xlsx com a aba Resumo (indicadores, uso do app e motivos) e
 * uma aba por tabela (usuários, ordens pendentes, retornos pendentes), com autofiltro.
 */
import { pct, dataBr, ehDataIso } from '../util/formato.js';
import { carregarSheetJS } from '../util/sheetjs.js';
import { avisarErro } from '../ui/toast.js';

const NOME_ARQUIVO = 'consolidado-despacho.xlsx';

/** Indicadores de ordens e usuários sobre uma base: a dos usuários válidos ou a do despacho inteiro. */
function indicadoresDaBase(b, usuarios, rotuloUsuarios, rotuloEnvios) {
  return [
    [rotuloUsuarios, usuarios, 'base'],
    ['Usuários sem pendência', b.semPendencia, pct(b.semPendencia, usuarios)],
    ['Usuários com pendência', b.comPendencia, pct(b.comPendencia, usuarios)],
    [rotuloEnvios, b.ordensEnviadas, 'base'],
    ['Ordens recebidas', b.ordensRecebidas, pct(b.ordensRecebidas, b.ordensEnviadas)],
    ['Ordens pendentes', b.ordensPendentes, pct(b.ordensPendentes, b.ordensEnviadas)],
    ['Fora da janela de 1 mês', b.ordensForaJanela, pct(b.ordensForaJanela, b.ordensEnviadas)],
  ];
}

/** Linhas da aba Resumo: primeiro o número real (usuários válidos), depois o total do despacho. */
function linhasDoResumo(resultado) {
  const r = resultado.resumo;
  const retornos = r.retornosDespacho?.retornos;
  const inicio = resultado.despacho ? ` iniciado em ${dataBr(resultado.despacho.inicio)}` : '';
  return [
    [`Consolidado do despacho${inicio}`],
    [`Extração de ${dataBr(resultado.extracao)}`],
    [],
    ...(r.validos
      ? [
          ['Número real: usuários válidos (apontaram ou receberam ordem depois do despacho)', 'Quantidade', '%'],
          ...indicadoresDaBase(r.validos, r.validos.usuarios, 'Usuários válidos', 'Envios a usuários válidos'),
          [],
        ]
      : []),
    ['Total do despacho (todos os usuários)', 'Quantidade', '%'],
    ...indicadoresDaBase(r, r.usuariosEnvolvidos, 'Usuários envolvidos', 'Envios de ordem (ordem × usuário)'),
    ['Retornos de evento pendentes', r.retornosPendentes, retornos ? pct(r.retornosPendentes, retornos) : 'sem base'],
    [],
    ['Uso do app', 'Usuários', 'Ordens pendentes'],
    ...r.usuariosPorUso.map((x) => [x.uso, x.usuarios, x.ordensPendentes]),
    [],
    ['Motivo (ordens)', 'Ordens', 'Ação sugerida'],
    ...r.ordensPorMotivo.map((x) => [x.motivo, x.ordens, x.acao]),
    [],
    ['Motivo (retornos)', 'Retornos', 'Ação sugerida'],
    ...r.retornosPorMotivo.map((x) => [x.motivo, x.retornos, x.acao]),
  ];
}

/** Datas ISO viram dd/mm/aaaa; o resto vai como veio. */
const paraCelula = (valor) => (ehDataIso(valor) ? dataBr(valor) : valor);

/** Aba de uma tabela: títulos das colunas, linhas (datas em dd/mm/aaaa) e autofiltro. */
function abaDaTabela(XLSX, dados, titulos) {
  const colunas = Object.keys(titulos);
  const linhas = [
    colunas.map((coluna) => titulos[coluna]),
    ...dados.map((linha) => colunas.map((coluna) => paraCelula(linha[coluna]))),
  ];
  const aba = XLSX.utils.aoa_to_sheet(linhas);
  const intervalo = { s: { r: 0, c: 0 }, e: { r: linhas.length - 1, c: colunas.length - 1 } };
  aba['!autofilter'] = { ref: XLSX.utils.encode_range(intervalo) };
  return aba;
}

/**
 * @param {object} resultado resultado do despacho (/despacho/atual)
 * @param {{usuarios: object, ordens: object, eventos: object}} colunas coluna → título de cada tabela
 */
export async function exportarXlsx(resultado, colunas) {
  try {
    const XLSX = await carregarSheetJS();
    const pasta = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(pasta, XLSX.utils.aoa_to_sheet(linhasDoResumo(resultado)), 'Resumo');
    XLSX.utils.book_append_sheet(pasta, abaDaTabela(XLSX, resultado.usuarios, colunas.usuarios), 'Usuários');
    XLSX.utils.book_append_sheet(pasta, abaDaTabela(XLSX, resultado.ordens, colunas.ordens), 'Ordens pendentes');
    XLSX.utils.book_append_sheet(pasta, abaDaTabela(XLSX, resultado.eventos, colunas.eventos), 'Retornos pendentes');
    XLSX.writeFile(pasta, NOME_ARQUIVO);
  } catch (erro) {
    avisarErro('Não foi possível gerar o Excel: ', erro);
  }
}
