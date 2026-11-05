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

/** Número principal de uma pergunta: o primeiro com base (vira %), senão o primeiro de todos. */
export function principal(pergunta, porId) {
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

/** Os quatro destaques do topo do dia: ordens recebidas, retornos entregues, apontamentos esgotados e login. */
export function destaquesDoDia(porId) {
  const recebidas = numeroDe(porId, 'C06', 'Recebidos');
  const entregues = numeroDe(porId, 'C07', 'Entregues aos aparelhos');
  return {
    recebidas: recebidas?.base ? recebidas : null,
    entregues: entregues?.base ? entregues : null,
    esgotados: numeroDe(porId, 'C03', 'Apontamentos esgotados'),
    login: numeroDe(porId, 'C09', 'Tempo de resposta do login (ms)'),
  };
}
