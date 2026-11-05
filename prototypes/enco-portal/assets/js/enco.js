/* ==========================================================================
   ENCO Portal Web · núcleo do protótipo (sem build, roda direto do index.html)
   - ENCO.screen(nome, def): registra uma tela (assets/js/telas/*.js).
   - ENCO.go(nome): navega; a rota fica no hash da URL (#planos).
   - ENCO.bus: barramento entre telas (substitui o postMessage dos iframes).
   Cada tela é montada uma única vez e fica guardada fora do DOM quando
   inativa, então filtros, edições e expansões são preservados na navegação.
   [OBS-03] Alterações ficam só em memória: recarregar volta ao estado inicial.
   ========================================================================== */
(function () {
  var ENCO = window.ENCO = window.ENCO || {};
  var defs = {}, order = [], screens = {};
  ENCO.active = null;

  ENCO.screen = function (name, def) { defs[name] = def; order.push(name); };

  /* ---------- Barramento entre telas ---------- */
  var listeners = [];
  ENCO.bus = {
    /* Mesma assinatura do antigo window 'message': fn({ data: msg }) */
    on: function (fn) { listeners.push(fn); },
    emit: function (msg) {
      if (msg && msg.enco) { ENCO.go(msg.enco); return; }
      ENCO.cadastros.absorb(msg);
      listeners.slice().forEach(function (fn) { try { fn({ data: msg }); } catch (e) { console.error(e); } });
    }
  };

  /* Cadastros compartilhados entre telas (antes ficavam no shell dos iframes).
     Quem altera um cadastro emite a lista; as telas dependentes recebem a versão
     atual ao serem montadas e a cada alteração. */
  ENCO.cadastros = {
    areas: ['Almoxarifado'],
    tiposVeiculo: ['Caminhão Baú', 'Caminhão Munck', 'Caminhão Munck (Manserv)', 'Janela', 'Van'],
    macroPontos: ['ACIARIA', 'ADM1', 'ALTO FORNO 1', 'ALTO FORNO 2', 'ALTO FORNO 3', 'COQUERIA', 'ENERGY MEDIA 1', 'LAMINAÇÃO A FRIO', 'LAMINAÇÃO A QUENTE', 'OFICINA CENTRAL', 'PONTO GERAL', 'PORTARIA PRINCIPAL', 'PRIMETALS', 'SEG. E QUALIDADE'],
    veiculosPorTipo: null, pontosPorMacro: null, movimentos: null, prioridades: null,
    absorb: function (m) {
      if (!m) return;
      if (m.areasList) { this.areas = m.areasList; this._fan({ encoAreas: this.areas }); }
      if (m.typesList) { this.tiposVeiculo = m.typesList; this._fan({ encoTypes: this.tiposVeiculo, rename: m.rename || null }); }
      if (m.macroList) { this.macroPontos = m.macroList; this._fan({ encoMacros: this.macroPontos, rename: m.rename || null }); }
      if (m.pdCounts) { this.pontosPorMacro = m.pdCounts; this._fan({ encoPd: m.pdCounts }); }
      if (m.vehCounts) { this.veiculosPorTipo = m.vehCounts; this._fan({ encoVeh: m.vehCounts }); }
      if (m.movList) { this.movimentos = m.movList; this._fan({ encoMov: m.movList }); }
      if (m.prioList) { this.prioridades = m.prioList; this._fan({ encoPrio: m.prioList }); }
    },
    snapshot: function () {
      var s = [{ encoAreas: this.areas }, { encoTypes: this.tiposVeiculo, rename: null }, { encoMacros: this.macroPontos, rename: null }];
      if (this.veiculosPorTipo) s.push({ encoVeh: this.veiculosPorTipo });
      if (this.pontosPorMacro) s.push({ encoPd: this.pontosPorMacro });
      if (this.movimentos) s.push({ encoMov: this.movimentos });
      if (this.prioridades) s.push({ encoPrio: this.prioridades });
      return s;
    },
    _fan: function (msg) { setTimeout(function () { ENCO.bus.emit(msg); }, 0); }
  };

  /* ---------- Isolamento de cada tela ---------- */
  function makeUi(name, root) {
    return {
      root: root,
      layer: root,
      byId: function (id) { return id === 'app' ? root : (root.querySelector('#' + CSS.escape(id)) || document.getElementById(id)); },
      qs: function (sel) { return root.querySelector(sel); },
      qsa: function (sel) { return root.querySelectorAll(sel); },
      onDoc: function (type, fn, opt) { document.addEventListener(type, function (e) { if (ENCO.active === name) fn(e); }, opt); }
    };
  }

  function mount(name) {
    if (screens[name]) return screens[name];
    var def = defs[name], root = document.createElement('section');
    root.className = ('screen ' + (def.rootClass || '')).trim();
    root.dataset.screen = name;
    root.innerHTML = def.template;
    var before = listeners.length;
    try { def.init(root, makeUi(name, root)); } catch (e) { console.error('Erro ao iniciar a tela ' + name, e); }
    /* Entrega aos ouvintes recém-registrados o estado atual dos cadastros */
    var mine = listeners.slice(before);
    ENCO.cadastros.snapshot().forEach(function (m) { mine.forEach(function (fn) { try { fn({ data: m }); } catch (e) { console.error(e); } }); });
    screens[name] = root;
    return root;
  }

  ENCO.eachScreen = function (fn) { Object.keys(screens).forEach(function (k) { fn(screens[k], k); }); };

  /* ---------- Roteamento ---------- */
  ENCO.go = function (name) {
    if (!defs[name] || !ENCO.screenEnabled(name)) name = 'home';
    var host = document.getElementById('view');
    var root = mount(name);
    if (ENCO.active !== name) {
      if (ENCO.active && screens[ENCO.active] && screens[ENCO.active].parentNode) host.removeChild(screens[ENCO.active]);
      host.appendChild(root);
      ENCO.active = name;
    }
    document.body.dataset.screen = name;
    document.title = 'ENCO – ' + defs[name].title;
    ENCO.layout.select(name);
    if (location.hash.slice(1) !== name) { try { history.replaceState(null, '', '#' + name); } catch (e) { location.hash = name; } }
  };

  ENCO.start = function () {
    ENCO.layout.init();
    /* Monta todas as telas uma vez (como os iframes faziam) para que indicadores
       que dependem de outras telas (ex.: veículos por tipo) já estejam disponíveis. */
    order.filter(ENCO.screenEnabled).forEach(mount);
    window.addEventListener('hashchange', function () { ENCO.go(location.hash.slice(1)); });
    ENCO.go(location.hash.slice(1) || 'home');
  };
})();
