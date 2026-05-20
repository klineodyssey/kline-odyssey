/*
============================================================
FILE_CERTIFICATE
PRODUCT_ID: KGEN-12345-HEART-UI
FILE_ID: kgen-12345-boot-runtime.js
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BIRTH: 2026-05-20
STATUS: ACTIVE
DEATH_CERTIFICATE: ACTIVE UNTIL REPLACED BY HIGHER VERSION AND LISTED IN DEATH_CERTIFICATE.md
PURPOSE: Root boot engine: runs manifest, immune, death, watchdog and recursive verification before reporting system status.
SELF_VERIFY: This runtime registers itself into window.KGEN12345RuntimeCells.
============================================================
*/

(function(){
  const CELL={id:'boot-runtime',file:'modules/kgen-12345-boot-runtime.js',version:'V10.43-FINAL',status:'ACTIVE'};
  window.KGEN12345RuntimeCells=window.KGEN12345RuntimeCells||{}; window.KGEN12345RuntimeCells[CELL.id]=CELL;
  async function start(){
    const report={version:'V10.43-FINAL',startedAt:new Date().toISOString(),missing:[],immune:null,death:null,watchdog:null,recursive:null,ok:false};
    try{
      const m=await window.KGEN12345ManifestRuntime.load(); report.missing=m.missing;
      report.immune=window.KGEN12345ImmuneRuntime.scanManifest(m.manifest);
      report.death=await window.KGEN12345DeathManager.scan(m.manifest);
      report.watchdog=window.KGEN12345WatchdogRuntime.scan();
      report.recursive=window.KGEN12345RecursiveVerify.verify();
      report.ok=(!report.missing.length && report.immune.ok && report.death.ok && report.watchdog.ok && report.recursive.ok);
      const msg='missing='+report.missing.length+' | immune='+(report.immune.ok?'OK':'FAIL')+' | death='+(report.death.ok?'OK':'FAIL')+' | duplicate='+(report.watchdog.duplicate||[]).length+' | recursive='+(report.recursive.ok?'OK':'FAIL');
      window.KGEN12345LayoutRuntime.setStatus(report.ok,msg);
    }catch(e){ report.error=String(e); report.ok=false; window.KGEN12345LayoutRuntime.setStatus(false,'BOOT ERROR: '+String(e).slice(0,180)); }
    window.KGEN12345BootReport=report; return report;
  }
  window.KGEN12345BootRuntime={CELL,start};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start); else setTimeout(start,0);
})();
