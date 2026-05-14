
(function(){
  'use strict';
  const VERSION='12345-TEMPLE-V10.9-ORIGINAL-TEMPLE-MODULAR-REPAIR';
  const BUILD='20260515-V10.9-ORIGINAL-TEMPLE-MODULAR-REPAIR';
  window.KGEN12345_BUILD = Object.assign({}, window.KGEN12345_BUILD||{}, {VERSION, BUILD, BASE_FROM:'KGEN_12345_V10_2_FESTIVAL_RUNTIME_LOCK_FULL_bundle.zip', CHANGESET:'V10.9 module repair: panels/cup/timer/version'});
  function sync(){
    document.title='KGEN 12345 五指山悟空財神殿｜V10.9';
    document.querySelectorAll('body *').forEach(function(el){
      if(!el.childNodes || el.childNodes.length!==1 || el.childNodes[0].nodeType!==3) return;
      const s=el.textContent||'';
      if(/VERSION\s+12345-TEMPLE-V10\./.test(s) || /TEMPLE-VERSION-SYNC/.test(s) || /FESTIVAL-RUNTIME-LOCK/.test(s)){
        el.textContent='VERSION 12345-TEMPLE-V10.9-ORIGINAL-MODULAR-REPAIR';
      }
    });
  }
  document.addEventListener('DOMContentLoaded',sync);
  if(document.readyState!=='loading') sync();
})();
