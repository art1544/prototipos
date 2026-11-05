/* ==========================================================================
   ENCO Portal Web · Tela: Tipos de movimento  (rota #movimentos)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('movimentos', {
  title: 'Tipos de movimento',
  rootClass: '',
  template: `
    <div class="content">
<div class="ghead"><div class="gtop"><div class="icon-tile"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg></div><div><div class="gcrumb">Cadastros</div><h1>Parâmetros</h1><p>Códigos e motivos usados nos planos, no SAP e no app.</p></div></div><div class="gtabs" role="tablist" aria-label="Parâmetros"><button class="gtab on" role="tab" aria-selected="true" data-go="movimentos"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>Tipos de movimento</button><button class="gtab" role="tab" aria-selected="false" data-go="prioridades" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M12 19h.01"/></svg>Prioridades</button><button class="gtab" role="tab" aria-selected="false" data-go="nc" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>Não conformidades</button></div></div>
<main class="main" id="main"></main>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={mov:'<path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/>',lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
     pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
     plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',ok:'<path d="m5 12 5 5 9-10"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',up:'<path d="m18 15-6-6-6 6"/>',dn:'<path d="m6 9 6 6 6-6"/>',
     Entrega:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
     Coleta:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>'};
    var CAT=['Entrega','Coleta'];
    var T=[{id:1,cod:'201',desc:'Centro de Custo',cat:'Entrega'},{id:2,cod:'261',desc:'Ordem de Manutenção',cat:'Entrega'},{id:3,cod:'221',desc:'Projeto CAPEX',cat:'Entrega'},{id:4,cod:'262',desc:'Coleta Ordem - Devolução',cat:'Coleta'}];
    var nextId=5,q='',fc='',sk='cod',sd=1,ps=5,pg=0;
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function list(){var t=q.trim().toLowerCase();return T.filter(function(x){return(!fc||x.cat===fc)&&(!t||x.cod.indexOf(t)>=0||x.desc.toLowerCase().indexOf(t)>=0||x.cat.toLowerCase().indexOf(t)>=0)}).sort(function(a,b){return sd*String(a[sk]).localeCompare(String(b[sk]),'pt',{numeric:true})||a.cod.localeCompare(b.cod,'pt',{numeric:true})})}
    function sync(){ENCO.bus.emit({movList:T.slice().sort(function(a,b){return a.cod.localeCompare(b.cod,'pt',{numeric:true})}).map(function(x){return x.cod+' – '+x.desc+' ('+x.cat+')'})})}
    function catBadge(c){return '<span class="mcat '+(c==='Coleta'?'c':'e')+'">'+svg(IC[c],14)+esc(c)+'</span>'}
    function toast(t,label,fn){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t)+(label?'<button class="tbtn" type="button">'+esc(label)+'</button>':'');scr.layer.appendChild(x);if(label)x.querySelector('.tbtn').onclick=function(){fn();x.remove()};setTimeout(function(){x.remove()},label?6000:2800)}
    function modal(t,b,f,lock){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if((e.target===m&&!lock)||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function sortHead(k,l){var on=sk===k;return '<button class="sortb'+(on?' on':'')+'" data-s="'+k+'" aria-label="Ordenar por '+l+'">'+l+svg(on?(sd===1?IC.up:IC.dn):IC.sort,14)+'</button>'}
    function draw(){var all=list(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var rows=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.mov,26)+'</div><div style="flex-grow:1"><h1>Tipos de movimento</h1><p>Cadastre os tipos de movimento do SAP usados nas entregas e coletas.</p></div><button class="btn btn-p" id="btnNew">'+svg(IC.plus,18)+'Cadastrar tipo de movimento</button></section>'+
     '<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" placeholder="Pesquisar por código ou descrição" aria-label="Pesquisar tipo de movimento" autocomplete="off" value="'+esc(q)+'"></label>'+
     '<div class="segs" role="group" aria-label="Filtrar por categoria">'+[['','Todas'],['Entrega','Entrega'],['Coleta','Coleta']].map(function(c){var n=c[0]?T.filter(function(x){return x.cat===c[0]}).length:T.length;return '<button class="seg'+(fc===c[0]?' on':'')+'" data-f="'+c[0]+'" aria-pressed="'+(fc===c[0])+'">'+c[1]+' <span class="segn">'+n+'</span></button>'}).join('')+'</div>'+
     '<span class="pill">'+plural(all.length,'tipo','tipos')+'</span></div>'+
     '<div class="mvcols thead"><span>'+sortHead('cod','Código')+'</span><span>'+sortHead('desc','Descrição')+'</span><span>'+sortHead('cat','Categoria')+'</span><span></span></div>';
     if(!rows.length)h+='<div class="empty"><b>Nenhum tipo de movimento encontrado</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa ou o filtro de categoria.</span></div>';
     rows.forEach(function(x){h+='<div class="mvcols mvrow"><span><span class="mcode">'+esc(x.cod)+'</span></span><span class="prdesc" title="'+esc(x.desc)+'">'+esc(x.desc)+'</span><span>'+catBadge(x.cat)+'</span><span class="actions"><button class="ib" data-edit="'+x.id+'" aria-label="Editar tipo de movimento '+esc(x.cod)+'" title="Editar">'+svg(IC.pen,18)+'</button><button class="ib del" data-del="'+x.id+'" aria-label="Excluir tipo de movimento '+esc(x.cod)+'" title="Excluir">'+svg(IC.trash,18)+'</button></span></div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    function form(id){var cur=id?T.filter(function(x){return x.id===id})[0]:null,d=cur?{cod:cur.cod,desc:cur.desc,cat:cur.cat}:{cod:'',desc:'',cat:''},tc={};
     var m=modal(cur?'Editar tipo de movimento':'Novo tipo de movimento',
     '<div class="fld"><label class="lbl" for="fC">Código <span class="req">*</span></label><div class="lockw"><input class="inp" id="fC" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="Ex.: 201" style="font-variant-numeric:tabular-nums" value="'+esc(d.cod)+'"'+(cur?' disabled':'')+'>'+(cur?svg(IC.lock,16):'')+'</div><span class="fhelp">'+(cur?'O código não pode ser alterado depois de criado, porque já pode estar em uso nos planos.':'Código do tipo de movimento no SAP, com 3 dígitos.')+'</span><span class="ferr" id="eC"></span></div>'+
     '<div class="fld"><div class="lblrow"><label class="lbl" for="fD">Descrição <span class="req">*</span></label><span class="cnt2" id="nD"></span></div><input class="inp" id="fD" maxlength="100" autocomplete="off" placeholder="Ex.: Centro de Custo" value="'+esc(d.desc)+'"><span class="ferr" id="eD"></span></div>'+
     '<div class="fld"><span class="lbl" id="lK">Categoria <span class="req">*</span></span><div class="catpick" role="radiogroup" aria-labelledby="lK">'+CAT.map(function(c){return '<button type="button" class="catopt'+(d.cat===c?' on':'')+'" role="radio" aria-checked="'+(d.cat===c)+'" data-c="'+c+'"><span class="ci2 '+(c==='Coleta'?'c':'e')+'">'+svg(IC[c],18)+'</span><span><b>'+c+'</b><small>'+(c==='Entrega'?'Material levado até o ponto':'Material retirado no ponto')+'</small></span></button>'}).join('')+'</div><span class="ferr" id="eK"></span></div>',
     '<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-p" id="ok" disabled>'+(cur?'Salvar alterações':'Cadastrar tipo')+'</button>',true);
     var ok=m.querySelector('#ok');
     function chk(){var cod=d.cod.trim(),dup=!!cod&&T.some(function(x){return x.id!==(cur&&cur.id)&&x.cod===cod});
      var e={C:!cod?'Informe o código do tipo de movimento.':cod.length<3?'O código precisa ter 3 dígitos.':dup?'Já existe um tipo de movimento com este código.':'',D:!d.desc.trim()?'Informe a descrição.':'',K:!d.cat?'Selecione a categoria.':''};
      [['C','fC'],['D','fD'],['K',null]].forEach(function(p){var s=(tc[p[0]]||(p[0]==='C'&&dup))&&e[p[0]];m.querySelector('#e'+p[0]).textContent=s||'';if(p[1])m.querySelector('#'+p[1]).classList.toggle('err',!!s)});
      m.querySelector('#nD').textContent=d.desc.length+'/100';
      m.querySelectorAll('.catopt').forEach(function(b){var on=b.dataset.c===d.cat;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)});
      var valid=!e.C&&!e.D&&!e.K,changed=!cur||cur.desc!==d.desc.trim()||cur.cat!==d.cat;ok.disabled=!(valid&&changed);return e}
     function bind(id,k,key,fmt){var el=m.querySelector('#'+id);el.addEventListener('input',function(){if(fmt)el.value=fmt(el.value);d[k]=el.value;chk()});el.addEventListener('blur',function(){tc[key]=1;chk()})}
     bind('fC','cod','C',function(v){return v.replace(/\D/g,'')});bind('fD','desc','D');
     m.querySelector('.catpick').addEventListener('click',function(e){var b=e.target.closest('[data-c]');if(!b)return;d.cat=b.dataset.c;tc.K=1;chk()});
     function save(){tc={C:1,D:1,K:1};var e=chk();if(ok.disabled){var f=e.C?'#fC':e.D?'#fD':e.K?'.catopt':null;if(f)m.querySelector(f).focus();return}
      var r={cod:d.cod.trim(),desc:d.desc.trim(),cat:d.cat};
      if(cur){cur.desc=r.desc;cur.cat=r.cat;sync();m.remove();draw();toast('Tipo de movimento '+cur.cod+' atualizado')}
      else{r.id=nextId++;T.push(r);sync();q='';fc='';var i=list().map(function(x){return x.id}).indexOf(r.id);pg=Math.floor(i/ps);m.remove();draw();toast('Tipo de movimento '+r.cod+' cadastrado')}}
     ok.onclick=save;m.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();save()}});chk();m.querySelector(cur?'#fD':'#fC').focus()}
    function del(id){var x=T.filter(function(t){return t.id===id})[0];
     var d=modal('Excluir tipo de movimento?','Você vai excluir o tipo de movimento <b>'+esc(x.cod)+' – '+esc(x.desc)+'</b> ('+esc(x.cat)+'). Essa ação não pode ser desfeita.','<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-d" id="ok">Excluir tipo de movimento</button>');
     d.querySelector('#ok').onclick=function(){var i=T.indexOf(x);T.splice(i,1);sync();d.remove();draw();toast('Tipo de movimento '+x.cod+' excluído','Desfazer',function(){T.splice(i,0,x);sync();draw()})}}
    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(e.target.closest('#btnNew')){form(0);return}
     if(t=e.target.closest('[data-edit]')){form(+t.dataset.edit);return}
     if(t=e.target.closest('[data-del]')){del(+t.dataset.del);return}
     if(t=e.target.closest('[data-f]')){fc=t.dataset.f;pg=0;draw();return}
     if(t=e.target.closest('[data-s]')){var k=t.dataset.s;if(sk===k)sd=-sd;else{sk=k;sd=1}draw();return}
     if(e.target.closest('#pPrev')){pg--;draw();return}if(e.target.closest('#pNext')){pg++;draw()}});
    main.addEventListener('input',function(e){if(e.target.id==='q'){q=e.target.value;pg=0;var c=e.target.selectionStart;draw();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){if(e.target.id==='ps'){ps=+e.target.value;pg=0;draw()}});
    scr.onDoc('keydown',function(e){if(e.key==='Escape'){var m=scr.qs('.modal-bg');if(m)m.remove()}});

    draw();sync();
    })();
  }
});