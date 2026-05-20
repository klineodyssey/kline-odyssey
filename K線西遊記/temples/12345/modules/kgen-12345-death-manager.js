/*
============================================================
FILE_CERTIFICATE
PRODUCT_ID: KGEN-12345-HEART-UI
FILE_ID: kgen-12345-death-manager.js
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BIRTH: 2026-05-20
STATUS: ACTIVE
DEATH_CERTIFICATE: ACTIVE UNTIL REPLACED BY HIGHER VERSION AND LISTED IN DEATH_CERTIFICATE.md
PURPOSE: Death-cell manager: reads deletion policy and flags dead cells still alive.
SELF_VERIFY: This runtime registers itself into window.KGEN12345RuntimeCells.
============================================================
*/

(function(){
  const CELL={id:'death-manager',file:'modules/kgen-12345-death-manager.js',version:'V10.43-FINAL',status:'ACTIVE'};
  window.KGEN12345RuntimeCells=window.KGEN12345RuntimeCells||{}; window.KGEN12345RuntimeCells[CELL.id]=CELL;
  async function scan(manifest){
    let txt=''; try{txt=await (await fetch('DELETE_LIST.txt',{cache:'no-store'})).text();}catch(e){}
    const rules=txt.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));
    const files=(manifest&&manifest.files||[]).map(f=>f.path||'');
    const deadStillAlive=[];
    for(const r of rules){
      const clean=r.replace(/\*.*/,'').replace(/\/$/,'');
      if(!clean) continue;
      if(files.some(f=>f===clean || f.startsWith(clean+'/'))) deadStillAlive.push(r);
    }
    return {rules,deadStillAlive,ok:deadStillAlive.length===0};
  }
  window.KGEN12345DeathManager={CELL,scan};
})();
