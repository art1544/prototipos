# Mobilidade – protótipo

> Ternium · App de manutenção em campo · **mobile first**

Protótipo navegável do app Mobilidade v4.0.0: login e primeiro acesso (matrícula), início com a
ordem em andamento, ordens (lista com abas, detalhe e "Concluir todas ordens"), **execução das
operações** (iniciar, pausar com registro de desvio, parar, pessoas, confirmações de tempo, anexos,
fotos, notas e estorno), pontos de medida com histórico, solicitação de ordem comum e de emergência
(PM10), notas com fotos e edição, eventos de sincronização com o SAP, notificações, modificação de
matrícula e perfil com troca de idioma (português, inglês e espanhol).

Site estático, sem build: HTML, CSS e JavaScript (módulos ES). Os dados de exemplo ficam em
`data/db.json`; o que for feito na interface fica salvo no navegador (`localStorage`, chave
`mobilidade:db`). A sessão de login fica no `sessionStorage` (dura até fechar a aba).

## Rodar

Na raiz do repositório:

```bash
npm run dev
```

- No computador: http://localhost:3000/prototypes/mobilidade/ — ou, no catálogo, **Ver em moldura
  de celular** para simular aparelhos de 320 a 768 px.
- No celular (mesma rede Wi-Fi): `npm run dev -- --host` e abra o endereço de rede exibido.
  No navegador do celular, **Adicionar à tela inicial** abre o protótipo em tela cheia, como app.

**Login:** qualquer usuário e senha preenchidos entram. Na primeira vez o app pede a matrícula
(letras e números) antes de liberar o Início.

## Layout responsivo

- Fluido de **320 px** (iPhone SE, Android compactos) até **768 px** (tablet); acima disso vira uma
  coluna centralizada.
- Grade de atalhos 2 → 4 colunas (≥ 560 px); listas e formulários em 2 colunas (≥ 640 px).
- Topo, cabeçalho laranja, navegação inferior e barra de ações fixos com `position: sticky`
  (sem medidas fixas); áreas seguras do iPhone (`viewport-fit=cover` + `env(safe-area-inset-*)`).
- Campos com fonte de 16 px (o iOS não dá zoom ao focar) e alvos de toque de 40 px ou mais.
- Diálogos viram *bottom sheet* no celular; celular na horizontal libera o cabeçalho laranja.
- Respeita `prefers-reduced-motion`.

## Estrutura

```
index.html                 casca da página (toast e <dialog> ficam fora do #app)
manifest.webmanifest       "Adicionar à tela inicial" (tela cheia no celular)
data/db.json               banco de dados de exemplo
assets/img/logo.png        ícone do app
assets/img/documento-exemplo.svg  miniatura de documento (aba Documentos)
assets/css/styles.css      estilos: tokens no topo, componentes, responsivo no fim
assets/js/
  config.js                identidade, regras, limites e parâmetros de URL
  utils.js                 datas, texto, imagens, download e ícones SVG
  i18n/                    index.js (t(), plural, datas por idioma) + pt.js, en.js, es.js
  api.js                   camada de dados: simula o backend, regras de negócio e erros (ApiError)
  store.js                 estado global (setState / assignState / setPath)
  router.js                rotas por hash integradas ao histórico (botão voltar do celular)
  session.js               sessão do login (sessionStorage)
  model.js                 leitura e derivação de dados para as telas
  forms.js                 estados iniciais de formulários e filtros
  actions.js               cliques, envios de formulário e tratamento de erros
  execution.js             execução das operações, pontos de medida, pessoas e encerramento em lote
  ui.js                    toast e diálogos (<dialog> nativo, inclusive com formulário)
  tooltip.js               dica ao tocar num status ("o que significa?")
  dom.js                   atualização mínima do DOM (preserva foco e teclado do celular)
  views/                   uma função de desenho por tela (HTML escapado com esc())
  app.js                   tabela de rotas, sessão, render, eventos e inicialização
```

## Telas e rotas

