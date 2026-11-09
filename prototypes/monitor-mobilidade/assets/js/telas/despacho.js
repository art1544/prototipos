/**
 * Aba "Despacho": envio da lista de ordens (planilha do SAP, .csv/.txt ou colada) com o início do despacho, e o
 * resultado para a área de negócio (indicadores, uso do app, motivos e as tabelas de usuários, ordens e retornos).
 */
import { LIMITES } from '../config.js';
import { html, raw } from '../util/html.js';
import { $, fmt, pct, dataBr } from '../util/formato.js';
import { carregarSheetJS } from '../util/sheetjs.js';
import { estado } from '../estado.js';
import { buscarDespachoAtual, buscarHoje, enviarDespacho, sessaoExpirada } from '../api.js';
import { EXPLICACOES } from '../textos.js';
import { info } from '../ui/popover.js';
import { animar } from '../graficos.js';
import { motivosOuNenhum, mostrarCarregando, mostrarFalha } from '../componentes.js';
import { ocupar } from '../ui/ocupado.js';
import { exportarXlsx } from '../exportar/excel.js';
import { tabelaFiltro } from './tabela-filtro.js';
import { carregarHoje } from './hoje.js';

/** Colunas de cada tabela do resultado (também usadas no Excel). A ordem aqui é a ordem na tela. */
export const COLUNAS = {
  usuarios: {
    usuario: 'ID do usuário',
    situacao: 'Situação',
    valido: 'Usuário válido',
    usoApp: 'Uso do app',
    ultimoUso: 'Último apontamento',
    diasSemUsar: 'Dias sem apontar',
    ordensEnviadas: 'Ordens enviadas',
    ordensRecebidas: 'Recebidas',
    ordensPendentes: 'Pendentes',
    ordensForaJanela: 'Fora da janela',
    retornosPendentes: 'Retornos pendentes',
    retornosErroSap: 'Erros no SAP',
    motivo: 'Motivo',
    acao: 'Ação sugerida',
  },
  ordens: {
    usuario: 'ID do usuário',
    usuarioValido: 'Usuário válido',
    ordem: 'Ordem',
    descricao: 'Descrição',
    centro: 'Centro',
    posto: 'Posto de trabalho',
    grupo: 'Grupo planejador',
    inicioPrevisto: 'Início previsto',
    enviadaNoDespacho: 'Enviada no despacho',
    vinculadaAoUsuario: 'Vinculada ao usuário em',
    usoApp: 'Uso do app',
    motivo: 'Motivo',
    acao: 'Ação sugerida',
  },
  eventos: {
    usuario: 'ID do usuário',
    aparelho: 'Aparelho',
    evento: 'Evento',
    tipo: 'Tipo',
    descricaoTipo: 'Descrição do tipo',
    statusSap: 'Status no SAP',
    mensagemSap: 'Mensagem do SAP',
    objetoSap: 'Objeto SAP',
    objetoRelacionado: 'Objeto relacionado',
    eventoCriadoEm: 'Evento criado em',
    retornoSapEm: 'Retorno do SAP em',
    motivo: 'Motivo',
    acao: 'Ação sugerida',
  },
};

/** Filtros de lista de cada tabela. */
const FILTROS = {
  usuarios: { situacao: 'Situação', valido: 'Usuário válido', usoApp: 'Uso do app' },
  ordens: { motivo: 'Motivo', usuarioValido: 'Usuário válido', usoApp: 'Uso do app', centro: 'Centro' },
  eventos: { motivo: 'Motivo', statusSap: 'Status no SAP', tipo: 'Tipo' },
};

/** Sub-abas das tabelas detalhadas. */
const TABELAS = [
  ['usuarios', 'Usuários'],
  ['ordens', 'Ordens pendentes'],
  ['eventos', 'Retornos pendentes'],
];

const ICONE_BAIXAR = raw(
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
    '<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>',
);

/** Grupos de uso do app têm 4 cores, do pior (sem aparelho) ao melhor (apontou depois do início). */
const CORES_DE_USO = 4;

function mensagem(texto) {
  $('msgEnvio').textContent = texto;
}

// ---------- envio da lista ----------

/** Números de ordem (até 12 dígitos) de um texto qualquer. */
const numerosDe = (texto) => texto.match(/\d{1,12}/g) || [];

/** Atualiza a contagem de ordens distintas (zeros à esquerda não contam). */
function atualizarQuantidade() {
  const distintas = new Set(numerosDe($('ordens').value).map((n) => n.replace(/^0+/, '')));
  $('qtdLista').textContent = fmt(distintas.size);
}

