/**
 * "Baixar Excel" da aba Despacho: consolidado-despacho-aaaa-mm-dd.xlsx (data do download) no padrão Ternium x
 * Mobilidade: cada aba abre com os logos da Ternium e do Mobilidade, título e faixa laranja; títulos das tabelas em
 * azul Ternium com texto branco; linhas zebradas com bordas; cabeçalho congelado e autofiltro nas tabelas.
 * Abas: Resumo (indicadores, uso do app e motivos) e uma por tabela (usuários, ordens e retornos pendentes).
 */
import { URLS } from '../config.js';
import { pct, dataBr, ehDataIso, doisDigitos } from '../util/formato.js';
import { carregarExcelJS } from '../util/exceljs.js';
import { avisarErro } from '../ui/toast.js';

/** Paleta dos tokens da tela (tokens.css), em ARGB. */
const COR = {
  azul: 'FF000050',
  laranja: 'FFF37021',
  branco: 'FFFFFFFF',
  zebra: 'FFF3F5F7',
  linha: 'FFD8D8CF',
  texto: 'FF2A2A4D',
  cinza: 'FF5B5B72',
};
const FONTE = 'Calibri';
const ALTURA_LOGO_PX = 40;
const LINHA_CONTEUDO = 6;
const LARGURA = { minima: 10, maxima: 60 };

/** aaaa-mm-dd de hoje no fuso da máquina. */
function hojeIso() {
  const d = new Date();
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

/** Nome do arquivo com a data do dia do download. */
export const nomeDoExcel = (dia = hojeIso()) => `consolidado-despacho-${dia}.xlsx`;

// ---------- logos ----------

async function lerLogo(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`${url}: ${resposta.status}`);
  const blob = await resposta.blob();
  const { width, height } = await createImageBitmap(blob);
  const base64 = await new Promise((resolver, rejeitar) => {
    const leitor = new FileReader();
    leitor.onload = () => resolver(leitor.result);
    leitor.onerror = rejeitar;
    leitor.readAsDataURL(blob);
  });
  return { base64, largura: Math.round((width * ALTURA_LOGO_PX) / height), altura: ALTURA_LOGO_PX };
}

/** Registra os logos na pasta uma vez; cada aba reaproveita. */
async function registrarLogos(pasta) {
  const [ternium, mobilidade] = await Promise.all([lerLogo(URLS.logoTernium), lerLogo(URLS.logo)]);
  return {
    ternium: { ...ternium, id: pasta.addImage({ base64: ternium.base64, extension: 'png' }) },
    mobilidade: { ...mobilidade, id: pasta.addImage({ base64: mobilidade.base64, extension: 'png' }) },
  };
}

// ---------- estilos ----------

function borda() {
  const fina = { style: 'thin', color: { argb: COR.linha } };
  return { top: fina, left: fina, bottom: fina, right: fina };
}

const preenchimento = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

function estiloTitulo(celula) {
  celula.font = { name: FONTE, size: 11, bold: true, color: { argb: COR.branco } };
  celula.fill = preenchimento(COR.azul);
  celula.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  celula.border = borda();
}

/** Célula de dado: borda, zebrado e números com separador de milhar alinhados à direita. */
function estiloDado(celula, zebrada) {
  const numero = typeof celula.value === 'number';
  celula.font = { name: FONTE, size: 10, color: { argb: COR.texto } };
  if (zebrada) celula.fill = preenchimento(COR.zebra);
  celula.border = borda();
  if (numero) celula.numFmt = '#,##0';
  celula.alignment = { vertical: 'middle', horizontal: numero ? 'right' : 'left', wrapText: !numero };
}

/**
 * Cabeçalho comum: logo da Ternium à esquerda e do Mobilidade à direita (linha 1), título (2), subtítulo (3) e
 * faixa laranja (4). O conteúdo começa na linha LINHA_CONTEUDO.
 */