| Rota                                        | Tela                                      |
| ------------------------------------------- | ----------------------------------------- |
| `#/login`                                   | Login (sem barra superior)                |
| `#/primeiro-acesso`                         | Informe sua matrícula (logo após o 1º login) |
| `#/`                                        | Início                                    |
| `#/perfil`                                  | Perfil (idioma, sobre o app, protótipo)   |
| `#/notificacoes`                            | Notificações                              |
| `#/ordens` · `#/ordens?aba=andamento`       | Ordens (Todas / Não iniciadas / Em andamento / Concluídas) e "Concluir todas ordens" |
| `#/ordens/:codigo`                          | Detalhe da ordem (Operações / Dados Básicos / Documentos) |
| `#/ordens/:codigo/operacoes/:op/pessoas`    | Adicionar pessoas à operação              |
| `#/ordens/:codigo/operacoes/:op/nota`       | Nova nota a partir da operação (`?etapa=n` para uma etapa do carrossel) |
| `#/solicitacao`                             | Solicitação de Ordens                     |
| `#/solicitacao/ordem-comum`                 | Ordem Comum                               |
| `#/solicitacao/minhas`                      | Minhas Solicitações                       |
| `#/solicitacao/emergencia`                  | Ordem de Emergência (PM10)                |
| `#/solicitacao/emergencia/operacao`         | Adicionar Operação                        |
| `#/notas` · `#/notas/:codigo`               | Notas e detalhe da nota                   |
| `#/notas/nova` · `#/notas/:codigo/editar`   | Nova nota e edição                        |
| `…/local`                                   | Seleção do local de instalação (a partir dos formulários) |
| `#/eventos`                                 | Eventos agrupados por ordem e por nota    |
| `#/eventos/ordem/:codigo` · `#/eventos/nota/:codigo` | Eventos de uma ordem ou de uma nota |
| `#/matricula`                               | Modificar Matrícula                       |

Sem sessão, qualquer endereço leva ao login (e volta para ele depois de entrar). O botão voltar (da
tela e do celular) volta uma tela. Voltando de um detalhe, a lista mantém aba e busca; voltando do
seletor de local, de "Adicionar Operação" ou de uma nota criada na operação, a tela mantém o
rascunho, o painel aberto e o slide do carrossel.

## Modelo de dados (`data/db.json`)

| Entidade          | Campos principais                                                                 |
| ----------------- | --------------------------------------------------------------------------------- |
| `users`           | `id`, `name`, `username`, `registration` (matrícula; vazia até o primeiro acesso), `email`, `role`, `deviceId` |
| `inspectors`      | inspetores que podem ser incluídos nas operações: `registration`, `name`          |
| `planningGroups`, `workCenters`, `plants`, `activityTypes` | catálogos SAP: `id`, `name`              |
| `noteTypes`       | `id` (`M0` \| `M8` \| `M3`), `requiresOrder`                                        |
| `locations`       | locais de instalação em árvore: `code`, `description`, `parent`                   |
| `orders`          | `code`, `type`, `status` (`pendente` \| `andamento` \| `concluida`), `sapStatus` (`I0002` \| `I0010` \| `I0045`), `linkedNotice`, `unsyncedEvents`, catálogos, datas, `operations[]`, `documents[]` |
| `orders[].operations[]` | `number`, `title`, `code`, `equipment`, `workCenter`, `people`, `duration`, `longText`, `info` (carrossel: `safety`, `text`, `points[]`) e `execution` (`started`, `paused`, `autoPaused`, `finished`, motivo de desvio, `people[]`, `confirmations[]`, `attachments[]`, `noteIds[]`) |
| `requests`        | solicitações de Ordem Comum: `orderCode`, `createdAt`, `status` (`pendente` \| `sincronizada`) |
| `events`          | fila de sincronização: `orderCode` + `operation` ou `noteCode`, `kind`, `category`, `status` (`PE` \| `PER` \| `LE` \| `PR` \| `PRE` \| `ER`) |
| `notes`           | `code`, `type`, `orderNumber`, `locationCode`, textos, período, classificação, `photos[]` |
| `notifications`   | `type`, `template`, `vars`, `createdAt`, `read`                                   |

