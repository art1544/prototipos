/* ==========================================================================
   ENCO Portal Web · Tela: Gestão de Planos  (rota #planos)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver js/core/bus.js).
   ========================================================================== */
ENCO.screen('planos', {
  title: 'Gestão de Planos',
  rootClass: 'filters-open',
  template: `
    <!--
 GESTÃO DE PLANOS
 - Lista: Nome, Placa, Motorista, Carregamento (data/hora de início), Status, Enviado SAP, Ações.
 - Ações por linha:
   · Ver rota (ícone de mapa): abre a linha do tempo horizontal da rota (modal), no
     mesmo modelo da tela de Rota do app, com "Última atualização".
   · Reenviar relatório de entrega (ícone de e-mail): habilitado SOMENTE para plano
     Finalizado; nos demais fica desabilitado (aria-disabled) com tooltip explicativo.
   · Expandir: mostra Resumo do plano + Itens do plano agrupados por ponto de descarga.
 [OBS-05] Planos em aberto exibem "Não carregado" na coluna Carregamento.
-->
    <main class="main">
      <section class="card page-head">
        <div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/></svg>
        </div>
        <div style="flex-grow:1">
          <h1>Gestão de Planos</h1>
          <p>Acompanhe, filtre e exporte os planos de entrega e coleta de materiais.</p>
        </div>
      </section>

      <section class="tiles" aria-label="Resumo dos planos">
        <button class="tile" data-tile="Em aberto" aria-pressed="false">
          <span class="ic" style="background:#FDEBDD;color:#D35A12"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></span>
          <span class="num" data-count="Em aberto">0</span>
          <span class="lab">Planos em aberto</span>
        </button>
        <button class="tile" data-tile="Em andamento" aria-pressed="false">
          <span class="ic" style="background:#E0F0FC;color:#1E73BE"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg></span>
          <span class="num" data-count="Em andamento">0</span>
          <span class="lab">Em andamento</span>
        </button>
        <button class="tile" data-tile="Finalizado" aria-pressed="false">
          <span class="ic" style="background:#DDF0F2;color:#1A7A85"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg></span>
          <span class="num" data-count="Finalizado">0</span>
          <span class="lab">Finalizados</span>
        </button>
        <button class="tile" data-tile="sap" aria-pressed="false">
          <span class="ic" style="background:#FBE4DA;color:#B23E0B"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>
          <span class="num" data-count="sap">0</span>
          <span class="lab">Não enviados ao SAP</span>
        </button>
      </section>

      <section class="card" id="filters">
        <div class="f-head">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B1A4A" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z"/></svg>
          <h2>Filtros</h2>
          <div class="segs" role="group" aria-label="Tipo de filtro">
            <button class="seg on" data-mode="basic" aria-pressed="true">Básico</button>
            <button class="seg" data-mode="adv" aria-pressed="false">Avançado</button>
          </div>
          <div class="spacer"></div>
          <button class="btn btn-g f-toggle" id="toggleFilters" style="height:36px;padding:0 12px;font-size:13px" aria-expanded="true">
            <span id="toggleFiltersLabel">Recolher</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
          </button>
        </div>

        <div class="f-body">
          <div class="grid basic" id="grid">
            <label class="fld"><span class="lbl">Plano</span><input class="inp" id="qName" type="text" placeholder="Ex.: 20260923132728"></label>
            <!-- [S07 aprovado][REAL] FiltroPlanos.status é string[]: seleção de vários status -->
            <div class="fld"><span class="lbl" id="qStatusL">Status do Plano</span>
              <div class="msel" id="qStatusBox">
                <button type="button" class="inp msel-btn" id="qStatus" value="" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="qStatusL qStatusTxt"><span id="qStatusTxt">Todos</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>
                <div class="msel-pop" id="qStatusPop" role="listbox" aria-multiselectable="true" aria-label="Status do plano" hidden>
                  <label><input type="checkbox" value="Em aberto">Em aberto</label>
                  <label><input type="checkbox" value="Em andamento">Em andamento</label>
                  <label><input type="checkbox" value="Finalizado">Finalizado</label>
                  <label><input type="checkbox" value="Concluido">Concluido</label>
                  <label><input type="checkbox" value="Cancelamento Solicitado">Cancelamento Solicitado</label>
                  <label><input type="checkbox" value="Cancelamento Enviado">Cancelamento Enviado</label>
                  <button type="button" class="msel-clr" id="qStatusClr">Todos (limpar seleção)</button>
                </div>
              </div>
            </div>
            <label class="fld">
              <span class="lbl-row"><span class="lbl">Carregamento – Início</span><span class="tag" data-default-tag>60 dias</span></span>
              <input class="inp hl" id="dIni" type="date">
            </label>
            <label class="fld">
              <span class="lbl-row"><span class="lbl">Carregamento – Fim</span><span class="tag" data-default-tag>Hoje</span></span>
              <input class="inp hl" id="dFim" type="date">
            </label>
            <label class="fld"><span class="lbl">Placa</span><input class="inp" id="qPlaca" type="text" maxlength="7" placeholder="Ex.: ABC1D23" style="text-transform:uppercase"></label>
            <label class="fld"><span class="lbl">Motorista</span><input class="inp" id="qMot" type="text" placeholder="Nome ou 8ID"></label>
            <label class="fld"><span class="lbl">Enviado SAP</span>
              <select class="inp" id="qSap">
                <option value="">Todos</option>
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </label>

            <label class="fld adv"><span class="lbl">Recebimento – Início</span><input class="inp" type="date"></label>
            <label class="fld adv"><span class="lbl">Recebimento – Fim</span><input class="inp" type="date"></label>
            <label class="fld adv"><span class="lbl">Número de reserva</span><input class="inp" type="text" placeholder="Digite o número"></label>
            <label class="fld adv"><span class="lbl">Ordem de manutenção</span><input class="inp" type="text" placeholder="Digite a ordem"></label>
            <label class="fld adv"><span class="lbl">Número do material</span><input class="inp" type="text" placeholder="Digite o número"></label>
            <label class="fld adv"><span class="lbl">Número do pacote</span><input class="inp" type="text" placeholder="Digite o número"></label>
            <label class="fld adv"><span class="lbl">Ponto</span><input class="inp" type="text" placeholder="Digite o ponto"></label>
            <label class="fld adv"><span class="lbl">Rota</span><input class="inp" type="text" placeholder="Digite a rota"></label>
            <label class="fld adv"><span class="lbl">Ordem de Transporte</span><input class="inp" type="text" placeholder="Digite a ordem"></label>
            <label class="fld adv"><span class="lbl">Prioridade</span><select class="inp" id="qPrio"><option value="">Todas</option><option>0 – Sem prioridade</option><option>1 – WH: Entrega Urgente (no max. 2hs)</option><option>2 – WH: Antecipação de Entrega</option></select></label>
            <label class="fld adv"><span class="lbl">Tipo de movimento</span><select class="inp" id="qMov"><option value="">Todos</option><option>201 – Centro de Custo (Entrega)</option><option>221 – Projeto CAPEX (Entrega)</option><option>261 – Ordem de Manutenção (Entrega)</option><option>262 – Coleta Ordem - Devolução (Coleta)</option></select></label>
            <label class="fld adv"><span class="lbl">ID Integração</span><input class="inp" type="text" placeholder="Digite o ID"></label>
            <label class="fld adv"><span class="lbl">8ID do requisitante</span><input class="inp" type="text" placeholder="Digite o 8ID"></label>
            <label class="fld adv"><span class="lbl">8ID do receptor</span><input class="inp" type="text" placeholder="Digite o 8ID"></label>
          </div>

          <div class="f-actions">
            <button class="btn btn-g" id="clear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              Limpar filtros
            </button>
            <button class="btn btn-s" id="btnRel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>
              Gerar relatório
            </button>
            <button class="btn btn-p" id="run">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              Executar busca
            </button>
          </div>
        </div>
      </section>

      <section class="card t-card">
        <div class="t-head">
          <h2>Planos</h2>
          <span class="pill" id="resultLabel"></span>
          <span class="pill">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
            Carregamento: <span id="periodLabel"></span>
          </span>
          <span class="pill filter" id="filterChip" hidden>
            <span id="filterLabel"></span>
            <button class="ib" aria-label="Remover filtro" id="clearChip">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </span>
          <button class="btn btn-p btn-sm" id="sapBatch" style="margin-left:auto" hidden>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9 15 3-3 3 3"/><path d="M12 12v6"/></svg>
            <span id="sapBatchLab">Reprocessar envio ao SAP</span>
          </button>
        </div>

        <div role="table" aria-label="Lista de planos">
          <div class="cols thead" role="row">
            <span role="columnheader">Plano</span>
            <span role="columnheader">Placa</span>
            <span role="columnheader">Motorista</span>
            <span role="columnheader">Carregamento</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Enviado SAP</span>
            <span role="columnheader" style="text-align:right">Ações</span>
          </div>
          <div id="tbody"></div>
          <div class="empty" id="empty" hidden>
            <span style="font-size:15px;font-weight:700">Nenhum plano encontrado</span>
            <span style="font-size:13px;color:#5E627C">Ajuste os filtros ou limpe a busca para ver todos os planos.</span>
          </div>
        </div>

        <!-- [S08 aprovado][REAL] Paginação (FiltroPlanoDescargaPaginadoModelo): mínimo de 10 planos por página -->
        <div class="t-foot">
          <label class="pg-ps">Itens por página <select id="pgSize" aria-label="Planos por página"><option>10</option><option>25</option><option>50</option></select></label>
          <span id="pgInfo">Página 1 de 1</span>
          <div style="display:flex;gap:8px">
            <button class="btn btn-s" id="pgPrev" style="height:36px;font-size:13px" disabled>Anterior</button>
            <button class="btn btn-s" id="pgNext" style="height:36px;font-size:13px" disabled>Próxima</button>
          </div>
        </div>
      </section>
    </main>
`,
  init: function (root, scr) {
    (function () {
      var ROWS = [
        { nome: '20260923132728', placa: 'FITASSU', motorista: 'Adna de Jesus Goncalves', status: 'Finalizado', sap: 'Sim', rota: 'Rota 01 – Laminação', carga: '23/09/2026 08:10', receb: '23/09/2026 10:42', tipo: 'Entrega', pacotes: '4' },
        { nome: '20260923113732', placa: 'FITASSU', motorista: 'Jackson Barbosa Veiga da Silva', status: 'Finalizado', sap: 'Sim', rota: 'Rota 03 – Aciaria', carga: '23/09/2026 07:55', receb: '23/09/2026 09:30', tipo: 'Entrega', pacotes: '2' },
        { nome: '20260923094510', placa: 'QPX4B21', motorista: 'Marcos Antônio Ribeiro', status: 'Em andamento', sap: 'Não', rota: 'Rota 02 – Alto-forno', carga: '23/09/2026 09:45', receb: '—', tipo: 'Coleta', pacotes: '6' },
        { nome: '20260923081205', placa: 'RTA7C90', motorista: 'Luciana Ferreira Lima', status: 'Em andamento', sap: 'Não', rota: 'Rota 01 – Laminação', carga: '23/09/2026 08:12', receb: '—', tipo: 'Entrega', pacotes: '3' },
        { nome: '20260922171843', placa: 'FITASSU', motorista: 'Adna de Jesus Goncalves', status: 'Em aberto', sap: 'Não', rota: 'Rota 04 – Utilidades', carga: '—', receb: '—', tipo: 'Entrega', pacotes: '5' },
        { nome: '20260922153020', placa: 'KLM2D45', motorista: 'Rafael Souza Prado', status: 'Em aberto', sap: 'Não', rota: 'Rota 02 – Alto-forno', carga: '—', receb: '—', tipo: 'Coleta', pacotes: '1' },
        { nome: '20260922102211', placa: 'QPX4B21', motorista: 'Marcos Antônio Ribeiro', status: 'Finalizado', sap: 'Não', rota: 'Rota 03 – Aciaria', carga: '22/09/2026 10:22', receb: '22/09/2026 13:05', tipo: 'Coleta', pacotes: '2' },
        { nome: '20260921164930', placa: 'RTA7C90', motorista: 'Luciana Ferreira Lima', status: 'Finalizado', sap: 'Sim', rota: 'Rota 04 – Utilidades', carga: '21/09/2026 16:49', receb: '21/09/2026 18:20', tipo: 'Entrega', pacotes: '7' }
      ];
    var ITEMS = {
      '20260923132728': [
        { tipo: 'Entrega', id: '1000073257', pacote: '5000188312', reserva: '285273090', material: '74080886', texto: 'Capa de chuva PVC amarela G', qtd: '4', und: 'PC', ponto: 'WH ADM', ccusto: '0000032101', ordem: '—', dCarga: '23/09/2026', hCarga: '13:27:28', tpMov: '201', idReceb: 'aribeirr', nomeReceb: 'Allank Ribeiro Rabello Junior', dhReceb: '23/09/2026 13:29:08', status: 'Confirmado' }
      ],
      '20260923113732': [
        { tipo: 'Entrega', id: '1000073335', pacote: '5000188187', reserva: '285272396', material: '74110884', texto: 'Bota seguranca couro solado termico TM40', qtd: '1', und: 'PC', ponto: 'MPW', ccusto: '0000031246', ordem: '—', dCarga: '23/09/2026', hCarga: '11:37:32', tpMov: '201', idReceb: '10375627', nomeReceb: 'Jeferson Wesley De Oliveira', dhReceb: '23/09/2026 11:41:07', status: 'Confirmado' }
      ],
      '20260923094510': [
        { tipo: 'Coleta', id: '1000073401', pacote: '5000188420', reserva: '285274012', material: '74052210', texto: 'Luva vaqueta cano curto', qtd: '10', und: 'PR', ponto: 'Alto-Forno 2', ccusto: '0000032455', ordem: '4100982311', dCarga: '23/09/2026', hCarga: '09:45:10', tpMov: '262', idReceb: '—', nomeReceb: '—', dhReceb: '—', status: 'Em andamento' },
        { tipo: 'Coleta', id: '1000073402', pacote: '5000188421', reserva: '285274013', material: '74061187', texto: 'Oculos seguranca lente incolor', qtd: '6', und: 'PC', ponto: 'Alto-Forno 2', ccusto: '0000032455', ordem: '4100982311', dCarga: '23/09/2026', hCarga: '09:45:10', tpMov: '262', idReceb: '—', nomeReceb: '—', dhReceb: '—', status: 'Em andamento' }
      ],
      '20260923081205': [
        { tipo: 'Entrega', id: '1000073388', pacote: '5000188350', reserva: '285273551', material: '74033019', texto: 'Protetor auricular plug silicone', qtd: '20', und: 'PC', ponto: 'Laminacao', ccusto: '0000031870', ordem: '—', dCarga: '23/09/2026', hCarga: '08:12:05', tpMov: '201', idReceb: '10375512', nomeReceb: 'Paulo Henrique Mendes', dhReceb: '23/09/2026 08:47:12', status: 'Confirmado' }
      ],
      '20260922171843': [
        { tipo: 'Entrega', id: '1000073290', pacote: '5000188277', reserva: '285272988', material: '74090345', texto: 'Capacete seguranca aba frontal branco', qtd: '3', und: 'PC', ponto: 'Utilidades', ccusto: '0000032780', ordem: '—', dCarga: '—', hCarga: '—', tpMov: '201', idReceb: '—', nomeReceb: '—', dhReceb: '—', status: 'Em aberto' },
        { tipo: 'Entrega', id: '1000073291', pacote: '5000188278', reserva: '285272989', material: '74090346', texto: 'Jugular capacete elastica', qtd: '3', und: 'PC', ponto: 'Utilidades', ccusto: '0000032780', ordem: '—', dCarga: '—', hCarga: '—', tpMov: '201', idReceb: '—', nomeReceb: '—', dhReceb: '—', status: 'Em aberto' }
      ],
      '20260922153020': [
        { tipo: 'Coleta', id: '1000073275', pacote: '5000188260', reserva: '285272810', material: '74071120', texto: 'Mascara PFF2 sem valvula', qtd: '50', und: 'PC', ponto: 'Alto-Forno 1', ccusto: '0000032455', ordem: '4100981907', dCarga: '—', hCarga: '—', tpMov: '262', idReceb: '—', nomeReceb: '—', dhReceb: '—', status: 'Em aberto' }
      ],
      '20260922102211': [
        { tipo: 'Coleta', id: '1000073201', pacote: '5000188190', reserva: '285272150', material: '74080890', texto: 'Avental raspa couro 120CM', qtd: '2', und: 'PC', ponto: 'Aciaria', ccusto: '0000031502', ordem: '4100981455', dCarga: '22/09/2026', hCarga: '10:22:11', tpMov: '262', idReceb: 'mribeiro', nomeReceb: 'Marcos Antônio Ribeiro', dhReceb: '22/09/2026 13:05:40', status: 'Confirmado' }
      ],
      '20260921164930': [
        { tipo: 'Entrega', id: '1000073150', pacote: '5000188102', reserva: '285271760', material: '74110890', texto: 'Bota seguranca couro bico composite TM42', qtd: '2', und: 'PC', ponto: 'Utilidades', ccusto: '0000032780', ordem: '—', dCarga: '21/09/2026', hCarga: '16:49:30', tpMov: '201', idReceb: '10382214', nomeReceb: 'Carla Menezes Duarte', dhReceb: '21/09/2026 18:20:15', status: 'Confirmado' },
        { tipo: 'Entrega', id: '1000073151', pacote: '5000188102', reserva: '285271761', material: '74080887', texto: 'Capa de chuva PVC amarela GG', qtd: '2', und: 'PC', ponto: 'Utilidades', ccusto: '0000032780', ordem: '—', dCarga: '21/09/2026', hCarga: '16:49:30', tpMov: '201', idReceb: '10382214', nomeReceb: 'Carla Menezes Duarte', dhReceb: '21/09/2026 18:20:15', status: 'Confirmado' }
      ]
    };

    var M = { aribeiro: 'aribeiro@ternium.com.br', jsilva: 'jackson.silva@ternium.com.br', almox: 'almoxarifado.enco@ternium.com.br', lam: 'laminacao.recebimento@ternium.com.br', aci: 'aciaria.b16@ternium.com.br', ofc: 'oficina.central@ternium.com.br', af1: 'altoforno1.turno@ternium.com.br', af2: 'altoforno2.turno@ternium.com.br', sint: 'sinterizacao@ternium.com.br', uti: 'utilidades.manutencao@ternium.com.br', sub: 'subestacao3@ternium.com.br', eta: 'eta.operacao@ternium.com.br', mpw: 'mpw.recebimento@ternium.com.br' };
    var ROUTE = {
      '20260923132728': [
        { ponto: 'WH ADM', local: 'Prédio administrativo – térreo', st: 'feito', ini: '09:05', fim: '09:18', itens: 2, receb: 'aribeirr · Ana Ribeiro', mails: [M.aribeiro, M.almox], envio: '23/09/2026 08:10' },
        { ponto: 'Laminação L2', local: 'Laminação a quente – portaria 2', st: 'feito', ini: '10:30', fim: '10:42', itens: 2, receb: '10375512 · Paulo Mendes', mails: [M.lam, M.almox], envio: '23/09/2026 08:10' }
      ],
      '20260923113732': [
        { ponto: 'MPW', local: 'Manutenção – oficina MPW', st: 'feito', ini: '08:40', fim: '08:52', itens: 1, receb: '10375220 · Jackson Silva', mails: [M.mpw, M.jsilva], envio: '23/09/2026 07:55' },
        { ponto: 'Aciaria', local: 'Aciaria – vestiário B', st: 'feito', ini: '09:20', fim: '09:30', itens: 1, receb: '10377841 · Rita Gomes', mails: [M.aci], envio: '23/09/2026 07:55' }
      ],
      '20260923094510': [
        { ponto: 'Alto-Forno 2', local: 'Alto-forno 2 – sala de controle', st: 'feito', ini: '10:02', fim: '10:15', itens: 2, receb: '10381120 · Carlos Nunes', mails: [M.af2], envio: '23/09/2026 09:45' },
        { ponto: 'Alto-Forno 1', local: 'Alto-forno 1 – almoxarifado de área', st: 'atual', ini: '10:41', prev: '10:40', itens: 3, mails: [M.af1, M.almox], envio: '23/09/2026 09:45' },
        { ponto: 'Sinterização', local: 'Sinterização – portaria 1', st: 'previsto', prev: '11:30', itens: 1, mails: [M.sint], envio: '23/09/2026 09:45' }
      ],
      '20260923081205': [
        { ponto: 'Laminação', local: 'Laminação a frio – doca 3', st: 'feito', ini: '08:35', fim: '08:47', itens: 1, receb: '10375512 · Paulo Mendes', mails: [M.lam], envio: '23/09/2026 08:12' },
        { ponto: 'Aciaria B16 A', local: 'Aciaria – baia 16 A', st: 'nao', ini: '09:20', fim: '09:31', itens: 1, motivo: 'Receptor ausente no ponto', mails: [M.aci], envio: '23/09/2026 08:12' },
        { ponto: 'Oficina Central', local: 'Oficina central – balcão', st: 'previsto', prev: '10:15', itens: 1, mails: [M.ofc, M.almox], envio: '23/09/2026 08:12' }
      ],
      '20260922171843': [
        { ponto: 'Utilidades', local: 'Utilidades – casa de bombas', st: 'previsto', prev: '—', itens: 3, mails: [M.uti], envio: '' },
        { ponto: 'Subestação 3', local: 'Subestação 3 – sala elétrica', st: 'previsto', prev: '—', itens: 2, mails: [M.sub, M.uti], envio: '' }
      ],
      '20260922153020': [
        { ponto: 'Alto-Forno 1', local: 'Alto-forno 1 – almoxarifado de área', st: 'previsto', prev: '—', itens: 1, mails: [M.af1], envio: '' }
      ],
      '20260922102211': [
        { ponto: 'Aciaria', local: 'Aciaria – vestiário B', st: 'feito', ini: '12:48', fim: '13:05', itens: 1, receb: 'mribeiro · Marcos Ribeiro', mails: [M.aci], envio: '22/09/2026 10:22' }
      ],
      '20260921164930': [
        { ponto: 'Utilidades', local: 'Utilidades – casa de bombas', st: 'feito', ini: '17:30', fim: '17:44', itens: 2, receb: '10382214 · João Pires', mails: [M.uti], envio: '21/09/2026 16:49' },
        { ponto: 'ETA', local: 'Estação de tratamento de água', st: 'feito', ini: '18:05', fim: '18:20', itens: 5, receb: '10380031 · Sara Lopes', mails: [M.eta, M.uti], envio: '21/09/2026 16:49' }
      ]
    };
    var PEND = { previsto: 1, atual: 1 };

    var EXTRA = {
      '20260923132728': { prio: '0 – Sem prioridade', mov: '201 – Centro de Custo (Entrega)', idInt: '7004812', cIni: '23/09/2026 08:10', cFim: '23/09/2026 08:31', ent: '10372251' },
      '20260923113732': { prio: '1 – WH: Entrega Urgente (no max. 2hs)', mov: '201 – Centro de Custo (Entrega)', idInt: '7004809', cIni: '23/09/2026 07:55', cFim: '23/09/2026 08:12', ent: '10375220' },
      '20260923094510': { prio: '0 – Sem prioridade', mov: '262 – Coleta Ordem - Devolução (Coleta)', idInt: '7004815', cIni: '23/09/2026 09:45', cFim: '23/09/2026 09:58', ent: '10368874' },
      '20260923081205': { prio: '2 – WH: Antecipação de Entrega', mov: '261 – Ordem de Manutenção (Entrega)', idInt: '7004807', cIni: '23/09/2026 08:12', cFim: '23/09/2026 08:24', ent: '10379903' },
      '20260922171843': { prio: '0 – Sem prioridade', mov: '221 – Projeto CAPEX (Entrega)', idInt: '7004798', cIni: '—', cFim: '—', ent: '10372251' },
      '20260922153020': { prio: '1 – WH: Entrega Urgente (no max. 2hs)', mov: '262 – Coleta Ordem - Devolução (Coleta)', idInt: '7004795', cIni: '—', cFim: '—', ent: '10381147' },
      '20260922102211': { prio: '0 – Sem prioridade', mov: '262 – Coleta Ordem - Devolução (Coleta)', idInt: '7004781', cIni: '22/09/2026 10:22', cFim: '22/09/2026 10:40', ent: '10368874' },
      '20260921164930': { prio: '0 – Sem prioridade', mov: '201 – Centro de Custo (Entrega)', idInt: '7004766', cIni: '21/09/2026 16:49', cFim: '21/09/2026 17:08', ent: '10379903' }
    };
    ROWS.forEach(function (r) { var x = EXTRA[r.nome] || {}; for (var k in x) r[k] = x[k]; });

    var OTR = { '20260923132728': '0081204517', '20260923113732': '0081204509', '20260923094510': '0081204522', '20260923081205': '0081204503', '20260922171843': '0081204488', '20260922153020': '0081204481', '20260922102211': '0081204460', '20260921164930': '0081204431' };
    var REQ = { '1000073257': '10366402', '1000073335': '10375220', '1000073401': '10381120', '1000073402': '10381120', '1000073388': '10375512', '1000073290': '10370918', '1000073291': '10370918', '1000073275': '10377315', '1000073201': '10377841', '1000073150': '10382214', '1000073151': '10382214' };
    var PTO = { '1000073402': 'Alto-Forno 1', '1000073291': 'Subestacao 3', '1000073151': 'ETA' };
    Object.keys(ITEMS).forEach(function (k) { ITEMS[k].forEach(function (it) { it.ot = OTR[k] || '—'; it.req = REQ[it.id] || '—'; if (PTO[it.id]) it.ponto = PTO[it.id]; it.prio = (EXTRA[k] && EXTRA[k].prio || '—').split(' – ')[0]; }); });

    var REQP = { '10366402': ['Ana Paula Ribeiro', 'ana.ribeiro@ternium.com.br'], '10375220': ['Jackson Barbosa Veiga da Silva', 'jackson.silva@ternium.com.br'], '10381120': ['Carlos Eduardo Nunes', 'carlos.nunes@ternium.com.br'], '10375512': ['Paulo Henrique Mendes', 'paulo.mendes@ternium.com.br'], '10370918': ['Fernanda Costa Lima', 'fernanda.costa@ternium.com.br'], '10377315': ['Bruno Almeida Souza', 'bruno.almeida@ternium.com.br'], '10377841': ['Rita de Cássia Gomes', 'rita.gomes@ternium.com.br'], '10382214': ['João Victor Pires', 'joao.pires@ternium.com.br'] };
    var NCI = { '1000073150': 'QTDDVG-E-DVG – Quantidade divergente', '1000073201': 'AVA-C-DVG – Material com avaria na coleta' };
    Object.keys(ITEMS).forEach(function (k) { ITEMS[k].forEach(function (it) { var q = REQP[it.req] || ['—', '—']; it.reqNome = q[0]; it.reqMail = q[1]; it.nc = NCI[it.id] || ''; }); });

    /* [REAL] Demais campos do ItemPlano / ItemPlanoFiltrado exibidos na tabela de itens:
       Origem, MacroPonto, QtdReal, CodUsuarioEntregador (8ID), DataHoraChegadaPonto, DataHoraSaidaPonto,
       AssinaturaDigital, TentativasReceptorAusente (máx. 3) e DescricaoMotivo.
       Imagens (ImagemAssinaturaDigital, ImagemNaoConformidade) e posições geográficas ficam no relatório. */
    var MACRO = { 'WH ADM': 'ADM1', 'MPW': 'Oficina Central', 'Alto-Forno 1': 'Alto Forno 1', 'Alto-Forno 2': 'Alto Forno 2', 'Laminacao': 'Laminação a Frio', 'Aciaria': 'Aciaria', 'Utilidades': 'Energy Media 1', 'Subestacao 3': 'Energy Media 1', 'ETA': 'Energy Media 1' };
    var QREAL = { '1000073150': '1' };
    var CRACHA = { '1000073335': 1, '1000073201': 1 };
    var MOTIVO = { '1000073150': 'Recebida 1 de 2 unidades; restante sem estoque', '1000073201': 'Embalagem rasgada na retirada' };
    function semAcento(s) { return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase(); }
    Object.keys(ITEMS).forEach(function (k) {
      var x = EXTRA[k] || {}, stops = ROUTE[k] || [];
      ITEMS[k].forEach(function (it) {
        var done = it.status === 'Confirmado', busy = done || it.status === 'Em andamento';
        var stop = stops.filter(function (s) { return semAcento(s.ponto) === semAcento(it.ponto) && (s.st === 'feito' || s.st === 'atual' || s.st === 'nao'); })[0];
        var dia = it.dhReceb !== '—' ? it.dhReceb.split(' ')[0] : (x.cIni && x.cIni !== '—' ? x.cIni.split(' ')[0] : '');
        it.origem = 'Almoxarifado';
        it.macro = MACRO[it.ponto] || '—';
        it.qtdReal = done ? (QREAL[it.id] || it.qtd) : '—';
        it.entregador = busy ? (x.ent || '—') : '—';
        it.chegada = stop && stop.ini ? dia + ' ' + stop.ini : '—';
        it.saida = stop && stop.fim ? dia + ' ' + stop.fim : '—';
        /* ItemPlano.AssinaturaDigital: true = assinatura na tela; false = foto do crachá do recebedor.
           A imagem fica em ImagemAssinaturaDigital; a foto da ocorrência em ImagemNaoConformidade. */
        it.comprovante = done ? (CRACHA[it.id] ? 'cracha' : 'assinatura') : null;
        it.imgNc = NCI[it.id] ? ENCO.img.naoConformidade : null;
        it.tentativas = 0;
        it.motivo = MOTIVO[it.id] || '';
      });
    });
    /* [REAL] Demais dados do PlanoDescarga exibidos no resumo: CodArea (Área), Veiculo.CodTipoVeiculo
       (tipo do veículo), DataHoraUltimaAtualizacao e o histórico MudancaExecucaoRota (ação, data/hora,
       justificativa, estado atual/esperado/solicitado). Por decisão de negócio NÃO são exibidos:
       CodPlanoDescarga, DataHoraSaidaArea/ChegadaArea, PosicaoSaidaArea/ChegadaArea e a contagem de coletas.
       Motorista: NomeMotorista + 8ID do usuário (CodUsuario) num único campo – é a mesma pessoa. */
    var TIPOV = { FITASSU: 'Caminhão Baú', QPX4B21: 'Van', RTA7C90: 'Caminhão Munck', KLM2D45: 'Caminhão Baú' };
    var MUD = {
      '20260923081205': [{ acao: 'Troca de ponto', dh: '23/09/2026 09:31', just: 'Receptor ausente na Aciaria B16 A; entrega reagendada para o fim da rota', atual: 'Aciaria B16 A', esperado: 'Aciaria B16 A', solic: 'Oficina Central' }],
      '20260923094510': [{ acao: 'Adição de tempo de espera', dh: '23/09/2026 10:44', just: 'Área do Alto-Forno 1 aguardando liberação de segurança', atual: '00:10:00', esperado: '00:10:00', solic: '00:25:00' }],
      '20260922102211': [{ acao: 'Troca de veículo', dh: '22/09/2026 10:31', just: 'Veículo KLM2D45 em manutenção', atual: 'KLM2D45', esperado: 'KLM2D45', solic: 'QPX4B21' }]
    };
    ROWS.forEach(function (r) {
      r.area = 'Almoxarifado';
      r.tipoVeiculo = TIPOV[r.placa] || '—';
      r.mudancas = MUD[r.nome] || [];
    });
    /* Feature flag Coletas (js/core/features.js): desligada, planos de coleta não aparecem */
    if (!ENCO.feature('coletas')) ROWS = ROWS.filter(function (r) { return r.tipo !== 'Coleta'; });

    /* [REAL] Status do item = tabela StatusItem (ENCO.dominio.statusItem). */
    var IST = { 'Confirmado': ['#E1F3E8', '#1D6B3E'], 'Em andamento': ['#E0F0FC', '#1565A8'], 'Em aberto': ['#FDEBDD', '#A8420A'], 'Receptor ausente': ['#FFF4E5', '#9A5B00'], 'Adicionado ao final da rota': ['#E3F1F6', '#1E6E8C'], 'Erro na execução do plano': ['#FBE4E4', '#B42318'], 'Cancelado': ['#F1F1F6', '#4A4E6A'] };
      /* [REAL] Status do plano = tabela StatusPlanoDescarga (ENCO.dominio.statusPlano). */
      var ST = { 'Em aberto': ['#FDEBDD', '#A8420A'], 'Em andamento': ['#E0F0FC', '#1565A8'], 'Finalizado': ['#E1F3E8', '#1D6B3E'], 'Concluido': ['#DDF0F2', '#1A7A85'], 'Cancelamento Solicitado': ['#FBE4E4', '#B42318'], 'Cancelamento Enviado': ['#F1F1F6', '#4A4E6A'] };

      var $ = function (id) { return scr.byId(id); };
      var app = $('app');
      var state = { applied: { name: '', status: '', sap: false }, open: {}, tab: {} };

      function pad(n) { return String(n).padStart(2, '0'); }
      function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
      function br(v) { if (!v) return '—'; var p = v.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
      function defaultPeriod() { var f = new Date(), i = new Date(); i.setDate(i.getDate() - 60); return { ini: iso(i), fim: iso(f) }; }
      function setDefaultPeriod() { var p = defaultPeriod(); $('dIni').value = p.ini; $('dFim').value = p.fim; }

      function renderPeriod() {
        var p = defaultPeriod();
        var isDefault = $('dIni').value === p.ini && $('dFim').value === p.fim;
        scr.qsa('[data-default-tag]').forEach(function (t) { t.hidden = !isDefault; });
        $('periodLabel').textContent = br($('dIni').value) + ' a ' + br($('dFim').value);
      }


      var MAIL_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>';
      var CHECK_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';
      var X_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>';

      function stLabel(st, tipo) {
        var done = tipo === 'Coleta' ? 'Coletado' : 'Entregue';
        return { feito: [done, '#E1F3E8', '#1D6B3E'], atual: ['No ponto agora', '#E9E8F8', '#4B45B5'], previsto: ['Previsto', '#FDEBDD', '#A8420A'], nao: [tipo === 'Coleta' ? 'Não coletado' : 'Não entregue', '#FBE4E4', '#B42318'] }[st];
      }
      function pendIdx(stops) { var o = []; stops.forEach(function (s, i) { if (PEND[s.st]) o.push(i); }); return o; }

      /* Itens do plano agrupados por PONTO DE DESCARGA (ordem de aparição/rota).
         Listagem só com o essencial: Material, Nome material, Qtd Prevista, Und, Ordem de Transporte,
         Requisitante (nome + 8ID), Recebedor (nome + 8ID), Status, Não Conformidade e Motivo.
         Os demais campos do ItemPlano ficam no "Detalhe do item" (botão no fim da linha), junto com
         a assinatura digital ou a foto do crachá do recebedor e a foto da ocorrência, quando houver.
         [OBS-09] "Tipo" (ENTREGA/COLETA) corresponde à Categoria do tipo de movimento – agora no detalhe.
         [OBS-11] Com o agrupamento por ponto, a coluna "Ponto" saiu da listagem e ficou no detalhe. */
      var EYE_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';
      function pessoa(nome, id8) {
        if (!nome || nome === '—') return '<span style="color:#8B8FA6">—</span>';
        return '<span class="pess"><b>' + nome + '</b><small>8ID ' + id8 + '</small></span>';
      }
      function itemsHtml(r) {
        var its = ITEMS[r.nome] || [], grp = [], gi = {}, NCOL = 11;
        its.forEach(function (it) { if (!(it.ponto in gi)) { gi[it.ponto] = grp.length; grp.push({ ponto: it.ponto, its: [] }); } grp[gi[it.ponto]].its.push(it); });
        return '<div class="items"><div class="items-head"><b>Itens do plano</b><span class="items-count">' + its.length + (its.length === 1 ? ' item' : ' itens') + ' · ' + grp.length + (grp.length === 1 ? ' ponto de descarga' : ' pontos de descarga') + '</span></div>' +
          '<div class="items-scroll"><table><thead><tr><th>Material</th><th>Nome material</th><th>Qtd Prevista</th><th>Und</th><th>Ordem Transp.</th><th>Requisitante</th><th>Recebedor</th><th>Status</th><th>Não Conformidade</th><th>Motivo</th><th><span class="sr-only">Detalhe</span></th></tr></thead><tbody>' +
          grp.map(function (g) {
            return '<tr class="grp"><td colspan="' + NCOL + '"><span class="grp-in"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span class="grp-lab">Ponto de descarga</span><b>' + g.ponto + '</b><span class="items-count">' + g.its.length + (g.its.length === 1 ? ' item' : ' itens') + '</span></span></td></tr>' +
              g.its.map(function (it) {
                var ic = IST[it.status] || ['#F1F1F6', '#4A4E6A'];
                return '<tr>' +
                  '<td class="num">' + it.material + '</td>' +
                  '<td class="wrap">' + it.texto + '</td>' +
                  '<td class="num">' + it.qtd + '</td>' +
                  '<td>' + it.und + '</td>' +
                  '<td class="num">' + it.ot + '</td>' +
                  '<td>' + pessoa(it.reqNome, it.req) + '</td>' +
                  '<td>' + pessoa(it.nomeReceb, it.idReceb) + '</td>' +
                  '<td><span class="badge" style="background:' + ic[0] + ';color:' + ic[1] + '">' + it.status + '</span></td>' +
                  '<td' + (it.nc ? ' class="wrap"' : '') + '>' + (it.nc ? '<span class="badge" style="background:#FBE4E4;color:#B42318;white-space:normal">' + it.nc + '</span>' : '<span style="color:#8B8FA6">Sem ocorrência</span>') + '</td>' +
                  '<td' + (it.motivo ? ' class="wrap"' : '') + '>' + (it.motivo || '<span style="color:#8B8FA6">—</span>') + '</td>' +
                  '<td style="text-align:right"><button class="ib" data-item="' + it.id + '" data-row="' + r.nome + '" aria-label="Ver detalhe do item ' + it.material + '" title="Ver detalhe do item">' + EYE_SVG + '</button></td>' +
                '</tr>';
              }).join('');
          }).join('') +
          '</tbody></table></div></div>';
      }

      /* Detalhe do item: todos os campos do ItemPlano + comprovantes (imagens). */
      var itOv = document.createElement('div'); itOv.className = 'ov'; itOv.hidden = true;
      itOv.innerHTML = '<div class="modal it-modal" role="dialog" aria-modal="true" aria-labelledby="iTitle"><div class="m-head"><div class="icon-tile" style="width:40px;height:40px;background:#FDEBDD;color:#C94F0C"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/></svg></div><div style="flex-grow:1"><h3 id="iTitle"></h3><p id="iSub"></p></div><button class="ib" id="iClose" aria-label="Fechar">' + X_SVG + '</button></div><div class="m-body" id="iBody"></div><div class="m-foot"><button class="btn btn-p" id="iOk">Fechar</button></div></div>';
      scr.layer.appendChild(itOv);
      function openItem(k, id) {
        var it = (ITEMS[k] || []).filter(function (x) { return x.id === id; })[0]; if (!it) return;
        lastFocus = document.activeElement;
        var ic = IST[it.status] || ['#F1F1F6', '#4A4E6A'];
        function kv(l, v) { return '<div><span>' + l + '</span><span>' + (v === undefined || v === '' ? '—' : v) + '</span></div>'; }
        function sec(t, body) { return '<section class="it-sec"><h4>' + t + '</h4><div class="it-grid">' + body + '</div></section>'; }
        var qr = it.qtdReal !== '—' && it.qtdReal !== it.qtd ? '<b style="color:#B42318">' + it.qtdReal + '</b> <small style="color:#B42318">(diverge da prevista)</small>' : it.qtdReal;
        var imgs = '';
        if (it.comprovante) imgs += '<figure class="it-img"><img src="' + ENCO.img[it.comprovante] + '" alt="' + (it.comprovante === 'cracha' ? 'Foto do crachá do recebedor' : 'Assinatura digital do recebedor') + '"><figcaption>' + (it.comprovante === 'cracha' ? 'Foto do crachá do recebedor' : 'Assinatura digital do recebedor') + (it.dhReceb !== '—' ? ' · ' + it.dhReceb : '') + '</figcaption></figure>';
        if (it.imgNc) imgs += '<figure class="it-img"><img src="' + it.imgNc + '" alt="Foto da ocorrência"><figcaption>Foto da ocorrência · ' + it.nc + '</figcaption></figure>';
        $('iTitle').textContent = it.texto;
        $('iSub').innerHTML = 'Material ' + it.material + ' · Plano ' + k + ' · <span class="badge" style="background:' + ic[0] + ';color:' + ic[1] + '">' + it.status + '</span>';
        $('iBody').innerHTML =
          sec('Identificação',
            kv('Categoria', it.tipo) + kv('ID Integração', it.id) + kv('Número do pacote', it.pacote) + kv('Reserva', it.reserva) +
            kv('Material', it.material) + kv('Centro de custo', it.ccusto) + kv('Ordem de manutenção', it.ordem) + kv('Ordem de transporte', it.ot)) +
          sec('Carregamento e movimento',
            kv('Origem', it.origem) + kv('Data de carregamento', it.dCarga) + kv('Hora de carregamento', it.hCarga) +
            kv('Tipo de movimento', it.tpMov) + kv('Prioridade', it.prio) + kv('Quantidade prevista', it.qtd + ' ' + it.und) + kv('Quantidade real', qr)) +
          sec('Entrega no ponto',
            kv('Macro ponto', it.macro) + kv('Ponto de descarga', it.ponto) + kv('Chegada no ponto', it.chegada) + kv('Saída do ponto', it.saida) +
            kv('Data/hora do recebimento', it.dhReceb) + kv('Motorista (8ID)', it.entregador) +
            kv('Tentativas com receptor ausente', it.tentativas + ' de ' + ENCO.dominio.tentativasReceptorAusente)) +
          sec('Pessoas',
            kv('Requisitante', pessoa(it.reqNome, it.req)) + kv('E-mail do requisitante', it.reqMail === '—' ? '—' : '<a class="mail-l" href="mailto:' + it.reqMail + '">' + it.reqMail + '</a>') +
            kv('Recebedor', pessoa(it.nomeReceb, it.idReceb)) +
            kv('Comprovante', it.comprovante === 'cracha' ? 'Foto do crachá' : it.comprovante === 'assinatura' ? 'Assinatura digital' : '—')) +
          (it.nc || it.motivo ? sec('Ocorrência', kv('Não conformidade', it.nc) + kv('Motivo', it.motivo)) : '') +
          '<section class="it-sec"><h4>Comprovantes</h4>' + (imgs ? '<div class="it-imgs">' + imgs + '</div>' : '<p class="it-none">Sem assinatura, foto do crachá ou foto de ocorrência para este item.</p>') + '</section>';
        itOv.hidden = false; $('iOk').focus();
      }
      function closeItem() { itOv.hidden = true; if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }
      $('iClose').addEventListener('click', closeItem);
      $('iOk').addEventListener('click', closeItem);
      itOv.addEventListener('click', function (e) { if (e.target === itOv) closeItem(); });
      scr.onDoc('keydown', function (e) { if (e.key === 'Escape' && !itOv.hidden) closeItem(); });

      /* [OBS-12] routeHtml/openResend: aba "Rota de entrega" e reenvio de e-mail por ponto
         foram RETIRADOS da interface a pedido. O código permanece apenas como referência e
         não é chamado (o reenvio só é acionado pelo relatório de plano finalizado). */
      function routeHtml(r) {
        var stops = ROUTE[r.nome] || [];
        var done = stops.filter(function (s) { return s.st === 'feito'; }).length;
        var pend = pendIdx(stops);
        var pct = stops.length ? Math.round(done / stops.length * 100) : 0;
        var doneLab = r.tipo === 'Coleta' ? 'Coletado' : 'Entregue';
        return '<div class="route">' +
          '<div class="route-head"><b>Rota de ' + r.tipo.toLowerCase() + '</b><span class="items-count">' + r.rota + '</span>' +
            '<span class="prog-wrap"><span class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="' + stops.length + '" aria-valuenow="' + done + '" aria-label="Pontos atendidos"><i style="width:' + pct + '%"></i></span>' + done + ' de ' + stops.length + ' pontos atendidos</span>' +
            '<span class="spacer"></span>' +
            '<button class="btn btn-s btn-sm" data-resend-all data-row="' + r.nome + '"' + (pend.length ? '' : ' disabled title="Não há pontos previstos neste plano"') + '>' + MAIL_SVG + 'Reenviar e-mails dos pontos previstos (' + pend.length + ')</button>' +
          '</div>' +
          '<div class="legend"><span><i class="feito"></i>' + doneLab + ' (feito)</span><span><i class="atual"></i>No ponto agora</span><span><i class="previsto"></i>Previsto</span><span><i class="nao"></i>Não ' + doneLab.toLowerCase() + '</span></div>' +
          '<ol class="stops">' + stops.map(function (s, i) {
            var L = stLabel(s.st, r.tipo);
            var mk = s.st === 'feito' ? CHECK_SVG : s.st === 'nao' ? X_SVG : (i + 1);
            var horario;
            if (s.st === 'feito' || s.st === 'nao') horario = '<span class="k">Chegada / saída</span><span class="v">' + s.ini + ' – ' + s.fim + '</span>';
            else if (s.st === 'atual') horario = '<span class="k">Chegada (previsto ' + s.prev + ')</span><span class="v">' + s.ini + ' · em atendimento</span>';
            else horario = '<span class="k">Previsão de chegada</span><span class="v' + (s.prev === '—' ? ' muted' : '') + '">' + (s.prev === '—' ? 'Após o carregamento' : s.prev) + '</span>';
            var envio = s.envio ? '<span class="v mail-ok">Último envio ' + s.envio + '</span>' : '<span class="v mail-no">Ainda não enviado</span>';
            var act = PEND[s.st]
              ? '<button class="btn btn-s btn-sm" data-resend data-row="' + r.nome + '" data-i="' + i + '">' + MAIL_SVG + (s.envio ? 'Reenviar e-mail' : 'Enviar e-mail') + '</button>'
              : (s.receb ? '<span class="sc-col"><span class="k">Recebido por</span><span class="v">' + s.receb + '</span></span>' : '');
            return '<li class="stop ' + s.st + '"><span class="mk" aria-hidden="true">' + mk + '</span>' +
              '<div class="stop-card" aria-label="Ponto ' + (i + 1) + ': ' + s.ponto + ', ' + L[0] + '">' +
                '<div class="sc-col"><span class="sc-title">' + (i + 1) + '. ' + s.ponto + ' <span class="badge" style="background:' + L[1] + ';color:' + L[2] + '">' + L[0] + '</span></span><span class="k">' + s.local + ' · ' + s.itens + (s.itens === 1 ? ' item' : ' itens') + '</span></div>' +
                '<div class="sc-col">' + horario + '</div>' +
                '<div class="sc-col"><span class="k">E-mail de ' + r.tipo.toLowerCase() + ' · ' + s.mails.length + (s.mails.length === 1 ? ' destinatário' : ' destinatários') + '</span>' + envio + '</div>' +
                '<div class="sc-col sc-act">' + act + '</div>' +
                (s.motivo ? '<div class="motivo">Motivo: ' + s.motivo + '</div>' : '') +
              '</div></li>';
          }).join('') + '</ol></div>';
      }

      /* [OBS-06][REAL] Resumo do plano = campos de PlanoDescarga. Motorista (NomeMotorista) e
         Entregador (CodUsuario → 8ID do usuário do app) são campos distintos no banco.
         [OBS-07][REAL] Prioridade, Tipo de movimento e ID Integração são do ITEM (ItemPlano.CodPrioridade,
         CodTipoMovimento, IdIntegracao) e podem variar dentro do mesmo plano: saíram do resumo e
         aparecem na tabela de itens. Datas do plano: DataHoraSaidaArea / DataHoraChegadaArea /
         DataHoraUltimaAtualizacao; a data/hora de carregamento é por item. */
      function detail(r) {
        var tab = state.tab[r.nome] || 'itens';
        var n = (ITEMS[r.nome] || []).length, p = pendIdx(ROUTE[r.nome] || []).length;
        function t(id, lab) { return '<button class="seg dtab' + (tab === id ? ' on' : '') + '" role="tab" aria-selected="' + (tab === id) + '" data-row="' + r.nome + '" data-tab="' + id + '">' + lab + '</button>'; }
        var c = ST[r.status];
        function f(l, v) { return '<div><span>' + l + '</span><span>' + v + '</span></div>'; }
        var muted = function (t) { return '<span style="color:#8B8FA6">' + t + '</span>'; };
        var nPontos = {}; (ITEMS[r.nome] || []).forEach(function (it) { nPontos[it.ponto] = 1; });
        var resumo = '<div class="resumo" role="group" aria-label="Resumo do plano ' + r.nome + '"><div class="resumo-h">Resumo do plano</div><div class="details">' +
          f('Nome do Plano', r.nome) +
          f('Status do Plano', '<span class="badge" style="background:' + c[0] + ';color:' + c[1] + ';width:max-content"><span class="dot"></span>' + r.status + '</span>') +
          f('Área responsável', r.area) +
          f('Rota', r.rota) +
          f('Placa do veículo', r.placa) +
          f('Tipo de veículo', r.tipoVeiculo) +
          f('Motorista', r.motorista + ' <span style="color:#6E7390;font-weight:500">· 8ID ' + r.ent + ' · ' + ENCO.celular(r.ent) + '</span>') +
          f('Itens / pontos', n + (n === 1 ? ' item' : ' itens') + ' · ' + Object.keys(nPontos).length + (Object.keys(nPontos).length === 1 ? ' ponto' : ' pontos')) +
          f('Última atualização', ultimaAtualizacao(r)) +
          f('Enviado ao SAP', r.sap) +
        '</div></div>';
        return resumo + mudancasHtml(r) + itemsHtml(r);
      }

      /* DataHoraUltimaAtualizacao: recebimento (finalizado), último evento da rota (em andamento)
         ou criação do plano (em aberto, extraída do nome do plano). */
      function ultimaAtualizacao(r) {
        if (r.receb !== '—') return r.receb;
        var day = r.carga !== '—' ? r.carga.split(' ')[0] : r.nome.slice(6, 8) + '/' + r.nome.slice(4, 6) + '/' + r.nome.slice(0, 4);
        var hh = r.carga !== '—' ? r.carga.split(' ')[1] : r.nome.slice(8, 10) + ':' + r.nome.slice(10, 12);
        (ROUTE[r.nome] || []).forEach(function (s) { [s.ini, s.fim].forEach(function (t) { if (t && t > hh) hh = t; }); });
        return day + ' ' + hh;
      }

      /* [REAL] MudancaExecucaoRota: alterações feitas pelo entregador durante a rota (troca de ponto,
         veículo ou entregador, tempo de espera, retorno justificado) – hoje só aparecem no relatório simplificado. */
      function mudancasHtml(r) {
        if (!r.mudancas.length) return '';
        return '<div class="items"><div class="items-head"><b>Alterações na execução da rota</b><span class="items-count">' + r.mudancas.length + (r.mudancas.length === 1 ? ' alteração' : ' alterações') + '</span></div>' +
          '<div class="items-scroll"><table><thead><tr><th>Ação</th><th>Data/Hora</th><th>Justificativa</th><th>Estado atual</th><th>Estado esperado</th><th>Estado solicitado</th></tr></thead><tbody>' +
          r.mudancas.map(function (m) { return '<tr><td style="font-weight:700">' + m.acao + '</td><td class="num">' + m.dh + '</td><td class="wrap">' + m.just + '</td><td>' + m.atual + '</td><td>' + m.esperado + '</td><td>' + m.solic + '</td></tr>'; }).join('') +
          '</tbody></table></div></div>';
      }

      /* Modal de (re)envio + toast */
      var ov = document.createElement('div'); ov.className = 'ov'; ov.hidden = true;
      ov.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mTitle"><div class="m-head"><div class="icon-tile" style="width:40px;height:40px;background:#FDEBDD;color:#C94F0C">' + MAIL_SVG + '</div><div style="flex-grow:1"><h3 id="mTitle">Reenviar e-mail de entrega</h3><p id="mSub"></p></div><button class="ib" id="mClose" aria-label="Fechar">' + X_SVG + '</button></div><div class="m-body" id="mBody"></div><div class="m-foot"><span class="k" id="mCount" style="margin-right:auto"></span><button class="btn btn-g" id="mCancel">Cancelar</button><button class="btn btn-p" id="mOk">' + MAIL_SVG + '<span id="mOkLab">Reenviar</span></button></div></div>';
      scr.layer.appendChild(ov);
      var toast = document.createElement('div'); toast.className = 'toast'; toast.setAttribute('role', 'status'); scr.layer.appendChild(toast);
      var toastT;
      function showToast(msg) { toast.innerHTML = CHECK_SVG + '<span>' + msg + '</span>'; toast.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toast.classList.remove('show'); }, 3200); }
      var mCtx = null, mMode = 'resend', lastFocus = null;
      function nowStr() { var d = new Date(); return pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()); }
      function syncCount() {
        var n = ov.querySelectorAll('#mBody input:checked').length;
        $('mCount').textContent = n + (n === 1 ? ' ponto selecionado' : ' pontos selecionados');
        $('mOk').disabled = !n; $('mOk').style.opacity = n ? '' : '.5';
      }
      function openResend(k, only) {
        var r = ROWS.filter(function (x) { return x.nome === k; })[0];
        var stops = ROUTE[k] || [], pend = pendIdx(stops);
        if (!pend.length) { showToast('O plano ' + k + ' não tem pontos previstos para reenviar.'); return; }
        mCtx = k; mMode = 'resend'; lastFocus = document.activeElement;
        $('mOkLab').textContent = 'Reenviar';
        var tl = r.tipo.toLowerCase();
        $('mTitle').textContent = (only && only.length === 1 && !stops[only[0]].envio ? 'Enviar' : 'Reenviar') + ' e-mail de ' + tl;
        $('mSub').textContent = 'Plano ' + k + ' · ' + r.rota + '. Os destinatários recebem novamente o aviso de ' + tl + ' com os itens previstos para o ponto.';
        $('mBody').innerHTML = pend.map(function (i) {
          var s = stops[i], L = stLabel(s.st, r.tipo), on = !only || only.indexOf(i) >= 0;
          return '<label class="opt"><input type="checkbox" value="' + i + '"' + (on ? ' checked' : '') + '><span class="opt-main"><span class="sc-title">' + (i + 1) + '. ' + s.ponto + ' <span class="badge" style="background:' + L[1] + ';color:' + L[2] + '">' + L[0] + '</span></span>' +
            '<span class="k">' + s.itens + (s.itens === 1 ? ' item' : ' itens') + ' · ' + (s.envio ? 'último envio ' + s.envio : 'ainda não enviado') + '</span>' +
            '<span class="chips">' + s.mails.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</span></span></label>';
        }).join('');
        syncCount(); ov.hidden = false; $('mOk').focus();
      }
      /* Reenvio do relatório de entrega (somente plano Finalizado). Lista todos os pontos com
         contatos; o usuário pode desmarcar pontos antes de confirmar.
         [OBS-13] Em plano de COLETA o título do modal fica "Reenviar relatório de coleta",
                  mas o tooltip do ícone é fixo "Reenviar relatório de entrega" – confirmar. */
      function openReport(k) {
        var r = ROWS.filter(function (x) { return x.nome === k; })[0];
        if (!r || r.status !== 'Finalizado' || !ENCO.pode('reenviarEmail')) return;
        var stops = ROUTE[k] || [];
        mCtx = k; mMode = 'report'; lastFocus = document.activeElement;
        var tl = r.tipo.toLowerCase();
        $('mTitle').textContent = 'Reenviar relatório de ' + tl;
        $('mSub').textContent = 'Plano ' + k + ' · ' + r.rota + '. O relatório com os pontos atendidos, horários, recebedores e itens será reenviado aos contatos de cada ponto selecionado.';
        $('mOkLab').textContent = 'Reenviar relatório';
        $('mBody').innerHTML = stops.map(function (s, i) {
          var L = stLabel(s.st, r.tipo);
          return '<label class="opt"><input type="checkbox" value="' + i + '" checked><span class="opt-main"><span class="sc-title">' + (i + 1) + '. ' + s.ponto + ' <span class="badge" style="background:' + L[1] + ';color:' + L[2] + '">' + L[0] + '</span></span>' +
            '<span class="k">' + s.itens + (s.itens === 1 ? ' item' : ' itens') + (s.receb ? ' · recebido por ' + s.receb : '') + (s.fim ? ' às ' + s.fim : '') + '</span>' +
            '<span class="chips">' + s.mails.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</span></span></label>';
        }).join('');
        syncCount(); ov.hidden = false; $('mOk').focus();
      }
      function closeModal() { ov.hidden = true; mCtx = null; if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }
      $('mBody').addEventListener('change', syncCount);
      $('mClose').addEventListener('click', closeModal);
      $('mCancel').addEventListener('click', closeModal);
      ov.addEventListener('click', function (e) { if (e.target === ov) closeModal(); });
      scr.onDoc('keydown', function (e) { if (e.key === 'Escape' && !ov.hidden) closeModal(); });
      $('mOk').addEventListener('click', function () {
        var k = mCtx, stops = ROUTE[k], when = nowStr(), mails = 0;
        var sel = Array.prototype.map.call(ov.querySelectorAll('#mBody input:checked'), function (c) { return +c.value; });
        if (mMode === 'report') {
          var uniq = {};
          sel.forEach(function (i) { stops[i].mails.forEach(function (m) { uniq[m] = 1; }); });
          var n = Object.keys(uniq).length;
          ov.hidden = true; mCtx = null;
          if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus();
          showToast('Relatório de entrega do plano ' + k + ' reenviado para ' + n + (n === 1 ? ' destinatário.' : ' destinatários.'));
          return;
        }
        sel.forEach(function (i) { stops[i].envio = when; mails += stops[i].mails.length; });
        ov.hidden = true; mCtx = null;
        state.open[k] = true; state.tab[k] = 'rota';
        render();
        showToast('E-mail reenviado para ' + sel.length + (sel.length === 1 ? ' ponto' : ' pontos') + ' (' + mails + (mails === 1 ? ' destinatário' : ' destinatários') + ').');
      });

      /* Ver rota: linha do tempo horizontal */
      var PIN_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 5-8 12-8 12s-8-7-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';
      var TRUCK_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>';
      var tlOv = document.createElement('div'); tlOv.className = 'ov'; tlOv.hidden = true;
      tlOv.innerHTML = '<div class="modal tl-modal" role="dialog" aria-modal="true" aria-labelledby="tlTitle"><div class="tl-head"><h3 id="tlTitle"></h3><p id="tlProg"></p><button class="ib" id="tlClose" aria-label="Fechar">' + X_SVG + '</button></div><div class="tl-data"><h4><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/></svg>Dados do plano</h4><div class="tl-facts" id="tlFacts"></div></div><div class="tl-scroll"><ol class="tl" id="tlLine" style="list-style:none;margin:0;padding:0"></ol></div><div class="m-foot"><button class="btn btn-p" id="tlOk">Fechar</button></div></div>';
      scr.layer.appendChild(tlOv);
      var tlCtx = null;
      /* Linha do tempo (Ver rota): Início (Almoxarifado) → pontos → Fim (Almoxarifado).
         Estados: Concluído, Não entregue/coletado, No ponto agora, Próximo ponto, Pendente.
         Progresso conta Concluído + Não entregue como "atendidos".
         "Última atualização": data/hora do recebimento (finalizado), último evento da rota
         (em andamento) ou criação do plano (em aberto, extraída do nome do plano).
         [S09 aprovado] "No ponto agora" = item com DataHoraChegadaPonto e sem DataHoraSaidaPonto;
                  "Próximo ponto" = primeiro ponto pendente pela Posicao. Não precisa de evento novo do app:
                  basta incluir DataHoraChegadaPonto, DataHoraSaidaPonto e Posicao em LinhaDoTempoModelo. */
      function openTimeline(k) {
        var r = ROWS.filter(function (x) { return x.nome === k; })[0];
        var stops = ROUTE[k] || [];
        var started = r.carga !== '—', ended = r.status === 'Finalizado';
        var hasHere = stops.some(function (s) { return s.st === 'atual'; });
        var nextGiven = hasHere || !started;
        var nodes = [{ lab: 'Almoxarifado', cls: started ? 'ok' : 'next', st: 'Início', sub: started ? 'Saída ' + r.carga.split(' ')[1] : 'Aguardando carregamento' }];
        stops.forEach(function (s) {
          var n = { lab: s.ponto };
          if (s.st === 'feito') { n.cls = 'ok'; n.st = 'Concluído'; n.sub = s.ini + ' – ' + s.fim; }
          else if (s.st === 'nao') { n.cls = 'nao'; n.st = r.tipo === 'Coleta' ? 'Não coletado' : 'Não entregue'; n.sub = s.motivo; }
          else if (s.st === 'atual') { n.cls = 'here'; n.st = 'No ponto agora'; n.sub = 'Chegada ' + s.ini; }
          else if (!nextGiven) { nextGiven = true; n.cls = 'next'; n.st = 'Próximo ponto'; n.sub = s.prev && s.prev !== '—' ? 'Previsto ' + s.prev : ''; }
          else { n.cls = 'pend'; n.st = 'Pendente'; n.sub = s.prev && s.prev !== '—' ? 'Previsto ' + s.prev : ''; }
          nodes.push(n);
        });
        nodes.push({ lab: 'Almoxarifado', cls: ended ? 'ok' : 'pend', st: 'Fim', sub: ended ? 'Retorno ' + r.receb.split(' ')[1] : '' });
        var done = nodes.filter(function (n) { return n.cls === 'ok' || n.cls === 'nao'; }).length;
        tlCtx = k; lastFocus = document.activeElement;
        $('tlTitle').textContent = 'Rota | Plano ' + k;
        $('tlProg').textContent = 'Progresso: ' + done + ' / ' + nodes.length + ' concluído · ' + r.rota;
        var c = ST[r.status];
        var upd = ultimaAtualizacao(r);
        var CLOCK_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>';
        $('tlFacts').innerHTML = '<span>' + TRUCK_SVG + 'Placa: <b>' + r.placa + '</b></span><span>Motorista: <b>' + r.motorista + '</b></span><span>Tipo: <b>' + r.tipo + '</b></span><span>Status: <span class="badge" style="background:' + c[0] + ';color:' + c[1] + '"><span class="dot"></span>' + r.status + '</span></span><span>' + CLOCK_SVG + 'Última atualização: <b>' + upd.replace(' ', ' às ') + '</b></span>';
        $('tlLine').innerHTML = nodes.map(function (n, i) {
          var icon = n.cls === 'ok' ? CHECK_SVG : n.cls === 'nao' ? X_SVG : n.cls === 'here' ? TRUCK_SVG : PIN_SVG;
          return '<li class="tl-n ' + n.cls + '" aria-label="' + (i + 1) + '. ' + n.lab + ': ' + n.st + '"><span class="tl-lab">' + pad(i + 1) + '. ' + n.lab + '</span><span class="tl-dot" aria-hidden="true">' + icon + '</span><span class="tl-st">' + n.st + (n.sub ? '<small>' + n.sub + '</small>' : '') + '</span></li>';
        }).join('');
        tlOv.hidden = false; $('tlOk').focus();
      }
      function closeTl() { tlOv.hidden = true; tlCtx = null; if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }
      $('tlClose').addEventListener('click', closeTl);
      $('tlOk').addEventListener('click', closeTl);
      tlOv.addEventListener('click', function (e) { if (e.target === tlOv) closeTl(); });
      scr.onDoc('keydown', function (e) { if (e.key === 'Escape' && !tlOv.hidden) closeTl(); });

      /* Planos que atendem aos filtros aplicados (o que está listado na tela) */
      function filtrados() {
        var a = state.applied, q = a.name.toLowerCase();
        return ROWS.filter(function (r) {
          if (stList(a.status).length && stList(a.status).indexOf(r.status) < 0) return false;
          if (a.sap && r.sap !== 'Não') return false;
          if (a.nomes && a.nomes.indexOf(r.nome) < 0) return false;
          if (q && r.nome.indexOf(q) < 0 && r.motorista.toLowerCase().indexOf(q) < 0) return false;
          if (a.placa && r.placa.indexOf(a.placa) < 0) return false;
          if (a.mot && r.motorista.toLowerCase().indexOf(a.mot.toLowerCase()) < 0 && String(r.ent).indexOf(a.mot) < 0) return false;
          if (a.envSap && r.sap !== a.envSap) return false;
          return true;
        });
      }

      /* ---------- Gerar relatório (PDF ou Excel) dos planos listados ----------
         Usa os mesmos filtros da listagem. Excel: abas "Planos" e "Itens" com todos os campos
         (uma linha por item, com os dados do plano repetidos para facilitar tabela dinâmica).
         PDF: um bloco por plano com o resumo e as colunas principais dos itens.
         [REAL] Substitui o atalho "irTelaRelatorio()" do Angular por exportação direta da lista;
         a tela Relatórios foi retirada do portal: o relatório é gerado aqui. */
      var relOv = document.createElement('div'); relOv.className = 'ov'; relOv.hidden = true;
      relOv.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="rTitle"><div class="m-head"><div class="icon-tile" style="width:40px;height:40px;background:#FDEBDD;color:#C94F0C"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg></div><div style="flex-grow:1"><h3 id="rTitle">Gerar relatório</h3><p id="rSub"></p></div><button class="ib" id="rClose" aria-label="Fechar">' + X_SVG + '</button></div>' +
        '<div class="m-body"><span class="k">Formato</span>' +
        '<label class="opt"><input type="radio" name="rFmt" value="xlsx" checked><span class="opt-main"><span class="sc-title">Excel (.xlsx)</span><span class="k">Abas "Planos" e "Itens" com todos os campos, filtros e cabeçalho fixo.</span></span></label>' +
        '<label class="opt"><input type="radio" name="rFmt" value="pdf"><span class="opt-main"><span class="sc-title">PDF</span><span class="k">Um bloco por plano com o resumo e os itens, em A4 paisagem. O arquivo é baixado direto.</span></span></label>' +
        '<label class="opt" style="margin-top:4px"><input type="checkbox" id="rItens" checked><span class="opt-main"><span class="sc-title">Incluir os itens dos planos</span><span class="k" id="rItensK"></span></span></label>' +
        '</div><div class="m-foot"><button class="btn btn-g" id="rCancel">Cancelar</button><button class="btn btn-p" id="rOk">Gerar</button></div></div>';
      scr.layer.appendChild(relOv);
      function openRel() {
        var list = filtrados(), nIt = list.reduce(function (s, r) { return s + (ITEMS[r.nome] || []).length; }, 0);
        if (!list.length) { showToast('Nenhum plano listado para gerar o relatório.'); return; }
        lastFocus = document.activeElement;
        $('rSub').textContent = list.length + (list.length === 1 ? ' plano listado' : ' planos listados') + ' · ' + ($('filterLabel').textContent || 'sem filtro de status') + ' · Carregamento ' + $('periodLabel').textContent;
        $('rItensK').textContent = nIt + (nIt === 1 ? ' item' : ' itens') + ' no total';
        relOv.hidden = false; $('rOk').focus();
      }
      function closeRel() { relOv.hidden = true; if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }
      $('btnRel').addEventListener('click', openRel);
      $('rClose').addEventListener('click', closeRel);
      $('rCancel').addEventListener('click', closeRel);
      relOv.addEventListener('click', function (e) { if (e.target === relOv) closeRel(); });
      scr.onDoc('keydown', function (e) { if (e.key === 'Escape' && !relOv.hidden) closeRel(); });
      $('rOk').addEventListener('click', function () {
        var fmt = relOv.querySelector('input[name="rFmt"]:checked').value, comItens = $('rItens').checked, list = filtrados();
        var d = new Date(), stamp = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
        closeRel();
        if (fmt === 'xlsx') { gerarExcel(list, comItens, 'ENCO-planos-' + stamp + '.xlsx'); showToast('Relatório Excel gerado com ' + list.length + (list.length === 1 ? ' plano.' : ' planos.')); }
        else gerarPdf(list, comItens, 'ENCO-planos-' + stamp).then(function () { showToast('Relatório PDF gerado com ' + list.length + (list.length === 1 ? ' plano.' : ' planos.')); });
      });

      function numCel(t) { var x = parseFloat(String(t).replace(',', '.')); return isNaN(x) ? (t === '—' ? '' : t) : x; }
      function txtCel(t) { return t === '—' || t === undefined ? '' : t; }
      /* Linha de filtros do relatório, igual no PDF e no Excel */
      function filtrosRel(list) {
        return list.length + (list.length === 1 ? ' plano' : ' planos') + ' · ' + ($('filterLabel').textContent || 'Todos os status listados') + ' · Carregamento ' + $('periodLabel').textContent + ' · Área Almoxarifado';
      }
      function gerarExcel(list, comItens, arquivo) {
        /* Topo de cada aba no padrão do PDF: logo do ENCO, título e filtros aplicados */
        var cab = { titulo: 'Relatório de planos', subtitulo: filtrosRel(list), logo: ENCO.img.logo };
        var abas = [{
          nome: 'Planos',
          cabecalho: cab,
          colunas: [{ titulo: 'Nome do Plano', largura: 18 }, { titulo: 'Status', largura: 22 }, { titulo: 'Área responsável', largura: 18 }, { titulo: 'Rota', largura: 24 }, { titulo: 'Placa', largura: 10 }, { titulo: 'Tipo de veículo', largura: 18 }, { titulo: 'Motorista', largura: 30 }, { titulo: '8ID Motorista', largura: 13 }, { titulo: 'Carregamento', largura: 17 }, { titulo: 'Itens', largura: 8 }, { titulo: 'Pontos', largura: 8 }, { titulo: 'Última atualização', largura: 17 }, { titulo: 'Enviado ao SAP', largura: 14 }],
          linhas: list.map(function (r) {
            var its = ITEMS[r.nome] || [], pts = {}; its.forEach(function (it) { pts[it.ponto] = 1; });
            return [r.nome, r.status, r.area, r.rota, r.placa, r.tipoVeiculo, r.motorista, r.ent, txtCel(r.carga), its.length, Object.keys(pts).length, ultimaAtualizacao(r), r.sap];
          })
        }];
        if (comItens) abas.push({
          nome: 'Itens',
          cabecalho: { titulo: 'Relatório de planos · itens', subtitulo: cab.subtitulo, logo: cab.logo },
          colunas: ['Nome do Plano', 'Status do Plano', 'Placa', 'Motorista', 'Ponto de descarga', 'Macro ponto', 'Categoria', 'ID Integração', 'Pacote', 'Reserva', 'Material', 'Nome material', 'Qtd Prevista', 'Qtd Real', 'Und', 'Origem', 'Centro de custo', 'Ordem de manutenção', 'Ordem de transporte', 'Data carregamento', 'Hora carregamento', 'Tipo de movimento', 'Prioridade', 'Requisitante', '8ID Requisitante', 'E-mail Requisitante', 'Recebedor', '8ID Recebedor', 'Chegada no ponto', 'Saída do ponto', 'Data/hora recebimento', 'Comprovante', 'Tentativas receptor ausente', 'Não conformidade', 'Motivo', 'Status do item']
            .map(function (t) { return { titulo: t, largura: /Texto|Motivo|conformidade|E-mail|Requisitante$|Recebedor$|Motorista/.test(t) ? 30 : 16 }; }),
          linhas: [].concat.apply([], list.map(function (r) {
            return (ITEMS[r.nome] || []).map(function (it) {
              return [r.nome, r.status, r.placa, r.motorista, it.ponto, txtCel(it.macro), it.tipo, it.id, it.pacote, it.reserva, it.material, it.texto, numCel(it.qtd), numCel(it.qtdReal), it.und, it.origem, it.ccusto, txtCel(it.ordem), txtCel(it.ot), txtCel(it.dCarga), txtCel(it.hCarga), it.tpMov, it.prio, txtCel(it.reqNome), txtCel(it.req), txtCel(it.reqMail), txtCel(it.nomeReceb), txtCel(it.idReceb), txtCel(it.chegada), txtCel(it.saida), txtCel(it.dhReceb), it.comprovante === 'cracha' ? 'Foto do crachá' : it.comprovante === 'assinatura' ? 'Assinatura digital' : '', it.tentativas, it.nc, it.motivo, it.status];
            });
          }))
        });
        ENCO.exporta.xlsx(arquivo, abas);
      }
      function gerarPdf(list, comItens, titulo) {
        var e = ENCO.exporta.escape, d = new Date();
        var cab = '<header><img src="' + ENCO.img.logo + '" alt=""><div><h1>Relatório de planos</h1><p>' + e(filtrosRel(list)) + '</p></div></header>';
        var corpo = list.map(function (r) {
          var its = ITEMS[r.nome] || [], grp = [], gi = {};
          its.forEach(function (it) { if (!(it.ponto in gi)) { gi[it.ponto] = grp.length; grp.push({ ponto: it.ponto, its: [] }); } grp[gi[it.ponto]].its.push(it); });
          var fatos = [['Status', r.status], ['Rota', r.rota], ['Placa', r.placa + ' · ' + r.tipoVeiculo], ['Motorista', r.motorista + ' · 8ID ' + r.ent + ' · ' + ENCO.celular(r.ent)], ['Carregamento', r.carga], ['Última atualização', ultimaAtualizacao(r)], ['Enviado ao SAP', r.sap]];
          var tab = comItens && its.length ? '<table><thead><tr><th>Material</th><th>Nome material</th><th>Qtd prev.</th><th>Qtd real</th><th>Und</th><th>Ordem transp.</th><th>Requisitante</th><th>Recebedor</th><th>Recebido em</th><th>Status</th><th>Não conformidade</th><th>Motivo</th></tr></thead><tbody>' +
            grp.map(function (g) {
              return '<tr class="grp"><td colspan="12">Ponto de descarga: ' + e(g.ponto) + ' (' + g.its.length + (g.its.length === 1 ? ' item' : ' itens') + ')</td></tr>' +
                g.its.map(function (it) {
                  return '<tr><td class="n">' + e(it.material) + '</td><td>' + e(it.texto) + '</td><td class="n">' + e(it.qtd) + '</td><td class="n">' + e(it.qtdReal) + '</td><td>' + e(it.und) + '</td><td class="n">' + e(it.ot) + '</td><td>' + e(it.reqNome) + '<br>8ID ' + e(it.req) + '</td><td>' + (it.nomeReceb === '—' ? '—' : e(it.nomeReceb) + '<br>8ID ' + e(it.idReceb)) + '</td><td class="n">' + e(it.dhReceb) + '</td><td>' + e(it.status) + '</td><td>' + e(it.nc || '—') + '</td><td>' + e(it.motivo || '—') + '</td></tr>';
                }).join('');
            }).join('') + '</tbody></table>' : '';
          return '<section class="plano"><h3>Plano ' + e(r.nome) + '</h3><div class="fatos">' + fatos.map(function (f) { return '<span>' + f[0] + ': <b>' + e(f[1]) + '</b></span>'; }).join('') + '</div>' + tab + '</section>';
        }).join('');
        var rod = '<footer>Gerado em ' + pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear() + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ' por Paola Santiago · ENCO – Portal Web</footer>';
        return ENCO.exporta.pdf(titulo, cab + corpo + rod);
      }

      function render() {
        var a = state.applied;
        var list = filtrados();

        var active = a.sap ? 'sap' : (stList(a.status).length === 1 ? stList(a.status)[0] : '');
        scr.qsa('.tile').forEach(function (t) {
          var on = t.dataset.tile === active;
          t.classList.toggle('active', on);
          t.setAttribute('aria-pressed', on);
        });

        /* [S08] Paginação: volta para a página 1 quando os filtros mudam */
        var chave = JSON.stringify(a);
        if (chave !== pag.chave) { pag.chave = chave; pag.pg = 0; }
        var pags = Math.max(1, Math.ceil(list.length / pag.ps));
        if (pag.pg >= pags) pag.pg = pags - 1;
        $('pgInfo').textContent = 'Página ' + (pag.pg + 1) + ' de ' + pags + ' · ' + (list.length ? (pag.pg * pag.ps + 1) + '–' + Math.min(list.length, (pag.pg + 1) * pag.ps) + ' de ' + list.length : '0 planos');
        $('pgPrev').disabled = pag.pg === 0; $('pgNext').disabled = pag.pg >= pags - 1;
        $('tbody').innerHTML = list.slice(pag.pg * pag.ps, (pag.pg + 1) * pag.ps).map(function (r) {
          var c = ST[r.status], open = !!state.open[r.nome];
          var sapBg = r.sap === 'Sim' ? '#E1F3E8' : '#F1F1F6', sapFg = r.sap === 'Sim' ? '#1D6B3E' : '#4A4E6A';
          return '<div class="tr-wrap">' +
            '<div class="cols tr" role="row">' +
              '<span role="cell" class="num-cell" style="font-weight:600">' + r.nome + '</span>' +
              '<span role="cell" class="num-cell">' + r.placa + '</span>' +
              '<span role="cell">' + r.motorista + '</span>' +
              '<span role="cell" class="num-cell">' + (r.cIni && r.cIni !== '—' ? r.cIni.replace(' ', ' <span style="color:#6E7390">') + '</span>' : '<span style="color:#8B8FA6">Não carregado</span>') + '</span>' +
              '<span role="cell"><span class="badge" style="background:' + c[0] + ';color:' + c[1] + '"><span class="dot"></span>' + r.status + '</span></span>' +
              '<span role="cell"><span class="badge" style="background:' + sapBg + ';color:' + sapFg + '">' + r.sap + '</span></span>' +
              '<span role="cell" class="actions">' +
                '<button class="ib" aria-label="Ver rota" title="Ver rota" data-track data-row="' + r.nome + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14.1 6.3 9.9 4.2a2 2 0 0 0-1.8 0L3.6 6.5A1 1 0 0 0 3 7.4v12a1 1 0 0 0 1.4.9l3.7-1.9a2 2 0 0 1 1.8 0l4.2 2.1a2 2 0 0 0 1.8 0l4.5-2.3a1 1 0 0 0 .6-.9v-12a1 1 0 0 0-1.4-.9l-3.7 1.9a2 2 0 0 1-1.8 0Z"/><path d="M15 6.8v14"/><path d="M9 3.2v14"/></svg></button>' +
                /* [S05 aprovado] reenvio só com a permissão de Edição em "Reenviar Email de entrega" e só para plano Finalizado */
                (ENCO.pode('reenviarEmail') ? (r.status === 'Finalizado' ? '<button class="ib" aria-label="Reenviar relatório de entrega" title="Reenviar relatório de entrega" data-mail data-row="' + r.nome + '">' : '<button class="ib" aria-disabled="true" aria-label="Reenviar relatório de entrega (disponível apenas para planos finalizados)" title="Reenviar relatório de entrega – disponível apenas para planos finalizados" data-row="' + r.nome + '">') + '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></button>' : '') +
                sapBtn(r) + cancelBtn(r) +
                '<button class="ib expand" aria-label="Ver detalhes" aria-expanded="' + open + '" data-row="' + r.nome + '"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></button>' +
              '</span>' +
            '</div>' +
            (open ? detail(r) : '') +
          '</div>';
        }).join('');

        $('empty').hidden = list.length > 0;
        $('resultLabel').textContent = list.length + (list.length === 1 ? ' plano' : ' planos');

        var label = a.sap ? 'Não enviados ao SAP' : (stList(a.status).length ? 'Status: ' + stList(a.status).join(', ') : (a.nomes ? a.titulo || 'Planos selecionados' : ''));
        if (a.name) label = (label ? label + ' · ' : '') + 'Busca: ' + a.name;
        if (a.placa) label = (label ? label + ' · ' : '') + 'Placa: ' + a.placa;
        if (a.mot) label = (label ? label + ' · ' : '') + 'Motorista: ' + a.mot;
        if (a.envSap) label = (label ? label + ' · ' : '') + 'Enviado SAP: ' + a.envSap;
        $('filterChip').hidden = !label;
        $('filterLabel').textContent = label;
        var eleg = ROWS.filter(podeReprocessar).length;
        $('sapBatch').hidden = !(a.sap && eleg);
        $('sapBatchLab').textContent = 'Reprocessar envio ao SAP (' + eleg + ')';
        marcarFiltros();
        renderPeriod();
      }

      /* [S07] Status do Plano com seleção múltipla. O botão guarda os status escolhidos em .value
         (separados por "|") para o destaque de filtro; vazio = Todos. */
      function stList(s) { return Array.isArray(s) ? s : (s ? [s] : []); }
      function getStatus() { return scr.qsa('#qStatusPop input:checked').length ? Array.prototype.map.call(scr.qsa('#qStatusPop input:checked'), function (c) { return c.value; }) : []; }
      function setStatus(lista) {
        scr.qsa('#qStatusPop input').forEach(function (c) { c.checked = lista.indexOf(c.value) >= 0; });
        sincStatus();
      }
      function sincStatus() {
        var l = getStatus();
        $('qStatusTxt').textContent = !l.length ? 'Todos' : l.length <= 2 ? l.join(', ') : l.length + ' status';
        $('qStatus').value = l.join('|');
        $('qStatus').classList.toggle('hl', !!l.length);
      }
      function popStatus(abrir) { $('qStatusPop').hidden = !abrir; $('qStatus').setAttribute('aria-expanded', abrir); }
      $('qStatus').addEventListener('click', function () { popStatus($('qStatusPop').hidden); });
      $('qStatusPop').addEventListener('change', sincStatus);
      $('qStatusClr').addEventListener('click', function () { setStatus([]); });
      scr.onDoc('click', function (e) { if (!e.target.closest('#qStatusBox')) popStatus(false); });
      scr.onDoc('keydown', function (e) { if (e.key === 'Escape' && !$('qStatusPop').hidden) { popStatus(false); $('qStatus').focus(); } });

      /* [S08] Paginação da lista de planos: 10, 25 ou 50 por página */
      var pag = { pg: 0, ps: 10, chave: '' };
      $('pgSize').addEventListener('change', function (e) { pag.ps = +e.target.value; pag.pg = 0; render(); });
      $('pgPrev').addEventListener('click', function () { if (pag.pg > 0) { pag.pg--; render(); } });
      $('pgNext').addEventListener('click', function () { pag.pg++; render(); });

      /* [S04 aprovado][REAL] Cancelar plano ("Cancelar Plano de Descarga"): só para plano Em aberto ou
         Em andamento sem nenhum item entregue; irreversível. O plano vai para "Cancelamento Solicitado"
         (depois "Cancelamento Enviado", quando o SAP confirma) e os itens recebem a NC "PLANO CANCELADO WEB". */
      var CANCEL_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m5.7 5.7 12.6 12.6"/></svg>';
      function podeCancelar(r) {
        if (r.status !== 'Em aberto' && r.status !== 'Em andamento') return false;
        return !(ITEMS[r.nome] || []).some(function (it) { return it.status === 'Confirmado'; });
      }
      function motivoCancelar(r) {
        if (r.status !== 'Em aberto' && r.status !== 'Em andamento') return 'só para planos em aberto ou em andamento';
        return 'plano com itens entregues';
      }
      function cancelBtn(r) {
        if (!ENCO.pode('cancelarPlano')) return '';
        return podeCancelar(r)
          ? '<button class="ib ib-danger" aria-label="Cancelar plano" title="Cancelar plano" data-cancel data-row="' + r.nome + '">' + CANCEL_SVG + '</button>'
          : '<button class="ib" aria-disabled="true" aria-label="Cancelar plano: ' + motivoCancelar(r) + '" title="Cancelar plano: ' + motivoCancelar(r) + '" data-row="' + r.nome + '">' + CANCEL_SVG + '</button>';
      }
      var cnOv = document.createElement('div'); cnOv.className = 'ov'; cnOv.hidden = true;
      cnOv.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="cnTitle"><div class="m-head"><div class="icon-tile" style="width:40px;height:40px;background:#FBE4E4;color:#B42318">' + CANCEL_SVG + '</div><div style="flex-grow:1"><h3 id="cnTitle">Cancelar plano</h3><p id="cnSub"></p></div><button class="ib" id="cnClose" aria-label="Fechar">' + X_SVG + '</button></div>' +
        '<div class="m-body"><div class="cn-imp" id="cnImp"></div>' +
        '<p class="cn-warn"><b>Não é possível desfazer.</b> O plano fica como Cancelamento Solicitado e o SAP é avisado.</p>' +
        '<label class="fld"><span class="lbl">Motivo do cancelamento <span style="color:#B42318">*</span></span><textarea class="inp" id="cnMot" rows="3" maxlength="200" placeholder="Informe o motivo"></textarea><span class="k" id="cnCnt">0/200</span></label></div>' +
        '<div class="m-foot"><button class="btn btn-g" id="cnCancel">Voltar</button><button class="btn btn-p cn-ok" id="cnOk" disabled>' + CANCEL_SVG + '<span>Cancelar plano</span></button></div></div>';
      scr.layer.appendChild(cnOv);
      var cnCtx = null;
      function openCancel(k) {
        var r = ROWS.filter(function (x) { return x.nome === k; })[0], its = ITEMS[k] || [], pts = {};
        its.forEach(function (it) { pts[it.ponto] = 1; });
        cnCtx = k; lastFocus = document.activeElement;
        $('cnSub').textContent = 'Plano ' + k + ' · ' + r.placa + ' · ' + r.motorista;
        $('cnImp').innerHTML = '<div><span class="k">Status atual</span><b>' + r.status + '</b></div><div><span class="k">Itens</span><b>' + its.length + '</b></div><div><span class="k">Pontos de descarga</span><b>' + Object.keys(pts).length + '</b></div><div><span class="k">Rota</span><b>' + r.rota + '</b></div>';
        $('cnMot').value = ''; $('cnCnt').textContent = '0/200'; $('cnOk').disabled = true;
        cnOv.hidden = false; $('cnMot').focus();
      }
      function closeCancel() { cnOv.hidden = true; cnCtx = null; if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }
      $('cnMot').addEventListener('input', function () { var v = $('cnMot').value; $('cnCnt').textContent = v.length + '/200'; $('cnOk').disabled = !v.trim(); });
      $('cnClose').addEventListener('click', closeCancel);
      $('cnCancel').addEventListener('click', closeCancel);
      cnOv.addEventListener('click', function (e) { if (e.target === cnOv) closeCancel(); });
      scr.onDoc('keydown', function (e) { if (e.key === 'Escape' && !cnOv.hidden) closeCancel(); });
      $('cnOk').addEventListener('click', function () {
        var k = cnCtx, mot = $('cnMot').value.trim();
        if (!k || !mot) return;
        ROWS.forEach(function (r) { if (r.nome === k) { r.status = 'Cancelamento Solicitado'; r.motivoCancel = mot; } });
        (ITEMS[k] || []).forEach(function (it) { it.status = 'Cancelado'; it.nc = 'PLANO CANCELADO WEB'; it.motivo = mot; });
        closeCancel(); updateCounts(); render();
        showToast('Plano ' + k + ' cancelado. Status: Cancelamento Solicitado.');
      });

      /* Campos de filtro preenchidos ficam destacados (como as datas de carregamento), já ao digitar ou escolher */
      function marcarFiltros() {
        scr.qsa('#grid .inp').forEach(function (el) { if (el.id !== 'dIni' && el.id !== 'dFim') el.classList.toggle('hl', !!el.value.trim()); });
      }
      $('grid').addEventListener('input', marcarFiltros);
      $('grid').addEventListener('change', marcarFiltros);
      function limparBasicos() { $('qPlaca').value = ''; $('qMot').value = ''; $('qSap').value = ''; }
      function clearAll() {
        $('qName').value = '';
        setStatus([]);
        limparBasicos();
        setDefaultPeriod();
        state.applied = { name: '', status: '', sap: false };
        render();
      }

      // Counts
      function updateCounts() {
        scr.qsa('[data-count]').forEach(function (el) {
          var k = el.dataset.count;
          el.textContent = ROWS.filter(function (r) { return k === 'sap' ? r.sap === 'Não' : r.status === k; }).length;
        });
      }
      updateCounts();

      /* [S01 aprovado][REAL] Reprocessar envio ao SAP – mesma regra de dashboard.component.ts › podeReprocessar:
         só para plano com StatusEnvioSap = false e
           · status terminal (Finalizado, Concluido, Cancelamento Enviado, Cancelamento Solicitado), ou
           · "Em andamento" travado: todos os itens já saíram de Em aberto / Em andamento.
         Disponível por linha e em lote a partir do card "Não enviados ao SAP".
         Na implementação, exige permissão de edição em Gestão de Planos (funcionalidade 1). */
      var SAP_TERMINAIS = ['Finalizado', 'Concluido', 'Cancelamento Enviado', 'Cancelamento Solicitado'];
      function podeReprocessar(r) {
        if (r.sap !== 'Não') return false;
        if (SAP_TERMINAIS.indexOf(r.status) >= 0) return true;
        var its = ITEMS[r.nome] || [];
        return r.status === 'Em andamento' && its.length > 0 && its.every(function (it) { return it.status !== 'Em aberto' && it.status !== 'Em andamento'; });
      }
      function motivoSap(r) {
        if (r.sap !== 'Não') return 'Plano já enviado ao SAP';
        if (r.status === 'Em aberto') return 'Plano ainda não iniciado';
        return 'Plano em execução: há itens em aberto ou em andamento';
      }
      var SAP_SVG = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m9 15 3-3 3 3"/><path d="M12 12v6"/></svg>';
      function sapBtn(r) {
        return podeReprocessar(r)
          ? '<button class="ib" style="color:#B23E0B" aria-label="Reprocessar envio ao SAP" title="Reprocessar envio ao SAP" data-sap data-row="' + r.nome + '">' + SAP_SVG + '</button>'
          : '<button class="ib" aria-disabled="true" aria-label="Reprocessar envio ao SAP (indisponível: ' + motivoSap(r) + ')" title="Reprocessar envio ao SAP – ' + motivoSap(r) + '" data-row="' + r.nome + '">' + SAP_SVG + '</button>';
      }

      var sapOv = document.createElement('div'); sapOv.className = 'ov'; sapOv.hidden = true;
      sapOv.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="sTitle"><div class="m-head"><div class="icon-tile" style="width:40px;height:40px;background:#FBE4DA;color:#B23E0B">' + SAP_SVG + '</div><div style="flex-grow:1"><h3 id="sTitle">Reprocessar envio ao SAP</h3><p id="sSub"></p></div><button class="ib" id="sClose" aria-label="Fechar">' + X_SVG + '</button></div><div class="m-body" id="sBody"></div><div class="m-foot"><span class="k" id="sCount" style="margin-right:auto"></span><button class="btn btn-g" id="sCancel">Cancelar</button><button class="btn btn-p" id="sOk">' + SAP_SVG + '<span>Reprocessar</span></button></div></div>';
      scr.layer.appendChild(sapOv);
      var sapCtx = [];
      function openSap(nomes) {
        sapCtx = nomes; lastFocus = document.activeElement;
        $('sSub').textContent = nomes.length === 1
          ? 'O status final do plano ' + nomes[0] + ' e de seus itens será reenviado ao SAP.'
          : 'O status final dos planos selecionados e de seus itens será reenviado ao SAP.';
        $('sBody').innerHTML = nomes.map(function (k) {
          var r = ROWS.filter(function (x) { return x.nome === k; })[0], c = ST[r.status], n = (ITEMS[k] || []).length;
          return '<label class="opt"><input type="checkbox" value="' + k + '" checked><span class="opt-main"><span class="sc-title">Plano ' + k + ' <span class="badge" style="background:' + c[0] + ';color:' + c[1] + '">' + r.status + '</span></span><span class="k">' + r.placa + ' · ' + r.motorista + ' · ' + n + (n === 1 ? ' item' : ' itens') + '</span></span></label>';
        }).join('');
        syncSap(); sapOv.hidden = false; $('sOk').focus();
      }
      function syncSap() {
        var n = sapOv.querySelectorAll('#sBody input:checked').length;
        $('sCount').textContent = n + (n === 1 ? ' plano selecionado' : ' planos selecionados');
        $('sOk').disabled = !n; $('sOk').style.opacity = n ? '' : '.5';
      }
      function closeSap() { sapOv.hidden = true; sapCtx = []; if (lastFocus && document.body.contains(lastFocus)) lastFocus.focus(); }
      $('sBody').addEventListener('change', syncSap);
      $('sClose').addEventListener('click', closeSap);
      $('sCancel').addEventListener('click', closeSap);
      sapOv.addEventListener('click', function (e) { if (e.target === sapOv) closeSap(); });
      scr.onDoc('keydown', function (e) { if (e.key === 'Escape' && !sapOv.hidden) closeSap(); });
      $('sOk').addEventListener('click', function () {
        var sel = Array.prototype.map.call(sapOv.querySelectorAll('#sBody input:checked'), function (c) { return c.value; });
        sel.forEach(function (k) { ROWS.forEach(function (r) { if (r.nome === k) r.sap = 'Sim'; }); });
        closeSap(); updateCounts(); render();
        showToast(sel.length === 1 ? 'Plano ' + sel[0] + ' reenviado ao SAP.' : sel.length + ' planos reenviados ao SAP.');
      });
      $('sapBatch').addEventListener('click', function () { openSap(ROWS.filter(podeReprocessar).map(function (r) { return r.nome; })); });

      // Events
      

      scr.qsa('.tile').forEach(function (t) {
        t.addEventListener('click', function () {
          var key = t.dataset.tile, a = state.applied, active = a.sap ? 'sap' : (stList(a.status).length === 1 ? stList(a.status)[0] : '');
          limparBasicos();
          if (active === key) { state.applied = { name: '', status: '', sap: false }; setStatus([]); }
          else if (key === 'sap') { state.applied = { name: '', status: '', sap: true }; setStatus([]); }
          else { state.applied = { name: '', status: key, sap: false }; setStatus([key]); }
          render();
        });
      });

      scr.qsa('.seg').forEach(function (b) {
        b.addEventListener('click', function () {
          var basic = b.dataset.mode === 'basic';
          $('grid').classList.toggle('basic', basic);
          scr.qsa('.seg').forEach(function (s) { var on = s === b; s.classList.toggle('on', on); s.setAttribute('aria-pressed', on); });
          app.classList.add('filters-open');
          syncFiltersToggle();
        });
      });

      function syncFiltersToggle() {
        var open = app.classList.contains('filters-open');
        $('toggleFilters').setAttribute('aria-expanded', open);
        $('toggleFiltersLabel').textContent = open ? 'Recolher' : 'Expandir';
      }
      $('toggleFilters').addEventListener('click', function () { app.classList.toggle('filters-open'); syncFiltersToggle(); });

      $('run').addEventListener('click', function () {
        state.applied = { name: $('qName').value.trim(), status: getStatus(), sap: false, placa: $('qPlaca').value.trim().toUpperCase(), mot: $('qMot').value.trim(), envSap: $('qSap').value };
        render();
      });
      ['qName', 'qPlaca', 'qMot'].forEach(function (id) { $(id).addEventListener('keydown', function (e) { if (e.key === 'Enter') $('run').click(); }); });
      $('clear').addEventListener('click', clearAll);
      $('clearChip').addEventListener('click', clearAll);

      /* Vindo da Home: card de "Rotas em andamento" filtra pelo plano e abre o detalhe;
         "Ver todos os planos" (abrirPlano vazio) limpa os filtros e lista todos */
      function irParaLista() { setTimeout(function () { var w = scr.qs('#tbody .tr-wrap'); if (w) w.scrollIntoView({ block: 'start', behavior: 'smooth' }); }, 60); }
      function abrirPlano(k) {
        setStatus([]); limparBasicos(); $('qName').value = k;
        state.applied = { name: k, status: '', sap: false };
        state.open = {}; state.open[k] = true;
        render(); irParaLista();
      }
      ENCO.bus.on(function (e) {
        if (!e.data || typeof e.data.abrirPlano !== 'string') return;
        var k = e.data.abrirPlano;
        if (!k) { state.open = {}; clearAll(); setTimeout(function () { scr.root.scrollIntoView({ block: 'start' }); }, 60); return; }
        abrirPlano(k);
      });

      /* Vindo da Home: cards de "Precisa da sua atenção" mostram só os planos do card.
         escopo = { nomes: [...], titulo } (um plano só: filtra e abre o detalhe) ou { sap: true } */
      ENCO.bus.on(function (e) {
        var esc = e.data && e.data.abrirPlanos;
        if (!esc) return;
        var nomes = (esc.nomes || []).filter(function (k) { return ROWS.some(function (r) { return r.nome === k; }); });
        if (nomes.length === 1) { abrirPlano(nomes[0]); return; }
        if (esc.status || esc.envSap) {
          limparBasicos(); $('qName').value = ''; setStatus(esc.status ? [esc.status] : []); $('qSap').value = esc.envSap || '';
          state.open = {};
          state.applied = { name: '', status: esc.status || '', sap: false, envSap: esc.envSap || '' };
          render(); irParaLista(); return;
        }
        setStatus([]); limparBasicos(); $('qName').value = '';
        state.open = {};
        state.applied = esc.sap ? { name: '', status: '', sap: true } : { name: '', status: '', sap: false, nomes: nomes, titulo: esc.titulo };
        render(); irParaLista();
      });
      $('dIni').addEventListener('change', renderPeriod);
      $('dFim').addEventListener('change', renderPeriod);

      $('tbody').addEventListener('click', function (e) {
        var b = e.target.closest('button[data-row]');
        if (!b || b.disabled || b.getAttribute('aria-disabled') === 'true') return;
        var k = b.dataset.row;
        if (b.classList.contains('expand')) { state.open[k] = !state.open[k]; render(); return; }
        if (b.classList.contains('dtab')) {
          state.tab[k] = b.dataset.tab; render();
          var f = scr.qs('.dtab[data-row="' + k + '"][data-tab="' + b.dataset.tab + '"]'); if (f) f.focus();
          return;
        }
        if (b.hasAttribute('data-track')) { openTimeline(k); return; }
        if (b.hasAttribute('data-mail')) { openReport(k); return; }
        if (b.hasAttribute('data-sap')) { openSap([k]); return; }
        if (b.hasAttribute('data-cancel')) { openCancel(k); return; }
        if (b.hasAttribute('data-item')) { openItem(k, b.dataset.item); return; }
        if (b.hasAttribute('data-resend-all')) { openResend(k, null); return; }
        if (b.hasAttribute('data-resend')) { openResend(k, [+b.dataset.i]); return; }
      });

      setDefaultPeriod();
      render();
    })();
  }
});