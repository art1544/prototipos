/*
 * Tema antes da primeira pintura. Script clássico (não módulo), carregado no <head> de propósito: roda antes do
 * CSS ser aplicado e evita a tela piscar no tema errado. Usa a escolha salva (ui/tema.js, chave em
 * <html data-chave-tema>) ou, sem ela, o tema do sistema operacional.
 */
(function () {
  var raiz = document.documentElement;
  var tema = null;
  try {
    tema = localStorage.getItem(raiz.getAttribute('data-chave-tema'));
  } catch (e) {
    // armazenamento bloqueado
  }
  if (tema !== 'claro' && tema !== 'escuro') {
    tema = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  }
  raiz.setAttribute('data-tema', tema);
})();
