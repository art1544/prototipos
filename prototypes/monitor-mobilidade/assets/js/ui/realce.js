/**
 * Realce deslizante: em qualquer container com a classe .rl, um único fundo segue o mouse (ou o foco do teclado)
 * entre os filhos, com uma leve mola. Usado no tema, nas abas, no menu, nas linhas de números e nos motivos.
 */

function realceDe(grupo) {
  let realce = grupo.querySelector(':scope > .realce');
  if (!realce) {
    realce = Object.assign(document.createElement('span'), { className: 'realce' });
    realce.setAttribute('aria-hidden', 'true');
    grupo.insertBefore(realce, grupo.firstChild);
  }
  return realce;
}

function itemDe(elemento) {
  const item = elemento?.closest?.('.rl > *');
  if (!item || item.classList.contains('realce') || item.classList.contains('menu-sep')) return null;
  return item;
}

/** Leva o realce até o item (na primeira vez aparece já no lugar, sem deslizar). */
export function moverRealce(item) {
  const realce = realceDe(item.parentElement);
  const mover = () => {
    realce.style.width = `${item.offsetWidth}px`;
    realce.style.height = `${item.offsetHeight}px`;
    realce.style.transform = `translate(${item.offsetLeft}px,${item.offsetTop}px)`;
  };
  if (realce.classList.contains('on')) {
    mover();
    return;
  }
  realce.classList.add('sem-trans');
  mover();
  void realce.offsetWidth; // aplica a posição antes de religar a transição
  realce.classList.remove('sem-trans');
  realce.classList.add('on');
}

/** Liga os eventos no documento (vale também para o conteúdo desenhado depois). */
export function iniciarRealce() {
  document.addEventListener('pointerover', (evento) => {
    const item = itemDe(evento.target);
    if (item) moverRealce(item);
  });
  document.addEventListener('pointerout', (evento) => {
    const grupo = evento.target.closest?.('.rl');
    if (grupo && !grupo.contains(evento.relatedTarget)) grupo.querySelector(':scope > .realce')?.classList.remove('on');
  });
  document.addEventListener('focusin', (evento) => {
    const item = itemDe(evento.target);
    if (item && evento.target.matches(':focus-visible')) moverRealce(item);
  });
}
