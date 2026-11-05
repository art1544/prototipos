/**
 * Menu "•••" do topo: abre e fecha com animação, fecha ao clicar fora ou num item, e navega pelo teclado
 * (setas; Esc devolve o foco ao botão).
 */
import { $ } from '../util/formato.js';
import { moverRealce } from './realce.js';

const DURACAO_FECHAR_MS = 200;

export function iniciarMenu() {
  const menu = $('menu');
  const botao = $('bMais');
  const fechando = () => menu.classList.contains('fechando');
  const aberto = () => !menu.hidden && !fechando();

  function abrir() {
    menu.hidden = false;
    menu.classList.remove('fechando');
    void menu.offsetWidth; // reinicia a animação de abrir
    menu.classList.add('abrindo');
    botao.setAttribute('aria-expanded', 'true');
  }

  function fechar(devolverFoco = false) {
    if (!aberto()) return;
    botao.setAttribute('aria-expanded', 'false');
    menu.classList.replace('abrindo', 'fechando') || menu.classList.add('fechando');
    menu.querySelector('.realce')?.classList.remove('on');
    setTimeout(() => {
      if (!fechando()) return;
      menu.hidden = true;
      menu.classList.remove('fechando');
    }, DURACAO_FECHAR_MS);
    if (devolverFoco) botao.focus();
  }

  function navegar(evento) {
    const itens = [...menu.querySelectorAll('[role=menuitem]:not([hidden])')];
    const atual = itens.indexOf(document.activeElement);
    const proximo =
      evento.key === 'ArrowDown' ? (atual + 1) % itens.length : atual <= 0 ? itens.length - 1 : atual - 1;
    evento.preventDefault();
    itens[proximo].focus();
    moverRealce(itens[proximo]);
  }

  botao.addEventListener('click', (evento) => {
    evento.stopPropagation();
    if (aberto()) fechar();
    else abrir();
  });
  menu.addEventListener('click', (evento) => {
    if (evento.target.closest('[role=menuitem]')) fechar();
  });
  document.addEventListener('click', (evento) => {
    if (!menu.hidden && !evento.target.closest('.mais')) fechar();
  });
  document.addEventListener('keydown', (evento) => {
    if (menu.hidden) return;
    if (evento.key === 'Escape') fechar(true);
    else if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') navegar(evento);
  });
}
