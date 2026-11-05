/* ==========================================================================
   ENCO · Domínio real (fonte: API/Ternium.EntregaEColeta.Dom/Util/Constantes.cs,
   database/scripts/01-schema.sql e Frontend/src/app/modules/client/client-pages-menu.ts).
   Os valores (status, funcionalidades, limites de campos) ficam em data/db.json → dominio;
   aqui ficam só as regras. A sessão fictícia vem de db.json → sessao.
   ========================================================================== */
const ENCO = window.ENCO;

/* [REAL] Usuario.Celular (varchar 15, opcional). No protótipo o número é derivado do 8ID para
   que a mesma pessoa tenha o mesmo celular em todas as telas. */
ENCO.celular = function (id8) {
  let h = 0;
  const s = String(id8);
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i) * 7919) % 99999989;
  h = (h * 48271) % 99999989;
  const n = String(h % 100000000 + 100000000).slice(1);
  return '(21) 9' + n.slice(0, 4) + '-' + n.slice(4, 8);
};

/* [S05] O reenvio do e-mail de entrega depende da funcionalidade "Reenviar Email de entrega do Plano
   de Descarga" com Edição (perfil Controlador). Em db.json → sessao.permissoes, troque para false
   para ver a Gestão de Planos de quem não tem a permissão. */
ENCO.pode = function (p) { return !!((ENCO.sessao || {}).permissoes || {})[p]; };

export function instalarDominio(db) {
  ENCO.dominio = db.dominio;
  ENCO.sessao = db.sessao;
}
