/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-layout-fix.js
VERSION: V10.40.3_CANVAS_SCREEN_VISUAL_WARP_FULL
BUILD: 20260518-V10.40.3-CANVAS-SCREEN-VISUAL-WARP-FULL
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip
PURPOSE: Canvas screen recorder fallback, visual four-image binding, warp-core rail binding, Holy Cup layout.
RULE: Active JS/CSS stays in modules single layer. No modules/runtime folder.
*/

(function(){
  'use strict';
  if(window.__KGEN_LAYOUT_FIX_V10403__) return; window.__KGEN_LAYOUT_FIX_V10403__=true;
  const $=id=>document.getElementById(id); const qsa=s=>Array.from(document.querySelectorAll(s)); const txt=e=>(e&&e.textContent||'').replace(/\s+/g,' ').trim();
  function styleCup(){ const p=$('v104-cup-panel')||$('kgen-holy-cup-panel'); if(!p) return; p.classList.add('kgen-cup-compact-v10403'); p.style.left='50%'; p.style.right='auto'; p.style.bottom='116px'; p.style.transform='translateX(-50%)'; p.style.width='min(520px,72vw)'; p.style.maxHeight='170px'; p.style.overflow='auto'; p.style.zIndex='100500'; let tab=$('kgen-cup-reopen-tab-v10403'); if(!tab){ tab=document.createElement('button'); tab.id='kgen-cup-reopen-tab-v10403'; tab.type='button'; tab.textContent='三聖盃檢查'; tab.onclick=()=>openCup(true); document.body.appendChild(tab); } }
  function openCup(open){ const p=$('v104-cup-panel')||$('kgen-holy-cup-panel'); if(!p) return; p.style.display=open?'block':'none'; localStorage.setItem('kgen12345.v10403.cup.open',open?'1':'0'); }
  window.KGEN_TOGGLE_HOLY_CUP=function(force){ const p=$('v104-cup-panel')||$('kgen-holy-cup-panel'); const on=(force===undefined)?(!(p&&getComputedStyle(p).display!=='none')):!!force; openCup(on); };
  function bindCup(){ const p=$('v104-cup-panel')||$('kgen-holy-cup-panel'); if(p){ const close=p.querySelector('#v104-cup-close,.v104-close,.kgen-panel-close,[data-close]'); if(close&&!close.__v10403Cup){ close.__v10403Cup=1; close.addEventListener('click',e=>{ e.preventDefault(); e.stopImmediatePropagation(); openCup(false); return false; },true); } } qsa('button,a,[role="button"],.term-btn,.nav-btn').forEach(b=>{ if(b.__v10403CupBtn) return; if(/三聖盃檢查/.test(txt(b))){ b.__v10403CupBtn=1; b.onclick=null; b.addEventListener('click',e=>{ e.preventDefault(); e.stopImmediatePropagation(); openCup(true); return false; },true); } }); }
  function cleanupTop(){ qsa('body *').forEach(e=>{ if(e.children.length) return; const t=txt(e); const r=e.getBoundingClientRect(); if(r.top<190 && (t.startsWith('C |')||t.startsWith('CT |')||t.includes('未偵測到鏈上注入')||t.includes('回圖於錢包入口'))){ e.style.display='none'; e.style.visibility='hidden'; } }); const brand=document.querySelector('.brand-section,.hud-top'); if(brand){ brand.style.marginTop='16px'; } }
  function bindPanels(){ qsa('button,a,[role="button"],.term-btn,.nav-btn').forEach(b=>{ const t=txt(b); if(/悟空心臟/.test(t)&&!b.__v10403Heart){ b.__v10403Heart=1; b.addEventListener('click',e=>{ const p=$('kgen-left-heart-panel'); if(p){ e.preventDefault(); e.stopImmediatePropagation(); p.style.display=(getComputedStyle(p).display==='none')?'block':'none'; return false; } },true); } if(/右側神規|神規/.test(t)&&!b.__v10403Rule){ b.__v10403Rule=1; b.addEventListener('click',e=>{ const p=$('kgen-right-rule-panel')||$('coord-panel'); if(p){ e.preventDefault(); e.stopImmediatePropagation(); p.style.display=(getComputedStyle(p).display==='none')?'block':'none'; return false; } },true); } }); }
  function boot(){ styleCup(); bindCup(); cleanupTop(); bindPanels(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot(); setInterval(boot,1600);
})();
