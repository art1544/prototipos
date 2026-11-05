// Configuração central do protótipo: identidade, camada de dados, parâmetros de teste e feature flags.
// Carregado primeiro (ver main.js): cria window.ENCO, que o resto do portal usa.

const params = new URLSearchParams(window.location.search);

function numberParam(name, fallback) {
  const raw = params.get(name);
  if (raw === null || raw.trim() === '') return fallback;
  const value = Number(raw);
  return Number.isFinite(value) ? value : fallback;
}

export const APP = {
  name: 'ENCO – Portal Web',
  version: '3.0.0 - DEV',
  hubUrl: '../../', // catálogo de protótipos (raiz do repositório)
  sessionKey: 'enco-portal:auth', // sessão do login simulado (sessionStorage), prefixada pelo id
};

export const API_CONFIG = {
  dbUrl: 'data/db.json',
  schemaVersion: 1, // incremente junto com _meta.schemaVersion do db.json ao mudar a estrutura
  requestTimeoutMs: 10000,
  // ?latencia=0 | ?latencia=2000 · ?erros=1 | ?erros=0.3
  latencyMs: numberParam('latencia', null),
  latencyRangeMs: [200, 500],
  failureRate: Math.min(1, Math.max(0, numberParam('erros', 0))),
};

export const MESSAGES = {
  timeout: 'O servidor demorou para responder. Verifique a conexão.',
  network: 'Não foi possível conectar ao servidor. Verifique a conexão.',
  invalidData: 'O arquivo de dados está inválido ou incompleto.',
  schema: 'O arquivo de dados é de outra versão do protótipo.',
  unavailable: 'Serviço indisponível no momento (falha simulada). Tente de novo.',
};

/* ==========================================================================
   Feature flags
   Funcionalidades desligadas continuam no código, mas ficam fora do menu,
   das rotas e dos pontos de outras telas que dependem delas.
   Para religar, troque o valor para true e recarregue a página.
   ========================================================================== */
export const FEATURES = {
  /* Coletas: hoje não há coletas sendo realizadas no ENCO. Desligado esconde a tela Coletas,
     os indicadores/alertas de coletas da Home, os planos de coleta na Gestão de Planos e as
     funcionalidades "Gestão de coletas pendentes/solicitadas" na Gestão de Perfis. */
  coletas: false,
  /* Nova rota: a rota é definida no tablet ao iniciar a entrega. Desligado esconde "Cadastrar rota"
     e "Duplicar" na tela Rotas; editar e excluir continuam disponíveis. */
  novaRota: false,
  /* Rotas: a rota é definida no tablet ao iniciar a entrega. Desligado esconde a tela Rotas do menu
     e das rotas de navegação, e "Gestão de rotas" na Gestão de Perfis. */
  rotas: false,
};

const ENCO = window.ENCO = window.ENCO || {};

ENCO.app = APP;
ENCO.features = FEATURES;
/* Telas que pertencem a cada feature */
ENCO.featureScreens = { coletas: ['coletas'], rotas: ['rotas'] };

ENCO.feature = function (nome) { return ENCO.features[nome] !== false; };
ENCO.screenEnabled = function (tela) {
  return Object.keys(ENCO.featureScreens).every(function (f) {
    return ENCO.feature(f) || ENCO.featureScreens[f].indexOf(tela) < 0;
  });
};
