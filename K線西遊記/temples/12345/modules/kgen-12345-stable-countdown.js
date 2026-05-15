// KGEN 12345 V10.23 stable countdown visible patch
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-stable-countdown.js
// 原則：跨年資訊要顯示，不可隱藏；解決閃爍，不刪 DOM。
(function(){
  'use strict';
  function pad(n){return String(n).padStart(2,'0');}
  function nextNY(){const now=new Date(); let y=now.getUTCFullYear(); let t=new Date(Date.UTC(y,11,31,23,50,0)); if(t-now<=0)t=new Date(Date.UTC(y+1,11,31,23,50,0)); return t;}
  function text(){const diff=Math.max(0,nextNY()-new Date()); const m=Math.floor(diff/60000); const d=Math.floor(m/1440); const h=Math.floor((m%1440)/60); const mm=m%60; return `12/31 跨年倒數 newYearCountdownClaim：距活動約 ${d}天 ${pad(h)}時 ${pad(mm)}分`;}
  function ensureStyle(){
    if(document.getElementById('kgen-v1023-countdown-visible-style')) return;
    const st=document.createElement('style'); st.id='kgen-v1023-countdown-visible-style';
    st.textContent=`
      #kgen-v102-festival-countdown,#kh-ny-slot,.kh-ny-countdown,[data-kgen-countdown],#cd-1231,.kgen-countdown-card{
        display:block!important;visibility:visible!important;opacity:1!important;animation:none!important;transition:none!important;filter:none!important;text-shadow:0 0 8px rgba(0,0,0,.85)!important;color:#9ff!important;min-height:1.45em!important;white-space:normal!important;overflow:visible!important;background:rgba(0,0,0,.28)!important;border-radius:10px!important;padding:6px 8px!important;
      }
      #kgen-v102-festival-countdown *,#kh-ny-slot *,.kh-ny-countdown *{animation:none!important;transition:none!important;opacity:1!important;}
    `;
    document.head.appendChild(st);
  }
  function apply(){ensureStyle(); const t=text(); document.querySelectorAll('#kgen-v102-festival-countdown,#kh-ny-slot,.kh-ny-countdown,[data-kgen-countdown],#cd-1231').forEach(el=>{ if(el.textContent!==t) el.textContent=t; });}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply(); window.addEventListener('load',apply); setTimeout(apply,500); setInterval(apply,60000);
})();
