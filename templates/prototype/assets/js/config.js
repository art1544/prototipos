// Configuração central do protótipo: identidade, parâmetros técnicos e textos de erro.

const params = new URLSearchParams(window.location.search);

function numberParam(name, fallback) {
  const raw = params.get(name);
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const APP = {
  name: '__NAME__',
  version: '0.1.0',
  hubUrl: '../../', // catálogo de protótipos (raiz do repositório)
  toastMs: 2400,
};

export const API_CONFIG = {
  dbUrl: 'data/db.json',
  storageKey: '__ID__:db', // sempre prefixada pelo id: todos os protótipos dividem o mesmo localStorage
  schemaVersion: 1, // incremente junto com _meta.schemaVersion do db.json ao mudar a estrutura
  requestTimeoutMs: 10000,
  // ?latencia=0 | ?latencia=2000 · ?erros=1 | ?erros=0.3
  latencyMs: numberParam('latencia', null),
  latencyRangeMs: [200, 500],
  failureRate: Math.min(1, Math.max(0, numberParam('erros', 0))),
};

export const MESSAGES = {
  required: 'Campo obrigatório.',
  tooLong: (max) => `Máximo de ${max} caracteres.`,
  checkFields: 'Verifique os campos destacados.',
  unexpected: 'Algo deu errado. Tente novamente.',
  unavailable: 'Serviço indisponível no momento. Tente novamente em instantes.',
  timeout: 'O servidor demorou para responder. Verifique a conexão.',
  network: 'Não foi possível conectar ao servidor. Verifique a conexão.',
  invalidData: 'O arquivo de dados está inválido ou incompleto.',
  storageFull: 'Sem espaço para salvar no navegador. Restaure os dados de exemplo.',
};
