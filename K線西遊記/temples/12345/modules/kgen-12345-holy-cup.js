/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-holy-cup.js
VERSION: V10.39.2_EXECUTION_MAP_GOVERNANCE
BUILD: 20260517-V10.39.2-EXECUTION-MAP-GOVERNANCE
BASE_FROM: KGEN_12345_V10_39_1_TEMPLE_ARCHITECTURE_MASTER_FULL.zip
RULE: Official filename is fixed. Version is written here, not in filename.
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