function cabecalhoDaAba(aba, logos, colunas, titulo, subtitulo) {
  const ultima = Math.max(colunas, 3);
  aba.getRow(1).height = ALTURA_LOGO_PX * 0.75 + 8;
  aba.addImage(logos.ternium.id, {
    tl: { col: 0.08, row: 0.15 },
    ext: { width: logos.ternium.largura, height: logos.ternium.altura },
  });
  aba.addImage(logos.mobilidade.id, {
    tl: { col: ultima - 1 + 0.02, row: 0.15 },
    ext: { width: logos.mobilidade.largura, height: logos.mobilidade.altura },
  });

  aba.mergeCells(2, 1, 2, ultima);
  const celulaTitulo = aba.getCell(2, 1);
  celulaTitulo.value = titulo;
  celulaTitulo.font = { name: FONTE, size: 16, bold: true, color: { argb: COR.azul } };
  aba.getRow(2).height = 24;

  aba.mergeCells(3, 1, 3, ultima);
  const celulaSub = aba.getCell(3, 1);
  celulaSub.value = subtitulo;
  celulaSub.font = { name: FONTE, size: 10, italic: true, color: { argb: COR.cinza } };

  aba.getRow(4).height = 5;
  for (let c = 1; c <= ultima; c++) aba.getCell(4, c).fill = preenchimento(COR.laranja);
}

/** Larguras pelas maiores células de cada coluna, entre LARGURA.minima e LARGURA.maxima. */
function ajustarLarguras(aba, linhas) {
  const colunas = Math.max(...linhas.map((linha) => linha.length), 1);
  for (let c = 0; c < colunas; c++) {
    const maior = Math.max(...linhas.map((linha) => String(linha[c] ?? '').length));
    aba.getColumn(c + 1).width = Math.min(LARGURA.maxima, Math.max(LARGURA.minima, maior + 3));
  }
}

// ---------- aba Resumo ----------

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

/** Seções da aba Resumo: primeiro o número real (usuários válidos), depois o total do despacho, uso do app e motivos. */
function secoesDoResumo(resumo) {
  const retornos = resumo.retornosDespacho?.retornos;
  const secoes = [];
  if (resumo.validos) {
    secoes.push({
      titulos: ['Número real: usuários válidos (apontaram ou receberam ordem depois do despacho)', 'Quantidade', '%'],
      linhas: indicadoresDaBase(resumo.validos, resumo.validos.usuarios, 'Usuários válidos', 'Envios a usuários válidos'),
    });
  }
  secoes.push(
    {
      titulos: ['Total do despacho (todos os usuários)', 'Quantidade', '%'],
      linhas: [
        ...indicadoresDaBase(resumo, resumo.usuariosEnvolvidos, 'Usuários envolvidos', 'Envios de ordem (ordem × usuário)'),
        ['Retornos de evento pendentes', resumo.retornosPendentes, retornos ? pct(resumo.retornosPendentes, retornos) : 'sem base'],
      ],
    },
    {
      titulos: ['Uso do app', 'Usuários', 'Ordens pendentes'],
      linhas: resumo.usuariosPorUso.map((x) => [x.uso, x.usuarios, x.ordensPendentes]),
    },
    {
      titulos: ['Motivo (ordens)', 'Ordens', 'Ação sugerida'],
      linhas: resumo.ordensPorMotivo.map((x) => [x.motivo, x.ordens, x.acao]),
    },
    {
      titulos: ['Motivo (retornos)', 'Retornos', 'Ação sugerida'],
      linhas: resumo.retornosPorMotivo.map((x) => [x.motivo, x.retornos, x.acao]),
    },
  );
  return secoes;
}

