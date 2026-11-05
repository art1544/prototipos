/* ==========================================================================
   ENCO Portal Web · Tela: Configurações  (rota #configuracoes)
   - template: marcação da tela (o comentário no topo descreve regras e [OBS-xx]).
   - init(root, scr): comportamento. 'scr' isola a tela: scr.byId/qs/qsa buscam
     só dentro da tela, scr.onDoc só dispara com a tela ativa e scr.layer recebe
     modais e toasts. Comunicação entre telas: ENCO.bus (ver assets/js/enco.js).
   ========================================================================== */
ENCO.screen('configuracoes', {
  title: 'Configurações',
  rootClass: '',
  template: `
    <div class="content">
<div class="ghead"><div class="gtop"><div class="icon-tile"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg></div><div><div class="gcrumb">Sistema</div><h1>Configurações</h1><p>Parâmetros do portal e registro do que foi feito por cada usuário.</p></div></div>
<div class="gtabs" role="tablist" aria-label="Configurações"><button class="gtab on" role="tab" aria-selected="true" data-go="configuracoes"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>Tempo de espera</button><button class="gtab" role="tab" aria-selected="false" data-go="logs" tabindex="-1"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M8 6h13M8 12h13M8 18h13"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>Logs do sistema</button></div></div>
<main class="main" id="main"></main>
<footer class="savebar-wrap" id="foot"><div class="savebar"><div class="msg" id="fMsg"></div><div class="spacer"></div><button class="btn btn-s" id="fCancel" disabled>Cancelar</button><button class="btn btn-p" id="fSave" disabled>Salvar configurações</button></div></footer>
</div>
`,
  init: function (root, scr) {
    (function(){
    var $=function(i){return scr.byId(i)};
    function svg(p,s){return '<svg width="'+s+'" height="'+s+'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+p+'</svg>'}
    function esc(t){return String(t).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
    var IC={warnT:'<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
     sync:'<path d="M21 12a9 9 0 0 0-15.5-6.2L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15.5 6.2L21 16"/><path d="M16 16h5v5"/>',
     plus:'<path d="M12 5v14M5 12h14"/>',trash:'<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/>',
     mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
     ok:'<path d="m5 12 5 5 9-10"/>',x:'<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',warn:'<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>'};
    var PS=[{pl:'20260922102211',placa:'QPX4B21',mot:'Marcos Antônio Ribeiro',fim:'22/09/2026 13:05',itens:2,tent:3,err:'SAP não respondeu (timeout)'},
     {pl:'20260921181540',placa:'KLM2D45',mot:'Rafael Souza Prado',fim:'21/09/2026 18:40',itens:4,tent:1,err:'Conexão do app perdida ao finalizar'},
     {pl:'20260921110233',placa:'RTA7C90',mot:'Luciana Ferreira Lima',fim:'21/09/2026 11:58',itens:1,tent:0,err:''}];
    var SEL={},BUSY={},lastSync='28/10/2026 15:42';
    function syncHead(){var n=PS.length;return n?'<a class="syncpill" href="#sec-sync">'+svg(IC.warnT,15)+plural(n,'plano pendente de sincronização','planos pendentes de sincronização')+'</a>':'<span class="syncpill ok">'+svg(IC.ok,15)+'Planos sincronizados</span>'}
    function plural(n,a,b){return n+' '+(n===1?a:b)}
    function syncBox(){var n=PS.length,busy=Object.keys(BUSY).length,ns=PS.filter(function(p){return SEL[p.pl]}).length,all=n&&ns===n;
     var h='<div class="sh"><div><h2>Planos pendentes de sincronização</h2><p class="sub">Planos finalizados no app que ainda não foram enviados ao SAP. Sincronize para concluir o envio.</p></div>'+
      (n?'<button class="btn btn-p" id="syAll"'+(busy?' disabled':'')+'>'+svg(IC.sync,18)+(ns?'Sincronizar '+plural(ns,'selecionado','selecionados'):'Sincronizar todos ('+n+')')+'</button>':'')+'</div>';
     if(!n)return h+'<div class="syempty">'+svg(IC.ok,28)+'<b>Nenhum plano pendente</b><span>Todos os planos foram enviados ao SAP. Última sincronização em '+lastSync+'.</span></div>';
     h+='<div class="ebox"><div class="scols thead" style="padding:12px 20px"><span><label class="cbx"><input type="checkbox" id="syChkAll"'+(all?' checked':'')+(busy?' disabled':'')+' aria-label="Selecionar todos"><i></i></label></span><span>Plano</span><span>Veículo / motorista</span><span>Finalizado em</span><span>Situação</span><span></span></div>';
     PS.forEach(function(p){var b=BUSY[p.pl];h+='<div class="scols srow'+(SEL[p.pl]?' sel':'')+'"><span><label class="cbx"><input type="checkbox" data-sel="'+p.pl+'"'+(SEL[p.pl]?' checked':'')+(busy?' disabled':'')+' aria-label="Selecionar plano '+p.pl+'"><i></i></label></span>'+
      '<span class="stk"><b class="mono">'+p.pl+'</b><small>'+plural(p.itens,'item','itens')+'</small></span>'+
      '<span class="stk"><b><span class="plate2">'+p.placa+'</span></b><small>'+esc(p.mot)+'</small></span>'+
      '<span class="mono" style="font-size:13px;color:#4A4E6A">'+p.fim+'</span>'+
      '<span>'+(b?'<span class="spill busy"><span class="spin"></span>Sincronizando…</span>':p.err?'<span class="spill err" title="'+esc(p.err)+'">'+svg(IC.warnT,13)+'Falhou'+(p.tent>1?' ('+p.tent+' tentativas)':'')+'</span><small class="serr">'+esc(p.err)+'</small>':'<span class="spill wait">'+svg(IC.clock,13)+'Aguardando envio</span>')+'</span>'+
      '<span class="actions"><button class="btn btn-s sm2" data-sy="'+p.pl+'"'+(b||busy?' disabled':'')+'>'+svg(IC.sync,15)+(p.err?'Tentar de novo':'Sincronizar')+'</button></span></div>'});
     return h+'</div><p class="synote">'+svg(IC.info,14)+'A sincronização é feita na hora e não depende do botão "Salvar configurações".</p>'}
    function drawSync(){var b=$('syncBox');if(b)b.innerHTML=syncBox();var hp=$('syncHead');if(hp)hp.innerHTML=syncHead()}
    function runSync(list){list.forEach(function(pl){BUSY[pl]=1});drawSync();
     setTimeout(function(){var ok=list.length;PS=PS.filter(function(p){return list.indexOf(p.pl)<0});list.forEach(function(pl){delete BUSY[pl];delete SEL[pl]});lastSync='28/10/2026 '+new Date().toTimeString().slice(0,5);drawSync();toast(ok===1?'Plano '+list[0]+' sincronizado com o SAP':plural(ok,'plano sincronizado','planos sincronizados')+' com o SAP')},1400)}

    var saved={t:'00:10:00'};
    var d,touched={};
    function clone(o){return JSON.parse(JSON.stringify(o))}
    function load(){d=clone(saved);touched={}}
    function validTime(t){var m=/^(\d{2}):(\d{2}):(\d{2})$/.exec(t);return !!m&&+m[2]<60&&+m[3]<60}
    function fmtTime(raw){var v=raw.replace(/\D/g,'').slice(0,6);var o=v.slice(0,2);if(v.length>2)o+=':'+v.slice(2,4);if(v.length>4)o+=':'+v.slice(4,6);return o}
    function dirty(){return d.t!==saved.t}
    function toast(t){scr.qsa('.toast').forEach(function(o){o.remove()});var x=document.createElement('div');x.className='toast';x.innerHTML=svg(IC.ok,18)+esc(t);scr.layer.appendChild(x);setTimeout(function(){x.remove()},2800)}
    function build(){
     $('main').innerHTML=
     /* Sincronização com o SAP retirada daqui: o reprocessamento fica na Gestão de Planos
        (ícone por plano e lote no card "Não enviados ao SAP"). syncBox/runSync ficam sem uso. */
     /* [REAL] Configuracao "Tempo de Espera" (ConfiguracaoPersistencia.ListarConfiguracaoTempoExtraPadrao):
        é o tempo-base de espera em cada ponto. O "Tempo extra de espera" do cadastro do ponto soma ou
        reduz esse valor, e a redução não pode ser maior que ele (PontoValidador.ValidateTempoExtra). */
     '<section class="card sec-card"><div><h2>Tempo de espera padrão dos pontos de descarga</h2>'+
     '<p class="sub">Tempo que o entregador aguarda em cada ponto de descarga. Vale para todos os pontos; no cadastro de cada ponto, o campo <b>Tempo extra de espera</b> pode aumentar ou reduzir esse tempo, mas a redução não pode ser maior que o valor definido aqui.</p></div>'+
     '<div class="fld"><label class="lbl" for="fTime">Tempo padrão (horas:minutos:segundos) <span class="req">*</span></label><input class="inp time-inp" id="fTime" inputmode="numeric" autocomplete="off" placeholder="00:10:00" maxlength="8" value="'+esc(d.t)+'"><span class="k" id="tHelp" style="font-size:12px;color:#5E627C"></span><span class="ferr" id="eTime"></span></div>'+
     '<div class="hint" style="display:flex;gap:8px;align-items:flex-start;font-size:12px;color:#4A4E6A;background:#F8F8FB;border:1px solid #EEEFF4;border-radius:10px;padding:10px 12px">'+svg(IC.info||'<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',16)+'<span>Exemplo: com <b>00:10:00</b> aqui, um ponto com tempo extra <b>+00:05:00</b> espera 15 minutos; um ponto com <b>-00:04:00</b> espera 6 minutos; <b>-00:12:00</b> não é aceito.</span></div></section>';
     /* "E-mails adicionais" retirado: no código real a tela Angular chama Configuracao/GetAllEmails,
        InserirEmail e ApagarEmail, mas a API não tem essas rotas, o banco não tem tabela para a lista
        e nenhum envio usa cópia (Copia = "" em EnvioEmailEntregaService). */
     $('fTime').addEventListener('input',function(e){var c=fmtTime(e.target.value);e.target.value=c;d.t=c;ui()});
     $('fTime').addEventListener('blur',function(){touched.t=1;ui()});
     ui()}
    function ui(){
     var tm=/^(\d{2}):(\d{2}):(\d{2})$/.exec(d.t),hm=[];if(tm&&validTime(d.t)){if(+tm[1])hm.push(+tm[1]+(+tm[1]===1?' hora':' horas'));if(+tm[2])hm.push(+tm[2]+(+tm[2]===1?' minuto':' minutos'));if(+tm[3])hm.push(+tm[3]+(+tm[3]===1?' segundo':' segundos'))}$('tHelp').textContent=tm&&validTime(d.t)?(hm.length?'Equivale a '+hm.join(' e '):'Sem espera padrão'):'';
     $('eTime').textContent=touched.t&&!validTime(d.t)?(d.t?'Use o formato hh:mm:ss, com minutos e segundos até 59.':'Informe o tempo de espera padrão.'):'';
     var dt=dirty(),ok=validTime(d.t),m=$('fMsg');
     m.className='msg'+(dt?' dirty':'');m.innerHTML=dt?svg(IC.warn,16)+'Alterações ainda não salvas':'Nenhuma alteração pendente';
     $('fSave').disabled=!(dt&&ok);$('fCancel').disabled=!dt}
    $('fCancel').onclick=function(){load();build()};
    $('fSave').onclick=function(){if(!(dirty()&&validTime(d.t)))return;saved=clone(d);load();build();toast('Configurações salvas')};

    load();build();
    })();
  }
});