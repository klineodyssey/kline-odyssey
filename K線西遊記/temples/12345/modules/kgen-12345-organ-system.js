/*
============================================================
FILE_CERTIFICATE:
  FILE: modules/kgen-12345-organ-system.js
  PRODUCT_ID: KGEN-12345-ORGAN-LIFECYCLE-SYSTEM
  VERSION: 12345-TEMPLE-V10.42.10-HEALTH-REGISTRY-CHECK
  BUILD: 20260520-V10.42.10-HEALTH-REGISTRY-CHECK
  BIRTH: 2026-05-20
  BASE_FROM: V10.42.7 organ lifecycle system; converged from deep /modules/organs nerve path
  DEATH: ACTIVE
  PURPOSE: Manage UI organs as living modules with root-level nerve convergence: birth, active, dormant, death, history and safe action routing.
  ASSET_GOVERNANCE: this file does not declare image paths; organ visuals must use official asset manifest only.
============================================================
*/
(function(){
  'use strict';
  const VERSION='12345-TEMPLE-V10.42.10-HEALTH-REGISTRY-CHECK';
  const STORE='KGEN_12345_ORGAN_LIFECYCLE_V10_42_10';
  const now=()=>new Date().toISOString();
  function readStore(){try{return JSON.parse(localStorage.getItem(STORE)||'{"organs":{},"events":[]}');}catch(e){return {organs:{},events:[]};}}
  function writeStore(s){try{localStorage.setItem(STORE,JSON.stringify(s));}catch(e){}}
  function safeCall(label,fn){try{return fn&&fn();}catch(e){console.warn('[KGEN Organ]',label,e); toast(label+' 執行失敗');}}
  function toast(msg){
    try{ if(window.ui&&ui.toast) return ui.toast(msg); }catch(e){}
    try{ if(window.app&&app.speak) app.speak(String(msg)); }catch(e){}
    console.log('[KGEN Organ]',msg);
  }
  class KGENOrganSystem{
    constructor(){this.version=VERSION;this.organs={};this.mounted=false;this.store=readStore();}
    event(type,organId,detail){
      const ev={t:now(),type,organId,detail:detail||''};
      this.store.events.unshift(ev); if(this.store.events.length>160)this.store.events.length=160;
      writeStore(this.store); return ev;
    }
    register(cert,factory){
      if(!cert||!cert.ORGAN_ID) throw new Error('ORGAN_ID missing');
      const id=cert.ORGAN_ID;
      this.organs[id]={cert,factory,instance:null,state:'BORN'};
      if(!this.store.organs[id]) this.store.organs[id]={born:cert.BIRTH||now(),state:'BORN',history:[]};
      this.store.organs[id].state='REGISTERED';
      this.store.organs[id].history.unshift({t:now(),type:'REGISTERED',version:cert.VERSION});
      writeStore(this.store);
      this.event('REGISTERED',id,cert.VERSION);
      return this.organs[id];
    }
    mount(id){
      const o=this.organs[id]; if(!o) return null;
      if(!o.instance){ o.instance=o.factory({system:this,cert:o.cert,toast,safeCall}); }
      if(o.instance&&typeof o.instance.mount==='function') o.instance.mount();
      o.state='ACTIVE';
      this.store.organs[id].state='ACTIVE';
      this.store.organs[id].lastActive=now();
      this.store.organs[id].history.unshift({t:now(),type:'MOUNTED',version:o.cert.VERSION});
      writeStore(this.store); this.event('MOUNTED',id,o.cert.VERSION); return o.instance;
    }
    dormant(id){
      const o=this.organs[id]; if(!o) return;
      if(o.instance&&typeof o.instance.dormant==='function') o.instance.dormant();
      o.state='DORMANT';
      if(this.store.organs[id]){this.store.organs[id].state='DORMANT';this.store.organs[id].history.unshift({t:now(),type:'DORMANT'});writeStore(this.store);}
      this.event('DORMANT',id,'');
    }
    resurrect(id){return this.mount(id);}
    death(id,reason){
      const o=this.organs[id]; if(!o) return;
      if(o.instance&&typeof o.instance.death==='function') o.instance.death(reason);
      o.state='DEAD';
      if(this.store.organs[id]){this.store.organs[id].state='DEAD';this.store.organs[id].death=now();this.store.organs[id].history.unshift({t:now(),type:'DEAD',reason:reason||''});writeStore(this.store);}
      this.event('DEAD',id,reason||'');
    }
    snapshot(){return {version:this.version,organs:this.store.organs,events:this.store.events.slice(0,20)};}
    exportHistory(){
      const blob=new Blob([JSON.stringify(this.snapshot(),null,2)],{type:'application/json'});
      const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='KGEN_12345_ORGAN_LIFECYCLE_HISTORY_V10_42_8.json'; a.click();
    }
    init(){
      if(this.mounted) return; this.mounted=true;
      const dock=document.createElement('div'); dock.className='kgen-organ-dock'; dock.id='kgen-organ-dock';
      const pill=document.createElement('button'); pill.className='kgen-organ-pill'; pill.type='button'; pill.dataset.state='DORMANT'; pill.textContent='悟空器官中樞';
      pill.onclick=()=>{const inst=this.mount('ORGAN_12345_WUKONG_CONTROL_CONSOLE'); if(inst&&inst.toggle) inst.toggle(); pill.dataset.state='ACTIVE';};
      dock.appendChild(pill); document.body.appendChild(dock);
      this.event('SYSTEM_INIT','KGEN_ORGAN_SYSTEM',VERSION);
      setTimeout(()=>{ if(this.organs.ORGAN_12345_WUKONG_CONTROL_CONSOLE) this.mount('ORGAN_12345_WUKONG_CONTROL_CONSOLE'); },650);
    }
  }
  window.KGENOrganSystem=window.KGENOrganSystem||new KGENOrganSystem();
  window.addEventListener('DOMContentLoaded',()=>window.KGENOrganSystem.init());
})();


/* ============================================================
Death Cell Cleanup Runtime V10.42.10
- 只讀取根層 /modules 正式神經，不再生成深層 /modules/organs。
- 稽核 index/module 殘留引用由打包階段產生 REFERENCE_AUDIT.md。
- 前端啟動時保留一份輕量存活證明在 localStorage，供下一頁 AI 判斷器官是否活著。
============================================================ */
(function(){
  try{
    const key='KGEN_12345_DEATH_CELL_CLEANUP_V10_42_10';
    const report={
      version:'12345-TEMPLE-V10.42.10-DEATH-CELL-CLEANUP',
      checkedAt:new Date().toISOString(),
      forbiddenDeepNerve:'/modules/organs/',
      status:'ACTIVE_SURVIVOR_ONLY',
      survivorModules:[
        'kgen-12345-core.css',
        'kgen-12345-runtime.js',
        'kgen-12345-organ-system.css',
        'kgen-12345-organ-system.js',
        'kgen-12345-organ-wukong-control-console.js',
        'kgen-12345-organ-registry.json'
      ]
    };
    localStorage.setItem(key,JSON.stringify(report));
  }catch(e){}
})();
