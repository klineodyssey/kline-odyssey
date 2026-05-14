// KGEN 12345 V10.10 version sync
// 路徑：/K線西遊記/temples/12345/modules/kgen-12345-v10.10-version.js
(function(){
  const VERSION='12345-TEMPLE-V10.10-ORIGINAL-TEMPLE-MODULE-REPAIR';
  const BUILD='20260515-V10.10-ORIGINAL-TEMPLE-MODULE-REPAIR';
  window.KGEN12345_BUILD=Object.assign({},window.KGEN12345_BUILD||{},{VERSION,BUILD,BASE_FROM:'KGEN_12345_V10_2_FESTIVAL_RUNTIME_LOCK_FULL_bundle.zip'});
  function sync(){document.title='KGEN 12345 五指山悟空財神殿｜V10.10';document.querySelectorAll('body *').forEach(el=>{if(!el.childNodes||el.childNodes.length!==1||el.childNodes[0].nodeType!==3)return;let s=el.textContent||'';if(/VERSION\s+12345-TEMPLE-V10\./.test(s)||/TEMPLE-VERSION-SYNC/.test(s))el.textContent='VERSION 12345-TEMPLE-V10.10-ORIGINAL-MODULE-REPAIR';});}
  document.addEventListener('DOMContentLoaded',sync); if(document.readyState!=='loading') sync();
})();
