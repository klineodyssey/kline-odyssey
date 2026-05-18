
/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-countdown-engine.js
VERSION: V10.41.2_TEMPLE_FRONT_REPAIR_OPENING_READY
PURPOSE: 開張門面只保留一條穩定倒數；舊倒數不再閃、不再壓版。
*/
(function(){
  'use strict';
  if(window.__KGEN_12345_COUNTDOWN_ENGINE_V10412__) return;
  window.__KGEN_12345_COUNTDOWN_ENGINE_V10412__=true;
  function pad(n){return String(n).padStart(2,'0');}
  function nextNY(){ const now=new Date(); let y=now.getFullYear(); let t=new Date(y,11,31,23,59,59); if(t<=now) t=new Date(y+1,11,31,23,59,59); return t; }
  function diff(t){ const s=Math.max(0,Math.floor((t-Date.now())/1000)); const d=Math.floor(s/86400); const h=Math.floor((s%86400)/3600); const m=Math.floor((s%3600)/60); return d+'天 '+pad(h)+'時'+pad(m)+'分'; }
  function ensure(){
    let el=document.getElementById('kgen-v10412-countdown-strip') || document.getElementById('kgen-v10404-countdown-strip');
    if(!el){ el=document.createElement('div'); el.id='kgen-v10412-countdown-strip'; document.body.appendChild(el); }
    el.id='kgen-v10412-countdown-strip';
    el.style.cssText='position:fixed;left:50%;bottom:calc(112px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:168;width:min(360px,calc(100vw - 180px));min-width:180px;padding:5px 9px;border-radius:12px;border:1px solid rgba(0,242,255,.42);background:rgba(0,16,24,.66);box-shadow:0 0 18px rgba(0,242,255,.14);color:#7ff3ff;font-family:Orbitron,system-ui,sans-serif;font-size:10px;text-align:center;white-space:nowrap;pointer-events:none;';
    return el;
  }
  function tick(){ const el=ensure(); el.innerHTML='<b style="color:#ffd778">距跨年：</b>'+diff(nextNY()); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',tick); else tick();
  setInterval(tick,30000);
})();
