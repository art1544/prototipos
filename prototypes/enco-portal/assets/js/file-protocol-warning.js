// Aviso para quem abre o index.html direto do disco (duplo clique):
// navegadores bloqueiam módulos ES e fetch em file://, então o portal não chega a iniciar.
if (window.location.protocol === 'file:') {
  document.getElementById('boot').innerHTML = `
    <strong>Abra o protótipo por um servidor</strong>
    <span>Na raiz do repositório, rode <code>npm run dev</code> e acesse o endereço exibido.</span>`;
}
