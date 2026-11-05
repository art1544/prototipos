/* ==========================================================================
   ENCO Portal Web · Tela: Logs do sistema  (rota #logs, aba de Configurações)
   [S15 aprovado][REAL] O Angular tem modules/client/logs/listagem-logs (colunas Data, Usuário,
   Ação, Descrição e pesquisa), sem item de menu e sem endpoint ("TODO: Implementar serviço de logs").
   Aqui ela fica como aba de Configurações, visível para quem tem a funcionalidade "Visualizar logs".
   Na implementação: criar o endpoint de logs paginado, filtrando por período, ação e texto.
   Os registros abaixo são fictícios.
   ========================================================================== */
ENCO.screen('logs', {
  title: 'Logs do sistema',
  rootClass: '',
  template: `
    <div class="content">
<div class="ghead"><div class="gtop"><div class="icon-tile"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg></div><div><div class="gcrumb">Sistema</div><h1>Configurações</h1><p>Parâmetros do portal e registro do que foi feito por cada usuário.</p></div></div>
<div class="gtabs" role="tablist" aria-label="Configurações"><button class="gtab" role="tab" aria-selected="false" data-go="configuracoes" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Tempo de espera</button><button class="gtab on" role="tab" aria-selected="true" data-go="logs"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>Logs do sistema</button></div></div>
<main class="main" id="main"></main>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>'};
    /* Ações registradas e cores do selo */
    var AC={'Acesso':['#F1F1F6','#4A4E6A'],'Cadastro':['#E1F3E8','#1D6B3E'],'Alteração':['#E9E8F8','#4B45B5'],'Exclusão':['#FBE4E4','#B42318'],'Permissões':['#FDEBDD','#A8420A'],'Envio ao SAP':['#E3F1F6','#1E6E8C'],'Reenvio de e-mail':['#DDF0F2','#1A7A85'],'Cancelamento de plano':['#FBE4E4','#B42318']};
    var MODELOS=[
     ['Acesso','Entrou no portal web'],
     ['Reenvio de e-mail','Reenviou o relatório de entrega do plano 20260923132728 para o ponto WH ADM'],
     ['Envio ao SAP','Reprocessou o envio ao SAP do plano 20260922102211'],
     ['Alteração','Alterou o tempo de espera padrão dos pontos de descarga de 00:08:00 para 00:10:00'],
     ['Cadastro','Cadastrou o ponto de descarga Oficina Central'],
     ['Alteração','Alterou o contato Bruno Duarte Ribeiro no ponto Aciaria B03 Lab C (avisos por SMS)'],
     ['Permissões','Ativou Edição em "Gestão de rotas" para o perfil Controladores'],
     ['Cadastro','Adicionou 1 controlador à área Almoxarifado'],
     ['Exclusão','Excluiu o veículo QPX4B21'],
     ['Alteração','Alterou o telefone do usuário Elisa Campos Silva'],
     ['Cancelamento de plano','Cancelou o plano 20260922153020. Motivo: material não liberado'],
     ['Cadastro','Cadastrou a rota Rota 04 – Utilidades'],
     ['Exclusão','Removeu 1 entregador da área Almoxarifado'],
     ['Permissões','Desativou "Visualizar logs" para o perfil Consultas']
    ];
    var L=[],agora=new Date(2026,9,30,9,40);
    for(var i=0;i<34;i++){var m=MODELOS[(i*5)%MODELOS.length],u=ENCO.usuarios[(i*7)%30],d=new Date(agora.getTime()-i*(53+i%4*17)*60000);
     L.push({data:d,usuario:u,acao:m[0],desc:m[1]})}
    function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
    function br(d){return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
    var ini=new Date(agora.getTime()-6*864e5),st={q:'',acao:'',de:iso(ini),ate:iso(agora),ps:10,pg:0};
    function rows(){var t=st.q.trim().toLowerCase();return L.filter(function(x){var di=iso(x.data);
     return (!st.acao||x.acao===st.acao)&&di>=st.de&&di<=st.ate&&(!t||(x.usuario.nome+' '+x.usuario.id+' '+x.acao+' '+x.desc).toLowerCase().indexOf(t)>=0)})}
    function draw(foco){var all=rows(),pages=Math.max(1,Math.ceil(all.length/st.ps));if(st.pg>=pages)st.pg=pages-1;var list=all.slice(st.pg*st.ps,(st.pg+1)*st.ps);
     var h='<section class="card t-card"><div class="lgf">'+
      '<label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" type="search" placeholder="Usuário, 8ID, ação ou descrição" aria-label="Pesquisar nos logs" value="'+esc(st.q)+'"></label>'+
      '<select class="inp" id="fAcao" style="width:220px" aria-label="Ação"><option value="">Todas as ações</option>'+Object.keys(AC).map(function(a){return '<option'+(a===st.acao?' selected':'')+'>'+a+'</option>'}).join('')+'</select>'+
      '<div class="fld"><label class="lbl" for="fDe">De</label><input class="inp hl" type="date" id="fDe" value="'+st.de+'" max="'+st.ate+'"></div>'+
      '<div class="fld"><label class="lbl" for="fAte">Até</label><input class="inp hl" type="date" id="fAte" value="'+st.ate+'" min="'+st.de+'" max="'+iso(agora)+'"></div>'+
      '<div class="spacer"></div><span class="pill" style="margin-bottom:9px">'+all.length+(all.length===1?' registro':' registros')+'</span></div>'+
      '<div class="lcols thead"><span>Data/hora</span><span>Usuário</span><span>Ação</span><span>Descrição</span></div>';
     if(!list.length)h+='<div class="empty"><b>Nenhum registro encontrado</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa, a ação ou o período.</span></div>';
     list.forEach(function(x){var c=AC[x.acao];h+='<div class="lcols lrow"><span class="mono">'+br(x.data)+'</span><span class="luser"><b>'+esc(x.usuario.nome)+'</b><small>8ID '+esc(x.usuario.id)+'</small></span><span><span class="lacao" style="background:'+c[0]+';color:'+c[1]+'">'+esc(x.acao)+'</span></span><span class="ldesc">'+esc(x.desc)+'</span></div>'});
     var from=all.length?st.pg*st.ps+1:0,to=Math.min(all.length,(st.pg+1)*st.ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[10,25,50].map(function(n){return '<option'+(n===st.ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(st.pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(st.pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div>'+
      '<p class="lnote">Os registros ficam guardados e não podem ser alterados nem excluídos pelo portal.</p></section>';
     $('main').innerHTML=h;
     if(foco){var n=$(foco.id);if(n){n.focus();if(foco.pos!=null)try{n.setSelectionRange(foco.pos,foco.pos)}catch(e){}}}}
    var main=$('main');
    main.addEventListener('input',function(e){if(e.target.id==='q'){st.q=e.target.value;st.pg=0;draw({id:'q',pos:e.target.selectionStart})}});
    main.addEventListener('change',function(e){var id=e.target.id;
     if(id==='fAcao'){st.acao=e.target.value;st.pg=0;draw()}
     else if(id==='fDe'&&e.target.value){st.de=e.target.value;st.pg=0;draw()}
     else if(id==='fAte'&&e.target.value){st.ate=e.target.value;st.pg=0;draw()}
     else if(id==='ps'){st.ps=+e.target.value;st.pg=0;draw()}});
    main.addEventListener('click',function(e){if(e.target.closest('#pPrev')){st.pg--;draw()}else if(e.target.closest('#pNext')){st.pg++;draw()}});
    draw();
    })();
  }
});
