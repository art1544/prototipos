/* ==========================================================================
   ENCO Portal Web · padrão único dos filtros das listagens
   - Todo filtro tem título visível acima do campo (não só o placeholder).
   - O campo fica destacado (classe .hl, laranja) enquanto estiver filtrando:
     texto digitado ou opção diferente de "Todos".
   As telas redesenham as listas com innerHTML; um MutationObserver aplica o
   padrão sempre que os campos aparecem de novo. A Gestão de Planos e o
   Dashboard já têm títulos próprios e tratam o destaque na própria tela.
   ========================================================================== */
(function () {
  var FILTROS = {
    areas: [['#q', 'Pesquisar área'], ['[data-af]', 'Pesquisar na lista']],
    coletas: [['#q', 'Pesquisar coleta'], ['#fm', 'Tipo de movimento'], ['#pq', 'Pesquisar coleta pendente']],
    dashboards: [['#q', 'Pesquisar entrega'], ['.fbar .segs', 'Período rápido', 1]],
    macro: [['#q', 'Pesquisar macro ponto']],
    movimentos: [['#q', 'Pesquisar tipo de movimento'], ['.segs', 'Categoria']],
    logs: [['#q', 'Pesquisar'], ['#fAcao', 'Ação']],
    nc: [['#q', 'Pesquisar não conformidade'], ['#ft', 'Tipo']],
    pontos: [['#q', 'Pesquisar ponto de descarga'], ['#fm', 'Macro ponto']],
    perfis: [['#q', 'Buscar funcionalidade'], ['.segs', 'Acesso']],
    prioridades: [['#q', 'Pesquisar prioridade']],
    rotas: [['#q', 'Pesquisar rota']],
    tipos: [['#q', 'Pesquisar tipo de veículo']],
    usuarios: [['#q', 'Pesquisar usuário']],
    veiculos: [['#q', 'Placa'], ['#ft', 'Tipo de veículo']]
  };

  /* Campo: destaca quando tem valor. Grupo de botões (.segs): destaca quando a opção ativa não é a primeira ("Todas"). */
  function marcar(el) {
    if (el.classList.contains('segs')) {
      if (el.hasAttribute('data-semdestaque')) return;
      var b = el.querySelectorAll('.seg'), on = el.querySelector('.seg.on');
      el.classList.toggle('hl', !!on && on !== b[0]);
      return;
    }
    el.classList.toggle('hl', !!String(el.value || '').trim());
  }

  function aplicar() {
    Object.keys(FILTROS).forEach(function (tela) {
      var root = document.querySelector('#view [data-screen="' + tela + '"]');
      if (!root) return;
      FILTROS[tela].forEach(function (f) {
        Array.prototype.forEach.call(root.querySelectorAll(f[0]), function (el) {
          var grupo = el.classList.contains('segs');
          if (!grupo && !el.matches('input, select')) return;
          el.setAttribute('data-filtro', '');
          if (f[2]) el.setAttribute('data-semdestaque', '');
          marcar(el);
          var alvo = el.closest('label.search') || el;
          if (alvo.parentNode && alvo.parentNode.classList.contains('ffld')) return;
          /* Envolve o campo com o título; mantém foco e cursor de quem está digitando */
          var foco = document.activeElement === el, ini = foco && el.selectionStart, fim = foco && el.selectionEnd;
          var box = document.createElement('div');
          box.className = 'ffld' + (alvo !== el ? ' ffld-search' : '') + (grupo ? ' ffld-segs' : '');
          if (alvo === el && el.style.width) { box.style.width = el.style.width; el.style.width = '100%'; }
          var id = el.id || ('flt-' + Math.random().toString(36).slice(2, 8));
          if (!el.id) el.id = id;
          box.innerHTML = grupo ? '<span class="lbl ffl" id="' + id + '-t">' + f[1] + '</span>' : '<label class="lbl ffl" for="' + id + '">' + f[1] + '</label>';
          if (grupo) el.setAttribute('aria-labelledby', id + '-t');
          alvo.parentNode.insertBefore(box, alvo);
          box.appendChild(alvo);
          if (foco) { el.focus(); try { el.setSelectionRange(ini, fim); } catch (e) { } }
        });
      });
    });
  }

  document.addEventListener('input', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-filtro')) marcar(e.target); }, true);
  document.addEventListener('change', function (e) { if (e.target.hasAttribute && e.target.hasAttribute('data-filtro')) marcar(e.target); }, true);
  /* Grupos de botões: a tela troca a classe .on no clique; marca depois do clique */
  document.addEventListener('click', function (e) { var g = e.target.closest && e.target.closest('.segs[data-filtro]'); if (g) setTimeout(function () { if (g.isConnected) marcar(g); }, 0); });

  var pendente = false;
  function agendar() { if (pendente) return; pendente = true; Promise.resolve().then(function () { pendente = false; aplicar(); }); }
  document.addEventListener('DOMContentLoaded', function () {
    var view = document.getElementById('view');
    if (!view) return;
    new MutationObserver(agendar).observe(view, { childList: true, subtree: true });
    aplicar();
  });
})();
