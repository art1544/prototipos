/**
 * Opções de cópia do menu "•••":
 * - "Copiar resumo do dia": veredito e perguntas com status e resposta, em HTML (Outlook e Teams colam formatado) e
 *   em texto simples (qualquer outro lugar);
 * - "Copiar relatório completo": o relatório inteiro em Markdown, gerado pelo backend (/relatorio/{dia}?formato=md).
 */
import { APP } from '../config.js';
import { html } from '../util/html.js';
import { $, numero, dataBr, horaDe } from '../util/formato.js';
import { rotuloDe, tituloVeredito } from '../util/status.js';
import { estado, ambienteDeTeste } from '../estado.js';
import { buscarRelatorioMarkdown, sessaoExpirada } from '../api.js';
import { perguntasDe } from '../relatorio.js';
import { avisar, avisarErro } from '../ui/toast.js';

/**
 * Estilos do e-mail. Ficam inline porque o Outlook ignora folhas de estilo; as cores repetem os tokens do tema claro.
 */
const ESTILO = {
  corpo: "font-family:'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.45;color:#2A2A4D",
  titulo: 'font-size:17px;font-weight:700;color:#000050',
  veredito: 'margin:4px 0 14px',
  forte: 'color:#000050',
  suave: 'color:#5B5B72',
  tabela: 'border-collapse:collapse;width:100%;max-width:780px',
  celulaNumero:
    'padding:9px 10px 9px 0;border-top:1px solid #E5E5E5;vertical-align:top;color:#F37021;font-weight:700;width:22px',
  celulaPergunta: 'padding:9px 12px 9px 0;border-top:1px solid #E5E5E5;vertical-align:top',
  celulaStatus: 'padding:9px 0;border-top:1px solid #E5E5E5;vertical-align:top;text-align:right',
  pergunta: 'font-weight:600;color:#000050',
  resposta: 'color:#5B5B72;font-size:13px;margin-top:2px',
  rodape: 'margin:12px 0 0;color:#9A9AAC;font-size:12px',
  selo: 'display:inline-block;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:700',
};

/** Cores das etiquetas no e-mail: [texto, fundo]. */
const COR_DO_SELO = { OK: ['#1A9D5C', '#E8F6EE'], ATENCAO: ['#9A6200', '#FFF4DC'], CRITICO: ['#C8161F', '#FDECEC'] };
const COR_NEUTRA = ['#5B5B72', '#EEF0F3'];

function selo(status) {
  const [texto, fundo] = COR_DO_SELO[status] || COR_NEUTRA;
  return html`<span style="${ESTILO.selo};color:${texto};background:${fundo};white-space:nowrap">${rotuloDe(status)}</span>`;
}

/** "1 crítica · 2 com atenção · 4 ok" (sem a contagem de "sem dados"). */
function resumoDaContagem(perguntas) {
  const total = { CRITICO: 0, ATENCAO: 0, OK: 0, FORA: 0 };
  for (const { status } of perguntas) if (status in total) total[status]++;
  const partes = [];
  if (total.CRITICO) partes.push(`${total.CRITICO} ${total.CRITICO > 1 ? 'críticas' : 'crítica'}`);
  if (total.ATENCAO) partes.push(`${total.ATENCAO} com atenção`);
  partes.push(`${total.OK} ok`);
  if (total.FORA) partes.push(`${total.FORA} fora do monitor`);
  return partes.join(' · ');
}

function rodape(relatorio) {
  const linhas = [];
  if (relatorio.despacho) {
    const { inicio, total } = relatorio.despacho;
    linhas.push(`Despacho analisado: início em ${dataBr(inicio)}, ${numero.format(total)} ordens na lista.`);
  }
  linhas.push(`Relatório gerado às ${horaDe(relatorio.geradoEm)} (horário de Brasília) pelo ${APP.nome}.`);
  return linhas;
}

/** @returns {{html: string, texto: string}} o resumo do dia nos dois formatos */
function resumoDoDia(relatorio) {
  const perguntas = perguntasDe(relatorio);
  const titulo = tituloVeredito(relatorio.veredito);
  const contagem = resumoDaContagem(perguntas);
  const ambiente = ambienteDeTeste();
  const cabecalho = `${APP.nome} · ${dataBr(relatorio.dataRef)}${ambiente ? ` (${ambiente})` : ''}`;
  const linhasRodape = rodape(relatorio);

  const texto = [
    cabecalho,
    `${titulo} — ${contagem}`,
    '',
    ...perguntas.flatMap((p) => [
      `${p.numero}. ${p.pergunta} — ${rotuloDe(p.status)}`,
      ...(p.resposta ? [`   ${p.resposta}`] : []),
      '',
    ]),
    ...linhasRodape,
  ].join('\n');

  const linhasTabela = perguntas.map(
    (p) => html`<tr>
      <td style="${ESTILO.celulaNumero}">${p.numero}</td>
      <td style="${ESTILO.celulaPergunta}">
        <div style="${ESTILO.pergunta}">${p.pergunta}</div>
        ${p.resposta ? html`<div style="${ESTILO.resposta}">${p.resposta}</div>` : ''}
      </td>
      <td style="${ESTILO.celulaStatus}">${selo(p.status)}</td>
    </tr>`,
  );
  const corpo = html`<div style="${ESTILO.corpo}">
    <div style="${ESTILO.titulo}">${cabecalho}</div>
    <div style="${ESTILO.veredito}">
      ${selo(relatorio.veredito)} <b style="${ESTILO.forte}">${titulo}</b> <span style="${ESTILO.suave}">· ${contagem}</span>
    </div>
    <table cellpadding="0" cellspacing="0" style="${ESTILO.tabela}">${linhasTabela}</table>
    <p style="${ESTILO.rodape}">${linhasRodape.map((linha, i) => html`${i ? html`<br>` : ''}${linha}`)}</p>
  </div>`;
  return { html: String(corpo), texto };
}

/** Copia HTML + texto quando o navegador permite; senão só o texto. */
function copiar(conteudoHtml, texto) {
  if (conteudoHtml && window.ClipboardItem && navigator.clipboard?.write) {
    const item = new ClipboardItem({
      'text/html': new Blob([conteudoHtml], { type: 'text/html' }),
      'text/plain': new Blob([texto], { type: 'text/plain' }),
    });
    return navigator.clipboard.write([item]);
  }
  return navigator.clipboard.writeText(texto);
}

async function copiarResumo() {
  if (!estado.relatorio) {
    avisar('Ainda não há relatório para copiar.', { erro: true });
    return;
  }
  const resumo = resumoDoDia(estado.relatorio);
  try {
    await copiar(resumo.html, resumo.texto);
    avisar('Resumo do dia copiado. Cole no e-mail ou no Teams com Ctrl+V.');
  } catch (erro) {
    avisarErro('Não foi possível copiar: ', erro);
  }
}

async function copiarRelatorioCompleto() {
  const dia = estado.relatorio?.dataRef ?? new Date().toISOString().slice(0, 10);
  try {
    await navigator.clipboard.writeText(await buscarRelatorioMarkdown(dia));
    avisar('Relatório completo copiado, com todos os números e regras.');
  } catch (erro) {
    if (!sessaoExpirada(erro)) avisarErro('Não foi possível copiar: ', erro);
  }
}

export function iniciarCopiar() {
  $('bResumo').addEventListener('click', copiarResumo);
  $('bMd').addEventListener('click', copiarRelatorioCompleto);
}
