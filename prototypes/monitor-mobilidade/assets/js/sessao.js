/**
 * Login, saída e ambiente. O login é o mesmo do app Mobilidade (/login devolve um JWT); só entram as chaves liberadas
 * no backend (monitor-usuarios-permitidos). O token fica na memória da página e no sessionStorage da aba, para o F5 não
 * deslogar: some ao fechar a aba, ao sair, ao vencer (claim exp) ou quando o backend responde 401.
 */
import { APP } from './config.js';
import { $ } from './util/formato.js';
import { estado } from './estado.js';
import { login, buscarAmbiente } from './api.js';
import { ocupar } from './ui/ocupado.js';

/** Chave no sessionStorage; fica em <html data-chave-sessao> porque o tema-inicial.js também a lê. */
const CHAVE_SESSAO = document.documentElement.dataset.chaveSessao || 'monitor-mobilidade.sessao';

/** Tira a marca do tema-inicial.js (<html data-sessao>): daqui em diante quem manda é o atributo hidden. */
const soltarMarcaDeSessao = () => document.documentElement.removeAttribute('data-sessao');

/** Claims do JWT (só leitura, sem validar: isso é papel do backend), ou {} se o payload não for legível. */
function claimsDo(token) {
  try {
    const base64 = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64 + '==='.slice((base64.length + 3) % 4))) || {};
  } catch {
    return {};
  }
}

/** 8ID de quem entrou: claim nameid do token (DOMINIO\8ID) ou, sem ele, o usuário digitado. */
function idDoUsuario(token, digitado) {
  const claims = claimsDo(token);
  const id = String(claims.nameid || claims.unique_name || claims.sub || '');
  return (id || String(digitado || '')).split('\\').pop().split('@')[0].trim().toUpperCase();
}

/** Token ainda dentro da validade (claim exp, com 1 min de folga); sem exp, vale até o backend recusar. */
const tokenVigente = (token) => {
  const exp = Number(claimsDo(token).exp);
  return !exp || exp * 1000 > Date.now() + 60_000;
};

function guardarSessao(token, id) {
  try {
    sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify({ token, id }));
  } catch {
    // sessionStorage indisponível (ex.: bloqueado): o F5 pede login de novo
  }
}

function esquecerSessao() {
  try {
    sessionStorage.removeItem(CHAVE_SESSAO);
  } catch {
    // nada guardado
  }
}

/** Sessão guardada na aba e ainda vigente, ou null. */
function sessaoGuardada() {
  try {
    const sessao = JSON.parse(sessionStorage.getItem(CHAVE_SESSAO) || 'null');
    if (sessao?.token && tokenVigente(sessao.token)) return sessao;
  } catch {
    // conteúdo ilegível
  }
  esquecerSessao();
  return null;
}

/** Mostra a tela principal com o token aceito. */
function abrirApp(token, id, aoEntrar) {
  estado.token = token;
  mostrarUsuario(id);
  $('login').hidden = true;
  $('app').hidden = false;
  soltarMarcaDeSessao();
  aoEntrar();
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
  esquecerSessao();
  $('quem').hidden = true;
  ocultarSenha();
  $('app').hidden = true;
  $('login').hidden = false;
  soltarMarcaDeSessao();
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
  const liberar = ocupar($('bEntrar'), 'Entrando…');
  try {
    const { token } = await login(credenciais.usuario, credenciais.senha);
    const id = idDoUsuario(token, credenciais.usuario);
    $('senha').value = '';
    guardarSessao(token, id);
    abrirApp(token, id, aoEntrar);
  } catch (erro) {
    $('erroLogin').textContent = erro.message;
  } finally {
    liberar();
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

  // F5: retoma a sessão da aba sem pedir login de novo; se o backend recusar o token, o 401 volta ao login
  // (depois que o main.js termina de ligar abas e telas, como num login normal)
  const sessao = sessaoGuardada();
  if (sessao) queueMicrotask(() => abrirApp(sessao.token, sessao.id, aoEntrar));
  else soltarMarcaDeSessao();
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
