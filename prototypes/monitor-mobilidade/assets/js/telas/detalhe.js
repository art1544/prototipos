/**
 * Modal "Detalhes" de uma pergunta: resposta, e para cada check os números, achados, motivos, tabelas de apoio,
 * exemplos e como é calculado (regra, definição, elo da cadeia, consulta).
 */
import {$, esc, fmt, pct} from '../util/formato.js';
import {chip} from '../util/status.js';
import {info} from '../ui/popover.js';
import {listaMotivos, tabelaSimples} from '../componentes.js';

/** Tabelas de apoio que um check pode trazer em "resumo", com o título exibido. */
const TABELAS = [['filas', 'Filas do Service Bus'], ['por_tipo', 'Por tipo'], ['por_status', 'Por status no SAP']];

/** Liga o fechar do modal (botão e clique fora). */
export function iniciarDetalhe() {
  $('dlgFechar').addEventListener('click', function () { $('dlg').close(); });
  $('dlg').addEventListener('click', function (ev) { if (ev.target === $('dlg')) $('dlg').close(); });
}

export function abrirDetalhe(p, porId) {
  $('dlgTit').innerHTML = '<span class="num">' + String(p.numero).padStart(2, '0') + '</span>' + esc(p.pergunta);
  $('dlgCorpo').innerHTML = '<div class="det-resp">' + chip(p.status) + '<p>' + esc(p.resposta) + '</p></div>' +
    p.checks.map(function (id) { return porId[id] ? detalheCheck(porId[id], p.resposta) : ''; }).join('');
  $('dlg').showModal();
}

function detalheCheck(c, resposta) {
  let h = '<section class="det-sec"><div class="det-cab"><span class="num">' + esc(c.id) + '</span><h4>' + esc(c.titulo) + '</h4>' + chip(c.status) + '</div><div class="det-corpo">';
  if (c.erro) h += '<div class="aviso cr">Sem dados: ' + esc(c.erro) + '</div>';
  if (c.numeros && c.numeros.length) h += '<div class="det-nums">' + c.numeros.map(function (n) {
    return '<div class="det-num"><span>' + esc(n.rotulo) + info(n.explicacao, n.rotulo) + '</span><b>' + fmt(n.valor) + (n.base ? '<small>' + pct(n.valor, n.base) + '</small>' : '') + '</b></div>';
  }).join('') + '</div>';
  // achados iguais à resposta da pergunta não se repetem
  const achados = (c.achados || []).filter(function (x) { return String(x).trim() !== String(resposta || '').trim(); });
  if (achados.length) h += '<div class="det-bloco"><h5>O que foi encontrado</h5><ul class="achados">' + achados.map(function (a) { return '<li>' + esc(a) + '</li>'; }).join('') + '</ul></div>';
  const d = c.resumo && c.resumo.despacho;
  if (d && (d.porMotivo || d.tiPorMotivo)) {
    const chave = c.id === 'C06' ? 'ordens' : 'retornos';
    h += '<div class="duas">' +
      '<div class="det-bloco"><h5>Motivo do usuário' + (c.id === 'C07' ? ' ou do SAP' : '') + ' · negócio</h5>' + (listaMotivos(d.porMotivo, chave, false) || '<span class="tiny">Nenhum.</span>') + '</div>' +
      '<div class="det-bloco"><h5>Com o sistema · TI</h5>' + (listaMotivos(d.tiPorMotivo, chave, true) || '<span class="tiny">Nenhum.</span>') + '</div></div>';
  }
  TABELAS.forEach(function (t) { const l = c.resumo && c.resumo[t[0]]; if (l && l.length) h += '<div class="det-bloco"><h5>' + t[1] + '</h5>' + tabelaSimples(l) + '</div>'; });
  if (c.amostra && c.amostra.length) h += '<details class="dobra"><summary>Exemplos <span>' + fmt(c.amostra.length) + '</span></summary>' + tabelaSimples(c.amostra) + '</details>';
  let meta = '';
  if (c.regra) meta += '<dt>Regra</dt><dd>' + esc(c.regra) + '</dd>';
  if (c.definicao) meta += '<dt>Como é medido</dt><dd>' + esc(c.definicao) + '</dd>';
  if (c.elo) meta += '<dt>Elo da cadeia</dt><dd>' + esc(c.elo) + '</dd>';
  if (c.referencia7d != null) meta += '<dt>Referência 7 dias</dt><dd>' + fmt(c.referencia7d) + ' (mediana)</dd>';
  if (c.consulta) meta += '<dt>Consulta</dt><dd class="mono">' + esc(c.consulta) + '</dd>';
  if (meta) h += '<details class="dobra"><summary>Como é calculado</summary><dl class="meta">' + meta + '</dl></details>';
  return h + '</div></section>';
}
