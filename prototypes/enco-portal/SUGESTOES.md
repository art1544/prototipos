# ENCO Portal Web · Protótipo — ajustes feitos e sugestões para aprovação

Referência: código atual em `Enco(Entrega e Coletas)` (API .NET `Ternium.EntregaEColeta.Dom`,
Angular `Frontend/src/app`, banco `database/scripts/01-schema.sql`) e as regras em
`Documents/DocumentAIReadme/BusinessRulesDocs`.

---

## Parte 1 — Ajustes já aplicados no protótipo (marcados `[REAL]` no código)

| # | Tela | O que mudou | Fonte no código real |
|---|------|-------------|----------------------|
| A1 | Gestão de Planos | Filtro "Status do Plano" passou a ter todos os status reais: Em aberto, Em andamento, Finalizado, Concluido, Cancelamento Solicitado, Cancelamento Enviado. | `Constantes.StatusPlanoDescargaString` / `STATUS_PLANO_*` |
| A2 | Gestão de Planos | Status do item seguem a tabela `StatusItem`: "Em trânsito" → **Em andamento**, "Pendente" → **Em aberto** (cores para Receptor ausente, Adicionado ao final da rota, Erro na execução e Cancelado). | `Constantes.StatusItemEnum` |
| A3 | Gestão de Planos | Resumo do plano mostra só campos de `PlanoDescarga`: Motorista e Entregador (8ID) **separados**, Saída da área, Chegada na área e Enviado ao SAP. Resolve OBS-06. | `PlanoDescargaCompletoModelo` (NomeMotorista, CodUsuario, DataHoraSaidaArea, DataHoraChegadaArea, StatusEnvioSap) |
| A4 | Gestão de Planos | Prioridade, Tipo de movimento e ID Integração saíram do resumo: são do **item** (podem variar no mesmo plano). Nova coluna "Prioridade" na tabela de itens. Resolve OBS-07. | `ItemPlano.CodPrioridade`, `CodTipoMovimento`, `IdIntegracao` |
| A5 | Coletas › Pendentes | Removida a edição de quantidade/origem/tipo de movimento (a API não permite). Agora cada coleta tem **Aceitar** (status 8) / **Rejeitar** (status 7), envio em lote e checagem no SAP: coleta inativa no SAP não é alterada e o usuário vê "Id de integração / status atual no SAP". | `listagem-coletas-pendentes.component.ts`, `StatusColetaEnum` |
| A6 | Coletas › Solicitadas | Status com os nomes reais da tabela `StatusColeta`: Em aberto, Em andamento, Confirmado, Aceito pelo controlador, Rejeitado. | `Constantes.StatusColetaEnum` |
| A7 | Perfis | Lista de funcionalidades alinhada à tabela `Funcionalidade`: "Geração de relatórios **e dashboards**" (mesma funcionalidade 13) e inclusão de "Administrador de perfis" (17). | `client-pages-menu.ts`, `gestao-perfil.component.ts` |
| A8 | Cadastros | Tamanho máximo dos campos igual às colunas do banco: Área nome 20 / descrição 100; Macro ponto nome 20; Rota nome 50; Ponto identificação 50, descrição 100, endereço 50; Contato 8ID 20, nome 100, e-mail 100; NC identificação 50, descrição 100; Prioridade e Tipo de movimento descrição 100. | `01-schema.sql` |
| A10 | Gestão de Planos | Listagem de itens só com o essencial: Material, Texto Breve, Qtd Prevista, Und, Ordem de Transporte, Requisitante (nome + 8ID), Recebedor (nome + 8ID), Status, Não Conformidade e Motivo. Botão "Ver detalhe do item" abre todos os demais campos (identificação, carregamento/movimento, entrega no ponto, pessoas, ocorrência) e os comprovantes: assinatura digital **ou** foto do crachá do recebedor, e foto da ocorrência/cancelamento, quando houver. | `ItemPlanoCompletoModelo` (AssinaturaDigital, ImagemAssinaturaDigital, ImagemNaoConformidade), `ItemPlanoFiltrado`, script 549566 |
| A11 | Gestão de Planos | Resumo do plano: Nome, Status, Área responsável, Rota, Placa, Tipo de veículo, Motorista (nome + 8ID num campo só), Itens/pontos, Última atualização e Enviado ao SAP. Por decisão, ficam fora: código do plano, saída/chegada na área com posições e coletas vinculadas. Bloco "Alterações na execução da rota" (troca de ponto/veículo/entregador, tempo de espera) com justificativa e estados atual/esperado/solicitado. | `PlanoDescargaCompletoModelo` (CodArea, Veiculo, NomeMotorista + CodUsuario, DataHoraUltimaAtualizacao), tabela `MudancaExecucaoRota` |
| A12 | Gestão de Planos | "Gerar relatório" agora exporta os **planos listados** (mesmos filtros da tela) em **Excel (.xlsx)** – abas "Planos" e "Itens" com todos os campos, filtro e cabeçalho fixo – ou em **PDF** (impressão do navegador → "Salvar como PDF"), um bloco por plano com resumo e itens agrupados por ponto. Opção de incluir ou não os itens. Sem bibliotecas: `js/core/exporta.js`. | Angular: `excel.service.ts` / `irTelaRelatorio()`; campos de `RelatorioDetalhado` |
| A13 | Gestão de Planos | Filtros básicos ganharam Placa, Motorista (nome ou 8ID) e Enviado SAP (o "8ID do entregador" do avançado foi absorvido por Motorista). Coluna "Nome" → "Plano". "Gerar relatório" foi para o lado de "Executar busca". "Cadastrar planilha" retirado do portal (Planos e Início). | `FiltroPlanos` (placa, entregador8id) |
| A14 | Todas | Sem textos em caixa alta: removido o `text-transform: uppercase` de títulos, cabeçalhos e rótulos; nomes de material, de pessoas e descrições passaram para escrita normal. Continuam em maiúsculas só os códigos (placa, 8ID, códigos de NC, identificação de ponto/macro ponto, origem SAP). "Texto breve" → "Nome material". | — |
| A15 | Relatórios | Tela **Relatórios retirada** (menu, rota e arquivos): o relatório passou a ser gerado na própria Gestão de Planos (A12). O "Gerar relatório" da Início agora leva à Gestão de Planos. | — |
| A16 | Coletas | **Coletas desligada por feature flag** (`assets/js/config.js` → `coletas: false`). O código continua no projeto; desligada, some a tela Coletas (menu e rota), os indicadores/alertas/série do gráfico de coletas na Início, os planos de coleta na Gestão de Planos e as funcionalidades "Gestão de coletas pendentes/solicitadas" em Perfis. Para religar: `coletas: true`. Cadastros de referência (categoria "Coleta" em Tipos de movimento, tipos de NC "Não coleta"/"Coleta com divergência") foram mantidos. | — |
| A17 | Cadastros | Correção: as abas que levam a outra tela (Veículos ↔ Tipos de veículo, Pontos ↔ Macro pontos, Tipos de movimento ↔ Prioridades ↔ Não conformidades) voltaram a funcionar, inclusive com as setas do teclado. | — |
| A18 | Pontos de descarga | Detalhe do ponto reorganizado: dados do ponto em cima (foto à esquerda; descrição, endereço, localização e "Abrir no mapa" à direita) e contatos listados embaixo, em duas colunas. Removido o botão "Editar ponto" duplicado do detalhe (a edição fica no lápis da linha). | — |
| A19 | Todas | Imagens de exemplo (fotos dos pontos, assinatura, crachá, ocorrência e logo) embutidas em `assets/img/` (convertidas em data URI por `assets/js/dados/imagens.js`), para aparecerem em qualquer forma de abertura do `index.html`. Abas entre telas sem barra de rolagem. Filtro "Nome do Plano" → "Plano". | — |
| A20 | Configurações | Bloco "Planos pendentes de sincronização" retirado: o reenvio ao SAP fica só na Gestão de Planos (S01). (Depois, os E-mails adicionais também saíram: ver A31.) | — |
| A21 | Pontos de descarga | Ao expandir o ponto, todos os contatos já aparecem (sem "Ver todos"). | — |
| A22 | Gestão de Perfis | Perfis com os nomes reais dos grupos do AD: **Administrador** (1), **Consultas** (2), **Controladores** (4), **Entregadores** (3). Permissões ajustadas pelo código: Administrador – perfis, administrador de perfis, usuários, logs e configurações; Consultas – só visualização (sem perfis/logs/reenvio de e-mail); Controladores – edição em planos, reenvio de e-mail, veículos, macro pontos, usuários (e coletas), **só nas áreas em que estão vinculados**; Entregadores – planos (ver), pontos e veículos. "Relatórios e dashboards" passou a "Dashboards". **[OBS-18]** a carga de `PerfilFuncionalidade` não está no repositório: confirmar no banco com a consulta comentada em `perfis.js`. | `Acessos-Ternium.md`, `insert-dev-user.sql`, `556877-AddFuncReenviarEmail.sql`, `FuncionalidadesNegocio.cs` |
| A23 | Áreas Responsáveis | Controladores e entregadores listados direto abaixo de cada área (nome + 8ID), sem precisar clicar; o botão "Gerenciar (n)" continua para incluir/remover. | `AreaEntregadorControlador` |
| A24 | Dashboards | Botão "Exportar" retirado; "Gerar relatório" fica na barra de filtros e gera PDF com o filtro aplicado, os indicadores e os gráficos exatamente como estão na tela. | — |
| A25 | Relatórios (Planos e Dashboards) | PDF gerado direto no navegador, sem janela de impressão: arquivo `.pdf` baixado já em **A4 paisagem** (842×595 pt), independente da impressora escolhida. Planos: paginado por plano, sem cortar blocos. Dashboard: uma página com indicadores e gráficos. | `js/core/exporta.js` |
| A26 | Todas | Revisão de itens quebrados em 1024, 1287 e 1366 px (todas as telas, com linhas expandidas): etiquetas, chips e botões não quebram linha; textos antes cortados com "…" (e-mail dos contatos, nomes de pessoas, descrições, nomes de ponto) passam a quebrar linha; coluna "Enviado SAP" ajustada; check do card de perfil sem disputar espaço com a descrição. Centralizado em `css/ajustes.css`. | — |
| A27 | Gestão de Perfis | Retiradas as chaves de "habilitar tudo" das seções (Operação, Cadastros…): as permissões são ligadas uma a uma. | — |
| A28 | Usuários / Configurações / Áreas | Ícones dos perfis restaurados em Usuários (estavam ligados aos nomes antigos). "Tempo de espera" → "Tempo de espera padrão dos pontos de descarga". Áreas: controladores e entregadores em listas simples por papel (uma pessoa por linha, nome e 8ID, ordem alfabética, colunas automáticas, sem rolagem interna) com filtro por nome/8ID. | — |
| A29 | Configurações | Explicação do tempo de espera padrão conforme o código: é o tempo-base em cada ponto; o "Tempo extra de espera" de cada ponto soma ou reduz, e a redução não pode passar desse valor. Mostra a equivalência ("Equivale a 12 minutos e 30 segundos") e um exemplo. | `PontoValidador.ValidateTempoExtra`, `ConfiguracaoPersistencia.ListarConfiguracaoTempoExtraPadrao` |
| A30 | Dashboards | PDF com a tela inteira: página 1 com filtro, indicadores e gráficos; páginas seguintes com o "Detalhamento das entregas" completo (todas as entregas do período, com a mesma pesquisa e ordenação da tela, destacando as acima de 25% da média). | — |
| A31 | Configurações | Retirada a seção "E-mails adicionais". No código real ela existe só no Angular: as rotas `Configuracao/GetAllEmails`, `InserirEmail` e `ApagarEmail` não existem no `ConfiguracaoController`, não há tabela no banco e todos os envios passam a cópia vazia. | `configuracao.component.ts`, `EnvioEmailEntregaService.cs` |
| A32 | Início → Gestão de Planos | Clicar num card de "Rotas em andamento" abre a Gestão de Planos filtrada pelo plano (campo Plano preenchido, demais filtros limpos), com o detalhe do plano aberto e rolado até ele. "Ver todos os planos" abre a Gestão de Planos sem plano específico (filtros limpos, lista completa), mesmo depois de ter vindo por um card. | — |
| A33 | Início | Retirado o botão "Gerar relatório" do topo do Início: o relatório é gerado na Gestão de Planos. | — |
| A34 | Início → Gestão de Planos | Cards de "Precisa da sua atenção" abrem a Gestão de Planos só com os planos do card: entrega não realizada e pontos sem e-mail → o plano citado, com o detalhe aberto; não enviados ao SAP → filtro "Não enviados ao SAP" (com o reprocessamento em lote); em aberto há mais de 24 h → os planos nessa situação. O chip de filtro mostra o escopo e "Limpar" volta à lista completa. | — |
| A35 | Início → Gestão de Planos | Indicadores do topo do Início abrem a Gestão de Planos com o filtro aplicado: "Planos em rota agora" → Status "Em andamento"; "Aguardando carregamento" → Status "Em aberto"; "Não enviados ao SAP" → Enviado SAP "Não". Os campos do filtro ficam preenchidos. | — |
| A36 | Gestão de Planos | Campos de filtro com valor aplicado (Plano, Status, Placa, Motorista, Enviado SAP) ficam destacados em laranja, como as datas de carregamento. | — |
| A37 | Topo | Clicar na logo do ENCO leva ao Início. | — |
| A38 | Usuários / Áreas / Gestão de Planos | Pessoas aparecem com 8ID, Nome e Telefone: coluna Telefone em Usuários (e no detalhe), telefone nas listas de controladores e entregadores das áreas (filtro também por telefone) e no motorista do plano (resumo e PDF). Requisitante e recebedor dos itens continuam com nome e 8ID: vêm do SAP, sem celular no cadastro. | `Usuario.Celular` (varchar 15) |
| A39 | Áreas Responsáveis | Listas de controladores e entregadores em formato de tabela, com cabeçalho Nome, 8ID e Telefone (uma pessoa por linha). O cabeçalho some quando o filtro não encontra ninguém. | — |
| A40 | Usuários / Pontos de descarga / Áreas | Base única de usuários (`data/db.json` → `usuarios`). Nome e 8ID vêm do AD e são só leitura; **telefone e e-mail são editados só em Usuários** (detalhe do usuário, com validação). No contato do ponto de descarga, o usuário é **selecionado** da base (pesquisa por nome ou 8ID) e o painel mostra telefone e e-mail só para leitura; o botão "Editar em Usuários" abre o usuário já no campo de telefone e, ao salvar ou voltar, retorna ao painel do contato com os dados atualizados. No ponto ficam só os avisos (e-mail / SMS), e o aviso não pode ser ligado se o usuário não tiver e-mail ou telefone. A alteração reflete em Usuários, Áreas e em todos os pontos em que a pessoa é contato. | `Usuario.Email`, `Usuario.Celular`, `Contato` |
| A41 | Usuários / Áreas Responsáveis | Coluna E-mail nas listas de usuários e de controladores e entregadores das áreas (com "Sem e-mail" quando não cadastrado); pesquisa e filtro também por e-mail. | — |
| A42 | Gestão de Planos / Dashboards | Destaque dos filtros passa a ser imediato: o campo fica laranja assim que tem valor (ao digitar ou escolher), sem esperar "Executar busca"; "Limpar filtros" remove o destaque. No Dashboard, o ponto escolhido e a pesquisa também ficam destacados, e as datas seguem o padrão da Gestão de Planos. | — |
| A43 | Pontos de descarga | Coluna "Tempo de espera" renomeada para "Tempo de espera extra" (é o tempo extra do ponto, somado ao tempo padrão de Configurações). | `Ponto.TempoExtra` |
| A44 | Pontos de descarga / Áreas Responsáveis | Contatos do ponto (detalhe e formulário) e pessoas das áreas em tabela no mesmo padrão da tela Usuários: 8ID, Nome com iniciais, Telefone, E-mail (e Avisos no ponto). No formulário do ponto, por ser estreito, 8ID e e-mail aparecem abaixo do nome. | — |
| A45 | Pontos de descarga / Usuários / Gestão de Planos | Botão do contato do ponto renomeado para "Editar em Usuários", com a explicação "O usuário e o perfil são cadastrados pelo time de segurança no AD" (também no detalhe do usuário). Filtro Status do Plano passa a ter "Todos" como padrão. | — |
| A46 | Todas as listagens | Padrão único de filtros (`assets/js/filtros.js`): todo filtro tem título visível acima do campo e fica destacado em laranja enquanto está filtrando (texto digitado ou opção diferente de "Todos"). Vale para Veículos, Tipos de veículo, Macro pontos, Pontos de descarga, Não conformidades, Prioridades, Tipos de movimento, Rotas, Áreas (inclusive o filtro de pessoas), Usuários, a pesquisa do Dashboard e Coletas. | — |
| A47 | Áreas Responsáveis | "Editar área" altera só nome e descrição. Controladores e entregadores ficam separados, no botão Gerenciar da listagem; ao cadastrar uma área nova, o aviso indica usar Gerenciar para incluir as pessoas. | — |
| A48 | Gestão de Perfis / Tipos de movimento / Dashboard | Filtros que faltavam ganharam título: "Buscar funcionalidade" e "Acesso" (Todas / Com acesso / Sem acesso) em Perfis, "Categoria" em Tipos de movimento e "Período rápido" no Dashboard. Grupos de botões ficam destacados quando a opção escolhida não é "Todas". | — |
| A49 | Áreas Responsáveis | As pessoas da área não ficam mais sempre abertas: clicar em "Gerenciar" de Controladores ou de Entregadores abre a listagem logo abaixo da área (8ID, Nome, Telefone, E-mail, no padrão de Usuários), com pesquisa na lista, campo "Adicionar controlador/entregador" (sugere só usuários com o perfil correspondente) e exclusão por linha com "Desfazer". Clicar de novo no botão ou no X fecha. O painel lateral antigo foi retirado. | `AreaEntregadorControlador` |
| A50 | Gestão de Planos | Excel no padrão do PDF: topo de cada aba com a logo do ENCO, o título "Relatório de planos" e a linha de filtros aplicados (quantidade de planos, status, período de carregamento e área). A tabela começa na linha 4, com cabeçalho fixo e filtros do Excel; o texto dos filtros é o mesmo do PDF. | — |
| A51 | Gestão de Planos / Topo | Excel: cabeçalho e dados da tabela centralizados na horizontal e na vertical (cabeçalho com quebra de linha e altura maior). Topo do portal: o rótulo "Perfil" passa a ser "Área", pois o seletor é da área responsável. | — |
| A52 | Gestão de Planos | Excel: largura de cada coluna calculada pelo maior conteúdo (título com a seta do filtro ou dado), entre 8 e 45; texto maior quebra linha (centralizado) e a altura da linha acompanha. Nenhum texto fica escondido. | — |
| A53 | Gestão de Planos | Excel: bordas finas cinza em todas as células da tabela (cabeçalho e linhas) e logo do ENCO centralizada na coluna A, na altura do título e da linha de filtros. | — |
| A54 | Gestão de Planos | Excel: a aba Itens não mostrava a logo. Cada aba passa a ter sua própria imagem da logo (antes as duas abas usavam o mesmo arquivo de imagem). | — |
| A55 | Gestão de Planos | [S04] Cancelar plano: ícone na linha, disponível só para plano Em aberto ou Em andamento sem itens entregues (nos demais o ícone fica desabilitado com o motivo). Modal com resumo do impacto (status, itens, pontos, rota), aviso de ação irreversível e motivo obrigatório; o plano vai para Cancelamento Solicitado e os itens recebem a NC "PLANO CANCELADO WEB". | Cancelar Plano de Descarga |
| A56 | Gestão de Planos | [S05] Reenvio do relatório de entrega só aparece para quem tem a permissão de Edição em "Reenviar Email de entrega" e continua só para planos Finalizados; o modal mostra o último envio por ponto. Permissões da sessão fictícia em `ENCO.sessao` (`data/db.json` → `dominio`). | Funcionalidade "Reenviar Email de entrega", `EmailEntregaEnviado` |
| A57 | Gestão de Planos | [S07] Status do Plano com seleção múltipla (lista com caixas de seleção e "Todos (limpar seleção)"); o chip mostra os status escolhidos. [S08] Paginação real: 10, 25 ou 50 planos por página (mínimo 10), volta à página 1 quando o filtro muda. | `FiltroPlanos.status` (string[]), `FiltroPlanoDescargaPaginadoModelo` |
| A58 | Não conformidades | [S13] PLANO CANCELADO WEB, ITEM CANCELADO WEB, RETORNO JUSTIFICADO e RECEPTOR AUSENTE aparecem com o selo "Sistema", sem editar nem excluir e com a opção de edição bloqueada. | `ncSistema`, `CampoEditavel` |
| A59 | Configurações | [S15] Nova aba "Logs do sistema" em Configurações (ao lado de "Tempo de espera"): Data/hora, Usuário (nome e 8ID), Ação e Descrição, com pesquisa, filtro de ação, período e paginação. Registros só para leitura. | `listagem-logs.component` (sem endpoint hoje) |
| A60 | Gestão de Planos / Todas | Modal de cancelar plano com textos objetivos ("Não é possível desfazer…", motivo "Informe o motivo") e dicas curtas no ícone ("Cancelar plano: plano com itens entregues" / "só para planos em aberto ou em andamento"). Campos de texto longo (textarea) passam a usar a fonte do portal em todas as telas. | — |
| A61 | Gestão de Planos / Início | Status "Em andamento" (plano e item) em azul claro, no selo, no indicador da Gestão de Planos e no card "Planos em rota agora" do Início. "No ponto agora" da linha do tempo continua roxo. | — |
| A62 | Todas | Revisão geral: (1) sem caixa alta nos textos: nomes de pontos, macro pontos, rotas, áreas e pessoas passam a "Aciaria B03 Lab C", "Ponto Geral", "Laminação a Quente" etc.; continuam em maiúsculas só códigos e siglas (placas, 8ID, códigos de NC, NCs do sistema, SAP, ADM). (2) Mesma fonte em tudo (Plus Jakarta Sans), inclusive campos de texto longo, listas e o PDF. (3) Portal responsivo: até 1024 px o menu fica só com ícones e abre por cima do conteúdo; até 640 px vira gaveta e o topo mostra só o essencial; a lista de planos vira cartões; as listagens em grade quebram linha no celular; indicadores em 2 colunas; detalhes e modais se ajustam. Verificado em 1366, 1024, 768 e 390 px sem rolagem lateral nem textos sobrepostos. | — |
| A63 | Gestão de Perfis | Retirado o botão "Visualizar log": as alterações de permissão aparecem em Configurações › Logs do sistema (ação "Permissões"). | — |
| A64 | Todas | Transcritas para os módulos as alterações do arquivo único `ENCO_Portal_web.html` (04/11/2026). Os demais arquivos já eram iguais. | — |
| A65 | Login | Nova tela de login (`assets/js/login.js`, `assets/css/login.css`): o portal só inicia depois de entrar; sessão guardada na aba (F5 mantém); "Sair" volta ao login. Login simulado: aceita qualquer usuário e senha preenchidos. Fonte Inter adicionada para esta tela. | — |
| A66 | Pontos de descarga | Contato do ponto pode ser **recebedor** (`data/db.json` → `recebedores`): pessoa que não é usuária do ENCO, sem login nem perfil, só recebe a entrega e os avisos. A pesquisa busca usuários e recebedores; se não achar, oferece cadastrar um novo recebedor (nome, 8ID, telefone e e-mail obrigatórios, com aviso de 8ID repetido). Dados do recebedor são editados no próprio contato e valem para todos os pontos. Selo "Recebedor" nas listas. [OBS] Precisa de tabela e API próprias. | — |
| A67 | Rotas / Gestão de Perfis | Novas feature flags: `rotas: false` esconde a tela Rotas do menu e das rotas de navegação e a funcionalidade "Gestão de rotas" em Perfis (a rota é definida no tablet ao iniciar a entrega); `novaRota: false` esconde "Cadastrar rota" e "Duplicar". Título de seção do menu some quando todos os itens dela estão desligados. | `assets/js/config.js` |
| A68 | Início / Dashboards | Gráficos mostram o valor de cada barra (Início) e de cada ponto da linha (Dashboard). Início: saiu o indicador "96% dos pontos atendidos no prazo" e o "previsto" do próximo ponto das rotas em andamento. | — |
| A9 | Todas | Domínio real centralizado em `data/db.json` → `dominio` (status, funcionalidades, limites, perfis Entregador=3 / Controlador=4, prazo máximo do dashboard = 90 dias). | `Constantes.cs`, `01-schema.sql` |

