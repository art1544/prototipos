/**
 * Aba "Despacho": envio da lista de ordens (planilha do SAP, .csv/.txt ou colada) com o início do despacho, e o
 * resultado para a área de negócio (indicadores, uso do app, motivos e as tabelas de usuários, ordens e retornos).
 */
import {$, esc, fmt, pct, dataBr} from '../util/formato.js';
import {estado} from '../estado.js';
import {api} from '../api.js';
import {EXPL} from '../textos.js';
import {info} from '../ui/popover.js';
import {animar} from '../graficos.js';
import {listaMotivos} from '../componentes.js';
import {carregarSheetJS} from '../util/sheetjs.js';
import {exportarXlsx} from '../exportar/excel.js';
import {tabelaFiltro} from './tabela-filtro.js';
import {carregarHoje} from './hoje.js';

/** Colunas de cada tabela do resultado (também usadas no Excel). A ordem aqui é a ordem na tela. */
export const COLUNAS = {
  usuarios: {usuario: 'ID do usuário', situacao: 'Situação', usoApp: 'Uso do app', ultimoUso: 'Último apontamento', diasSemUsar: 'Dias sem apontar', ordensEnviadas: 'Ordens enviadas',
    ordensRecebidas: 'Recebidas', ordensPendentes: 'Pendentes', ordensForaJanela: 'Fora da janela', retornosPendentes: 'Retornos pendentes', retornosErroSap: 'Erros no SAP', motivo: 'Motivo', acao: 'Ação sugerida'},
  ordens: {usuario: 'ID do usuário', ordem: 'Ordem', descricao: 'Descrição', centro: 'Centro', posto: 'Posto de trabalho', grupo: 'Grupo planejador', inicioPrevisto: 'Início previsto',
    enviadaNoDespacho: 'Enviada no despacho', vinculadaAoUsuario: 'Vinculada ao usuário em', usoApp: 'Uso do app', motivo: 'Motivo', acao: 'Ação sugerida'},
  eventos: {usuario: 'ID do usuário', aparelho: 'Aparelho', evento: 'Evento', tipo: 'Tipo', descricaoTipo: 'Descrição do tipo', statusSap: 'Status no SAP', mensagemSap: 'Mensagem do SAP',
    objetoSap: 'Objeto SAP', objetoRelacionado: 'Objeto relacionado', eventoCriadoEm: 'Evento criado em', retornoSapEm: 'Retorno do SAP em', motivo: 'Motivo', acao: 'Ação sugerida'},
};
/** Filtros de lista de cada tabela. */
const FILTROS = {
  usuarios: {situacao: 'Situação', usoApp: 'Uso do app'},
  ordens: {motivo: 'Motivo', usoApp: 'Uso do app', centro: 'Centro'},
  eventos: {motivo: 'Motivo', statusSap: 'Status no SAP', tipo: 'Tipo'},
};
/** Cores dos grupos de uso do app, do pior (sem aparelho) ao melhor (apontou depois do início). */
const CORES_USO = ['var(--cr)', 'var(--laranja)', 'var(--at-dot)', 'var(--ok)'];
/** Quanto tempo acompanhar o cálculo depois do envio. */
const LIMITE_MS = 8 * 60000;

// ---------- envio da lista ----------

function numeros(texto) { return (texto.match(/\d{1,12}/g) || []); }

/** Atualiza a contagem de ordens distintas (zeros à esquerda não contam). */
function atualizarQtd() {
  const u = {}; numeros($('ordens').value).forEach(function (x) { u[x.replace(/^0+/, '')] = 1; });
  $('qtdLista').textContent = fmt(Object.keys(u).length);
}

/**
 * Lê o arquivo escolhido ou arrastado. Na planilha do SAP (.xlsx) vale a coluna "Ordem" e, se houver a coluna
 * "Mensagem...", só as linhas "Ordem enviada com sucesso". Em .csv/.txt, qualquer número de até 12 dígitos.
 */
function lerArquivo(f) {
  if (!f) return;
  $('msgEnvio').textContent = 'Lendo ' + f.name + '…';
  if (/\.xlsx$/i.test(f.name)) {
    Promise.all([carregarSheetJS(), f.arrayBuffer()]).then(function (r) {
      const wb = r[0].read(r[1]), dados = r[0].utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {header: 1, raw: false});
      let cab = -1, colOrdem = -1, colMsg = -1;
      for (let i = 0; i < Math.min(dados.length, 10) && colOrdem < 0; i++) {
        (dados[i] || []).forEach(function (c, j) { const t = String(c || '').trim().toLowerCase(); if (t === 'ordem') { colOrdem = j; cab = i; } if (t.indexOf('mensagem') === 0) colMsg = j; });
      }
      if (colOrdem < 0) throw new Error('Não achei a coluna "Ordem" nas 10 primeiras linhas.');
      const lista = [];
      dados.slice(cab + 1).forEach(function (l) {
        if (!l) return;
        if (colMsg >= 0 && String(l[colMsg] || '').toLowerCase().indexOf('enviada com sucesso') < 0) return;
        const n = String(l[colOrdem] == null ? '' : l[colOrdem]).trim(); if (/^\d{1,12}$/.test(n)) lista.push(n);
      });
      $('ordens').value = lista.join('\n'); atualizarQtd();
      $('msgEnvio').textContent = f.name + ': ' + fmt(lista.length) + ' ordens enviadas com sucesso.';
    }).catch(function (e) { $('msgEnvio').textContent = e.message; });
  } else {
    f.text().then(function (t) { $('ordens').value = numeros(t).join('\n'); atualizarQtd(); $('msgEnvio').textContent = f.name + ' lido.'; });
  }
}

