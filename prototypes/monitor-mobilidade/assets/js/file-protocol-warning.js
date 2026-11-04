// Aviso para quem abre o index.html direto do disco (duplo clique):
// navegadores bloqueiam módulos ES e fetch em file://, então o app não chega a iniciar.
if (window.location.protocol === 'file:') {
  document.getElementById('login').innerHTML = `
    <main style="padding:32px;max-width:520px;margin:auto;font-family:system-ui,sans-serif">
      <h1>Abra o protótipo por um servidor</h1>
      <p>Na raiz do repositório, rode <code>npm run dev</code> e acesse o endereço exibido.</p>
    </main>`;
}
