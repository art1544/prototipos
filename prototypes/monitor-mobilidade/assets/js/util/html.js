/**
 * Montagem segura de HTML. Todo conteúdo dinâmico que vai para innerHTML passa por html``, que escapa os valores
 * interpolados; só o que já é HtmlSeguro (outro html`` ou raw()) entra sem escape.
 *
 *   el.innerHTML = html`<b>${usuario}</b>${raw(ICONE_SVG)}`;
 *
 * O texto fixo do template pode ser quebrado em linhas e indentado: a quebra some entre tags e entre valores
 * (não gera nós de texto em branco) e vira um espaço no meio de uma tag ou de um texto.
 */

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para uso em conteúdo e atributos HTML. */
export function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

/** Trecho de HTML confiável (já escapado ou fixo). */
export class HtmlSeguro {
  constructor(texto) {
    this.texto = texto;
  }

  toString() {
    return this.texto;
  }
}

/** Marca uma string fixa da própria tela (ex.: ícone SVG) como HTML confiável. */
export const raw = (texto) => new HtmlSeguro(String(texto));

function interpolar(valor) {
  if (valor == null || valor === false) return '';
  if (valor instanceof HtmlSeguro) return valor.texto;
  if (Array.isArray(valor)) return valor.map(interpolar).join('');
  return esc(valor);
}

/**
 * Quebra de linha com recuo: some junto às tags e entre dois valores interpolados, e vira um espaço no resto
 * (ex.: entre atributos ou no meio de um texto).
 */
const compactar = (texto) =>
  /^\s*\n\s*$/.test(texto)
    ? ''
    : texto
        .replace(/>\s*\n\s*/g, '>')
        .replace(/\s*\n\s*</g, '<')
        .replace(/\s*\n\s*/g, ' ');

/** Template de HTML com escape automático. Valores null, undefined e false viram vazio; listas são concatenadas. */
export function html(partes, ...valores) {
  let saida = compactar(partes[0]);
  valores.forEach((valor, i) => {
    saida += interpolar(valor) + compactar(partes[i + 1]);
  });
  return new HtmlSeguro(saida);
}
