/**
 * Menu "•••" do topo: abre e fecha com animação, fecha ao clicar fora ou num item, e navega pelo teclado
 * (setas, Esc devolve o foco ao botão).
 */
import {$} from '../util/formato.js';
import {moverRealce} from './realce.js';

export function iniciarMenu() {
  const menu = $('menu'), bMais = $('bMais');

  function abrir() {
    menu.hidden = false; menu.classList.remove('fechando'); void menu.offsetWidth; menu.classList.add('abrindo');
    bMais.setAttribute('aria-expanded', 'true');
  }
  function fechar(foco) {
    if (menu.hidden || menu.classList.contains('fechando')) return;
    bMais.setAttribute('aria-expanded', 'false');
    menu.classList.remove('abrindo'); menu.classList.add('fechando');
    const r = menu.querySelector('.realce'); if (r) r.classList.remove('on');
    setTimeout(function () { if (menu.classList.contains('fechando')) { menu.hidden = true; menu.classList.remove('fechando'); } }, 200);
    if (foco) bMais.focus();
  }

  bMais.addEventListener('click', function (ev) { ev.stopPropagation(); if (menu.hidden || menu.classList.contains('fechando')) abrir(); else fechar(); });
  menu.addEventListener('click', function (ev) { if (ev.target.closest('[role=menuitem]')) fechar(); });
  document.addEventListener('click', function (ev) { if (!menu.hidden && !ev.target.closest('.mais')) fechar(); });
  document.addEventListener('keydown', function (ev) {
    if (menu.hidden) return;
    const itens = [].slice.call(menu.querySelectorAll('[role=menuitem]')), i = itens.indexOf(document.activeElement);
    if (ev.key === 'Escape') { fechar(true); }
    else if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
      ev.preventDefault();
      const n = ev.key === 'ArrowDown' ? (i + 1) % itens.length : (i <= 0 ? itens.length - 1 : i - 1);
      itens[n].focus(); moverRealce(itens[n]);
    }
  });
}
