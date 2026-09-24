// Aviso para quem abre o index.html direto do disco (duplo clique).
// Navegadores bloqueiam módulos ES e fetch em file://, então o app não chega a iniciar.
if (window.location.protocol === 'file:') {
  document.getElementById('app').innerHTML = `
    <main class="app-main">
      <div class="state-screen">
        <h1 class="state-screen__title">Abra o protótipo por um servidor</h1>
        <p class="state-screen__text">O navegador não carrega os dados quando o arquivo é aberto direto do disco.
          Na raiz do repositório, rode <code>npm run dev</code> e acesse o endereço exibido, ou use o link publicado.</p>
      </div>
    </main>`;
}
