/**
 * Opções de cópia do menu "•••":
 * - "Copiar resumo do dia": veredito e perguntas com status e resposta, em HTML (Outlook e Teams colam formatado)
 *   e em texto simples (qualquer outro lugar);
 * - "Copiar relatório completo": o relatório inteiro em Markdown, gerado pelo backend (/relatorio/{dia}?formato=md).
 */
import {$, esc, nf, dataBr} from '../util/formato.js';
import {ROTULO, tituloVeredito} from '../util/status.js';
import {estado} from '../estado.js';
import {api} from '../api.js';
import {perguntasDe} from '../relatorio.js';
import {avisar} from '../ui/toast.js';

/** Cores das etiquetas no e-mail: estilos inline, porque o Outlook ignora as classes da tela. */
const COR_EMAIL = {OK: ['#1A9D5C', '#E8F6EE'], ATENCAO: ['#9A6200', '#FFF4DC'], CRITICO: ['#C8161F', '#FDECEC']};

function selo(st) {
  const c = COR_EMAIL[st] || ['#5B5B72', '#EEF0F3'];
  return '<span style="display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700;color:' + c[0] + ';background:' + c[1] + ';white-space:nowrap">' + esc(ROTULO[st] || st) + '</span>';
}

/** @returns {{html: string, texto: string}} o resumo nos dois formatos */
function resumoDoDia(r) {
  const ps = perguntasDe(r), cont = {CRITICO: 0, ATENCAO: 0, OK: 0, FORA: 0};
  ps.forEach(function (p) { if (cont[p.status] != null) cont[p.status]++; });
  const titulo = tituloVeredito(r.veredito);
  const partes = [];
  if (cont.CRITICO) partes.push(cont.CRITICO + (cont.CRITICO > 1 ? ' críticas' : ' crítica'));
  if (cont.ATENCAO) partes.push(cont.ATENCAO + ' com atenção');
  partes.push(cont.OK + ' ok');
  if (cont.FORA) partes.push(cont.FORA + ' fora do monitor');
  const resumo = partes.join(' · '), hora = String(r.geradoEm || '').slice(11, 16);
  const a = estado.ambiente, amb = a && a.nome && a.nome !== 'PRODUÇÃO' ? ' (' + a.nome + ')' : '';

  let txt = ['Monitor Mobilidade · ' + dataBr(r.dataRef) + amb, titulo + ' — ' + resumo, ''];
  let h = '<div style="font-family:\'Segoe UI\',Arial,sans-serif;font-size:14px;line-height:1.45;color:#2A2A4D">' +
    '<div style="font-size:17px;font-weight:700;color:#000050">Monitor Mobilidade · ' + dataBr(r.dataRef) + esc(amb) + '</div>' +
    '<div style="margin:4px 0 14px">' + selo(r.veredito) + ' <b style="color:#000050">' + esc(titulo) + '</b> <span style="color:#5B5B72">· ' + esc(resumo) + '</span></div>' +
    '<table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:780px">';
  ps.forEach(function (p) {
    txt.push(p.numero + '. ' + p.pergunta + ' — ' + (ROTULO[p.status] || p.status));
    if (p.resposta) txt.push('   ' + p.resposta);
    txt.push('');
    h += '<tr><td style="padding:9px 10px 9px 0;border-top:1px solid #E5E5E5;vertical-align:top;color:#F37021;font-weight:700;width:22px">' + p.numero + '</td>' +
      '<td style="padding:9px 12px 9px 0;border-top:1px solid #E5E5E5;vertical-align:top"><div style="font-weight:600;color:#000050">' + esc(p.pergunta) + '</div>' +
      (p.resposta ? '<div style="color:#5B5B72;font-size:13px;margin-top:2px">' + esc(p.resposta) + '</div>' : '') + '</td>' +
      '<td style="padding:9px 0;border-top:1px solid #E5E5E5;vertical-align:top;text-align:right">' + selo(p.status) + '</td></tr>';
  });
  h += '</table>';
  const rod = [];
  if (r.despacho) rod.push('Despacho analisado: início em ' + dataBr(r.despacho.inicio) + ', ' + nf.format(r.despacho.total) + ' ordens na lista.');
  rod.push('Relatório gerado às ' + hora + ' (horário de Brasília) pelo Monitor Mobilidade.');
  txt = txt.concat(rod);
  h += '<p style="margin:12px 0 0;color:#9A9AAC;font-size:12px">' + rod.map(esc).join('<br>') + '</p></div>';
  return {html: h, texto: txt.join('\n')};
}

/** Copia HTML + texto quando o navegador permite; senão só o texto. */
function copiar(html, texto) {
  if (html && window.ClipboardItem && navigator.clipboard && navigator.clipboard.write) {
    return navigator.clipboard.write([new ClipboardItem({'text/html': new Blob([html], {type: 'text/html'}), 'text/plain': new Blob([texto], {type: 'text/plain'})})]);
  }
  return navigator.clipboard.writeText(texto);
}

export function iniciarCopiar() {
  $('bResumo').addEventListener('click', function () {
    if (!estado.relatorio) { avisar('Ainda não há relatório para copiar.', true); return; }
    const r = resumoDoDia(estado.relatorio);
    copiar(r.html, r.texto).then(function () { avisar('Resumo do dia copiado. Cole no e-mail ou no Teams com Ctrl+V.'); })
      .catch(function (e) { avisar('Não foi possível copiar: ' + e.message, true); });
  });

  $('bMd').addEventListener('click', function () {
    const dia = estado.relatorio ? estado.relatorio.dataRef : new Date().toISOString().slice(0, 10);
    api('relatorio/' + dia + '?formato=md', {texto: true})
      .then(function (t) { return navigator.clipboard.writeText(t); })
      .then(function () { avisar('Relatório completo copiado, com todos os números e regras.'); })
      .catch(function (e) { if (e.message !== '401') avisar('Não foi possível copiar: ' + e.message, true); });
  });
}
