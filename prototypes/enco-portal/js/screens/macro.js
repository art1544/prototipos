/* ==========================================================================
   ENCO Portal Web · Tela: Macro pontos  (rota #macro)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver js/core/bus.js).
   ========================================================================== */
ENCO.screen('macro', {
  title: 'Macro pontos',
  rootClass: '',
  template: `
    <div class="content">
<div class="ghead"><div class="gtop"><div class="icon-tile"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><path d="M12 7v6M9 10h6"/></svg></div><div><div class="gcrumb">Cadastros</div><h1>Pontos de descarga</h1><p>Locais de entrega e coleta e as regiões (macro pontos) que os agrupam.</p></div></div><div class="gtabs" role="tablist" aria-label="Pontos de descarga"><button class="gtab" role="tab" aria-selected="false" data-go="pontos" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><path d="M12 7v6M9 10h6"/></svg>Pontos de descarga</button><button class="gtab on" role="tab" aria-selected="true" data-go="macro"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>Macro pontos</button></div></div>
<main class="main" id="main"></main>
<footer class="savebar-wrap" id="foot" hidden><div class="savebar"><div class="msg" id="fMsg"></div><div class="spacer"></div><button class="btn btn-s" id="fCancel">Cancelar</button><button class="btn btn-p" id="fSave" disabled>Salvar macro ponto</button></div></footer>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={pin:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
     pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
     plus:'<path d="M12 5v14M5 12h14"/>',back:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
     l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',ok:'<path d="m5 12 5 5 9-10"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',up:'<path d="m18 15-6-6-6 6"/>',dn:'<path d="m6 9 6 6 6-6"/>',warn:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'};
    var M=[['Oficina Central','Oficina Central'],['Ponto Geral','Todos Pontos'],['Seg. e Qualidade','Segurança e Qualidade'],['ADM1','ADM1'],['Energy Media 1','Energy Media 1'],['Primetals','Primetals'],['Alto Forno 3','Alto Forno'],['Alto Forno 2','Alto Forno'],['Alto Forno 1','Alto Forno'],['Aciaria','Aciaria'],['Coqueria','Coqueria'],['Laminação a Quente','Laminação a Quente'],['Laminação a Frio','Laminação a Frio'],['Portaria Principal','Portaria e Controle de Acesso']].map(function(r,i){return{id:i+1,nome:r[0],desc:r[1]}});
    var pc=null,nextId=15,view='list',q='',sk='nome',sd=1,ps=5,pg=0,draft=null,orig='',touched={};
    function sync(rename){ENCO.bus.emit({macroList:M.map(function(x){return x.nome}),rename:rename||null})}
    function go(v){ENCO.bus.emit({enco:v})}
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function snap(d){return JSON.stringify([d.nome.trim(),d.desc.trim()])}
    function rows(){var t=q.trim().toLowerCase();return M.filter(function(m){return !t||m.nome.toLowerCase().indexOf(t)>=0||m.desc.toLowerCase().indexOf(t)>=0}).sort(function(a,b){return sd*a[sk].localeCompare(b[sk],'pt',{numeric:true})||a.nome.localeCompare(b.nome,'pt',{numeric:true})})}
    function toast(t){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t);scr.layer.appendChild(x);setTimeout(function(){x.remove()},2800)}
    function modal(t,b,f){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function sortHead(k,l){var on=sk===k;return '<button class="sortb'+(on?' on':'')+'" data-s="'+k+'" aria-label="Ordenar por '+l+'">'+l+svg(on?(sd===1?IC.up:IC.dn):IC.sort,14)+'</button>'}
    function renderList(){view='list';$('foot').hidden=true;var all=rows(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var list=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.pin,26)+'</div><div style="flex-grow:1"><h1>Macro pontos</h1><p>Cadastre os macro pontos usados nas entregas e coletas.</p></div><button class="btn btn-p" id="btnNew">'+svg(IC.plus,18)+'Cadastrar macro ponto</button></section>'+
     '<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" placeholder="Pesquisar por nome ou descrição" aria-label="Pesquisar macro ponto" autocomplete="off" value="'+esc(q)+'"></label><span class="pill">'+plural(all.length,'macro ponto','macro pontos')+'</span></div>'+
     '<div class="mcols thead"><span>'+sortHead('nome','Nome')+'</span><span>'+sortHead('desc','Descrição')+'</span><span>Pontos de descarga</span><span></span></div>';
     if(!list.length)h+='<div class="empty"><b>Nenhum macro ponto encontrado</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa ou cadastre um novo macro ponto.</span></div>';
     list.forEach(function(m){h+='<div class="mcols mrow2"><span class="tpill"><span class="ti">'+svg(IC.pin,16)+'</span><b style="font-weight:600">'+esc(m.nome)+'</b></span><span style="color:#5E627C">'+esc(m.desc)+'</span><span style="font-size:13px;font-weight:600;color:#4A4E6A">'+(pc?plural(pc[m.nome]||0,'ponto','pontos'):'—')+'</span><span class="actions"><button class="ib" data-edit="'+m.id+'" aria-label="Editar '+esc(m.nome)+'" title="Editar">'+svg(IC.pen,18)+'</button><button class="ib del" data-del="'+m.id+'" aria-label="Excluir '+esc(m.nome)+'" title="Excluir">'+svg(IC.trash,18)+'</button></span></div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    function check(){var n=draft.nome.trim(),d=draft.desc.trim(),dupe=!!n&&M.some(function(m){return m.id!==draft.id&&m.nome.trim().toLowerCase()===n.toLowerCase()});return{n:n,d:d,dupe:dupe,ok:!!n&&!!d&&!dupe,dirty:snap(draft)!==orig}}
    function openForm(id){var m=id?M.filter(function(x){return x.id===id})[0]:null;draft=m?{id:m.id,nome:m.nome,desc:m.desc}:{id:0,nome:'',desc:''};orig=m?snap(draft):snap({nome:'',desc:''});touched={};view='form';$('foot').hidden=false;
     $('main').innerHTML='<section class="card page-head"><button class="ib" id="btnBack" aria-label="Voltar para a listagem" title="Voltar">'+svg(IC.back,22)+'</button><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.pin,26)+'</div><div style="flex-grow:1"><h1>'+(m?'Editar macro ponto':'Novo macro ponto')+'</h1><p>Informe o nome e a descrição do macro ponto.</p></div></section>'+
     '<section class="card"><div class="fgrid"><div class="fld full"><label class="lbl" for="fNome">Nome <span class="req">*</span></label><input class="inp" id="fNome" maxlength="20" autocomplete="off" placeholder="Ex.: Alto Forno 1" value="'+esc(draft.nome)+'"><span class="ferr" id="eNome"></span></div>'+
     '<div class="fld full"><label class="lbl" for="fDesc">Descrição <span class="req">*</span></label><textarea class="inp" id="fDesc" rows="3" maxlength="200" placeholder="Descreva o macro ponto">'+esc(draft.desc)+'</textarea><span class="ferr" id="eDesc"></span></div></div></section>';
     $('main').scrollTop=0;$('btnBack').onclick=leave;
     $('fNome').addEventListener('input',function(e){draft.nome=e.target.value;ui()});$('fNome').addEventListener('blur',function(){touched.n=1;ui()});
     $('fDesc').addEventListener('input',function(e){draft.desc=e.target.value;ui()});$('fDesc').addEventListener('blur',function(){touched.d=1;ui()});ui();$('fNome').focus()}
    function ui(){var s=check();$('eNome').textContent=s.dupe?'Já existe um macro ponto com este nome.':(touched.n&&!s.n?'Informe o nome do macro ponto.':'');$('eDesc').textContent=touched.d&&!s.d?'Informe a descrição do macro ponto.':'';
     var m=$('fMsg');m.className='msg'+(s.dirty?' dirty':'');m.innerHTML=s.dirty?svg(IC.warn,16)+'Alterações ainda não salvas':'Nenhuma alteração pendente';$('fSave').disabled=!(s.ok&&s.dirty)}
    function leave(){if(!check().dirty){renderList();return}
     var m=modal('Descartar alterações?','Você preencheu dados que ainda não foram salvos. Se sair agora, eles serão perdidos.','<button class="btn btn-s" data-x>Continuar editando</button><button class="btn btn-p" id="ok">Descartar e sair</button>');
     m.querySelector('#ok').onclick=function(){m.remove();renderList()}}
    $('fCancel').onclick=leave;
    $('fSave').onclick=function(){var s=check();if(!(s.ok&&s.dirty))return;var isNew=!draft.id,rec={id:isNew?nextId++:draft.id,nome:s.n,desc:s.d};
     var old=isNew?null:M.filter(function(m){return m.id===rec.id})[0].nome;if(isNew)M.push(rec);else M=M.map(function(m){return m.id===rec.id?rec:m});sync(old&&old!==rec.nome?{from:old,to:rec.nome}:null);
     q='';var i=rows().map(function(m){return m.id}).indexOf(rec.id);pg=Math.floor(i/ps);renderList();toast('Macro ponto "'+rec.nome+'" '+(isNew?'cadastrado':'atualizado'))};
    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(e.target.closest('#btnNew')){openForm(0);return}
     if(t=e.target.closest('[data-edit]')){openForm(+t.dataset.edit);return}
     if(t=e.target.closest('[data-del]')){var m=M.filter(function(x){return x.id===+t.dataset.del})[0];
      var n=pc?(pc[m.nome]||0):0;if(n>0){var bl=modal('Não é possível excluir','O macro ponto <b>'+esc(m.nome)+'</b> está em uso por <b>'+plural(n,'ponto de descarga','pontos de descarga')+'</b>. Altere o macro ponto desses pontos ou exclua-os antes de excluir este macro ponto.','<button class="btn btn-s" data-x>Entendi</button><button class="btn btn-p" id="g">Ir para Pontos de Descarga</button>');bl.querySelector('#g').onclick=function(){bl.remove();go('pontos')};return}
      var d=modal('Excluir macro ponto?','Você vai excluir o macro ponto <b>'+esc(m.nome)+'</b>. Essa ação não pode ser desfeita.','<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-d" id="ok">Excluir macro ponto</button>');
      d.querySelector('#ok').onclick=function(){M=M.filter(function(x){return x.id!==m.id});sync();d.remove();renderList();toast('Macro ponto "'+m.nome+'" excluído')};return}
     if(t=e.target.closest('[data-s]')){var k=t.dataset.s;if(sk===k)sd=-sd;else{sk=k;sd=1}renderList();return}
     if(e.target.closest('#pPrev')){pg--;renderList();return}if(e.target.closest('#pNext')){pg++;renderList()}});
    main.addEventListener('input',function(e){if(e.target.id==='q'&&view==='list'){q=e.target.value;pg=0;var c=e.target.selectionStart;renderList();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){if(view==='list'&&e.target.id==='ps'){ps=+e.target.value;pg=0;renderList()}});
    ENCO.bus.on(function(e){if(e.data&&e.data.encoPd){pc=e.data.encoPd;if(view==='list')renderList()}});
    scr.onDoc('keydown',function(e){if(e.key==='Escape'){var m=scr.qs('.modal-bg');if(m)m.remove()}});

    renderList();
    })();
  }
});