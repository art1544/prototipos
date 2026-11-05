/**
 * Transporte HTTP do protótipo. Na tela real este arquivo exporta um `requisitar` que chama o fetch (o MonitorLocal.java
 * repassa para /v2/monitor/*); aqui as mesmas rotas são respondidas pelo simulador, sobre data/db.json.
 * É a única troca de comportamento entre a tela real e o protótipo.
 */
export { servidor as requisitar } from './simulador.js';
