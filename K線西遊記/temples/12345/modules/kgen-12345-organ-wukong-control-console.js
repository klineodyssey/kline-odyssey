/*
============================================================
FILE_CERTIFICATE
PRODUCT_ID: KGEN-12345-HEART-UI
FILE_ID: kgen-12345-organ-wukong-control-console.js
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BIRTH: 2026-05-20
STATUS: ACTIVE
PURPOSE: Wukong control console organ runtime.
============================================================
*/
/*
============================================================
ORGAN_CERTIFICATE:
  FILE: modules/kgen-12345-organ-wukong-control-console.js
  ORGAN_ID: ORGAN_12345_WUKONG_CONTROL_CONSOLE
  ORGAN_NAME: 五指山12345｜悟空財神殿控制台
  VERSION: ORGAN-V1.1.0 / HOST-V10.42.10
  BUILD: 20260520-ORGAN-WUKONG-CONTROL-CONSOLE-NERVE-CONVERGENCE
  BIRTH: 2026-05-20
  BASE_FROM: V10.42.7 newborn organ; nerve path converged from /modules/organs/ to /modules root
  DEATH: ACTIVE
  STATUS: ACTIVE_DEATH_CELL_CLEANED
  DNA:
    role: main control console
    controls: wallet / fortune / wish-vow-lamp / grail / rule-panel / runtime-check
    official_assets: bull-front.png / bear-rear.png / heart.png / warp-core.png
  TRANSPLANT_POLICY:
    This organ is not copied from old DOM blocks. It routes to existing functions safely when available.
============================================================
*/
(function(){
  'use strict';
  const CERT={
    ORGAN_ID:'ORGAN_12345_WUKONG_CONTROL_CONSOLE',
    ORGAN_NAME:'五指山12345｜悟空財神殿控制台',
    VERSION:'ORGAN-V1.1.0 / HOST-V10.42.10',
    BUILD:'20260520-ORGAN-WUKONG-CONTROL-CONSOLE-DEATH-CELL-CLEANUP',
    BIRTH:'2026-05-20',
    BASE_FROM:'V10.42.7_SELF_CREATED_ORGAN__V10.42.8_NERVE_CONVERGENCE',
    DEATH:'ACTIVE',
    DNA_HASH:'KGEN-12345-WUKONG-CONSOLE-V1-2-DEATH-CELL-CLEANED',
    DEPENDENCIES:['kgen-12345-organ-system.js','kgen-12345-organ-system.css','existing app/web3/templeOps when present'],
    ASSETS:['bull-front.png','bear-rear.png','heart.png','warp-core.png']
  };
  function el(tag,cls,txt){const e=document.createElement(tag); if(cls)e.className=cls; if(txt!=null)e.textContent=txt; return e;}
  function callAny(paths,args){
    for(const p of paths){
      try{
        const parts=p.split('.'); let ctx=window;
        for(let i=0;i<parts.length-1;i++) ctx=ctx&&ctx[parts[i]];
        const fn=ctx&&ctx[parts[parts.length-1]];
        if(typeof fn==='function'){ return fn.apply(ctx,args||[]); }
      }catch(e){console.warn('[Organ route failed]',p,e);}
    }
    try{ if(window.ui&&ui.toast) ui.toast('器官路由尚未接到：'+paths[0]); }catch(e){}
  }
  function factory(api){
    let panel=null, logBox=null, collapsed=false;
    const log=(m)=>{api.system.event('ORGAN_LOG',CERT.ORGAN_ID,m); if(logBox){const d=el('div',null,new Date().toLocaleTimeString()+'｜'+m); logBox.prepend(d); while(logBox.children.length>8) logBox.lastChild.remove();}};
    const makeButton=(label,cls,fn)=>{const b=el('button','kgen-organ-main-btn '+(cls||''),label); b.type='button'; b.onclick=()=>{log(label); api.safeCall(label,fn);}; return b;};
    function build(){
      panel=el('section','kgen-organ-console'); panel.id='organ-12345-wukong-control-console'; panel.setAttribute('data-organ-id',CERT.ORGAN_ID);
      const head=el('div','kgen-organ-head');
      const titleWrap=el('div');
      titleWrap.appendChild(el('div','kgen-organ-title','五指山12345｜悟空財神殿控制台'));
      titleWrap.appendChild(el('div','kgen-organ-sub','ORGAN-V1.1.0｜神經收斂｜非深層資料夾'));
      const actions=el('div','kgen-organ-actions');
      const exportBtn=el('button','kgen-organ-btn','履歷'); exportBtn.onclick=()=>api.system.exportHistory();
      const collapseBtn=el('button','kgen-organ-btn','收合'); collapseBtn.onclick=()=>toggle(true);
      actions.append(exportBtn,collapseBtn); head.append(titleWrap,actions);
      const body=el('div','kgen-organ-body');
      const cert=el('div','kgen-organ-cert');
      cert.innerHTML='<b>出生證明</b><br>ORGAN_ID：'+CERT.ORGAN_ID+'<br>VERSION：'+CERT.VERSION+'<br>BIRTH：'+CERT.BIRTH+'<br>DEATH：ACTIVE<br>DNA：自創控制台，不複製舊器官；V10.42.8 起神經收斂到 modules 根層，避免深層器官半身不遂。';
      const health=el('div','kgen-organ-health');
      health.innerHTML='<span>Wallet</span><span id="organ-wallet-state">偵測中</span><span>Heart</span><span>fortune / heartbeat / ignite</span><span>Panel</span><span>可開合 / 可死亡 / 可復活</span><span>Assets</span><span>bull-front / bear-rear / heart / warp-core</span>';
      const grid=el('div','kgen-organ-grid');
      grid.append(
        makeButton('連結錢包','gold',()=>callAny(['web3.smartConnect','web3.connect'])),
        makeButton('發財金','green',()=>callAny(['templeSingleModal.openTab','templeOps.fortune'],['fortune'])),
        makeButton('許願還願點燈','gold',()=>callAny(['templeSingleModal.openTab','app.openGuide'],['playbook'])),
        makeButton('三聖盃','',()=>callAny(['templeOps.cup','app.openGuide'],['rules'])),
        makeButton('規則活動','purple',()=>callAny(['app.openUnifiedGuide','app.openGuide'],['playbook'])),
        makeButton('右側神規','purple',()=>callAny(['app.updateCoordPanel','app.openGuide'],['rules'])),
        makeButton('語音客服','',()=>callAny(['app.playTempleIntro','app.openGuide'],['intro'])),
        makeButton('器官體檢','green',()=>runtimeCheck())
      );
      logBox=el('div','kgen-organ-log'); logBox.appendChild(el('div',null,'器官出生完成，等待操作。'));
      body.append(cert,health,grid,logBox); panel.append(head,body); document.body.appendChild(panel);
      updateWalletState(); setInterval(updateWalletState,5000);
    }
    function updateWalletState(){
      const n=document.getElementById('organ-wallet-state'); if(!n)return;
      const addr=(window.web3&&web3.addr)||(document.getElementById('w3-addr')&&document.getElementById('w3-addr').textContent)||'未連線';
      n.textContent=addr&&addr.length>14?addr.slice(0,6)+'…'+addr.slice(-4):addr;
    }
    function runtimeCheck(){
      const checks=[['app',!!window.app],['web3',!!window.web3],['templeOps',!!window.templeOps],['ui',!!window.ui],['organSystem',!!window.KGENOrganSystem]];
      log('Runtime 體檢：'+checks.map(x=>x[0]+'='+(x[1]?'OK':'--')).join(' / '));
      api.toast('器官體檢完成');
    }
    function toggle(forceClose){
      if(!panel) build();
      collapsed=forceClose===true?!0:!collapsed;
      panel.dataset.collapsed=collapsed?'true':'false';
      if(collapsed) api.system.dormant(CERT.ORGAN_ID); else api.system.event('RESURRECT',CERT.ORGAN_ID,'open panel');
    }
    return {mount(){if(!panel)build(); panel.dataset.collapsed='false'; collapsed=false; log('ACTIVE');},dormant(){if(panel)panel.dataset.collapsed='true'; collapsed=true;},death(reason){if(panel)panel.remove(); panel=null; log('DEAD '+(reason||''));},toggle};
  }
  function register(){
    if(!window.KGENOrganSystem) return setTimeout(register,80);
    window.KGENOrganSystem.register(CERT,factory);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',register); else register();
})();