---

## Parte 2 — Decisões sobre as sugestões (30/10/2026)

### Aprovadas e aplicadas no protótipo
| # | Sugestão | Onde está |
|---|----------|-----------|
| S04 | Cancelar plano | A55 |
| S05 | Reenvio de e-mail controlado por permissão (e só para Finalizados) | A56 |
| S07 | Filtro de status com seleção múltipla | A57 |
| S08 | Paginação real, mínimo de 10 por página | A57 |
| S13 | Não conformidades do sistema bloqueadas | A58 |
| S15 | Tela de Logs (aba de Configurações) | A59 |

### Aprovadas: dependem só da API e do banco (o protótipo já mostra o resultado)
**S09 · Linha do tempo: "No ponto agora" e "Próximo ponto"**
Incluir `DataHoraChegadaPonto`, `DataHoraSaidaPonto` e `Posicao` em `LinhaDoTempoModelo`. "No ponto agora" =
chegada sem saída; "Próximo ponto" = primeiro ponto pendente pela `Posicao`. Não precisa de evento novo do app.

**OBS-19 · Contato do ponto ligado ao usuário**
`Contato` passa a referenciar `Usuario` (ex.: `Contato.CodUsuario`), mantendo no contato só `EmailAtivo`, `SMSAtivo`
e `CodPonto`. Os avisos (`EnvioEmailEntregaService`, SMS do app) leem e-mail e celular de `Usuario`. Criar rota para
editar `Usuario.Email` e `Usuario.Celular` e migrar os contatos atuais pelo 8ID.

