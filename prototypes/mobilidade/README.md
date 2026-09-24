# Mobilidade – protótipo (área logada)

> Ternium · App de manutenção em campo · **mobile first**

Protótipo navegável do app Mobilidade v4.0.0: início com progresso das atividades, ordens (lista
com abas e detalhe), solicitação de ordem comum e de emergência (PM10) com operações, notas com
fotos da câmera, eventos de sincronização com o SAP, notificações, modificação de matrícula e perfil
com troca de idioma (português, inglês e espanhol).

Site estático, sem build: HTML, CSS e JavaScript (módulos ES). Os dados de exemplo ficam em
`data/db.json`; o que for feito na interface fica salvo no navegador (`localStorage`, chave
`mobilidade:db`).

## Rodar

Na raiz do repositório:

```bash
npm run dev
```

- No computador: http://localhost:3000/prototypes/mobilidade/ — ou, no catálogo, **Ver em moldura
  de celular** para simular aparelhos de 320 a 768 px.
- No celular (mesma rede Wi-Fi): `npm run dev -- --host` e abra o endereço de rede exibido.
  No navegador do celular, **Adicionar à tela inicial** abre o protótipo em tela cheia, como app.

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
assets/img/logo.png        ícone do app (antes embutido em base64 no HTML)
assets/css/styles.css      estilos: tokens no topo, componentes, responsivo no fim
assets/js/
  config.js                identidade, regras, limites e parâmetros de URL
  utils.js                 datas, texto, imagens, download e ícones SVG
  i18n/                    index.js (t(), plural, datas por idioma) + pt.js, en.js, es.js
  api.js                   camada de dados: simula o backend, validações e erros (ApiError)
  store.js                 estado global (setState / assignState / setPath)
  router.js                rotas por hash integradas ao histórico (botão voltar do celular)
  model.js                 leitura e derivação de dados para as telas
  forms.js                 estados iniciais de formulários e filtros
  actions.js               cliques, envios de formulário e tratamento de erros
  ui.js                    toast e diálogo (<dialog> nativo)
  dom.js                   atualização mínima do DOM (preserva foco e teclado do celular)
  views/                   uma função de desenho por tela (HTML escapado com esc())
  app.js                   tabela de rotas, render, eventos e inicialização
```

## Telas e rotas

| Rota                                   | Tela                                      |
| -------------------------------------- | ----------------------------------------- |
| `#/`                                   | Início                                    |
| `#/perfil`                             | Perfil (idioma, sobre o app, protótipo)   |
| `#/notificacoes`                       | Notificações                              |
| `#/ordens` · `#/ordens?aba=andamento`  | Ordens (abas Todas / Em andamento / Concluídas) |
| `#/ordens/:codigo`                     | Detalhe da ordem (Operações / Dados Básicos / Documentos) |
| `#/solicitacao`                        | Solicitação de Ordens                     |
| `#/solicitacao/ordem-comum`            | Ordem Comum                               |
| `#/solicitacao/minhas`                 | Minhas Solicitações                       |
| `#/solicitacao/emergencia`             | Ordem de Emergência (PM10)                |
| `#/solicitacao/emergencia/operacao`    | Adicionar Operação                        |
| `#/solicitacao/emergencia/local`       | Seleção do local de instalação            |
| `#/notas` · `#/notas/:codigo`          | Notas e detalhe da nota                   |
| `#/notas/nova` · `#/notas/nova/local`  | Nova nota e seleção do local              |
| `#/eventos` · `#/eventos/:operacao`    | Eventos agrupados por operação e eventos da operação |
| `#/matricula`                          | Modificar Matrícula                       |

O botão voltar (da tela e do celular) volta uma tela. Voltando de um detalhe, a lista mantém aba e
busca; voltando do seletor de local ou de "Adicionar Operação", o formulário mantém o rascunho.

## Modelo de dados (`data/db.json`)

