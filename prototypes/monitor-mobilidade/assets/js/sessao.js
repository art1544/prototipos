/**
 * Login e saída. O login é o mesmo do app Mobilidade (/login devolve um JWT); só entram as chaves liberadas
 * no backend (monitor-usuarios-permitidos). O token fica só na memória da página.
 * No protótipo, qualquer usuário e senha preenchidos entram (ver api.js).
 */
import {$} from './util/formato.js';
import {estado} from './estado.js';
import {cabecalhos, servidor} from './api.js';

/**
 * Mostra no topo o 8ID de quem entrou: claim nameid do token (DOMINIO\8ID) ou, sem ele, o usuário digitado.
 * O token não é validado aqui (isso é papel do backend); só é lido para exibir o nome.
 */
function mostrarUsuario(tk, digitado) {
  let id = '';
  try {
    const b = String(tk).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const c = JSON.parse(atob(b + '==='.slice((b.length + 3) % 4)));
    id = String(c.nameid || c.unique_name || c.sub || '');
  } catch (e) { /* token sem payload legível */ }
  if (!id) id = String(digitado || '');
  id = id.split('\\').pop().split('@')[0].trim().toUpperCase();
  $('quemId').textContent = id; $('quem').hidden = !id;
}

/** Volta para o login, limpando a sessão. msg aparece embaixo do formulário (ex.: sessão expirada). */
export function sair(msg) {
  estado.token = null;
  $('quem').hidden = true;
  $('senha').type = 'password'; $('bOlho').setAttribute('aria-pressed', 'false');
  $('app').hidden = true; $('login').hidden = false;
  $('erroLogin').textContent = msg || '';
}

/**
 * Liga o formulário de login (espaços nas pontas são removidos), o olho da senha e o botão Sair.
 * @param {() => void} aoEntrar chamado depois de um login aceito, com a tela principal já visível
 */
export function iniciarSessao(aoEntrar) {
  $('usuario').addEventListener('blur', function () { this.value = this.value.trim(); });

  $('bOlho').addEventListener('click', function () {
    const s = $('senha'), ver = s.type === 'password';
    s.type = ver ? 'text' : 'password';
    this.setAttribute('aria-pressed', ver ? 'true' : 'false');
    this.setAttribute('aria-label', ver ? 'Ocultar senha' : 'Mostrar senha'); this.title = this.getAttribute('aria-label');
    s.focus();
  });

  $('fLogin').addEventListener('submit', function (ev) {
    ev.preventDefault();
    const usuario = $('usuario').value.trim(), senha = $('senha').value.trim();
    $('usuario').value = usuario; $('senha').value = senha;
    if (!usuario || !senha) {
      $('erroLogin').textContent = !usuario ? 'Informe o usuário.' : 'Informe a senha.';
      (!usuario ? $('usuario') : $('senha')).focus();
      return;
    }
    $('erroLogin').textContent = ''; $('bEntrar').disabled = true;
    servidor('login', {method: 'POST', headers: cabecalhos(), body: JSON.stringify({usuario: usuario, senha: senha})})
      .then(function (r) { return r.json().then(function (j) { if (!r.ok) throw new Error(j.message || ('Erro ' + r.status)); return j; }); })
      .then(function (j) {
        estado.token = j.token;
        mostrarUsuario(j.token, $('usuario').value);
        $('senha').value = ''; $('login').hidden = true; $('app').hidden = false;
        aoEntrar();
      })
      .catch(function (e) { $('erroLogin').textContent = e.message; })
      .then(function () { $('bEntrar').disabled = false; });
  });

  $('bSair').addEventListener('click', function () { sair(); });
}