**S17 · Indicadores do Início (OBS-15)**
Os cards e alertas já abrem a Gestão de Planos filtrada (A34, A35). Falta o endpoint que agregue "em rota agora",
"aguardando carregamento", "não enviados ao SAP", os alertas e o gráfico de 7 dias: `GET /Dashboard/Resumo?area=`,
reutilizando os filtros da Gestão de Planos.

**S15 (parte da API) · Endpoint de logs**
A tela Angular `listagem-logs` está sem serviço ("TODO: Implementar serviço de logs"). Criar o endpoint paginado
com filtro por período, ação e texto.

### Reprovadas
- **S02 · Editar dados do plano (placa e motorista)** — reprovada.
- **S03 · Adicionar, editar e remover item com justificativa** — reprovada: o plano vem do SAP e não pode ser alterado.

### Em espera
- **Coletas (S10, S11, OBS-13)** — não alterar agora; retomar só se houver necessidade de reativar Coletas.

A S18 (SMS, Parte 3) foi aprovada e depende do app mobile. A S19 (e-mails ao suporte) foi aplicada na API. Nenhuma sugestão em aberto.

---

## Parte 3 — Comunicação com o recebedor (SMS e e-mails)

### Como é hoje (código real)

**SMS** — enviados pelo **celular do entregador** (app Flutter, `sms_service.dart`, pacote `telephony`), só para os
contatos do ponto com `SMSAtivo`. Textos fixos, sem dados do plano ou do ponto:

| Momento (gatilho no app) | Para quem | Texto atual |
|---|---|---|
| Entregador inicia o macro ponto (`rotaIniciada`) | Contatos dos pontos do macro ponto | "TERNIUM ENTREGAS E COLETAS - A rota de entrega se iniciou." |
| Entregador segue para o ponto (`entregadorACaminho`) | Contatos do ponto | "… - O entregador está se deslocando até você." |
| Entregador chega ao ponto (`entregadorChegou`) | Contatos do ponto | "… - O entregador chegou e está aguardando." |
| Tempo de espera esgotado, ponto vai para o fim da rota (`entregaPosterior`) | Contatos do ponto | "… - Tempo esgotado. Nova entrega, posteriormente." |
| Tempo esgotado sem nova tentativa (`naoEntrega`) | Contatos do ponto | "… - Tempo esgotado. Entrega não realizada." |

**OBS-20 · O envio de SMS está desligado no código.** Em `sms_service.dart` o envio retorna `false` sem enviar
("desligado a pedido da P.O., para não gerar custo com a operadora", Card 607322). Também: com acento o SMS usa
UCS-2 e cabe só 70 caracteres por mensagem; textos maiores viram 2 ou mais SMS cobrados.

**E-mails** — remetente `entregacoleta@ternium.com.br` (`EmailDeEnvioCompleto`), ligados por `EnviarEmail` no Web.config:

