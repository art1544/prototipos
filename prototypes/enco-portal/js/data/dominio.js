/* ==========================================================================
   ENCO · Domínio real (fonte: API/Ternium.EntregaEColeta.Dom/Util/Constantes.cs,
   database/scripts/01-schema.sql e Frontend/src/app/modules/client/client-pages-menu.ts).
   As telas usam estes valores para que nomes de status, códigos e limites de
   campos batam com o sistema atual.
   ========================================================================== */
(function () {
  window.ENCO = window.ENCO || {};

  ENCO.dominio = {
    /* Tabela StatusPlanoDescarga (Constantes.STATUS_PLANO_*). Textos como gravados no banco. */
    statusPlano: [
      { cod: 1, nome: 'Em aberto' },
      { cod: 2, nome: 'Em andamento' },
      { cod: 3, nome: 'Finalizado' },
      { cod: 4, nome: 'Cancelamento Solicitado' },
      { cod: 5, nome: 'Cancelamento Enviado' },
      { cod: 6, nome: 'Concluido' }
    ],

    /* Tabela StatusItem (Constantes.StatusItemEnum). Desfecho final do item no servidor:
       Confirmado (3) ou Cancelado (7). "Receptor ausente" é temporário no app, com até
       3 tentativas (ItemPlano.TentativasReceptorAusente, card 549566). */
    statusItem: [
      { cod: 1, nome: 'Em aberto' },
      { cod: 2, nome: 'Em andamento' },
      { cod: 3, nome: 'Confirmado' },
      { cod: 4, nome: 'Receptor ausente' },
      { cod: 5, nome: 'Adicionado ao final da rota' },
      { cod: 6, nome: 'Erro na execução do plano' },
      { cod: 7, nome: 'Cancelado' }
    ],
    tentativasReceptorAusente: 3,

    /* Tabela StatusColeta (Constantes.StatusColetaEnum) */
    statusColeta: [
      { cod: 1, nome: 'Em aberto' },
      { cod: 2, nome: 'Em andamento' },
      { cod: 3, nome: 'Confirmado' },
      { cod: 4, nome: 'Receptor ausente' },
      { cod: 5, nome: 'Adicionado ao final da rota' },
      { cod: 6, nome: 'Cancelado' },
      { cod: 7, nome: 'Rejeitado' },
      { cod: 8, nome: 'Aceito pelo controlador' },
      { cod: 9, nome: 'Aceito pelo entregador' }
    ],

    /* Constantes.TipoMovimentoCategoria – somente leitura no portal */
    categoriasMovimento: ['Entrega', 'Coleta'],

    /* Constantes.CodigosTipoNaoConformidade (tabela TipoNaoConformidade, somente leitura) */
    tiposNaoConformidade: [
      { cod: 1, nome: 'Não entrega' },
      { cod: 3, nome: 'Não coleta' }
    ],
    /* Não conformidades gravadas pelo próprio sistema (não podem ser removidas) */
    ncSistema: ['PLANO CANCELADO WEB', 'ITEM CANCELADO WEB', 'RETORNO JUSTIFICADO', 'RECEPTOR AUSENTE'],

    /* Perfis com regra fixa no código */
    perfis: { entregador: 3, controlador: 4 },

    /* Funcionalidades (CodFuncionalidade) usadas pelo menu e pelas permissões de edição */
    funcionalidades: [
      { cod: 1, nome: 'Gestão de Planos', rota: 'planos' },
      { cod: 2, nome: 'Veículos', rota: 'veiculos' },
      { cod: 3, nome: 'Macro Pontos', rota: 'macro' },
      { cod: 4, nome: 'Áreas Responsáveis', rota: 'areas' },
      { cod: 5, nome: 'Não Conformidades', rota: 'nc' },
      { cod: 6, nome: 'Gestão de Rotas', rota: 'rotas' },
      { cod: 7, nome: 'Pontos de Descarga', rota: 'pontos' },
      { cod: 8, nome: 'Prioridades', rota: 'prioridades' },
      { cod: 9, nome: 'Tipos de Movimento', rota: 'movimentos' },
      { cod: 10, nome: 'Coletas Solicitadas', rota: 'coletas' },
      { cod: 11, nome: 'Coletas Pendentes', rota: 'coletas' },
      { cod: 12, nome: 'Gestão de Perfis', rota: 'perfis' },
      { cod: 13, nome: 'Relatórios e Dashboards', rota: 'relatorios' },
      { cod: 14, nome: 'Configurações', rota: 'configuracoes' },
      { cod: 15, nome: 'Tipo Veículo', rota: 'tipos' },
      { cod: 16, nome: 'Usuários', rota: 'usuarios' },
      { cod: 17, nome: 'Administrador de Perfis' },
      /* Criada pelo script 556877; o portal localiza o código pela descrição */
      { cod: null, nome: 'Reenviar Email de entrega do Plano de Descarga', rota: 'planos' }
    ],

    /* Tamanhos máximos das colunas no banco (01-schema.sql) */
    limites: {
      areaNome: 20, areaDescricao: 100,
      macroPontoNome: 20,
      pontoIdentificacao: 50, pontoDescricao: 100, pontoEndereco: 50,
      placa: 7, tipoVeiculoNome: 50,
      prioridadeDescricao: 100, tipoMovimentoDescricao: 100,
      ncDescricao: 100, ncIdentificacao: 50,
      perfilNome: 40, perfilGrupoAD: 40,
      contatoNome: 100, contatoEmail: 100, contatoCelular: 15, c8id: 20,
      rotaDescricao: 50,
      configuracaoValor: 20, configuracaoDescricao: 100
    },

    /* Dashboard de tempo de descarga: período obrigatório, máximo de 90 dias */
    dashboardMaxDias: 90
  };

  /* [REAL] Usuario.Celular (varchar 15, opcional). No protótipo o número é derivado do 8ID para
     que a mesma pessoa tenha o mesmo celular em todas as telas. */
  /* Sessão do usuário logado (fictícia). [S05] O reenvio do e-mail de entrega depende da funcionalidade
     "Reenviar Email de entrega do Plano de Descarga" com Edição (vinculada ao perfil Controlador).
     Troque para false para ver a Gestão de Planos de quem não tem a permissão. */
  ENCO.sessao = {
    nome: 'Paola Santiago',
    permissoes: { reenviarEmail: true, cancelarPlano: true }
  };
  ENCO.pode = function (p) { return !!(ENCO.sessao.permissoes || {})[p]; };

  ENCO.celular = function (id8) {
    var h = 0, s = String(id8);
    for (var i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i) * 7919) % 99999989;
    h = (h * 48271) % 99999989;
    var n = String(h % 100000000 + 100000000).slice(1);
    return '(21) 9' + n.slice(0, 4) + '-' + n.slice(4, 8);
  };
})();
