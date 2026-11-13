/**
 * Leitura do relatório do dia (JSON de /hoje e /relatorio/{dia}).
 *
 * Formato, resumido: {dataRef, geradoEm, veredito, completo, despacho?, perguntas[], checks[]}.
 * Cada pergunta tem {numero, pergunta, status, resposta, checks: [ids]}; cada check tem
 * {id, titulo, status, numeros[{rotulo, valor, base?, explicacao}], achados[], resumo?, regra, elo, consulta...}.
 */

/** Checks das perguntas do despacho (motivos negócio × TI), que ocupam duas colunas na grade. */
export const CHECKS_DO_DESPACHO = new Set(['C06', 'C07']);

/** Campo com a quantidade nos motivos de um check do despacho. */
export const chaveDosMotivos = (idCheck) => (idCheck === 'C06' ? 'ordens' : 'retornos');

/** Perguntas do relatório. Relatórios antigos (v1) não têm "perguntas": monta uma por check. */
export function perguntasDe(relatorio) {
  if (relatorio.perguntas) return relatorio.perguntas;
  return relatorio.checks.map((check, i) => ({
    numero: i + 1,
    equipe: '',
    pergunta: check.titulo,
    status: check.status,
    resposta: (check.achados || []).join(' ') || check.regra || '',
    checks: [check.id],
  }));
}

/** Mapa id do check → check. */
export const checksPorId = (relatorio) => Object.fromEntries(relatorio.checks.map((check) => [check.id, check]));

/** Checks de uma pergunta que existem no relatório. */
export const checksDa = (pergunta, porId) => pergunta.checks.map((id) => porId[id]).filter(Boolean);

/** Todos os números dos checks de uma pergunta, na ordem. */
export const numerosDa = (pergunta, porId) => checksDa(pergunta, porId).flatMap((check) => check.numeros || []);

/** Número de um check pelo rótulo (ex.: C06, "Recebidos"), ou null. */
export const numeroDe = (porId, id, rotulo) => porId[id]?.numeros?.find((n) => n.rotulo === rotulo) ?? null;

/** Status de um check, ou null quando o relatório não o tem. */
export const statusDe = (porId, id) => porId[id]?.status ?? null;

/**
 * Números exibidos no canto do cartão, ao lado do destaque. Cada item usa a primeira opção [rótulo, texto] que o relatório
 * tiver (as seguintes são de relatórios antigos):
 * - C06/C07: pendentes de todos os usuários; antes de 13/11/2026 (tarde), o total enviado no despacho;
 * - C01: mensagens na fila de mortas, só quando há alguma, com a cor do status;
 * - C03: os esgotados separados em XML vazio e XML preenchido.
 */
const CANTO = {
  C06: [
    {
      opcoes: [
        ['Ordens pendentes no total (todos os usuários)', 'pendentes no total'],
        ['Envios do despacho (todos os usuários)', 'envios no total'],
        ['Envios do despacho', 'envios no total'],
      ],
    },
  ],
  C07: [
    {
      opcoes: [
        ['Retornos pendentes no total (todos os usuários)', 'pendentes no total'],
        ['Retornos do SAP no despacho', 'retornos no total'],
      ],
    },
  ],
  C01: [{ opcoes: [['Na fila de mortas', 'na fila de mortas']], soAcimaDeZero: true, alerta: true }],
  C03: [{ opcoes: [['Com XML vazio', 'com XML vazio']] }, { opcoes: [['Com XML preenchido', 'com XML preenchido']] }],
};

/** Número em destaque das perguntas do despacho: o que ainda falta chegar a quem pode receber (relatórios a partir de 13/11/2026). */
const PRINCIPAL = {
  C06: 'Ordens pendentes a usuários válidos',
  C07: 'Retornos pendentes a usuários válidos',
};

/**
 * Números do canto do cartão de uma pergunta (pode ser vazio).
 * @returns {{numero: object, texto: string, alerta: boolean}[]}
 */
export function cantoDa(pergunta, porId) {
  const itens = [];
  for (const check of checksDa(pergunta, porId)) {
    for (const def of CANTO[check.id] ?? []) {
      const achado = def.opcoes
        .map(([rotulo, texto]) => ({ numero: numeroDe(porId, check.id, rotulo), texto }))
        .find((opcao) => opcao.numero);
      if (!achado || (def.soAcimaDeZero && !(achado.numero.valor > 0))) continue;
      itens.push({ numero: achado.numero, texto: achado.texto, alerta: Boolean(def.alerta) });
    }
  }
  return itens;
}

