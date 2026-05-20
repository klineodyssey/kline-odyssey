/*
============================================================
FILE_CERTIFICATE
PRODUCT_ID: KGEN-12345-HEART-UI
FILE_ID: kgen-12345-immune-runtime.js
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BIRTH: 2026-05-20
STATUS: ACTIVE
DEATH_CERTIFICATE: ACTIVE UNTIL REPLACED BY HIGHER VERSION AND LISTED IN DEATH_CERTIFICATE.md
PURPOSE: Detect forbidden runtime names, deep organ folders, and cancer-like stale cell patterns.
SELF_VERIFY: This runtime registers itself into window.KGEN12345RuntimeCells.
============================================================
*/

(function(){
  const CELL={id:'immune-runtime',file:'modules/kgen-12345-immune-runtime.js',version:'V10.43-FINAL',status:'ACTIVE'};
  window.KGEN12345RuntimeCells=window.KGEN12345RuntimeCells||{}; window.KGEN12345RuntimeCells[CELL.id]=CELL;
  const badWords=['patch','hotfix','temp','fix2','ultimate','stable-patch','backup','copy'];
  function scanManifest(manifest){
    const files=(manifest.files||[]).map(f=>f.path||'');
    const forbidden=files.filter(p=>badWords.some(w=>p.toLowerCase().includes(w)));
    const deepOrgans=files.filter(p=>p.startsWith('modules/organs/'));
    const formalAssets=['assets/bull-front.png','assets/bear-rear.png','assets/heart.png','assets/warp-core.png'];
    const assetDrift=files.filter(p=>p.startsWith('assets/') && !formalAssets.includes(p));
    return {forbidden,deepOrgans,assetDrift,ok:!forbidden.length&&!deepOrgans.length&&!assetDrift.length};
  }
  window.KGEN12345ImmuneRuntime={CELL,scanManifest};
})();
