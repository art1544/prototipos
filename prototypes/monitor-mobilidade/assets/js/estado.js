/**
 * Estado compartilhado da tela. Um objeto só, importado por quem precisa ler ou alterar.
 * Nada aqui é persistido: ao recarregar a página o usuário entra de novo.
 */
export const estado = {
  /** JWT devolvido pelo login (/login); vai no cabeçalho Authorization de cada chamada. */
  token: null,
  /** Último relatório do dia exibido (/hoje): base do PDF, das cópias e dos títulos do histórico. */
  relatorio: null,
  /** Resultado do despacho atual (/despacho/atual): base da aba Despacho e do Excel. */
  despacho: null,
  /** Ambiente para o qual o MonitorLocal repassa as chamadas: {nome, url}. */
  ambiente: null,
};
