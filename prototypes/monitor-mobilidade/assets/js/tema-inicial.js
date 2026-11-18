/*
 * Antes da primeira pintura. Script clássico (não módulo), carregado no <head> de propósito: roda antes do CSS ser
 * aplicado, enquanto os módulos ES só rodam depois do HTML todo lido.
 *
 * 1. Tema: usa a escolha salva (ui/tema.js, chave em <html data-chave-tema>) ou, sem ela, o tema do sistema
 *    operacional; evita a tela piscar no tema errado.
 * 2. Sessão: com um token ainda vigente no sessionStorage da aba (sessao.js, chave em <html data-chave-sessao>),
 *    marca <html data-sessao> para o CSS já abrir a tela principal; evita o login piscar no F5. O sessao.js tira a
 *    marca ao abrir o app ou ao voltar para o login.
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

  try {
    var sessao = JSON.parse(sessionStorage.getItem(raiz.getAttribute('data-chave-sessao')) || 'null');
    var base64 = sessao && sessao.token ? String(sessao.token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/') : '';
    if (base64) {
      var exp = Number((JSON.parse(atob(base64 + '==='.slice((base64.length + 3) % 4))) || {}).exp);
      if (!exp || exp * 1000 > Date.now() + 60000) raiz.setAttribute('data-sessao', '');
    }
  } catch (e) {
    // sem sessão legível: mostra o login
  }
})();
