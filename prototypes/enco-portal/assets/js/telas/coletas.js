/* ==========================================================================
   ENCO Portal Web · Tela: Coletas  (rota #coletas)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('coletas', {
  title: 'Coletas',
  rootClass: '',
  template: `
    <div class="content">
<main class="main" id="main"></main>
<footer class="savebar-wrap" id="foot" hidden><div class="savebar"><div class="msg" id="fMsg"></div><div class="spacer"></div><button class="btn btn-s" id="fCancel" disabled>Descartar alterações</button><button class="btn btn-p" id="fSave" disabled>Salvar alterações</button></div></footer>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',warn2:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',undo:'<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/>',box:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
     inbox:'<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
     clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',truck:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
     done:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
     l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',dn:'<path d="m6 9 6 6 6-6"/>',up:'<path d="m18 15-6-6-6 6"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',copy:'<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',ok:'<path d="m5 12 5 5 9-10"/>',dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>'};
    /* [REAL] Textos da tabela StatusColeta (ENCO.dominio.statusColeta). */
    var ST={'Em aberto':['#FDEBDD','#A8420A','clock'],'Em andamento':['#E0F0FC','#1565A8','truck'],'Confirmado':['#E1F3E8','#1D6B3E','done'],'Aceito pelo controlador':['#E3F1F6','#1E6E8C','ok'],'Rejeitado':['#FBE4E4','#B42318','x']},TILES=['Em aberto','Em andamento','Confirmado'];
    var MAT=[['74052210','Luva vaqueta cano curto','PR'],['74061187','Oculos seguranca lente incolor','PC'],['74071120','Mascara PFF2 sem valvula','PC'],['74080890','Avental raspa couro 120CM','PC'],['74110884','Bota seguranca couro solado termico TM40','PR'],['74090345','Capacete seguranca aba frontal branco','PC'],['74033019','Protetor auricular plug silicone','PC'],['75012044','Rolamento rigido esferas 6205','PC'],['75020311','Correia transportadora EP400 1200MM','M'],['76001502','Oleo hidraulico ISO VG 68','L']];
    var ORI=['Alto Forno 2','Aciaria','Coqueria','Laminação a Quente','Oficina Central','Utilidades'];
    var REQ=[['Ana Almeida Silva','10400000'],['Bruno Barbosa Souza','10400137'],['Carla Campos Pereira','10400274'],['Diego Duarte Rocha','DROCHA'],['Elisa Esteves Costa','10400548'],['Fábio Ferraz Nunes','10400685']];
    var STS=['Em aberto','Em aberto','Em andamento','Confirmado','Em aberto','Em andamento','Confirmado','Confirmado'];
    var C=[];for(var i=0;i<14;i++){var m=MAT[(i*3)%10],rq=REQ[i%6],dd=String(28-(i>>1)).padStart(2,'0');
     C.push({id:'10000'+(73420+i*7),res:String(285274100+i*13),mat:m[0],desc:m[1],qtd:[2,10,6,1,4,50,20,3,15,8][i%10],und:m[2],ori:ORI[(i*5)%6],tm:i%5===4?'202':'262',st:STS[i%8],nome:rq[0],id8:rq[1],email:rq[0].split(' ')[0].toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')+'.'+rq[0].split(' ').pop().toLowerCase()+'@exemplo.com.br',dt:dd+'/10/2026 '+String(7+i%10).padStart(2,'0')+':'+String((i*17)%60).padStart(2,'0')})}
    var MOV={'262':'Coleta Ordem - Devolução','202':'Devolução'};
    var PD=[];for(var j=0;j<7;j++){var m2=MAT[(j*7+2)%10],r2=REQ[(j+3)%6];PD.push({id:'10000'+(73560+j*9),res:String(285274300+j*11),mat:m2[0],desc:m2[1],qtd:[3,12,1,40,5,2,8][j],und:m2[2],ori:ORI[(j*2+1)%6],tm:j%3===2?'202':'262',nome:r2[0],id8:r2[1],email:r2[0].split(' ')[0].toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')+'.'+r2[0].split(' ').pop().toLowerCase()+'@exemplo.com.br',dt:'28/10/2026 '+String(8+j).padStart(2,'0')+':'+String((j*23)%60).padStart(2,'0')})}
    var ED={},tab='pend',pq='',ppg=0,pps=10,popen={};
    /* [REAL] Coletas pendentes (listagem-coletas-pendentes.component.ts): o controlador só decide
       Aceitar (StatusColeta 8 – Aceito pelo controlador) ou Rejeitar (7 – Rejeitado) cada coleta e
       envia as decisões em lote. Quantidade, origem e tipo de movimento vêm do SAP e não são editáveis.
       Antes de gravar, o portal consulta o SAP; coleta que não está mais ativa lá não é alterada e o
       usuário recebe "Id de integração / status atual no SAP". ED[id] = { dec: 'aceitar'|'rejeitar' }. */
    function dirtyIds(){return Object.keys(ED).filter(function(id){return ED[id]&&ED[id].dec&&PD.some(function(x){return x.id===id})})}
    var SAP_INATIVA={};
    function val(c,k){return ED[c.id]&&ED[c.id][k]!==undefined?ED[c.id][k]:c[k]}
    function qtdErr(c){var v=String(val(c,'qtd')).trim();return !/^\d+([.,]\d+)?$/.test(v)||parseFloat(v.replace(',','.'))<=0}
    var q='',fs='',fm='',sk='dt',sd=-1,ps=10,pg=0,open={};
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function dkey(x){var p=x.dt.split(/[\/ :]/);return p[2]+p[1]+p[0]+p[3]+p[4]}
    function rows(){var t=q.trim().toLowerCase();return C.filter(function(c){return(!fs||c.st===fs)&&(!fm||c.tm===fm)&&(!t||[c.id,c.res,c.mat,c.desc,c.ori,c.nome,c.id8,c.email].join(' ').toLowerCase().indexOf(t)>=0)}).sort(function(a,b){var x=sk==='dt'?dkey(a):String(a[sk]),y=sk==='dt'?dkey(b):String(b[sk]);return sd*x.localeCompare(y,'pt',{numeric:true})})}
    function toast(t){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t);scr.layer.appendChild(x);setTimeout(function(){x.remove()},2400)}
    function sortHead(k,l){var on=sk===k;return '<button class="sortb'+(on?' on':'')+'" data-s="'+k+'" aria-label="Ordenar por '+l+'">'+l+svg(on?(sd===1?IC.up:IC.dn):IC.sort,14)+'</button>'}
    function badge(s){var c=ST[s];return '<span class="badge" style="background:'+c[0]+';color:'+c[1]+'">'+svg(IC[c[2]],13)+esc(s)+'</span>'}
    function kv(l,v,mono,copy){return '<div class="kv2"><span>'+l+'</span><span'+(mono?' class="mono"':'')+'>'+v+(copy?'<button class="cpy" data-cp="'+esc(copy)+'" aria-label="Copiar '+l+'" title="Copiar">'+svg(IC.copy,14)+'</button>':'')+'</span></div>'}
    function drawSol(){var all=rows(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var list=all.slice(pg*ps,pg*ps+ps);
     var h=head();
     h+='<section class="tiles" aria-label="Resumo das coletas">'+[['','Total de coletas','inbox','#F1F1F6','#4A4E6A']].concat(TILES.map(function(k){return[k,k==='Confirmado'?'Confirmadas':k,ST[k][2],ST[k][0],ST[k][1]]})).map(function(t){var n=t[0]?C.filter(function(c){return c.st===t[0]}).length:C.length,on=fs===t[0]&&(t[0]!==''||!fs);
      return '<button class="tile'+(t[0]&&fs===t[0]?' active':'')+'" data-tile="'+t[0]+'" aria-pressed="'+(t[0]?fs===t[0]:!fs)+'"><span class="ic" style="background:'+t[3]+';color:'+t[4]+'">'+svg(IC[t[2]],20)+'</span><span class="num">'+n+'</span><span class="lab">'+t[1]+'</span></button>'}).join('')+'</section>';
     h+='<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" placeholder="Pesquisar por reserva, material, descrição ou requisitante" aria-label="Pesquisar coleta" autocomplete="off" value="'+esc(q)+'"></label>'+
     '<select class="inp" id="fm" aria-label="Filtrar por tipo de movimento" style="width:240px"><option value="">Todos os tipos de movimento</option>'+Object.keys(MOV).sort().map(function(k){return '<option value="'+k+'"'+(fm===k?' selected':'')+'>'+k+' – '+MOV[k]+'</option>'}).join('')+'</select>'+
     (fs?'<span class="pill filter">Status: '+esc(fs)+'<button class="ib" id="clrSt" aria-label="Remover filtro de status">'+svg(IC.x,14)+'</button></span>':'')+'<span class="pill">'+plural(all.length,'coleta','coletas')+'</span></div>'+
     '<div class="ccols thead"><span>'+sortHead('res','Reserva')+'</span><span>'+sortHead('desc','Material')+'</span><span style="text-align:right">Qtd. prevista</span><span>'+sortHead('ori','Origem')+'</span><span>Tipo mov.</span><span>'+sortHead('nome','Requisitante')+'</span><span>'+sortHead('st','Status')+'</span><span></span></div>';
     if(!list.length)h+='<div class="empty">'+svg(IC.inbox,30)+'<b>'+(C.length?'Nenhuma coleta encontrada':'Nenhuma coleta solicitada')+'</b><span style="color:#5E627C;font-size:14px">'+(C.length?'Ajuste a pesquisa ou os filtros.':'Quando uma área pedir uma coleta, ela aparece aqui.')+'</span></div>';
     list.forEach(function(c){var o=!!open[c.id];
      h+='<div class="cwrap"><div class="ccols crow2" tabindex="0" role="button" aria-expanded="'+o+'" data-tg="'+c.id+'" aria-label="Detalhes da reserva '+c.res+'">'+
      '<span class="stk"><b class="mono">'+c.res+'</b><small>'+c.dt+'</small></span>'+
      '<span class="stk"><b class="cl" title="'+esc(c.desc)+'">'+esc(c.desc)+'</b><small class="mono">Material '+c.mat+'</small></span>'+
      '<span class="qty mono"><b>'+c.qtd+'</b> '+c.und+'</span>'+
      '<span><span class="tag2" title="'+esc(c.ori)+'">'+esc(c.ori)+'</span></span>'+
      '<span><span class="mcode" title="'+esc(MOV[c.tm])+'">'+c.tm+'</span></span>'+
      '<span class="stk"><b class="cl">'+esc(c.nome)+'</b><small class="mono">8ID '+esc(c.id8)+'</small></span>'+
      '<span>'+badge(c.st)+'</span><span class="actions"><span class="ib ex" aria-hidden="true">'+svg(IC.dn,18)+'</span></span></div>'+
      (o?'<div class="cdet"><div><h4>Item</h4><div class="kvg">'+kv('Id de integração',c.id,1,c.id)+kv('Número da reserva',c.res,1,c.res)+kv('Número do material',c.mat,1,c.mat)+kv('Quantidade prevista',c.qtd+' '+c.und,1)+kv('Origem',esc(c.ori))+kv('Tipo de movimento',c.tm+' – '+esc(MOV[c.tm]),1)+kv('Solicitada em',c.dt,1)+kv('Status',badge(c.st))+'</div><div class="kv2" style="margin-top:4px"><span>Descrição</span><span>'+esc(c.desc)+'</span></div></div>'+
       '<div><h4>Requisitante</h4><div class="req"><span class="av2">'+c.nome.split(' ').map(function(w,i,a){return i===0||i===a.length-1?w[0]:''}).join('')+'</span><span class="ci"><b>'+esc(c.nome)+'</b><small class="mono">8ID '+esc(c.id8)+'</small><small>'+esc(c.email)+'</small></span></div><a class="btn btn-s" style="margin-top:12px;align-self:flex-start" href="mailto:'+esc(c.email)+'?subject='+encodeURIComponent('Coleta da reserva '+c.res)+'">'+svg(IC.mail,16)+'Enviar e-mail</a></div></div>':'')+'</div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}

    function head(){var nd=dirtyIds().length;return '<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.box,26)+'</div><div style="flex-grow:1"><h1>Coletas</h1><p>Revise as coletas pendentes e acompanhe as coletas já solicitadas.</p></div><button class="btn btn-s" id="btnExp">'+svg(IC.dl,18)+'Exportar</button></section>'+
     '<div class="ptabs" role="tablist" aria-label="Tipo de coleta"><button class="ptab'+(tab==='pend'?' on':'')+'" role="tab" aria-selected="'+(tab==='pend')+'" data-tab="pend">'+svg(IC.clock,18)+'Pendentes<span class="tcount'+(PD.length?' hot':'')+'">'+PD.length+'</span>'+(nd?'<span class="tdot" title="Alterações não salvas"></span>':'')+'</button><button class="ptab'+(tab==='sol'?' on':'')+'" role="tab" aria-selected="'+(tab==='sol')+'" data-tab="sol">'+svg(IC.inbox,18)+'Solicitadas<span class="tcount">'+C.length+'</span></button></div>'}
    function prow(){var t=pq.trim().toLowerCase();return PD.filter(function(c){return !t||[c.id,c.res,c.mat,c.desc,c.ori,c.nome,c.id8,c.email].join(' ').toLowerCase().indexOf(t)>=0})}
    function opts(list,cur,lab){return list.map(function(v){return '<option value="'+esc(v)+'"'+(v===cur?' selected':'')+'>'+esc(lab?lab(v):v)+'</option>'}).join('')}
    function drawPend(){var all=prow(),pages=Math.max(1,Math.ceil(all.length/pps));if(ppg>=pages)ppg=pages-1;var list=all.slice(ppg*pps,ppg*pps+pps),dirty=dirtyIds();
     var h=head()+'<div class="hint2">'+svg(IC.info,18)+'<span>Marque <b>Aceitar</b> ou <b>Rejeitar</b> em cada coleta e envie as decisões. Antes de gravar, o ENCO confirma no SAP se a coleta continua ativa.</span></div>';
     h+='<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="pq" placeholder="Pesquisar por reserva, material, descrição ou requisitante" aria-label="Pesquisar coleta pendente" autocomplete="off" value="'+esc(pq)+'"></label><span class="pill">'+plural(all.length,'coleta pendente','coletas pendentes')+'</span>'+(dirty.length?'<span class="pill filter" style="padding:4px 10px">'+plural(dirty.length,'alterada','alteradas')+'</span>':'')+'</div>'+
     '<div class="pecols thead"><span>Reserva</span><span>Material</span><span style="text-align:right">Qtd. prevista</span><span>Origem</span><span>Tipo mov.</span><span>Requisitante</span><span style="text-align:right">Decisão</span></div>';
     if(!list.length)h+='<div class="empty">'+svg(IC.done,30)+'<b>'+(PD.length?'Nenhuma coleta encontrada':'Nenhuma coleta pendente')+'</b><span style="color:#5E627C;font-size:14px">'+(PD.length?'Ajuste a pesquisa.':'Tudo em dia por aqui.')+'</span></div>';
     list.forEach(function(c){var o=!!popen[c.id],chg=dirty.indexOf(c.id)>=0,tm=c.tm,dec=ED[c.id]&&ED[c.id].dec;
      h+='<div class="cwrap"><div class="pecols crow2 perow'+(chg?' chg':'')+'" tabindex="0" role="button" aria-expanded="'+o+'" data-ptg="'+c.id+'" aria-label="Detalhes da reserva '+c.res+'">'+
      '<span class="stk"><b class="mono">'+c.res+'</b><small>'+c.dt+'</small></span>'+
      '<span class="stk"><b class="cl" title="'+esc(c.desc)+'">'+esc(c.desc)+'</b><small class="mono">Material '+c.mat+'</small></span>'+
      '<span class="qty mono" style="text-align:right"><b>'+c.qtd+'</b> '+c.und+'</span>'+
      '<span><span class="tag2" title="'+esc(c.ori)+'">'+esc(c.ori)+'</span></span>'+
      '<span><span class="mcode" title="'+esc(MOV[tm]||'')+'">'+tm+'</span></span>'+
      '<span class="stk"><b class="cl">'+esc(c.nome)+'</b><small class="mono">8ID '+esc(c.id8)+'</small></span>'+
      '<span class="actions dec">'+
       '<button class="decb ok'+(dec==='aceitar'?' on':'')+'" data-dec="aceitar" data-id="'+c.id+'" aria-pressed="'+(dec==='aceitar')+'" title="Aceitar coleta">'+svg(IC.ok,15)+'Aceitar</button>'+
       '<button class="decb no'+(dec==='rejeitar'?' on':'')+'" data-dec="rejeitar" data-id="'+c.id+'" aria-pressed="'+(dec==='rejeitar')+'" title="Rejeitar coleta">'+svg(IC.x,15)+'Rejeitar</button>'+
       (chg?'<button class="ib rv" data-rv="'+c.id+'" aria-label="Desfazer decisão da reserva '+c.res+'" title="Desfazer decisão">'+svg(IC.undo,16)+'</button>':'')+
       '<span class="ib ex" aria-hidden="true">'+svg(IC.dn,18)+'</span></span></div>'+
      (SAP_INATIVA[c.id]?'<div class="rowerr">'+svg(IC.warn2,14)+'Coleta não está mais ativa no SAP (status atual: '+esc(SAP_INATIVA[c.id])+'). A decisão não foi gravada.</div>':'')+
      (o?'<div class="cdet"><div><h4>Item</h4><div class="kvg">'+kv('Id de integração',c.id,1,c.id)+kv('Número da reserva',c.res,1,c.res)+kv('Número do material',c.mat,1,c.mat)+kv('Unidade de medida',c.und,1)+kv('Solicitada em',c.dt,1)+kv('Tipo de movimento',tm+' – '+esc(MOV[tm]||''),1)+'</div><div class="kv2" style="margin-top:4px"><span>Descrição</span><span>'+esc(c.desc)+'</span></div></div>'+
       '<div><h4>Requisitante</h4><div class="rqbox"><span class="av2">'+c.nome.split(' ').map(function(w,i,a){return i===0||i===a.length-1?w[0]:''}).join('')+'</span><span class="ci"><b>'+esc(c.nome)+'</b><small class="mono">8ID '+esc(c.id8)+'</small><small>'+esc(c.email)+'</small></span></div><a class="btn btn-s" style="margin-top:12px;align-self:flex-start" href="mailto:'+esc(c.email)+'?subject='+encodeURIComponent('Coleta da reserva '+c.res)+'">'+svg(IC.mail,16)+'Enviar e-mail</a></div></div>':'')+'</div>'});
     var from=all.length?ppg*pps+1:0,to=Math.min(all.length,ppg*pps+pps);
     h+='<div class="pager"><label>Itens por página <select id="pps" aria-label="Itens por página">'+[5,10,25].map(function(n){return '<option'+(n===pps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="ppPrev" aria-label="Página anterior"'+(ppg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="ppNext" aria-label="Próxima página"'+(ppg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc;foot()}
    function foot(){var d=dirtyIds(),f=$('foot');f.hidden=tab!=='pend';
     var na=d.filter(function(id){return ED[id].dec==='aceitar'}).length,nr=d.length-na;
     var m=$('fMsg');m.className='msg'+(d.length?' dirty':'');m.innerHTML=d.length?svg(IC.warn2,16)+plural(na,'aceita','aceitas')+' e '+plural(nr,'rejeitada','rejeitadas')+', ainda não enviadas':'Nenhuma decisão pendente';
     $('fCancel').disabled=!d.length;$('fSave').disabled=!d.length;$('fSave').lastChild.textContent='Enviar decisões'}
    function draw(){if(tab==='pend')drawPend();else{drawSol();$('foot').hidden=true}}
    function modal(t,b,f){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+esc(t)+'"><div class="mh"><h3>'+esc(t)+'</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function setTab(t){if(t===tab)return;tab=t;$('main').scrollTop=0;draw()}
    $('fCancel').onclick=function(){var n=dirtyIds().length;var m=modal('Descartar alterações?','Você vai desfazer as alterações em '+plural(n,'coleta','coletas')+'. Os valores voltam ao que estava salvo.','<button class="btn btn-s" data-x>Continuar editando</button><button class="btn btn-p" id="ok">Descartar alterações</button>');m.querySelector('#ok').onclick=function(){ED={};m.remove();draw();toast('Alterações descartadas')}};
    /* Simulação da checagem no SAP: a 3ª coleta pendente da lista inicial já foi encerrada no SAP */
    var SAP_ENCERRADA=PD[2]?PD[2].id:null;
    $('fSave').onclick=function(){var d=dirtyIds(),ok=0,inat=[];
     d.forEach(function(id){var o=PD.filter(function(x){return x.id===id})[0];
      if(id===SAP_ENCERRADA){SAP_INATIVA[id]='Encerrada';inat.push(id);delete ED[id];return}
      var dec=ED[id].dec;delete ED[id];PD.splice(PD.indexOf(o),1);ok++;
      C.unshift({id:o.id,res:o.res,mat:o.mat,desc:o.desc,qtd:o.qtd,und:o.und,ori:o.ori,tm:o.tm,st:dec==='aceitar'?'Aceito pelo controlador':'Rejeitado',nome:o.nome,id8:o.id8,email:o.email,dt:o.dt})});
     draw();
     if(ok)toast(plural(ok,'decisão enviada','decisões enviadas'));
     if(inat.length)modal('Coletas não alteradas','Estas coletas não estão mais ativas no SAP e não foram alteradas:<br><br>'+inat.map(function(id){return 'Id de integração: <b class="mono">'+id+'</b>, status atual no SAP: <b>'+SAP_INATIVA[id]+'</b>'}).join('<br>'),'<button class="btn btn-p" data-x>Entendi</button>')};

    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(t=e.target.closest('[data-tab]')){setTab(t.dataset.tab);return}
     if(t=e.target.closest('[data-dec]')){var id=t.dataset.id,dv=t.dataset.dec;if(ED[id]&&ED[id].dec===dv)delete ED[id];else ED[id]={dec:dv};delete SAP_INATIVA[id];draw();var nb=main.querySelector('[data-dec="'+dv+'"][data-id="'+id+'"]');if(nb)nb.focus();return}
     if(t=e.target.closest('[data-rv]')){delete ED[t.dataset.rv];draw();return}
     if(e.target.closest('#ppPrev')){ppg--;draw();return}if(e.target.closest('#ppNext')){ppg++;draw();return}
     if(tab==='pend'){if(e.target.closest('a')||e.target.closest('.cdet'))return;if(t=e.target.closest('[data-ptg]')){popen[t.dataset.ptg]=!popen[t.dataset.ptg];draw()}}
     if(t=e.target.closest('[data-cp]')){e.stopPropagation();try{navigator.clipboard.writeText(t.dataset.cp)}catch(x){}toast('Copiado: '+t.dataset.cp);return}
     if(e.target.closest('#btnExp')){var n=tab==='pend'?prow().length:rows().length;toast('Exportação de '+plural(n,'coleta','coletas')+(tab==='pend'?' pendentes':' solicitadas')+' iniciada');return}
     if(t=e.target.closest('[data-tile]')){var k=t.dataset.tile;fs=(fs===k)?'':k;pg=0;draw();return}
     if(e.target.closest('#clrSt')){fs='';pg=0;draw();return}
     if(t=e.target.closest('[data-s]')){var s=t.dataset.s;if(sk===s)sd=-sd;else{sk=s;sd=1}draw();return}
     if(e.target.closest('#pPrev')){pg--;draw();return}if(e.target.closest('#pNext')){pg++;draw();return}
     if(e.target.closest('a')||e.target.closest('.cdet'))return;
     if(t=e.target.closest('[data-tg]')){open[t.dataset.tg]=!open[t.dataset.tg];draw()}});
    main.addEventListener('keydown',function(e){var pt=e.target.closest&&e.target.closest('[data-ptg]');if(pt&&e.target===pt&&(e.key==='Enter'||e.key===' ')){e.preventDefault();var pid=pt.dataset.ptg;popen[pid]=!popen[pid];draw();var pn=main.querySelector('[data-ptg="'+pid+'"]');if(pn)pn.focus();return}
     var tb=e.target.closest&&e.target.closest('[data-tab]');if(tb&&(e.key==='ArrowRight'||e.key==='ArrowLeft')){setTab(tab==='pend'?'sol':'pend');var nb=main.querySelector('[data-tab="'+tab+'"]');if(nb)nb.focus();return}
     var t=e.target.closest&&e.target.closest('[data-tg]');if(t&&e.target===t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();var id=t.dataset.tg;open[id]=!open[id];draw();var n=main.querySelector('[data-tg="'+id+'"]');if(n)n.focus()}});
    main.addEventListener('input',function(e){var el=e.target;
     if(el.dataset&&el.dataset.e==='qtd'){var id=el.dataset.id;ED[id]=ED[id]||{};ED[id].qtd=el.value.replace(/[^\d.,]/g,'');var c=PD.filter(function(x){return x.id===id})[0],pos=el.selectionStart;draw();var n=main.querySelector('[data-e="qtd"][data-id="'+id+'"]');if(n){n.focus();try{n.setSelectionRange(pos,pos)}catch(x){}}return}
     if(el.id==='pq'){pq=el.value;ppg=0;var cp=el.selectionStart;draw();var np=$('pq');np.focus();np.setSelectionRange(cp,cp);return}
     if(e.target.id==='q'){q=e.target.value;pg=0;var c=e.target.selectionStart;draw();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){var el=e.target;if(el.dataset&&(el.dataset.e==='ori'||el.dataset.e==='tm')){var id=el.dataset.id;ED[id]=ED[id]||{};ED[id][el.dataset.e]=el.value;draw();var n=main.querySelector('[data-e="'+el.dataset.e+'"][data-id="'+id+'"]');if(n)n.focus();return}if(el.id==='pps'){pps=+el.value;ppg=0;draw();return}if(e.target.id==='ps'){ps=+e.target.value;pg=0;draw()}if(e.target.id==='fm'){fm=e.target.value;pg=0;draw()}});
    ENCO.bus.on(function(e){if(!e.data||!e.data.encoMov)return;e.data.encoMov.forEach(function(s){var m=/^(\d+) – (.*) \((\w+)\)$/.exec(s);if(m&&m[3]==='Coleta')MOV[m[1]]=m[2]});draw()});
    window.addEventListener('beforeunload',function(e){if(dirtyIds().length){e.preventDefault();e.returnValue=''}});

    draw();
    })();
  }
});