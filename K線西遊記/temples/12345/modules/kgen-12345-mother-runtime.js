/*
============================================================
FILE_CERTIFICATE:
  FILE: modules/kgen-12345-mother-runtime.js
  PRODUCT_ID: KGEN-12345-PRIMEFORGE-MOTHER-RUNTIME
  VERSION: 12345-TEMPLE-V10.44.0-PRIMEFORGE-MOTHER-RUNTIME-GROWTH
  BUILD: 20260520-V10.44.0-MOTHER-RUNTIME-GROWTH
  BIRTH: 2026-05-20
  BASE_FROM: KGEN_12345_V10_42_6_V10_2_MODULAR_ASSET_GOVERNANCE
  PURPOSE: AI 母機自動導行、生長治理、細胞戶口、器官生命週期觀測
  DEATH: ACTIVE
  GOVERNANCE:
    - 本檔為母機導行層，不直接接管 UI 主神經。
    - 本檔只觀測、登記、提示，不覆寫既有畫面排版。
    - 新器官必須先登記於 cell-registry / growth-policy，再由 index 明確載入。
    - 正式資產固定使用 bull-front.png / bear-rear.png / heart.png / warp-core.png。
    - 禁止 patch/hotfix/temp/copy/backup 成為正式 Runtime。
============================================================
*/
(function(){
  'use strict';
  const SELF={
    id:'KGEN_12345_MOTHER_RUNTIME',
    version:'V10.44.0',
    build:'20260520-V10.44.0-MOTHER-RUNTIME-GROWTH',
    mode:'observer-only',
    required:[
      'index.html','modules/kgen-12345-core.css','modules/kgen-12345-runtime.js',
      'modules/kgen-12345-mother-runtime.js','modules/kgen-12345-cell-registry.json',
      'modules/kgen-12345-growth-policy.json','assets/bull-front.png','assets/bear-rear.png',
      'assets/heart.png','assets/warp-core.png','VERSION','ASSET_MANIFEST.md','PROGRAM_HISTORY.md'
    ],
    forbidden:/patch|hotfix|temp|copy|backup|fix2|ultimate|stable/i
  };
  function q(id){return document.getElementById(id)}
  function ensureHud(){
    let hud=q('kgen-mother-runtime-hud');
    if(hud) return hud;
    hud=document.createElement('div');
    hud.id='kgen-mother-runtime-hud';
    hud.setAttribute('data-kgen-organ','mother-runtime');
    hud.innerHTML='<b>PRIMEFORGE MOTHER</b><br><span>booting autonomous navigation…</span>';
    const css=document.createElement('style');
    css.textContent=`#kgen-mother-runtime-hud{position:fixed;right:10px;bottom:74px;z-index:2147483000;max-width:260px;padding:8px 10px;border:1px solid rgba(238,200,101,.55);border-radius:12px;background:rgba(0,0,0,.58);color:#f6d982;font:11px/1.35 system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 0 18px rgba(0,229,255,.25);backdrop-filter:blur(6px);pointer-events:none}#kgen-mother-runtime-hud b{color:#68f6ff;letter-spacing:.08em}#kgen-mother-runtime-hud.pass{border-color:rgba(92,255,190,.75);color:#cffff2}#kgen-mother-runtime-hud.warn{border-color:rgba(255,214,108,.85);color:#ffe6a7}#kgen-mother-runtime-hud.fail{border-color:rgba(255,86,86,.85);color:#ffb0b0}`;
    document.head.appendChild(css);
    document.body.appendChild(hud);
    return hud;
  }
  async function exists(path){
    try{ const r=await fetch(path,{cache:'no-store'}); return r.ok; }catch(e){ return null; }
  }
  function collectScriptAndLinkRefs(){
    const refs=[];
    document.querySelectorAll('script[src],link[href]').forEach(el=>{
      const v=el.getAttribute('src')||el.getAttribute('href');
      if(v && !/^https?:|^data:|^#/.test(v)) refs.push(v.split('?')[0]);
    });
    return refs;
  }
  async function boot(){
    const hud=ensureHud();
    const refs=collectScriptAndLinkRefs();
    const missing=[];
    for(const f of SELF.required){
      const ok=await exists(f);
      if(ok===false) missing.push(f);
    }
    const forbiddenRefs=refs.filter(r=>SELF.forbidden.test(r));
    const duplicateRuntime=refs.filter((v,i,a)=>a.indexOf(v)!==i);
    const registryOk=await exists('modules/kgen-12345-cell-registry.json');
    const policyOk=await exists('modules/kgen-12345-growth-policy.json');
    const fetchBlocked = missing.length===0 ? false : missing.length===SELF.required.length;
    let status='PASS';
    let cls='pass';
    if(fetchBlocked){status='LOCAL'; cls='warn';}
    else if(missing.length||forbiddenRefs.length||duplicateRuntime.length||registryOk===false||policyOk===false){status='WARN'; cls='warn';}
    hud.className=cls;
    hud.innerHTML=`<b>PRIMEFORGE MOTHER ${status}</b><br>`+
      `version=${SELF.version} | mode=${SELF.mode}<br>`+
      `missing=${fetchBlocked?'unknown':missing.length} | forbidden=${forbiddenRefs.length} | duplicate=${duplicateRuntime.length}<br>`+
      `registry=${registryOk===null?'local':registryOk?'OK':'FAIL'} | policy=${policyOk===null?'local':policyOk?'OK':'FAIL'}`;
    window.KGEN_MOTHER_RUNTIME={SELF,missing,forbiddenRefs,duplicateRuntime,refs,status,bootedAt:new Date().toISOString()};
    document.dispatchEvent(new CustomEvent('kgen:mother-runtime-ready',{detail:window.KGEN_MOTHER_RUNTIME}));
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();
