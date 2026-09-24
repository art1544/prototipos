# Protótipos

Coleção de protótipos navegáveis de diferentes projetos. A página inicial é um catálogo: escolha
um protótipo para abrir. Cada protótipo fica na própria pasta, com código, estilos e banco de
dados de exemplo independentes.

| Protótipo                                              | Projeto                               | Plataforma |
| ------------------------------------------------------ | ------------------------------------- | ---------- |
| [Mobilidade](prototypes/mobilidade/README.md)          | Ternium · App de manutenção em campo  | Mobile     |
| [Tool Management](prototypes/tool-management/README.md) | Ternium · Gestão de ferramentas      | Web        |

Tudo é site estático, sem build: HTML, CSS e JavaScript (módulos ES) puros. Não há dependências
para instalar — só o Node.js 18+ para o servidor local e as verificações.

## Rodar localmente

```bash
npm run dev
```

Abra http://localhost:3000/. Para testar no celular na mesma rede Wi-Fi:

```bash
npm run dev -- --host
```

Os protótipos carregam os dados com `fetch`, então abrir o `index.html` com duplo clique não
funciona (o navegador bloqueia módulos e `fetch` em `file://`).

## Estrutura

```
index.html                  catálogo (menu inicial) — lê prototypes/registry.json
preview.html                moldura de celular para protótipos mobile (?p=<id>&device=…)
404.html                    página de erro da hospedagem
assets/                     estilos e scripts do catálogo
prototypes/
  registry.json             lista de protótipos exibidos no catálogo
  mobilidade/               um protótipo = uma pasta autossuficiente
  tool-management/
templates/prototype/        modelo usado pelo `npm run new`
scripts/
  serve.mjs                 servidor local (npm run dev)
  check.mjs                 verificações (npm run check, também no CI)
  new-prototype.mjs         cria um protótipo a partir do modelo (npm run new)
vercel.json                 hospedagem: barra final nas pastas, cabeçalhos de segurança e cache
```

## Adicionar um protótipo

```bash
npm run new -- portal-fornecedores "Portal de Fornecedores" --cliente "Ternium" --projeto "Compras"
```

Use `--mobile` para protótipos de celular (o catálogo passa a oferecer a moldura de celular). O
comando copia `templates/prototype/` para `prototypes/<id>/`, preenche nome e id e registra o
protótipo em `prototypes/registry.json`. Depois:

1. Ajuste descrição, tags e cor (`accent`) no `registry.json`.
2. Desenvolva em `prototypes/<id>/` e documente telas, dados e regras no `README.md` da pasta.
3. Rode `npm run check` antes de subir.

Para trazer um protótipo que já existe (um HTML único, por exemplo), crie a pasta com o comando
acima e separe o conteúdo seguindo as convenções abaixo.

### Campos do `registry.json`

| Campo         | Obrigatório | Descrição                                                   |
| ------------- | ----------- | ----------------------------------------------------------- |
| `id`          | sim         | kebab-case, igual ao nome da pasta                          |
| `name`        | sim         | nome exibido                                                |
| `client`      | sim         | cliente                                                     |
| `project`     | sim         | projeto / sistema                                           |
| `description` | sim         | uma ou duas frases sobre o que o protótipo demonstra        |
| `platform`    | sim         | `mobile` ou `web`                                           |
| `version`     | sim         | versão do protótipo                                         |
| `path`        | sim         | `prototypes/<id>/` (com barra final)                        |
| `icon`        | sim         | caminho do ícone a partir da raiz                           |
| `updatedAt`   | não         | `AAAA-MM-DD`                                                |
| `accent`      | não         | cor hexadecimal da faixa do cartão                          |
| `tags`        | não         | assuntos (também entram na busca)                           |

## Convenções (arquitetura padrão)

Todo protótipo segue o mesmo desenho, para qualquer pessoa conseguir mexer em qualquer um:

```
prototypes/<id>/
  index.html               casca: carrega CSS e assets/js/app.js (type="module")
  README.md                telas, rotas, modelo de dados, regras e dados de teste
  data/db.json             banco de exemplo, com _meta.schemaVersion
  assets/css/styles.css    tokens (cores, fontes, espaçamentos) no topo
  assets/img/              ícones e imagens (nada de base64 embutido no HTML)
  assets/js/
    config.js              identidade, regras, limites, parâmetros de URL
    utils.js               funções puras (datas, texto, imagens, ícones)
    api.js                 camada de dados: única parte que sabe de onde vêm os dados
    app.js                 estado, rotas, telas, ações e inicialização
```

Protótipos maiores quebram `app.js` em módulos (`views/`, `actions.js`, `router.js`, `i18n/`…),
como o Mobilidade.

- **Autossuficiente:** um protótipo não importa arquivos de outro. Dá para copiar a pasta e
  publicá-la sozinha. O que é comum fica padronizado no modelo, não compartilhado em tempo de
  execução — mudar um protótipo nunca quebra outro.
- **Caminhos relativos** dentro da pasta (`assets/…`, `data/db.json`), nunca a partir da raiz.
- **Dados:** `data/db.json` é a base de exemplo; as alterações ficam no `localStorage` com chave
  prefixada pelo id (`<id>:db`), já que todos os protótipos dividem o mesmo domínio. Mudou a
  estrutura? Incremente `schemaVersion` no `db.json` e em `config.js`.
- **Camada de dados:** `api.js` simula a API REST (latência, erros padronizados com `ApiError`,
  validações). Para ligar num backend real, só ele muda.
- **Rotas por hash** (`#/tela`), para funcionar em hospedagem estática e em links diretos.
- **Parâmetros de teste:** `?latencia=<ms>` e `?erros=<0..1>` em todos os protótipos.
- **Segurança:** todo texto dinâmico passa por `esc()` antes de virar HTML; nada de scripts inline
  (a CSP de produção bloqueia).
- **Acessibilidade:** rótulos ligados aos campos, erros com `aria-describedby`, foco no título ao
  trocar de tela, contraste e alvos de toque adequados.
- **Saída do protótipo:** "Sair" e um link "Todos os protótipos" voltam ao catálogo (`../../`).

## Verificações

```bash
npm run check
```

Valida o `registry.json` (campos, ids únicos, pastas e ícones existentes), a estrutura de cada
protótipo (`index.html`, `README.md`, `db.json` e arquivos referenciados no HTML), a sintaxe de
todos os `.js` e, quando há `assets/js/i18n/`, se todos os idiomas têm as mesmas chaves e se as
chaves usadas no código existem. Roda no GitHub Actions a cada push e pull request.

## Publicar na Vercel

**Pelo GitHub (recomendado):** em vercel.com → *Add New… → Project*, importe o repositório e use:

| Configuração     | Valor            |
| ---------------- | ---------------- |
| Framework Preset | Other            |
| Build Command    | *(vazio)*        |
| Output Directory | *(vazio — raiz)* |
| Install Command  | *(vazio)*        |

Cada push na `main` gera um deploy de produção; branches e PRs geram URLs de preview.

O `vercel.json` força a barra final nas pastas (`/prototypes/mobilidade` → `/prototypes/mobilidade/`,
necessário para os caminhos relativos), define os cabeçalhos de segurança (CSP, `nosniff`,
`X-Frame-Options: SAMEORIGIN` — a moldura de celular usa iframe do próprio site) e desliga o cache
de `data/` e do `registry.json`. `.vercelignore` deixa `scripts/`, `templates/` e `.md` fora do deploy.

Links antigos do Tool Management na raiz (`/#/ferramentas`…) redirecionam para
`/prototypes/tool-management/`.
