// Configuração central do protótipo: identidade, regras de negócio e parâmetros técnicos.
// Textos exibidos ficam em i18n/ (pt, en, es).

const params = new URLSearchParams(window.location.search);

function numberParam(name, fallback) {
  const raw = params.get(name);
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const APP = {
  name: 'Mobilidade',
  version: '4.0.0',
  environment: 'PRD',
  releasedAt: '2026-09-15', // data fixa da versão (não é deslocada como os dados de exemplo)
  changelog: ['about.changelog1', 'about.changelog2', 'about.changelog3', 'about.changelog4'],
  hubUrl: '../../', // catálogo de protótipos (raiz do repositório)
  currentUserId: 1, // usuário "logado" (tabela users)
  toastMs: 2600,
  alertToastMs: 4500,
};

// Login de rede: o protótipo aceita qualquer usuário e senha preenchidos.
// A sessão dura até fechar a aba (sessionStorage).
export const SESSION = {
  storageKey: 'mobilidade:sessao',
  forgotPasswordUrl: 'https://idm.ternium.net/',
};

export const API_CONFIG = {
  dbUrl: 'data/db.json',
  storageKey: 'mobilidade:db',
  schemaVersion: 2,
  requestTimeoutMs: 10000,
  // Parâmetros de URL para testar estados de carregamento e erro:
  //   ?latencia=0    → sem atraso simulado       ?latencia=2000 → 2 s por operação
  //   ?erros=1       → toda operação falha        ?erros=0.3     → 30% das operações falham
  latencyMs: numberParam('latencia', null),
  latencyRangeMs: [500, 1000],
  failureRate: Math.min(1, Math.max(0, numberParam('erros', 0))),
};

export const LOCALE = {
  storageKey: 'mobilidade:idioma',
  default: 'pt',
  available: [
    { id: 'pt', tag: 'pt-BR', name: 'Português' },
    { id: 'en', tag: 'en', name: 'English' },
    { id: 'es', tag: 'es', name: 'Español' },
  ],
};

// Qualidade da rede exibida no topo. Vem do navegador (navigator.connection / online) e pode ser
// forçada pela URL para demonstração: ?rede=excelente | boa | regular | ruim | sem_sinal
export const NETWORK = {
  levels: {
    excelente: { bars: 4 },
    boa: { bars: 3 },
    regular: { bars: 2 },
    ruim: { bars: 1 },
    sem_sinal: { bars: 0 },
  },
  forced: params.get('rede'),
  fallback: 'boa',
};

export const PHOTO = {
  maxFileMb: 15, // qualquer image/*; formatos que o navegador não decodifica caem em "não foi possível ler"
  maxPerNote: 6,
  maxDimension: 960, // a foto é reduzida antes de salvar, para caber no localStorage
  quality: 0.78,
};

export const LIMITS = {
  orderCodeMax: 20,
  registrationMax: 20,
  shortTextMax: 120,
  longTextMax: 1000,
  peopleMax: 99,
};

// Valores fixos de domínio. Os rótulos vêm do i18n (ex.: priority.emergencia).
export const PRIORITIES = ['emergencia', 'alta', 'normal', 'baixa'];
export const FAILURE_PROBABILITIES = ['baixa', 'media', 'alta', 'iminente'];
export const MAINTENANCE_IMPACTS = ['sem_impacto', 'parcial', 'parada_linha', 'parada_planta'];

export const EMERGENCY_ORDER = {
  type: 'PM10',
  defaultPriority: 'emergencia',
  defaultLocationCode: 'CSA-ACI1-SAMA-BAL1-ESTR-BASE01',
  operationStep: 10, // operações numeradas 0010, 0020, 0030…
};

// Execução das operações da ordem (play / pausa / parar).
export const EXECUTION = {
  autoPauseHours: 6, // operação ativa por mais tempo que isso é pausada automaticamente
  // Ordens sequenciais: só a primeira operação não finalizada fica liberada.
  sequential: { orderType: 'PM02', activityTypes: ['INM'] },
  longPressMs: 500, // toque longo que inicia a seleção no "Concluir todas ordens"
};

export const DEVIATION_REASONS = ['administrativo', 'falha_equipamento', 'falta_material', 'seguranca', 'aguardando_liberacao', 'outro'];

// Status dos eventos de sincronização com o SAP e o grupo (aba) de cada um.
export const EVENT_STATUS_GROUP = {
  PE: 'pendente', // criado no aparelho, aguardando envio
  PER: 'pendente', // reprocessamento solicitado, aguardando envio
  LE: 'aguardando', // enviado ao SAP, aguardando o retorno
  PR: 'processado', // processado com sucesso
  PRE: 'processado', // processado com sucesso (reenvio)
  ER: 'erro', // processado com erro no SAP
};

export const NOTE_DEFAULTS = {
  failureProbability: 'baixa',
  maintenanceImpact: 'sem_impacto',
  priority: 'emergencia',
};
