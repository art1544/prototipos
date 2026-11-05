/**
 * Cliente das rotas do monitor (/v2/monitor/*). Cada função devolve os dados já lidos e rejeita com ApiError.
 */
import { requisitar } from './http.js';
import { estado } from './estado.js';

/** Erro de uma chamada ao backend, com o status HTTP (0 quando nem houve resposta). */
export class ApiError extends Error {
  /**
   * @param {string} mensagem mensagem do backend, pronta para mostrar ao usuário
   * @param {number} status status HTTP
   */
  constructor(mensagem, status) {
    super(mensagem);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Sessão expirada: quem chamou não precisa mostrar nada, a tela já voltou ao login. */
export const sessaoExpirada = (erro) => erro instanceof ApiError && erro.status === 401;

let aoExpirar = () => {};

/** Define o que fazer quando o backend responde 401 (no main.js: voltar ao login). */
export function quandoExpirar(callback) {
  aoExpirar = callback;
}

function cabecalhos() {
  const cabecalho = { 'Content-Type': 'application/json' };
  if (estado.token) cabecalho.Authorization = `Bearer ${estado.token}`;
  return cabecalho;
}

/** Mensagem de erro do corpo da resposta: campo "message" do JSON do backend ou o texto puro. */
async function mensagemDe(resposta) {
  const texto = await resposta.text();
  try {
    return JSON.parse(texto).message || texto;
  } catch {
    return texto;
  }
}

/**
 * @param {string} caminho
 * @param {{metodo?: string, corpo?: object, formato?: 'json' | 'texto'}} [opcoes]
 */
async function chamar(caminho, { metodo = 'GET', corpo, formato = 'json' } = {}) {
  const resposta = await requisitar(caminho, {
    method: metodo,
    headers: cabecalhos(),
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  if (resposta.status === 401) {
    aoExpirar('Sessão expirada. Entre de novo.');
    throw new ApiError('Sessão expirada.', 401);
  }
  if (!resposta.ok) throw new ApiError(await mensagemDe(resposta), resposta.status);
  return formato === 'texto' ? resposta.text() : resposta.json();
}

/**
 * Login com o usuário e a senha do app Mobilidade. Aqui o 401 é "usuário ou senha inválidos", não sessão expirada.
 * @returns {Promise<{token: string}>}
 */
export async function login(usuario, senha) {
  const resposta = await requisitar('login', {
    method: 'POST',
    headers: cabecalhos(),
    body: JSON.stringify({ usuario, senha }),
  });
  const corpo = await resposta.json();
  if (!resposta.ok) throw new ApiError(corpo.message || `Erro ${resposta.status}`, resposta.status);
  return corpo;
}

/**
 * Ambiente para o qual o MonitorLocal repassa as chamadas.
 * @returns {Promise<{nome: string, url: string} | null>} null sem o MonitorLocal (arquivo aberto direto)
 */
export async function buscarAmbiente() {
  try {
    const resposta = await requisitar('ambiente');
    return resposta.ok ? await resposta.json() : null;
  } catch {
    return null;
  }
}

/** Relatório do dia, com os avisos de execução e o estado da chave "ativo". */
export const buscarHoje = () => chamar('hoje');

/** Resumo de cada dia (veredito, status das perguntas e valores principais). */
export const buscarHistorico = (dias) => chamar(`historico?dias=${dias}`);

/** Relatório completo de um dia em Markdown. */
export const buscarRelatorioMarkdown = (dia) => chamar(`relatorio/${dia}?formato=md`, { formato: 'texto' });

/** Resultado do despacho atual: resumo, usuários, ordens e retornos pendentes. */
export const buscarDespachoAtual = () => chamar('despacho/atual');

/**
 * Envia a lista de ordens e o início do despacho; o cálculo roda em segundo plano.
 * @returns {Promise<{id: number, ordens: number}>}
 */
export const enviarDespacho = (inicio, ordens) => chamar('despacho', { metodo: 'POST', corpo: { inicio, ordens } });

/** Roda a análise do dia agora (o backend limita a uma a cada 10 min). @returns {Promise<{mensagem: string}>} */
export const executarAgora = () => chamar('executar', { metodo: 'POST' });

/** Liga ou desliga a análise diária (chave "ativo" da MONITOR_CONFIG). */
export const definirAtivo = (ativo) => chamar('ativo', { metodo: 'POST', corpo: { ativo } });

/**
 * Pede ao MonitorLocal o PDF do relatório (impresso com o Edge/Chrome em modo headless).
 * @returns {Promise<Blob | null>} null quando não há Edge/Chrome (501): a tela usa a impressão do navegador
 */
export async function gerarPdf(nome, html) {
  const resposta = await requisitar(`pdf?nome=${encodeURIComponent(nome)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
    body: html,
  });
  if (resposta.status === 501) return null;
  if (!resposta.ok) throw new ApiError(await mensagemDe(resposta), resposta.status);
  return resposta.blob();
}
