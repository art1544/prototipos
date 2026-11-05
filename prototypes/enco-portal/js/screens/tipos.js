/* ==========================================================================
   ENCO Portal Web · Tela: Tipos de veículo  (rota #tipos)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver js/core/bus.js).
   ========================================================================== */
ENCO.screen('tipos', {
  title: 'Tipos de veículo',
  rootClass: '',
  template: `
    <div class="content">
<div class="ghead"><div class="gtop"><div class="icon-tile"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/><path d="M3 12h18"/></svg></div><div><div class="gcrumb">Cadastros</div><h1>Veículos</h1><p>Frota usada nas entregas e coletas e seus tipos.</p></div></div><div class="gtabs" role="tablist" aria-label="Veículos"><button class="gtab" role="tab" aria-selected="false" data-go="veiculos" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/><path d="M3 12h18"/></svg>Veículos</button><button class="gtab on" role="tab" aria-selected="true" data-go="tipos"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>Tipos de veículo</button></div></div>
<main class="main" id="main"></main>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={truck:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
     car:'<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/><path d="M3 12h18"/>',
     pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
     plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',ok:'<path d="m5 12 5 5 9-10"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',up:'<path d="m18 15-6-6-6 6"/>',dn:'<path d="m6 9 6 6 6-6"/>'};
    var T=[{id:1,nome:'Caminhão Baú'},{id:2,nome:'Caminhão Munck'},{id:3,nome:'Caminhão Munck (Manserv)'},{id:4,nome:'Janela'},{id:5,nome:'Van'}];
    var nextId=6,vc=null,q='',sd=1,ps=5,pg=0;
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function list(){var t=q.trim().toLowerCase();return T.filter(function(x){return !t||x.nome.toLowerCase().indexOf(t)>=0}).sort(function(a,b){return sd*a.nome.localeCompare(b.nome,'pt')})}
    function sync(rename){ENCO.bus.emit({typesList:T.map(function(x){return x.nome}),rename:rename||null})}
    function go(v){ENCO.bus.emit({enco:v})}
    function toast(t){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t);scr.layer.appendChild(x);setTimeout(function(){x.remove()},2800)}
    function modal(t,b,f,lock){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if((e.target===m&&!lock)||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function draw(){var all=list(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var rows=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.truck,26)+'</div><div style="flex-grow:1"><h1>Tipos de veículo</h1><p>Cadastre os tipos usados para classificar os veículos.</p></div><button class="btn btn-p" id="btnNew">'+svg(IC.plus,18)+'Cadastrar tipo</button></section>'+
     '<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" placeholder="Pesquisar por tipo de veículo" aria-label="Pesquisar por tipo de veículo" autocomplete="off" value="'+esc(q)+'"></label><span class="pill">'+plural(all.length,'tipo','tipos')+'</span></div>'+
     '<div class="tcols thead"><span><button class="sortb on" data-s="1" aria-label="Ordenar por nome do tipo">Nome do tipo de veículo'+svg(sd===1?IC.up:IC.dn,14)+'</button></span><span>Veículos</span><span></span></div>';
     if(!rows.length)h+='<div class="empty"><b>Nenhum tipo encontrado</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa ou cadastre um novo tipo.</span></div>';
     rows.forEach(function(x){var n=vc?(vc[x.nome]||0):null;h+='<div class="tcols trow"><span class="tpill"><span class="ti">'+svg(IC.truck,16)+'</span><b style="font-weight:600">'+esc(x.nome)+'</b></span><span class="cnt">'+(n===null?'—':plural(n,'veículo','veículos'))+'</span><span class="actions"><button class="ib" data-edit="'+x.id+'" aria-label="Editar '+esc(x.nome)+'" title="Editar">'+svg(IC.pen,18)+'</button><button class="ib del" data-del="'+x.id+'" aria-label="Excluir '+esc(x.nome)+'" title="Excluir">'+svg(IC.trash,18)+'</button></span></div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    function form(id){var cur=id?T.filter(function(x){return x.id===id})[0]:null,base=cur?cur.nome:'';
     var m=modal(cur?'Editar tipo de veículo':'Novo tipo de veículo','<div class="fld"><label class="lbl" for="fN">Nome do tipo de veículo <span class="req">*</span></label><input class="inp" id="fN" maxlength="60" autocomplete="off" placeholder="Ex.: Caminhão Baú" value="'+esc(base)+'"><span class="ferr" id="fE"></span></div>'+(cur?'<p style="margin:10px 0 0;font-size:13px;color:#5E627C">Ao renomear, os veículos deste tipo passam a usar o novo nome.</p>':''),
      '<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-p" id="fOk" disabled>'+(cur?'Salvar alterações':'Cadastrar tipo')+'</button>',true);
     var inp=m.querySelector('#fN'),ok=m.querySelector('#fOk'),er=m.querySelector('#fE'),touched=false;
     function chk(){var v=inp.value.trim(),dup=!!v&&T.some(function(x){return x.id!==(cur&&cur.id)&&x.nome.toLowerCase()===v.toLowerCase()});
      er.textContent=dup?'Já existe um tipo com este nome.':(touched&&!v?'Informe o nome do tipo de veículo.':'');ok.disabled=!(v&&!dup&&v!==base)}
     function save(){chk();if(ok.disabled)return;var v=inp.value.trim();
      if(cur){var old=cur.nome;cur.nome=v;sync({from:old,to:v});m.remove();draw();toast('Tipo "'+v+'" atualizado')}
      else{var r={id:nextId++,nome:v};T.push(r);sync();q='';var i=list().map(function(x){return x.id}).indexOf(r.id);pg=Math.floor(i/ps);m.remove();draw();toast('Tipo "'+v+'" cadastrado')}}
     inp.addEventListener('input',chk);inp.addEventListener('blur',function(){touched=true;chk()});inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();save()}});ok.onclick=save;inp.focus();inp.select()}
    function del(id){var x=T.filter(function(t){return t.id===id})[0],n=vc?(vc[x.nome]||0):0;
     if(n>0){var m=modal('Não é possível excluir','O tipo <b>'+esc(x.nome)+'</b> está em uso por <b>'+plural(n,'veículo','veículos')+'</b>. Altere o tipo desses veículos ou exclua-os antes de excluir este tipo.','<button class="btn btn-s" data-x>Entendi</button><button class="btn btn-p" id="g">Ir para Veículos</button>');m.querySelector('#g').onclick=function(){m.remove();go('veiculos')};return}
     var d=modal('Excluir tipo de veículo?','Você vai excluir o tipo <b>'+esc(x.nome)+'</b>. Essa ação não pode ser desfeita.','<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-d" id="ok">Excluir tipo</button>');
     d.querySelector('#ok').onclick=function(){T=T.filter(function(t){return t.id!==id});sync();d.remove();draw();toast('Tipo "'+x.nome+'" excluído')}}
    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(e.target.closest('#btnNew')){form(0);return}
     if(t=e.target.closest('[data-edit]')){form(+t.dataset.edit);return}
     if(t=e.target.closest('[data-del]')){del(+t.dataset.del);return}
     if(e.target.closest('[data-s]')){sd=-sd;draw();return}
     if(e.target.closest('#pPrev')){pg--;draw();return}if(e.target.closest('#pNext')){pg++;draw()}});
    main.addEventListener('input',function(e){if(e.target.id==='q'){q=e.target.value;pg=0;var c=e.target.selectionStart;draw();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){if(e.target.id==='ps'){ps=+e.target.value;pg=0;draw()}});
    ENCO.bus.on(function(e){if(e.data&&e.data.encoVeh){vc=e.data.encoVeh;draw()}});
    scr.onDoc('keydown',function(e){if(e.key==='Escape'){var m=scr.qs('.modal-bg');if(m)m.remove()}});

    draw();
    })();
  }
});