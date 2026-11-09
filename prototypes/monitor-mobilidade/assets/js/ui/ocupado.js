/**
 * Feedback de carregamento em botões: desabilita, mostra o indicador giratório e troca o texto enquanto a ação roda.
 */

/**
 * @param {HTMLButtonElement} botao botão da ação; o texto trocado é o do `.rot`, quando existe
 * @param {string} texto texto enquanto a ação roda (ex.: "Entrando…")
 * @returns {() => void} devolve o botão ao estado original
 */
export function ocupar(botao, texto) {
  const rotulo = botao.querySelector('.rot') ?? botao;
  const original = rotulo.textContent;
  botao.disabled = true;
  botao.classList.add('ocupado');
  botao.setAttribute('aria-busy', 'true');
  rotulo.textContent = texto;
  return () => {
    botao.disabled = false;
    botao.classList.remove('ocupado');
    botao.removeAttribute('aria-busy');
    rotulo.textContent = original;
  };
}
