/* ==========================================================================
   ENCO Portal Web · Tela: Áreas Responsáveis  (rota #areas)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('areas', {
  title: 'Áreas Responsáveis',
  rootClass: '',
  template: `
    <div class="content">
<main class="main" id="main"></main>
<footer class="savebar-wrap" id="foot" hidden><div class="savebar"><div class="msg" id="fMsg"></div><div class="spacer"></div><button class="btn btn-s" id="fCancel">Cancelar</button><button class="btn btn-p" id="fSave" disabled>Salvar área</button></div></footer>
<datalist id="dl"></datalist>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    var IC={bld:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01"/>',
     users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
     pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
     trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
     plus:'<path d="M12 5v14M5 12h14"/>',back:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
     l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
     ok:'<path d="m5 12 5 5 9-10"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'};
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    /* Diretório de usuários: base única em data/db.json → usuarios (nome e 8ID do AD; telefone e e-mail editados em Usuários) */
    function apIni(n){var a=n.split(' ');return (a[0][0]+a[a.length-1][0]).toUpperCase()}
    var DIR=ENCO.usuarios,BY={};DIR.forEach(function(u){BY[u.id]=u});
    ENCO.bus.on(function(e){if(e.data&&e.data.usuarioAtualizado&&view==='list')renderList()});
    $('dl').innerHTML=DIR.map(function(u){return '<option value="'+u.id+'">'+esc(u.nome)+'</option>'}).join('');
    function pick(a,n){var r=[];for(var i=0;i<n;i++)r.push(DIR[(a+i)%90].id);return r.filter(function(x,i,s){return s.indexOf(x)===i})}
    var A=[{id:1,nome:'Almoxarifado',desc:'Recebimento, guarda e expedição de materiais de consumo',c:pick(0,20),e:pick(1,42)}];
    var nextId=2,view='list',q='',ps=5,pg=0,draft=null,orig='',touched={};
    function snap(d){return JSON.stringify([d.nome.trim(),d.desc.trim(),d.c,d.e])}
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function sorted(){var t=q.trim().toLowerCase();return A.filter(function(a){return !t||a.nome.toLowerCase().indexOf(t)>=0||a.desc.toLowerCase().indexOf(t)>=0}).sort(function(x,y){return x.nome.localeCompare(y.nome,'pt')})}
    /* utilitários */
    function modal(t,b,f,lock){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if((e.target===m&&!lock)||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function toast(t){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t);scr.layer.appendChild(x);setTimeout(function(){x.remove()},2800)}
    /* Gerenciar pessoas da área: ao clicar em "Gerenciar" de Controladores ou de Entregadores, a listagem
       abre logo abaixo da área, no padrão da tela Usuários (8ID · Nome · Telefone · E-mail), com
       pesquisa, inclusão (só quem tem o perfil correspondente em Usuários) e exclusão com "Desfazer".
       [REAL] AreaEntregadorControlador: perfil 4 = controlador, 3 = entregador. */
    var aberto=null,addBusca='';
    var PAPEL={c:{lista:'Controladores',um:'controlador',perfil:'Controladores'},e:{lista:'Entregadores',um:'entregador',perfil:'Entregadores'}};
    function toastAcao(t,label,fn){scr.qsa('.toast').forEach(function(o){o.remove()});var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t)+(label?'<button class="tbtn" type="button">'+esc(label)+'</button>':'');scr.layer.appendChild(x);if(label)x.querySelector('.tbtn').onclick=function(){fn();x.remove()};setTimeout(function(){x.remove()},4000)}
    function sugestoes(a,k){var t=addBusca.trim().toLowerCase();if(!t)return [];var arr=a[k];
     return DIR.filter(function(u){return u.p.indexOf(PAPEL[k].perfil)>=0&&arr.indexOf(u.id)<0&&(u.id.toLowerCase().indexOf(t)>=0||u.nome.toLowerCase().indexOf(t)>=0)}).slice(0,6)}
    function sugHtml(a,k){var r=sugestoes(a,k);if(!addBusca.trim())return '';
     return r.length?r.map(function(u){return '<button type="button" class="apopt" data-addu="'+esc(u.id)+'"><span class="apav">'+esc(apIni(u.nome))+'</span><span><b>'+esc(u.nome)+'</b><small>8ID '+esc(u.id)+'</small></span><span class="apopt-add">'+svg(IC.plus,16)+'Adicionar</span></button>'}).join('')
      :'<p class="ap0">Ninguém encontrado com o perfil '+PAPEL[k].perfil+' que ainda não esteja na lista.</p>'}
    function gerenciar(a,k){var P=PAPEL[k],ps=a[k].map(function(id){return BY[id]||{id:id,nome:id,cel:'',email:''}}).sort(function(x,y){return x.nome.localeCompare(y.nome,'pt')});
     return '<div class="apeople" id="apPanel"><div class="ap-h"><h3>'+P.lista+' de '+esc(a.nome)+' <span class="pill" data-cnt>'+ps.length+'</span></h3><button class="ib" type="button" data-fechar aria-label="Fechar lista de '+P.lista.toLowerCase()+'" title="Fechar">'+svg(IC.x,18)+'</button></div>'+
      '<div class="ap-tools"><label class="search apf">'+svg(IC.search,16)+'<input class="inp" type="search" data-af placeholder="Nome, 8ID, telefone ou e-mail" aria-label="Pesquisar '+P.lista.toLowerCase()+'"></label>'+
      '<div class="ap-add"><label class="lbl" for="apAdd">Adicionar '+P.um+'</label><label class="search">'+svg(IC.plus,16)+'<input class="inp" id="apAdd" type="search" autocomplete="off" placeholder="Pesquise por nome ou 8ID" value="'+esc(addBusca)+'"></label><div class="apsug" id="apSug">'+sugHtml(a,k)+'</div><span class="fhelp">Só aparecem usuários com o perfil '+P.perfil+'.</span></div></div>'+
      (ps.length?'<div class="aptab"><div class="aprow aprow-x aph" aria-hidden="true"><span>8ID</span><span>Nome</span><span>Telefone</span><span>E-mail</span><span></span></div><ul class="apl">'+ps.map(function(u){return '<li class="aprow aprow-x" data-q="'+esc((u.nome+' '+u.id+' '+(u.cel||'')+' '+(u.email||'')).toLowerCase())+'"><span class="api">'+esc(u.id)+'</span><span class="apn"><span class="apav">'+esc(apIni(u.nome))+'</span><b>'+esc(u.nome)+'</b></span><span class="api">'+(u.cel?esc(u.cel):'<span class="apsem">Sem telefone</span>')+'</span><span class="api apm">'+(u.email?esc(u.email):'<span class="apsem">Sem e-mail</span>')+'</span><span class="actions"><button class="ib aprm" type="button" data-rm="'+esc(u.id)+'" aria-label="Excluir '+esc(u.nome)+' dos '+P.lista.toLowerCase()+'" title="Excluir da área">'+svg(IC.trash,18)+'</button></span></li>'}).join('')+'</ul></div><p class="ap0" hidden>Ninguém encontrado</p>':'<p class="ap0">Nenhum '+P.um+' vinculado a esta área. Use o campo acima para adicionar.</p>')+'</div>'}
    function ligarPainel(){var pn=$('apPanel');if(!pn)return;var a=A.filter(function(x){return x.id===aberto.id})[0];
     var f=pn.querySelector('[data-af]');f.addEventListener('input',function(){var t=f.value.trim().toLowerCase(),n=0;
      pn.querySelectorAll('.apl li').forEach(function(li){var ok=!t||li.dataset.q.indexOf(t)>=0;li.hidden=!ok;if(ok)n++});
      pn.querySelector('[data-cnt]').textContent=n;var z=pn.querySelector('.ap0');if(z&&pn.querySelector('li'))z.hidden=n>0;var tb=pn.querySelector('.aptab');if(tb)tb.hidden=!n});
     var ad=$('apAdd');ad.addEventListener('input',function(){addBusca=ad.value;$('apSug').innerHTML=sugHtml(a,aberto.k)});
     ad.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();var b=pn.querySelector('[data-addu]');if(b)b.click()}})}
    function incluir(a,k,id){var u=BY[id];a[k].push(id);addBusca='';renderList();var ad=$('apAdd');if(ad)ad.focus();
     toastAcao(u.nome+' adicionado(a) como '+PAPEL[k].um,'Desfazer',function(){var i=a[k].indexOf(id);if(i>=0)a[k].splice(i,1);renderList()})}
    function excluir(a,k,id){var u=BY[id]||{nome:id},i=a[k].indexOf(id);if(i<0)return;a[k].splice(i,1);renderList();
     toastAcao(u.nome+' excluído(a) dos '+PAPEL[k].lista.toLowerCase(),'Desfazer',function(){a[k].splice(i,0,id);renderList()})}
    /* lista */
    function renderList(){view='list';var names=A.map(function(x){return x.nome}).sort(function(x,y){return x.localeCompare(y,'pt')});ENCO.bus.emit({areasList:names});ENCO.bus.emit({encoAreas:names});$('foot').hidden=true;var all=sorted(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var rows=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.bld,26)+'</div><div style="flex-grow:1"><h1>Áreas Responsáveis</h1><p>Defina os controladores e os entregadores de cada área.</p></div><button class="btn btn-p" id="btnNew">'+svg(IC.plus,18)+'Cadastrar nova área</button></section>'+
     '<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" type="search" placeholder="Pesquisar por nome ou descrição" aria-label="Pesquisar área" value="'+esc(q)+'"></label><span class="pill">'+plural(all.length,'área','áreas')+'</span></div>'+
     '<div class="acols thead"><span>Nome</span><span>Descrição</span><span>Controladores</span><span>Entregadores</span><span></span></div>';
     if(!rows.length)h+='<div class="empty"><b>Nenhuma área encontrada</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa ou cadastre uma nova área.</span></div>';
     rows.forEach(function(a){h+='<div class="acols arow"><span><b>'+esc(a.nome)+'</b></span><span class="muted">'+esc(a.desc)+'</span>'+
      '<span><button class="chipbtn'+(aberto&&aberto.id===a.id&&aberto.k==='c'?' on':'')+'" aria-expanded="'+!!(aberto&&aberto.id===a.id&&aberto.k==='c')+'" data-m="c" data-id="'+a.id+'" aria-label="Gerenciar controladores de '+esc(a.nome)+'">'+svg(IC.users,16)+'Gerenciar ('+a.c.length+')</button></span>'+
      '<span><button class="chipbtn'+(aberto&&aberto.id===a.id&&aberto.k==='e'?' on':'')+'" aria-expanded="'+!!(aberto&&aberto.id===a.id&&aberto.k==='e')+'" data-m="e" data-id="'+a.id+'" aria-label="Gerenciar entregadores de '+esc(a.nome)+'">'+svg(IC.users,16)+'Gerenciar ('+a.e.length+')</button></span>'+
      '<span class="actions"><button class="ib" data-edit="'+a.id+'" aria-label="Editar '+esc(a.nome)+'" title="Editar nome e descrição">'+svg(IC.pen,18)+'</button></span></div>'+
       (aberto&&aberto.id===a.id?gerenciar(a,aberto.k):'')});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     $('main').innerHTML=h;$('main').scrollTop=0;
      ligarPainel();
     $('btnNew').onclick=function(){openForm(null)};
     $('q').addEventListener('input',function(e){q=e.target.value;pg=0;var c=e.target.selectionStart;renderList();var n=$('q');n.focus();n.setSelectionRange(c,c)});
     $('ps').onchange=function(e){ps=+e.target.value;pg=0;renderList()};
     $('pPrev').onclick=function(){pg--;renderList()};$('pNext').onclick=function(){pg++;renderList()}}
    /* formulário */
    function openForm(id){var a=id?A.filter(function(x){return x.id===id})[0]:null;draft=a?{id:a.id,nome:a.nome,desc:a.desc,c:a.c.slice(),e:a.e.slice()}:{id:0,nome:'',desc:'',c:[],e:[]};
     orig=a?snap(draft):snap({nome:'',desc:'',c:[],e:[]});touched={};view='form';$('foot').hidden=false;
     $('main').innerHTML='<section class="card page-head"><button class="ib" id="btnBack" aria-label="Voltar para a listagem" title="Voltar">'+svg(IC.back,22)+'</button><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.bld,26)+'</div><div style="flex-grow:1"><h1>'+(a?'Editar área responsável':'Nova área responsável')+'</h1><p>Informe o nome e a descrição da área.</p></div></section>'+
     '<section class="card"><div class="fgrid"><div class="fld"><label class="lbl" for="fNome">Nome <span class="req">*</span></label><input class="inp" id="fNome" maxlength="20" autocomplete="off" placeholder="Ex.: Almoxarifado" value="'+esc(draft.nome)+'"><span class="ferr" id="eNome"></span></div>'+
     '<div class="fld"><label class="lbl" for="fDesc">Descrição <span class="req">*</span></label><textarea class="inp" id="fDesc" rows="2" maxlength="100" placeholder="Para que serve esta área?">'+esc(draft.desc)+'</textarea><span class="ferr" id="eDesc"></span></div></div></section>'+
     '<p class="fnote">'+svg('<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',16)+'<span>Aqui você altera só o nome e a descrição. Controladores e entregadores são definidos pelo botão <b>Gerenciar</b> na listagem de áreas.</span></p>';
     $('main').scrollTop=0;
     $('btnBack').onclick=leave;
     $('fNome').addEventListener('input',function(e){draft.nome=e.target.value;ui()});$('fNome').addEventListener('blur',function(){touched.n=1;ui()});
     $('fDesc').addEventListener('input',function(e){draft.desc=e.target.value;ui()});$('fDesc').addEventListener('blur',function(){touched.d=1;ui()});
     ui();$('fNome').focus()}
    function check(){var n=draft.nome.trim(),d=draft.desc.trim(),dupe=!!n&&A.some(function(a){return a.id!==draft.id&&a.nome.trim().toLowerCase()===n.toLowerCase()});
     return{n:n,d:d,dupe:dupe,ok:!!n&&!!d&&!dupe,dirty:snap(draft)!==orig}}
    function ui(){var s=check();$('eNome').textContent=s.dupe?'Já existe uma área com este nome.':(touched.n&&!s.n?'Informe o nome da área.':'');$('eDesc').textContent=touched.d&&!s.d?'Informe a descrição da área.':'';
     var m=$('fMsg');m.className='msg'+(s.dirty?' dirty':'');m.innerHTML=s.dirty?svg('<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',16)+'Alterações ainda não salvas':'Nenhuma alteração pendente';
     $('fSave').disabled=!(s.ok&&s.dirty)}
    function leave(){if(!check().dirty){renderList();return}
     var m=modal('Descartar alterações?','Você preencheu dados que ainda não foram salvos. Se sair agora, eles serão perdidos.','<button class="btn btn-s" data-x>Continuar editando</button><button class="btn btn-p" id="ok">Descartar e sair</button>');
     m.querySelector('#ok').onclick=function(){m.remove();renderList()}}
    $('fCancel').onclick=leave;
    $('fSave').onclick=function(){var s=check();if(!(s.ok&&s.dirty))return;var isNew=!draft.id,rec={id:isNew?nextId++:draft.id,nome:s.n,desc:s.d,c:draft.c.slice(),e:draft.e.slice()};
     if(isNew)A.push(rec);else A=A.map(function(a){return a.id===rec.id?rec:a});
     q='';var i=sorted().map(function(a){return a.id}).indexOf(rec.id);pg=Math.floor(i/ps);renderList();toast(isNew?'Área "'+rec.nome+'" cadastrada. Use Gerenciar para adicionar controladores e entregadores.':'Área "'+rec.nome+'" atualizada')};
    $('main').addEventListener('click',function(e){var b=e.target.closest('[data-m]');if(b&&view==='list'){var id=+b.dataset.id,k=b.dataset.m;aberto=aberto&&aberto.id===id&&aberto.k===k?null:{id:id,k:k};addBusca='';renderList();var pn=$('apPanel');if(pn){pn.scrollIntoView({block:'nearest',behavior:'smooth'});$('apAdd').focus()}return}
     if(e.target.closest('[data-fechar]')){aberto=null;renderList();return}
     if(aberto&&view==='list'){var ar=A.filter(function(x){return x.id===aberto.id})[0],u=e.target.closest('[data-addu]'),r=e.target.closest('[data-rm]');if(u){incluir(ar,aberto.k,u.dataset.addu);return}if(r){excluir(ar,aberto.k,r.dataset.rm);return}}
     var ed=e.target.closest('[data-edit]');if(ed)openForm(+ed.dataset.edit)});

    renderList();
    })();
  }
});
