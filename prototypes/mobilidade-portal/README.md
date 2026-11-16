# Mobilidade · Portal web – protótipo

> Ternium · Gestão e suporte do app Mobilidade · **web (desktop)**

Protótipo navegável do Portal web do Mobilidade v1.0.0 (ambiente DEV): a área de gestão usada por
coordenadores e administradores para acompanhar o que acontece no app de campo
([Mobilidade](../mobilidade/README.md)) — ordens, notas, envios ao SAP, saúde diária da aplicação,
erros reportados pelos técnicos, versões do app, usuários e perfis. Em português, inglês e espanhol.

Site estático, sem build: HTML, CSS e JavaScript. Os dados de exemplo são gerados no próprio
`assets/js/app.js` de forma determinística (mesma semente → mesmos números), com datas relativas ao
dia atual.

## Rodar

Na raiz do repositório:

```bash
npm run dev
```

Abra http://localhost:3000/prototypes/mobilidade-portal/.

**Login:** qualquer usuário e senha preenchidos entram (usuário até 20 caracteres). O link
**Todos os protótipos**, no login, volta ao catálogo.

## Telas

| Menu                     | Tela                                                                       |
| ------------------------ | -------------------------------------------------------------------------- |
| Visão geral              | **Início** (análise geral) e **Alertas**                                   |
| Manutenção da planta     | **Ordens** (lista e detalhe), **Notas** e **Indicadores** (dashboard)      |
| Sistema Mobilidade       | **Envios ao SAP**, **Saúde da aplicação** (Saúde do dia, Despacho, Histórico, Agendamento e e-mail), **Erros reportados** (o lado do suporte do "Reportar erro" do app), **Diagnóstico** e **Atualização do app** |
| Administração            | **Usuários e acessos** (perfis e permissões) e **Histórico de ações**      |

O seletor **Perfil** no topo troca o perfil simulado (Administrador ou Coordenador) e mostra só as
telas que ele pode ver. O perfil Inspetor existe só no app de campo e não acessa o portal.

## Estrutura

```
index.html                 casca: login e área logada (topo, menu lateral e área principal)
assets/css/styles.css      estilos
assets/js/app.js           dados de exemplo, telas, ações, filtros salvos e traduções (pt, en, es)
assets/js/vendor/          SheetJS (xlsx 0.18.5) local, carregado sob demanda para ler/gerar Excel
assets/img/                ícone do login e logo do Mobilidade
```

Veio de um protótipo de HTML único: o conteúdo foi separado em HTML, CSS, JavaScript e imagens
(sem base64 nem script inline, por causa da CSP do catálogo) e o SheetJS passou a ser carregado da
própria pasta, com o mesmo hash de integridade (SRI) da cópia do cdnjs. Ainda não segue a divisão
completa da arquitetura padrão (`config.js`, `api.js`, `data/db.json`, `i18n/`): os dados e as
traduções continuam dentro de `app.js`.

## Dados salvos no navegador

`localStorage`, com as chaves prefixadas pelo id do protótipo:

| Chave                              | Conteúdo                                   |
| ---------------------------------- | ------------------------------------------ |
| `mobilidade-portal:filtros`        | filtros salvos por tela                    |
| `mobilidade-portal:alertasLidos`   | alertas já marcados como lidos             |
| `mobilidade-portal:idioma`         | idioma escolhido (`pt`, `en` ou `es`)      |
