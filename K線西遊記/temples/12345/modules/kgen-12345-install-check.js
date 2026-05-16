/* KGEN 12345 Install Check V10.35 */
(function(){
  'use strict';
  const REQUIRED=[
    'index.html','modules/kgen-12345-core.css','modules/kgen-12345-version.js','modules/kgen-12345-transformer-runtime.js','modules/kgen-12345-panel-router.js','modules/kgen-12345-holy-cup.js','modules/kgen-12345-install-check.js','assets/wukong_heart_v10_4.png'
  ];
  async function exists(path){try{const r=await fetch(path,{method:'HEAD',cache:'no-store'});return r.ok;}catch(e){return false;}}
  function show(msg,ok){
    let el=document.getElementById('kgen-install-check-pill');
    if(!el){el=document.createElement('div');el.id='kgen-install-check-pill';el.className='kgen-install-pill';document.body.appendChild(el);}
    el.textContent=msg; el.style.borderColor=ok?'rgba(0,242,255,.35)':'rgba(255,80,80,.6)';
    if(window.app&&app.speak&&!ok) try{app.speak('神殿檔案缺件，請檢查安裝包。');}catch(e){}
  }
  async function run(){
    const missing=[]; for(const p of REQUIRED){if(!(await exists(p))) missing.push(p);}
    show(missing.length?'器官檢查：缺 '+missing.join('、'):'器官檢查 OK｜V10.35 Transformer Final',missing.length===0);
    window.KGEN12345_INSTALL_CHECK={ok:missing.length===0,missing,required:REQUIRED};
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(run,800)); else setTimeout(run,800);
})();