| E-mail | Quando | Para quem | Assunto / conteúdo |
|---|---|---|---|
| Relatório de entrega (completo) | Na sincronização do app, quando todos os itens do ponto saem de Em aberto/Em andamento; uma vez por plano + ponto (`EmailEntregaEnviado`) | Recebedores do ponto que são contatos com `EmailAtivo` | "Relatório de entrega \| Plano X - Ponto Y" (ou "Relatório de entrega - Tentativa de entrega \| …" se nenhum item foi confirmado). Tabela com reserva, pacote, material, quantidade, status, motivo, recebedor (nome e 8ID), carregamento e recebimento |
| Relatório de entrega (individual) | Mesmo momento | Cada requisitante (`UsuarioRequisitanteEmail`) que não é recebedor, só com os itens dele | Mesmo assunto e tabela, filtrada |
| Reenvio do relatório de entrega | Botão "Reenviar e-mail" na Gestão de Planos (permissão de Edição em "Reenviar Email de entrega") | Os mesmos destinatários acima, todos os pontos | Só para plano **Finalizado e já enviado ao SAP** (`StatusEnvioSap`); senão a API recusa |
| Coleta realizada | Sincronização de coleta entregue | Requisitante da coleta | "Coleta {reserva} realizada." (texto simples) — Coletas está desligada |
| Coleta recusada | Controlador rejeita a coleta | Contatos do ponto de coleta | "Coleta {reserva} recusada." (texto simples) — Coletas está desligada |
| Erro técnico de notificação | Falha ao montar o relatório de entrega de um ponto | Suporte (`EmailTecnicoErro`): PSANTIA@ternium.com.br, ARMIRAND@ternium.com.br | "[ENCO] Erro ao gerar notificação de entrega - Ponto: Y" |
| Erro técnico de sincronização | Falha ao sincronizar um plano | Suporte (`EmailTecnicoErro`): PSANTIA@ternium.com.br, ARMIRAND@ternium.com.br | "[ENCO] Erro na sincronizacao do plano - X" |

