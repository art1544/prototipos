/* ==========================================================================
   ENCO Portal Web · Tela: Rotas  (rota #rotas)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('rotas', {
  title: 'Rotas',
  rootClass: '',
  template: `
    <div class="content">
<main class="main" id="main"></main>
<footer class="savebar-wrap" id="foot" hidden><div class="savebar"><div class="msg" id="fMsg"></div><div class="spacer"></div><button class="btn btn-s" id="fCancel">Cancelar</button><button class="btn btn-p" id="fSave" disabled>Salvar rota</button></div></footer>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t==null?'':t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={route:'<circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/>',
     pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',plus:'<path d="M12 5v14M5 12h14"/>',pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
     trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
     search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',dn:'<path d="m6 9 6 6 6-6"/>',up:'<path d="m18 15-6-6-6 6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',ok:'<path d="m5 12 5 5 9-10"/>',
     back:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',warn:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
     ext:'<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',grip:'<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
     l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',chev:'<path d="m9 18 6-6-6-6"/>'};
    /* pontos de descarga (fictícios, nomes da tela atual) */
    var RAW=[['Ponto Geral','Facilities B32',-22.5407,-43.43582],['Ponto Geral','Engenharia Retirar Almox',22.90083,43.735882],['Ponto Geral','Pool Manut. Ofic. Execução',22.911765,43.741977],['Ponto Geral','Energy & Media Utilid Man',41.40338,2.17403],
     ['Ponto Geral','Energy & Media Terme Manu',43.74464,217.403],['Ponto Geral','OCT - Oficina Central Ter',-22.909509,-43.734859],['Ponto Geral','Oficina Pat Placas II',41.40338,2.17403],['Ponto Geral','Energy & Media Planj Manu',41.40338,2.17403],
     ['Ponto Geral','ADM-M Amb',-22.900161,-43.733664],['Ponto Geral','ADM Gate',-22.900161,-43.733664],['Ponto Geral','Engenharia B33',-22.901688,-43.733364],['Ponto Geral','Fire Fighting ADM A',-22.909968,-43.74297],['Ponto Geral','Seg. Trabalho',-22.901428,-43.732759],['Ponto Geral','Seg. Empresarial',-22.902957,-43.73186],
     ['Oficina Central','Pool Manut. Equip. Central',22.911765,43.741977],['Oficina Central','Oficina Central - Recebimento',-22.910004,-43.739221],['Aciaria','Aciaria B16 A',-22.907112,-43.736410],['Aciaria','Aciaria B03 Lab C',-22.908351,-43.737901],
     ['Alto Forno 2','Alto Forno 2 - Casa de Corrida',-22.90612,-43.73548],['Coqueria','Coqueria - Esteira 4',-22.9039,-43.7305],['Laminação a Quente','Laminação a Quente - Forno 1',-22.90587,-43.7333],['Portaria Principal','Portaria Principal - Guarita 1',-22.91234,-43.74101]];
    var P={},MAC=[];RAW.forEach(function(r,i){var id='p'+(i+1);P[id]={id:id,macro:r[0],ident:r[1],lat:r[2],lon:r[3]};if(MAC.indexOf(r[0])<0)MAC.push(r[0])});
    function ids(m){return Object.keys(P).filter(function(k){return P[k].macro===m})}
    var R=[{id:1,nome:'Atendimento Janela',area:'Almoxarifado',seq:[{m:'Ponto Geral',pts:['p1','p2','p3','p4','p5','p6','p7','p8','p9','p10','p11','p12','p13','p14']},{m:'Oficina Central',pts:['p15']}]},
     {id:2,nome:'Rota Geral',area:'Almoxarifado',seq:[{m:'Portaria Principal',pts:['p22']},{m:'Aciaria',pts:['p17','p18']},{m:'Alto Forno 2',pts:['p19']},{m:'Coqueria',pts:['p20']},{m:'Laminação a Quente',pts:['p21']},{m:'Oficina Central',pts:['p16']}]}];
    var AREAS=['Almoxarifado'],nextId=3,view='list',q='',ps=10,pg=0,open={},draft=null,orig='',touched={},aq='',aopen={},drag=null;
    /* coordenada: fora da usina = mais de 15 km do centro */
    var C0=[-22.906,-43.736];
    function km(a,b){var R=6371,t=Math.PI/180,dl=(b[0]-a[0])*t,dn=(b[1]-a[1])*t,x=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a[0]*t)*Math.cos(b[0]*t)*Math.sin(dn/2)*Math.sin(dn/2);return 2*R*Math.asin(Math.sqrt(x))}
    function bad(id){var p=P[id];if(Math.abs(p.lat)>90||Math.abs(p.lon)>180)return 'Coordenada inválida';return km(C0,[p.lat,p.lon])>15?'Coordenada fora da área da usina':''}
    function fmt(n){return String(n).replace('.',',')}
    function nPts(r){return r.seq.reduce(function(s,g){return s+g.pts.length},0)}
    function nBad(r){return r.seq.reduce(function(s,g){return s+g.pts.filter(bad).length},0)}
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function toast(t,label,fn){scr.qsa('.toast').forEach(function(o){o.remove()});var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t)+(label?'<button class="tbtn" type="button">'+esc(label)+'</button>':'');scr.layer.appendChild(x);if(label)x.querySelector('.tbtn').onclick=function(){fn();x.remove()};setTimeout(function(){x.remove()},label?6000:2800)}
    function modal(t,b,f){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function mapUrl(id){var p=P[id];return 'https://www.google.com/maps?q='+p.lat+','+p.lon}
    /* ===== listagem ===== */
    function rows(){var t=q.trim().toLowerCase();return R.filter(function(r){return !t||r.nome.toLowerCase().indexOf(t)>=0||r.area.toLowerCase().indexOf(t)>=0||r.seq.some(function(g){return g.m.toLowerCase().indexOf(t)>=0||g.pts.some(function(id){return P[id].ident.toLowerCase().indexOf(t)>=0})})}).sort(function(a,b){return a.nome.localeCompare(b.nome,'pt')})}
    function seqDetail(r){var n=0;return '<div class="rdet">'+r.seq.map(function(g,gi){var h='<div class="mgrp"><div class="mgh"><span class="mstep">'+(gi+1)+'</span><b>'+esc(g.m)+'</b><span class="pill">'+plural(g.pts.length,'ponto','pontos')+'</span></div><div class="ptab"><div class="pcols2 thead"><span>Pos.</span><span>Ponto</span><span>Latitude</span><span>Longitude</span><span></span></div>'+
      g.pts.map(function(id){n++;var p=P[id],b=bad(id);return '<div class="pcols2 prw'+(b?' bad':'')+'"><span class="pos">'+n+'</span><span class="pnm">'+esc(p.ident)+(b?'<span class="cwarn">'+svg(IC.warn,12)+b+'</span>':'')+'</span><span class="mono">'+fmt(p.lat)+'</span><span class="mono">'+fmt(p.lon)+'</span><span class="actions"><a class="ib sm" href="'+mapUrl(id)+'" target="_blank" rel="noopener" aria-label="Abrir '+esc(p.ident)+' no mapa" title="Abrir no mapa">'+svg(IC.ext,16)+'</a></span></div>'}).join('')+'</div></div>';return h}).join('')+'</div>'}
    function renderList(){view='list';$('foot').hidden=true;var all=rows(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var list=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.route,26)+'</div><div style="flex-grow:1"><h1>Rotas</h1><p>Defina a sequência de macro pontos e pontos de descarga que o entregador percorre.</p></div>'+(ENCO.feature('novaRota')?'<button class="btn btn-p" id="btnNew">'+svg(IC.plus,18)+'Cadastrar rota</button>':'')+'</section>';
     h+='<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" placeholder="Pesquisar por rota, área ou ponto" aria-label="Pesquisar rota" autocomplete="off" value="'+esc(q)+'"></label><span class="pill">'+plural(all.length,'rota','rotas')+'</span></div>'+
     '<div class="rcols thead"><span>Rota</span><span>Área responsável</span><span>Sequência</span><span>Pontos</span><span></span></div>';
     if(!list.length)h+='<div class="empty"><b>Nenhuma rota encontrada</b><span style="color:#5E627C;font-size:14px">'+(ENCO.feature('novaRota')?'Ajuste a pesquisa ou cadastre uma nova rota.':'Ajuste a pesquisa.')+'</span></div>';
     list.forEach(function(r){var o=!!open[r.id],nb=nBad(r);
      h+='<div class="cwrap"><div class="rcols rrow" tabindex="0" role="button" aria-expanded="'+o+'" data-tg="'+r.id+'" aria-label="Ver sequência da rota '+esc(r.nome)+'"><span class="stk"><b>'+esc(r.nome)+'</b></span><span><span class="tag2">'+esc(r.area)+'</span></span>'+
      '<span class="seqv">'+r.seq.slice(0,3).map(function(g,i){return '<span class="sq"><i>'+(i+1)+'</i>'+esc(g.m)+'</span>'}).join(svg(IC.chev,12))+(r.seq.length>3?'<span class="more">+'+(r.seq.length-3)+'</span>':'')+'</span>'+
      '<span class="stk"><b>'+plural(nPts(r),'ponto','pontos')+'</b>'+(nb?'<small class="wtxt">'+svg(IC.warn,12)+plural(nb,'coordenada a revisar','coordenadas a revisar')+'</small>':'<small>'+plural(r.seq.length,'macro ponto','macro pontos')+'</small>')+'</span>'+
      '<span class="actions"><button class="ib" data-edit="'+r.id+'" aria-label="Editar '+esc(r.nome)+'" title="Editar">'+svg(IC.pen,18)+'</button>'+(ENCO.feature('novaRota')?'<button class="ib" data-dup="'+r.id+'" aria-label="Duplicar '+esc(r.nome)+'" title="Duplicar">'+svg(IC.copy,18)+'</button>':'')+'<button class="ib del" data-del="'+r.id+'" aria-label="Excluir '+esc(r.nome)+'" title="Excluir">'+svg(IC.trash,18)+'</button><span class="ib ex" aria-hidden="true">'+svg(IC.dn,18)+'</span></span></div>'+(o?seqDetail(r):'')+'</div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[10,25,50].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    /* ===== formulário ===== */
    function snap(d){return JSON.stringify([d.nome.trim(),d.area,d.seq])}
    function inRoute(id){return draft.seq.some(function(g){return g.pts.indexOf(id)>=0})}
    function addPt(id){if(inRoute(id))return;var m=P[id].macro,g=draft.seq.filter(function(x){return x.m===m})[0];if(!g){g={m:m,pts:[]};draft.seq.push(g)}g.pts.push(id)}
    function rmPt(id){draft.seq.forEach(function(g){var i=g.pts.indexOf(id);if(i>=0)g.pts.splice(i,1)});draft.seq=draft.seq.filter(function(g){return g.pts.length})}
    function check(){var n=draft.nome.trim(),dupe=!!n&&R.some(function(r){return r.id!==draft.id&&r.nome.trim().toLowerCase()===n.toLowerCase()}),np=draft.seq.reduce(function(s,g){return s+g.pts.length},0);
     return{n:n?(dupe?'Já existe uma rota com este nome.':''):'Informe o nome da rota.',a:draft.area?'':'Selecione a área responsável.',p:np?'':'Adicione pelo menos um ponto à rota.',np:np,dupe:dupe,dirty:snap(draft)!==orig}}
    function openForm(id,dup){var r=id?R.filter(function(x){return x.id===id})[0]:null;draft=r?JSON.parse(JSON.stringify(r)):{id:0,nome:'',area:AREAS.length===1?AREAS[0]:'',seq:[]};
     if(dup){draft.id=0;draft.nome=r.nome+' (cópia)'}orig=r&&!dup?snap(draft):snap({nome:'',area:draft.area,seq:[]});touched={};aq='';aopen={};view='form';$('foot').hidden=false;
     var one=AREAS.length===1;
     $('main').innerHTML='<section class="card page-head"><button class="ib" id="btnBack" aria-label="Voltar para a listagem" title="Voltar">'+svg(IC.back,22)+'</button><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.route,26)+'</div><div style="flex-grow:1"><h1>'+(r&&!dup?'Editar rota':'Nova rota')+'</h1><p>Adicione os pontos na ordem em que o entregador vai passar por eles.</p></div></section>'+
     '<section class="card"><div class="fgr"><div class="fld"><label class="lbl" for="fNome">Nome da rota <span class="req">*</span></label><input class="inp" id="fNome" maxlength="50" autocomplete="off" placeholder="Ex.: Atendimento Janela" value="'+esc(draft.nome)+'"><span class="ferr" id="eNome"></span></div>'+
     '<div class="fld"><label class="lbl" for="fArea">Área responsável <span class="req">*</span></label>'+(one?'<div class="lockv" id="fArea">'+esc(AREAS[0])+'<small>Única área cadastrada</small></div>':'<select class="inp" id="fArea"><option value="">Selecione a área</option>'+AREAS.map(function(a){return '<option'+(a===draft.area?' selected':'')+'>'+esc(a)+'</option>'}).join('')+'</select>')+'<span class="ferr" id="eArea"></span></div></div></section>'+
     '<div class="rbuild"><section class="card bcol"><div class="bh"><div><h2>Pontos disponíveis</h2><p class="sub">Clique em + ou arraste o ponto para a rota.</p></div></div><label class="search" style="max-width:none;margin:0 20px 12px">'+svg(IC.search,18)+'<input class="inp" id="aq" placeholder="Buscar ponto ou macro ponto" aria-label="Buscar ponto disponível" autocomplete="off"></label><div class="avail" id="avail"></div></section>'+
     '<section class="card bcol drop" id="seqCol"><div class="bh"><div><h2>Sequência da rota</h2><p class="sub" id="seqSub"></p></div></div><div id="seqList"></div><span class="ferr" id="ePts" style="padding:0 20px 14px"></span></section></div>';
     $('main').scrollTop=0;$('btnBack').onclick=leave;
     $('fNome').addEventListener('input',function(e){draft.nome=e.target.value;small()});$('fNome').addEventListener('blur',function(){touched.n=1;small()});
     if(!one)$('fArea').addEventListener('change',function(e){draft.area=e.target.value;touched.a=1;small()});
     $('aq').addEventListener('input',function(e){aq=e.target.value;avail()});
     wireForm();ui();$('fNome').focus()}
    function avail(){var t=aq.trim().toLowerCase(),h='';MAC.forEach(function(m){var list=ids(m).filter(function(id){return !t||P[id].ident.toLowerCase().indexOf(t)>=0||m.toLowerCase().indexOf(t)>=0});if(!list.length)return;
      var free=list.filter(function(id){return !inRoute(id)}),o=t||aopen[m];
      h+='<div class="ag'+(o?' open':'')+'"><div class="agh"><button class="agt" data-ag="'+esc(m)+'" aria-expanded="'+!!o+'">'+svg(IC.dn,16)+'<b>'+esc(m)+'</b><span class="pill">'+free.length+'/'+list.length+'</span></button>'+(free.length?'<button class="btn btn-g sm3" data-addall="'+esc(m)+'">'+svg(IC.plus,14)+'Todos</button>':'<span class="okt">'+svg(IC.ok,13)+'Na rota</span>')+'</div>'+
      (o?'<div class="agl">'+list.map(function(id){var p=P[id],inr=inRoute(id),b=bad(id);return '<div class="ap'+(inr?' in':'')+'" draggable="'+!inr+'" data-drag="'+id+'"><span class="grip">'+svg(IC.grip,14)+'</span><span class="apn"><b>'+esc(p.ident)+'</b>'+(b?'<small class="wtxt">'+svg(IC.warn,11)+b+'</small>':'<small class="mono">'+fmt(p.lat)+', '+fmt(p.lon)+'</small>')+'</span>'+(inr?'<span class="okt">'+svg(IC.ok,13)+'Na rota</span>':'<button class="ib sm add" data-add="'+id+'" aria-label="Adicionar '+esc(p.ident)+' à rota" title="Adicionar à rota">'+svg(IC.plus,16)+'</button>')+'</div>'}).join('')+'</div>':'')+'</div>'});
     $('avail').innerHTML=h||'<div class="cemp">Nenhum ponto encontrado.</div>'}
    function seqList(){var n=0,G=draft.seq;
     $('seqList').innerHTML=G.length?G.map(function(g,gi){return '<div class="sg" data-g="'+gi+'"><div class="sgh"><span class="mstep">'+(gi+1)+'</span><b>'+esc(g.m)+'</b><span class="pill">'+plural(g.pts.length,'ponto','pontos')+'</span><span class="spacer"></span>'+
      '<button class="ib sm" data-gmv="'+gi+'|-1"'+(gi===0?' disabled':'')+' aria-label="Mover macro ponto '+esc(g.m)+' para cima" title="Mover para cima">'+svg(IC.up,16)+'</button><button class="ib sm" data-gmv="'+gi+'|1"'+(gi===G.length-1?' disabled':'')+' aria-label="Mover macro ponto '+esc(g.m)+' para baixo" title="Mover para baixo">'+svg(IC.dn,16)+'</button><button class="ib sm del" data-grm="'+gi+'" aria-label="Remover macro ponto '+esc(g.m)+' da rota" title="Remover macro ponto">'+svg(IC.trash,16)+'</button></div>'+
      g.pts.map(function(id,pi){n++;var p=P[id],b=bad(id);return '<div class="sp'+(b?' bad':'')+'" draggable="true" data-sdrag="'+id+'" data-gi="'+gi+'" data-pi="'+pi+'"><span class="grip">'+svg(IC.grip,14)+'</span><span class="pos">'+n+'</span><span class="apn"><b>'+esc(p.ident)+'</b>'+(b?'<small class="wtxt">'+svg(IC.warn,11)+b+' · revise em Pontos de descarga</small>':'')+'</span>'+
       '<button class="ib sm" data-pmv="'+gi+'|'+pi+'|-1"'+(pi===0?' disabled':'')+' aria-label="Mover '+esc(p.ident)+' para cima" title="Mover para cima">'+svg(IC.up,15)+'</button><button class="ib sm" data-pmv="'+gi+'|'+pi+'|1"'+(pi===g.pts.length-1?' disabled':'')+' aria-label="Mover '+esc(p.ident)+' para baixo" title="Mover para baixo">'+svg(IC.dn,15)+'</button><button class="ib sm del" data-prm="'+id+'" aria-label="Remover '+esc(p.ident)+' da rota" title="Remover">'+svg(IC.x,15)+'</button></div>'}).join('')+'</div>'}).join(''):
      '<div class="dzone">'+svg(IC.pin,30)+'<b>Nenhum ponto na rota</b><span>Arraste pontos para cá ou use o botão + na lista ao lado. Eles entram agrupados pelo macro ponto.</span></div>';
     var np=G.reduce(function(s,g){return s+g.pts.length},0),nb=G.reduce(function(s,g){return s+g.pts.filter(bad).length},0);
     $('seqSub').innerHTML=np?plural(G.length,'macro ponto','macro pontos')+' · '+plural(np,'ponto','pontos')+(nb?' · <span class="wtxt">'+svg(IC.warn,12)+plural(nb,'coordenada a revisar','coordenadas a revisar')+'</span>':''):'Ordem em que o entregador visita os pontos.'}
    function small(){var s=check();$('eNome').textContent=(touched.n||s.dupe||touched.s)&&s.n?s.n:'';$('fNome').classList.toggle('err',!!$('eNome').textContent);$('eArea').textContent=(touched.a||touched.s)&&s.a?s.a:'';$('ePts').textContent=touched.s&&s.p?s.p:'';
     var m=$('fMsg');m.className='msg'+(s.dirty?' dirty':'');m.innerHTML=s.dirty?svg(IC.warn,16)+'Alterações ainda não salvas':'Nenhuma alteração pendente';$('fSave').disabled=!s.dirty}
    function ui(){avail();seqList();small()}
    var wired=false;function wireForm(){if(wired)return;wired=true;var mn=$('main');
     mn.addEventListener('dragstart',function(e){var t=e.target.closest&&(e.target.closest('[data-drag]')||e.target.closest('[data-sdrag]'));if(!t||view!=='form')return;drag=t.dataset.drag?{type:'a',id:t.dataset.drag}:{type:'s',id:t.dataset.sdrag,gi:+t.dataset.gi,pi:+t.dataset.pi};e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',drag.id)}catch(x){}t.classList.add('dragging')});
     mn.addEventListener('dragend',function(){drag=null;scr.qsa('.dragging,.over').forEach(function(x){x.classList.remove('dragging','over')});var c=$('seqCol');if(c)c.classList.remove('hot')});
     mn.addEventListener('dragover',function(e){if(!drag||view!=='form')return;var c=e.target.closest('#seqCol');if(!c)return;e.preventDefault();c.classList.add('hot');scr.qsa('.over').forEach(function(x){x.classList.remove('over')});var sp=e.target.closest('[data-sdrag]');if(sp&&drag.type==='s'&&+sp.dataset.gi===drag.gi)sp.classList.add('over')});
     mn.addEventListener('dragleave',function(e){var c=$('seqCol');if(c&&!c.contains(e.relatedTarget))c.classList.remove('hot')});
     mn.addEventListener('drop',function(e){if(!drag||view!=='form')return;var c=e.target.closest('#seqCol');if(!c)return;e.preventDefault();
      if(drag.type==='a'){addPt(drag.id);ui();toast(P[drag.id].ident+' adicionado à rota')}
      else{var sp=e.target.closest('[data-sdrag]');if(sp&&+sp.dataset.gi===drag.gi){var g=draft.seq[drag.gi],to=+sp.dataset.pi;g.pts.splice(drag.pi,1);g.pts.splice(to,0,drag.id);ui()}}
      drag=null;c.classList.remove('hot')})}
    function mv(a,i,d){var j=i+d;if(j<0||j>=a.length)return;var x=a[i];a[i]=a[j];a[j]=x}
    function leave(){if(!check().dirty){renderList();return}var m=modal('Descartar alterações?','Você montou ou alterou a rota e ainda não salvou. Se sair agora, as mudanças serão perdidas.','<button class="btn btn-s" data-x>Continuar editando</button><button class="btn btn-p" id="ok">Descartar e sair</button>');m.querySelector('#ok').onclick=function(){m.remove();renderList()}}
    $('fCancel').onclick=leave;
    $('fSave').onclick=function(){touched.s=1;var s=check();ui();if(s.n||s.a||s.p){var f=s.n?$('fNome'):s.a&&$('fArea').tagName==='SELECT'?$('fArea'):$('seqCol');f.scrollIntoView({block:'center',behavior:'smooth'});if(f.focus)f.focus({preventScroll:true});return}
     var isNew=!draft.id,rec=JSON.parse(JSON.stringify(draft));rec.nome=rec.nome.trim();rec.id=isNew?nextId++:draft.id;if(isNew)R.push(rec);else R=R.map(function(r){return r.id===rec.id?rec:r});q='';open={};open[rec.id]=true;renderList();toast('Rota "'+rec.nome+'" '+(isNew?'cadastrada':'atualizada'))};
    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(view==='form'){
      if(t=e.target.closest('[data-ag]')){var m=t.dataset.ag;aopen[m]=!aopen[m];avail();return}
      if(t=e.target.closest('[data-addall]')){var mm=t.dataset.addall,n=0;ids(mm).forEach(function(id){if(!inRoute(id)){addPt(id);n++}});ui();toast(plural(n,'ponto adicionado','pontos adicionados')+' de '+mm);return}
      if(t=e.target.closest('[data-add]')){addPt(t.dataset.add);ui();var nb=main.querySelector('[data-ag="'+P[t.dataset.add].macro.replace(/"/g,'\\"')+'"]');return}
      if(t=e.target.closest('[data-prm]')){var id=t.dataset.prm,snapS=JSON.stringify(draft.seq);rmPt(id);ui();toast(P[id].ident+' removido da rota','Desfazer',function(){draft.seq=JSON.parse(snapS);ui()});return}
      if(t=e.target.closest('[data-grm]')){var gi=+t.dataset.grm,s2=JSON.stringify(draft.seq),g=draft.seq[gi];draft.seq.splice(gi,1);ui();toast(g.m+' removido da rota','Desfazer',function(){draft.seq=JSON.parse(s2);ui()});return}
      if(t=e.target.closest('[data-gmv]')){var a=t.dataset.gmv.split('|');mv(draft.seq,+a[0],+a[1]);ui();var nb2=main.querySelector('[data-gmv="'+(+a[0]+ +a[1])+'|'+a[1]+'"]');if(nb2&&!nb2.disabled)nb2.focus();return}
      if(t=e.target.closest('[data-pmv]')){var b=t.dataset.pmv.split('|');mv(draft.seq[+b[0]].pts,+b[1],+b[2]);ui();var nb3=main.querySelector('[data-pmv="'+b[0]+'|'+(+b[1]+ +b[2])+'|'+b[2]+'"]');if(nb3&&!nb3.disabled)nb3.focus();return}
      return}
     if(e.target.closest('#btnNew')){openForm(0);return}
     if(t=e.target.closest('[data-edit]')){openForm(+t.dataset.edit);return}
     if(t=e.target.closest('[data-dup]')){openForm(+t.dataset.dup,true);return}
     if(t=e.target.closest('[data-del]')){var r=R.filter(function(x){return x.id===+t.dataset.del})[0];var d=modal('Excluir rota?','Você vai excluir a rota <b>'+esc(r.nome)+'</b>, com '+plural(nPts(r),'ponto','pontos')+'. Os pontos de descarga continuam cadastrados.','<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-d" id="ok">Excluir rota</button>');
      d.querySelector('#ok').onclick=function(){var i=R.indexOf(r);R.splice(i,1);d.remove();renderList();toast('Rota "'+r.nome+'" excluída','Desfazer',function(){R.splice(i,0,r);renderList()})};return}
     if(e.target.closest('#pPrev')){pg--;renderList();return}if(e.target.closest('#pNext')){pg++;renderList();return}
     if(e.target.closest('a')||e.target.closest('.rdet'))return;
     if(t=e.target.closest('[data-tg]')){open[t.dataset.tg]=!open[t.dataset.tg];renderList()}});
    main.addEventListener('keydown',function(e){var t=e.target.closest&&e.target.closest('[data-tg]');if(view==='list'&&t&&e.target===t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();var id=t.dataset.tg;open[id]=!open[id];renderList();var n=main.querySelector('[data-tg="'+id+'"]');if(n)n.focus()}});
    main.addEventListener('input',function(e){if(view==='list'&&e.target.id==='q'){q=e.target.value;pg=0;var c=e.target.selectionStart;renderList();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){if(view==='list'&&e.target.id==='ps'){ps=+e.target.value;pg=0;renderList()}});
    ENCO.bus.on(function(e){if(e.data&&e.data.encoAreas){AREAS=e.data.encoAreas.slice();}});
    scr.onDoc('keydown',function(e){if(e.key==='Escape'){var m=scr.qs('.modal-bg');if(m)m.remove()}});

    renderList();
    })();
  }
});
