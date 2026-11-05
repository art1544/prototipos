# ENCO Portal Web · Protótipo modular

**Como abrir:** pelo catálogo (`npm run dev` na raiz do repositório) ou com duplo clique em `index.html`
— os scripts são clássicos (sem `module` e sem `fetch`), então também funcionam em `file://`.
O portal abre na tela de login (simulado: qualquer usuário e senha preenchidos entram; "Sair" volta ao login).
O ícone de grade na barra superior e o link na tela de login voltam ao catálogo ("Todos os protótipos").
Para ir direto a uma tela, use o hash: `index.html#planos`, `index.html#coletas`, etc.
(A fonte Plus Jakarta Sans vem do Google Fonts; sem internet, o navegador usa a fonte do sistema.)

## Estrutura

```
index.html                 shell: topbar, menu lateral, carregamento dos módulos
js/main.js                 inicialização (ENCO.start) — fora do HTML por causa da CSP do catálogo
css/base.css               estilos comuns a todas as telas
css/shell.css              estrutura da SPA
css/ajustes.css            ajustes de leitura (sem quebras/cortes)
css/login.css              tela de login (seletores sob #login), carregado por último
css/screens/<tela>.css     estilos da tela, válidos só com body[data-screen="<tela>"]
js/core/enco.js            registro de telas, roteador (#hash) e barramento entre telas
js/core/features.js        feature flags (Coletas está desligada: coletas: false)
js/core/layout.js          menu, topbar e seletor de área
js/core/login.js           tela de login simulado: o portal só inicia depois de entrar (sessão na aba)
js/core/filtros.js         padrão dos filtros: título visível e destaque quando está filtrando
js/core/exporta.js         relatórios em Excel (.xlsx) e PDF, sem bibliotecas
js/data/dominio.js         domínio real (status, funcionalidades, limites de campos)
js/data/imagens.js         imagens de exemplo embutidas (data URI) – originais em assets/img/
js/data/usuarios.js        base única de usuários (nome e 8ID do AD; telefone e e-mail editados só em Usuários)
js/data/recebedores.js     recebedores: contatos de ponto que não são usuários do ENCO
js/screens/<tela>.js       template + comportamento de cada tela
assets/img/                logo
SUGESTOES.md               ajustes feitos e sugestões para aprovação
```

## Como funciona

- Cada tela chama `ENCO.screen('nome', { title, template, init(root, scr) })`.
- `scr.byId / scr.qs / scr.qsa` buscam só dentro da tela; `scr.onDoc` só dispara com a tela ativa;
  modais e toasts vão para `scr.layer`.
- As telas são montadas uma vez e ficam guardadas ao trocar de tela: filtros e edições continuam lá.
- Cadastros compartilhados (áreas, tipos de veículo, macro pontos, prioridades, movimentos) trafegam
  por `ENCO.bus`; quem altera emite a lista e as telas dependentes se atualizam.

## Nova tela

1. Crie `js/screens/minha-tela.js` com `ENCO.screen('minha-tela', {...})`.
2. Crie `css/screens/minha-tela.css` com seletores prefixados por `:where(body[data-screen="minha-tela"])`.
3. Inclua os dois no `index.html` e um botão `data-go="minha-tela"` no menu.

## Diferenças em relação ao catálogo

Este protótipo veio pronto e mantém a própria arquitetura (scripts clássicos com `window.ENCO`,
dados em memória em `js/data/`), em vez do modelo `api.js` + `data/db.json` dos outros
protótipos. Alterações em cadastros ficam só em memória: recarregar volta ao início. A sessão do
login fica no `sessionStorage` com a chave `enco-portal:auth`.
