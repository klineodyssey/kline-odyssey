/*
============================================================
FILE_CERTIFICATE
PRODUCT_ID: KGEN-12345-HEART-UI
FILE_ID: kgen-12345-recursive-verify.js
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BIRTH: 2026-05-20
STATUS: ACTIVE
DEATH_CERTIFICATE: ACTIVE UNTIL REPLACED BY HIGHER VERSION AND LISTED IN DEATH_CERTIFICATE.md
PURPOSE: Recursive verification of runtime cells: observer is also checked.
SELF_VERIFY: This runtime registers itself into window.KGEN12345RuntimeCells.
============================================================
*/

(function(){
  const CELL={id:'recursive-verify',file:'modules/kgen-12345-recursive-verify.js',version:'V10.43-FINAL',status:'ACTIVE'};
  window.KGEN12345RuntimeCells=window.KGEN12345RuntimeCells||{}; window.KGEN12345RuntimeCells[CELL.id]=CELL;
  const required=['manifest-runtime','immune-runtime','watchdog-runtime','recursive-verify','organ-lifecycle','death-manager','layout-runtime','sphere-runtime','warp-runtime','boot-runtime'];
  function verify(){
    const cells=window.KGEN12345RuntimeCells||{};
    const missing=required.filter(id=>!cells[id]);
    const inactive=Object.values(cells).filter(c=>c.status!=='ACTIVE').map(c=>c.id);
    return {required,cells:Object.keys(cells),missing,inactive,ok:missing.length===0 && inactive.length===0};
  }
  window.KGEN12345RecursiveVerify={CELL,verify};
})();