function preencherOrdens(ordens) {
  $('ordens').value = ordens.join('\n');
  atualizarQuantidade();
}

/**
 * Ordens de uma planilha do SAP: coluna "Ordem" (procurada nas 10 primeiras linhas) e, se houver a coluna
 * "Mensagem...", só as linhas "Ordem enviada com sucesso".
 */
async function ordensDaPlanilha(arquivo) {
  const [XLSX, conteudo] = await Promise.all([carregarSheetJS(), arquivo.arrayBuffer()]);
  const planilha = XLSX.read(conteudo);
  const linhas = XLSX.utils.sheet_to_json(planilha.Sheets[planilha.SheetNames[0]], { header: 1, raw: false });

  let linhaCabecalho = -1;
  let colunaOrdem = -1;
  let colunaMensagem = -1;
  for (let i = 0; i < Math.min(linhas.length, 10) && colunaOrdem < 0; i++) {
    (linhas[i] || []).forEach((celula, j) => {
      const texto = String(celula || '').trim().toLowerCase();
      if (texto === 'ordem') {
        colunaOrdem = j;
        linhaCabecalho = i;
      }
      if (texto.startsWith('mensagem')) colunaMensagem = j;
    });
  }
  if (colunaOrdem < 0) throw new Error('Não achei a coluna "Ordem" nas 10 primeiras linhas.');

  const enviadaComSucesso = (linha) =>
    colunaMensagem < 0 || String(linha[colunaMensagem] || '').toLowerCase().includes('enviada com sucesso');
  return linhas
    .slice(linhaCabecalho + 1)
    .filter((linha) => linha && enviadaComSucesso(linha))
    .map((linha) => String(linha[colunaOrdem] ?? '').trim())
    .filter((ordem) => /^\d{1,12}$/.test(ordem));
}

/** Lê o arquivo escolhido ou arrastado: .xlsx do SAP ou .csv/.txt com qualquer número de até 12 dígitos. */
async function lerArquivo(arquivo) {
  if (!arquivo) return;
  mensagem(`Lendo ${arquivo.name}…`);
  try {
    if (/\.xlsx$/i.test(arquivo.name)) {
      const ordens = await ordensDaPlanilha(arquivo);
      preencherOrdens(ordens);
      mensagem(`${arquivo.name}: ${fmt(ordens.length)} ordens enviadas com sucesso.`);
    } else {
      preencherOrdens(numerosDe(await arquivo.text()));
      mensagem(`${arquivo.name} lido.`);
    }
  } catch (erro) {
    mensagem(erro.message);
  }
}

function ligarArrastarESoltar() {
  const area = $('drop');
  const realcar = (ativo) => (evento) => {
    evento.preventDefault();
    area.classList.toggle('sobre', ativo);
  };
  for (const tipo of ['dragenter', 'dragover']) area.addEventListener(tipo, realcar(true));
  for (const tipo of ['dragleave', 'drop']) area.addEventListener(tipo, realcar(false));
  area.addEventListener('drop', (evento) => lerArquivo(evento.dataTransfer.files[0]));
}

async function enviar() {
  const ordens = numerosDe($('ordens').value);
  const inicio = $('inicio').value;
  if (!ordens.length || !inicio) {
    mensagem(ordens.length ? 'Informe o início do despacho.' : 'Informe as ordens.');
    return;
  }
  const liberar = ocupar($('bEnviar'), 'Processando…');
  mensagem('Enviando…');
  try {
    const resposta = await enviarDespacho(inicio, ordens);
    mensagem(
      `${fmt(resposta.ordens)} ordens recebidas. Calculando o despacho e refazendo a análise do dia (leva alguns minutos)…`,
    );
    acompanharCalculo(resposta.id, liberar);
  } catch (erro) {
    if (!sessaoExpirada(erro)) mensagem(erro.message);
    liberar();
  }
}

/** Liga o formulário de envio: texto colado, arquivo, arrastar e soltar, e o botão "Enviar e analisar". */
export function iniciarDespacho() {
  $('ordens').addEventListener('input', atualizarQuantidade);
  $('arquivo').addEventListener('change', (evento) => lerArquivo(evento.target.files[0]));
  ligarArrastarESoltar();
  $('bEnviar').addEventListener('click', enviar);
}

/**
 * Acompanha o cálculo em segundo plano: primeiro o resultado do despacho, depois o relatório do dia refeito com
 * esse despacho. Para quando os dois ficam prontos, quando o usuário sai ou no prazo.
 */
