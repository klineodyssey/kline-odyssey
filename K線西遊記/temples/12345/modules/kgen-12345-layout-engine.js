
/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-layout-engine.js
VERSION: V10.41.2_TEMPLE_FRONT_REPAIR_OPENING_READY
BUILD: 20260518-V10.41.2-TEMPLE-FRONT-REPAIR-OPENING-READY
PURPOSE: 12345 開張門面治理。只修位置、層級、收納，不新增戰鬥玩法。
*/
(function(){
  'use strict';
  if(window.__KGEN_12345_LAYOUT_ENGINE_V10412__) return;
  window.__KGEN_12345_LAYOUT_ENGINE_V10412__ = true;
  const VERSION='KGEN-12345-V10.41.2_TEMPLE_FRONT_REPAIR_OPENING_READY';
  const $=id=>document.getElementById(id);
  function setVersion(){
    document.title='KGEN 12345 五指山悟空財神殿｜'+VERSION+'｜Opening Ready';
    const ver=$('ver-st'); if(ver) ver.textContent='VERSION '+VERSION;
    const clock=$('sys-clock'); if(clock && !/神殿開張/.test(clock.textContent||'')) clock.textContent='TEMPLE OPENING READY｜神殿開張模式';
  }
  function cleanFloatingLabels(){
    document.body.classList.add('kgen-opening-ready');
    try{
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      const kill=[];
      while(walker.nextNode()){
        const n=walker.currentNode;
        const t=(n.nodeValue||'').trim();
        if(t==='modules' || /wukong_heart_v10_4\.png|undefined\.png/.test(t)) kill.push(n);
      }
      kill.forEach(n=>{ n.nodeValue=''; });
    }catch(e){}
  }
  function ensureHolyCupOpen(){
    const p=$('v104-cup-panel');
    if(p){
      p.style.display='block';
      p.classList.add('kgen-opening-cup');
      const head=p.querySelector('.v104-head span'); if(head) head.textContent='三聖盃檢查系統｜發財金流程驗證';
      const close=$('v104-cup-close'); if(close) close.textContent='收合';
    }
  }
  function simplifyFooter(){
    const btns=Array.from(document.querySelectorAll('.footer-terminal .term-btn'));
    const names=['連錢包','發財金','許願','還願','點燈','心跳','呼吸','節日'];
    btns.slice(0,8).forEach((b,i)=>{
      if(!b.dataset.openingOriginal) b.dataset.openingOriginal=b.textContent.trim();
      b.textContent=names[i] || b.textContent.trim();
      b.setAttribute('data-opening-action',names[i]||'');
    });
  }
  function boot(){
    setVersion(); cleanFloatingLabels(); ensureHolyCupOpen(); simplifyFooter();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',()=>{ boot(); setTimeout(boot,400); setTimeout(boot,1600); });
  setInterval(()=>{ setVersion(); cleanFloatingLabels(); ensureHolyCupOpen(); },2500);
  window.KGEN_12345_LAYOUT_ENGINE={version:VERSION, mode:'opening-ready'};
})();
