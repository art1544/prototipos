/* ==========================================================================
   ENCO Portal Web · imagens de exemplo (fotos dos pontos, assinatura, crachá, ocorrência e logo)
   Os arquivos ficam em assets/img/. Na inicialização viram data URI (ENCO.img.<nome>) porque os
   relatórios em Excel e PDF (exporta.js) precisam embutir as imagens no arquivo gerado.
   ========================================================================== */
import { carregarImagens } from '../api.js';

export const IMAGENS = {
  logo: 'assets/img/logo-enco.png',
  ponto1: 'assets/img/ponto-1.svg',
  ponto2: 'assets/img/ponto-2.svg',
  ponto3: 'assets/img/ponto-3.svg',
  ponto4: 'assets/img/ponto-4.svg',
  ponto5: 'assets/img/ponto-5.svg',
  assinatura: 'assets/img/exemplo-assinatura.svg',
  cracha: 'assets/img/exemplo-cracha.svg',
  naoConformidade: 'assets/img/exemplo-nao-conformidade.svg'
};

export async function instalarImagens() {
  window.ENCO.img = await carregarImagens(IMAGENS);
}
