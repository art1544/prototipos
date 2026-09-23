# Tool Management – protótipo

Protótipo navegável da gestão de ferramentas e empréstimos: dashboard, listagem e cadastro de
ferramentas, empréstimo (identificação por ID ou reconhecimento facial simulado) e devolução.

É um site estático, sem build: HTML, CSS e JavaScript (módulos ES) puros. Os dados de exemplo
ficam em `data/db.json` e as alterações feitas na interface são salvas no navegador (localStorage).

## Rodar localmente

O app carrega `data/db.json` via `fetch`, então precisa de um servidor HTTP. Abrir o `index.html`
com duplo clique não funciona (o navegador bloqueia módulos e `fetch` em `file://`).

```bash
npx serve .
```

Ou, com Python: `python -m http.server 8000` e acesse http://localhost:8000.

## Publicar na Vercel

**Pelo GitHub (recomendado):** em vercel.com → *Add New… → Project*, importe o repositório e use:

| Configuração        | Valor                  |
| ------------------- | ---------------------- |
| Framework Preset    | Other                  |
| Build Command       | *(vazio)*              |
| Output Directory    | *(vazio — raiz)*       |
| Install Command     | *(vazio)*              |

Cada push na `main` gera um deploy de produção; branches e PRs geram URLs de preview.

**Pela CLI:**

```bash
npx vercel --prod
```

O `vercel.json` só define cabeçalhos: segurança (CSP, `X-Frame-Options`, `nosniff`…) e
`no-cache` para `data/`, para que mudanças na base de exemplo apareçam logo após o deploy.
Endereços inexistentes caem no `404.html`.

## Estrutura

```
index.html                  casca da página
404.html                    página de erro da hospedagem
vercel.json                 cabeçalhos da Vercel
data/db.json                banco de dados de exemplo (todas as entidades)
assets/styles.css           estilos (tokens de cor/tipografia no topo)
assets/favicon.svg
assets/js/config.js         identidade, regras, textos de erro e cores de status
assets/js/utils.js          datas, texto, imagens e ícones
assets/js/api.js            camada de dados: simula a API REST, validações e erros
assets/js/app.js            estado, telas, ações e inicialização
assets/js/file-protocol-warning.js   aviso para quem abre o arquivo direto do disco
```

As telas usam roteamento por hash: `#/`, `#/ferramentas`, `#/ferramentas/cadastrar`,
`#/emprestimos`, `#/emprestimos/novo`, `#/emprestimos/devolucao`.

## Modelo de dados (`data/db.json`)

| Entidade       | Campos principais                                                                                   | Relações                                   |
| -------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `users`        | `id`, `name`, `role`, `active`                                                                      | —                                          |
| `inspectors`   | `id`, `badge` (ID do crachá, único), `name`, `department`, `faceEnrolled`, `active`                 | —                                          |
| `categories`   | `id`, `name`                                                                                        | —                                          |
| `locations`    | `id`, `name`, `type` (`almoxarifado` \| `campo` \| `oficina`)                                         | —                                          |
| `toolStatuses` | `id` (`disponivel` \| `em_uso` \| `manutencao`), `label`, `selectableOnCreate`                        | —                                          |
| `loanStatuses` | `id` (`ativo` \| `devolvido` \| `atrasado`), `label`                                                  | —                                          |
| `tools`        | `id`, `code` (único), `name`, `description`, `status`, `nextMaintenance`, `imageUrl`, `createdAt`, `updatedAt` | `categoryId` → categories, `locationId` → locations, `createdBy` → users, `status` → toolStatuses |
| `loans`        | `id`, `loanDate`, `dueDate`, `returnedDate`, `notes`, `createdAt`, `updatedAt`                       | `toolId` → tools, `inspectorId` → inspectors, `createdBy` / `receivedBy` → users |

Regras de negócio:

