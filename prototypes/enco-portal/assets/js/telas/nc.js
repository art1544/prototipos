/* ==========================================================================
   ENCO Portal Web · Tela: Não conformidades  (rota #nc)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('nc', {
  title: 'Não conformidades',
  rootClass: '',
  template: `
    <div class="content">
<div class="ghead"><div class="gtop"><div class="icon-tile"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><path d="M1 14h6"/><path d="M9 8h6"/><path d="M17 16h6"/></svg></div><div><div class="gcrumb">Cadastros</div><h1>Parâmetros</h1><p>Códigos e motivos usados nos planos, no SAP e no app.</p></div></div><div class="gtabs" role="tablist" aria-label="Parâmetros"><button class="gtab" role="tab" aria-selected="false" data-go="movimentos" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></svg>Tipos de movimento</button><button class="gtab" role="tab" aria-selected="false" data-go="prioridades" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11"/><path d="M12 19h.01"/></svg>Prioridades</button><button class="gtab on" role="tab" aria-selected="true" data-go="nc"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>Não conformidades</button></div></div>
<main class="main" id="main"></main>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={warn:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',truck:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
     car:'<path d="M5 17H3v-5l2-5h14l2 5v5h-2"/><circle cx="7.5" cy="17" r="1.8"/><circle cx="16.5" cy="17" r="1.8"/><path d="M3 12h18"/>',
     pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
     plus:'<path d="M12 5v14M5 12h14"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',ok:'<path d="m5 12 5 5 9-10"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',up:'<path d="m18 15-6-6-6 6"/>',dn:'<path d="m6 9 6 6 6-6"/>'};
    var TY=["Coleta com divergência", "Entrega com divergência", "Não coleta", "Não entrega"];
    var N=[{id:1,tipo:TY[0],cod:"QTDDVG-C-DVG",desc:"Quantidades divergentes",ed:true},{id:2,tipo:TY[0],cod:"CRC-C-DVG",desc:"Características diferentes",ed:false},{id:3,tipo:TY[1],cod:"QTDDVG-E-DVG",desc:"Quantidade divergente",ed:false},{id:4,tipo:TY[1],cod:"CRC-E-DVG",desc:"Características diferentes",ed:false},{id:5,tipo:TY[2],cod:"QTDDVG-C",desc:"Quantidade divergente",ed:false},{id:6,tipo:TY[2],cod:"AUS-C",desc:"Responsável ausente no local",ed:false},{id:7,tipo:TY[2],cod:"ACS-C",desc:"Sem acesso ao ponto de coleta",ed:false},{id:8,tipo:TY[2],cod:"MAT-C",desc:"Material não disponibilizado",ed:false},{id:9,tipo:TY[3],cod:"AUS-E",desc:"Responsável ausente no local",ed:false},{id:10,tipo:TY[3],cod:"ACS-E",desc:"Sem acesso ao ponto de entrega",ed:false},{id:11,tipo:TY[3],cod:"REC-E",desc:"Recebimento recusado",ed:false},{id:12,tipo:TY[0],cod:"AVA-C-DVG",desc:"Material com avaria na coleta",ed:false},{id:13,tipo:TY[1],cod:"AVA-E-DVG",desc:"Material com avaria na entrega",ed:false},{id:14,tipo:TY[0],cod:"DOC-C-DVG",desc:"Documentação divergente na coleta",ed:false},{id:15,tipo:TY[1],cod:"DOC-E-DVG",desc:"Documentação divergente na entrega",ed:false},{id:16,tipo:TY[3],cod:"END-E",desc:"Endereço incorreto",ed:false},{id:17,tipo:TY[2],cod:"END-C",desc:"Endereço incorreto",ed:false}];
    /* [S13 aprovado][REAL] Não conformidades gravadas pelo próprio sistema (ENCO.dominio.ncSistema): aparecem com o selo
       "Sistema" e não podem ser editadas nem excluídas. "Edição" = CampoEditavel (o app pede texto livre). */
    var SIS=[[TY[3],'PLANO CANCELADO WEB','Plano cancelado pelo portal web',false],[TY[3],'ITEM CANCELADO WEB','Item cancelado pelo portal web',false],[TY[3],'RETORNO JUSTIFICADO','Item retornado com justificativa do entregador',true],[TY[3],'RECEPTOR AUSENTE','Receptor ausente após as tentativas permitidas',false]];
    SIS.forEach(function(x,i){N.push({id:18+i,tipo:x[0],cod:x[1],desc:x[2],ed:x[3],sistema:true})});
    function sistema(id){var x=N.filter(function(n){return n.id===id})[0];return !!(x&&x.sistema)}
    var nextId=22,q='',ft='',sk='tipo',sd=1,ps=5,pg=0;
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function cls(t){return t.indexOf('Coleta')===0?'c':t.indexOf('Entrega')===0?'e':'n'}
    function list(){var t=q.trim().toLowerCase();return N.filter(function(x){return(!ft||x.tipo===ft)&&(!t||x.tipo.toLowerCase().indexOf(t)>=0||x.cod.toLowerCase().indexOf(t)>=0||x.desc.toLowerCase().indexOf(t)>=0)}).sort(function(a,b){return sd*String(a[sk]).localeCompare(String(b[sk]),'pt')||a.cod.localeCompare(b.cod)})}
    function toast(t,label,fn){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t)+(label?'<button class="tbtn" type="button">'+esc(label)+'</button>':'');scr.layer.appendChild(x);if(label)x.querySelector('.tbtn').onclick=function(){fn();x.remove()};setTimeout(function(){x.remove()},label?6000:2800)}
    function modal(t,b,f,lock){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if((e.target===m&&!lock)||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function sortHead(k,l){var on=sk===k;return '<button class="sortb'+(on?' on':'')+'" data-s="'+k+'" aria-label="Ordenar por '+l+'">'+l+svg(on?(sd===1?IC.up:IC.dn):IC.sort,14)+'</button>'}
    function draw(){var all=list(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var rows=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.warn,26)+'</div><div style="flex-grow:1"><h1>Não conformidades</h1><p>Cadastre os motivos de divergência registrados nas coletas e entregas.</p></div><button class="btn btn-p" id="btnNew">'+svg(IC.plus,18)+'Cadastrar não conformidade</button></section>'+
     '<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" placeholder="Pesquisar por tipo, identificação ou descrição" aria-label="Pesquisar não conformidade" autocomplete="off" value="'+esc(q)+'"></label><select class="inp" id="ft" aria-label="Filtrar por tipo" style="width:240px"><option value="">Todos os tipos</option>'+TY.map(function(t){return '<option'+(t===ft?' selected':'')+'>'+esc(t)+'</option>'}).join('')+'</select><span class="pill">'+plural(all.length,'registro','registros')+'</span></div>'+
     '<div class="ncols thead"><span>'+sortHead('tipo','Tipo')+'</span><span>'+sortHead('cod','Identificação')+'</span><span>'+sortHead('desc','Descrição')+'</span><span>Edição</span><span></span></div>';
     if(!rows.length)h+='<div class="empty"><b>Nenhuma não conformidade encontrada</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa ou o filtro de tipo.</span></div>';
     rows.forEach(function(x){h+='<div class="ncols nrow"><span><span class="ntype '+cls(x.tipo)+'">'+esc(x.tipo)+'</span></span><span class="ncode">'+esc(x.cod)+(x.sistema?' <span class="sysb" title="Gravada pelo sistema">Sistema</span>':'')+'</span><span class="ndesc" title="'+esc(x.desc)+'">'+esc(x.desc)+'</span><label class="tg'+(x.sistema?' tg-off':'')+'"><input type="checkbox" data-ed="'+x.id+'"'+(x.ed?' checked':'')+(x.sistema?' disabled':'')+' aria-label="Edição habilitada para '+esc(x.cod)+'"><i></i><span>'+(x.ed?'Habilitada':'Desabilitada')+'</span></label><span class="actions">'+(x.sistema?'<span class="syslock" title="Não conformidade do sistema: não pode ser editada nem excluída" role="img" aria-label="Não conformidade do sistema: não pode ser editada nem excluída"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg></span>':'<button class="ib" data-edit="'+x.id+'" aria-label="Editar '+esc(x.cod)+'" title="Editar">'+svg(IC.pen,18)+'</button><button class="ib del" data-del="'+x.id+'" aria-label="Excluir '+esc(x.cod)+'" title="Excluir">'+svg(IC.trash,18)+'</button>')+'</span></div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    function form(id){var cur=id?N.filter(function(x){return x.id===id})[0]:null,d=cur?{tipo:cur.tipo,cod:cur.cod,desc:cur.desc,ed:cur.ed}:{tipo:'',cod:'',desc:'',ed:false},tc={};
     var m=modal(cur?'Editar não conformidade':'Nova não conformidade',
     '<div class="fld"><label class="lbl" for="fT">Tipo de não conformidade <span class="req">*</span></label><select class="inp" id="fT"><option value="">Selecione o tipo</option>'+TY.map(function(t){return '<option'+(t===d.tipo?' selected':'')+'>'+esc(t)+'</option>'}).join('')+'</select><span class="ferr" id="eT"></span></div>'+
     '<div class="fld"><label class="lbl" for="fC">Identificação <span class="req">*</span></label><input class="inp" id="fC" maxlength="50" autocomplete="off" placeholder="Ex.: QTDDVG-C-DVG" style="text-transform:uppercase" value="'+esc(d.cod)+'"><span class="fhelp">Código único, só letras, números e hífen.</span><span class="ferr" id="eC"></span></div>'+
     '<div class="fld"><label class="lbl" for="fD">Descrição <span class="req">*</span></label><input class="inp" id="fD" maxlength="100" autocomplete="off" placeholder="Ex.: Quantidades divergentes" value="'+esc(d.desc)+'"><span class="ferr" id="eD"></span></div>'+
     '<label class="swbox"><span class="tg"><input type="checkbox" id="fE"'+(d.ed?' checked':'')+'><i></i></span><span><b style="font-size:14px;color:#1B1A4A">Habilitar edição</b><small>Quando ligada, o registro dessa não conformidade pode ser editado.</small></span></label>',
     '<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-p" id="ok" disabled>'+(cur?'Salvar alterações':'Cadastrar')+'</button>',true);
     var ok=m.querySelector('#ok');
     function chk(){var cod=d.cod.trim().toUpperCase(),dup=!!cod&&N.some(function(x){return x.id!==(cur&&cur.id)&&x.cod.toUpperCase()===cod});
      var e={T:!d.tipo?'Selecione o tipo de não conformidade.':'',C:!cod?'Informe a identificação.':dup?'Já existe uma não conformidade com esta identificação.':'',D:!d.desc.trim()?'Informe a descrição.':''};
      [['T','fT'],['C','fC'],['D','fD']].forEach(function(p){var s=(tc[p[0]]||(p[0]==='C'&&dup))&&e[p[0]];m.querySelector('#e'+p[0]).textContent=s||'';m.querySelector('#'+p[1]).classList.toggle('err',!!s)});
      var valid=!e.T&&!e.C&&!e.D,changed=!cur||cur.tipo!==d.tipo||cur.cod!==cod||cur.desc!==d.desc.trim()||cur.ed!==d.ed;ok.disabled=!(valid&&changed);return e}
     function bind(id,k,key,fmt){var el=m.querySelector('#'+id);el.addEventListener('input',function(){if(fmt)el.value=fmt(el.value);d[k]=el.value;chk()});el.addEventListener('change',function(){d[k]=el.value;tc[key]=1;chk()});el.addEventListener('blur',function(){tc[key]=1;chk()})}
     bind('fT','tipo','T');bind('fC','cod','C',function(v){return v.toUpperCase().replace(/[^A-Z0-9-]/g,'')});bind('fD','desc','D');
     m.querySelector('#fE').addEventListener('change',function(e){d.ed=e.target.checked;chk()});
     function save(){tc={T:1,C:1,D:1};var e=chk();if(ok.disabled){var f=e.T?'fT':e.C?'fC':e.D?'fD':null;if(f)m.querySelector('#'+f).focus();return}
      var r={tipo:d.tipo,cod:d.cod.trim().toUpperCase(),desc:d.desc.trim(),ed:d.ed};
      if(cur){Object.assign(cur,r);m.remove();draw();toast('Não conformidade "'+r.cod+'" atualizada')}
      else{r.id=nextId++;N.push(r);q='';ft='';var i=list().map(function(x){return x.id}).indexOf(r.id);pg=Math.floor(i/ps);m.remove();draw();toast('Não conformidade "'+r.cod+'" cadastrada')}}
     ok.onclick=save;m.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT'&&e.target.type!=='checkbox'){e.preventDefault();save()}});m.querySelector('#fT').focus()}
    function del(id){var x=N.filter(function(t){return t.id===id})[0];
     var d=modal('Excluir não conformidade?','Você vai excluir <b>'+esc(x.cod)+'</b> ('+esc(x.desc)+'). Essa ação não pode ser desfeita.','<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-d" id="ok">Excluir</button>');
     d.querySelector('#ok').onclick=function(){var i=N.indexOf(x);N.splice(i,1);d.remove();draw();toast('"'+x.cod+'" excluída','Desfazer',function(){N.splice(i,0,x);draw()})}}
    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(e.target.closest('#btnNew')){form(0);return}
     if(t=e.target.closest('[data-edit]')){if(!sistema(+t.dataset.edit))form(+t.dataset.edit);return}
     if(t=e.target.closest('[data-del]')){if(!sistema(+t.dataset.del))del(+t.dataset.del);return}
     if(t=e.target.closest('[data-s]')){var k=t.dataset.s;if(sk===k)sd=-sd;else{sk=k;sd=1}draw();return}
     if(e.target.closest('#pPrev')){pg--;draw();return}if(e.target.closest('#pNext')){pg++;draw()}});
    main.addEventListener('input',function(e){if(e.target.id==='q'){q=e.target.value;pg=0;var c=e.target.selectionStart;draw();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){if(e.target.id==='ps'){ps=+e.target.value;pg=0;draw()}if(e.target.id==='ft'){ft=e.target.value;pg=0;draw()}
     if(e.target.dataset&&e.target.dataset.ed){var x=N.filter(function(n){return n.id===+e.target.dataset.ed})[0];x.ed=e.target.checked;draw();toast('Edição '+(x.ed?'habilitada':'desabilitada')+' para "'+x.cod+'"','Desfazer',function(){x.ed=!x.ed;draw()})}});
    scr.onDoc('keydown',function(e){if(e.key==='Escape'){var m=scr.qs('.modal-bg');if(m)m.remove()}});

    draw();
    })();
  }
});