function acompanharCalculo(id, liberarBotao) {
  const prazo = Date.now() + LIMITES.acompanhamentoPrazoMs;
  let despachoPronto = false;

  const concluir = (texto) => {
    mensagem(texto);
    liberarBotao();
  };

  async function verificar() {
    if (!estado.token) {
      liberarBotao(); // saiu no meio
      return;
    }
    if (Date.now() > prazo) {
      concluir(
        despachoPronto
          ? 'Despacho calculado. As respostas do dia entram na próxima análise (uma análise manual rodou há menos de 10 min).'
          : 'O cálculo está demorando mais que o normal. Atualize a página em alguns minutos.',
      );
      return;
    }
    try {
      if (!despachoPronto) {
        const resultado = await buscarDespachoAtual().catch(() => null);
        if (resultado?.despacho?.id === id) {
          despachoPronto = true;
          estado.despacho = resultado;
          desenharResultado(resultado);
          mensagem('Despacho calculado. Atualizando as respostas do dia…');
        }
      }
      if (despachoPronto) {
        const hoje = await buscarHoje();
        if (hoje.relatorio?.despacho?.id === id) {
          concluir('Pronto: despacho e respostas do dia atualizados.');
          carregarHoje();
          return;
        }
      }
    } catch {
      // tenta de novo no próximo intervalo
    }
    setTimeout(verificar, LIMITES.acompanhamentoIntervaloMs);
  }

  setTimeout(verificar, LIMITES.acompanhamentoIntervaloMs);
}

// ---------- resultado para o negócio ----------

function tile(rotulo, valor, { extra = null, destacado = false, explicacao } = {}) {
  return html`<div class="tile${destacado ? ' dest' : ''}">
    <b data-n="${valor}">${fmt(valor)}</b>
    <span>${rotulo}${extra ? html` · <strong>${extra}</strong>` : ''}${info(explicacao, rotulo)}</span>
  </div>`;
}

/**
 * O número real considera só usuários válidos (resumo.validos); o total do despacho aparece ao lado.
 * Resultados calculados antes dessa regra não têm "validos" e mostram só o total.
 */
function indicadores(resumo) {
  const { validos, retornosDespacho } = resumo;
  const base = validos ?? resumo;
  const usuarios = validos ? validos.usuarios : resumo.usuariosEnvolvidos;
  const envios = base.ordensEnviadas;
  const retornos = retornosDespacho?.retornos;
  const retornosExtra = retornos ? `${pct(resumo.retornosPendentes, retornos)} de ${fmt(retornos)}` : null;
  const e = EXPLICACOES;
  return [
    tile(validos ? 'Usuários válidos' : 'Usuários envolvidos', usuarios, {
      destacado: true,
      extra: validos ? `de ${fmt(resumo.usuariosEnvolvidos)} no total` : null,
      explicacao: validos ? e.usuariosValidos : e.usuariosEnvolvidos,
    }),
    tile('Usuários sem pendência', base.semPendencia, {
      extra: pct(base.semPendencia, usuarios),
      explicacao: e.semPendencia,
    }),
    tile('Usuários com pendência', base.comPendencia, {
      extra: pct(base.comPendencia, usuarios),
      explicacao: e.comPendencia,
    }),
    tile(validos ? 'Envios a usuários válidos' : 'Envios de ordem (ordem × usuário)', envios, {
      destacado: true,
      extra: validos ? `de ${fmt(resumo.ordensEnviadas)} no total` : null,
      explicacao: e.ordensEnviadas,
    }),
    tile('Ordens recebidas', base.ordensRecebidas, {
      extra: pct(base.ordensRecebidas, envios),
      explicacao: e.ordensRecebidas,
    }),
    tile('Ordens pendentes (negócio)', base.ordensPendentes, {
      extra: pct(base.ordensPendentes, envios),
      explicacao: e.ordensPendentes,
    }),
    tile('Fora da janela de 1 mês', base.ordensForaJanela, {
      extra: pct(base.ordensForaJanela, envios),
      explicacao: e.ordensForaJanela,
    }),
    tile('Retornos pendentes (negócio)', resumo.retornosPendentes, {
      extra: retornosExtra,
      explicacao: e.retornosPendentes,
    }),
  ];
}

function cabecalhoResultado(resultado) {
  const inicio = resultado.despacho ? `Despacho iniciado em ${dataBr(resultado.despacho.inicio)} · ` : '';
  return html`<div class="card pad">
    <div class="cab-sec">
      <div>
        <h2 class="titulo-sec">Resultado para a área de negócio</h2>
        <span class="tiny">${inicio}extração de ${dataBr(resultado.extracao)} · só as pendências que o negócio
          trata</span>
      </div>
      <button class="btn prim" id="bXlsx" type="button">${ICONE_BAIXAR}<span class="rot">Baixar Excel</span></button>
    </div>
    <div class="tiles">${indicadores(resultado.resumo)}</div>
  </div>`;
}

