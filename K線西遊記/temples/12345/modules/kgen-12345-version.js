// KGEN 12345 MASTER version sync
(function(){
  'use strict';
  const VERSION='12345-TEMPLE-V10.36-WORLD-AXIS-COUNTDOWN-FIX';
  const BUILD='20260516-V10.36-WORLD-AXIS-COUNTDOWN-FIX';
  const CHANGESET='Fix three timers: heartbeat hourly, ignite daily, new year only festival; free amount input; XY true-world axis separated from WARP elevator; Z mirror only on order.';
  function sync(){
    window.KGEN12345_BUILD=Object.assign({}, window.KGEN12345_BUILD||{}, {VERSION, BUILD, CHANGESET});
    const v=document.getElementById('ver-st'); if(v) v.textContent='VERSION '+VERSION;
    document.querySelectorAll('.sys-st').forEach(el=>{ if((el.textContent||'').includes('VERSION')) el.textContent='VERSION '+VERSION; });
    document.title='KGEN 12345 五指山悟空財神殿 V10.36 WORLD AXIS';
    document.documentElement.setAttribute('data-kgen12345-version', VERSION);
  }
  document.addEventListener('DOMContentLoaded',sync);
  if(document.readyState!=='loading') sync();
  setTimeout(sync,300); setTimeout(sync,1200); setTimeout(sync,3200); setInterval(sync,5000);
  window.KGEN12345_MASTER_VERSION={VERSION,BUILD,CHANGESET,sync};
})();