- **Status do empréstimo é calculado**, não gravado: `devolvido` se tem `returnedDate`;
  `atrasado` se `dueDate` já passou; senão `ativo`.
- Registrar um empréstimo muda a ferramenta para `em_uso`; a devolução volta para `disponivel`.
- No cadastro, a ferramenta só pode começar como `disponivel` ou `manutencao`.
- Categoria e localização digitadas que ainda não existem são criadas automaticamente.
- Datas são ISO (`AAAA-MM-DD`; data e hora em `AAAA-MM-DDTHH:mm:ss`). Na primeira carga, todas
  são deslocadas para que `_meta.referenceDate` vire o dia atual, e o cenário de exemplo
  (um empréstimo no prazo, um devolvido e um atrasado) continua coerente.

Ao alterar a estrutura do `db.json`, incremente `schemaVersion` em `data/db.json` e em
`API_CONFIG` (`assets/js/config.js`): os dados antigos salvos no navegador são descartados.

## Tratamento de erros

- **Erros padronizados:** toda falha da camada de dados é um `ApiError` com `status` (semântica
  HTTP), `code` (`VALIDATION`, `NOT_FOUND`, `CONFLICT`, `INACTIVE`, `UNAVAILABLE`, `TIMEOUT`,
  `NETWORK`, `STORAGE_FULL`, `INVALID_DATA`…), `message` e, quando for o caso, `fields` (campo → mensagem).
- **Validação em duas camadas:** a interface valida antes de enviar (feedback imediato) e a API
  revalida (regras em `validateToolInput` / `validateLoanInput`).
- **Na interface:** erros de campo aparecem abaixo do campo, com foco no primeiro inválido; os
  demais viram aviso (toast). Os botões mostram "Salvando…" e bloqueiam envio duplicado.
- **Carregamento:** tela de carregando, e tela de erro com "Tentar novamente" (timeout de 10 s,
  falha de rede, HTTP de erro, JSON inválido ou tabelas ausentes).
- **Rotas:** endereço interno inexistente mostra "Página não encontrada"; na hospedagem, `404.html`.
- **Falhas inesperadas:** erros não tratados são registrados no console e avisam o usuário sem
  derrubar a tela; se uma tela falhar ao desenhar, aparece uma tela de erro com "Recarregar".
- **Armazenamento:** se o navegador bloquear o localStorage, o app funciona em memória e avisa;
  se faltar espaço, a operação é desfeita e o usuário é orientado.
- **Imagens:** só PNG/JPG/WEBP/GIF de até 5 MB; são reduzidas para 480 px antes de salvar.

### Simular latência e falhas

Parâmetros de URL (antes do `#`) para testar os estados de carregamento e erro:

| URL                        | Efeito                                   |
| -------------------------- | ---------------------------------------- |
| `/?erros=1`                | toda operação falha (serviço indisponível) |
| `/?erros=0.3`              | 30% das operações falham                 |
| `/?latencia=2000`          | 2 s de atraso por operação               |
| `/?latencia=0`             | sem atraso                               |

## Dados de teste

| ID do crachá | Inspetor         | Observação                              |
| ------------ | ---------------- | --------------------------------------- |
| 12345678     | João Silva       |                                         |
| 87654321     | Maria Santos     |                                         |
| 11223344     | Carlos Oliveira  |                                         |
| 99887766     | Ana Pereira      | identificada pelo reconhecimento facial |
| 55667788     | Pedro Costa      | inativo (mostra o erro de bloqueio)     |

Para voltar ao cenário inicial: menu lateral → **Restaurar dados de exemplo**.

## Ligando num backend real

`assets/js/api.js` é o único ponto que conhece a origem dos dados. Para usar uma API de
verdade, reimplemente os métodos de `api` (`load`, `createTool`, `findInspectorByBadge`,
`recognizeFace`, `createLoan`, `returnLoan`, `reset`) com `fetch`, convertendo as respostas de
erro para `ApiError`. A interface não precisa mudar.
