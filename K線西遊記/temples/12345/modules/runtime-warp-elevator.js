/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-warp-elevator.js
VERSION: V10.40.3_CANVAS_SCREEN_VISUAL_WARP_FULL
BUILD: 20260518-V10.40.3-CANVAS-SCREEN-VISUAL-WARP-FULL
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip
PURPOSE: Canvas screen recorder fallback, visual four-image binding, warp-core rail binding, Holy Cup layout.
RULE: Active JS/CSS stays in modules single layer. No modules/runtime folder.
*/

(function(){
  'use strict';
  if(window.__KGEN_WARP_ELEVATOR_V10403__) return; window.__KGEN_WARP_ELEVATOR_V10403__=true;
  const $=id=>document.getElementById(id); const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function rail(){ return $('warp-rail-body') || document.querySelector('.warp-rail') || $('kgen-warp-elevator'); }
  function ensure(){ const r=rail(); if(!r) return null; r.style.position='relative'; let img=$('kgen-12345-warp-core-layer'); if(!img){ img=document.createElement('img'); img.id='kgen-12345-warp-core-layer'; img.alt='warp-core'; img.src='./assets/warp-core.png'; r.appendChild(img); } img.onerror=function(){ this.style.display='none'; }; return img; }
  function inputLevel(){ const inp=$('warp-input-val'); let raw=inp ? Number(inp.value||0) : Number(window.KGEN_WARP_LEVEL||0); if(raw<=100) raw=raw*3; return clamp(raw,0,300); }
  window.KGEN_SET_WARP_LEVEL=function(level){ const img=ensure(); const r=rail(); const c=clamp(Number(level),0,300); window.KGEN_WARP_LEVEL=c; if(window.KGEN_RUNTIME_STATE&&window.KGEN_RUNTIME_STATE.universe) window.KGEN_RUNTIME_STATE.universe.C=c; if(img&&r){ const h=r.clientHeight||450, size=Math.max(42,Math.min(72,Math.round((r.clientWidth||36)*1.8))); const y=(h-size)-((c/300)*(h-size)); img.style.cssText='position:absolute!important;left:50%!important;top:'+y+'px!important;width:'+size+'px!important;height:'+size+'px!important;border-radius:50%!important;object-fit:cover!important;transform:translateX(-50%)!important;z-index:55!important;pointer-events:none!important;border:2px solid rgba(255,215,120,.78)!important;background:rgba(0,0,0,.65)!important;box-shadow:0 0 18px rgba(0,242,255,.55)!important;'; } const lab=$('warp-txt'); if(lab) lab.textContent='WARP '+Math.round(c)+'x'; };
  function sync(){ window.KGEN_SET_WARP_LEVEL(inputLevel()); }
  function bind(){ ensure(); const inp=$('warp-input-val'); if(inp&&!inp.__v10403Warp){ inp.__v10403Warp=1; inp.addEventListener('input',sync,true); inp.addEventListener('change',sync,true); } sync(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind(); setInterval(sync,1000);
})();
