/*
============================================================
FILE_CERTIFICATE
PRODUCT_ID: KGEN-12345-HEART-UI
FILE_ID: kgen-12345-warp-runtime.js
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BIRTH: 2026-05-20
STATUS: ACTIVE
DEATH_CERTIFICATE: ACTIVE UNTIL REPLACED BY HIGHER VERSION AND LISTED IN DEATH_CERTIFICATE.md
PURPOSE: Warp runtime guard for C0-C300 and warp-core asset.
SELF_VERIFY: This runtime registers itself into window.KGEN12345RuntimeCells.
============================================================
*/

(function(){
  const CELL={id:'warp-runtime',file:'modules/kgen-12345-warp-runtime.js',version:'V10.43-FINAL',status:'ACTIVE'};
  window.KGEN12345RuntimeCells=window.KGEN12345RuntimeCells||{}; window.KGEN12345RuntimeCells[CELL.id]=CELL;
  function levelFromInput(v){ return Math.max(0,Math.min(300,Math.round((Number(v)||0)*3))); }
  function current(){ const el=document.getElementById('warp-input-val'); return levelFromInput(el?el.value:0); }
  window.KGEN12345WarpRuntime={CELL,asset:'assets/warp-core.png',levelFromInput,current};
})();
