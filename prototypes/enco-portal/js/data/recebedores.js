/* ==========================================================================
   ENCO Portal Web · base de recebedores (fictícia)
   Recebedor é o contato de um ponto de descarga que NÃO é usuário do ENCO: não faz
   login, não tem perfil e não aparece na tela Usuários; só recebe a entrega e os avisos.
   Nome, 8ID, telefone e e-mail são obrigatórios e editados no próprio contato do ponto; quando mudam, ENCO.bus avisa com { recebedorAtualizado: id }.
   [OBS] Na implementação, esta base precisa de tabela e API próprias.
   ========================================================================== */
(function () {
  var lista = [
    { id: 'R1', id8: '10988456', nome: 'Marta Vieira Prado', email: 'marta.prado@fornecedor.exemplo.com.br', cel: '(21) 98811-2040' },
    { id: 'R2', id8: '10988123', nome: 'Otávio Reis Cunha', email: 'otavio.cunha@ternium.com.br', cel: '(21) 99732-5518' },
    { id: 'R3', id8: 'STAVARES', nome: 'Sandra Lima Tavares', email: 'sandra.tavares@exemplo.com.br', cel: '(21) 99640-7713' }
  ], seq = lista.length;

  ENCO.recebedores = lista;
  ENCO.recebedor = function (id) { return lista.filter(function (r) { return r.id === id; })[0] || null; };
  ENCO.adicionarRecebedor = function (dados) {
    var r = { id: 'R' + (++seq), id8: dados.id8, nome: dados.nome, email: dados.email, cel: dados.cel };
    lista.push(r);
    return r;
  };
  ENCO.atualizarRecebedor = function (id, dados) {
    var r = ENCO.recebedor(id);
    if (!r) return;
    r.id8 = dados.id8; r.nome = dados.nome; r.email = dados.email; r.cel = dados.cel;
    ENCO.bus.emit({ recebedorAtualizado: id });
  };
})();
