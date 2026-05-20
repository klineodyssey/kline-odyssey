/*
============================================================
FILE_CERTIFICATE
PRODUCT_ID: KGEN-12345-HEART-UI
FILE_ID: kgen-12345-watchdog-runtime.js
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BIRTH: 2026-05-20
STATUS: ACTIVE
DEATH_CERTIFICATE: ACTIVE UNTIL REPLACED BY HIGHER VERSION AND LISTED IN DEATH_CERTIFICATE.md
PURPOSE: Runtime watchdog: checks duplicate script cells and required core globals.
SELF_VERIFY: This runtime registers itself into window.KGEN12345RuntimeCells.
============================================================
*/

(function(){
  const CELL={id:'watchdog-runtime',file:'modules/kgen-12345-watchdog-runtime.js',version:'V10.43-FINAL',status:'ACTIVE'};
  window.KGEN12345RuntimeCells=window.KGEN12345RuntimeCells||{}; window.KGEN12345RuntimeCells[CELL.id]=CELL;
  function scan(){
    const scripts=[...document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src'));
    const seen=new Set(), duplicate=[]; for(const s of scripts){ if(seen.has(s)) duplicate.push(s); seen.add(s); }
    const required=['app']; const missingGlobals=required.filter(k=>!(k in window));
    return {scripts,duplicate,missingGlobals,ok:duplicate.length===0 && missingGlobals.length===0};
  }
  window.KGEN12345WatchdogRuntime={CELL,scan};
})();
