/**
 * Login, saída e ambiente. O login é o mesmo do app Mobilidade (/login devolve um JWT); só entram as chaves liberadas
 * no backend (monitor-usuarios-permitidos). O token fica só na memória da página.
 */
import { APP } from './config.js';
import { $ } from './util/formato.js';
import { estado } from './estado.js';
import { login, buscarAmbiente } from './api.js';

/**
 * 8ID de quem entrou: claim nameid do token (DOMINIO\8ID) ou, sem ele, o usuário digitado.
 * O token não é validado aqui (isso é papel do backend); só é lido para exibir o nome.
 */
function idDoUsuario(token, digitado) {
  let id = '';
  try {
    const base64 = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(base64 + '==='.slice((base64.length + 3) % 4)));
    id = String(claims.nameid || claims.unique_name || claims.sub || '');
  } catch {
    // token sem payload legível
  }
  return (id || String(digitado || '')).split('\\').pop().split('@')[0].trim().toUpperCase();
}

function mostrarUsuario(id) {
  $('quemId').textContent = id;
  $('quem').hidden = !id;
}

function ocultarSenha() {
  const senha = $('senha');
  const botao = $('bOlho');
  senha.type = 'password';
  botao.setAttribute('aria-pressed', 'false');
}

/** Volta para o login, limpando a sessão. A mensagem aparece embaixo do formulário (ex.: sessão expirada). */
export function sair(mensagem = '') {
  estado.token = null;
  $('quem').hidden = true;
  ocultarSenha();
  $('app').hidden = true;
  $('login').hidden = false;
  $('erroLogin').textContent = mensagem;
}

function alternarSenha() {
  const senha = $('senha');
  const botao = $('bOlho');
  const mostrar = senha.type === 'password';
  const rotulo = mostrar ? 'Ocultar senha' : 'Mostrar senha';
  senha.type = mostrar ? 'text' : 'password';
  botao.setAttribute('aria-pressed', String(mostrar));
  botao.setAttribute('aria-label', rotulo);
  botao.title = rotulo;
  senha.focus();
}

/** Lê e valida o formulário; espaços nas pontas são removidos. @returns {{usuario, senha} | null} */
function lerFormulario() {
  const campoUsuario = $('usuario');
  const campoSenha = $('senha');
  const usuario = campoUsuario.value.trim();
  const senha = campoSenha.value.trim();
  campoUsuario.value = usuario;
  campoSenha.value = senha;
  if (usuario && senha) return { usuario, senha };
  $('erroLogin').textContent = usuario ? 'Informe a senha.' : 'Informe o usuário.';
  (usuario ? campoSenha : campoUsuario).focus();
  return null;
}

async function entrar(aoEntrar) {
  const credenciais = lerFormulario();
  if (!credenciais) return;
  $('erroLogin').textContent = '';
  $('bEntrar').disabled = true;
  try {
    const { token } = await login(credenciais.usuario, credenciais.senha);
    estado.token = token;
    mostrarUsuario(idDoUsuario(token, credenciais.usuario));
    $('senha').value = '';
    $('login').hidden = true;
    $('app').hidden = false;
    aoEntrar();
  } catch (erro) {
    $('erroLogin').textContent = erro.message;
  } finally {
    $('bEntrar').disabled = false;
  }
}

/**
 * Liga o formulário de login, o olho da senha e o botão Sair.
 * @param {() => void} aoEntrar chamado depois de um login aceito, com a tela principal já visível
 */
export function iniciarSessao(aoEntrar) {
  const campoUsuario = $('usuario');
  campoUsuario.addEventListener('blur', () => (campoUsuario.value = campoUsuario.value.trim()));
  $('bOlho').addEventListener('click', alternarSenha);
  $('fLogin').addEventListener('submit', (evento) => {
    evento.preventDefault();
    entrar(aoEntrar);
  });
  $('bSair').addEventListener('click', () => sair());

  if (APP.avisoLogin) $('notaLogin').innerHTML = APP.avisoLogin;
}

/**
 * Mostra o ambiente (DEV, PRODUÇÃO, LOCAL...) ao lado do título e no login (em vermelho quando é produção) e no
 * título da aba do navegador. Também vai no nome do PDF.
 */
export async function carregarAmbiente() {
  const ambiente = await buscarAmbiente();
  if (!ambiente?.nome) return;
  estado.ambiente = ambiente;
  for (const etiqueta of document.querySelectorAll('.amb')) {
    etiqueta.textContent = ambiente.nome;
    etiqueta.className = `amb ${ambiente.nome}`;
    etiqueta.title = ambiente.url;
    etiqueta.hidden = false;
  }
  document.title = `${APP.nome} · ${ambiente.nome}`;
}
