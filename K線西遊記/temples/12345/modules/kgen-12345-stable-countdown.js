// KGEN 12345 V10.36 stable countdown runtime
// 正確定義：心跳倒數 = 每小時；呼吸倒數 = 轉日；跨年倒數只屬節日活動，不可覆蓋心跳/呼吸。
(function(){
  'use strict';
  const MODULE='KGEN_12345_STABLE_COUNTDOWN';
  const VERSION='V10.36.0';
  function $(id){return document.getElementById(id)}
  function qsa(s){return Array.prototype.slice.call(document.querySelectorAll(s))}
  function pad(n){return String(n).padStart(2,'0')}
  function hms(ms){ms=Math.max(0,ms|0); const s=Math.floor(ms/1000); return pad(Math.floor(s/3600))+':'+pad(Math.floor((s%3600)/60))+':'+pad(s%60)}
  function dhms(ms){ms=Math.max(0,ms|0); const s=Math.floor(ms/1000); const d=Math.floor(s/86400); return String(d).padStart(3,'0')+'天 '+pad(Math.floor((s%86400)/3600))+':'+pad(Math.floor((s%3600)/60))+':'+pad(s%60)}
  function nextHour(){const n=new Date(); const t=new Date(n); t.setMinutes(0,0,0); t.setHours(t.getHours()+1); return t}
  function nextLocalMidnight(){const n=new Date(); const t=new Date(n); t.setHours(24,0,0,0); return t}
  function nextNewYear(){const n=new Date(); let t=new Date(n.getFullYear(),11,31,23,59,59); if(t<=n)t=new Date(n.getFullYear()+1,11,31,23,59,59); return t}
  function text(kind){
    const n=new Date();
    if(kind==='heartbeat') return '整點心跳倒數 heartbeatClaim：距下一次整點心跳 '+hms(nextHour()-n);
    if(kind==='ignite') return '轉日呼吸倒數 igniteAndClaim：距下一次轉日呼吸 '+dhms(nextLocalMidnight()-n);
    return '12/31 跨年倒數 newYearCountdownClaim：距活動 '+dhms(nextNewYear()-n);
  }
  function ensureStyle(){
    if($('kgen-v1036-countdown-style')) return;
    const st=document.createElement('style'); st.id='kgen-v1036-countdown-style';
    st.textContent=`
      [data-kgen-countdown-kind],#kh-heartbeat-countdown,#kh-ignite-countdown,#kh-ny-slot,#kgen-v102-festival-countdown,#cd-1231{
        display:block!important;visibility:visible!important;opacity:1!important;animation:none!important;transition:none!important;filter:none!important;
        min-height:1.45em!important;white-space:normal!important;overflow:visible!important;
      }
      .kgen-countdown-heartbeat{color:#ffd778!important}.kgen-countdown-ignite{color:#9ff!important}.kgen-countdown-newyear{color:#d9b6ff!important}
    `;
    document.head.appendChild(st);
  }
  function set(el,kind){ if(!el) return; el.setAttribute('data-kgen-countdown-kind',kind); el.classList.add('kgen-countdown-'+kind); const t=text(kind); if(el.textContent!==t) el.textContent=t; }
  function classifyLegacy(el){
    const id=(el.id||'').toLowerCase(); const cls=(el.className||'').toString().toLowerCase(); const txt=(el.textContent||'').toLowerCase();
    if(id.includes('heartbeat')||txt.includes('心跳')||txt.includes('heartbeat')) return 'heartbeat';
    if(id.includes('ignite')||id.includes('breath')||txt.includes('呼吸')||txt.includes('轉日')||txt.includes('ignite')) return 'ignite';
    return 'newyear';
  }
  function apply(){
    ensureStyle();
    // Explicit selectors
    ['kh-heartbeat-countdown','heartbeat-countdown','kgen-heartbeat-countdown'].forEach(id=>set($(id),'heartbeat'));
    ['kh-ignite-countdown','ignite-countdown','breath-countdown','kgen-ignite-countdown'].forEach(id=>set($(id),'ignite'));
    ['kh-ny-slot','ny-slot','newyear-countdown','kgen-v102-festival-countdown','cd-1231'].forEach(id=>set($(id),'newyear'));
    // Legacy nodes: classify by wording, never blindly turn all countdown into New Year.
    qsa('[data-kgen-countdown],.kh-ny-countdown,.kh-heartbeat-countdown,.kh-ignite-countdown,.kgen-countdown-card').forEach(el=>set(el, el.getAttribute('data-kgen-countdown-kind')||classifyLegacy(el)));
  }
  function boot(){apply(); if(window.__KGEN12345_COUNTDOWN_TIMER__) clearInterval(window.__KGEN12345_COUNTDOWN_TIMER__); window.__KGEN12345_COUNTDOWN_TIMER__=setInterval(apply,1000); console.log('['+MODULE+' '+VERSION+'] online');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',apply); setTimeout(apply,500); setTimeout(apply,1500);
  window.KGEN12345_COUNTDOWN={version:VERSION,apply,text};
})();
