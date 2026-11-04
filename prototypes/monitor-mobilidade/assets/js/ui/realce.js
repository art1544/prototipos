/**
 * Realce deslizante: em qualquer container com a classe .rl, um único fundo segue o mouse (ou o foco do teclado)
 * entre os filhos, com uma leve mola. Usado no tema, nas abas, no menu, nas linhas de números e nos motivos.
 */

function realceDe(g) {
  let r = g.querySelector(':scope > .realce');
  if (!r) { r = document.createElement('span'); r.className = 'realce'; r.setAttribute('aria-hidden', 'true'); g.insertBefore(r, g.firstChild); }
  return r;
}

function itemRealce(el) {
  const it = el && el.closest && el.closest('.rl > *');
  if (!it || it.classList.contains('realce') || it.classList.contains('menu-sep')) return null;
  return it;
}

/** Leva o realce até o item (na primeira vez aparece já no lugar, sem deslizar). */
export function moverRealce(it) {
  const r = realceDe(it.parentElement);
  const mover = function () { r.style.width = it.offsetWidth + 'px'; r.style.height = it.offsetHeight + 'px'; r.style.transform = 'translate(' + it.offsetLeft + 'px,' + it.offsetTop + 'px)'; };
  if (!r.classList.contains('on')) { r.classList.add('sem-trans'); mover(); void r.offsetWidth; r.classList.remove('sem-trans'); r.classList.add('on'); }
  else mover();
}

/** Liga os eventos no documento (vale também para o conteúdo desenhado depois). */
export function iniciarRealce() {
  document.addEventListener('pointerover', function (ev) { const it = itemRealce(ev.target); if (it) moverRealce(it); });
  document.addEventListener('pointerout', function (ev) {
    const g = ev.target.closest && ev.target.closest('.rl');
    if (g && !(ev.relatedTarget && g.contains(ev.relatedTarget))) { const r = g.querySelector(':scope > .realce'); if (r) r.classList.remove('on'); }
  });
  document.addEventListener('focusin', function (ev) { const it = itemRealce(ev.target); if (it && ev.target.matches(':focus-visible')) moverRealce(it); });
}