/** Usuários por uso do app: barra empilhada e legenda com usuários e ordens pendentes de cada grupo. */
function usoDoApp(grupos) {
  const total = grupos.reduce((soma, grupo) => soma + grupo.usuarios, 0) || 1;
  const cor = (i) => i % CORES_DE_USO;
  return html`<div class="card pad">
    <h2 class="titulo-card">Usuários por uso do app${info(EXPLICACOES.usuariosPorUso)}</h2>
    <div class="tiny">Pelo último apontamento no app (a base guarda 15 dias).</div>
    <div class="pilha">
      ${grupos.map(
        (grupo, i) =>
          html`<i data-uso="${cor(i)}" style="width:${((grupo.usuarios * 100) / total).toFixed(2)}%"
            title="${grupo.uso}"></i>`,
      )}
    </div>
    <div class="leg">
      <span></span><span class="tiny">Uso do app</span><span class="tiny n">Usuários</span>
      <span class="tiny n">Ordens pendentes</span>
      ${grupos.map(
        (grupo, i) => html`<i data-uso="${cor(i)}"></i><span>${grupo.uso}</span>
          <span class="n">${fmt(grupo.usuarios)} <span class="tiny">(${pct(grupo.usuarios, total)})</span></span>
          <span class="n">${fmt(grupo.ordensPendentes)}</span>`,
      )}
    </div>
  </div>`;
}

function motivosDosRetornos(resumo) {
  const concentracao = resumo.concentracaoRetornos?.length
    ? html`<p class="tiny nota-rodape">Concentração: ${resumo.concentracaoRetornos
          .map((c) => `${c.usuario} (${fmt(c.retornos)})`)
          .join(', ')} respondem pela maior parte dos retornos pendentes.</p>`
    : '';
  return html`<div class="card pad secao">
    <h2 class="titulo-card antes-lista">
      Retornos de evento pendentes por motivo${info(EXPLICACOES.retornosPorMotivo)}
    </h2>
    ${motivosOuNenhum(resumo.retornosPorMotivo, 'retornos')}${concentracao}
  </div>`;
}

function tabelasDetalhadas(resultado) {
  return html`<div class="card pad secao">
    <div class="sub-abas rl" role="tablist">
      ${TABELAS.map(
        ([chave, titulo], i) =>
          html`<button type="button" data-t="${chave}" aria-selected="${i === 0}">
            ${titulo} <span>${fmt(resultado[chave].length)}</span>
          </button>`,
      )}
    </div>
    <div id="tabela"></div>
  </div>`;
}

function desenharResultado(resultado) {
  const { resumo } = resultado;
  const area = $('despachoAtual');
  area.innerHTML = html`${cabecalhoResultado(resultado)}
    <div class="duas secao">
      ${usoDoApp(resumo.usuariosPorUso)}
      <div class="card pad">
        <h2 class="titulo-card antes-lista">Ordens pendentes por motivo${info(EXPLICACOES.ordensPorMotivo)}</h2>
        <div class="tiny">Todos os usuários do despacho, válidos ou não.</div>
        ${motivosOuNenhum(resumo.ordensPorMotivo, 'ordens', {}, 'Nenhuma.')}
      </div>
    </div>
    ${motivosDosRetornos(resumo)}
    ${tabelasDetalhadas(resultado)}`;
  animar(area);

  const botoes = area.querySelectorAll('.sub-abas button');
  const mostrar = (chave) => {
    for (const botao of botoes) botao.setAttribute('aria-selected', String(botao.dataset.t === chave));
    tabelaFiltro($('tabela'), resultado[chave], COLUNAS[chave], FILTROS[chave]);
  };
  for (const botao of botoes) botao.addEventListener('click', () => mostrar(botao.dataset.t));
  mostrar('usuarios');
  $('bXlsx').addEventListener('click', async () => {
    const liberar = ocupar($('bXlsx'), 'Gerando…');
    try {
      await exportarXlsx(estado.despacho, COLUNAS);
    } finally {
      liberar();
    }
  });
}

/** Busca e desenha o resultado do despacho atual (na primeira visita à aba). */
export async function carregarDespacho() {
  const area = $('despachoAtual');
  mostrarCarregando(area, 'Carregando o resultado do despacho…');
  try {
    estado.despacho = await buscarDespachoAtual();
    desenharResultado(estado.despacho);
  } catch (erro) {
    mostrarFalha(area, erro, 'card vazio');
  }
}
