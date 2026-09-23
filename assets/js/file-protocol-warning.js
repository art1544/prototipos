// Aviso para quem abre o index.html direto do disco (duplo clique).
// Navegadores bloqueiam módulos ES e fetch em file://, então o app não chega a iniciar.
if (window.location.protocol === 'file:') {
  document.getElementById('app').innerHTML = `
    <main>
      <div class="page page--sm">
        <section class="card panel state-card">
          <h1 class="page-title">Abra o protótipo por um servidor</h1>
          <p class="page-subtitle">O navegador não carrega os dados quando o arquivo é aberto direto do disco.</p>
          <p class="field-hint">Na pasta do projeto, rode <code>npx serve .</code> e acesse o endereço exibido,
            ou use o link publicado na Vercel.</p>
        </section>
      </div>
    </main>`;
}
