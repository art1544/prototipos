/**
 * Estado compartilhado da tela. Nada aqui é persistido: ao recarregar a página o usuário entra de novo.
 */
import { AMBIENTE_PRODUCAO } from './config.js';

export const estado = {
  /** JWT devolvido pelo login; vai no cabeçalho Authorization de cada chamada. */
  token: null,
  /** Último relatório do dia exibido: base do PDF, das cópias e dos títulos do histórico. */
  relatorio: null,
  /** Resultado do despacho atual: base da aba Despacho e do Excel. */
  despacho: null,
  /** Ambiente para o qual o MonitorLocal repassa as chamadas: {nome, url}. */
  ambiente: null,
};

/**
 * Nome do ambiente quando não é produção, para marcar cópias e arquivos (ex.: "DEV").
 * @returns {string | null} null em produção ou sem ambiente conhecido
 */
export function ambienteDeTeste() {
  const nome = estado.ambiente?.nome;
  return nome && nome !== AMBIENTE_PRODUCAO ? nome : null;
}
