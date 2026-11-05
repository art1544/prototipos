/* ==========================================================================
   ENCO Portal Web · Tela: Prioridades  (rota #prioridades)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('prioridades', {
  title: 'Prioridades',
  rootClass: '',
  template: `
    <div class="content">
<div class="ghead"><div class="gtop"><div class="icon-tile"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg></div><div><div class="gcrumb">Cadastros</div><h1>Parâmetros</h1><p>Códigos e motivos usados nos planos, no SAP e no app.</p></div></div><div class="gtabs" role="tablist" aria-label="Parâmetros"><button class="gtab" role="tab" aria-selected="false" data-go="movimentos" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>Tipos de movimento</button><button class="gtab on" role="tab" aria-selected="true" data-go="prioridades"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M12 19h.01"/></svg>Prioridades</button><button class="gtab" role="tab" aria-selected="false" data-go="nc" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>Não conformidades</button></div></div>
<main class="main" id="main"></main>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={prio:'<path d="M12 4v11"/><path d="M12 19h.01"/>',lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
     pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
     plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',ok:'<path d="m5 12 5 5 9-10"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',up:'<path d="m18 15-6-6-6 6"/>',dn:'<path d="m6 9 6 6 6-6"/>'};
    var P=[{id:1,cod:'0',desc:'Sem prioridade'},{id:2,cod:'1',desc:'WH: Entrega Urgente (no max. 2hs)'},{id:3,cod:'2',desc:'WH: Antecipação de Entrega'}];
    var nextId=4,q='',sk='cod',sd=1,ps=5,pg=0;
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function list(){var t=q.trim().toLowerCase();return P.filter(function(x){return !t||x.cod.indexOf(t)>=0||x.desc.toLowerCase().indexOf(t)>=0}).sort(function(a,b){return sd*String(a[sk]).localeCompare(String(b[sk]),'pt',{numeric:true})||a.cod.localeCompare(b.cod,'pt',{numeric:true})})}
    function sync(){ENCO.bus.emit({prioList:P.slice().sort(function(a,b){return a.cod.localeCompare(b.cod,'pt',{numeric:true})}).map(function(x){return x.cod+' – '+x.desc})})}
    function toast(t,label,fn){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t)+(label?'<button class="tbtn" type="button">'+esc(label)+'</button>':'');scr.layer.appendChild(x);if(label)x.querySelector('.tbtn').onclick=function(){fn();x.remove()};setTimeout(function(){x.remove()},label?6000:2800)}
    function modal(t,b,f,lock){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if((e.target===m&&!lock)||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function sortHead(k,l){var on=sk===k;return '<button class="sortb'+(on?' on':'')+'" data-s="'+k+'" aria-label="Ordenar por '+l+'">'+l+svg(on?(sd===1?IC.up:IC.dn):IC.sort,14)+'</button>'}
    function draw(){var all=list(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var rows=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.prio,26)+'</div><div style="flex-grow:1"><h1>Prioridades</h1><p>Cadastre os níveis de prioridade usados nos planos de entrega e coleta.</p></div><button class="btn btn-p" id="btnNew">'+svg(IC.plus,18)+'Cadastrar prioridade</button></section>'+
     '<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" placeholder="Pesquisar por identificação ou descrição" aria-label="Pesquisar prioridade" autocomplete="off" value="'+esc(q)+'"></label><span class="pill">'+plural(all.length,'prioridade','prioridades')+'</span></div>'+
     '<div class="prcols thead"><span>'+sortHead('cod','Identificação')+'</span><span>'+sortHead('desc','Descrição')+'</span><span></span></div>';
     if(!rows.length)h+='<div class="empty"><b>Nenhuma prioridade encontrada</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa ou cadastre uma nova prioridade.</span></div>';
     rows.forEach(function(x){h+='<div class="prcols prrow"><span><span class="prnum'+(x.cod==='0'?' zero':'')+'">'+esc(x.cod)+'</span></span><span class="prdesc" title="'+esc(x.desc)+'">'+esc(x.desc)+'</span><span class="actions"><button class="ib" data-edit="'+x.id+'" aria-label="Editar prioridade '+esc(x.cod)+'" title="Editar">'+svg(IC.pen,18)+'</button><button class="ib del" data-del="'+x.id+'" aria-label="Excluir prioridade '+esc(x.cod)+'" title="Excluir">'+svg(IC.trash,18)+'</button></span></div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    function form(id){var cur=id?P.filter(function(x){return x.id===id})[0]:null,d=cur?{cod:cur.cod,desc:cur.desc}:{cod:'',desc:''},tc={};
     var m=modal(cur?'Editar prioridade':'Nova prioridade',
     '<div class="fld"><label class="lbl" for="fC">Identificação <span class="req">*</span></label><div class="lockw"><input class="inp" id="fC" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="Ex.: 3" style="font-variant-numeric:tabular-nums;max-width:140px" value="'+esc(d.cod)+'"'+(cur?' disabled':'')+'>'+(cur?svg(IC.lock,16):'')+'</div><span class="fhelp">'+(cur?'A identificação não pode ser alterada depois de criada, porque já pode estar em uso nos planos.':'Número único, que vem no plano para indicar a prioridade.')+'</span><span class="ferr" id="eC"></span></div>'+
     '<div class="fld"><div class="lblrow"><label class="lbl" for="fD">Descrição <span class="req">*</span></label><span class="cnt2" id="nD"></span></div><input class="inp" id="fD" maxlength="100" autocomplete="off" placeholder="Ex.: WH: Entrega Urgente (no max. 2hs)" value="'+esc(d.desc)+'"><span class="fhelp">Texto que aparece para quem acompanha e executa o plano.</span><span class="ferr" id="eD"></span></div>',
     '<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-p" id="ok" disabled>'+(cur?'Salvar alterações':'Cadastrar prioridade')+'</button>',true);
     var ok=m.querySelector('#ok');
     function chk(){var cod=d.cod.trim().replace(/^0+(?=\d)/,''),dup=!!cod&&P.some(function(x){return x.id!==(cur&&cur.id)&&x.cod===cod}),
      ddup=!!d.desc.trim()&&P.some(function(x){return x.id!==(cur&&cur.id)&&x.desc.trim().toLowerCase()===d.desc.trim().toLowerCase()});
      var e={C:!cod?'Informe a identificação da prioridade.':dup?'Já existe uma prioridade com esta identificação.':'',D:!d.desc.trim()?'Informe a descrição da prioridade.':ddup?'Já existe uma prioridade com esta descrição.':''};
      [['C','fC'],['D','fD']].forEach(function(p){var s=(tc[p[0]]||(p[0]==='C'&&dup)||(p[0]==='D'&&ddup))&&e[p[0]];m.querySelector('#e'+p[0]).textContent=s||'';m.querySelector('#'+p[1]).classList.toggle('err',!!s)});
      m.querySelector('#nD').textContent=d.desc.length+'/100';
      var valid=!e.C&&!e.D,changed=!cur||cur.desc!==d.desc.trim();ok.disabled=!(valid&&changed);return e}
     function bind(id,k,key,fmt){var el=m.querySelector('#'+id);el.addEventListener('input',function(){if(fmt)el.value=fmt(el.value);d[k]=el.value;chk()});el.addEventListener('blur',function(){tc[key]=1;chk()})}
     bind('fC','cod','C',function(v){return v.replace(/\D/g,'')});bind('fD','desc','D');
     function save(){tc={C:1,D:1};var e=chk();if(ok.disabled){var f=e.C?'fC':e.D?'fD':null;if(f)m.querySelector('#'+f).focus();return}
      var r={cod:d.cod.trim().replace(/^0+(?=\d)/,''),desc:d.desc.trim()};
      if(cur){cur.desc=r.desc;sync();m.remove();draw();toast('Prioridade '+cur.cod+' atualizada')}
      else{r.id=nextId++;P.push(r);sync();q='';var i=list().map(function(x){return x.id}).indexOf(r.id);pg=Math.floor(i/ps);m.remove();draw();toast('Prioridade '+r.cod+' cadastrada')}}
     ok.onclick=save;m.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();save()}});chk();m.querySelector(cur?'#fD':'#fC').focus()}
    function del(id){var x=P.filter(function(t){return t.id===id})[0];
     var d=modal('Excluir prioridade?','Você vai excluir a prioridade <b>'+esc(x.cod)+' – '+esc(x.desc)+'</b>. Planos que usam esta prioridade deixam de exibir a descrição. Essa ação não pode ser desfeita.','<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-d" id="ok">Excluir prioridade</button>');
     d.querySelector('#ok').onclick=function(){var i=P.indexOf(x);P.splice(i,1);sync();d.remove();draw();toast('Prioridade '+x.cod+' excluída','Desfazer',function(){P.splice(i,0,x);sync();draw()})}}
    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(e.target.closest('#btnNew')){form(0);return}
     if(t=e.target.closest('[data-edit]')){form(+t.dataset.edit);return}
     if(t=e.target.closest('[data-del]')){del(+t.dataset.del);return}
     if(t=e.target.closest('[data-s]')){var k=t.dataset.s;if(sk===k)sd=-sd;else{sk=k;sd=1}draw();return}
     if(e.target.closest('#pPrev')){pg--;draw();return}if(e.target.closest('#pNext')){pg++;draw()}});
    main.addEventListener('input',function(e){if(e.target.id==='q'){q=e.target.value;pg=0;var c=e.target.selectionStart;draw();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){if(e.target.id==='ps'){ps=+e.target.value;pg=0;draw()}});
    scr.onDoc('keydown',function(e){if(e.key==='Escape'){var m=scr.qs('.modal-bg');if(m)m.remove()}});

    draw();sync();
    })();
  }
});