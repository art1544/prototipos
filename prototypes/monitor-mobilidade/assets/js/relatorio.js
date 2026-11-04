/**
 * Leitura do relatório do dia (JSON de /hoje e /relatorio/{dia}).
 *
 * Formato, resumido: {dataRef, geradoEm, veredito, completo, despacho?, perguntas[], checks[]}.
 * Cada pergunta tem {numero, pergunta, status, resposta, checks: [ids]}; cada check tem
 * {id, titulo, status, numeros[{rotulo, valor, base?, explicacao}], achados[], resumo?, regra, elo, consulta...}.
 */

/** Perguntas do relatório. Relatórios antigos (v1) não têm "perguntas": monta uma por check. */
export function perguntasDe(r) {
  if (r.perguntas) return r.perguntas;
  return r.checks.map(function (c, i) {
    return {numero: i + 1, equipe: '', pergunta: c.titulo, status: c.status, resposta: (c.achados || []).join(' ') || c.regra || '', checks: [c.id]};
  });
}

/** Mapa id do check → check. */
export function checksPorId(r) {
  const porId = {};
  r.checks.forEach(function (c) { porId[c.id] = c; });
  return porId;
}

/** Número de um check pelo rótulo (ex.: C06, "Recebidos"), ou null. */
export function numeroDe(porId, id, rotulo) {
  const c = porId[id]; if (!c || !c.numeros) return null;
  for (let i = 0; i < c.numeros.length; i++) if (c.numeros[i].rotulo === rotulo) return c.numeros[i];
  return null;
}

/** Status de um check, ou null quando o relatório não o tem. */
export function statusDe(porId, id) { return porId[id] ? porId[id].status : null; }

/** Número principal de uma pergunta: o primeiro com base (vira %), senão o primeiro de todos. */
export function principal(p, porId) {
  const nums = [];
  p.checks.forEach(function (id) { const c = porId[id]; (c && c.numeros || []).forEach(function (n) { nums.push(n); }); });
  for (let i = 0; i < nums.length; i++) if (nums[i].base) return nums[i];
  return nums[0] || null;
}

/** Quantas perguntas em cada status; o que não é CRITICO/ATENCAO/OK/FORA conta como SEM (sem dados). */
export function contarStatus(ps) {
  const cont = {CRITICO: 0, ATENCAO: 0, OK: 0, FORA: 0, SEM: 0};
  ps.forEach(function (p) { if (cont[p.status] != null) cont[p.status]++; else cont.SEM++; });
  return cont;
}
