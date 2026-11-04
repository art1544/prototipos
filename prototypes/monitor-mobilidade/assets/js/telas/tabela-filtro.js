/**
 * Tabela com busca em todas as colunas, filtros por lista e ordenação por coluna (clique no cabeçalho).
 * Mostra no máximo 500 linhas; o Excel do despacho leva todas.
 */
import {esc, fmt, dataBr} from '../util/formato.js';

/** Colunas de texto longo: cortadas em uma linha, com o texto inteiro no title. */
const LARGAS = {motivo: 1, acao: 1, mensagemSap: 1, descricao: 1};
const MAX_LINHAS = 500;

/**
 * @param {HTMLElement} el onde desenhar
 * @param {object[]} dados linhas
 * @param {Object<string,string>} nomes coluna → título (a ordem define a ordem das colunas)
 * @param {Object<string,string>} filtros coluna → rótulo do filtro de lista
 */
export function tabelaFiltro(el, dados, nomes, filtros) {
  if (!dados || !dados.length) { el.innerHTML = '<div class="vazio">Nenhuma linha.</div>'; return; }
  const cols = Object.keys(nomes).filter(function (c) { return c in dados[0]; });
  const est = {busca: '', f: {}, ordem: null, desc: false};
  el.innerHTML = '<div class="filtros"><input type="search" placeholder="Buscar em todas as colunas" aria-label="Buscar">' +
    Object.keys(filtros).map(function (k) {
      const vals = {}; dados.forEach(function (l) { if (l[k] != null && l[k] !== '') vals[l[k]] = 1; });
      return '<select data-k="' + esc(k) + '" aria-label="' + esc(filtros[k]) + '"><option value="">' + esc(filtros[k]) + ': todos</option>' +
        Object.keys(vals).sort().map(function (v) { return '<option>' + esc(v) + '</option>'; }).join('') + '</select>';
    }).join('') + '<span class="tiny" data-n></span></div><div class="tbl"><table><thead></thead><tbody></tbody></table></div>';
  const thead = el.querySelector('thead'), tbody = el.querySelector('tbody'), n = el.querySelector('[data-n]');
  const numerica = {}; cols.forEach(function (c) { numerica[c] = dados.some(function (l) { return typeof l[c] === 'number'; }); });

  function cab() {
    thead.innerHTML = '<tr>' + cols.map(function (c) {
      return '<th data-c="' + esc(c) + '"' + (numerica[c] ? ' class="n"' : '') + '>' + esc(nomes[c]) + (est.ordem === c ? (est.desc ? ' ▼' : ' ▲') : '') + '</th>';
    }).join('') + '</tr>';
  }
  function celula(l, c) {
    const v = l[c];
    if (numerica[c]) return '<td class="n">' + (v == null ? '' : fmt(v)) + '</td>';
    if (c === 'situacao') return '<td>' + (v === 'Pendente' ? '<span class="chip ATENCAO">Pendente</span>' : '<span class="chip OK">Sem pendência</span>') + '</td>';
    if (/^\d{4}-\d{2}-\d{2}/.test(String(v))) return '<td style="white-space:nowrap">' + dataBr(v) + '</td>';
    if (LARGAS[c]) return '<td class="largo"><div class="corta" title="' + esc(v) + '">' + esc(v) + '</div></td>';
    return '<td>' + esc(v) + '</td>';
  }
  function pintar() {
    const b = est.busca.toLowerCase();
    let v = dados.filter(function (l) {
      for (const k in est.f) if (est.f[k] && String(l[k]) !== est.f[k]) return false;
      return !b || cols.some(function (c) { return String(l[c] == null ? '' : l[c]).toLowerCase().indexOf(b) >= 0; });
    });
    if (est.ordem) {
      v = v.slice().sort(function (a, z) {
        const x = a[est.ordem], y = z[est.ordem];
        const r = (typeof x === 'number' || typeof y === 'number') ? (x || 0) - (y || 0) : String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), 'pt-BR');
        return est.desc ? -r : r;
      });
    }
    n.textContent = fmt(v.length) + ' de ' + fmt(dados.length) + ' linhas' + (v.length > MAX_LINHAS ? ' (mostrando ' + MAX_LINHAS + ')' : '');
    tbody.innerHTML = v.slice(0, MAX_LINHAS).map(function (l) { return '<tr>' + cols.map(function (c) { return celula(l, c); }).join('') + '</tr>'; }).join('');
    cab();
  }

  el.querySelector('input').addEventListener('input', function (ev) { est.busca = ev.target.value; pintar(); });
  el.querySelectorAll('select').forEach(function (s) { s.addEventListener('change', function () { est.f[s.dataset.k] = s.value; pintar(); }); });
  // números começam do maior; texto, de A a Z; clicar de novo inverte
  thead.addEventListener('click', function (ev) {
    const c = ev.target.closest('th') && ev.target.closest('th').dataset.c; if (!c) return;
    est.desc = est.ordem === c ? !est.desc : numerica[c]; est.ordem = c; pintar();
  });
  pintar();
}
