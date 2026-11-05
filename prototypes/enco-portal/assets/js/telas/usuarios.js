/* ==========================================================================
   ENCO Portal Web · Tela: Usuários  (rota #usuarios)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('usuarios', {
  title: 'Usuários',
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
    var IC={users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
     search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',l:'<path d="m15 18-6-6 6-6"/>',r:'<path d="m9 18 6-6-6-6"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
     chk:'<path d="m5 12 5 5 9-10"/>',eye:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
     sort:'<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',up:'<path d="m18 15-6-6-6 6"/>',dn:'<path d="m6 9 6 6 6-6"/>',
     Administrador:'<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/>',
     Consultas:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
     Controladores:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
     Entregadores:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'};
    var PR=[{id:'Administrador',desc:'Administra perfis e acessos',bg:'#FDEBDD',ic:'#D35A12',fg:'#8F330A'},
     {id:'Consultas',desc:'Somente leitura',bg:'#DDF0F2',ic:'#1A7A85',fg:'#115A63'},
     {id:'Controladores',desc:'Opera os planos da sua área',bg:'#E9E8F8',ic:'#5B55C9',fg:'#4339A8'},
     {id:'Entregadores',desc:ENCO.feature('coletas')?'Executa entregas e coletas (app)':'Executa as entregas (app)',bg:'#FBE4DA',ic:'#B23E0B',fg:'#8A2E07'}];
    var PB={};PR.forEach(function(p){PB[p.id]=p});
    /* Base única de usuários (data/db.json → usuarios): nome e 8ID vêm do AD; telefone e e-mail são
       cadastrados no portal e só podem ser editados aqui (detalhe do usuário). */
    var U=ENCO.usuarios;
    var q='',fp='',sk='nome',sd=1,ps=10,pg=0;
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function ini(n){var a=n.split(' ');return (a[0][0]+a[a.length-1][0]).toUpperCase()}
    function badge(p){var b=PB[p];return '<span class="pb" style="background:'+b.bg+';color:'+b.fg+'">'+svg(IC[p],13)+p+'</span>'}
    function rows(){var t=q.trim().toLowerCase();return U.filter(function(u){return(!fp||u.p.indexOf(fp)>=0)&&(!t||u.id.toLowerCase().indexOf(t)>=0||u.nome.toLowerCase().indexOf(t)>=0||u.cel.indexOf(t)>=0||u.email.toLowerCase().indexOf(t)>=0)}).sort(function(a,b){var x=sk==='id'?a.id:a.nome,y=sk==='id'?b.id:b.nome;return sd*x.localeCompare(y,'pt',{numeric:true})})}
    function go(v){ENCO.bus.emit({enco:v})}
    function sortHead(k,l){var on=sk===k;return '<button class="sortb'+(on?' on':'')+'" data-s="'+k+'" aria-label="Ordenar por '+l+'">'+l+svg(on?(sd===1?IC.up:IC.dn):IC.sort,14)+'</button>'}
    function draw(){var all=rows(),pages=Math.max(1,Math.ceil(all.length/ps));if(pg>=pages)pg=pages-1;var list=all.slice(pg*ps,pg*ps+ps);
     var h='<section class="card page-head"><div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">'+svg(IC.users,26)+'</div><div style="flex-grow:1"><h1>Usuários</h1><p>Consulte quem tem acesso ao portal e quais perfis cada pessoa possui. Telefone e e-mail são editados aqui.</p></div></section>';
     h+='<section class="tiles" aria-label="Filtrar por perfil">'+PR.map(function(p){var n=U.filter(function(u){return u.p.indexOf(p.id)>=0}).length;
      return '<button class="tile ptile'+(fp===p.id?' active':'')+'" data-f="'+p.id+'" aria-pressed="'+(fp===p.id)+'"><span class="top"><span class="ic" style="background:'+p.bg+';color:'+p.ic+'">'+svg(IC[p.id],20)+'</span><span><span class="nm">'+p.id+'</span><br><span class="lab">'+p.desc+'</span></span><span class="chk">'+svg(IC.chk,14)+'</span></span><span class="meta"><span class="pill">'+plural(n,'usuário','usuários')+'</span></span></button>'}).join('')+'</section>';
     h+='<section class="card t-card"><div class="tools"><label class="search">'+svg(IC.search,18)+'<input class="inp" id="q" type="search" placeholder="Pesquisar por 8ID, nome, telefone ou e-mail" aria-label="Pesquisar usuário" value="'+esc(q)+'"></label>'+
      (fp?'<span class="pill filter">Perfil: '+fp+'<button class="ib" id="clr" aria-label="Limpar filtro de perfil">'+svg(IC.x,14)+'</button></span>':'')+'<span class="pill">'+plural(all.length,'usuário','usuários')+'</span></div>'+
      '<div class="ucols thead"><span aria-sort="'+(sk==='id'?(sd===1?'ascending':'descending'):'none')+'">'+sortHead('id','8ID')+'</span><span aria-sort="'+(sk==='nome'?(sd===1?'ascending':'descending'):'none')+'">'+sortHead('nome','Nome')+'</span><span>Telefone</span><span>E-mail</span><span>Perfis associados</span><span></span></div>';
     if(!list.length)h+='<div class="empty"><b>Nenhum usuário encontrado</b><span style="color:#5E627C;font-size:14px">Ajuste a pesquisa ou o filtro de perfil.</span></div>';
     list.forEach(function(u){h+='<div class="ucols urow" tabindex="0" role="button" data-u="'+esc(u.id)+'" aria-label="Ver detalhes de '+esc(u.nome)+'"><span class="mono">'+esc(u.id)+'</span><span class="uname"><span class="uav">'+ini(u.nome)+'</span><b>'+esc(u.nome)+'</b></span><span class="ucel">'+(u.cel?esc(u.cel):'<span class="usem">Sem telefone</span>')+'</span><span class="umail">'+(u.email?esc(u.email):'<span class="usem">Sem e-mail</span>')+'</span><span class="pbadges">'+u.p.map(badge).join('')+'</span><span class="actions"><span class="ib" aria-hidden="true">'+svg(IC.r,18)+'</span></span></div>'});
     var from=all.length?pg*ps+1:0,to=Math.min(all.length,pg*ps+ps);
     h+='<div class="pager"><label>Itens por página <select id="ps" aria-label="Itens por página">'+[10,25,50].map(function(n){return '<option'+(n===ps?' selected':'')+'>'+n+'</option>'}).join('')+'</select></label><span>'+from+'–'+to+' de '+all.length+'</span><span><button class="ib" id="pPrev" aria-label="Página anterior"'+(pg===0?' disabled':'')+'>'+svg(IC.l,18)+'</button><button class="ib" id="pNext" aria-label="Próxima página"'+(pg>=pages-1?' disabled':'')+'>'+svg(IC.r,18)+'</button></span></div></section>';
     var sc=$('main').scrollTop;$('main').innerHTML=h;$('main').scrollTop=sc}
    function fmtPhone(v){var d=v.replace(/\D/g,'').slice(0,11);if(!d)return '';if(d.length<3)return '('+d;var o='('+d.slice(0,2)+') ';var r=d.slice(2);if(r.length>5&&d.length===11)return o+r.slice(0,5)+'-'+r.slice(5);if(r.length>4)return o+r.slice(0,4)+'-'+r.slice(4);return o+r}
    function vMail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)}
    function toast(t){scr.qsa('.toast').forEach(function(o){o.remove()});var x=document.createElement('div');x.className='toast';x.textContent=t;scr.layer.appendChild(x);setTimeout(function(){x.remove()},2800)}
    /* Detalhe do usuário. Nome e 8ID (AD) são só leitura; telefone e e-mail são editados aqui.
       origem = 'pontos' quando veio do cadastro de contato do ponto de descarga: ao salvar ou fechar, volta para lá. */
    var origem='';
    function fecharDetalhe(m){m.remove();if(origem){var o=origem;origem='';go(o)}}
    function detail(id,foco){var u=U.filter(function(x){return x.id===id})[0];if(!u)return;
     var d={cel:u.cel,email:u.email},tc={};
     var m=document.createElement('div');m.className='modal-bg';
     m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="Detalhes de '+esc(u.nome)+'"><div class="mh"><h3>Detalhes do usuário</h3><button class="ib" data-x aria-label="Fechar">'+svg(IC.x,20)+'</button></div><div class="mb"><div class="dhead"><span class="uav">'+ini(u.nome)+'</span><span><b>'+esc(u.nome)+'</b><small class="mono">8ID: '+esc(u.id)+'</small></span></div>'+
     '<p class="adnote">O usuário e o perfil são cadastrados pelo time de segurança no AD. Aqui só se editam telefone e e-mail.</p>'+
     (origem?'<p class="orinote">Você veio do cadastro de contato do ponto de descarga. Ao salvar, voltamos para lá com os dados atualizados.</p>':'')+
     '<div class="lbl" style="margin-top:14px">Contato</div><div class="ufields">'+
     '<label class="fld"><span class="lbl">Telefone</span><input class="inp" id="uCel" inputmode="tel" autocomplete="off" maxlength="15" placeholder="(21) 99999-9999" value="'+esc(d.cel)+'"><span class="ferr" id="e-uCel"></span></label>'+
     '<label class="fld"><span class="lbl">E-mail</span><input class="inp" id="uMail" type="email" autocomplete="off" maxlength="100" placeholder="nome@empresa.com.br" value="'+esc(d.email)+'"><span class="ferr" id="e-uMail"></span></label></div>'+
     '<p class="uhelp">Usados nos avisos por SMS e e-mail dos pontos de descarga em que a pessoa é contato.</p>'+
     '<div class="lbl" style="margin-top:14px">Perfis associados ('+u.p.length+')</div>'+u.p.map(function(p){var b=PB[p];return '<div class="dprof"><span class="ic" style="background:'+b.bg+';color:'+b.ic+'">'+svg(IC[p],20)+'</span><div><b>'+p+'</b><p>'+b.desc+'</p></div></div>'}).join('')+'</div><div class="mf"><button class="btn btn-g" id="goP">'+svg(IC.eye,16)+'Ver permissões dos perfis</button><span style="flex-grow:1"></span><button class="btn btn-s" data-x>'+(origem?'Voltar sem salvar':'Fechar')+'</button><button class="btn btn-p" id="uSave" disabled>Salvar contato</button></div></div>';
     scr.layer.appendChild(m);
     function q1(s){return m.querySelector(s)}
     function cv(){var cd=d.cel.replace(/\D/g,''),e={uCel:d.cel&&(cd.length<10)?'Informe o DDD e o número do telefone.':'',uMail:d.email.trim()&&!vMail(d.email.trim())?'Informe um e-mail válido, como nome@empresa.com.br.':''};
      Object.keys(e).forEach(function(k){var show=tc[k]&&e[k];q1('#e-'+k).textContent=show?e[k]:'';q1('#'+k).classList.toggle('err',!!show)});
      q1('#uSave').disabled=!(!e.uCel&&!e.uMail&&(d.cel!==u.cel||d.email.trim()!==u.email));return !e.uCel&&!e.uMail}
     q1('#uCel').addEventListener('input',function(e){e.target.value=fmtPhone(e.target.value);d.cel=e.target.value;cv()});
     q1('#uMail').addEventListener('input',function(e){d.email=e.target.value;cv()});
     ['uCel','uMail'].forEach(function(k){q1('#'+k).addEventListener('blur',function(){tc[k]=1;cv()})});
     function save(){tc.uCel=tc.uMail=1;if(!cv()||q1('#uSave').disabled)return;ENCO.atualizarUsuario(u.id,{cel:d.cel,email:d.email.trim()});draw();toast('Contato de '+u.nome+' atualizado');fecharDetalhe(m)}
     q1('#uSave').onclick=save;
     m.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();save()}});
     m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-x]'))fecharDetalhe(m)});
     q1('#goP').onclick=function(){origem='';m.remove();go('perfis')};
     cv();var f=q1(foco==='email'?'#uMail':foco?'#uCel':'.ib');f.focus();if(foco)f.select()}
    scr.onDoc('keydown',function(e){if(e.key==='Escape'){var m=scr.qs('.modal-bg');if(m)fecharDetalhe(m)}});
    /* Vindo do cadastro de contato do ponto: abre o detalhe do usuário já no campo de telefone */
    ENCO.bus.on(function(e){var x=e.data&&e.data.editarUsuario;if(!x)return;
     var o=scr.qs('.modal-bg');if(o)o.remove();
     origem=e.data.origem||'';q='';fp='';var i=rows().map(function(u){return u.id}).indexOf(x);pg=i<0?0:Math.floor(i/ps);draw();
     setTimeout(function(){detail(x,e.data.campo||'cel')},60)});
    var main=$('main');
    main.addEventListener('click',function(e){var t;
     if(t=e.target.closest('[data-f]')){fp=fp===t.dataset.f?'':t.dataset.f;pg=0;draw();return}
     if(e.target.closest('#clr')){fp='';pg=0;draw();return}
     if(t=e.target.closest('[data-s]')){var k=t.dataset.s;if(sk===k)sd=-sd;else{sk=k;sd=1}draw();return}
     if(e.target.closest('#pPrev')){pg--;draw();return}if(e.target.closest('#pNext')){pg++;draw();return}
     if(t=e.target.closest('[data-u]'))detail(t.dataset.u)});
    main.addEventListener('keydown',function(e){var t=e.target.closest&&e.target.closest('[data-u]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();detail(t.dataset.u)}});
    main.addEventListener('input',function(e){if(e.target.id==='q'){q=e.target.value;pg=0;var c=e.target.selectionStart;draw();var n=$('q');n.focus();n.setSelectionRange(c,c)}});
    main.addEventListener('change',function(e){if(e.target.id==='ps'){ps=+e.target.value;pg=0;draw()}});

    draw();
    })();
  }
});