/** Liga o formulário de envio: textarea, arquivo, arrastar e soltar, e o botão "Enviar e analisar". */
export function iniciarDespacho() {
  $('ordens').addEventListener('input', atualizarQtd);
  $('arquivo').addEventListener('change', function (ev) { lerArquivo(ev.target.files[0]); });
  ['dragenter', 'dragover'].forEach(function (t) { $('drop').addEventListener(t, function (ev) { ev.preventDefault(); $('drop').classList.add('sobre'); }); });
  ['dragleave', 'drop'].forEach(function (t) { $('drop').addEventListener(t, function (ev) { ev.preventDefault(); $('drop').classList.remove('sobre'); }); });
  $('drop').addEventListener('drop', function (ev) { lerArquivo(ev.dataTransfer.files[0]); });

  $('bEnviar').addEventListener('click', function () {
    const lista = numeros($('ordens').value), inicio = $('inicio').value;
    if (!lista.length) { $('msgEnvio').textContent = 'Informe as ordens.'; return; }
    if (!inicio) { $('msgEnvio').textContent = 'Informe o início do despacho.'; return; }
    $('bEnviar').disabled = true; $('msgEnvio').textContent = 'Enviando…';
    api('despacho', {method: 'POST', corpo: {inicio: inicio, ordens: lista}}).then(function (r) {
      $('msgEnvio').textContent = fmt(r.ordens) + ' ordens recebidas. Calculando o despacho e refazendo a análise do dia (leva alguns minutos)…';
      acompanhar(r.id, Date.now());
    }).catch(function (e) { if (e.message !== '401') $('msgEnvio').textContent = e.message; $('bEnviar').disabled = false; });
  });
}

/**
 * Acompanha o cálculo a cada 15 s, por até 8 min: primeiro o resultado do despacho, depois o relatório do dia
 * refeito com esse despacho.
 */
function acompanhar(id, ini) {
  const limite = ini + LIMITE_MS;
  let despachoPronto = false;
  function passo() {
    if (!estado.token) return; // saiu no meio
    if (Date.now() > limite) {
      $('msgEnvio').textContent = despachoPronto ? 'Despacho calculado. As respostas do dia entram na próxima análise (uma análise manual rodou há menos de 10 min).'
        : 'O cálculo está demorando mais que o normal. Atualize a página em alguns minutos.';
      $('bEnviar').disabled = false; return;
    }
    const p = despachoPronto ? Promise.resolve(null) : api('despacho/atual').then(function (d) {
      if (d.despacho && d.despacho.id === id) {
        despachoPronto = true; estado.despacho = d; desenharDespacho(d);
        $('msgEnvio').textContent = 'Despacho calculado. Atualizando as respostas do dia…';
      }
    }).catch(function () { /* tenta de novo no próximo passo */ });
    p.then(function () { return despachoPronto ? api('hoje') : null; }).then(function (h) {
      if (h && h.relatorio && h.relatorio.despacho && h.relatorio.despacho.id === id) {
        $('msgEnvio').textContent = 'Pronto: despacho e respostas do dia atualizados.'; $('bEnviar').disabled = false; carregarHoje(); return;
      }
      setTimeout(passo, 15000);
    }).catch(function () { setTimeout(passo, 15000); });
  }
  setTimeout(passo, 15000);
}

// ---------- resultado para o negócio ----------

export function carregarDespacho() {
  $('despachoAtual').innerHTML = '<div class="carregando">Carregando o resultado do despacho…</div>';
  api('despacho/atual').then(function (d) { estado.despacho = d; desenharDespacho(d); })
    .catch(function (e) { if (e.message !== '401') $('despachoAtual').innerHTML = '<div class="card vazio">' + esc(e.message) + '</div>'; });
}

function tile(rot, v, extra, dest, expl) {
  return '<div class="tile' + (dest ? ' dest' : '') + '"><b data-n="' + esc(v) + '">' + fmt(v) + '</b><span>' + esc(rot) + (extra ? ' · <strong>' + esc(extra) + '</strong>' : '') + info(expl, rot) + '</span></div>';
}

