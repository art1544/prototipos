/* ==========================================================================
   ENCO Portal Web · base única de usuários (fictícia)
   [REAL] Nome e 8ID vêm do AD (tabela Usuario, sincronizada pelos grupos
   GG_BR_PRD_EntregaColeta_*). Telefone (Usuario.Celular) e e-mail (Usuario.Email)
   são cadastrados à mão no portal e só podem ser editados na tela Usuários.
   Áreas Responsáveis e os contatos dos pontos de descarga usam esta mesma base:
   quando o telefone ou o e-mail muda, ENCO.bus avisa com { usuarioAtualizado: id }.
   ========================================================================== */
(function () {
  var FN = ['Ana', 'Bruno', 'Carla', 'Diego', 'Elisa', 'Fábio', 'Gabriela', 'Henrique', 'Isabela', 'João', 'Karina', 'Lucas', 'Marina', 'Nelson', 'Olívia', 'Paulo', 'Renata', 'Samuel', 'Tânia', 'Vinícius'];
  var MN = ['Almeida', 'Barbosa', 'Campos', 'Duarte', 'Esteves', 'Ferraz', 'Gomes', 'Horta', 'Lacerda', 'Moreira'];
  var LN = ['Silva', 'Souza', 'Pereira', 'Oliveira', 'Costa', 'Rocha', 'Ribeiro', 'Nunes', 'Teixeira', 'Cardoso', 'Mendes', 'Araújo'];
  function semAcento(t) { return t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  var lista = [], porId = {};
  for (var i = 0; i < 90; i++) {
    var f = FN[i % 20], m = MN[(i * 3) % 10], l = LN[(i * 5 + i % 7) % 12];
    var id = (i % 4 === 3) ? (f[0] + l).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 8) : String(10400000 + i * 137);
    if (porId[id]) id = id.slice(0, 6) + i;
    var perfis = i % 11 === 0 ? ['Administrador', 'Consultas'] : i % 3 === 0 ? ['Consultas', 'Entregadores', 'Controladores'] : i % 3 === 1 ? ['Consultas'] : i % 5 === 0 ? ['Consultas', 'Controladores'] : ['Consultas', 'Entregadores'];
    /* Alguns sem telefone ou sem e-mail: o cadastro manual ainda não foi feito */
    var u = {
      id: id,
      nome: f + ' ' + m + ' ' + l,
      email: i % 13 === 7 ? '' : semAcento(f + '.' + m + '.' + l) + '@exemplo.com.br',
      cel: i % 9 === 4 ? '' : ENCO.celular(id),
      p: perfis
    };
    lista.push(u); porId[id] = u;
  }

  ENCO.usuarios = lista;
  ENCO.usuario = function (id) { return porId[String(id).toUpperCase()] || null; };
  /* Única forma de alterar telefone e e-mail (chamada só pela tela Usuários) */
  ENCO.atualizarUsuario = function (id, dados) {
    var u = ENCO.usuario(id);
    if (!u) return;
    u.email = dados.email; u.cel = dados.cel;
    ENCO.bus.emit({ usuarioAtualizado: u.id });
  };
})();