Prioridades, probabilidade de falha, impacto e motivos de desvio ficam como ids (`emergencia`,
`media`, `parada_linha`, `falta_material`…) e são traduzidos na exibição. Datas em ISO local; na
primeira carga são deslocadas para que `_meta.referenceDate` vire o dia atual (inclusive as datas
dentro das ordens: documentos, confirmações de tempo e histórico dos pontos de medida).

Ao mudar a estrutura do `db.json`, incremente `_meta.schemaVersion` e `API_CONFIG.schemaVersion`
(`assets/js/config.js`): os dados antigos salvos no navegador são descartados.

## Regras de negócio simuladas

**Sessão**

- Login com qualquer usuário e senha preenchidos. Sem matrícula, o app pede o primeiro acesso e só
  libera o Início depois de salvá-la (a única outra saída é encerrar a sessão).
- **Sair** (topo) encerra a sessão e volta ao login.

**Ordens e operações**

- Status da ordem: *Não iniciada* (nenhuma operação iniciada), *Em andamento*, *Pausada* (em
  andamento com operação pausada) e *Concluída*. Tocar no status explica o que ele significa.
- Status da operação (cadeado): *Liberada*, *Bloqueada*, *Em andamento*, *Pausada* e *Finalizada*.
  Em ordens **PM02 com atividade INM** só a primeira operação não finalizada fica liberada.
- Só **uma operação** pode estar iniciada (em andamento ou pausada) por vez no aparelho.
- **Iniciar:** o usuário logado entra na operação e o tempo de cada pessoa começa a contar. Se a
  operação foi planejada para mais de uma pessoa, o app oferece incluir pessoas antes de iniciar.
  Iniciar uma operação de ordem não iniciada coloca a ordem em andamento.
- **Pausar** sempre pede o registro de desvio: motivo, detalhe e — havendo outras operações abertas
  na ordem — ao menos uma operação adicional. A ordem fica confirmada parcialmente (I0010).
- **Parar** grava a confirmação final. Ponto de medida sem leitura exige o registro de desvio. Se era
  a última operação aberta, o app pergunta se encerra a ordem tecnicamente (I0045 + CTEC).
- **Pausa automática:** operação ativa por mais de 6 horas é pausada sozinha (verificado ao abrir e
  a cada minuto) e aparece em destaque no Início e no cartão da operação.
- **Estorno:** tocar no status *Finalizada* oferece estornar a operação (as notas criadas nela
  permanecem).
- **Pessoa:** inclui inspetores na operação (busca por matrícula ou nome) e, opcionalmente, em outras
  operações abertas. Com a operação em execução, o tempo do novo inspetor começa a contar na hora.
- **Tempo, Anexos, Nota e Detalhes** abrem painéis no próprio cartão: confirmações de tempo (início,
  fim, duração e motivo), imagens da galeria (só quem anexou exclui), notas da operação e texto longo.
  **Foto** usa a câmera e pede um título; a foto gera um evento para o SAP.
- **Pontos de medida** (carrossel da operação): numérico com faixa aceitável, conforme/não conforme e
  escala de 1 a 4; só aceitam leitura com a operação iniciada. Cada etapa tem histórico (gráfico) e
  notas próprias.
- **Concluir todas ordens:** toque longo seleciona a primeira ordem e toques simples as demais. Só
  ordens I0002 (PM10 apenas com aviso vinculado), sem operação iniciada e sem eventos pendentes.
  Operações abertas recebem a confirmação final com o registro de desvio.
- **Ordem de Emergência:** tipo fixo PM10; local, descrição, texto longo, período (fim depois do
  início) e ao menos uma operação. Operações são numeradas 0010, 0020…, herdam centro e centro de
  trabalho da ordem e aceitam de 1 a 99 pessoas. Ao salvar vira a ordem `OS-…` não iniciada.
- **Documentos** vêm do SAP: no aparelho só podem ser baixados.

**Demais telas**

