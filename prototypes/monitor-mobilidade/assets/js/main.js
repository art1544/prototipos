/**
 * Ponto de entrada da tela do Monitor Mobilidade. Só liga as partes; cada uma está no seu módulo:
 *
 *   estado.js            estado compartilhado (token, relatório, despacho, ambiente)
 *   config.js            identidade, regras e parâmetros de teste (?latencia, ?erros)
 *   api.js               camada de dados: simula as rotas /v2/monitor/* sobre data/db.json
 *   ambiente.js          DEV / PRODUÇÃO / LOCAL no topo e no login
 *   sessao.js            login, 8ID no topo, sair
 *   relatorio.js         leitura do JSON do relatório do dia
 *   graficos.js          número em destaque, anel e animações
 *   componentes.js       blocos de HTML reutilizados
 *   textos.js            explicações do botão "i"
 *   ui/                  tema, abas, menu "•••", realce, balão "i", aviso flutuante
 *   telas/               Saúde do dia, Detalhes, Despacho, Histórico, tabela com filtros
 *   exportar/            PDF, Excel e cópias para e-mail/Teams
 *   util/                formatação, status, carregamento do SheetJS
 */
import {quandoExpirar} from './api.js';
import {carregarAmbiente} from './ambiente.js';
import {iniciarSessao, sair} from './sessao.js';
import {iniciarPopover} from './ui/popover.js';
import {iniciarRealce} from './ui/realce.js';
import {iniciarMenu} from './ui/menu.js';
import {iniciarTema} from './ui/tema.js';
import {iniciarAbas} from './ui/abas.js';
import {iniciarHoje, carregarHoje} from './telas/hoje.js';
import {iniciarDetalhe} from './telas/detalhe.js';
import {iniciarDespacho} from './telas/despacho.js';
import {iniciarCopiar} from './exportar/copiar.js';
import {iniciarPdf} from './exportar/pdf.js';
import {APP} from './config.js';

carregarAmbiente();
quandoExpirar(sair);

iniciarPopover();
iniciarRealce();
iniciarMenu();
iniciarTema();
iniciarSessao(carregarHoje);
iniciarAbas();
iniciarHoje();
iniciarDetalhe();
iniciarDespacho();
iniciarCopiar();
iniciarPdf();

// protótipo: volta ao catálogo
document.getElementById('bCatalogo').addEventListener('click', function () { window.location.href = APP.hubUrl; });
