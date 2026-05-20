/*
============================================================
FILE_CERTIFICATE
PRODUCT_ID: KGEN-12345-HEART-UI
FILE_ID: kgen-12345-sphere-runtime.js
VERSION: 12345-TEMPLE-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BUILD: 20260520-V10.43-FINAL-RUNTIME-ARCHITECTURE-CONSTITUTION
BIRTH: 2026-05-20
STATUS: ACTIVE
DEATH_CERTIFICATE: ACTIVE UNTIL REPLACED BY HIGHER VERSION AND LISTED IN DEATH_CERTIFICATE.md
PURPOSE: Sphere runtime guard for formal assets bull/bear/heart.
SELF_VERIFY: This runtime registers itself into window.KGEN12345RuntimeCells.
============================================================
*/

(function(){
  const CELL={id:'sphere-runtime',file:'modules/kgen-12345-sphere-runtime.js',version:'V10.43-FINAL',status:'ACTIVE'};
  window.KGEN12345RuntimeCells=window.KGEN12345RuntimeCells||{}; window.KGEN12345RuntimeCells[CELL.id]=CELL;
  const assets={bull:'assets/bull-front.png',bear:'assets/bear-rear.png',heart:'assets/heart.png'};
  function side(thetaY){ const d=Number(thetaY)||0; return (d>=-90&&d<=90)?'bull':'bear'; }
  function apply(state='idle',thetaY=0){
    const img=document.getElementById('fairy-img'); if(!img) return;
    const key=(state==='movement')?'heart':side(thetaY);
    if(!String(img.getAttribute('src')||'').endsWith(assets[key])) img.src=assets[key];
  }
  window.KGEN12345SphereRuntime={CELL,assets,side,apply};
})();