Prévia visual de todos os e-mails, com o mesmo HTML e estilos da API: `Prototipos/Enco Web/emails/emails-atuais.html`.

**OBS-22 · E-mail do suporte atualizado (30/10/2026).** `EmailTecnicoErro` passou de c.emgabr@ternium.com.br para
`PSANTIA@ternium.com.br,ARMIRAND@ternium.com.br` no `Web.config` da API, no `App.config` dos testes e nas asserções de
`EnvioEmailEntregaServiceTeste`. Os dois e-mails de erro técnico dizem "entre em contato com o suporte pelo ramal 0097",
mas já vão para o próprio suporte: vale revisar o texto.

**OBS-21 · Reenvio no protótipo × API.** O protótipo mostra o reenvio para todo plano Finalizado; a API só aceita
se o plano também já foi **enviado ao SAP**. Decidir se o ícone fica desabilitado ("aguardando envio ao SAP") nesses casos.

### S18 · SMS com o andamento da rota — ✅ Aprovada (30/10/2026), depende do app e da decisão de custo (OBS-20)

Objetivo: o recebedor saber **se o ponto dele é o próximo**, **quando se preparar** e **o que acontece** se a entrega não
for feita. Regras propostas: **sem acentos** e até 160 caracteres (1 SMS por envio, menor custo); prefixo curto
"ENCO Ternium:"; nome do ponto limitado a 30 caracteres. A ordem dos pontos pode mudar durante a rota, por isso a mensagem
**não informa a posição** (3º de 5), só se o ponto é o próximo. Os dados já existem no app. Exemplos com dados de um plano (entre parênteses, quantos SMS cada envio usa):

