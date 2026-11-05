/* ==========================================================================
   ENCO Portal Web · base única de usuários (fictícia, em data/db.json → usuarios)
   [REAL] Nome e 8ID vêm do AD (tabela Usuario, sincronizada pelos grupos
   GG_BR_PRD_EntregaColeta_*). Telefone (Usuario.Celular) e e-mail (Usuario.Email)
   são cadastrados à mão no portal e só podem ser editados na tela Usuários.
   Áreas Responsáveis e os contatos dos pontos de descarga usam esta mesma base:
   quando o telefone ou o e-mail muda, ENCO.bus avisa com { usuarioAtualizado: id }.
   Alguns usuários não têm telefone ou e-mail: o cadastro manual ainda não foi feito.
   ========================================================================== */
const ENCO = window.ENCO;
let porId = {};

ENCO.usuario = function (id) { return porId[String(id).toUpperCase()] || null; };
/* Única forma de alterar telefone e e-mail (chamada só pela tela Usuários) */
ENCO.atualizarUsuario = function (id, dados) {
  const u = ENCO.usuario(id);
  if (!u) return;
  u.email = dados.email; u.cel = dados.cel;
  ENCO.bus.emit({ usuarioAtualizado: u.id });
};

export function instalarUsuarios(db) {
  ENCO.usuarios = db.usuarios;
  porId = {};
  db.usuarios.forEach(function (u) { porId[u.id] = u; });
}
