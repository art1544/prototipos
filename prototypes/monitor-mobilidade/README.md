# Monitor Mobilidade – protótipo

> Ternium · Saúde diária do app Mobilidade

Tela que a equipe de sustentação e a área de negócio usam todo dia para saber se o app Mobilidade está saudável:
7 perguntas da rotina diária respondidas pelo backend (filas, ordens recebidas, retornos ao SAP, apontamentos, login),
o resultado do despacho de ordens para a área de negócio e o histórico dos últimos dias.

É a mesma tela da ferramenta real (`inspector-mantenimiento-backend`, pasta `ferramentas/monitor-local/web`), com o
mesmo design e o mesmo comportamento. Só a origem dos dados muda: aqui `assets/js/http.js` entrega as chamadas ao
`assets/js/simulador.js`, que responde as rotas `/v2/monitor/*` com dados fictícios em vez de chamar o backend pelo
APIM.

## Rodar

Na raiz do repositório:

```bash
npm run dev
```

Acesse http://localhost:3000/prototypes/monitor-mobilidade/

**Login:** qualquer usuário e senha preenchidos entram (sessão de 8 h, só na memória da página: recarregar volta ao
login, como na tela real). O 8ID que aparece no topo é o usuário digitado.

## Telas

| Aba / ação | O que mostra |
| --- | --- |
| Login | mesmo usuário e senha do app; olho da senha, espaços removidos, "Esqueci minha senha" (IDM) |
| Saúde do dia | veredito, número em destaque com anel, as 7 perguntas e o botão "i" com a explicação de cada número |
| Detalhes (modal) | números, motivos, achados e regra de cada pergunta |
| Despacho | envio da lista de ordens (colada, .csv/.txt ou planilha do SAP .xlsx) e o resultado para o negócio: indicadores, uso do app, motivos e tabelas de usuários, ordens e retornos com filtros e exportação para Excel |
| Histórico | mapa de calor das 7 perguntas e séries dos últimos dias |
| Menu "•••" | copiar resumo do dia (e-mail/Teams), copiar relatório completo (Markdown), rodar agora, todos os protótipos, sair |
| Exportar PDF | relatório A4 pela impressão do navegador ("Salvar como PDF") |
| Tema | claro ou escuro, lembrado no navegador |

## Arquivos

```
index.html                 marcação igual à da tela real (+ noscript e aviso de file://)
data/db.json               respostas de exemplo das rotas do monitor
assets/css/                os mesmos 6 arquivos da tela real (tokens → movimento) + pdf.css
assets/img/                logos do Mobilidade e da Ternium
assets/js/
  config.js                o da tela real (catálogo, aviso no login, SheetJS local) + regras, mensagens e parâmetros
                           de teste do simulador
  http.js                  troca o fetch da tela real pelo simulador
  simulador.js             backend simulado: rotas /v2/monitor/* sobre data/db.json + localStorage
  vendor/xlsx.full.min.js  SheetJS 0.18.5 (na tela real vem do cdnjs; a CSP do catálogo só aceita scripts locais)
  file-protocol-warning.js aviso para quem abre o index.html direto do disco
  demais arquivos          idênticos aos da tela real (main.js, api.js, sessao.js, ui/, telas/, exportar/, util/...)
```

Para atualizar o protótipo depois de mudar a tela real, copie `assets/css/`, `assets/img/` e `assets/js/` de
`ferramentas/monitor-local/web` por cima destes, mantendo `config.js`, `http.js`, `simulador.js`, `vendor/` e
`file-protocol-warning.js`, e copie o `index.html` refazendo as três diferenças (comentário do topo,
`data-chave-tema="monitor-mobilidade:tema"`, noscript e aviso de file:// no fim do body).

## Dados (`data/db.json`)

| Chave | Conteúdo |
| --- | --- |
| `relatorio` | relatório do dia (veredito, 7 perguntas, checks com números e explicações, despacho) |
| `historico` | um item por dia: veredito, status de cada pergunta e valores |
| `despachoAtual` | resultado do despacho: resumo, usuários, ordens e eventos de retorno |
| `relatorioMarkdown` | relatório completo em texto (menu "Copiar relatório completo") |
| `config` | chave `ativo` do monitor |
| `execucoes`, `envios` | análises manuais e listas enviadas no protótipo |

Os dados foram gerados pela demonstração local do backend e são fictícios (usuários `DEMO…` e `109…`). As
alterações ficam no navegador (`localStorage`, chave `monitor-mobilidade:db`). Ao mudar a estrutura do `db.json`,
incremente `_meta.schemaVersion` e `API_CONFIG.schemaVersion` (`assets/js/config.js`).

## Regras simuladas (as mesmas do backend)

- Sem sessão, ou com a sessão vencida, qualquer rota responde 401 e a tela volta ao login.
- **Enviar lista de despacho:** ordens de até 12 dígitos, distintas (zeros à esquerda não contam), no máximo 5.000;
  início no formato da tela e não mais que 5 min no futuro; uma lista a cada 10 min. Depois do cálculo (20 s no
  protótipo), o resultado do despacho e o relatório do dia passam a mostrar o envio novo, como na tela real (que
  acompanha a cada 15 s).
- **Rodar agora:** a resposta é sempre "Execução solicitada"; a análise só roda se a última manual tiver mais de
  10 min. Ao terminar, o relatório vira MANUAL com a hora nova (os números de exemplo não mudam).
- **PDF:** o servidor responde 501 e a tela abre a impressão do navegador, como no servidor sem Edge/Chrome.

## Parâmetros de teste

| URL | Efeito |
| --- | --- |
| `?latencia=2000` | 2 s de atraso por chamada |
| `?erros=0.3` | 30% das chamadas falham (503) |
| `?calculo=3000` | despacho e análise manual ficam prontos em 3 s (padrão 20 s) |

Para voltar aos dados de exemplo, apague a chave `monitor-mobilidade:db` do `localStorage` do site.
