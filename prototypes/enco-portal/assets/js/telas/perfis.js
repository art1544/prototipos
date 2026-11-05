/* ==========================================================================
   ENCO Portal Web · Tela: Gestão de Perfis  (rota #perfis)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('perfis', {
  title: 'Gestão de Perfis',
  rootClass: '',
  template: `
    <div class="content">
<main class="main">
  <section class="card page-head">
    <div class="icon-tile" style="width:52px;height:52px;background:#FDEBDD;color:#D35A12">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M15 9h3"/><path d="M15 13h3"/><path d="M6 16c.6-1.2 1.7-2 3-2s2.4.8 3 2"/></svg>
    </div>
    <div style="flex-grow:1">
      <h1>Gestão de Perfis</h1>
      <p>Defina o que cada perfil de acesso pode visualizar e editar no portal.</p>
    </div>
  </section>

  <section class="tiles" id="profiles" aria-label="Perfis de acesso"></section>

  <section class="card t-card">
    <div class="t-head">
      <h2 id="pTitle">Permissões</h2>
      <span class="pill" id="pSummary"></span>
      <div class="spacer"></div>
      
    </div>
    <div class="tools" style="padding-top:0">
      <label class="search"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg><input class="inp" id="q" type="search" placeholder="Buscar funcionalidade" aria-label="Buscar funcionalidade"></label>
      <div class="segs" role="group" aria-label="Filtrar por acesso">
        <button class="seg on" data-f="all">Todas</button><button class="seg" data-f="on">Com acesso</button><button class="seg" data-f="off">Sem acesso</button>
      </div>
    </div>
    <div class="hint">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5E627C" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
      <span>Quem pode editar também precisa visualizar: ativar a edição liga a visualização, e desligar a visualização desliga a edição.</span>
    </div>
    <div class="pcols colh" style="border-top:1px solid #EEEFF4"><span>Funcionalidade</span><span class="c">Visualização</span><span class="c">Edição</span></div>
    <div id="rows"></div>
      </section>
</main>
<footer class="savebar-wrap"><div class="savebar">
      <div class="msg" id="saveMsg"></div>
      <div class="spacer"></div>
      <button class="btn btn-s" id="btnDiscard" disabled>Descartar</button>
      <button class="btn btn-p" id="btnSave" disabled>Atualizar perfil</button>
    </div></footer>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)},app=$('app');
    /* [REAL] Funcionalidades = tabela Funcionalidade (ENCO.dominio.funcionalidades). Relatórios e Dashboards
       usam a mesma funcionalidade (13); 'Administrador de perfis' (17) é checada em gestao-perfil.component.ts. */
    var G=[['Operação',[['cp','Gestão de coletas pendentes'],['cs','Gestão de coletas solicitadas'],['pd','Gestão de planos de descarga'],['pt','Gestão de pontos de descarga'],['ro','Gestão de rotas'],['pr','Gestão de prioridades'],['em','Reenviar e-mail de entrega do plano de descarga']]],
    ['Cadastros',[['mp','Gestão de macro pontos'],['tm','Gestão de tipos de movimento'],['tv','Gestão de tipos de veículos'],['ve','Gestão de veículos'],['ar','Gestão de áreas responsáveis']]],
    ['Qualidade e indicadores',[['nc','Gestão de não conformidades'],['rl','Dashboards']]],
    ['Acesso e auditoria',[['us','Gestão de usuários'],['pf','Gestão de perfis'],['ap','Administrador de perfis'],['lg','Visualizar logs']]],
    ['Sistema',[['cf','Configuração']]]];
    /* Feature flag Coletas desligada: some "Gestão de coletas pendentes/solicitadas" */
    if(!ENCO.feature('coletas'))G.forEach(function(g){g[1]=g[1].filter(function(f){return f[0]!=='cp'&&f[0]!=='cs'})});
    if(!ENCO.feature('rotas'))G.forEach(function(g){g[1]=g[1].filter(function(f){return f[0]!=='ro'})});
    var ALL=[];G.forEach(function(g){g[1].forEach(function(f){ALL.push(f[0])})});
    function S(a){var o={};a.forEach(function(k){o[k]=1});return o}
    function but(x){return ALL.filter(function(k){return x.indexOf(k)<0})}
    /* [REAL] Perfis = tabela Perfil + grupos do AD (Documents/README/Acessos-Ternium.md):
         Administrador (CodPerfil 1) · Consultas (2) · Entregadores (3) · Controladores (4).
       Permissões = PerfilFuncionalidade: ter a linha = visualiza; Edicao = 1 = edita.
       Base usada (a carga de PerfilFuncionalidade não está versionada no repositório):
         · insert-dev-user.sql – Admin: gestão de perfis e logs; Entregadores: acesso mobile, veículos e pontos;
           Controladores: veículos, macro pontos, coletas e usuários;
         · 556877-AddFuncReenviarEmail.sql – "Reenviar Email de entrega" com edição só para Controladores;
         · FuncionalidadesNegocio.ListarFuncionalidadesPor8ID – Controlador só vê/edita nas ÁREAS em que está
           vinculado (AreaEntregadorControlador); os demais perfis valem para todas as áreas.
       [OBS-18] Confirmar no banco com:
         SELECT p.Nome, f.Descricao, pf.Edicao FROM PerfilFuncionalidade pf
         JOIN Perfil p ON p.CodPerfil = pf.CodPerfil JOIN Funcionalidade f ON f.CodFuncionalidade = pf.CodFuncionalidade
         ORDER BY p.CodPerfil, f.CodFuncionalidade */
    var P=[
     {id:'Administrador',cod:1,code:'GG_BR_PRD_EntregaColeta_Admin',desc:'Administra perfis e acessos',v:S(['us','pf','ap','lg','cf']),e:S(['pf','ap','cf'])},
     {id:'Consultas',cod:2,code:'GG_BR_PRD_EntregaColeta_Consulta',desc:'Somente leitura',v:S(but(['pf','ap','lg','em'])),e:{}},
     {id:'Controladores',cod:4,code:'GG_BR_PRD_EntregaColeta_Controlador',desc:'Opera os planos da sua área',area:true,v:S(but(['pf','ap','lg'])),e:S(['pd','em','cp','cs','ve','mp','us'])},
     {id:'Entregadores',cod:3,code:'GG_BR_PRD_EntregaColeta_Entregador',desc:ENCO.feature('coletas')?'Executa entregas e coletas (app)':'Executa as entregas (app)',v:S(['pd','pt','ve']),e:S(['pt','ve'])}];
    P.forEach(function(p){p.base={v:Object.assign({},p.v),e:Object.assign({},p.e)}});
    var cur=1,d=null,flt='all',qt='';
    function load(){d={v:Object.assign({},P[cur].v),e:Object.assign({},P[cur].e)}}
    function cnt(o){return Object.keys(o).length}
    function changed(k){var p=P[cur];return !!d.v[k]!==!!p.v[k]||!!d.e[k]!==!!p.e[k]}
    function nChg(){return ALL.filter(changed).length}
    var IC={Administrador:'<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3z"/><path d="m9 12 2 2 4-4"/>',Consultas:'<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',Controladores:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',Entregadores:'<path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>'};
    var COL={Administrador:['#FDEBDD','#D35A12'],Consultas:['#DDF0F2','#1A7A85'],Controladores:['#E9E8F8','#5B55C9'],Entregadores:['#FBE4DA','#B23E0B']}
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function tiles(){$('profiles').innerHTML=P.map(function(p,i){var c=COL[p.id];
     return '<button class="tile ptile'+(i===cur?' active':'')+'" data-i="'+i+'" aria-pressed="'+(i===cur)+'"><span class="top"><span class="ic" style="background:'+c[0]+';color:'+c[1]+'">'+svg(IC[p.id],20)+'</span><span><span class="nm">'+p.id+'</span><br><span class="lab">'+p.desc+'</span></span><span class="chk">'+svg('<path d="m5 12 5 5 9-10"/>',14)+'</span></span><span class="code mono">'+p.code+'</span><span class="meta"><span class="pill">'+cnt(p.v)+' de '+ALL.length+' visualizam</span><span class="pill">'+cnt(p.e)+' editam</span>'+(p.area?'<span class="pill" title="Vale só para as áreas em que o controlador está vinculado">Só nas suas áreas</span>':'')+'</span></button>'}).join('')}
    function sw(k,t,dis,chk,ind,lab){return '<span class="sw"><input type="checkbox" data-k="'+k+'" data-t="'+t+'" aria-label="'+lab+'"'+(chk?' checked':'')+(dis?' disabled':'')+(ind?' data-ind="1"':'')+'><i></i></span>'}
    function rows(){var h='',any=false;
     G.forEach(function(g,gi){var fs=g[1].filter(function(f){var on=d.v[f[0]]||d.e[f[0]];return(!qt||f[1].toLowerCase().indexOf(qt)>=0)&&(flt==='all'||(flt==='on')===!!on)});
      if(!fs.length)return;any=true;
      var ks=fs.map(function(f){return f[0]});var nv=ks.filter(function(k){return d.v[k]}).length,ne=ks.filter(function(k){return d.e[k]}).length;
      /* Linha do grupo só como título: as permissões são ligadas uma a uma */
      h+='<div class="pcols grp"><span class="gn">'+g[0]+'<span class="pill">'+ks.length+'</span></span><span class="c"></span><span class="c"></span></div>';
      fs.forEach(function(f){var k=f[0];h+='<div class="pcols prow'+(changed(k)?' chg':'')+'"><span>'+f[1]+'</span><span class="c">'+sw(k,'v',false,d.v[k],0,'Visualização: '+f[1])+'</span><span class="c">'+sw(k,'e',false,d.e[k],0,'Edição: '+f[1])+'</span></div>'})});
     if(!any)h='<div class="empty"><b>Nenhuma funcionalidade encontrada</b><span style="color:#5E627C;font-size:14px">Ajuste a busca ou o filtro de acesso.</span></div>';
     $('rows').innerHTML=h;$('rows').querySelectorAll('[data-ind]').forEach(function(i){i.indeterminate=true})}
    function head(){var p=P[cur];$('pTitle').textContent='Permissões do perfil '+p.id;$('pSummary').textContent=cnt(d.v)+' de '+ALL.length+' visualizam · '+cnt(d.e)+' editam'+(p.area?' · só nas áreas do controlador':'');
     var n=nChg(),m=$('saveMsg');m.className='msg'+(n?' dirty':'');m.innerHTML=n?svg('<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',16)+n+(n>1?' funcionalidades alteradas, ainda não salvas':' funcionalidade alterada, ainda não salva'):'Nenhuma alteração pendente';
     $('btnSave').disabled=$('btnDiscard').disabled=!n}
    function draw(){tiles();rows();head()}
    function modal(t,b,f){var m=document.createElement('div');m.className='modal-bg';m.innerHTML='<div class="modal" role="dialog" aria-modal="true" aria-label="'+t+'"><div class="mh"><h3>'+t+'</h3><button class="ib" data-x aria-label="Fechar">'+svg('<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',20)+'</button></div><div class="mb">'+b+'</div>'+(f?'<div class="mf">'+f+'</div>':'')+'</div>';
     m.addEventListener('click',function(e){if(e.target===m||e.target.closest('[data-x]'))m.remove()});scr.layer.appendChild(m);return m}
    function toast(t){var x=document.createElement('div');x.className='toast';x.innerHTML=svg('<path d="m5 12 5 5 9-10"/>',18)+t;scr.layer.appendChild(x);setTimeout(function(){x.remove()},2800)}
    function go(i){cur=i;load();draw()}
    $('profiles').addEventListener('click',function(e){var t=e.target.closest('.tile');if(!t)return;var i=+t.dataset.i;if(i===cur)return;
     if(!nChg()){go(i);return}
     var m=modal('Descartar alterações?','Você tem alterações não salvas no perfil <b>'+P[cur].id+'</b>. Se trocar de perfil agora, elas serão perdidas.','<button class="btn btn-s" data-x>Continuar editando</button><button class="btn btn-p" id="ok">Descartar e trocar</button>');
     m.querySelector('#ok').onclick=function(){m.remove();go(i)}});
    $('rows').addEventListener('change',function(e){var c=e.target,k=c.dataset.k,t=c.dataset.t;if(!t)return;
     if(t==='gv'||t==='ge'){G[k][1].forEach(function(f){var fk=f[0];if(t==='gv'){if(c.checked)d.v[fk]=1;else{delete d.v[fk];delete d.e[fk]}}else if(c.checked){d.e[fk]=1;d.v[fk]=1}else delete d.e[fk]})}
     else if(t==='v'){if(c.checked)d.v[k]=1;else{delete d.v[k];delete d.e[k]}}
     else{if(c.checked){d.e[k]=1;d.v[k]=1}else delete d.e[k]}
     var y=$('rows').scrollTop;rows();head()});
    $('q').addEventListener('input',function(e){qt=e.target.value.trim().toLowerCase();rows()});
    scr.qsa('.seg').forEach(function(b){b.addEventListener('click',function(){flt=b.dataset.f;scr.qsa('.seg').forEach(function(x){x.classList.toggle('on',x===b)});rows()})});
    $('btnDiscard').onclick=function(){load();draw()};
    $('btnSave').onclick=function(){var p=P[cur],n=nChg();p.v=Object.assign({},d.v);p.e=Object.assign({},d.e);draw();toast('Perfil '+p.id+' atualizado ('+n+(n>1?' alterações':' alteração')+')')};

    load();draw();
    })();
  }
});
