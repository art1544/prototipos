/* ==========================================================================
   ENCO Portal Web · login
   O portal só é iniciado depois do login. Depois de autenticar, a sessão fica
   guardada na aba (sessionStorage): F5 mantém logado; "Sair" volta para o login.
   Login simulado: aceita qualquer usuário e senha preenchidos.
   ========================================================================== */
(function () {
  var ENCO = window.ENCO, CHAVE = ENCO.app.sessionKey;
  var startPortal = ENCO.start, goPortal = ENCO.go;
  var auth = false, iniciado = false, proxima = 'home', box;
  var TEMPLATE = "<div class=\"page\">\n  <aside class=\"brand\">\n    <img class=\"brand-icon\" src=\"assets/img/enco-icone.png\" alt=\"Ícone ENCO\">\n    <h1>ENCO</h1>\n    <p>Sistema de entregas - Portal Web</p>\n    <span class=\"version\">v1.0.0 · DEV</span>\n  </aside>\n\n  <main class=\"panel\">\n    <img class=\"logo\" src=\"assets/img/ternium.png\" alt=\"Ternium\">\n    <div class=\"form-wrap\">\n      <h2>Fazer Login</h2>\n      <p class=\"sub\">Acesse o Portal ENCO</p>\n      <form id=\"loginForm\" novalidate>\n        <div class=\"field\" id=\"loginFUser\">\n          <div class=\"label-row\"><label for=\"loginUser\">Usuário</label><span class=\"counter\" id=\"loginCounter\">0/20</span></div>\n          <div class=\"input\">\n            <svg class=\"lead\" viewBox=\"0 0 24 24\"><path d=\"M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.4 0-9 2.2-9 5.5V22h18v-2.5c0-3.3-4.6-5.5-9-5.5Z\"/></svg>\n            <input id=\"loginUser\" type=\"text\" maxlength=\"20\" placeholder=\"Digite seu usuário 8ID\" autocomplete=\"username\">\n          </div>\n          <p class=\"err\">Informe seu usuário 8ID.</p>\n        </div>\n        <div class=\"field\" id=\"loginFPass\">\n          <div class=\"label-row\"><label for=\"loginPass\">Senha</label><a href=\"#\" class=\"forgot\" id=\"loginForgot\">Esqueci minha senha</a></div>\n          <div class=\"input\">\n            <svg class=\"lead\" viewBox=\"0 0 24 24\"><path d=\"M18 9h-1V7a5 5 0 0 0-10 0v2H6a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2ZM9 7a3 3 0 0 1 6 0v2H9V7Z\"/></svg>\n            <input id=\"loginPass\" type=\"password\" placeholder=\"Digite sua senha\" autocomplete=\"current-password\">\n            <button type=\"button\" class=\"eye\" id=\"loginEye\" aria-label=\"Mostrar senha\">\n              <svg viewBox=\"0 0 24 24\" id=\"loginEyeIcon\"><path d=\"M12 5C6.5 5 2.7 9.1 1.5 12c1.2 2.9 5 7 10.5 7s9.3-4.1 10.5-7C21.3 9.1 17.5 5 12 5Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z\"/></svg>\n            </button>\n          </div>\n          <p class=\"err\">Informe sua senha.</p>\n        </div>\n        <button class=\"btn\" type=\"button\" id=\"loginSubmit\">Entrar</button>\n        <p class=\"catalogo\">Protótipo: qualquer usuário e senha preenchidos entram.<br><a href=\"../../\">Todos os protótipos</a></p>\n      </form>\n    </div>\n  </main>\n</div>\n<div class=\"toast\" id=\"loginToast\"></div>";
  var EYE_ON = 'M12 5C6.5 5 2.7 9.1 1.5 12c1.2 2.9 5 7 10.5 7s9.3-4.1 10.5-7C21.3 9.1 17.5 5 12 5Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z';
  var EYE_OFF = 'M2.3 3.7 3.7 2.3l18 18-1.4 1.4-3.3-3.3A11 11 0 0 1 12 19c-5.5 0-9.3-4.1-10.5-7a12.7 12.7 0 0 1 4-5.1L2.3 3.7ZM12 5c5.5 0 9.3 4.1 10.5 7a12.6 12.6 0 0 1-3 4.3L16 12.8A4 4 0 0 0 11.2 8L8.8 5.5A10.6 10.6 0 0 1 12 5Zm-3.9 5.5A4 4 0 0 0 13.5 15.9Z';

  try { auth = sessionStorage.getItem(CHAVE) === '1'; } catch (e) {}
  function guardar(on) { auth = on; try { if (on) sessionStorage.setItem(CHAVE, '1'); else sessionStorage.removeItem(CHAVE); } catch (e) {} }
  function hash(v) { try { history.replaceState(null, '', '#' + v); } catch (e) {} }
  function $(id) { return document.getElementById(id); }
  function portal(on) { $('app').style.display = on ? '' : 'none'; if (box) box.hidden = on; }

  function setErr(field, input, on) { field.classList.toggle('has-error', on); input.parentElement.classList.toggle('invalid', on); }
  function aviso(msg) { var t = $('loginToast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove('show'); }, 2600); }

  function limpar() {
    $('loginUser').value = ''; $('loginPass').value = ''; $('loginPass').type = 'password'; $('loginCounter').textContent = '0/20';
    setErr($('loginFUser'), $('loginUser'), false); setErr($('loginFPass'), $('loginPass'), false);
    $('loginEyeIcon').firstElementChild.setAttribute('d', EYE_ON); $('loginEye').setAttribute('aria-label', 'Mostrar senha');
  }

  function mostrarLogin() {
    portal(false); document.title = 'ENCO · Login'; hash('login'); $('loginUser').focus();
  }

  function entrar() {
    guardar(true);
    portal(true);
    var destino = proxima; proxima = 'home';
    if (!iniciado) { iniciado = true; startPortal(); }
    ENCO.go(destino);
  }

  function enviar() {
    var b = $('loginSubmit'), user = $('loginUser'), pass = $('loginPass');
    if (b.disabled) return;
    var u = !user.value.trim(), p = !pass.value;
    setErr($('loginFUser'), user, u); setErr($('loginFPass'), pass, p);
    if (u) { user.focus(); return; }
    if (p) { pass.focus(); return; }
    b.disabled = true; b.innerHTML = '<span class="spinner"></span>Entrando...';
    setTimeout(function () { b.disabled = false; b.textContent = 'Entrar'; limpar(); entrar(); }, 1200);
  }

  function montar() {
    box = document.createElement('div'); box.id = 'login'; box.innerHTML = TEMPLATE;
    document.body.appendChild(box);
    var user = $('loginUser'), pass = $('loginPass');
    user.addEventListener('input', function () { $('loginCounter').textContent = user.value.length + '/20'; if (user.value) setErr($('loginFUser'), user, false); });
    pass.addEventListener('input', function () { if (pass.value) setErr($('loginFPass'), pass, false); });
    $('loginEye').addEventListener('click', function () {
      var show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      $('loginEyeIcon').firstElementChild.setAttribute('d', show ? EYE_OFF : EYE_ON);
      $('loginEye').setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha');
    });
    $('loginForgot').addEventListener('click', function (e) { e.preventDefault(); aviso('Fluxo de recuperação de senha (protótipo)'); });
    /* Clique e Enter tratados direto: alguns visualizadores bloqueiam o envio de formulário */
    $('loginSubmit').addEventListener('click', enviar);
    [user, pass].forEach(function (i) { i.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); enviar(); } }); });
    $('loginForm').addEventListener('submit', function (e) { e.preventDefault(); });
  }

  /* Sem login, nenhuma navegação abre tela: guarda o destino para depois de entrar */
  ENCO.go = function (nome) { if (!auth) { proxima = nome; return; } goPortal(nome); };

  ENCO.start = function () {
    montar();
    document.querySelector('.ib[aria-label="Sair"]').addEventListener('click', function () {
      guardar(false); proxima = 'home'; limpar();
      $('app').classList.remove('side-open');
      mostrarLogin();
    });
    var alvo = location.hash.slice(1);
    if (alvo && alvo !== 'login') proxima = alvo;
    if (auth) { entrar(); return; }
    mostrarLogin();
    /* Durante o carregamento da página o navegador pode ignorar o foco: reforça ao terminar */
    window.addEventListener('load', function () { if (!auth && document.activeElement === document.body) $('loginUser').focus(); });
  };
})();
