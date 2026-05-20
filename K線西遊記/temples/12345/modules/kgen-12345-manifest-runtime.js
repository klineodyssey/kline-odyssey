/*
============================================================
FILE_CERTIFICATE
PRODUCT_ID: KGEN-12345-HEART-UI
FILE_ID: kgen-12345-manifest-runtime.js
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BIRTH: 2026-05-20
STATUS: ACTIVE
DEATH_CERTIFICATE: ACTIVE UNTIL REPLACED BY HIGHER VERSION AND LISTED IN DEATH_CERTIFICATE.md
PURPOSE: Browser-side MANIFEST.json loading and required-file health checks.
SELF_VERIFY: This runtime registers itself into window.KGEN12345RuntimeCells.
============================================================
*/

(function(){
  const CELL={id:'manifest-runtime',file:'modules/kgen-12345-manifest-runtime.js',version:'V10.43-FINAL',status:'ACTIVE'};
  window.KGEN12345RuntimeCells=window.KGEN12345RuntimeCells||{}; window.KGEN12345RuntimeCells[CELL.id]=CELL;
  async function fetchText(path){const r=await fetch(path,{cache:'no-store'}); if(!r.ok) throw new Error(path+' HTTP '+r.status); return await r.text();}
  async function checkFile(path){try{const r=await fetch(path,{cache:'no-store'}); return {path,ok:r.ok,status:r.status};}catch(e){return {path,ok:false,error:String(e)}}}
  async function load(){
    const raw=await fetchText('MANIFEST.json'); const manifest=JSON.parse(raw);
    const checks=[]; for(const f of (manifest.files||[])){ checks.push(await checkFile(f.path)); }
    const missing=checks.filter(x=>!x.ok).map(x=>x.path);
    return {manifest,checks,missing,ok:missing.length===0};
  }
  window.KGEN12345ManifestRuntime={CELL,load,checkFile};
})();
