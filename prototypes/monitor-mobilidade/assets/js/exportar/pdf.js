/**
 * "Exportar PDF": monta o relatório do dia como um HTML estático (sem scripts, A4, estilos de css/pdf.css e o logo
 * embutidos) e o envia ao MonitorLocal (POST /pdf), que o imprime em PDF com o Edge/Chrome em modo headless.
 * Sem Edge/Chrome (501), abre a impressão do próprio navegador ("Salvar como PDF"). O texto continua selecionável.
 */
import {servidor} from '../api.js';
import {$, esc, fmt, pct, dataBr} from '../util/formato.js';
import {ROTULO, tituloVeredito} from '../util/status.js';
import {estado} from '../estado.js';
import {perguntasDe, checksPorId, numeroDe, principal, contarStatus} from '../relatorio.js';

/** CSS do PDF e logo em data URI, carregados uma vez: o HTML do relatório precisa ser autossuficiente. */
let recursos = null;
function carregarRecursos() {
  if (!recursos) {
    const css = fetch('assets/css/pdf.css').then(function (r) { if (!r.ok) throw new Error('assets/css/pdf.css: ' + r.status); return r.text(); });
    const logo = fetch('assets/img/mobilidade.png').then(function (r) { return r.blob(); }).then(function (b) {
      return new Promise(function (ok, nao) { const f = new FileReader(); f.onload = function () { ok(f.result); }; f.onerror = nao; f.readAsDataURL(b); });
    });
    recursos = Promise.all([css, logo]).then(function (r) { return {css: r[0], logo: r[1]}; });
    recursos.catch(function () { recursos = null; }); // falhou: tenta de novo no próximo clique
  }
  return recursos;
}

/** Nome do arquivo sem extensão: monitor-mobilidade-aaaa-mm-dd (com o ambiente quando não é produção). */
function nomePdf(r) {
  const a = estado.ambiente;
  return 'monitor-mobilidade-' + r.dataRef + (a && a.nome && a.nome !== 'PRODUÇÃO' ? '-' + a.nome.toLowerCase() : '');
}

function stP(s) { return '<span class="st ' + esc(s) + '">' + esc(ROTULO[s] || s) + '</span>'; }

function tabMot(itens, chave) {
  if (!itens || !itens.length) return '<p style="color:#A1A1AA;margin:2px 0">Nenhum.</p>';
  return '<table class="mot"><tbody>' + itens.map(function (x) {
    return '<tr><td>' + esc(x.motivo) + (x.acao ? '<span class="acao">Ação: ' + esc(x.acao) + '</span>' : '') + '</td><td class="n">' + fmt(x[chave]) + '</td></tr>';
  }).join('') + '</tbody></table>';
}

/** Indicador do topo do PDF; sem número mostra "—" e o motivo. */
function kp(rot, n, suf, vazio) {
  if (!n) return '<div class="kpi"><span>' + esc(rot) + '</span><b>—</b><small>' + esc(vazio) + '</small></div>';
  let t = '<div class="kpi"><span>' + esc(rot) + '</span><b>' + fmt(n.valor) + (suf || '') + '</b>';
  if (n.base) t += '<small>de ' + fmt(n.base) + ' · ' + pct(n.valor, n.base) + '</small><div class="bar"><i style="width:' + Math.min(100, n.valor * 100 / n.base).toFixed(1) + '%"></i></div>';
  return t + '</div>';
}

/**
 * HTML completo do relatório: cabeçalho, veredito, indicadores, índice das perguntas, despacho e,
 * a partir da página 2, cada pergunta em detalhe.
 */
