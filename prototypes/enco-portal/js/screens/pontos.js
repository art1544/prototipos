/* ==========================================================================
   ENCO Portal Web · Tela: Pontos de descarga  (rota #pontos)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver js/core/bus.js).
   ========================================================================== */
ENCO.screen('pontos', {
  title: 'Pontos de descarga',
  rootClass: '',
  template: `
    <div class="content">
<div class="ghead"><div class="gtop"><div class="icon-tile"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><path d="M12 7v6M9 10h6"/></svg></div><div><div class="gcrumb">Cadastros</div><h1>Pontos de descarga</h1><p>Locais de entrega e coleta e as regiões (macro pontos) que os agrupam.</p></div></div><div class="gtabs" role="tablist" aria-label="Pontos de descarga"><button class="gtab on" role="tab" aria-selected="true" data-go="pontos"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><path d="M12 7v6M9 10h6"/></svg>Pontos de descarga</button><button class="gtab" role="tab" aria-selected="false" data-go="macro" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>Macro pontos</button></div></div>
<main class="main" id="main"></main>
<footer class="savebar-wrap" id="foot" hidden><div class="savebar"><div class="msg" id="fMsg"></div><div class="spacer"></div><button class="btn btn-s" id="fCancel">Cancelar</button><button class="btn btn-p" id="fSave" disabled>Salvar ponto</button></div></footer>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={pinp:'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><path d="M12 7v6M9 10h6"/>',
     pen:'<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
     plus:'<path d="M12 5v14M5 12h14"/>',back:'<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
     l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',dn:'<path d="m6 9 6 6 6-6"/>',up:'<path d="m18 15-6-6-6 6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',ok:'<path d="m5 12 5 5 9-10"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',warn:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
     mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',sms:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',ext:'<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',upl:'<path d="M12 16V4"/><path d="m7 9 5-5 5 5"/><path d="M4 20h16"/>',alert:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',img:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/>',users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>'};
    var MACROS=['Aciaria','ADM1','Alto Forno 1','Alto Forno 2','Alto Forno 3','Coqueria','Energy Media 1','Laminação a Frio','Laminação a Quente','Oficina Central','Ponto Geral','Portaria Principal','Primetals','Seg. e Qualidade'];
    /* Contatos de exemplo: usuários da base única (js/data/usuarios.js). Sem e-mail ou sem telefone, o aviso fica desligado. */
    function ctc(i){var u=ENCO.usuarios[i%ENCO.usuarios.length];return{id8:u.id,nome:u.nome,email:u.email,eA:!!u.email&&i%3!==0,cel:u.cel,sA:!!u.cel&&i%2===0}}
    function cs(a,n){var r=[];for(var i=0;i<n;i++)r.push(ctc(a+i*2));return r}
    var P=[{id:1,ident:'Aciaria B03 Lab C',macro:'Ponto Geral',desc:'Não existe elevador disponível para acesso a este andar no prédio. O elevador mais próximo fica em área externa.',end:'Aciaria, prédio B03, laboratório C',extra:'00:10:00',lat:'-22.908351',lon:'-43.737901',foto:ENCO.img.ponto1,fotoMeta:'foto-ponto-1.jpg · ilustrativa',c:cs(1,6)},
     {id:2,ident:'Alto Forno 2 - Casa de Corrida',macro:'Alto Forno 2',desc:'Acesso pela lateral leste, com apoio da segurança.',end:'Alto Forno 2, casa de corrida',extra:'00:15:00',lat:'-22.906120',lon:'-43.735480',foto:ENCO.img.ponto2,fotoMeta:'foto-ponto-2.jpg · ilustrativa',c:cs(3,4)},
     {id:3,ident:'Oficina Central - Recebimento',macro:'Oficina Central',desc:'Recebimento de peças e ferramentas da oficina.',end:'Oficina Central, portão 2',extra:'00:05:00',lat:'-22.910004',lon:'-43.739221',foto:ENCO.img.ponto3,fotoMeta:'foto-ponto-3.jpg · ilustrativa',c:cs(5,3)},
     {id:4,ident:'Portaria Principal - Guarita 1',macro:'Portaria Principal',desc:'Conferência de documentos de entrada de veículos.',end:'Portaria principal, guarita 1',extra:'00:00:00',lat:'-22.912340',lon:'-43.741010',foto:ENCO.img.ponto4,fotoMeta:'foto-ponto-4.jpg · ilustrativa',c:cs(7,2)},
     {id:5,ident:'Laminação a Quente - Forno 1',macro:'Laminação a Quente',desc:'Entrega de materiais para manutenção programada.',end:'Laminação a quente, forno 1',extra:'00:20:00',lat:'-22.905870',lon:'-43.733300',foto:ENCO.img.ponto5,fotoMeta:'foto-ponto-5.jpg · ilustrativa',c:cs(9,5)},
     {id:6,ident:'Coqueria - Esteira 4',macro:'Coqueria',desc:'Ponto de descarga junto à esteira 4.',end:'Coqueria, esteira 4',extra:'00:10:00',lat:'-22.903900',lon:'-43.730500',foto:null,c:cs(11,3)}];
    var nextId=7,view='list',q='',fm='',sk='ident',sd=1,ps=5,pg=0,open={},all4={},draft=null,orig='',touched={},submitted=false;
    function fmtPhone(r){var v=String(r).replace(/\D/g,'').slice(0,11),n=v.length>10?7:6,o='';if(v.length)o='('+v.slice(0,2);if(v.length>2)o+=') '+v.slice(2,n);if(v.length>n)o+='-'+v.slice(n);return o}
    function fmtTime(raw){var v=raw.replace(/\D/g,'').slice(0,6),o=v.slice(0,2);if(v.length>2)o+=':'+v.slice(2,4);if(v.length>4)o+=':'+v.slice(4,6);return o}
    function vTime(t){var m=/^(\d{2}):(\d{2}):(\d{2})$/.exec(t);return !!m&&+m[2]<60&&+m[3]<60}
    function vNum(v,max){var s=String(v).trim();return /^-?\d+([.,]\d+)?$/.test(s)&&Math.abs(parseFloat(s.replace(',','.')))<=max}
    function vMail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)}
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function ini(n){var a=n.trim().split(/\s+/);return ((a[0]||'?')[0]+(a.length>1?a[a.length-1][0]:'')).toUpperCase()}
    function counts(){var c={};P.forEach(function(p){c[p.macro]=(c[p.macro]||0)+1});return c}
    function toast(t,label,fn){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t)+(label?'<button class="tbtn" type="button">'+esc(label)+'</button>':'');scr.layer.appendChild(x);if(label)x.querySelector('.tbtn').onclick=function(){fn();x.remove()};setTimeout(function(){x.remove()},label?6000:2800)}
    function modal(t,b,f){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function rows(){var t=q.trim().toLowerCase();return P.filter(function(p){return(!fm||p.macro===fm)&&(!t||p.ident.toLowerCase().indexOf(t)>=0||p.macro.toLowerCase().indexOf(t)>=0||p.desc.toLowerCase().indexOf(t)>=0||p.end.toLowerCase().indexOf(t)>=0)}).sort(function(a,b){return sd*String(a[sk]).localeCompare(String(b[sk]),'pt',{numeric:true})})}
    function sortHead(k,l){var on=sk===k;return '<button class="sortb'+(on?' on':'')+'" data-s="'+k+'" aria-label="Ordenar por '+l+'">'+l+svg(on?(sd===1?IC.up:IC.dn):IC.sort,14)+'</button>'}
    function mapUrl(p){return 'https://www.google.com/maps?q='+encodeURIComponent(String(p.lat).replace(',','.')+','+String(p.lon).replace(',','.'))}
    function thumb(p,big){return p.foto?'<span class="thumb'+(big?' big':'')+'"><img src="'+p.foto+'" alt="Foto do ponto '+esc(p.ident)+'" loading="lazy"></span>':'<span class="thumb none'+(big?' big':'')+'" title="Sem foto cadastrada">'+svg(IC.img,big?30:22)+(big?'<small>Sem foto</small>':'')+'</span>'}
    function chan(on,ic,label){return '<span class="ch'+(on?' on':'')+'" title="'+label+(on?' ativo':' inativo')+'" role="img" aria-label="'+label+(on?' ativo':' inativo')+'">'+svg(ic,15)+'</span>'}
    /* Contatos em tabela, no mesmo padrão da tela Usuários: 8ID · Nome · Telefone · E-mail · Avisos */
    function tagRec(c){return c.rid?'<span class="trec" title="Contato do ponto, sem acesso ao ENCO">Recebedor</span>':''}
    function cel(v,t){return v?esc(v):'<span class="csem">'+t+'</span>'}
    function chead(acoes){return '<div class="ctrow cthead'+(acoes?' ctedit':'')+'"><span>8ID</span><span>Nome</span><span>Telefone</span><span>E-mail</span><span>Avisos</span>'+(acoes?'<span></span>':'')+'</div>'}
    function crow(c){return '<div class="ctrow"><span class="mono">'+(c.id8?esc(c.id8):'—')+'</span><span class="cname"><span class="av2">'+esc(ini(c.nome))+'</span><span class="cnm"><b>'+esc(c.nome)+'</b>'+tagRec(c)+'<small class="csub">'+(c.id8?'8ID '+esc(c.id8):'Sem 8ID')+' · '+(c.email?esc(c.email):'sem e-mail')+'</small></span></span><span class="mono">'+cel(c.cel,'Sem telefone')+'</span><span class="cmail">'+cel(c.email,'Sem e-mail')+'</span><span class="chs">'+chan(c.eA,IC.mail,'E-mail')+chan(c.sA,IC.sms,'SMS')+'</span></div>'}
    function renderList(){view='list';$('foot').hidden=true;ENCO.bus.emit({pdCounts:counts()});
     var all=rows(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var list=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.pinp,26)+'</div><div style="flex-grow:1"><h1>Pontos de descarga</h1><p>Cadastre os pontos de entrega e coleta, com localização e contatos.</p></div><button class="btn btn-p" id="btnNew">'+svg(IC.plus,18)+'Cadastrar ponto</button></section>'+
     '<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" placeholder="Pesquisar por identificação, endereço ou descrição" aria-label="Pesquisar ponto de descarga" autocomplete="off" value="'+esc(q)+'"></label><select class="inp" id="fm" aria-label="Filtrar por macro ponto" style="width:220px"><option value="">Todos os macro pontos</option>'+MACROS.map(function(m){return '<option'+(m===fm?' selected':'')+'>'+esc(m)+'</option>'}).join('')+'</select><span class="pill">'+plural(all.length,'ponto','pontos')+'</span></div>'+
     '<div class="pcols thead"><span>'+sortHead('ident','Identificação')+'</span><span>'+sortHead('macro','Macro ponto')+'</span><span>Tempo de espera extra</span><span>Contatos</span><span></span></div>';
     if(!list.length)h+='<div class="empty"><b>Nenhum ponto encontrado</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa ou o filtro de macro ponto.</span></div>';
     list.forEach(function(p){var o=!!open[p.id],n=p.c.length,sh=p.c;
      h+='<div class="pdwrap"><div class="pcols pdrow" tabindex="0" role="button" aria-expanded="'+o+'" data-tg="'+p.id+'" aria-label="Detalhes de '+esc(p.ident)+'"><span class="pdid">'+thumb(p)+'<span class="pdtx"><b>'+esc(p.ident)+'</b><small>'+esc(p.end)+'</small></span></span><span><span class="tag2">'+esc(p.macro)+'</span></span><span class="tm">'+svg(IC.clock,16)+'+'+p.extra+'</span>'+
      '<span>'+(n?'<span class="stack"><span class="avs">'+p.c.slice(0,3).map(function(c){return '<span>'+esc(ini(c.nome))+'</span>'}).join('')+'</span><b>'+n+'</b></span>':'<span class="warnpill">'+svg(IC.alert,13)+'Sem contatos</span>')+'</span>'+
      '<span class="actions"><button class="ib" data-edit="'+p.id+'" aria-label="Editar '+esc(p.ident)+'" title="Editar">'+svg(IC.pen,18)+'</button><button class="ib del" data-del="'+p.id+'" aria-label="Excluir '+esc(p.ident)+'" title="Excluir">'+svg(IC.trash,18)+'</button><span class="ib ex" aria-hidden="true">'+svg(IC.dn,18)+'</span></span></div>'+
      /* Detalhe do ponto: dados do ponto em cima (foto à esquerda, informações à direita) e contatos
         listados embaixo. A edição fica só no lápis da linha. */
      (o?'<div class="pdet pdet-v"><div class="pinfo"><h4>Detalhes</h4><div class="pinfo-g"><div class="kv"><span>Foto do local</span><span>'+(p.foto?'<button class="thumb-btn" data-zoom="'+p.id+'" aria-label="Ampliar foto de '+esc(p.ident)+'">'+thumb(p,1)+'<em>'+svg(IC.ext,14)+'Ampliar</em></button>':thumb(p,1)+'<button class="btn btn-s" data-edit="'+p.id+'" style="margin-top:8px">'+svg(IC.upl,16)+'Adicionar foto</button>')+'</span></div><div class="pinfo-d"><div class="kv"><span>Descrição</span><span>'+esc(p.desc)+'</span></div><div class="kv"><span>Endereço</span><span>'+esc(p.end)+'</span></div><div class="kv"><span>Localização</span><span>Lat '+esc(p.lat)+' · Lon '+esc(p.lon)+'</span></div><div class="pdet-actions"><a class="btn btn-s" target="_blank" rel="noopener" href="'+mapUrl(p)+'">'+svg(IC.ext,16)+'Abrir no mapa</a></div></div></div></div>'+
      '<div><h4>Contatos ('+n+')</h4>'+(n?'<div class="ctab">'+chead()+sh.map(crow).join('')+'</div>':'<div class="cempty" style="margin:0"><b>Nenhum contato cadastrado</b><span>Sem contatos, ninguém será avisado sobre as entregas neste ponto.</span></div>')+'</div></div>':'')+'</div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    /* ===== formulário ===== */
    function snap(d){return JSON.stringify([d.ident.trim(),d.macro,d.desc.trim(),d.end.trim(),d.extra,d.lat,d.lon,d.foto?1:0,d.c])}
    function errs(){var i=draft.ident.trim(),dupe=!!i&&P.some(function(p){return p.id!==draft.id&&p.ident.trim().toLowerCase()===i.toLowerCase()});
     return{fIdent:!i?'Informe a identificação do ponto.':dupe?'Já existe um ponto com esta identificação.':'',fMacro:!draft.macro?'Selecione o macro ponto.':'',fDesc:!draft.desc.trim()?'Informe a descrição do ponto.':'',fEnd:!draft.end.trim()?'Informe o endereço do ponto.':'',
      fExtra:draft.extra&&!vTime(draft.extra)?'Use o formato hh:mm:ss, com minutos e segundos até 59.':'',fLat:!String(draft.lat).trim()?'Informe a latitude.':!vNum(draft.lat,90)?'Latitude inválida: use um valor entre -90 e 90.':'',fLon:!String(draft.lon).trim()?'Informe a longitude.':!vNum(draft.lon,180)?'Longitude inválida: use um valor entre -180 e 180.':''}}
    var ORDER=['fIdent','fMacro','fDesc','fEnd','fExtra','fLat','fLon'];
    function fld(id,label,req,inner,help,counter){return '<div class="fld"><div class="lblrow"><label class="lbl" for="'+id+'">'+label+(req?' <span class="req" aria-hidden="true">*</span>':'')+'</label>'+(counter?'<span class="cnt2" id="n-'+id+'"></span>':'')+'</div>'+inner+(help?'<span class="fhelp">'+help+'</span>':'')+'<span class="ferr" id="e-'+id+'" role="alert"></span></div>'}
    function openForm(id){var p=id?P.filter(function(x){return x.id===id})[0]:null;draft=p?JSON.parse(JSON.stringify(p)):{id:0,ident:'',macro:'',desc:'',end:'',extra:'00:00:00',lat:'',lon:'',foto:null,fotoMeta:'',c:[]};orig=snap(draft);touched={};submitted=false;view='form';$('foot').hidden=false;
     var nameLabel=p?'Editar ponto de descarga':'Novo ponto de descarga';
     $('main').innerHTML='<section class="card page-head"><button class="ib" id="btnBack" aria-label="Voltar para a listagem" title="Voltar">'+svg(IC.back,22)+'</button><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.pinp,26)+'</div><div style="flex-grow:1"><h1>'+nameLabel+'</h1><p>Campos com <span class="req">*</span> são obrigatórios.</p></div></section>'+
     '<div class="pdlayout"><div class="pdmain">'+
     '<section class="card fsec" id="sec-dados"><div class="sec-h"><h2>Dados do ponto</h2><p>Como o ponto é identificado e como o entregador chega até ele.</p></div><div class="fg">'+
      fld('fIdent','Identificação',1,'<div class="lockw"><input class="inp" id="fIdent" maxlength="50" autocomplete="off" placeholder="Ex.: Aciaria B03 Lab C" value="'+esc(draft.ident)+'"'+(p?' disabled':'')+'>'+(p?svg(IC.lock,16):'')+'</div>',p?'A identificação não pode ser alterada depois de criada.':'Nome único, que o entregador reconhece no local.')+
      fld('fMacro','Macro ponto',1,'<select class="inp" id="fMacro"><option value="">Selecione o macro ponto</option>'+MACROS.map(function(m){return '<option'+(m===draft.macro?' selected':'')+'>'+esc(m)+'</option>'}).join('')+'</select>','Região ou área maior à qual o ponto pertence.')+
      '<div class="full">'+fld('fDesc','Descrição',1,'<textarea class="inp" id="fDesc" rows="2" maxlength="100" placeholder="Ex.: Acesso pela lateral, sem elevador disponível">'+esc(draft.desc)+'</textarea>','Informações úteis para chegar ao ponto e entregar.',1)+'</div>'+
      '<div class="full">'+fld('fEnd','Endereço',1,'<textarea class="inp" id="fEnd" rows="2" maxlength="50" placeholder="Prédio, andar, sala ou referência">'+esc(draft.end)+'</textarea>',null,1)+'</div>'+
      '<div class="full">'+fld('fExtra','Tempo extra de espera',0,'<input class="inp" id="fExtra" inputmode="numeric" maxlength="8" placeholder="00:00:00" style="max-width:180px;font-variant-numeric:tabular-nums" value="'+esc(draft.extra)+'">','Tempo adicional previsto neste ponto, em horas:minutos:segundos.')+'<div class="chips" id="xChips" style="margin-top:10px">'+[['00:00:00','Sem tempo extra'],['00:05:00','+5 min'],['00:10:00','+10 min'],['00:15:00','+15 min'],['00:30:00','+30 min']].map(function(c){return '<button type="button" class="chipb" data-x="'+c[0]+'">'+c[1]+'</button>'}).join('')+'</div></div></div></section>'+
     '<section class="card fsec" id="sec-loc"><div class="sec-h"><h2>Localização</h2><p>Coordenadas do ponto para o entregador navegar até o local.</p></div><div class="fg">'+
      fld('fLat','Latitude',1,'<input class="inp" id="fLat" inputmode="decimal" autocomplete="off" placeholder="-22.908351" style="font-variant-numeric:tabular-nums" value="'+esc(draft.lat)+'">','Dica: cole "latitude, longitude" copiado do Google Maps aqui.')+
      fld('fLon','Longitude',1,'<input class="inp" id="fLon" inputmode="decimal" autocomplete="off" placeholder="-43.737901" style="font-variant-numeric:tabular-nums" value="'+esc(draft.lon)+'">')+
      '<div class="full" id="mapl"></div></div></section>'+
     '<section class="card fsec" id="sec-foto"><div class="sec-h"><h2>Foto do local <span class="pill" style="margin-left:6px;vertical-align:middle">Opcional</span></h2><p>Ajuda o entregador a reconhecer o ponto.</p></div><div class="photo"><div class="pbox" id="pbox" tabindex="0" role="button" aria-label="Escolher foto do ponto"></div><div style="display:flex;flex-direction:column;gap:10px;justify-content:center"><div style="display:flex;gap:10px;flex-wrap:wrap"><label class="btn btn-s" for="fFoto" style="cursor:pointer">'+svg(IC.upl,18)+'<span id="fotoLbl"></span></label><button class="btn btn-g" id="fotoRm" type="button">'+svg(IC.trash,16)+'Remover</button></div><input type="file" id="fFoto" accept="image/*" hidden><span class="fhelp" id="fotoInfo"></span><span class="ferr" id="e-foto" role="alert"></span></div></div></section>'+
     '<section class="card fsec" id="sec-contatos"><div class="ctop"><div><h2>Contatos</h2><p style="margin:4px 0 0;font-size:13px;color:#5E627C">Quem é avisado sobre as entregas neste ponto.</p></div><span class="pill" id="cCnt"></span><div class="spacer"></div><button class="btn btn-s" id="cAdd" type="button">'+svg(IC.plus,18)+'Adicionar contato</button></div><div id="cList"></div></section>'+
     '</div><aside class="pdaside"><section class="card"><div class="chk-h">Resumo do cadastro</div><div class="prog"><i id="progBar"></i></div><div class="prog-l" id="progLbl"></div><ul class="cl" id="chkList"></ul></section></aside></div>';
     $('main').scrollTop=0;$('btnBack').onclick=leave;
     function bind(id,key,fmt){var el=$(id);el.addEventListener('input',function(e){if(fmt)e.target.value=fmt(e.target.value);draft[key]=e.target.value;ui()});el.addEventListener('blur',function(){touched[id]=1;ui()});el.addEventListener('change',function(e){draft[key]=e.target.value;touched[id]=1;ui()})}
     bind('fIdent','ident');bind('fMacro','macro');bind('fDesc','desc');bind('fEnd','end');bind('fExtra','extra',fmtTime);bind('fLat','lat');bind('fLon','lon');
     $('fLat').addEventListener('input',function(e){var m=/^\s*(-?\d+[.,]\d+)\s*(?:;|,\s|\s)\s*(-?\d+[.,]\d+)\s*$/.exec(e.target.value);if(m){draft.lat=m[1].replace(',','.');draft.lon=m[2].replace(',','.');e.target.value=draft.lat;$('fLon').value=draft.lon;touched.fLat=touched.fLon=1;ui()}});
     $('xChips').addEventListener('click',function(e){var b=e.target.closest('[data-x]');if(!b)return;draft.extra=b.dataset.x;$('fExtra').value=draft.extra;touched.fExtra=1;ui()});
     function setFoto(f){if(!f)return;if(!/^image\//.test(f.type)){$('e-foto').textContent='Escolha um arquivo de imagem (JPG, PNG ou similar).';return}if(f.size>5*1024*1024){$('e-foto').textContent='A imagem passa de 5 MB. Escolha um arquivo menor.';return}
      var r=new FileReader();r.onload=function(){draft.foto=r.result;draft.fotoMeta=f.name+' · '+(f.size/1024<1024?Math.round(f.size/1024)+' KB':(f.size/1048576).toFixed(1)+' MB');$('e-foto').textContent='';ui()};r.readAsDataURL(f)}
     $('fFoto').addEventListener('change',function(e){setFoto(e.target.files[0]);e.target.value=''});
     var pb=$('pbox');pb.addEventListener('click',function(){if(!draft.foto)$('fFoto').click()});pb.addEventListener('keydown',function(e){if((e.key==='Enter'||e.key===' ')&&!draft.foto){e.preventDefault();$('fFoto').click()}});
     ['dragenter','dragover'].forEach(function(t){pb.addEventListener(t,function(e){e.preventDefault();pb.classList.add('drag')})});['dragleave','drop'].forEach(function(t){pb.addEventListener(t,function(e){e.preventDefault();pb.classList.remove('drag')})});pb.addEventListener('drop',function(e){setFoto(e.dataTransfer.files[0])});
     $('fotoRm').onclick=function(){draft.foto=null;draft.fotoMeta='';ui()};
     $('cAdd').onclick=function(){contactDrawer(-1)};
     $('cList').addEventListener('click',function(e){var b;
      if(b=e.target.closest('[data-ce]')){contactDrawer(+b.dataset.ce);return}
      if(b=e.target.closest('[data-ct]')){var c=draft.c[+b.dataset.ct],k=b.dataset.k;c[k]=!c[k];ui();return}
      if(b=e.target.closest('[data-cd]')){var i=+b.dataset.cd,rm=draft.c.splice(i,1)[0];ui();toast('Contato "'+rm.nome+'" removido','Desfazer',function(){draft.c.splice(i,0,rm);ui()})}});
     $('chkList').addEventListener('click',function(e){var b=e.target.closest('[data-go]');if(!b)return;var t=$(b.dataset.go);if(t){t.scrollIntoView({block:'center',behavior:'smooth'});if(t.focus)t.focus({preventScroll:true})}});
     ui();$(p?'fMacro':'fIdent').focus()}
    function ui(){var E=errs(),dirty=snap(draft)!==orig;
     ORDER.forEach(function(id){var show=(touched[id]||submitted||(id==='fIdent'&&E[id]&&/Já existe/.test(E[id])))&&E[id];var el=$(id),er=$('e-'+id);if(!el)return;er.innerHTML=show?svg(IC.warn,13)+esc(E[id]):'';el.classList.toggle('err',!!show);el.setAttribute('aria-invalid',show?'true':'false')});
     [['fDesc',300],['fEnd',200]].forEach(function(x){var c=$('n-'+x[0]);if(c)c.textContent=draft[x[0]==='fDesc'?'desc':'end'].length+'/'+x[1]});
     var coordOk=!E.fLat&&!E.fLon;$('mapl').innerHTML=coordOk?'<a class="btn btn-s" target="_blank" rel="noopener" href="'+mapUrl(draft)+'">'+svg(IC.ext,16)+'Abrir posição no mapa</a>':'';
     scr.qsa('#xChips .chipb').forEach(function(b){b.setAttribute('aria-pressed',String(b.dataset.x===draft.extra))});
     var pb=$('pbox');pb.classList.toggle('has',!!draft.foto);pb.innerHTML=draft.foto?'<img alt="Foto do ponto de descarga" src="'+draft.foto+'">':svg(IC.img,30)+'<span>Arraste uma imagem aqui<br>ou clique para escolher</span>';
     $('fotoLbl').textContent=draft.foto?'Trocar foto':'Escolher foto';$('fotoRm').style.display=draft.foto?'':'none';$('fotoInfo').textContent=draft.foto?(draft.fotoMeta||'Foto adicionada'):'JPG ou PNG, até 5 MB.';
     $('cCnt').textContent=plural(draft.c.length,'contato','contatos');
     $('cList').innerHTML=draft.c.length?'<div class="ctab cbox">'+chead(1)+draft.c.map(function(c,i){return '<div class="ctrow ctedit"><span class="mono">'+(c.id8?esc(c.id8):'—')+'</span><span class="cname"><span class="av2">'+esc(ini(c.nome))+'</span><span class="cnm"><b>'+esc(c.nome)+'</b>'+tagRec(c)+'<small class="csub">'+(c.id8?'8ID '+esc(c.id8):'Sem 8ID')+' · '+(c.email?esc(c.email):'sem e-mail')+'</small></span></span><span class="mono">'+cel(c.cel,'Sem telefone')+'</span><span class="cmail">'+cel(c.email,'Sem e-mail')+'</span><span class="chs"><button class="ch'+(c.eA?' on':'')+'" type="button" data-ct="'+i+'" data-k="eA" aria-pressed="'+c.eA+'" title="Aviso por e-mail: '+(c.eA?'ativo':'inativo')+' (clique para alternar)" aria-label="Aviso por e-mail de '+esc(c.nome)+'">'+svg(IC.mail,15)+'</button><button class="ch'+(c.sA?' on':'')+'" type="button" data-ct="'+i+'" data-k="sA" aria-pressed="'+c.sA+'" title="Aviso por SMS: '+(c.sA?'ativo':'inativo')+' (clique para alternar)" aria-label="Aviso por SMS de '+esc(c.nome)+'">'+svg(IC.sms,15)+'</button></span><span class="actions"><button class="ib ed" data-ce="'+i+'" aria-label="Editar contato '+esc(c.nome)+'" title="Editar">'+svg(IC.pen,18)+'</button><button class="ib" data-cd="'+i+'" aria-label="Remover contato '+esc(c.nome)+'" title="Remover">'+svg(IC.trash,18)+'</button></span></div>'}).join('')+'</div>':'<div class="cempty">'+svg(IC.users,28)+'<b>Nenhum contato adicionado</b><span>Adicione quem deve ser avisado sobre as entregas neste ponto.</span><button class="btn btn-s" type="button" id="cAdd2" style="margin-top:6px">'+svg(IC.plus,18)+'Adicionar contato</button></div>';
     var c2=$('cAdd2');if(c2)c2.onclick=function(){contactDrawer(-1)};
     var items=[['fIdent','Identificação',!E.fIdent,1],['fMacro','Macro ponto',!E.fMacro,1],['fDesc','Descrição',!E.fDesc,1],['fEnd','Endereço',!E.fEnd,1],['fLat','Coordenadas',coordOk,1],['fFoto','Foto do local',!!draft.foto,0],['cAdd','Contatos',draft.c.length>0,0]];
     var req=items.filter(function(i){return i[3]}),done=req.filter(function(i){return i[2]}).length;
     $('progBar').style.width=(done/req.length*100)+'%';$('progLbl').textContent=done+' de '+req.length+' campos obrigatórios preenchidos';
     $('chkList').innerHTML=items.map(function(i){var bad=submitted&&i[3]&&!i[2];return '<li><button type="button" class="'+(i[2]?'done':bad?'bad':'')+'"><span class="st">'+(i[2]?svg(IC.ok,12):bad?'!':'')+'</span>'+i[1]+(i[3]?'':'<span class="opt">Opcional</span>')+'</button></li>'}).join('');
     var nErr=ORDER.filter(function(k){return E[k]}).length,m=$('fMsg');
     if(submitted&&nErr){m.className='msg dirty';m.innerHTML=svg(IC.warn,16)+'Corrija '+plural(nErr,'campo','campos')+' para salvar'}
     else{m.className='msg'+(dirty?' dirty':'');m.innerHTML=dirty?svg(IC.warn,16)+'Alterações ainda não salvas':'Nenhuma alteração pendente'}
     $('fSave').disabled=!dirty&&!!draft.id}
    /* contatos: painel lateral.
       [Ajuste] O contato é um usuário da base de Usuários (selecionado por nome ou 8ID). Nome e 8ID vêm do AD;
       telefone e e-mail são editados só na tela Usuários: o botão "Editar em Usuários" leva até lá e,
       ao salvar, volta para este painel com os dados atualizados. Aqui ficam só os avisos (e-mail / SMS) do ponto.
       [Ajuste] O contato também pode ser um recebedor (js/data/recebedores.js): pessoa que não é usuária do ENCO.
       Se a pesquisa não encontrar ninguém, o painel oferece o cadastro de um novo recebedor. */
    var drawerRefresh=null;
    function contactDrawer(idx){var cur=idx>=0?draft.c[idx]:null,d=cur?{id8:cur.rid?'':cur.id8,rid:cur.rid||'',eA:cur.eA,sA:cur.sA}:{id8:'',rid:'',eA:true,sA:true},tc={},busca='',rec=null,recBase=null,autoAviso=false;
     var bg=document.createElement('div');bg.className='dr-bg';
     bg.innerHTML='<aside class="drawer" role="dialog" aria-modal="true" aria-label="Contato"><div class="dr-h"><div style="flex-grow:1"><h3>'+(cur?'Editar contato':'Novo contato')+'</h3><span class="dr-sub">'+esc(draft.ident||'Novo ponto')+'</span></div><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="dr-body">'+
     '<div class="dr-sep">Contato</div><div id="uBox"></div>'+
     '<div class="dr-sep">Avisos neste ponto</div><label class="swrow"><span class="sw"><input type="checkbox" id="cEA"'+(d.eA?' checked':'')+'><i></i></span>Enviar avisos por e-mail</label><span class="ferr" id="e-cEA" role="alert"></span>'+
     '<label class="swrow"><span class="sw"><input type="checkbox" id="cSA"'+(d.sA?' checked':'')+'><i></i></span>Enviar avisos por SMS</label><span class="ferr" id="e-cSA" role="alert"></span></div>'+
     '<div class="dr-f"><button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-p" id="cOk" disabled>'+(cur?'Salvar contato':'Adicionar contato')+'</button></div></aside>';
     scr.layer.appendChild(bg);
     function q1(s){return bg.querySelector(s)}
     function fechar(){drawerRefresh=null;bg.remove()}
     function dupe(id){return !!id&&draft.c.some(function(c,i){return i!==idx&&!c.rid&&c.id8.toUpperCase()===id})}
     function nrm(t){return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim()}
     function pessoa(){return d.rid?ENCO.recebedor(d.rid):d.id8?ENCO.usuario(d.id8):null}
     function dupeR(id){return draft.c.some(function(c,i){return i!==idx&&c.rid===id})}
     function achados(){var t=nrm(busca);if(!t)return [];function bate(id,nome){return nrm(id).indexOf(t)>=0||nrm(nome).indexOf(t)>=0}
      var us=ENCO.usuarios.filter(function(u){return bate(u.id,u.nome)}).map(function(u){return{id:u.id,id8:u.id,nome:u.nome,rec:false}}),
       rs=ENCO.recebedores.filter(function(r){return bate(r.id8,r.nome)}).map(function(r){return{id:r.id,id8:r.id8,nome:r.nome,rec:true}});
      return rs.concat(us).slice(0,6)}
     function setAviso(k,v){d[k]=v;q1('#c'+(k==='eA'?'EA':'SA')).checked=v}
     function mascara(v){var n=v.replace(/\D/g,'').slice(0,11);if(n.length<3)return n?'('+n:'';var p=n.length>10?7:6;return '('+n.slice(0,2)+') '+n.slice(2,p)+(n.length>p?'-'+n.slice(p):'')}
     function abrirNovo(){var t=busca.trim(),e8=/^\S+$/.test(t)&&/\d/.test(t);rec={nome:e8?'':t,id8:e8?t.toUpperCase():'',cel:'',email:''};recBase=null;tc={rNome:rec.nome?1:0};autoAviso=true;tocouE=tocouS=false;setAviso('eA',false);setAviso('sA',false);drawUser();cv();q1(e8?'#rNome':'#rId').focus()}
     function abrirEdicao(r){rec={nome:r.nome,id8:r.id8,cel:r.cel,email:r.email};recBase=r;tc={};autoAviso=false;drawUser();cv();q1('#rNome').focus()}
     function drawRec(box){
      box.innerHTML='<div class="rform"><p class="rinfo">'+svg(IC.users,16)+'<span><b>Não será usuário do ENCO.</b> Sem login e sem perfil: apenas recebe a entrega e os avisos.</span></p>'+
       fld('rNome','Nome',1,'<input class="inp" id="rNome" autocomplete="off" maxlength="100" value="'+esc(rec.nome)+'">')+'<span class="fhelp" id="rNomeDup" hidden>Já existe um cadastro com este nome. Se for a mesma pessoa, volte e selecione na pesquisa.</span>'+
       fld('rId','8ID',1,'<input class="inp" id="rId" autocomplete="off" maxlength="20" value="'+esc(rec.id8)+'">')+
       fld('rCel','Telefone',1,'<input class="inp" id="rCel" inputmode="tel" autocomplete="off" maxlength="15" placeholder="(21) 99999-9999" value="'+esc(rec.cel)+'">')+
       fld('rMail','E-mail',1,'<input class="inp" id="rMail" type="email" autocomplete="off" maxlength="100" placeholder="email@ternium.com.br" value="'+esc(rec.email)+'">')+
       (recBase?'<span class="fhelp">As alterações valem para todos os pontos em que esta pessoa é contato.</span>':'')+
       '<button type="button" class="btn btn-g btn-sm" id="rVolta">'+svg(IC.back,16)+(recBase?'Cancelar edição':'Voltar para a pesquisa')+'</button></div>';
      [['rNome','nome'],['rId','id8'],['rCel','cel'],['rMail','email']].forEach(function(p){var i=q1('#'+p[0]);
       i.addEventListener('input',function(){if(p[0]==='rCel')i.value=mascara(i.value);if(p[0]==='rId')i.value=i.value.toUpperCase();rec[p[1]]=i.value;tc[p[0]]=tc[p[0]]||p[0]==='rId';
        if(autoAviso&&(p[0]==='rMail'||p[0]==='rCel')){if(!tocouE)setAviso('eA',mailOk(rec.email));if(!tocouS)setAviso('sA',celOk(rec.cel))}cv()});
       i.addEventListener('blur',function(){tc[p[0]]=1;cv()})});
      q1('#rVolta').onclick=function(){var b=recBase;rec=null;recBase=null;autoAviso=false;tc={};if(b){d.eA=cur&&cur.rid===b.id?cur.eA:d.eA;d.sA=cur&&cur.rid===b.id?cur.sA:d.sA;drawUser();cv();q1('#rEdit').focus();return}setAviso('eA',true);setAviso('sA',true);drawUser();cv();q1('#cBusca').focus()}}
     function drawUser(){var box=q1('#uBox');if(rec){drawRec(box);return}var u=pessoa();
      if(!u){var r=achados();
       box.innerHTML=fld('cBusca','Pesquisar usuário ou recebedor',1,'<input class="inp" id="cBusca" type="search" autocomplete="off" placeholder="Nome ou 8ID" value="'+esc(busca)+'" aria-controls="uRes">','Só aparecem pessoas cadastradas em Usuários e recebedores já cadastrados.')+
        '<div class="ures" id="uRes" role="listbox">'+(busca.trim()?(r.length?r.map(function(x){var dp=x.rec?dupeR(x.id):dupe(x.id);return '<button type="button" class="uopt" role="option" '+(x.rec?'data-pick-r':'data-pick')+'="'+esc(x.id)+'"'+(dp?' disabled title="Já é contato deste ponto"':'')+'><span class="av2">'+esc(ini(x.nome))+'</span><span class="ci"><b>'+esc(x.nome)+'</b>'+(x.rec?'<span class="trec">Recebedor</span>':'')+'<small>'+(x.id8?'8ID '+esc(x.id8):'Sem 8ID')+(dp?' · já é contato deste ponto':'')+'</small></span></button>'}).join(''):'<div class="unew"><p class="unone">Nenhum usuário ou recebedor encontrado para "<b>'+esc(busca.trim())+'</b>". Confira o nome ou o 8ID.</p><button type="button" class="btn btn-s" id="rNovo">'+svg(IC.plus,18)+'Cadastrar novo recebedor</button><span class="fhelp">Para quem só recebe entregas neste ponto e não usa o ENCO.</span></div>'):'')+'</div>';
       var inp=q1('#cBusca');inp.addEventListener('input',function(e){busca=e.target.value;var c=e.target.selectionStart;drawUser();var n=q1('#cBusca');n.focus();n.setSelectionRange(c,c)});
       inp.addEventListener('blur',function(){tc.cBusca=1;cv()});
       var nv=q1('#rNovo');if(nv)nv.onclick=abrirNovo;return}
      if(d.rid){box.innerHTML='<div class="ucard"><div class="ucard-h"><span class="av2">'+esc(ini(u.nome))+'</span><span class="ci"><b>'+esc(u.nome)+'</b><span class="trec">Recebedor</span><small>'+(u.id8?'8ID '+esc(u.id8):'Sem 8ID')+'</small></span>'+(cur?'':'<button type="button" class="btn btn-g btn-sm" id="uTroca">Trocar</button>')+'</div>'+
        '<dl class="ukv"><dt>Telefone</dt><dd>'+(u.cel?esc(u.cel):'<span class="usem">Sem telefone</span>')+'</dd><dt>E-mail</dt><dd>'+(u.email?esc(u.email):'<span class="usem">Sem e-mail</span>')+'</dd></dl>'+
        '<button type="button" class="btn btn-s" id="rEdit">'+svg(IC.pen,16)+'Editar dados</button>'+
        '<span class="fhelp">Não é usuário do ENCO: apenas recebe a entrega e os avisos.</span></div>';
       var t2=q1('#uTroca');if(t2)t2.onclick=function(){d.rid='';busca='';drawUser();cv();q1('#cBusca').focus()};
       q1('#rEdit').onclick=function(){abrirEdicao(u)};return}
      box.innerHTML='<div class="ucard"><div class="ucard-h"><span class="av2">'+esc(ini(u.nome))+'</span><span class="ci"><b>'+esc(u.nome)+'</b><small>8ID '+esc(u.id)+'</small></span>'+(cur?'':'<button type="button" class="btn btn-g btn-sm" id="uTroca">Trocar</button>')+'</div>'+
       '<dl class="ukv"><dt>Telefone</dt><dd>'+(u.cel?esc(u.cel):'<span class="usem">Sem telefone</span>')+'</dd><dt>E-mail</dt><dd>'+(u.email?esc(u.email):'<span class="usem">Sem e-mail</span>')+'</dd></dl>'+
       '<button type="button" class="btn btn-s" id="uEdit">'+svg(IC.ext,16)+'Editar em Usuários</button>'+
       '<span class="fhelp">O usuário e o perfil são cadastrados pelo time de segurança no AD.</span></div>';
      var tr=q1('#uTroca');if(tr)tr.onclick=function(){d.id8='';busca='';drawUser();cv();q1('#cBusca').focus()};
      q1('#uEdit').onclick=function(){ENCO.bus.emit({editarUsuario:u.id,origem:'pontos'});ENCO.bus.emit({enco:'usuarios'})}}
     var tocouE=false,tocouS=false;
     function mailOk(v){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim())}
     function celOk(v){return v.replace(/\D/g,'').length>=10}
     function outro8id(v){var t=v.trim().toUpperCase();if(!t)return false;return !!ENCO.usuario(t)||ENCO.recebedores.some(function(r){return r.id8.toUpperCase()===t&&(!recBase||r.id!==recBase.id)})}
     function nomeRepetido(v){var t=nrm(v);if(!t)return false;return ENCO.usuarios.some(function(u){return nrm(u.nome)===t})||ENCO.recebedores.some(function(r){return nrm(r.nome)===t&&(!recBase||r.id!==recBase.id)})}
     function mostra(id,msg){var el=q1('#e-'+id);if(el)el.innerHTML=msg?svg(IC.warn,13)+esc(msg):''}
     function cv(){var ok,ok2=q1('#cOk');
      if(rec){var er={rNome:!rec.nome.trim()?'Informe o nome do recebedor.':'',rId:!rec.id8.trim()?'Informe o 8ID do recebedor.':outro8id(rec.id8)?'Este 8ID já está cadastrado. Volte e selecione a pessoa na pesquisa.':'',rCel:!celOk(rec.cel)?'Informe o DDD e o número do telefone.':'',rMail:!mailOk(rec.email)?'Informe um e-mail válido, como email@ternium.com.br.':'',cEA:d.eA&&!mailOk(rec.email)?'Informe um e-mail válido ou desligue o aviso por e-mail.':'',cSA:d.sA&&!celOk(rec.cel)?'Informe um telefone válido ou desligue o aviso por SMS.':''};
       ['rNome','rId','rCel','rMail'].forEach(function(k){mostra(k,tc[k]?er[k]:'')});mostra('cEA',er.cEA);mostra('cSA',er.cSA);
       var nd=q1('#rNomeDup');if(nd)nd.hidden=!nomeRepetido(rec.nome);
       ok=Object.keys(er).every(function(k){return !er[k]});
       var mud=!recBase||rec.nome.trim()!==recBase.nome||rec.id8.trim()!==recBase.id8||rec.cel!==recBase.cel||rec.email.trim()!==recBase.email||!cur||d.eA!==cur.eA||d.sA!==cur.sA;
       ok2.textContent=cur?'Salvar contato':recBase?'Adicionar contato':'Cadastrar e adicionar';ok2.disabled=!(ok&&mud);return ok}
      ok2.textContent=cur?'Salvar contato':'Adicionar contato';
      var u=pessoa(),quem=d.rid?'Este recebedor':'Este usuário',ond=d.rid?'Edite os dados':'Cadastre em Usuários';
      var e={cBusca:!u?'Selecione um usuário ou recebedor, ou cadastre um novo recebedor.':'',cEA:u&&d.eA&&!u.email?quem+' não tem e-mail. '+ond+' ou desligue o aviso por e-mail.':'',cSA:u&&d.sA&&!u.cel?quem+' não tem telefone. '+ond+' ou desligue o aviso por SMS.':''};
      var ec=q1('#e-cBusca');if(ec)ec.innerHTML=tc.cBusca&&e.cBusca?svg(IC.warn,13)+esc(e.cBusca):'';
      ['cEA','cSA'].forEach(function(k){q1('#e-'+k).innerHTML=e[k]?svg(IC.warn,13)+esc(e[k]):''});
      ok=Object.keys(e).every(function(k){return !e[k]});ok2.disabled=!(ok&&(!cur||(d.rid||d.id8)!==(cur.rid||cur.id8)||d.eA!==cur.eA||d.sA!==cur.sA||u.cel!==cur.cel||u.email!==cur.email||u.nome!==cur.nome));return ok}
     /* Sem isto, o erro que aparece ao sair do campo empurra o botão antes de o clique terminar */
     q1('#uBox').addEventListener('mousedown',function(e){if(e.target.closest('[data-pick],[data-pick-r],#rNovo,#rVolta'))e.preventDefault()});
     q1('#uBox').addEventListener('click',function(e){var b=e.target.closest('[data-pick],[data-pick-r]');if(!b||b.disabled)return;if(b.hasAttribute('data-pick-r')){d.rid=b.dataset.pickR;d.id8=''}else{d.id8=b.dataset.pick;d.rid=''}drawUser();cv();(q1('#uEdit')||q1('#rEdit')).focus()});
     q1('#cEA').onchange=function(e){d.eA=e.target.checked;tocouE=true;cv()};q1('#cSA').onchange=function(e){d.sA=e.target.checked;tocouS=true;cv()};
     function save(){tc.cBusca=tc.rNome=tc.rId=tc.rCel=tc.rMail=1;if(!cv()||q1('#cOk').disabled)return;var novo=false;
      if(rec){var dd={nome:rec.nome.trim(),id8:rec.id8.trim(),cel:rec.cel,email:rec.email.trim()},base=recBase;rec=null;recBase=null;
       if(base){ENCO.atualizarRecebedor(base.id,dd);d.rid=base.id}else{d.rid=ENCO.adicionarRecebedor(dd).id;d.id8='';novo=true}}
      var u=pessoa(),r=d.rid?{rid:u.id,id8:u.id8,nome:u.nome,email:u.email,eA:d.eA,cel:u.cel,sA:d.sA}:{id8:u.id,nome:u.nome,email:u.email,eA:d.eA,cel:u.cel,sA:d.sA};if(cur)draft.c[idx]=r;else draft.c.unshift(r);fechar();ui();toast((novo?'Recebedor cadastrado e adicionado':'Contato '+(cur?'atualizado':'adicionado'))+'. Salve o ponto para confirmar.')}
     q1('#cOk').onclick=save;bg.addEventListener('click',function(e){if(e.target===bg||e.target.closest('[data-x]'))fechar()});
     bg.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.id==='cBusca'){e.preventDefault();var p=q1('[data-pick]:not([disabled]),[data-pick-r]:not([disabled]),#rNovo');if(p)p.click()}});
     drawerRefresh=function(){drawUser();cv()};
     drawUser();cv();var f=q1('#cBusca')||q1('#uEdit')||q1('#rEdit');f.focus()}
    function leave(){if(snap(draft)===orig){renderList();return}
     var m=modal('Descartar alterações?','Você preencheu dados que ainda não foram salvos. Se sair agora, eles serão perdidos.','<button class="btn btn-s" data-x>Continuar editando</button><button class="btn btn-p" id="ok">Descartar e sair</button>');
     m.querySelector('#ok').onclick=function(){m.remove();renderList()}}
    $('fCancel').onclick=leave;
    $('fSave').onclick=function(){submitted=true;var E=errs(),bad=ORDER.filter(function(k){return E[k]});ui();
     if(bad.length){var el=$(bad[0]);el.scrollIntoView({block:'center',behavior:'smooth'});el.focus({preventScroll:true});return}
     var isNew=!draft.id,rec=JSON.parse(JSON.stringify(draft));rec.ident=rec.ident.trim();rec.desc=rec.desc.trim();rec.end=rec.end.trim();rec.lat=String(rec.lat).trim().replace(',','.');rec.lon=String(rec.lon).trim().replace(',','.');rec.id=isNew?nextId++:draft.id;
     if(isNew)P.push(rec);else P=P.map(function(p){return p.id===rec.id?rec:p});
     q='';fm='';open[rec.id]=false;var i=rows().map(function(p){return p.id}).indexOf(rec.id);pg=Math.floor(i/ps);renderList();toast('Ponto "'+rec.ident+'" '+(isNew?'cadastrado':'atualizado'))};
    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(e.target.closest('#btnNew')){openForm(0);return}
     if(t=e.target.closest('[data-edit]')){openForm(+t.dataset.edit);return}
     if(t=e.target.closest('[data-del]')){var p=P.filter(function(x){return x.id===+t.dataset.del})[0];
      var d=modal('Excluir ponto de descarga?','Você vai excluir o ponto <b>'+esc(p.ident)+'</b> e '+(p.c.length?'seus '+plural(p.c.length,'contato','contatos'):'nenhum contato associado')+'. Essa ação não pode ser desfeita.','<button class="btn btn-s" data-x>Cancelar</button><button class="btn btn-d" id="ok">Excluir ponto</button>');
      d.querySelector('#ok').onclick=function(){P=P.filter(function(x){return x.id!==p.id});d.remove();renderList();toast('Ponto "'+p.ident+'" excluído')};return}
     if(t=e.target.closest('[data-s]')){var k=t.dataset.s;if(sk===k)sd=-sd;else{sk=k;sd=1}renderList();return}
     if(t=e.target.closest('[data-zoom]')){var zp=P.filter(function(x){return x.id===+t.dataset.zoom})[0];modal(zp.ident,'<img alt="Foto do ponto '+esc(zp.ident)+'" src="'+zp.foto+'" style="width:100%;border-radius:12px;display:block">');return}
     if(t=e.target.closest('[data-all]')){all4[t.dataset.all]=!all4[t.dataset.all];renderList();return}
     if(e.target.closest('#pPrev')){pg--;renderList();return}if(e.target.closest('#pNext')){pg++;renderList();return}
     if(e.target.closest('a')||e.target.closest('.pdet'))return;
     if(t=e.target.closest('[data-tg]')){var id=+t.dataset.tg;open[id]=!open[id];renderList()}});
    main.addEventListener('keydown',function(e){var t=e.target.closest&&e.target.closest('[data-tg]');if(t&&e.target===t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();var id=+t.dataset.tg;open[id]=!open[id];renderList();var n=main.querySelector('[data-tg="'+id+'"]');if(n)n.focus()}});
    main.addEventListener('input',function(e){if(e.target.id==='q'&&view==='list'){q=e.target.value;pg=0;var c=e.target.selectionStart;renderList();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){if(view!=='list')return;if(e.target.id==='ps'){ps=+e.target.value;pg=0;renderList()}if(e.target.id==='fm'){fm=e.target.value;pg=0;renderList()}});
    /* Telefone ou e-mail alterado em Usuários: atualiza os contatos (cadastrados e em edição) e o painel aberto */
    ENCO.bus.on(function(e){var id=e.data&&e.data.usuarioAtualizado;if(!id)return;var u=ENCO.usuario(id);if(!u)return;
     function sync(c){if(c.id8===u.id){c.nome=u.nome;c.email=u.email;c.cel=u.cel;if(!u.email)c.eA=false;if(!u.cel)c.sA=false}}
     P.forEach(function(p){p.c.forEach(sync)});if(draft&&draft.c)draft.c.forEach(sync);
     if(view==='list')renderList();else ui();if(drawerRefresh)drawerRefresh()});
    /* Dados de recebedor alterados: atualiza o contato em todos os pontos */
    ENCO.bus.on(function(e){var id=e.data&&e.data.recebedorAtualizado;if(!id)return;var r=ENCO.recebedor(id);if(!r)return;
     function sync(c){if(c.rid===id){c.id8=r.id8;c.nome=r.nome;c.email=r.email;c.cel=r.cel;if(!r.email)c.eA=false;if(!r.cel)c.sA=false}}
     P.forEach(function(p){p.c.forEach(sync)});if(draft&&draft.c)draft.c.forEach(sync);
     if(view==='list')renderList();else ui()});
    ENCO.bus.on(function(e){var d=e.data;if(!d||!d.encoMacros)return;if(d.rename)P.forEach(function(p){if(p.macro===d.rename.from)p.macro=d.rename.to;});MACROS=d.encoMacros.slice().sort(function(a,b){return a.localeCompare(b,'pt')});if(fm&&MACROS.indexOf(fm)<0)fm='';if(view==='list')renderList()});
    scr.onDoc('keydown',function(e){if(e.key==='Escape'){var m=scr.qs('.modal-bg')||scr.qs('.dr-bg');if(m)m.remove()}});

    renderList();
    })();
  }
});
