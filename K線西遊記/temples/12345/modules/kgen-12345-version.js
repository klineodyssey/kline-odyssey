
// KGEN 12345 V10.15 version sync
(function(){
  'use strict';
  const VERSION='12345-TEMPLE-V10.15-ORIGINAL-TEMPLE-MODULE-PATCH';
  const BUILD='20260515-V10.15-ORIGINAL-TEMPLE-MODULE-PATCH';
  window.KGEN12345_BUILD=Object.assign({}, window.KGEN12345_BUILD||{}, {VERSION, BUILD, CHANGESET:'V10.15 original temple module patch'});
  function sync(){
    const v=document.getElementById('ver-st');
    if(v) v.textContent='VERSION '+VERSION;
    const title=document.querySelector('title');
    if(title && !/V10\.11/.test(title.textContent||'')) title.textContent='KGEN 12345 五指山悟空財神殿 V10.15';
  }
  document.addEventListener('DOMContentLoaded',sync); if(document.readyState!=='loading') sync(); setTimeout(sync,800); setTimeout(sync,2200);
})();
