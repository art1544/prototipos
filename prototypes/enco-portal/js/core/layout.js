/* ==========================================================================
   ENCO Portal Web · layout comum (topbar + menu lateral), definido uma única vez
   no index.html. Antes cada tela repetia essa marcação dentro do seu iframe.
   ========================================================================== */
(function () {
  var ENCO = window.ENCO;
  function esc(x) { return String(x).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  ENCO.layout = {
    init: function () {
      var app = document.getElementById('app');
      /* Logo embutido (js/data/imagens.js) para aparecer em qualquer forma de abertura */
      document.querySelectorAll('img.logo-img').forEach(function (i) { if (ENCO.img) i.src = ENCO.img.logo; });
      /* Telas até 1024 px: o botão abre e fecha o menu por cima do conteúdo (ver css/shell.css) */
      var estreita = window.matchMedia('(max-width:1024px)');
      document.getElementById('toggleSide').addEventListener('click', function () { app.classList.toggle(estreita.matches ? 'side-open' : 'collapsed'); });
      app.addEventListener('click', function (e) { if (!app.classList.contains('side-open')) return; if (e.target === app || (e.target.closest('.sidebar .nav[data-go]') && !e.target.closest('.nav.grp, [data-sub]'))) app.classList.remove('side-open'); });
      estreita.addEventListener('change', function () { app.classList.remove('side-open'); });
      /* Com o menu só em ícones, "Cadastros" abre o menu completo para mostrar os subitens */
      document.querySelector('.nav[title="Cadastros"]').addEventListener('click', function () { if (estreita.matches) app.classList.add('side-open'); });

      document.querySelectorAll('.sidebar .nav[data-go]').forEach(function (b) {
        if (!ENCO.screenEnabled(b.dataset.go)) { b.hidden = true; return; }
        b.addEventListener('click', function () { ENCO.go(b.dataset.go); });
      });

      /* Título de seção do menu some quando todos os itens dela estão desligados */
      document.querySelectorAll('.sidebar .sec').forEach(function (s) {
        var n = s.nextElementSibling, vazio = true;
        while (n && !n.classList.contains('sec')) { if (!n.hidden) vazio = false; n = n.nextElementSibling; }
        s.hidden = vazio;
      });

      /* Abas que levam a outra tela (ex.: Veículos | Tipos de veículo, Tipos de movimento |
         Prioridades | Não conformidades). Delegado no documento porque as telas redesenham as abas. */
      document.addEventListener('click', function (e) {
        var b = e.target.closest && e.target.closest('#view .gtab[data-go]');
        if (b && !b.classList.contains('on')) ENCO.go(b.dataset.go);
      });
      document.addEventListener('keydown', function (e) {
        var b = e.target.closest && e.target.closest('#view .gtab');
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!b || !d) return;
        var t = [].slice.call(b.parentNode.querySelectorAll('.gtab')), i = t.indexOf(b);
        t[(i + d + t.length) % t.length].focus();
      });

      /* Grupo "Cadastros" expansível */
      var cad = document.querySelector('.nav[title="Cadastros"]'), sub = document.getElementById('subCad');
      if (cad && sub) {
        cad.setAttribute('aria-expanded', sub.classList.contains('open'));
        cad.addEventListener('click', function () { var o = sub.classList.toggle('open'); cad.setAttribute('aria-expanded', o); });
      }

      /* Seletor de área no topo: com uma única área vira um rótulo fixo */
      var lbl = document.querySelector('label.profile');
      if (lbl) {
        var sel = lbl.querySelector('select'), pill = document.createElement('span');
        pill.className = 'profile-pill';
        lbl.appendChild(pill);
        var sync = function () {
          var one = sel.options.length < 2;
          sel.style.display = one ? 'none' : '';
          pill.style.display = one ? '' : 'none';
          pill.textContent = sel.options.length ? sel.options[0].text : '';
        };
        ENCO.bus.on(function (e) {
          if (!e.data || !e.data.encoAreas) return;
          var cur = sel.value;
          sel.innerHTML = e.data.encoAreas.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
          if (e.data.encoAreas.indexOf(cur) >= 0) sel.value = cur;
          sync();
        });
        sync();
      }

      /* Filtros de Prioridade / Tipo de movimento (qPrio / qMov) acompanham os cadastros */
      function refill(id, empty, list) {
        ENCO.eachScreen(function (root) {
          var s = root.querySelector('#' + id); if (!s) return;
          var c = s.value;
          s.innerHTML = '<option value="">' + empty + '</option>' + list.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('');
          if (list.indexOf(c) >= 0) s.value = c;
        });
      }
      ENCO.bus.on(function (e) {
        if (e.data && e.data.encoPrio) refill('qPrio', 'Todas', e.data.encoPrio);
        if (e.data && e.data.encoMov) refill('qMov', 'Todos', e.data.encoMov);
      });
    },

    /* Marca o item ativo no menu e abre o grupo "Cadastros" quando necessário */
    select: function (name) {
      var map = { tipos: 'veiculos', macro: 'pontos', nc: 'movimentos', prioridades: 'movimentos', logs: 'configuracoes' };
      var key = map[name] || name;
      document.querySelectorAll('.sidebar .nav[data-go]').forEach(function (b) {
        var on = b.dataset.go === key;
        b.classList.toggle('on', on);
        if (on) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
      });
      var sub = document.getElementById('subCad'), cad = document.querySelector('.nav[title="Cadastros"]');
      if (sub && sub.querySelector('.nav.on')) { sub.classList.add('open'); if (cad) cad.setAttribute('aria-expanded', 'true'); }
    }
  };
})();