function relatorioPdfHtml(r, css, logo) {
  const ps = perguntasDe(r), porId = checksPorId(r), cont = contarStatus(ps);
  const a = estado.ambiente;
  const amb = a && a.nome ? '<span class="amb ' + esc(a.nome) + '">' + esc(a.nome) + '</span>' : '';
  // o título vira o nome sugerido em "Salvar como PDF" na impressão do navegador
  let h = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>' + esc(nomePdf(r)) + '</title>' +
    '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@600;700&family=Red+Hat+Text:wght@400;500;600&family=Red+Hat+Mono:wght@500;600&display=block">' +
    '<style>' + css + '</style></head><body>';

  h += '<div class="cab"><img alt="Mobilidade" src="' + logo + '"><div class="t"><h1>Monitor Mobilidade' + amb + '</h1><div class="sub">Relatório diário de saúde do app Mobilidade</div></div>' +
    '<div class="dt"><b>' + dataBr(r.dataRef) + '</b><span>gerado às ' + esc(String(r.geradoEm).slice(11, 16)) + ' (Brasília)</span></div></div><div class="faixa"></div>';

  h += '<div class="ver ' + esc(r.veredito) + '"><div style="flex:1"><h2>' + esc(tituloVeredito(r.veredito)) + '</h2><div class="c">' +
    (cont.CRITICO ? '<span><i style="background:#DC2626"></i>' + cont.CRITICO + ' crítica(s)</span>' : '') +
    (cont.ATENCAO ? '<span><i style="background:#F59E0B"></i>' + cont.ATENCAO + ' com atenção</span>' : '') +
    '<span><i style="background:#16A34A"></i>' + cont.OK + ' ok</span>' +
    (cont.FORA ? '<span><i style="background:#D4D4D8"></i>' + cont.FORA + ' fora do monitor</span>' : '') +
    (cont.SEM ? '<span><i style="background:#A1A1AA"></i>' + cont.SEM + ' sem dados</span>' : '') +
    '</div><div class="n">' + ps.length + ' perguntas da rotina diária · ' + (r.completo ? 'todas as consultas responderam' : 'alguma consulta não respondeu') + '</div></div>' + stP(r.veredito) + '</div>';

  // indicadores do dia
  const rec = numeroDe(porId, 'C06', 'Recebidos'), ent = numeroDe(porId, 'C07', 'Entregues aos aparelhos');
  const esg = numeroDe(porId, 'C03', 'Apontamentos esgotados'), lg = numeroDe(porId, 'C09', 'Tempo de resposta do login (ms)');
  h += '<div class="kpis">' + kp('Ordens recebidas', rec && rec.base ? rec : null, '', 'sem lista do despacho') + kp('Retornos entregues', ent && ent.base ? ent : null, '', 'sem lista do despacho') +
    kp('Apontamentos esgotados', esg, '', 'sem dados') + kp('Login do app', lg, ' ms', 'sem dados') + '</div>';

  // índice
  h += '<h3 class="sec">Resumo das perguntas</h3><table class="indice"><thead><tr><th>#</th><th>Pergunta</th><th class="n">Principal</th><th>Status</th></tr></thead><tbody>';
  ps.forEach(function (p) {
    const pr = principal(p, porId);
    h += '<tr><td class="num">' + String(p.numero).padStart(2, '0') + '</td><td>' + esc(p.pergunta) + '</td><td class="n">' + (pr ? fmt(pr.valor) + (pr.base ? '<small>' + pct(pr.valor, pr.base) + '</small>' : '') : '—') + '</td><td>' + stP(p.status) + '</td></tr>';
  });
  h += '</tbody></table>';

  if (r.despacho) h += '<h3 class="sec">Despacho analisado</h3><dl class="desp"><dt>Início</dt><dd>' + dataBr(r.despacho.inicio) + '</dd><dt>Ordens na lista</dt><dd>' + fmt(r.despacho.total) + '</dd><dt>Enviada por</dt><dd>' + esc(r.despacho.enviadoPor) + ' em ' + dataBr(r.despacho.enviadoEm) + '</dd></dl>';

  // detalhe de cada pergunta
  h += '<h3 class="sec quebra">Respostas em detalhe</h3>';
  ps.forEach(function (p) {
    const cs = p.checks.map(function (id) { return porId[id]; }).filter(Boolean), pr = principal(p, porId);
    h += '<div class="perg"><div class="pc"><span class="num">' + String(p.numero).padStart(2, '0') + '</span><h4>' + esc(p.pergunta) + '</h4>' + stP(p.status) + '</div><div class="pb">';
    if (pr && p.status !== 'FORA') h += '<div class="dest"><b>' + fmt(pr.valor) + '</b><span>' + (pr.base ? 'de ' + fmt(pr.base) + ' (' + pct(pr.valor, pr.base) + ') · ' : '') + esc(pr.rotulo) + '</span></div>';
    h += '<p class="resp">' + esc(p.resposta) + '</p>';
    cs.forEach(function (c) {
      const nums = (c.numeros || []).filter(function (n) { return n !== pr; });
      if (nums.length) h += '<table><thead><tr><th>Indicador' + (cs.length > 1 ? ' · ' + esc(c.titulo) : '') + '</th><th class="n">Valor</th></tr></thead><tbody>' +
        nums.map(function (n) { return '<tr><td>' + esc(n.rotulo) + '</td><td class="n">' + fmt(n.valor) + (n.base ? '<small>' + pct(n.valor, n.base) + '</small>' : '') + '</td></tr>'; }).join('') + '</tbody></table>';
      const d = c.resumo && c.resumo.despacho, chave = c.id === 'C06' ? 'ordens' : 'retornos';
      if (d && (d.porMotivo || d.tiPorMotivo)) h += '<div class="duas"><div><h5>Por motivo do usuário · negócio</h5>' + tabMot(d.porMotivo, chave) + '</div><div><h5>Com o sistema · TI</h5>' + tabMot(d.tiPorMotivo, chave) + '</div></div>';
      const ach = (c.achados || []).filter(function (x) { return String(x).trim() !== String(p.resposta || '').trim(); });
      if (ach.length) h += '<h5>O que foi encontrado</h5><ul class="ach">' + ach.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      if (c.erro) h += '<p class="regra"><b>Sem dados:</b> ' + esc(c.erro) + '</p>';
      if (c.regra) h += '<p class="regra"><b>Regra:</b> ' + esc(c.regra) + (c.elo ? ' · <b>Elo:</b> ' + esc(c.elo) : '') + '</p>';
    });
    h += '</div></div>';
  });
  return h + '</body></html>';
}

