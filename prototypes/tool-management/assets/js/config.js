// Configuração central do protótipo: identidade, regras de negócio, textos e aparência.

const params = new URLSearchParams(window.location.search);

function numberParam(name, fallback) {
  const raw = params.get(name);
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const APP = {
  name: 'Tool Management',
  version: 'v1.0.0 · DEV',
  company: 'Ternium',
  hubUrl: '../../', // catálogo de protótipos (raiz do repositório)
  overdueEmailUrl: 'emails/devolucao-atrasada.html', // modelo do e-mail de alerta ao gestor
  currentUserId: 1, // usuário "logado" (tabela users)
  sessionKey: 'tool-management:sessao', // sessionStorage: a sessão dura até fechar a aba
  toastMs: 2400,
  alertToastMs: 4500,
};

export const API_CONFIG = {
  dbUrl: 'data/db.json',
  storageKey: 'tool-management:db',
  schemaVersion: 1,
  requestTimeoutMs: 10000,
  // Parâmetros de URL para testar estados de carregamento e erro:
  //   ?latencia=0    → sem atraso simulado       ?latencia=2000 → 2 s por operação
  //   ?erros=1       → toda operação falha        ?erros=0.3     → 30% das operações falham
  latencyMs: numberParam('latencia', null),
  latencyRangeMs: [250, 600],
  failureRate: Math.min(1, Math.max(0, numberParam('erros', 0))),
};

export const IMAGE = {
  acceptedTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif'],
  maxFileMb: 5,
  maxDimension: 480, // a imagem é reduzida antes de salvar, para caber no localStorage
  quality: 0.82,
  maxStoredChars: 1_500_000,
};

export const LIMITS = {
  codeMax: 20,
  nameMax: 120,
  textMax: 500,
  usernameMax: 20,
  loanMaxDays: 3, // previsão de devolução: de hoje até hoje + 3 dias (inclusive)
};

export const LOGIN = {
  // Login de rede (8ID): o protótipo aceita qualquer usuário e senha preenchidos.
  forgotPasswordUrl: 'https://idm.ternium.net/',
};

// Cores dos badges por status. Os rótulos vêm de data/db.json (toolStatuses / loanStatuses).
export const TOOL_STATUS_STYLE = {
  disponivel: { bg: 'rgba(13,159,181,0.14)', color: '#0d9fb5' },
  em_uso:     { bg: 'rgba(48,56,213,0.12)', color: '#3038d5' },
  manutencao: { bg: 'rgba(249,189,93,0.32)', color: '#8a4a06' },
};

// Cores do gráfico de disponibilidade (dashboard).
export const TOOL_STATUS_CHART_COLOR = {
  disponivel: '#0d9fb5',
  em_uso:     '#3038d5',
  manutencao: '#f9bd5d',
};

export const LOAN_STATUS_STYLE = {
  ativo:     { bg: '#ff7800', color: '#ffffff' },
  devolvido: { bg: '#1a9d5c', color: '#ffffff' },
  atrasado:  { bg: '#e5484d', color: '#ffffff' },
};

export const MESSAGES = {
  required: 'Campo obrigatório.',
  checkFields: 'Verifique os campos destacados.',
  unexpected: 'Algo deu errado. Tente novamente.',
  unavailable: 'Serviço indisponível no momento. Tente novamente em instantes.',
  timeout: 'O servidor demorou para responder. Verifique a conexão e tente novamente.',
  network: 'Não foi possível conectar ao servidor. Verifique a conexão.',
  invalidData: 'O arquivo de dados está inválido ou incompleto.',
  storageUnavailable: 'Este navegador não permite salvar dados. As alterações valem até recarregar a página.',
  storageFull: 'Sem espaço para salvar no navegador. Remova a imagem ou restaure os dados de exemplo.',
  invalidDate: 'Informe uma data válida.',
  dueDateRange: (min, max) => `A previsão de devolução deve ser entre ${min} e ${max}.`,
  loginRequired: 'Informe usuário e senha para continuar.',
  pastMaintenance: 'A próxima manutenção não pode ser anterior a hoje.',
  duplicateCode: 'Já existe uma ferramenta com este código.',
  invalidCode: `Use apenas letras, números e hífen (até ${LIMITS.codeMax} caracteres).`,
  invalidStatus: 'Selecione um status válido.',
  tooLong: (max) => `Máximo de ${max} caracteres.`,
  badgeRequired: 'Informe o ID do inspetor.',
  badgeNotFound: 'ID não encontrado. Verifique e tente novamente.',
  inspectorInactive: 'Inspetor inativo. Procure o administrador do sistema.',
  faceNotRecognized: 'Rosto não reconhecido. Tente novamente ou informe o ID.',
  toolRequired: 'Selecione uma ferramenta.',
  toolUnavailable: 'Esta ferramenta não está mais disponível. Escolha outra.',
  loanNotFound: 'Empréstimo não encontrado.',
  loanAlreadyReturned: 'Este empréstimo já foi devolvido.',
  loanOtherInspector: 'Este empréstimo pertence a outro inspetor.',
  imageType: 'Formato não suportado. Use PNG, JPG, WEBP ou GIF.',
  imageSize: `A imagem deve ter no máximo ${IMAGE.maxFileMb} MB.`,
  imageRead: 'Não foi possível ler a imagem. Tente outro arquivo.',
  imageTooLarge: 'A imagem ficou grande demais para salvar. Tente outra.',
};
