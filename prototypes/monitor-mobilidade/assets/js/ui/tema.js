/**
 * Alternância de tema claro/escuro no topo. A escolha fica no localStorage, na chave definida em
 * <html data-chave-tema>, e é aplicada antes da primeira pintura por tema-inicial.js.
 */

const raiz = document.documentElement;

function marcarBotoes() {
  for (const botao of document.querySelectorAll('.tema button')) {
    botao.setAttribute('aria-pressed', String(botao.dataset.tema === raiz.dataset.tema));
  }
}

function salvar(tema) {
  try {
    localStorage.setItem(raiz.dataset.chaveTema, tema);
  } catch {
    // armazenamento bloqueado: a escolha vale só nesta visita
  }
}

export function iniciarTema() {
  for (const botao of document.querySelectorAll('.tema button')) {
    botao.addEventListener('click', () => {
      raiz.dataset.tema = botao.dataset.tema;
      salvar(botao.dataset.tema);
      marcarBotoes();
    });
  }
  marcarBotoes();
}
