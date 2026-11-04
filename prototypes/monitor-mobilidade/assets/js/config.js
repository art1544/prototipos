// Configuração central do protótipo: identidade, regras do backend simuladas e parâmetros de teste.

const params = new URLSearchParams(window.location.search);

function numberParam(name, fallback) {
  const raw = params.get(name);
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const APP = {
  name: 'Monitor Mobilidade',
  version: '1.0.0',
  hubUrl: '../../', // catálogo de protótipos (raiz do repositório)
};

export const API_CONFIG = {
  dbUrl: 'data/db.json',
  storageKey: 'monitor-mobilidade:db', // sempre prefixada pelo id: todos os protótipos dividem o mesmo localStorage
  schemaVersion: 1, // incremente junto com _meta.schemaVersion do db.json ao mudar a estrutura
  requestTimeoutMs: 10000,
  // ?latencia=0 | ?latencia=2000 · ?erros=1 | ?erros=0.3
  latencyMs: numberParam('latencia', null),
  latencyRangeMs: [200, 500],
  failureRate: Math.min(1, Math.max(0, numberParam('erros', 0))),
  // tempo que o "backend" leva para calcular o despacho ou refazer a análise (?calculo=<ms>)
  calculoMs: Math.max(0, numberParam('calculo', 20000)),
};

// Mesmas regras do backend real (MonitorAuth, MonitorService, MonitorStore).
export const REGRAS = {
  sessaoMs: 8 * 60 * 60000, // validade da sessão do monitor
  minutosEntreManuais: 10, // envio de lista e "Rodar agora": no máximo 1 a cada 10 min
  maxOrdens: 5000,
};

export const AMBIENTE = { nome: 'PROTÓTIPO', url: 'Dados de exemplo (data/db.json), sem backend' };

export const MESSAGES = {
  loginRequired: 'Informe usuário e senha.',
  sessionExpired: 'Sessão expirada. Entre de novo.',
  unavailable: 'O backend não respondeu (HTTP 503). Se houve deploy agora, aguarde 1 ou 2 minutos e tente de novo.',
  timeout: 'O servidor demorou para responder. Verifique a conexão.',
  network: 'Não foi possível conectar ao servidor. Verifique a conexão.',
  invalidData: 'O arquivo de dados está inválido ou incompleto.',
  routeNotFound: 'Rota não disponível no monitor local.',
  pdfUnavailable: 'PDF pelo servidor indisponível; use a impressão do navegador.',
  noDispatch: 'Sem resultado de despacho. Envie a lista ou aguarde o cálculo.',
  noReport: 'Sem relatório nesse dia.',
  invalidDate: 'Data inválida. Use aaaa-mm-dd.',
  manualRequested: 'Execução solicitada. Atualize a tela em alguns minutos.',
  listTooSoon: (min) => `Uma lista foi enviada há menos de ${min} min. Aguarde.`,
  noValidOrders: 'Nenhuma ordem válida na lista.',
  tooManyOrders: 'A lista tem mais de 5.000 ordens.',
  futureStart: 'O início do despacho está no futuro.',
  invalidStart: 'Início inválido. Use aaaa-mm-ddThh:mm.',
  missingDispatch: 'Envie inicio (aaaa-mm-ddThh:mm) e ordens (lista).',
};
