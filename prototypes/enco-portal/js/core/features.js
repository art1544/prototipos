/* ==========================================================================
   ENCO Portal Web · feature flags
   Funcionalidades desligadas continuam no código, mas ficam fora do menu,
   das rotas e dos pontos de outras telas que dependem delas.
   Para religar, troque o valor para true e recarregue a página.
   ========================================================================== */
(function () {
  window.ENCO = window.ENCO || {};

  ENCO.features = {
    /* Coletas: hoje não há coletas sendo realizadas no ENCO. Desligado esconde a tela Coletas,
       os indicadores/alertas de coletas da Home, os planos de coleta na Gestão de Planos e as
       funcionalidades "Gestão de coletas pendentes/solicitadas" na Gestão de Perfis. */
    coletas: false,
    /* Nova rota: a rota é definida no tablet ao iniciar a entrega. Desligado esconde "Cadastrar rota"
       e "Duplicar" na tela Rotas; editar e excluir continuam disponíveis. */
    novaRota: false,
    /* Rotas: a rota é definida no tablet ao iniciar a entrega. Desligado esconde a tela Rotas do menu
       e das rotas de navegação, e "Gestão de rotas" na Gestão de Perfis. */
    rotas: false
  };

  /* Telas que pertencem a cada feature */
  ENCO.featureScreens = { coletas: ['coletas'], rotas: ['rotas'] };

  ENCO.feature = function (nome) { return ENCO.features[nome] !== false; };
  ENCO.screenEnabled = function (tela) {
    return Object.keys(ENCO.featureScreens).every(function (f) {
      return ENCO.feature(f) || ENCO.featureScreens[f].indexOf(tela) < 0;
    });
  };
})();
