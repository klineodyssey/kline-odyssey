/* KGEN 12345 Panel Router V10.35 */
(function(){
  'use strict';
  if(window.__KGEN_V1035_PANEL_ROUTER__) return; window.__KGEN_V1035_PANEL_ROUTER__=true;
  const $=(id)=>document.getElementById(id);
  const qsa=(s)=>Array.from(document.querySelectorAll(s));
  function fitPanels(){
    ['coord-panel','right-info-panel','web3-panel','kgen-heart-live-panel'].forEach(id=>{
      const el=$(id); if(!el) return;
      el.style.maxHeight = id==='web3-panel'?'68vh':'46vh';
      el.style.overflowY='auto'; el.style.webkitOverflowScrolling='touch'; el.style.boxSizing='border-box';
    });
    qsa('#coord-modal,.coord-modal,#kgenMapModal,.kgen-map-modal').forEach(el=>{el.style.zIndex='999998';});
  }
  function bindToggleHints(){
    document.addEventListener('click',ev=>{
      const b=ev.target&&ev.target.closest?ev.target.closest('button,a'):null; if(!b) return;
      const t=(b.textContent||'').trim();
      if(/神規|規則|地圖|名額|訊息|客服/.test(t)) setTimeout(fitPanels,120);
    },true);
  }
  function init(){fitPanels();bindToggleHints();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.addEventListener('load',()=>setTimeout(init,500)); setInterval(fitPanels,4000);
})();