| Momento | Texto atual | Proposta | Caracteres (SMS) |
|---|---|---|---|
| Rota iniciada, ponto é o próximo | TERNIUM ENTREGAS E COLETAS - A rota de entrega se iniciou. | ENCO Ternium: a entrega do plano 20260923081205 saiu do Almoxarifado. Seu ponto (Oficina Central) e o proximo da rota. | 118 (1) |
| Rota iniciada, ponto não é o próximo | TERNIUM ENTREGAS E COLETAS - A rota de entrega se iniciou. | ENCO Ternium: a entrega do plano 20260923081205 saiu do Almoxarifado. Avisaremos quando o entregador seguir para o ponto Oficina Central. | 137 (1) |
| A caminho do ponto | TERNIUM ENTREGAS E COLETAS - O entregador está se deslocando até você. | ENCO Ternium: entregador a caminho do ponto Oficina Central com 2 itens. Seu ponto e o proximo. Esteja no local para receber. | 125 (1) |
| Chegou ao ponto | TERNIUM ENTREGAS E COLETAS - O entregador chegou e está aguardando. | ENCO Ternium: o entregador chegou ao ponto Oficina Central e aguarda ate 10:25. Tenha o cracha em maos para confirmar o recebimento. | 132 (1) |
| Tempo esgotado, entregador volta depois | TERNIUM ENTREGAS E COLETAS - Tempo esgotado. Nova entrega, posteriormente. | ENCO Ternium: tempo de espera no ponto Oficina Central esgotado. O entregador fara nova tentativa mais tarde e avisara antes de chegar. | 135 (1) |
| Não entregue (tempo esgotado ou devolução sem nova tentativa) | TERNIUM ENTREGAS E COLETAS - Tempo esgotado. Entrega não realizada. | ENCO Ternium: entrega no ponto Oficina Central nao realizada. Motivo: receptor ausente. Os itens voltam ao Almoxarifado. | 120 (1) |
| **Novo:** entrega concluída | — (não existe) | ENCO Ternium: entrega concluida no ponto Oficina Central as 10:42. 2 itens recebidos por Paulo Mendes. Relatorio enviado por e-mail. | 132 (1) |

Detalhes das regras:
- **Próximo ou não:** na rota iniciada, cada ponto recebe a versão "é o próximo" ou "avisaremos"; o aviso "a caminho" sai
  quando o entregador segue para o ponto.
- **Horário-limite (chegou):** hora de chegada + tempo de espera padrão (Configurações) + tempo extra do ponto.
- **Devolução sem nova tentativa:** o entregador pode devolver os itens sem voltar ao ponto. Por isso a mensagem de
  "não entregue" não fala em número de tentativas e informa o **motivo** registrado (ex.: receptor ausente, recebimento
  recusado, sem acesso ao ponto); a de "tempo esgotado" só é enviada quando o entregador decide fazer nova tentativa.
