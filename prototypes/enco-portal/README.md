# ENCO · Portal Web

Protótipo navegável do Portal Web do ENCO (entregas e coletas da Ternium), versão 3.0.0 - DEV.

**Como abrir:** na raiz do repositório, `npm run dev` e abra o ENCO pelo catálogo
(http://localhost:3000/prototypes/enco-portal/). Abrir o `index.html` com duplo clique não funciona:
o navegador bloqueia módulos ES e `fetch` em `file://` (a página avisa).

- Login simulado: qualquer usuário e senha preenchidos entram. A sessão fica na aba
  (`sessionStorage`, chave `enco-portal:auth`): F5 mantém logado; "Sair" volta ao login.
- O ícone de grade na barra superior e o link na tela de login voltam ao catálogo ("Todos os protótipos").
- Para ir direto a uma tela, use o hash: `#planos`, `#pontos`, `#usuarios`…
- Parâmetros de teste: `?latencia=<ms>` e `?erros=<0..1>` (falha simulada ao carregar a base).
- Fonte Plus Jakarta Sans pelo Google Fonts; sem internet, o navegador usa a fonte do sistema.

## Estrutura

```
index.html                    casca: topbar e menu lateral; carrega styles.css e main.js (módulo)
README.md                     este arquivo
SUGESTOES.md                  ajustes feitos e sugestões para aprovação
data/db.json                  base de exemplo (_meta.schemaVersion): sessão, domínio, usuários, recebedores
assets/css/
  styles.css                  entrada: importa os demais, nesta ordem
  base.css                    estilos comuns a todas as telas
  shell.css                   estrutura da SPA
  telas/<tela>.css            estilos da tela, válidos só com body[data-screen="<tela>"]
  ajustes.css                 ajustes de leitura (sem quebras/cortes)
  login.css                   tela de login (seletores sob #login), por último
assets/img/                   logos, ícone do login e imagens de exemplo (fotos de pontos, assinatura, crachá, ocorrência)
assets/js/
  main.js                     entrada: importa núcleo, dados e telas; carrega a base e inicia o portal
  config.js                   identidade, camada de dados, parâmetros de URL e feature flags
  api.js                      camada de dados: única parte que sabe de onde vêm os dados
  file-protocol-warning.js    aviso para quem abre por file://
  enco.js                     registro de telas, roteador (#hash) e barramento entre telas
  layout.js                   menu, topbar e seletor de área
  login.js                    login simulado: o portal só inicia depois de entrar
  filtros.js                  padrão dos filtros: título visível e destaque quando está filtrando
  exporta.js                  relatórios em Excel (.xlsx) e PDF, sem bibliotecas
  dados/
    dominio.js                regras do domínio (celular derivado do 8ID, permissões da sessão)
    usuarios.js               base única de usuários: busca e atualização de telefone/e-mail
    recebedores.js            contatos de ponto que não são usuários do ENCO
    imagens.js                imagens de assets/img/ convertidas em data URI (ENCO.img)
  telas/<tela>.js             template + comportamento de cada tela
```

## Telas

| Tela | Hash | Observação |
| --- | --- | --- |
| Início | `#home` | resumo da operação, rotas em andamento, alertas, entregas da semana e atividade recente |
| Gestão de Planos | `#planos` | filtros, detalhe do plano, reenvio de e-mail, cancelamento e relatório Excel/PDF |
| Dashboards | `#dashboards` | tempo de descarga (período de até 90 dias) e relatório PDF |
| Veículos / Tipos de veículo | `#veiculos`, `#tipos` | |
| Pontos de descarga / Macro pontos | `#pontos`, `#macro` | contatos podem ser usuários ou recebedores |
| Parâmetros | `#movimentos`, `#prioridades`, `#nc` | tipos de movimento, prioridades e não conformidades |
| Gestão de Perfis | `#perfis` | funcionalidades e permissões |
| Áreas Responsáveis | `#areas` | |
| Usuários | `#usuarios` | único lugar que edita telefone e e-mail |
| Configurações / Logs | `#configuracoes`, `#logs` | |
| Rotas, Coletas | `#rotas`, `#coletas` | desligadas por feature flag (`assets/js/config.js`) |

## Dados

- `data/db.json` guarda o que é compartilhado entre telas: `sessao` (usuário logado e permissões),
  `dominio` (status, funcionalidades e limites de colunas do sistema real), `usuarios` (90 fictícios)
  e `recebedores`. `api.js` carrega a base com latência simulada e valida `schemaVersion`.
- Os demais cadastros de exemplo (planos, veículos, pontos, rotas…) ainda ficam nas próprias telas
  (`assets/js/telas/`). Alterações ficam só em memória: recarregar volta à base.
- Mudou a estrutura do `db.json`? Incremente `_meta.schemaVersion` e `API_CONFIG.schemaVersion`.

## Como funciona

- `main.js` importa os módulos na ordem certa; cada um registra o que é seu em `window.ENCO`.
  Depois carrega a base e as imagens (`api.js`) e chama `ENCO.start()`, que abre o login.
- Cada tela chama `ENCO.screen('nome', { title, template, init(root, scr) })`.
- `scr.byId / scr.qs / scr.qsa` buscam só dentro da tela; `scr.onDoc` só dispara com a tela ativa;
  modais e toasts vão para `scr.layer`.
- As telas são montadas uma vez e ficam guardadas ao trocar de tela: filtros e edições continuam lá.
- Cadastros compartilhados (áreas, tipos de veículo, macro pontos, prioridades, movimentos) trafegam
  por `ENCO.bus`; quem altera emite a lista e as telas dependentes se atualizam.

## Nova tela

1. Crie `assets/js/telas/minha-tela.js` com `ENCO.screen('minha-tela', {...})` e importe em `main.js`.
2. Crie `assets/css/telas/minha-tela.css` com seletores prefixados por
   `:where(body[data-screen="minha-tela"])` e importe em `assets/css/styles.css`.
3. Inclua um botão `data-go="minha-tela"` no menu do `index.html`.