| Entidade          | Campos principais                                                                 |
| ----------------- | --------------------------------------------------------------------------------- |
| `users`           | `id`, `name`, `username`, `registration` (matrícula), `email`, `role`, `deviceId` |
| `planningGroups`, `workCenters`, `plants`, `activityTypes` | catálogos SAP: `id`, `name`              |
| `noteTypes`       | `id` (`M0` \| `M8` \| `M3`), `requiresOrder`                                        |
| `locations`       | locais de instalação em árvore: `code`, `description`, `parent`                   |
| `orders`          | `code`, `type`, `description`, `priority`, `status` (`andamento` \| `concluida`), `locationCode`, catálogos, datas, `operations[]`, `documents[]` |
| `requests`        | solicitações de Ordem Comum: `orderCode`, `createdAt`, `status` (`pendente` \| `sincronizada`) |
| `events`          | fila de sincronização: `operation`, `kind`, `category`, `message`, `status` (`pendente` \| `erro` \| `sincronizado`) |
| `notes`           | `code`, `type`, `orderNumber`, `locationCode`, textos, período, classificação, `photos[]` |
| `notifications`   | `type`, `template`, `vars`, `createdAt`, `read`                                   |

Prioridades, probabilidade de falha e impacto ficam como ids (`emergencia`, `media`, `parada_linha`…)
e são traduzidos na exibição. Datas em ISO local; na primeira carga são deslocadas para que
`_meta.referenceDate` vire o dia atual (a lista continua "recente" em qualquer dia).

Ao mudar a estrutura do `db.json`, incremente `_meta.schemaVersion` e `API_CONFIG.schemaVersion`
(`assets/js/config.js`): os dados antigos salvos no navegador são descartados.

## Regras de negócio simuladas

- **Ordem Comum:** código obrigatório (letras, números e hífen, até 20); não pode repetir uma
  solicitação existente. Entra como *pendente*; **Atualizar** sincroniza as pendentes.
- **Ordem de Emergência:** tipo fixo PM10; local, descrição, texto longo, período (fim depois do
  início) e ao menos uma operação. Operações são numeradas 0010, 0020…, herdam centro e centro de
  trabalho da ordem e aceitam de 1 a 99 pessoas. Ao salvar vira a ordem `OS-…` em andamento.
- **Nota:** formulário progressivo — tipo → número da ordem (tipos M0 e M8) → demais campos. Até
  6 fotos, reduzidas para 960 px (JPEG) antes de salvar. Código sequencial `NT-…`.
- **Local de instalação:** só locais sem filhos podem ser escolhidos; há busca por código/descrição.
- **Matrícula:** só números (4 a 10 dígitos), diferente da atual.
- **Eventos:** sincronizar envia os pendentes da operação; reprocessar reenvia os com erro (todos ou
  um a um).
- **Progresso do Início:** % de operações concluídas nas ordens em andamento.
- **Documentos da ordem:** excluir pede confirmação.
- **Qualidade da rede (topo):** vem do navegador (`navigator.connection` / offline).

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

Para voltar ao cenário inicial: **Perfil → Restaurar dados de exemplo**. **Sair** (topo) e
**Perfil → Todos os protótipos** voltam ao catálogo.

## Correções em relação ao HTML original

- Clicar num card de **Ordens** (com aba filtrada) ou de **Notas** (com busca) abria o item errado:
  o índice era da lista filtrada, mas a busca era feita na lista completa.
- A descrição das operações era inserida sem escape (HTML digitado era interpretado).
- "Adicionar Operação" mostrava sempre o mesmo local fixo, não o escolhido na ordem.
- Data fim podia ser anterior à data início; matrícula aceitava letras.
- Excluir documento não pedia confirmação; salvar não registrava nada (a ordem de emergência não
  aparecia em Ordens, a ordem comum não aparecia em Minhas Solicitações).
- Sem rotas: o botão voltar do Android saía do protótipo e recarregar voltava ao início.
- Modais sem Esc, sem foco preso e com conteúdo oculto ainda acessível ao leitor de tela.
- Conteúdo 4 px escondido sob o topo fixo (padding fixo de 58 px para um topo de 62 px).
- Campos com fonte de 14 px (zoom automático no iOS) e botões de ícone com ~30 px de toque.
- Tudo num HTML de 350 KB (logo em base64 e dados no script), sem persistência.

## Ligando num backend real

`assets/js/api.js` é o único ponto que conhece a origem dos dados. Reimplemente os métodos de `api`
com `fetch`, convertendo as respostas de erro para `ApiError` (`key` de i18n, `status`, `code`,
`fields`). As validações exportadas (`validate…Input`) continuam servindo para o feedback imediato.