/** Impressão do navegador, num iframe invisível (removido depois de 1 min). */
function imprimirNoNavegador(html) {
  const f = document.createElement('iframe'); f.style.cssText = 'position:fixed;width:0;height:0;border:0;right:0;bottom:0';
  f.srcdoc = html; document.body.appendChild(f);
  f.onload = function () { setTimeout(function () { f.contentWindow.print(); setTimeout(function () { f.remove(); }, 60000); }, 500); };
}

/** Baixa o PDF gerado pelo servidor (no protótipo não há: vale a impressão do navegador). */
function baixar(blob, nome) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nome; document.body.appendChild(a); a.click();
  setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}

export function iniciarPdf() {
  carregarRecursos().catch(function () { /* nova tentativa no clique */ });
  $('bPdf').addEventListener('click', function () {
    const r = estado.relatorio;
    if (!r) { alert('Ainda não há relatório para exportar.'); return; }
    const b = $('bPdf'), rot = b.querySelector('.rot'), antes = rot.textContent, nome = nomePdf(r) + '.pdf';
    let html = null;
    b.disabled = true; rot.textContent = 'Gerando…';
    carregarRecursos()
      .then(function (x) {
        html = relatorioPdfHtml(r, x.css, x.logo);
        return servidor('pdf?nome=' + encodeURIComponent(nome), {method: 'POST', headers: {'Content-Type': 'text/html; charset=utf-8'}, body: html});
      })
      .then(function (resp) {
        if (resp.status === 501) return null; // sem Edge/Chrome: imprime pelo navegador
        if (!resp.ok) return resp.text().then(function (t) { let m = t; try { m = JSON.parse(t).message || t; } catch (e) { /* texto puro */ } throw new Error(m); });
        return resp.blob();
      })
      .then(function (blob) { if (blob) baixar(blob, nome); else imprimirNoNavegador(html); })
      .catch(function (e) { alert('Não foi possível gerar o PDF: ' + e.message); })
      .then(function () { b.disabled = false; rot.textContent = antes; });
  });
}
