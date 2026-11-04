/**
 * Alternância de tema claro/escuro no topo. A escolha fica no localStorage ("monitor-mobilidade:tema") e é aplicada
 * antes da primeira pintura por tema-inicial.js.
 */

function marcarTema() {
  const t = document.documentElement.dataset.tema;
  document.querySelectorAll('.tema button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tema === t ? 'true' : 'false'); });
}

export function iniciarTema() {
  document.querySelectorAll('.tema button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.documentElement.dataset.tema = b.dataset.tema;
      try { localStorage.setItem('monitor-mobilidade:tema', b.dataset.tema); } catch (e) { /* armazenamento bloqueado: vale só nesta visita */ }
      marcarTema();
    });
  });
  marcarTema();
}