- **Ordem Comum:** código obrigatório (letras, números e hífen, até 20); não pode repetir uma
  solicitação existente. Entra como *pendente*; **Atualizar** sincroniza as pendentes.
- **Nota:** formulário progressivo — tipo → número da ordem (tipos M0 e M8) → demais campos. Até
  6 fotos, reduzidas para 960 px (JPEG) antes de salvar. Código sequencial `NT-…`. Na edição, tipo e
  número da ordem ficam travados. Notas avulsas geram o evento "Nova Nota"; notas criadas na operação
  ficam vinculadas a ela (e à etapa, quando criadas no carrossel).
- **Eventos:** agrupados por ordem e por nota. *Sincronizar* envia os que estão no aparelho
  (PE/PER → LE) e recebe o retorno dos que estavam no SAP (LE → PR); *Reprocessar* devolve os com
  erro para a fila do aparelho (ER → PER), todos ou um a um.
- **Local de instalação:** só locais sem filhos podem ser escolhidos; há busca por código/descrição.
- **Matrícula:** obrigatória, pode ter letras e números (até 20 caracteres) e precisa ser diferente da atual.
- **Qualidade da rede (topo):** vem do navegador (`navigator.connection` / offline); tocar explica o
  nível.

## Idiomas

`assets/js/i18n/pt.js` é o idioma padrão; `en.js` e `es.js` têm exatamente as mesmas chaves
(o `npm run check` compara os arquivos e procura chaves usadas no código que não existem).
Plural com `Intl.PluralRules`: a variante `chave_one` é usada quando o idioma pede singular.
O idioma escolhido no Perfil fica salvo no navegador (`mobilidade:idioma`).

## Parâmetros de teste (antes do `#`)

| URL                 | Efeito                                              |
| ------------------- | --------------------------------------------------- |
| `?latencia=0`       | sem atraso simulado                                  |
| `?latencia=2000`    | 2 s por operação                                     |
| `?erros=1`          | toda operação falha (serviço indisponível)           |
| `?erros=0.3`        | 30% das operações falham                             |
| `?rede=ruim`        | força o indicador de rede (`excelente`, `boa`, `regular`, `ruim`, `sem_sinal`) |

Exemplo: `/prototypes/mobilidade/?erros=0.5#/solicitacao/emergencia`.

Para voltar ao cenário inicial: **Perfil → Restaurar dados de exemplo** (a matrícula também volta a
ficar vazia). **Perfil → Todos os protótipos** e o link no login voltam ao catálogo.

## Diferenças em relação ao HTML original (v4.0.0)

O protótipo segue o HTML `Mobilidade_v_4_0_0_area_logada.html`, reorganizado em módulos. Pontos em
que o comportamento foi ajustado de propósito:

- Iniciar uma operação coloca a ordem *não iniciada* em andamento (no HTML ela continuava "Não
  iniciada").
- Depois de um estorno a operação pode ser iniciada de novo (no HTML a matrícula já registrada
  bloqueava o Play para sempre).
- A pausa automática de 6 horas é calculada de verdade; no HTML ela só existia nos dados de exemplo.
- Novas notas mantêm o código sequencial `NT-…` (no HTML, `M0-<ordem>` podia repetir o código de
  outra nota da mesma ordem).
- A nota criada na operação já vem com o local de instalação da ordem (o código da operação não é um
  local da árvore e a nota não poderia ser salva).
- Ordem Comum salva vai para Minhas Solicitações e aparece na lista (no HTML voltava ao Início sem
  registrar).
- Motivos de desvio, status e textos ficam como ids traduzidos; diálogos com Esc, foco preso e erros
  ao lado dos campos; rotas com botão voltar do celular; tudo persistido no navegador.

## Ligando num backend real

`assets/js/api.js` é o único ponto que conhece a origem dos dados. Reimplemente os métodos de `api`
com `fetch`, convertendo as respostas de erro para `ApiError` (`key` de i18n, `status`, `code`,
`fields`). As validações exportadas (`validate…`) continuam servindo para o feedback imediato.
