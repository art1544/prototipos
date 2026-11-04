/*
 * Tema antes da primeira pintura. Script clássico (não módulo), carregado no <head> de propósito: roda antes
 * do CSS ser aplicado e evita a tela piscar no tema errado. Usa a escolha salva (ui/tema.js) ou, sem ela,
 * o tema do sistema operacional.
 */
(function () {
  var tema = null;
  try { tema = localStorage.getItem('monitor-mobilidade:tema'); } catch (e) { /* armazenamento bloqueado */ }
  if (tema !== 'claro' && tema !== 'escuro') {
    tema = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'escuro' : 'claro';
  }
  document.documentElement.dataset.tema = tema;
})();
