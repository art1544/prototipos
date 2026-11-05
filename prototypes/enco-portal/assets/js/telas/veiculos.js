/* ==========================================================================
   ENCO Portal Web · Tela: Veículos  (rota #veiculos)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('veiculos', {
  title: 'Veículos',
  rootClass: '',
  template: `
    <div class="content">
<div class="ghead"><div class="gtop"><div class="icon-tile"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/><path d="M3 12h18"/></svg></div><div><div class="gcrumb">Cadastros</div><h1>Veículos</h1><p>Frota usada nas entregas e coletas e seus tipos.</p></div></div><div class="gtabs" role="tablist" aria-label="Veículos"><button class="gtab on" role="tab" aria-selected="true" data-go="veiculos"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/><path d="M3 12h18"/></svg>Veículos</button><button class="gtab" role="tab" aria-selected="false" data-go="tipos" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/></svg>Tipos de veículo</button></div></div>
<main class="main" id="main"></main>
<footer class="savebar-wrap" id="foot" hidden><div class="savebar"><div class="msg" id="fMsg"></div><div class="spacer"></div><button class="btn btn-s" id="fCancel">Cancelar</button><button class="btn btn-p" id="fSave" disabled>Salvar veículo</button></div></footer>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={car:'<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/><path d="M3 12h18"/>',
     truck:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
     pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
     trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
     plus:'<path d="M12 5v14M5 12h14"/>',back:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
     l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',ok:'<path d="m5 12 5 5 9-10"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',up:'<path d="m18 15-6-6-6 6"/>',dn:'<path d="m6 9 6 6 6-6"/>',
     warn:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'};
    var TYPES=['Caminhão Baú','Caminhão Munck','Caminhão Munck (Manserv)','Janela','Van'];
    var V=[],L='ABCDEFGHJKLMNPRSTUVXZ';
    for(var i=0;i<62;i++){var pl=L[(i*7+3)%21]+L[(i*11+5)%21]+L[(i*5+2)%21]+(i%10)+(i%2?L[(i*13)%21]:String((i*7)%10))+String(Math.floor(i/10)%10)+String((i*3)%10);V.push({id:i+1,tipo:TYPES[(i*3+i%4)%5],placa:pl})}
    var nextId=63,view='list',q='',ft='',sk='placa',sd=1,ps=5,pg=0,draft=null,orig='',touched={};
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function snap(d){return JSON.stringify([d.tipo,d.placa])}
    function rows(){var t=q.trim().toUpperCase();return V.filter(function(v){return(!ft||v.tipo===ft)&&(!t||v.placa.indexOf(t)>=0)}).sort(function(a,b){var x=a[sk],y=b[sk];return sd*x.localeCompare(y,'pt')||a.placa.localeCompare(b.placa)})}
    function toast(t){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t);scr.layer.appendChild(x);setTimeout(function(){x.remove()},2800)}
    function modal(t,b,f){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function sortHead(k,l){var on=sk===k;return '<button class="sortb'+(on?' on':'')+'" data-s="'+k+'" aria-label="Ordenar por '+l+'">'+l+svg(on?(sd===1?IC.up:IC.dn):IC.sort,14)+'</button>'}
    function counts(){var c={};V.forEach(function(v){c[v.tipo]=(c[v.tipo]||0)+1});return c}
    function renderList(){view='list';ENCO.bus.emit({vehCounts:counts()});$('foot').hidden=true;var all=rows(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var list=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.car,26)+'</div><div style="flex-grow:1"><h1>Veículos</h1><p>Cadastre os veículos usados nas entregas e coletas.</p></div><button class="btn btn-p" id="btnNew">'+svg(IC.plus,18)+'Cadastrar veículo</button></section>'+
     '<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" placeholder="Pesquisar por placa" aria-label="Pesquisar por placa" autocomplete="off" value="'+esc(q)+'"></label>'+
     '<select class="inp" id="ft" aria-label="Filtrar por tipo de veículo"><option value="">Todos os tipos</option>'+TYPES.map(function(t){return '<option'+(t===ft?' selected':'')+'>'+t+'</option>'}).join('')+'</select><span class="pill">'+plural(all.length,'veículo','veículos')+'</span></div>'+
     '<div class="vcols thead"><span>'+sortHead('tipo','Tipo de veículo')+'</span><span>'+sortHead('placa','Placa')+'</span><span></span></div>';
     if(!list.length)h+='<div class="empty"><b>Nenhum veículo encontrado</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa ou o filtro de tipo.</span></div>';
     list.forEach(function(v){h+='<div class="vcols vrow"><span class="tpill"><span class="ti">'+svg(IC.truck,16)+'</span>'+esc(v.tipo)+'</span><span><span class="plate">'+esc(v.placa)+'</span></span><span class="actions"><button class="ib" data-edit="'+v.id+'" aria-label="Editar veículo '+esc(v.placa)+'" title="Editar">'+svg(IC.pen,18)+'</button><button class="ib del" data-del="'+v.id+'" aria-label="Excluir veículo '+esc(v.placa)+'" title="Excluir">'+svg(IC.trash,18)+'</button></span></div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    function check(){var p=draft.placa,t=draft.tipo,dupe=!!p&&V.some(function(v){return v.id!==draft.id&&v.placa===p}),pv=/^[A-Z0-9]{7}$/.test(p);return{dupe:dupe,pv:pv,ok:!!t&&pv&&!dupe,dirty:snap(draft)!==orig}}
    function openForm(id){var v=id?V.filter(function(x){return x.id===id})[0]:null;draft=v?{id:v.id,tipo:v.tipo,placa:v.placa}:{id:0,tipo:'',placa:''};orig=v?snap(draft):snap({tipo:'',placa:''});touched={};view='form';$('foot').hidden=false;
     $('main').innerHTML='<section class="card page-head"><button class="ib" id="btnBack" aria-label="Voltar para a listagem" title="Voltar">'+svg(IC.back,22)+'</button><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.car,26)+'</div><div style="flex-grow:1"><h1>'+(v?'Editar veículo':'Novo veículo')+'</h1><p>Informe o tipo e a placa do veículo.</p></div></section>'+
     '<section class="card"><div class="fgrid"><div class="fld"><label class="lbl" for="fTipo">Tipo de veículo <span class="req">*</span></label><select class="inp" id="fTipo"><option value="">Selecione o tipo</option>'+TYPES.map(function(t){return '<option'+(t===draft.tipo?' selected':'')+'>'+t+'</option>'}).join('')+'</select><span class="ferr" id="eTipo"></span></div>'+
     '<div class="fld"><label class="lbl" for="fPlaca">Placa do veículo <span class="req">*</span></label><input class="inp mono" id="fPlaca" autocomplete="off" placeholder="ABC1D23" style="text-transform:uppercase;letter-spacing:.08em;font-weight:600" value="'+esc(draft.placa)+'"><span class="fhelp" id="hPlaca">7 caracteres, entre letras e números.</span><span class="ferr" id="ePlaca"></span></div></div></section>';
     $('main').scrollTop=0;$('btnBack').onclick=leave;
     $('fTipo').addEventListener('change',function(e){draft.tipo=e.target.value;touched.t=1;ui()});
     $('fPlaca').addEventListener('input',function(e){var c=e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7);e.target.value=c;draft.placa=c;ui()});
     $('fPlaca').addEventListener('blur',function(){touched.p=1;ui()});$('fTipo').addEventListener('blur',function(){touched.t=1;ui()});
     ui();$('fTipo').focus()}
    function ui(){var s=check();$('eTipo').textContent=touched.t&&!draft.tipo?'Selecione o tipo do veículo.':'';
     $('ePlaca').textContent=s.dupe?'Já existe um veículo com esta placa.':(touched.p&&!draft.placa?'Informe a placa do veículo.':(touched.p&&draft.placa&&!s.pv?'A placa precisa ter 7 caracteres.':''));
     var m=$('fMsg');m.className='msg'+(s.dirty?' dirty':'');m.innerHTML=s.dirty?svg(IC.warn,16)+'Alterações ainda não salvas':'Nenhuma alteração pendente';$('fSave').disabled=!(s.ok&&s.dirty)}
    function leave(){if(!check().dirty){renderList();return}
     var m=modal('Descartar alterações?','Você preencheu dados que ainda não foram salvos. Se sair agora, eles serão perdidos.','<button class="btn btn-s" data-x>Continuar editando</button><button class="btn btn-p" id="ok">Descartar e sair</button>');
     m.querySelector('#ok').onclick=function(){m.remove();renderList()}}
    $('fCancel').onclick=leave;
    $('fSave').onclick=function(){var s=check();if(!(s.ok&&s.dirty))return;var isNew=!draft.id,rec={id:isNew?nextId++:draft.id,tipo:draft.tipo,placa:draft.placa};
     if(isNew)V.push(rec);else V=V.map(function(v){return v.id===rec.id?rec:v});
     q='';ft='';var i=rows().map(function(v){return v.id}).indexOf(rec.id);pg=Math.floor(i/ps);renderList();toast('Veículo '+rec.placa+(isNew?' cadastrado':' atualizado'))};
    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(e.target.closest('#btnNew')){openForm(0);return}
     if(t=e.target.closest('[data-edit]')){openForm(+t.dataset.edit);return}
     if(t=e.target.closest('[data-del]')){var v=V.filter(function(x){return x.id===+t.dataset.del})[0];
      var m=modal('Excluir veículo?','Você vai excluir o veículo <b>'+esc(v.placa)+'</b> ('+esc(v.tipo)+'). Essa ação não pode ser desfeita.','<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-d" id="ok">Excluir veículo</button>');
      m.querySelector('#ok').onclick=function(){V=V.filter(function(x){return x.id!==v.id});m.remove();renderList();toast('Veículo '+v.placa+' excluído')};return}
     if(t=e.target.closest('[data-s]')){var k=t.dataset.s;if(sk===k)sd=-sd;else{sk=k;sd=1}renderList();return}
     if(e.target.closest('#pPrev')){pg--;renderList();return}if(e.target.closest('#pNext')){pg++;renderList()}});
    main.addEventListener('input',function(e){if(e.target.id==='q'&&view==='list'){q=e.target.value;pg=0;var c=e.target.selectionStart;renderList();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){if(view!=='list')return;if(e.target.id==='ps'){ps=+e.target.value;pg=0;renderList()}if(e.target.id==='ft'){ft=e.target.value;pg=0;renderList()}});
    ENCO.bus.on(function(e){var d=e.data;if(!d||!d.encoTypes)return;if(d.rename)V.forEach(function(v){if(v.tipo===d.rename.from)v.tipo=d.rename.to});TYPES=d.encoTypes.slice().sort(function(a,b){return a.localeCompare(b,'pt')});if(ft&&TYPES.indexOf(ft)<0)ft='';if(view==='list')renderList()});
    scr.onDoc('keydown',function(e){if(e.key==='Escape'){var m=scr.qs('.modal-bg');if(m)m.remove()}});

    renderList();
    })();
  }
});