function desenharDespacho(d) {
  const r = d.resumo, rd = r.retornosDespacho;
  let h = '<div class="card pad"><div class="cab-sec"><div><h2 style="font-size:17px">Resultado para a área de negócio</h2>' +
    '<span class="tiny">' + (d.despacho ? 'Despacho iniciado em ' + dataBr(d.despacho.inicio) + ' · ' : '') + 'extração de ' + dataBr(d.extracao) + ' · só as pendências que o negócio trata</span></div>' +
    '<button class="btn prim" id="bXlsx" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg><span class="rot">Baixar Excel</span></button></div>' +
    '<div class="tiles">' +
    tile('Usuários envolvidos', r.usuariosEnvolvidos, null, true, EXPL.usuariosEnvolvidos) +
    tile('Usuários sem pendência', r.semPendencia, pct(r.semPendencia, r.usuariosEnvolvidos), false, EXPL.semPendencia) +
    tile('Usuários com pendência', r.comPendencia, pct(r.comPendencia, r.usuariosEnvolvidos), false, EXPL.comPendencia) +
    tile('Envios de ordem (ordem × usuário)', r.ordensEnviadas, null, true, EXPL.ordensEnviadas) +
    tile('Ordens recebidas', r.ordensRecebidas, pct(r.ordensRecebidas, r.ordensEnviadas), false, EXPL.ordensRecebidas) +
    tile('Ordens pendentes (negócio)', r.ordensPendentes, pct(r.ordensPendentes, r.ordensEnviadas), false, EXPL.ordensPendentes) +
    tile('Fora da janela de 1 mês', r.ordensForaJanela, pct(r.ordensForaJanela, r.ordensEnviadas), false, EXPL.ordensForaJanela) +
    tile('Retornos pendentes (negócio)', r.retornosPendentes, rd && rd.retornos ? pct(r.retornosPendentes, rd.retornos) + ' de ' + fmt(rd.retornos) : null, false, EXPL.retornosPendentes) +
    '</div></div>';

  // usuários por uso do app (barra empilhada + legenda) e ordens por motivo
  const totU = r.usuariosPorUso.reduce(function (a, x) { return a + x.usuarios; }, 0) || 1;
  h += '<div class="duas secao"><div class="card pad"><h2 style="font-size:15px">Usuários por uso do app' + info(EXPL.usuariosPorUso) + '</h2><div class="tiny">Pelo último apontamento no app (a base guarda 15 dias).</div>' +
    '<div class="pilha">' + r.usuariosPorUso.map(function (x, i) { return '<i style="width:' + (x.usuarios * 100 / totU).toFixed(2) + '%;background:' + CORES_USO[i % 4] + '" title="' + esc(x.uso) + '"></i>'; }).join('') + '</div>' +
    '<div class="leg"><span></span><span class="tiny">Uso do app</span><span class="tiny n">Usuários</span><span class="tiny n">Ordens pendentes</span>' +
    r.usuariosPorUso.map(function (x, i) { return '<i style="background:' + CORES_USO[i % 4] + '"></i><span>' + esc(x.uso) + '</span><span class="n">' + fmt(x.usuarios) + ' <span class="tiny">(' + pct(x.usuarios, totU) + ')</span></span><span class="n">' + fmt(x.ordensPendentes) + '</span>'; }).join('') +
    '</div></div>' +
    '<div class="card pad"><h2 style="font-size:15px;margin-bottom:12px">Ordens pendentes por motivo' + info(EXPL.ordensPorMotivo) + '</h2>' + (listaMotivos(r.ordensPorMotivo, 'ordens') || '<span class="tiny">Nenhuma.</span>') + '</div></div>';
  h += '<div class="card pad secao"><h2 style="font-size:15px;margin-bottom:12px">Retornos de evento pendentes por motivo' + info(EXPL.retornosPorMotivo) + '</h2>' + (listaMotivos(r.retornosPorMotivo, 'retornos') || '<span class="tiny">Nenhum.</span>') +
    (r.concentracaoRetornos && r.concentracaoRetornos.length ? '<p class="tiny" style="margin:12px 0 0">Concentração: ' + r.concentracaoRetornos.map(function (c) { return esc(c.usuario) + ' (' + fmt(c.retornos) + ')'; }).join(', ') + ' respondem pela maior parte dos retornos pendentes.</p>' : '') + '</div>';

  // tabelas detalhadas em sub-abas
  h += '<div class="card pad secao"><div class="sub-abas rl" role="tablist">' +
    '<button type="button" data-t="usuarios" aria-selected="true">Usuários <span>' + fmt(d.usuarios.length) + '</span></button>' +
    '<button type="button" data-t="ordens" aria-selected="false">Ordens pendentes <span>' + fmt(d.ordens.length) + '</span></button>' +
    '<button type="button" data-t="eventos" aria-selected="false">Retornos pendentes <span>' + fmt(d.eventos.length) + '</span></button></div><div id="tabela"></div></div>';
  $('despachoAtual').innerHTML = h;
  animar($('despachoAtual'));

  function mostrar(t) {
    document.querySelectorAll('.sub-abas button').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.t === t ? 'true' : 'false'); });
    tabelaFiltro($('tabela'), d[t], COLUNAS[t], FILTROS[t]);
  }
  document.querySelectorAll('.sub-abas button').forEach(function (b) { b.addEventListener('click', function () { mostrar(b.dataset.t); }); });
  mostrar('usuarios');
  $('bXlsx').addEventListener('click', function () { exportarXlsx(estado.despacho, COLUNAS); });
}