/**
 * Diagnóstico do login (C09): o que importa é se funciona; o tempo de resposta é informação secundária.
 * @returns {{titulo: string, curto: string, detalhe: string, status: string} | null} null quando o check não respondeu
 */
function diagnosticoDoLogin(check) {
  if (typeof check?.resumo?.ok !== 'boolean') return null;
  const lento = check.status === 'ATENCAO';
  const [titulo, curto] = !check.resumo.ok ? ['Não, com falha', 'Falha'] : lento ? ['Sim, mas lento', 'Lento'] : ['Sim, funcionando', 'Ok'];
  return { titulo, curto, detalhe: check.resumo.detalhe, status: check.status };
}

/** Diagnóstico de uma pergunta que se responde com um veredito em vez de um número, ou null. */
export const diagnosticoDe = (pergunta, porId) => (pergunta.checks.includes('C09') ? diagnosticoDoLogin(porId.C09) : null);

/**
 * Número principal de uma pergunta: o pendente das perguntas do despacho (PRINCIPAL), senão o primeiro com base (vira %),
 * senão o primeiro de todos; nenhum se ela tem diagnóstico.
 */
export function principal(pergunta, porId) {
  if (diagnosticoDe(pergunta, porId)) return null;
  for (const id of pergunta.checks) {
    const pendentes = PRINCIPAL[id] ? numeroDe(porId, id, PRINCIPAL[id]) : null;
    if (pendentes) return pendentes;
  }
  const numeros = numerosDa(pergunta, porId);
  return numeros.find((n) => n.base) ?? numeros[0] ?? null;
}

/** Quantas perguntas em cada status; o que não é CRITICO/ATENCAO/OK/FORA conta como SEM (sem dados). */
export function contarStatus(perguntas) {
  const contagem = { CRITICO: 0, ATENCAO: 0, OK: 0, FORA: 0, SEM: 0 };
  for (const { status } of perguntas) {
    if (status in contagem) contagem[status]++;
    else contagem.SEM++;
  }
  return contagem;
}

/** Achados de um check que não repetem a resposta da pergunta. */
export const achadosNovos = (check, resposta) =>
  (check.achados || []).filter((achado) => String(achado).trim() !== String(resposta || '').trim());

/**
 * Quantos da base ainda não chegaram ao aparelho (base − recebidos), ex.: 2.511 envios e 2.473 recebidos → 38.
 * @returns {number | null} null quando o número não tem base (sem lista do despacho)
 */
export const naoEnviados = (numero) => (numero?.base ? Math.max(0, numero.base - numero.valor) : null);

/** Números com base que viram "não enviados": recebidos das ordens (C06) e retornos entregues (C07). */
const ROTULOS_COM_FALTANTES = new Set(['Recebidos', 'Entregues aos aparelhos']);

/** "Não enviados" do número em destaque de um cartão, ou null quando o número não é de recebidos/entregues. */
export const naoEnviadosDoDestaque = (numero) => (ROTULOS_COM_FALTANTES.has(numero?.rotulo) ? naoEnviados(numero) : null);

/**
 * Elo da cadeia de um check. Relatórios gravados antes de 13/11/2026 perderam as setas no banco ("SAP ? Function"):
 * a seta volta na exibição.
 */
export const eloDe = (check) => (check?.elo ? String(check.elo).replace(/ \? /g, ' → ') : null);

/**
 * Os quatro destaques do topo do dia: ordens e retornos pendentes a usuários válidos (em relatórios antigos, recebidas e
 * entregues), apontamentos esgotados e login.
 */
export function destaquesDoDia(porId) {
  const recebidas = numeroDe(porId, 'C06', 'Recebidos');
  const entregues = numeroDe(porId, 'C07', 'Entregues aos aparelhos');
  return {
    ordensPendentes: numeroDe(porId, 'C06', PRINCIPAL.C06),
    retornosPendentes: numeroDe(porId, 'C07', PRINCIPAL.C07),
    recebidas: recebidas?.base ? recebidas : null,
    entregues: entregues?.base ? entregues : null,
    esgotados: numeroDe(porId, 'C03', 'Apontamentos esgotados'),
    login: numeroDe(porId, 'C09', 'Tempo de resposta do login (ms)'),
    diagnosticoLogin: diagnosticoDoLogin(porId.C09),
  };
}
