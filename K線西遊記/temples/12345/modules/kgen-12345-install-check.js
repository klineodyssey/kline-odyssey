/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-install-check.js
VERSION: V10.39.2_EXECUTION_MAP_GOVERNANCE
BUILD: 20260517-V10.39.2-EXECUTION-MAP-GOVERNANCE
BASE_FROM: KGEN_12345_V10_39_1_TEMPLE_ARCHITECTURE_MASTER_FULL.zip
RULE: Official filename is fixed. Version is written here, not in filename.
*/
/* KGEN 12345 V10.34 Install / Organ Check */
(function(){
  'use strict';
  const REQUIRED_DOM=['core-anchor','core-window','fairy-img','warp-input-val','warp-thumb','energy-fill','warp-txt','move-joystick-wrap','move-joystick-knob'];
  const REQUIRED_ASSETS=['assets/wukong_heart_v10_4.png'];
  function speak(msg){ try{ if(window.app&&app.speak) app.speak(msg); else if('speechSynthesis' in window){ const u=new SpeechSynthesisUtterance(msg); u.lang='zh-TW'; speechSynthesis.speak(u);} }catch(e){} }
  function statusBox(){
    let box=document.getElementById('kgen-v1034-status');
    if(!box){ box=document.createElement('div'); box.id='kgen-v1034-status'; document.body.appendChild(box); }
    return box;
  }
  function checkImage(src){
    return new Promise(resolve=>{ const img=new Image(); img.onload=()=>resolve(true); img.onerror=()=>resolve(false); img.src=src + (src.includes('?')?'&':'?') + 'v1034check=' + Date.now(); });
  }
  async function run(){
    const missing=[];
    REQUIRED_DOM.forEach(id=>{ if(!document.getElementById(id)) missing.push('#'+id); });
    for(const a of REQUIRED_ASSETS){ if(!(await checkImage(a))) missing.push(a); }
    const loaded=[
      window.KGEN12345_VERSION?'version':'',
      window.KGEN12345_TransformerCore?'transformer-core':'',
    ].filter(Boolean);
    const box=statusBox();
    if(missing.length){
      box.innerHTML='<b>V10.34 器官檢查：</b><span class="bad">缺檔 / 缺節點：</span> '+missing.join('、');
      speak('五指山器官檢查發現缺檔，請檢查檔案路徑。');
    }else{
      box.innerHTML='<b>V10.34 器官檢查：</b><span class="ok">OK</span>｜CY/WARP 分離｜modules '+loaded.join('+');
    }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', run); else run();
  window.addEventListener('load', ()=>setTimeout(run,600));
})();
