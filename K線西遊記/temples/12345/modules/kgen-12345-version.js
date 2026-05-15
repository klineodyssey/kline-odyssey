// KGEN 12345 V10.25.0 version sync
(function(){
  'use strict';
  const VERSION='12345-TEMPLE-V10.27.0-STABLE-ORGAN-CHECK';
  const BUILD='20260516-V10.27-STABLE-ORGAN-CHECK';
  window.KGEN12345_BUILD=Object.assign({}, window.KGEN12345_BUILD||{}, {VERSION, BUILD, CHANGESET:'V10.27 Stable organ check / amount input / elevator sync / panel safe'});
  function sync(){
    const v=document.getElementById('ver-st');
    if(v) v.textContent='VERSION '+VERSION;
    const title=document.querySelector('title');
    if(title) title.textContent='KGEN 12345 五指山悟空財神殿 V10.25 宇宙電梯同步版';
    document.documentElement.setAttribute('data-kgen12345-version', VERSION);
  }
  document.addEventListener('DOMContentLoaded',sync);
  if(document.readyState!=='loading') sync();
  setTimeout(sync,800); setTimeout(sync,2200); setInterval(sync,5000);
})();
