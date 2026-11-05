/* ==========================================================================
   ENCO Portal Web · Tela: Dashboards  (rota #dashboards)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('dashboards', {
  title: 'Dashboards',
  rootClass: '',
  template: `
    <div class="content">
<main class="main" id="main"></main>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={dash:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
     avg:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',truck:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
     away:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 12.5-6.6"/><path d="m17 15 4 4"/><path d="m21 15-4 4"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
     l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',up:'<path d="m18 15-6-6-6 6"/>',dn:'<path d="m6 9 6 6 6-6"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',dl:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/>',warn:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',ok:'<path d="m5 12 5 5 9-10"/>',cal:'<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>'};
    var PTS=['Aciaria B16 A','Oficina P. Placas','MPW','Energy & Media Terme Manu','Energy & Media Utilid Man','Energy & Media Manut','Energy & Media ECC A','Alto Forno 2 - Casa de Corrida','Laminação a Quente - Forno 1','Coqueria - Esteira 4','WH ADM','Utilidades'];
    var BASE=[22,7,12,3,2,2,3,15,10,6,5,8];
    /* gerador determinístico */
    var seed=7;function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
    var D=[],F=[];
    for(var day=1;day<=28;day++){var n=day%7===0?2:day%7===6?3:5+Math.floor(rnd()*4);
     for(var k=0;k<n;k++){var pi=Math.floor(rnd()*PTS.length),secs=Math.max(25,Math.round(BASE[pi]*60*(0.4+rnd()*1.3)+(rnd()<.06?BASE[pi]*90:0)));
      var h=7+Math.floor(rnd()*10),mi=Math.floor(rnd()*60),s=Math.floor(rnd()*60),t0=new Date(2026,9,day,h,mi,s),t1=new Date(t0.getTime()+secs*1000);
      D.push({plano:'202610'+String(day).padStart(2,'0')+String(h).padStart(2,'0')+String(Math.floor(rnd()*60)).padStart(2,'0')+String(Math.floor(rnd()*60)).padStart(2,'0'),ponto:PTS[pi],t0:t0,t1:t1,secs:secs})}
     if(rnd()<.35)F.push({ponto:PTS[Math.floor(rnd()*PTS.length)],d:new Date(2026,9,day,9+Math.floor(rnd()*7),0)})}
    var TODAY=new Date(2026,9,28);
    function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
    function br(d){return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()}
    function brt(d){return br(d)+', '+[d.getHours(),d.getMinutes(),d.getSeconds()].map(function(x){return String(x).padStart(2,'0')}).join(':')}
    function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
    function dur(s,full){s=Math.round(s);var h=Math.floor(s/3600),m=Math.floor(s%3600/60),r=s%60;if(h)return h+'h '+(m?String(m).padStart(full?2:1,'0')+'min':'');if(m)return m+'min'+(r?' '+String(r).padStart(2,'0')+'s':'');return r+'s'}
    var st={ini:iso(addDays(TODAY,-6)),fim:iso(TODAY),pt:'',preset:'7',q:'',sk:'t0',sd:-1,ps:10,pg:0};
    function inRange(d){var x=iso(d);return x>=st.ini&&x<=st.fim}
    function data(){return D.filter(function(r){return inRange(r.t0)&&(!st.pt||r.ponto===st.pt)})}
    function fails(){return F.filter(function(r){return inRange(r.d)&&(!st.pt||r.ponto===st.pt)})}
    function toast(t){var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t);scr.layer.appendChild(x);setTimeout(function(){x.remove()},2400)}
    function kpi(ic,bg,fg,lab,val,sub,extra){return '<div class="kpi'+(extra||'')+'"><span class="ic" style="background:'+bg+';color:'+fg+'">'+svg(ic,20)+'</span><span class="kl">'+lab+'</span><span class="kv">'+val+'</span><span class="ks">'+sub+'</span></div>'}
    function sortHead(k,l,right){var on=st.sk===k;return '<button class="sortb'+(on?' on':'')+'" data-s="'+k+'" aria-label="Ordenar por '+l+'"'+(right?' style="margin-left:auto"':'')+'>'+l+svg(on?(st.sd===1?IC.up:IC.dn):IC.sort,14)+'</button>'}
    function chartPts(rows,avg){var g={};rows.forEach(function(r){(g[r.ponto]=g[r.ponto]||[]).push(r.secs)});
     var L=Object.keys(g).map(function(p){var a=g[p];return{p:p,avg:a.reduce(function(s,x){return s+x},0)/a.length,n:a.length}}).sort(function(a,b){return b.avg-a.avg});
     if(!L.length)return '<div class="cempty">Sem entregas no período.</div>';
     var mx=Math.max.apply(null,L.map(function(x){return x.avg})),ap=avg/mx*100;
     return '<div class="hbars" role="list">'+L.map(function(x){var w=Math.max(1.5,x.avg/mx*100),sel=st.pt===x.p,hi=x.avg>avg*1.25;
      return '<button class="hb'+(sel?' sel':'')+(st.pt&&!sel?' dim':'')+'" role="listitem" data-pt="'+esc(x.p)+'" data-tip="'+esc(x.p)+'|'+dur(x.avg)+'|'+x.n+'" aria-label="'+esc(x.p)+': média '+dur(x.avg)+' em '+x.n+' entregas. Clique para filtrar."><span class="hbl" title="'+esc(x.p)+'">'+esc(x.p)+'</span><span class="hbt"><span class="hbf'+(hi?' hi':'')+'" style="width:'+w+'%"></span><span class="hbv" style="left:calc('+w+'% + 8px)">'+dur(x.avg)+'</span></span></button>'}).join('')+
      '<div class="avgline" style="left:calc(var(--lw) + 12px + (100% - var(--lw) - 12px - var(--vw)) * '+(ap/100)+')"><span>média '+dur(avg)+'</span></div></div>'}
    function chartDays(rows){var days=[],a=new Date(st.ini+'T00:00'),b=new Date(st.fim+'T00:00');for(var d=a;d<=b;d=addDays(d,1))days.push(new Date(d));
     if(days.length<2)return '<div class="cempty">Escolha um período de 2 dias ou mais para ver a tendência.</div>';
     var V=days.map(function(d){var k=iso(d),r=rows.filter(function(x){return iso(x.t0)===k});return{d:d,n:r.length,avg:r.length?r.reduce(function(s,x){return s+x.secs},0)/r.length:null}});
     var W=520,H=300,pl=48,pr=30,pt=24,pb=30,mx=Math.max(60,Math.max.apply(null,V.map(function(v){return v.avg||0})));mx=Math.ceil(mx/300)*300;
     function X(i){return pl+(W-pl-pr)*(V.length===1?0.5:i/(V.length-1))}function Y(v){return pt+(H-pt-pb)*(1-v/mx)}
     var grid='',ticks=[0,mx/2,mx];ticks.forEach(function(t){grid+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(t)+'" y2="'+Y(t)+'" class="gl"/><text x="'+(pl-8)+'" y="'+(Y(t)+4)+'" class="ax" text-anchor="end">'+(t?Math.round(t/60)+'min':'0')+'</text>'});
     var path='',seg=false;V.forEach(function(v,i){if(v.avg==null){seg=false;return}path+=(seg?'L':'M')+X(i).toFixed(1)+' '+Y(v.avg).toFixed(1);seg=true});
     var step=Math.ceil(V.length/7),xl='';V.forEach(function(v,i){if(i%step===0||i===V.length-1)xl+='<text x="'+X(i)+'" y="'+(H-6)+'" class="ax" text-anchor="middle">'+String(v.d.getDate()).padStart(2,'0')+'/'+String(v.d.getMonth()+1).padStart(2,'0')+'</text>'});
     var dots=V.map(function(v,i){return v.avg==null?'':'<circle cx="'+X(i)+'" cy="'+Y(v.avg)+'" r="4.5" class="dt"/>'}).join('');
     /* Valor visível em cada ponto. Em períodos longos segue o mesmo intervalo das datas para não sobrepor */
     var vals=V.map(function(v,i){return v.avg==null||(i%step!==0&&i!==V.length-1)?'':'<text x="'+X(i)+'" y="'+(Y(v.avg)-11)+'" class="val" text-anchor="middle">'+dur(v.avg)+'</text>'}).join('');
     var hits=V.map(function(v,i){var w=(W-pl-pr)/Math.max(1,V.length-1);return '<rect class="hit" x="'+(X(i)-w/2)+'" y="'+pt+'" width="'+w+'" height="'+(H-pt-pb)+'" data-i="'+i+'" data-tip="'+br(v.d)+'|'+(v.avg==null?'Sem entregas':dur(v.avg))+'|'+v.n+'" data-x="'+X(i)+'"/>'}).join('');
     return '<svg class="lc" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Tempo médio de descarga por dia">'+grid+xl+'<line class="xh" x1="0" x2="0" y1="'+pt+'" y2="'+(H-pb)+'"/><path d="'+path+'" class="ln"/>'+dots+vals+hits+'</svg>'}
    function draw(){var rows=data(),fl=fails(),tot=rows.reduce(function(s,r){return s+r.secs},0),avg=rows.length?tot/rows.length:0;
     var days=Math.round((new Date(st.fim+'T00:00')-new Date(st.ini+'T00:00'))/864e5)+1;
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.dash,26)+'</div><div style="flex-grow:1"><h1>Tempo de descarga</h1><p>Quanto tempo o entregador passa em cada ponto de entrega, do registro de chegada ao de saída.</p></div></section>';
     h+='<section class="card fbar"><div class="segs" role="group" aria-label="Período rápido">'+[['0','Hoje'],['7','7 dias'],['30','30 dias']].map(function(p){return '<button class="seg'+(st.preset===p[0]?' on':'')+'" data-pre="'+p[0]+'" aria-pressed="'+(st.preset===p[0])+'">'+p[1]+'</button>'}).join('')+'</div>'+
     '<label class="fld2"><span class="lbl">De</span><input class="inp hl" type="date" id="dIni" value="'+st.ini+'" max="'+st.fim+'"></label><label class="fld2"><span class="lbl">Até</span><input class="inp hl" type="date" id="dFim" value="'+st.fim+'" min="'+st.ini+'" max="'+iso(TODAY)+'"></label>'+
     '<label class="fld2" style="flex:1;min-width:220px"><span class="lbl">Ponto de entrega</span><select class="inp'+(st.pt?' hl':'')+'" id="fPt"><option value="">Todos os pontos</option>'+PTS.slice().sort().map(function(p){return '<option'+(p===st.pt?' selected':'')+'>'+esc(p)+'</option>'}).join('')+'</select></label>'+
     ((st.pt||st.preset!=='7')?'<button class="btn btn-g" id="fClr" style="align-self:flex-end">Limpar</button>':'')+
     '<button class="btn btn-s" id="btnRel" style="align-self:flex-end">'+svg(IC.dl,18)+'Gerar relatório</button></section>';
     h+='<p class="fsum">'+svg(IC.cal,15)+br(new Date(st.ini+'T00:00'))+' a '+br(new Date(st.fim+'T00:00'))+' · '+(st.pt?esc(st.pt):'todos os pontos')+'</p>';
     h+='<section class="kpis">'+kpi(IC.avg,'#DDF0F2','#1A7A85','Tempo médio por entrega',rows.length?dur(avg):'—','por parada no ponto')+kpi(IC.clock,'#FDEBDD','#D35A12','Tempo total em descarga',rows.length?dur(tot,1):'—','somando todas as entregas')+kpi(IC.truck,'#E9E8F8','#5B55C9','Entregas realizadas',rows.length.toLocaleString('pt-BR'),(days>1?'≈ '+(rows.length/days).toFixed(1).replace('.',',')+' por dia':'no dia'))+
      kpi(IC.away,'#FDECEA','#B42318','Não entregues: receptor ausente',fl.length,fl.length?'<span class="warnt">'+svg(IC.warn,13)+'Pacotes voltaram sem entrega</span>':'Nenhuma ocorrência no período',fl.length?' alert':'')+'</section>';
     h+='<section class="charts"><div class="card ch"><div class="chh"><h2>Tempo médio por ponto</h2><span class="hint3">'+(st.pt?'Clique de novo no ponto para ver todos':'Clique num ponto para filtrar o painel')+'</span></div>'+(function(){var A=D.filter(function(r){return inRange(r.t0)});return chartPts(A,A.length?A.reduce(function(s,r){return s+r.secs},0)/A.length:0)})()+'<p class="lgn"><span class="sw1"></span>Tempo médio <span class="sw2"></span>Acima de 25% da média do período</p></div>'+
     '<div class="card ch"><div class="chh"><h2>Tempo médio por dia</h2><span class="hint3">'+(st.pt?esc(st.pt):'Todos os pontos')+'</span></div>'+chartDays(rows)+'</div></section>';
     var t=st.q.trim().toLowerCase(),L=rows.filter(function(r){return !t||r.plano.indexOf(t)>=0||r.ponto.toLowerCase().indexOf(t)>=0}).sort(function(a,b){var x=a[st.sk],y=b[st.sk];return st.sd*(typeof x==='string'?x.localeCompare(y,'pt',{numeric:true}):x-y)});
     var pages=Math.max(1,Math.ceil(L.length/st.ps));if(st.pg>=pages)st.pg=pages-1;var list=L.slice(st.pg*st.ps,st.pg*st.ps+st.ps),mx=Math.max.apply(null,rows.map(function(r){return r.secs}).concat([1]));
     h+='<section class="card t-card"><div class="t-head"><h2>Detalhamento das entregas</h2><span class="pill">'+L.length+(L.length===1?' entrega':' entregas')+'</span><div class="spacer"></div><label class="search" style="max-width:320px">'+svg(IC.search,18)+'<input class="inp'+(st.q?' hl':'')+'" id="q" placeholder="Pesquisar por plano ou ponto" aria-label="Pesquisar entrega" autocomplete="off" value="'+esc(st.q)+'"></label></div>'+
     '<div class="dcols thead"><span>'+sortHead('plano','Plano')+'</span><span>'+sortHead('ponto','Ponto de entrega')+'</span><span>'+sortHead('t0','Chegada')+'</span><span>'+sortHead('t1','Saída')+'</span><span style="display:flex">'+sortHead('secs','Tempo gasto',1)+'</span></div>';
     if(!list.length)h+='<div class="empty"><b>Nenhuma entrega encontrada</b><span style="color:#5E627C;font-size:14px">Mude o período, o ponto ou a pesquisa.</span></div>';
     list.forEach(function(r){var hi=r.secs>avg*1.25&&rows.length>1;h+='<div class="dcols drow"><span class="mono" style="font-weight:600">'+r.plano+'</span><span class="cl" title="'+esc(r.ponto)+'">'+esc(r.ponto)+'</span><span class="mono mu">'+brt(r.t0)+'</span><span class="mono mu">'+brt(r.t1)+'</span><span class="tg2"><span class="mini"><i'+(hi?' class="hi"':'')+' style="width:'+Math.max(3,r.secs/mx*100)+'%"></i></span><b class="mono">'+dur(r.secs)+'</b>'+(hi?'<span class="above" title="Acima de 25% da média do período">'+svg(IC.warn,12)+'</span>':'<span class="above sp"></span>')+'</span></div>'});
     var from=L.length?st.pg*st.ps+1:0,to=Math.min(L.length,st.pg*st.ps+st.ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[10,25,50].map(function(n){return '<option'+(n===st.ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+L.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(st.pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(st.pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    /* Gerar relatório: PDF A4 paisagem com a tela inteira do dashboard.
       Página 1: cabeçalho, filtro, indicadores e gráficos (copiados da tela com os estilos);
       páginas seguintes: "Detalhamento das entregas" com TODAS as entregas do período
       (mesma pesquisa e ordenação da tela, não só a página visível). */
    function relatorio(){var m=$('main'),e=ENCO.exporta.escape,d=new Date(),p2=function(n){return String(n).padStart(2,'0')};
     var rows=data(),avg=rows.length?rows.reduce(function(s,r){return s+r.secs},0)/rows.length:0,t=st.q.trim().toLowerCase();
     var L=rows.filter(function(r){return !t||r.plano.indexOf(t)>=0||r.ponto.toLowerCase().indexOf(t)>=0}).sort(function(a,b){var x=a[st.sk],y=b[st.sk];return st.sd*(typeof x==='string'?x.localeCompare(y,'pt',{numeric:true}):x-y)});
     var filtro=br(new Date(st.ini+'T00:00'))+' a '+br(new Date(st.fim+'T00:00'))+' · '+(st.pt?e(st.pt):'Todos os pontos')+(t?' · Pesquisa: '+e(st.q):'');
     var painel='<div><header><img src="'+ENCO.img.logo+'" alt=""><div><h1>Dashboard · Tempo de descarga</h1><p>'+filtro+' · Área Almoxarifado</p></div></header>'+
      '<div style="zoom:'+Math.min(1,1040/m.querySelector('.kpis').offsetWidth).toFixed(3)+'">'+
      '<h2>Indicadores</h2><div style="margin-bottom:10px">'+ENCO.exporta.snapshot(m.querySelector('.kpis'))+'</div>'+
      '<h2>Gráficos</h2>'+ENCO.exporta.snapshot(m.querySelector('.charts'))+'</div></div>';
     var cab='<thead><tr><th>Plano</th><th>Ponto de entrega</th><th>Chegada</th><th>Saída</th><th>Tempo gasto</th><th>Acima de 25% da média</th></tr></thead>',tab='',POR=24;
     for(var i=0;i<L.length;i+=POR){tab+='<div>'+(i===0?'<h2>Detalhamento das entregas ('+L.length+(L.length===1?' entrega':' entregas')+')</h2>':'')+'<table>'+cab+'<tbody>'+
      L.slice(i,i+POR).map(function(r){var hi=r.secs>avg*1.25&&rows.length>1;return '<tr><td class="n">'+r.plano+'</td><td>'+e(r.ponto)+'</td><td class="n">'+brt(r.t0)+'</td><td class="n">'+brt(r.t1)+'</td><td class="n"'+(hi?' style="color:#B42318;font-weight:700"':'')+'>'+dur(r.secs)+'</td><td>'+(hi?'Sim':'—')+'</td></tr>'}).join('')+'</tbody></table></div>'}
     if(!L.length)tab='<div><h2>Detalhamento das entregas</h2><p>Nenhuma entrega no período.</p></div>';
     var rod='<footer>Gerado em '+p2(d.getDate())+'/'+p2(d.getMonth()+1)+'/'+d.getFullYear()+' '+p2(d.getHours())+':'+p2(d.getMinutes())+' por Paola Santiago · ENCO – Portal Web</footer>';
     ENCO.exporta.pdf('ENCO-dashboard-'+st.ini+'-a-'+st.fim,painel+tab+rod).then(function(){toast('Relatório PDF do dashboard gerado')})}
    function preset(p){st.preset=p;st.fim=iso(TODAY);st.ini=iso(addDays(TODAY,p==='0'?0:-(+p-1)));st.pg=0;draw()}
    var tip=document.createElement('div');tip.className='ctip';tip.hidden=true;scr.layer.appendChild(tip);
    function showTip(el,ev){var p=el.dataset.tip.split('|');tip.innerHTML='<b>'+esc(p[0])+'</b>'+(p[2]==='0'?'<span>Sem entregas</span>':'<span>Tempo médio <b>'+esc(p[1])+'</b></span><span>'+p[2]+(p[2]==='1'?' entrega':' entregas')+'</span>');tip.hidden=false;
     var r=el.getBoundingClientRect(),x=ev&&ev.clientX?ev.clientX:r.left+r.width/2,y=ev&&ev.clientY?ev.clientY:r.top;tip.style.left=Math.min(window.innerWidth-tip.offsetWidth-8,x+14)+'px';tip.style.top=Math.max(8,y-tip.offsetHeight-10)+'px'}
    var main=$('main');
    main.addEventListener('mousemove',function(e){var t=e.target.closest('[data-tip]');if(!t){tip.hidden=true;var xh=main.querySelector('.xh');if(xh)xh.style.opacity=0;return}showTip(t,e);if(t.dataset.x){var x2=main.querySelector('.xh');x2.setAttribute('x1',t.dataset.x);x2.setAttribute('x2',t.dataset.x);x2.style.opacity=1}});
    main.addEventListener('mouseleave',function(){tip.hidden=true});main.addEventListener('scroll',function(){tip.hidden=true},{passive:true});
    main.addEventListener('focusin',function(e){var t=e.target.closest('[data-tip]');if(t)showTip(t)});main.addEventListener('focusout',function(){tip.hidden=true});
    main.addEventListener('click',function(e){var t;
     if(t=e.target.closest('[data-pre]')){preset(t.dataset.pre);return}
     if(e.target.closest('#fClr')){st.pt='';preset('7');return}
     if(t=e.target.closest('[data-pt]')){st.pt=st.pt===t.dataset.pt?'':t.dataset.pt;st.pg=0;tip.hidden=true;draw();return}
     if(e.target.closest('#btnRel')){relatorio();return}
     if(t=e.target.closest('[data-s]')){var k=t.dataset.s;if(st.sk===k)st.sd=-st.sd;else{st.sk=k;st.sd=k==='secs'||k==='t0'||k==='t1'?-1:1}draw();return}
     if(e.target.closest('#pPrev')){st.pg--;draw();return}if(e.target.closest('#pNext')){st.pg++;draw()}});
    main.addEventListener('change',function(e){var id=e.target.id;
     if(id==='dIni'||id==='dFim'){var v=e.target.value;if(!v)return;if(id==='dIni')st.ini=v;else st.fim=v;if(st.ini>st.fim){if(id==='dIni')st.fim=st.ini;else st.ini=st.fim}st.preset='';st.pg=0;draw();return}
     if(id==='fPt'){st.pt=e.target.value;st.pg=0;draw();return}if(id==='ps'){st.ps=+e.target.value;st.pg=0;draw()}});
    main.addEventListener('input',function(e){if(e.target.id==='q'){st.q=e.target.value;st.pg=0;var c=e.target.selectionStart;draw();var n=$('q');n.focus();n.setSelectionRange(c,c)}});

    draw();
    })();
  }
});
