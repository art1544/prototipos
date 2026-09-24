// Links antigos: antes da coleção, o Tool Management ficava na raiz (ex.: /#/ferramentas).
// Esses endereços agora levam ao protótipo na nova pasta, preservando a tela.
(function () {
  var hash = window.location.hash;
  if (hash.indexOf('#/') === 0) {
    window.location.replace('prototypes/tool-management/' + window.location.search + hash);
  }
}());
