/* ==========================================================================
   ENCO Portal Web · base de recebedores (fictícia, em data/db.json → recebedores)
   Recebedor é o contato de um ponto de descarga que NÃO é usuário do ENCO: não faz
   login, não tem perfil e não aparece na tela Usuários; só recebe a entrega e os avisos.
   Nome, 8ID, telefone e e-mail são obrigatórios e editados no próprio contato do ponto;
   quando mudam, ENCO.bus avisa com { recebedorAtualizado: id }.
   [OBS] Na implementação, esta base precisa de tabela e API próprias.
   ========================================================================== */
const ENCO = window.ENCO;
let lista = [], seq = 0;

ENCO.recebedor = function (id) { return lista.filter(function (r) { return r.id === id; })[0] || null; };
ENCO.adicionarRecebedor = function (dados) {
  const r = { id: 'R' + (++seq), id8: dados.id8, nome: dados.nome, email: dados.email, cel: dados.cel };
  lista.push(r);
  return r;
};
ENCO.atualizarRecebedor = function (id, dados) {
  const r = ENCO.recebedor(id);
  if (!r) return;
  r.id8 = dados.id8; r.nome = dados.nome; r.email = dados.email; r.cel = dados.cel;
  ENCO.bus.emit({ recebedorAtualizado: id });
};

export function instalarRecebedores(db) {
  lista = db.recebedores;
  seq = lista.length;
  ENCO.recebedores = lista;
}
