# __NAME__ – protótipo

> __CLIENT__ · __PROJECT__

Descreva aqui o objetivo do protótipo e o público (quem vai validar, em que dispositivo).

## Rodar

Na raiz do repositório:

```bash
npm run dev
```

Acesse http://localhost:3000/prototypes/__ID__/

## Telas e rotas

| Rota      | Tela              |
| --------- | ----------------- |
| `#/`      | Lista de itens    |
| `#/novo`  | Cadastro de item  |

## Dados (`data/db.json`)

| Entidade | Campos principais          |
| -------- | -------------------------- |
| `items`  | `id`, `title`, `createdAt` |

As alterações ficam no navegador (`localStorage`, chave `__ID__:db`). Ao mudar a estrutura do
`db.json`, incremente `_meta.schemaVersion` e `API_CONFIG.schemaVersion` (`assets/js/config.js`).

## Regras de negócio

- Liste aqui as validações e regras que o protótipo simula.

## Parâmetros de teste

| URL               | Efeito                            |
| ----------------- | --------------------------------- |
| `?latencia=2000`  | 2 s de atraso por operação        |
| `?erros=0.3`      | 30% das operações falham          |