- **Sem ramal** nas mensagens.
- **Custo:** sem acento a operadora usa a codificação GSM-7, em que cada SMS leva até 160 caracteres; todas as mensagens
  cabem em 1 SMS, mesmo com nomes de ponto longos. Com acento cairia para 70 caracteres e cada envio usaria 2 ou 3 SMS.
  Na implementação, retirar os acentos também do nome do ponto e do recebedor antes de enviar.

O que muda para o recebedor: sabe se é o próximo, até que horas o entregador espera, se haverá nova tentativa, o motivo e o
destino dos itens quando não recebe, e quem recebeu. Para entrar em vigor, é preciso religar o envio (OBS-20) e decidir
sobre o custo; uma alternativa é enviar pela API, por um serviço de SMS corporativo, sem depender do chip do celular do entregador.

### S19 · E-mails ao suporte com detalhes do plano e do erro — ✅ Aprovada e aplicada na API (03/11/2026)

Hoje os dois avisos ao suporte são um parágrafo com "[Info técnica - Plano, Erro]" e pedem para ligar no ramal 0097 (que é o
próprio suporte). Proposta, no padrão visual do portal (cartão branco, faixa laranja, rótulos cinza, selos) e em HTML de
e-mail (tabelas e estilos inline). Prévia em `Prototipos/Enco Web/emails/emails-atuais.html`, grupo "Avisos ao suporte – proposta".

| | Erro ao gerar o relatório de entrega | Erro na sincronização do plano |
|---|---|---|
| Assunto | [ENCO][Erro] Relatório de entrega não enviado · Plano {Nome} · Ponto {Identificação} | [ENCO][Erro] Sincronização não gravada · Plano {Nome} · {Motorista} |
| Impacto | Recebedores e requisitantes do ponto não receberam o e-mail; a entrega foi gravada | Nada do envio foi gravado (rollback); os dados seguem no celular até nova sincronização |
| Plano | Nome, status, área, rota, placa e tipo de veículo, motorista (nome, 8ID, celular), carregamento, última atualização | Igual |
| Contexto | Ponto (identificação, macro ponto), itens no ponto por status, recebedor, quantos destinatários estavam previstos | Pontos e itens no envio (por status), mudanças de rota no envio |
| Erro | Quando, etapa (`PrepararEnvio`), último passo concluído (variável `passos`), tipo da exceção, mensagem, identificadores (CodPlanoDescarga, CodPonto) | Quando, etapa (`SaveChanges`/`Commit`), último passo, tipo, mensagem, **causa interna** (`InnerException`, ex.: erro de chave estrangeira), CodPlanoDescarga |
| Detalhe técnico | Primeiras linhas do stack trace | Primeiras linhas do stack trace |
| O que fazer | Conferir o ponto e os itens; reenviar pelo botão "Reenviar e-mail"; abrir chamado se repetir | Corrigir o dado da causa; pedir nova sincronização ao motorista; abrir chamado se repetir |

Outras regras: sem o texto do ramal; botão "Abrir plano na Gestão de Planos" (link do portal); rodapé "Aviso automático do ENCO
para o suporte" com os destinatários de `EmailTecnicoErro`. Logo do ENCO embutido como o logo atual (cid). Na implementação,
os dados do plano devem ser lidos com tratamento de erro próprio, para o aviso sair mesmo se a consulta falhar.

**Aplicação da S19 na API:** nova classe `Persistencia/Servicos/EmailSuporte.cs` (montagem do HTML e leitura protegida dos dados do plano),
usada em `EnvioEmailEntregaService.PrepararEnvio` (erro no relatório de entrega) e em `SincronizarPlanoPersistencia.SincronizarPlano`,
que agora faz o rollback **antes** de montar e enviar o aviso. Logo do ENCO embutido (`Utility/Email/logoEnco.png`, `cid:logoEnco`).
Nova chave `UrlPortalWeb` no Web.config (vazia = sem botão; preencher com o endereço do portal). Teste
`EnvioEmailEntregaServiceTeste` atualizado para o novo conteúdo. **Não compilado nem testado aqui** (sem pacotes NuGet e sem Visual Studio):
só `EmailSuporte.cs` foi compilado (C# 5) e executado com tipos de apoio.

**Relatório de entrega no novo padrão (03/11/2026, aplicado na API):** `EnvioEmailEntregaService.MontarHtmlRelatorio` foi refeito no
mesmo padrão visual do portal e dos avisos ao suporte: faixa laranja, logo do ENCO (`cid:logoEnco`), título "Relatório de entrega"
com plano e ponto de descarga, selos de resumo (itens, confirmados, não entregues), um bloco por pacote e status com as cores da
Gestão de Planos. Mesmos dados de antes, com colunas agrupadas: Material (descrição e código), Reserva, Quantidade (com unidade),
Carregamento, Recebedor (nome e 8ID), Recebimento, Status e, quando há, Motivo e Descrição adicional; o ponto de descarga saiu da
tabela e foi para o cabeçalho. Textos escapados para HTML. Assuntos dos e-mails não mudaram. Teste do título ajustado.
**Não compilado nem testado aqui**: o método foi compilado (C# 5) e executado isoladamente com dados de exemplo.
