/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-holy-cup.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
/* KGEN 12345 Holy Cup V10.35 - standalone guard */
(function(){
  'use strict';
  if(window.__KGEN_V1035_HOLY_CUP__) return; window.__KGEN_V1035_HOLY_CUP__=true;
  function text(el){return (el&&el.textContent||'').replace(/\s+/g,'');}
  function bind(){
    document.querySelectorAll('button,a').forEach(b=>{
      const t=text(b); if(!/聖盃|三次/.test(t) || b.dataset.kgenHolyCup) return;
      b.dataset.kgenHolyCup='1';
      b.addEventListener('click',()=>{try{window.templeOps&&templeOps.cup&&templeOps.cup();}catch(e){}},true);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind();
  setInterval(bind,5000);
})();
