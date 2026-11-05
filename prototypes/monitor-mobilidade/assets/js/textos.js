/**
 * Textos do botão "i" de cada métrica: o que o número significa, de onde vem e como é calculado.
 * Chave = nome do campo no resumo do despacho, id do check (C03, C06...) ou bloco da tela.
 * Os números que chegam da API trazem a própria explicação (campo "explicacao"); aqui ficam só os da tela.
 */
export const EXPLICACOES = {
  veredito: 'Pior status entre as perguntas do dia: Crítico vence Atenção, que vence OK. Perguntas "fora do monitor" ou "sem dados" não entram no veredito. A análise roda todo dia às 05:30 (novas tentativas às 06:30 e 08:00) e também quando uma lista de despacho é enviada.',
  usuariosEnvolvidos: 'Usuários diferentes que receberam ao menos uma ordem da lista no despacho. Coleta: OBJETOUSUARIO das ordens da lista, TIPO_OBJETO = ORDEN, ordem liberada e FECHA_MODIFICACION a partir do início do despacho. Cálculo: contagem de IDs de usuário distintos; é a base do % dos usuários.',
  semPendencia: 'Usuários do despacho sem nenhuma ordem nem retorno pendente por motivo do negócio. Pendências técnicas (da TI) não contam aqui. Cálculo: contagem; o % é sobre os usuários envolvidos.',
  comPendencia: 'Usuários do despacho com ao menos uma ordem ou um retorno pendente por motivo do negócio. Cálculo: usuários envolvidos menos os sem pendência; o % é sobre os usuários envolvidos.',
  ordensEnviadas: 'Envios de ordem a usuários no despacho. Cada ordem vai para todos os usuários do grupo ou posto no SAP, então uma ordem vira vários envios. Coleta: OBJETOUSUARIO das ordens da lista, ordem liberada (LIBERADO = 1) e FECHA_MODIFICACION a partir do início. Cálculo: contagem de pares ordem × usuário; é a base do % das ordens.',
  ordensRecebidas: 'Envios do despacho que chegaram ao app: OBJETOUSUARIO.FECHA_SYNC preenchida (o app confirmou a sincronização). Cálculo: contagem; o % é sobre os envios.',
  ordensPendentes: 'Envios do despacho não recebidos por motivo do negócio: usuário sem aparelho, sem apontamentos recentes, que não abriu o app desde o despacho, ou ordem fora da janela de 1 mês. Os envios em reenvio ou esgotados pelo sistema são da TI e não entram. Cálculo: contagem; o % é sobre os envios.',
  ordensForaJanela: 'Envios cuja ordem foi vinculada a este usuário há mais de 1 mês (OBJETOUSUARIO.FECHA_CREACION). Pela regra de negócio o app só busca vínculos de até 1 mês, então essas ordens não chegam. Cálculo: contagem; o % é sobre os envios.',
  retornosPendentes: 'Retornos do SAP aos apontamentos dos usuários do despacho que não chegaram ao aparelho, por motivo do negócio: aparelho sem uso desde o retorno, aparelho trocado ou erro no SAP (status ER). Coleta: EVENT_NOTIFICATION_CONTROL desde o início do despacho, sem SYNC_DATE. Cálculo: contagem; o % é sobre os retornos do SAP no despacho.',
  usuariosPorUso: 'Cada usuário é classificado pelo cadastro de aparelho (DEVICE_INFO) e pelo último apontamento no app (maior EVENTOS.FECHA_CREACION; a base guarda 15 dias): sem aparelho cadastrado; tem aparelho e nenhum apontamento nos últimos 15 dias; último apontamento antes do início do despacho; apontou depois do início. Cálculo: contagem de usuários e soma das ordens pendentes do negócio em cada grupo.',
  ordensPorMotivo: 'Envios pendentes do negócio agrupados pelo motivo, com a ação sugerida para cada um. O motivo vem do uso do app pelo usuário e da regra de 1 mês. Cálculo: contagem de envios por motivo.',
  retornosPorMotivo: 'Retornos pendentes do negócio agrupados pelo motivo: aparelho não usado desde o retorno (último apontamento anterior ao retorno), erro no SAP (status ER, volta a ficar pendente a cada reenvio) e usuário que trocou de aparelho (o retorno ficou no antigo). Cálculo: contagem por motivo.',
  motivoUsuario: 'Pendências que dependem do usuário ou do negócio, agrupadas pelo motivo (mesma classificação da planilha do negócio). Cálculo: contagem por motivo.',
  motivoSistema: 'Pendências técnicas, que ficam com a TI: em reenvio automático, tentativas esgotadas, retorno que o app recebeu e não confirmou, ou aparelho sem token de notificação. Cálculo: contagem por motivo.',
  matriz: 'Status de cada pergunta no relatório de cada dia (o da execução diária ou o mais recente do dia). Verde OK, amarelo atenção, vermelho crítico, cinza fora do monitor, contorno sem dados.',
  C06: 'Valor principal da pergunta 5 em cada dia, na visão geral (sem recorte de despacho): envios de ordem sem confirmação do app há mais de 2 h, com vínculo de até 1 mês, mais os que esgotaram as 8 tentativas. Fonte: OBJETOUSUARIO.',
  C07: 'Valor principal da pergunta 6 em cada dia, na visão geral: retornos do SAP sem confirmação do aparelho há mais de 2 h, mais os que esgotaram as 3 tentativas. Fonte: EVENT_NOTIFICATION_CONTROL.',
  C03: 'Valor principal da pergunta 3 em cada dia: apontamentos em LE com 3 envios ou mais ao Service Bus, sem retorno do SAP. Fonte: EVENTOS (15 dias de histórico).',
  C09: 'Tempo de resposta, em milissegundos, do serviço de login do app na chamada de teste de cada dia.',
};
