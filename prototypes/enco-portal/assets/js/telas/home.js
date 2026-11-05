/* ==========================================================================
   ENCO Portal Web · Tela: Início  (rota #home)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('home', {
  title: 'Início',
  rootClass: '',
  template: `
    <!--
 INÍCIO (HOME) – tela inicial do portal
 - Saudação, data, perfil e "Atualizado às". Sem atalho de relatório (fica na Gestão de Planos). "Cadastrar planilha" foi retirado do portal.
 - Indicadores clicáveis: em rota agora, aguardando carregamento, coletas aguardando,
   não enviados ao SAP.
 - Rotas em andamento (mini linha do tempo), Precisa da sua atenção, gráfico de
   entregas e coletas dos últimos 7 dias e Atividade recente.
 [OBS-15] Números da Home, do gráfico, e da atividade recente são fictícios;
          na implementação devem vir das mesmas fontes da Gestão de Planos e Coletas.
 Cards e alertas abrem a Gestão de Planos já filtrada (status, Enviado SAP ou os planos do alerta);
          o alerta de pontos sem e-mail abre o plano, onde fica o reenvio por ponto.
-->
<main class="main" id="main">
      <section class="card hero">
        <div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/></svg>
        </div>
        <div>
          <h1 id="greet">Olá, Paola</h1>
          <p><span id="today"></span><span class="upd"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><span id="updTxt"></span></span><button class="ib" id="refresh" style="width:30px;height:30px;border-radius:8px" aria-label="Atualizar informações" title="Atualizar informações"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4"/><path d="M21 3v6h-6"/></svg></button></p>
        </div>
      </section>

      <section class="tiles" aria-label="Resumo da operação" id="tiles"></section>

      <div class="hgrid">
        <section class="card">
          <div class="c-head"><h2>Rotas em andamento</h2><span class="pill" id="rtCount"></span><button class="link" data-plano="">Ver todos os planos<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg></button></div>
          <div class="c-body" id="rotas"></div>
        </section>
        <section class="card">
          <div class="c-head"><h2>Precisa da sua atenção</h2><span class="pill filter" style="padding:4px 10px" id="attCount"></span></div>
          <div class="c-body" id="att"></div>
        </section>
      </div>

      <div class="hgrid">
        <section class="card">
          <div class="c-head"><h2>Entregas e coletas · últimos 7 dias</h2><div class="legend-h" style="margin-left:auto"><span><i style="background:#E0600F"></i>Entregas</span><span><i style="background:#4B45B5"></i>Coletas</span></div></div>
          <div class="kpis-sm" id="wk"></div>
          <div class="chart" id="chart"></div>
        </section>
        <section class="card">
          <div class="c-head"><h2>Atividade recente</h2></div>
          <ol class="feed" id="feed"></ol>
        </section>
      </div>
    </main>
`,
  init: function (root, scr) {
    (function () {
      var $ = function (id) { return scr.byId(id); };
      function go(v) { ENCO.bus.emit({ enco: v }); }
      function pad(n) { return String(n).padStart(2, '0'); }
      function sv(p, s) { return '<svg width="' + (s || 18) + '" height="' + (s || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
      var IC = {
        truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
        inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
        box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
        warn: '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
        chev: '<path d="m9 18 6-6-6-6"/>', check: '<path d="M20 6 9 17l-5-5"/>', x: '<path d="M18 6 6 18M6 6l12 12"/>',
        pin: '<path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
        clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
        sap: '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9 15 3-3 3 3"/><path d="M12 12v6"/>',
        up: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
        user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', unplug: '<path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><path d="M12 2v10"/>'
      };

      /* Cabeçalho */
      var now = new Date(), h = now.getHours();
      $('greet').textContent = (h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite') + ', Paola';
      var dt = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      $('today').textContent = dt.charAt(0).toUpperCase() + dt.slice(1) + ' · Almoxarifado';
      function stamp() { var d = new Date(); $('updTxt').textContent = 'Atualizado às ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
      stamp();
      $('refresh').addEventListener('click', function () { stamp(); });

      /* Indicadores */
      var TILES = [
        { n: 2, lab: 'Planos em rota agora', sub: '5 de 10 pontos atendidos', ic: 'truck', bg: '#E0F0FC', fg: '#1565A8', to: 'planos', escopo: { status: 'Em andamento' } },
        { n: 2, lab: 'Aguardando carregamento', sub: 'Planos em aberto', ic: 'inbox', bg: '#FDEBDD', fg: '#C94F0C', to: 'planos', escopo: { status: 'Em aberto' } },
        { n: 4, lab: 'Coletas aguardando', sub: '3 em rota · 5 coletadas', ic: 'box', bg: '#E3F1F6', fg: '#1E6E8C', to: 'coletas' },
        { n: 5, lab: 'Não enviados ao SAP', sub: 'Exigem reenvio', ic: 'sap', bg: '#FBE4E4', fg: '#B42318', to: 'planos', warn: true, escopo: { envSap: 'Não' } }
      ];
      /* Feature flag Coletas (assets/js/config.js): desligada, some tudo que é de coleta na Home */
      var COL = ENCO.feature('coletas');
      if (!COL) {
        TILES = TILES.filter(function (t) { return t.to !== 'coletas'; });
        /* números sem os planos de coleta (iguais aos da Gestão de Planos) */
        TILES[0].n = 1; TILES[0].sub = '3 de 5 pontos atendidos';
        TILES[1].n = 1;
        TILES[2].n = 2;
        $('tiles').style.gridTemplateColumns = 'repeat(' + TILES.length + ',minmax(0,1fr))';
      }
      $('tiles').innerHTML = TILES.map(function (t, i) {
        return '<button class="tile' + (t.warn ? ' warn' : '') + '" ' + (t.escopo ? 'data-tl="' + i + '"' : 'data-go2="' + t.to + '"') + '><span class="top"><span class="ic" style="background:' + t.bg + ';color:' + t.fg + '">' + sv(IC[t.ic], 20) + '</span><span class="go">' + sv(IC.chev, 18) + '</span></span><span class="num">' + t.n + '</span><span class="lab">' + t.lab + '</span><span class="sub">' + t.sub + '</span></button>';
      }).join('');

      /* Rotas em andamento */
      var ROTAS = [
        { nome: '20260923081205', placa: 'RTA7C90', mot: 'Luciana Ferreira Lima', tipo: 'Entrega', rota: 'Rota 01 – Laminação', upd: 'hoje às 09:31',
          nodes: [['Almoxarifado', 'ok'], ['Laminação', 'ok'], ['Aciaria B16 A', 'nao'], ['Oficina Central', 'next'], ['Almoxarifado', 'pend']], prox: 'Oficina Central' },
        { nome: '20260923094510', placa: 'QPX4B21', mot: 'Marcos Antônio Ribeiro', tipo: 'Coleta', rota: 'Rota 02 – Alto-forno', upd: 'hoje às 10:41',
          nodes: [['Almoxarifado', 'ok'], ['Alto-Forno 2', 'ok'], ['Alto-Forno 1', 'here'], ['Sinterização', 'pend'], ['Almoxarifado', 'pend']], prox: 'No ponto Alto-Forno 1 desde 10:41' }
      ];
      if (!COL) ROTAS = ROTAS.filter(function (r) { return r.tipo !== 'Coleta'; });
      var NI = { ok: IC.check, nao: IC.x, next: IC.pin, here: IC.truck, pend: IC.pin };
      var NL = { ok: 'concluído', nao: 'não entregue', next: 'próximo ponto', here: 'no ponto agora', pend: 'pendente' };
      $('rtCount').textContent = ROTAS.length + (ROTAS.length === 1 ? ' plano' : ' planos');
      $('rotas').innerHTML = ROTAS.map(function (r) {
        var done = r.nodes.filter(function (n) { return n[1] === 'ok' || n[1] === 'nao'; }).length;
        return '<button class="rt" data-plano="' + r.nome + '" aria-label="Plano ' + r.nome + ', ' + done + ' de ' + r.nodes.length + ' concluído. Abrir em Gestão de Planos">' +
          '<span class="rt-top"><b>Plano ' + r.nome + '</b><span class="badge" style="background:#E0F0FC;color:#1565A8"><span class="dot"></span>Em andamento</span><span class="pill">' + r.tipo + '</span><span class="k" style="margin-left:auto;font-size:13px">Progresso <b style="color:#1B1A4A">' + done + ' / ' + r.nodes.length + '</b></span></span>' +
          '<span class="rt-meta"><span>' + sv(IC.truck, 14) + ' Placa <strong>' + r.placa + '</strong></span><span>Motorista <strong>' + r.mot + '</strong></span><span>' + r.rota + '</span></span>' +
          '<span class="mini" aria-hidden="true">' + r.nodes.map(function (n, i) { return '<span class="mn ' + n[1] + '" title="' + pad(i + 1) + '. ' + n[0] + ' – ' + NL[n[1]] + '"><i>' + sv(NI[n[1]], 14) + '</i><span>' + pad(i + 1) + '. ' + n[0] + '</span></span>'; }).join('') + '</span>' +
          '<span class="rt-foot"><span>' + (r.nodes.some(function (n) { return n[1] === 'here'; }) ? '' : 'Próximo: ') + '<b>' + r.prox + '</b></span><span class="spacer"></span><span>' + sv(IC.clock, 14) + ' Última atualização ' + r.upd + '</span></span>' +
        '</button>';
      }).join('');

      /* Atenção. "escopo" diz quais planos a Gestão de Planos mostra ao clicar no card:
         nomes (planos do card, com o detalhe aberto se for um só) ou sap (não enviados ao SAP). */
      var ATT = [
        { ic: 'x', bg: '#FBE4E4', fg: '#B42318', t: 'Entrega não realizada em Aciaria B16 A', s: 'Plano 20260923081205 · Receptor ausente no ponto', to: 'planos', escopo: { nomes: ['20260923081205'] } },
        { ic: 'sap', bg: '#FBE4E4', fg: '#B42318', t: '5 planos não enviados ao SAP', s: 'Confira os planos e reenvie a integração', to: 'planos', escopo: { sap: true } },
        { ic: 'clock', bg: '#FDEBDD', fg: '#A8420A', t: '2 planos em aberto há mais de 24 h', s: 'Aguardando carregamento desde 22/09/2026', to: 'planos', escopo: { nomes: ['20260922171843', '20260922153020'], titulo: 'Em aberto há mais de 24 h' } },
        { ic: 'box', bg: '#E3F1F6', fg: '#1E6E8C', t: '4 coletas aguardando motorista', s: 'A mais antiga foi solicitada há 2 dias', to: 'coletas' },
        { ic: 'mail', bg: '#F1F1F6', fg: '#4A4E6A', t: '2 pontos previstos sem e-mail enviado', s: 'Plano 20260922171843 · Utilidades e Subestação 3', to: 'planos', escopo: { nomes: ['20260922171843'] } }
      ];
      if (!COL) {
        ATT = ATT.filter(function (a) { return a.to !== 'coletas'; });
        ATT[1].t = '2 planos não enviados ao SAP';
        ATT[2].t = '1 plano em aberto há mais de 24 h';
      }
      $('attCount').textContent = ATT.length + ' itens';
      $('att').innerHTML = ATT.map(function (a, i) {
        return '<button class="att-item" ' + (a.escopo ? 'data-att="' + i + '"' : 'data-go2="' + a.to + '"') + '><span class="att-ic" style="background:' + a.bg + ';color:' + a.fg + '">' + sv(IC[a.ic], 18) + '</span><span class="att-txt"><b>' + a.t + '</b><span>' + a.s + '</span></span><span class="chev">' + sv(IC.chev, 16) + '</span></button>';
      }).join('');

      /* Gráfico: últimos 7 dias */
      var DAYS = [], E = [14, 17, 3, 2, 15, 12, 9], C = [5, 6, 1, 0, 7, 4, 3];
      for (var i = 6; i >= 0; i--) { var d = new Date(now); d.setDate(d.getDate() - i); DAYS.push(d); }
      var WD = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      var sumE = E.reduce(function (a, b) { return a + b; }, 0), sumC = C.reduce(function (a, b) { return a + b; }, 0);
      $('wk').innerHTML = '<span><b>' + sumE + '</b>entregas</span>' + (COL ? '<span><b>' + sumC + '</b>coletas</span>' : '');
      if (!COL) {
        C = C.map(function () { return 0; });
        var head = $('chart').parentNode.querySelector('.c-head');
        head.querySelector('h2').textContent = 'Entregas · últimos 7 dias';
        head.querySelector('.legend-h').lastElementChild.remove();
      }
      var W = 640, H = 220, padL = 28, padB = 34, padT = 18, max = 20, gw = (W - padL) / 7, bw = 16;
      function y(v) { return padT + (H - padT - padB) * (1 - v / max); }
      var g = '<g class="grid">' + [0, 5, 10, 15, 20].map(function (v) { return '<line x1="' + padL + '" x2="' + W + '" y1="' + y(v) + '" y2="' + y(v) + '"/><text class="ax" x="' + (padL - 8) + '" y="' + (y(v) + 4) + '" text-anchor="end">' + v + '</text>'; }).join('') + '</g>';
      function bar(x, v, col) { if (!v) return ''; var top = y(v), hh = y(0) - top, r = Math.min(4, hh); return '<path fill="' + col + '" d="M' + x + ',' + y(0) + 'V' + (top + r) + 'Q' + x + ',' + top + ' ' + (x + r) + ',' + top + 'H' + (x + bw - r) + 'Q' + (x + bw) + ',' + top + ' ' + (x + bw) + ',' + (top + r) + 'V' + y(0) + 'Z"/>'; }
      /* Valor visível acima de cada barra */
      function val(x, v) { return v ? '<text class="val" x="' + (x + bw / 2) + '" y="' + (y(v) - 5) + '" text-anchor="middle">' + v + '</text>' : ''; }
      var bars = DAYS.map(function (d, i) {
        var cx = padL + gw * i + gw / 2, x1 = COL ? cx - bw - 1 : cx - bw / 2, x2 = cx + 1;
        var lab = (i === 6 ? 'Hoje' : WD[d.getDay()]) + ' ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1);
        return '<g>' + bar(x1, E[i], '#E0600F') + bar(x2, C[i], '#4B45B5') + val(x1, E[i]) + val(x2, C[i]) +
          '<text class="ax" x="' + cx + '" y="' + (H - 12) + '" text-anchor="middle"' + (i === 6 ? ' style="fill:#1B1A4A;font-weight:800"' : '') + '>' + lab + '</text>' +
          '<rect class="hit" tabindex="0" role="img" aria-label="' + lab + ': ' + E[i] + ' entregas' + (COL ? ' e ' + C[i] + ' coletas' : '') + '" data-i="' + i + '" x="' + (padL + gw * i + 2) + '" y="' + padT + '" width="' + (gw - 4) + '" height="' + (H - padT - padB + 2) + '" rx="8"/></g>';
      }).join('');
      $('chart').innerHTML = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + (COL ? 'Entregas e coletas' : 'Entregas') + ' por dia nos últimos 7 dias">' + g + '<line x1="' + padL + '" x2="' + W + '" y1="' + y(0) + '" y2="' + y(0) + '" stroke="#DFE1EA"/>' + bars + '</svg><div class="tip" id="tip" hidden></div>';
      var tip = $('tip'), svgEl = $('chart').querySelector('svg');
      function showTip(el) {
        var i = +el.dataset.i, d = DAYS[i], r = el.getBoundingClientRect(), c = $('chart').getBoundingClientRect();
        tip.innerHTML = '<div style="opacity:.75">' + (i === 6 ? 'Hoje, ' : WD[d.getDay()] + ', ') + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '</div><div><i style="background:#F7A26B"></i>' + E[i] + ' entregas</div>' + (COL ? '<div><i style="background:#9C97E6"></i>' + C[i] + ' coletas</div>' : '');
        tip.style.left = (r.left - c.left + r.width / 2) + 'px'; tip.style.top = (r.top - c.top + 6) + 'px'; tip.hidden = false;
      }
      svgEl.addEventListener('mouseover', function (e) { if (e.target.classList.contains('hit')) showTip(e.target); });
      svgEl.addEventListener('focusin', function (e) { if (e.target.classList.contains('hit')) showTip(e.target); });
      svgEl.addEventListener('mouseleave', function () { tip.hidden = true; });
      svgEl.addEventListener('focusout', function () { tip.hidden = true; });

      /* Atividade recente */
      var FEED = [
        { ic: 'check', bg: '#E1F3E8', fg: '#1D6B3E', t: 'Plano 20260923132728 finalizado', s: 'Hoje, 10:42 · Adna de Jesus Goncalves' },
        { ic: 'x', bg: '#FBE4E4', fg: '#B42318', t: 'Entrega não realizada em Aciaria B16 A', s: 'Hoje, 09:31 · Luciana Ferreira Lima' },
        { ic: 'mail', bg: '#FDEBDD', fg: '#A8420A', t: 'Relatório de entrega reenviado', s: 'Hoje, 09:12 · Plano 20260921164930 · por Paola Santiago' },
        { ic: 'up', bg: '#E9E8F8', fg: '#4B45B5', t: 'Planilha importada com 3 planos', s: 'Hoje, 07:48 · por Paola Santiago' },
        { ic: 'user', bg: '#F1F1F6', fg: '#4A4E6A', t: 'Usuário Rafael Souza Prado incluído', s: 'Ontem, 16:20 · Perfil Motorista' }
      ];
      $('feed').innerHTML = FEED.map(function (f) { return '<li><span class="fi" style="background:' + f.bg + ';color:' + f.fg + '">' + sv(IC[f.ic], 15) + '</span><span class="ft">' + f.t + '<small>' + f.s + '</small></span></li>'; }).join('');

      /* Navegação */
      scr.onDoc('click', function (e) { var b = e.target.closest('[data-go2]'); if (b) go(b.dataset.go2); });
      /* Card de rota: abre a Gestão de Planos já filtrada pelo plano, com o detalhe aberto */
      scr.onDoc('click', function (e) { var b = e.target.closest('[data-plano]'); if (b) { ENCO.bus.emit({ abrirPlano: b.dataset.plano }); go('planos'); } });
      /* Cards de "Precisa da sua atenção": abre a Gestão de Planos só com os planos do card */
      scr.onDoc('click', function (e) { var b = e.target.closest('[data-att]'); if (b) { ENCO.bus.emit({ abrirPlanos: ATT[+b.dataset.att].escopo }); go('planos'); } });
      /* Indicadores do topo: abrem a Gestão de Planos com o filtro correspondente (Status ou Enviado SAP) */
      scr.onDoc('click', function (e) { var b = e.target.closest('[data-tl]'); if (b) { ENCO.bus.emit({ abrirPlanos: TILES[+b.dataset.tl].escopo }); go('planos'); } });
      
    })();
  }
});
