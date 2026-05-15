
// KGEN 12345 V10.11 stable countdown
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-v10.11-stable-countdown.js
// 原則：保留倒數槽，不刪 DOM；只用 textContent 更新，不顯示秒數，降低手機閃爍。
(function(){
  'use strict';
  function pad(n){return String(n).padStart(2,'0');}
  function nextNY(){const now=new Date(); let y=now.getUTCFullYear(); let t=new Date(Date.UTC(y,11,31,23,50,0)); if(t-now<=0)t=new Date(Date.UTC(y+1,11,31,23,50,0)); return t;}
  function text(){const diff=Math.max(0,nextNY()-new Date()); const m=Math.floor(diff/60000); const d=Math.floor(m/1440); const h=Math.floor((m%1440)/60); const mm=m%60; return `距跨年 ${d}天 ${pad(h)}時 ${pad(mm)}分`;}
  function apply(){
    const t=text();
    const ids=['kgen-v102-festival-countdown','kh-ny-slot'];
    ids.forEach(id=>{const el=document.getElementById(id); if(el && el.textContent!==t) el.textContent=t;});
    document.querySelectorAll('[data-kgen-countdown],.kh-ny-countdown').forEach(el=>{if(el.textContent!==t) el.textContent=t;});
  }
  document.addEventListener('DOMContentLoaded',apply); if(document.readyState!=='loading') apply(); setTimeout(apply,500); setTimeout(apply,1800); setInterval(apply,30000);
})();
