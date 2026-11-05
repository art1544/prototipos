/* ==========================================================================
   ENCO Portal Web · entrada (módulo ES carregado pelo index.html)
   1. importa o núcleo, os dados e as telas, nesta ordem (cada arquivo registra o que é seu em window.ENCO);
   2. carrega a base (data/db.json) e as imagens pela camada de dados (api.js);
   3. inicia o portal, que abre no login.
   ========================================================================== */
import './config.js';
import './enco.js';
import './layout.js';
import './login.js';
import './filtros.js';
import './exporta.js';
import { instalarDominio } from './dados/dominio.js';
import { instalarUsuarios } from './dados/usuarios.js';
import { instalarRecebedores } from './dados/recebedores.js';
import { instalarImagens } from './dados/imagens.js';
import './telas/home.js';
import './telas/planos.js';
import './telas/dashboards.js';
import './telas/rotas.js';
import './telas/coletas.js';
import './telas/veiculos.js';
import './telas/tipos.js';
import './telas/macro.js';
import './telas/pontos.js';
import './telas/nc.js';
import './telas/prioridades.js';
import './telas/movimentos.js';
import './telas/perfis.js';
import './telas/areas.js';
import './telas/usuarios.js';
import './telas/configuracoes.js';
import './telas/logs.js';
import { carregarBase } from './api.js';

const boot = document.getElementById('boot');

function mostrarErro(erro) {
  boot.innerHTML = '';
  const titulo = document.createElement('strong');
  titulo.textContent = 'Não foi possível abrir o portal';
  const msg = document.createElement('span');
  msg.textContent = erro && erro.message ? erro.message : String(erro);
  const botao = document.createElement('button');
  botao.className = 'btn btn-p';
  botao.type = 'button';
  botao.textContent = 'Tentar de novo';
  botao.addEventListener('click', () => { boot.innerHTML = '<span class="boot-spin" aria-hidden="true"></span><span>Carregando…</span>'; iniciar(); });
  boot.append(titulo, msg, botao);
}

async function iniciar() {
  try {
    const [db] = await Promise.all([carregarBase(), instalarImagens()]);
    instalarDominio(db);
    instalarUsuarios(db);
    instalarRecebedores(db);
  } catch (erro) {
    console.error(erro);
    mostrarErro(erro);
    return;
  }
  boot.remove();
  document.getElementById('app').hidden = false;
  window.ENCO.start();
}

iniciar();
