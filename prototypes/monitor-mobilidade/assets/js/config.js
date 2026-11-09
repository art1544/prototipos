/**
 * Configuração do protótipo: a mesma da tela real (APP, URLS, AMBIENTE_PRODUCAO, LIMITES) mais o que só o simulador
 * usa (API_CONFIG, REGRAS, AMBIENTE, MESSAGES). Nada aqui é segredo.
 */

const parametros = new URLSearchParams(location.search);

/** Parâmetro numérico da URL (?latencia=2000), ou o padrão quando ausente ou inválido. */
function numeroDaUrl(nome, padrao) {
  const bruto = parametros.get(nome);
  if (bruto === null || bruto.trim() === '') return padrao;
  const valor = Number(bruto);
  return Number.isFinite(valor) ? valor : padrao;
}

// ---------- iguais à tela real (exceto onde indicado) ----------

export const APP = {
  nome: 'Monitor Mobilidade',
  /** Link "Todos os protótipos" do menu: o catálogo na raiz do repositório. */
  hubUrl: '../../',
  /** Substitui a nota embaixo do formulário de login. */
  avisoLogin: 'Protótipo: qualquer usuário e senha preenchidos entram.<br><a href="../../">Todos os protótipos</a>',
};

export const URLS = {
  /** SheetJS (xlsx 0.18.5) local: a CSP do catálogo só aceita scripts da própria origem. */
  sheetjs: 'assets/js/vendor/xlsx.full.min.js',
  /** Hash do arquivo acima (SRI), o mesmo da cópia do cdnjs usada na tela real. */
  sheetjsIntegridade: 'sha512-r22gChDnGvBylk90+2e/ycr3RVrDi8DIOkIGNhJlKfuyQM4tIRAI062MaV8sfjQKYVGjOBaZBOA87z+IhZE9DA==',
  pdfCss: 'assets/css/pdf.css',
  logo: 'assets/img/mobilidade.png',
};

export const AMBIENTE_PRODUCAO = 'PRODUÇÃO';

export const LIMITES = {
  diasHistorico: 30,
  linhasTabela: 500,
  acompanhamentoIntervaloMs: 15_000,
  acompanhamentoPrazoMs: 8 * 60_000,
  horaRelatorioAtrasado: 8,
};

// ---------- só do simulador ----------

export const API_CONFIG = {
  dbUrl: 'data/db.json',
  /** Sempre prefixada pelo id: todos os protótipos dividem o mesmo localStorage. */
  storageKey: 'monitor-mobilidade:db',
  /** Incremente junto com _meta.schemaVersion do db.json ao mudar a estrutura. */
  schemaVersion: 2,
  requestTimeoutMs: 10_000,
  /** ?latencia=0 | ?latencia=2000 fixa a latência; sem o parâmetro ela varia dentro de latencyRangeMs. */
  latencyMs: numeroDaUrl('latencia', null),
  latencyRangeMs: [200, 500],
  /** ?erros=1 | ?erros=0.3: fração das chamadas que falham com 503. */
  failureRate: Math.min(1, Math.max(0, numeroDaUrl('erros', 0))),
  /** Tempo que o "backend" leva para calcular o despacho ou refazer a análise (?calculo=<ms>). */
  calculoMs: Math.max(0, numeroDaUrl('calculo', 20_000)),
};

/** Mesmas regras do backend real (MonitorAuth, MonitorService, MonitorStore). */
export const REGRAS = {
  /** Validade da sessão do monitor. */
  sessaoMs: 8 * 60 * 60_000,
  /** Envio de lista e "Rodar agora": no máximo 1 a cada 10 min. */
  minutosEntreManuais: 10,
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
