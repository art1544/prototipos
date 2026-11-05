/**
 * Ponto de entrada da tela do Monitor Mobilidade: só liga as partes.
 *
 *   config.js       endereços externos, limites e textos fixos
 *   http.js         transporte (fetch ao MonitorLocal; o protótipo troca por um simulador)
 *   api.js          cliente das rotas /v2/monitor/* e ApiError
 *   estado.js       estado compartilhado (token, relatório, despacho, ambiente)
 *   sessao.js       login, 8ID no topo, sair, ambiente
 *   relatorio.js    leitura do JSON do relatório do dia
 *   graficos.js     número em destaque, anel e animações
 *   componentes.js  blocos de HTML reutilizados
 *   textos.js       explicações do botão "i"
 *   ui/             tema, abas, menu "•••", realce, balão "i", aviso flutuante
 *   telas/          Saúde do dia, Detalhes, Despacho, Histórico, tabela com filtros
 *   exportar/       PDF, Excel e cópias para e-mail/Teams
 *   util/           HTML seguro, formatação, status, carregamento do SheetJS
 */
import { APP } from './config.js';
import { $ } from './util/formato.js';
import { estado } from './estado.js';
import { quandoExpirar } from './api.js';
import { carregarAmbiente, iniciarSessao, sair } from './sessao.js';
import { iniciarPopover } from './ui/popover.js';
import { iniciarRealce } from './ui/realce.js';
import { iniciarMenu } from './ui/menu.js';
import { iniciarTema } from './ui/tema.js';
import { iniciarAbas, registrarAba } from './ui/abas.js';
import { iniciarHoje, carregarHoje } from './telas/hoje.js';
import { iniciarDetalhe } from './telas/detalhe.js';
import { iniciarDespacho, carregarDespacho } from './telas/despacho.js';
import { carregarHistorico } from './telas/historico.js';
import { iniciarCopiar } from './exportar/copiar.js';
import { iniciarPdf } from './exportar/pdf.js';

/** Link "Todos os protótipos" no menu, só quando a configuração o define. */
function iniciarCatalogo() {
  if (!APP.hubUrl) return;
  const botao = $('bCatalogo');
  botao.hidden = false;
  botao.addEventListener('click', () => location.assign(APP.hubUrl));
}

carregarAmbiente();
quandoExpirar(sair);

iniciarPopover();
iniciarRealce();
iniciarMenu();
iniciarTema();
iniciarCatalogo();
iniciarSessao(carregarHoje);

registrarAba('despacho', () => {
  if (!estado.despacho) carregarDespacho();
});
registrarAba('historico', carregarHistorico);
iniciarAbas();

iniciarHoje();
iniciarDetalhe();
iniciarDespacho();
iniciarCopiar();
iniciarPdf();
