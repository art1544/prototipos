/**
 * Aba "Histórico" (30 dias): mapa de calor pergunta × dia e as séries dos principais números, em barras.
 * Os dados vêm de /historico, que o backend guarda por 180 dias (MONITOR_EXECUCAO).
 */
import {$, esc, fmt, dataBr} from '../util/formato.js';
import {ROTULO} from '../util/status.js';
import {estado} from '../estado.js';
import {api, falha} from '../api.js';
import {EXPL} from '../textos.js';
import {info} from '../ui/popover.js';
import {perguntasDe} from '../relatorio.js';

const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
/** Séries exibidas: id do check e título do gráfico. */
const SERIES = [['C06', 'Ordens pendentes (envios)'], ['C07', 'Retornos pendentes'], ['C03', 'Apontamentos esgotados'], ['C09', 'Login: tempo de resposta (ms)']];

export function carregarHistorico() {
  const el = $('aba-historico');
  el.innerHTML = '<div class="carregando">Carregando…</div>';
  api('historico?dias=30').then(function (l) {
    if (!l.length) { el.innerHTML = '<div class="card vazio">Sem histórico ainda.</div>'; return; }
    el.innerHTML = '<div class="topo-rel hist">' + mapaDeCalor(l) +
      '<div class="series">' + SERIES.map(function (s) { return serie(l, s[0], s[1]); }).join('') + '</div></div>';
  }).catch(function (e) { falha(el, e); });
}

/** Grade pergunta × dia (mais recente à direita), com o total de dias OK em cada linha. */
function mapaDeCalor(l) {
  // números e títulos das perguntas: do relatório do dia, quando já carregado
  const r = estado.relatorio;
  const nums = r ? perguntasDe(r).map(function (p) { return p.numero; }) : [1, 2, 3, 4, 5, 6, 7, 8];
  const tit = {}; (r ? perguntasDe(r) : []).forEach(function (p) { tit[p.numero] = p.pergunta; });
  const dias = l.slice().reverse(), nd = dias.length;

  let h = '<div class="card pad"><div class="cab-sec"><h2 style="font-size:15px">Respostas por dia' + info(EXPL.matriz) + '</h2>' +
    '<span class="tiny">' + nd + ' dia(s) · mais recente à direita</span></div><div class="mapa-h" style="--dias:' + nd + '"><div></div>';
  dias.forEach(function (d, i) {
    const m = String(d.data).match(/^(\d{4})-(\d{2})-(\d{2})/), dt = m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
    h += '<div class="mh-dia' + (i === nd - 1 ? ' hoje' : '') + '" title="' + dataBr(d.data) + '">' + (dt ? DIAS_SEMANA[dt.getDay()] + '<b>' + m[3] + '</b>' : '') + '</div>';
  });
  h += '<div class="mh-tot">OK</div>';

  function linha(rot, classe, valorDe, num) {
    let ok = 0, tem = 0, t = '<div class="mh-rot ' + classe + '" title="' + esc(rot) + '">' + (num ? '<span class="num">' + num + '</span>' : '') + '<span>' + esc(rot) + '</span></div>';
    dias.forEach(function (d, i) {
      const st = valorDe(d); if (st) { tem++; if (st === 'OK') ok++; }
      t += '<div class="mh-cel ' + esc(st || 'vazia') + (i === nd - 1 ? ' ult' : '') + '" style="animation-delay:' + (i * 25) + 'ms" title="' + dataBr(d.data) + ' · ' + esc(rot) + ': ' + esc(st ? (ROTULO[st] || st) : 'sem relatório') + '"></div>';
    });
    return t + '<div class="mh-tot"><b>' + ok + '</b>/' + tem + '</div>';
  }

  h += linha('Veredito do dia', 'ver-d', function (d) { return d.veredito; }) + '<div class="mh-sep"></div>';
  nums.forEach(function (n) { h += linha(tit[n] || ('Pergunta ' + n), '', function (d) { return (d.perguntas || {})[String(n)]; }, String(n).padStart(2, '0')); });
  return h + '</div><div class="mh-leg">' + ['OK', 'ATENCAO', 'CRITICO', 'FORA', 'SEM_DADOS'].map(function (s) { return '<span><i class="mh-cel ' + s + '"></i>' + ROTULO[s] + '</span>'; }).join('') + '</div></div>';
}

/**
 * Série de um número ao longo dos dias, em barras HTML (não SVG: a fonte fica no tamanho real em qualquer
 * largura de cartão). Mostra o último valor, a variação contra o dia anterior, mínimo, média e máximo.
 * @returns {string} vazio quando nenhum dia tem o valor
 */
function serie(l, id, rot) {
  const dias = l.slice().reverse();
  const pts = dias.map(function (d) { return d.valores ? d.valores[id] : null; });
  const val = pts.filter(function (v) { return v != null; });
  if (!val.length) return '';
  const max = Math.max.apply(null, val) || 1, min = Math.min.apply(null, val);
  const med = val.reduce(function (a, b) { return a + b; }, 0) / val.length;
  let ult = -1; pts.forEach(function (v, i) { if (v != null) ult = i; });
  const alto = function (v) { return Math.max(1.5, v * 100 / max); };
  const barras = pts.map(function (v, i) {
    const dia = String(dataBr(dias[i].data)).slice(0, 5);
    if (v == null) return '<div class="g-col vazia" title="' + dia + ': sem dado"><i></i></div>';
    return '<div class="g-col' + (i === ult ? ' ult' : '') + '" title="' + dia + ': ' + fmt(v) + '">' +
      '<i style="height:' + alto(v).toFixed(1) + '%;animation-delay:' + (i * 35) + 'ms">' + (i === ult ? '<span class="g-tag">' + fmt(v) + '</span>' : '') + '</i></div>';
  }).join('');
  const datas = dias.map(function (d, i) { return '<span' + (i === ult ? ' class="ult"' : '') + '>' + String(dataBr(d.data)).slice(0, 5) + '</span>'; }).join('');
  let anterior = null; for (let k = ult - 1; k >= 0; k--) if (pts[k] != null) { anterior = pts[k]; break; }
  let delta = '';
  if (anterior != null) {
    const dif = pts[ult] - anterior;
    delta = '<span class="g-delta' + (dif > 0 ? ' sobe' : dif < 0 ? ' desce' : '') + '">' + (dif > 0 ? '▲ ' : dif < 0 ? '▼ ' : '') + (dif === 0 ? 'igual a ontem' : fmt(Math.abs(dif)) + ' vs. dia anterior') + '</span>';
  }
  return '<div class="card pad serie"><span class="tiny g-tit">' + esc(rot) + info(EXPL[id], rot) + '</span>' +
    '<div class="g-cab"><b data-n="' + esc(pts[ult]) + '">' + fmt(pts[ult]) + '</b>' + delta + '</div>' +
    '<div class="g-resumo"><span>Mín. <b>' + fmt(min) + '</b></span><span>Média <b>' + fmt(Math.round(med)) + '</b></span><span>Máx. <b>' + fmt(max) + '</b></span></div>' +
    '<div class="grafico" style="--n:' + pts.length + '"><div class="g-area">' +
    '<div class="g-media" style="bottom:' + (med * 100 / max).toFixed(1) + '%"><span>média ' + fmt(Math.round(med)) + '</span></div>' + barras + '</div>' +
    '<div class="g-datas">' + datas + '</div></div></div>';
}