function abaResumo(pasta, logos, resultado, subtitulo) {
  const aba = pasta.addWorksheet('Resumo', { properties: { tabColor: { argb: COR.laranja } } });
  cabecalhoDaAba(aba, logos, 3, 'Consolidado do despacho', subtitulo);
  let r = LINHA_CONTEUDO;
  for (const { titulos, linhas } of secoesDoResumo(resultado.resumo)) {
    aba.getRow(r).values = titulos;
    aba.getRow(r).height = 30;
    titulos.forEach((_, c) => estiloTitulo(aba.getCell(r, c + 1)));
    r++;
    linhas.forEach((linha, i) => {
      aba.getRow(r).values = linha;
      for (let c = 1; c <= 3; c++) {
        const celula = aba.getCell(r, c);
        estiloDado(celula, i % 2 === 1);
        // percentuais e "base" ficam à direita, alinhados com a quantidade
        if (c === 3 && /%$|base$/.test(String(celula.value ?? ''))) celula.alignment = { vertical: 'middle', horizontal: 'right' };
      }
      r++;
    });
    r++;
  }
  aba.getColumn(1).width = 62;
  aba.getColumn(2).width = 16;
  aba.getColumn(3).width = 48;
  aba.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  aba.views = [{ showGridLines: false }];
}

// ---------- abas das tabelas ----------

/** Datas ISO viram dd/mm/aaaa; o resto vai como veio. */
const paraCelula = (valor) => (ehDataIso(valor) ? dataBr(valor) : valor ?? '');

function abaDaTabela(pasta, logos, nome, dados, titulos, subtitulo) {
  const colunas = Object.keys(titulos);
  const cabecalho = colunas.map((coluna) => titulos[coluna]);
  const linhas = dados.map((linha) => colunas.map((coluna) => paraCelula(linha[coluna])));
  const aba = pasta.addWorksheet(nome);
  cabecalhoDaAba(aba, logos, colunas.length, nome, `${subtitulo} · ${linhas.length.toLocaleString('pt-BR')} linha(s)`);

  const inicio = LINHA_CONTEUDO;
  aba.getRow(inicio).values = cabecalho;
  aba.getRow(inicio).height = 30;
  cabecalho.forEach((_, c) => estiloTitulo(aba.getCell(inicio, c + 1)));
  linhas.forEach((linha, i) => {
    const row = aba.getRow(inicio + 1 + i);
    row.values = linha;
    linha.forEach((_, c) => estiloDado(row.getCell(c + 1), i % 2 === 1));
  });
  aba.autoFilter = {
    from: { row: inicio, column: 1 },
    to: { row: inicio + Math.max(linhas.length, 1), column: colunas.length },
  };
  ajustarLarguras(aba, [cabecalho, ...linhas]);
  aba.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 };
  aba.views = [{ state: 'frozen', ySplit: inicio, showGridLines: false }];
}

// ---------- saída ----------

function baixar(buffer, nome) {
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const link = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: nome });
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 2000);
}

/**
 * @param {object} resultado resultado do despacho (/despacho/atual)
 * @param {{usuarios: object, ordens: object, eventos: object}} colunas coluna → título de cada tabela
 */
export async function exportarXlsx(resultado, colunas) {
  try {
    const ExcelJS = await carregarExcelJS();
    const pasta = new ExcelJS.Workbook();
    pasta.creator = 'Monitor Mobilidade';
    pasta.created = new Date();
    const logos = await registrarLogos(pasta);
    const inicio = resultado.despacho ? `Despacho iniciado em ${dataBr(resultado.despacho.inicio)} · ` : '';
    const subtitulo = `${inicio}Extração de ${dataBr(resultado.extracao)} · Ternium x Mobilidade`;

    abaResumo(pasta, logos, resultado, subtitulo);
    abaDaTabela(pasta, logos, 'Usuários', resultado.usuarios, colunas.usuarios, subtitulo);
    abaDaTabela(pasta, logos, 'Ordens pendentes', resultado.ordens, colunas.ordens, subtitulo);
    abaDaTabela(pasta, logos, 'Retornos pendentes', resultado.eventos, colunas.eventos, subtitulo);
    baixar(await pasta.xlsx.writeBuffer(), nomeDoExcel());
  } catch (erro) {
    avisarErro('Não foi possível gerar o Excel: ', erro);
  }
}
