/*
 * KGEN 12345 Install Check
 * MODULE: kgen-12345-install-check.js
 * VERSION: V10.26.0
 * BASE_FROM: V10.18 TRUE LINK + V10.12 ROTATION MASTER
 * PURPOSE: Check required modules/assets at runtime. Missing files must be visible and spoken by voice support.
 */
(function(){
  'use strict';
  const VERSION = 'V10.26.0';
  const REQUIRED_FILES = [
    './assets/bull-front.png',
    './assets/bear-rear.png',
    './assets/heart.png',
    './assets/warp-core.png',
    './modules/kgen-12345-core.css',
    './modules/kgen-12345-version.js',
    './modules/kgen-12345-panel-router.js',
    './modules/kgen-12345-holy-cup.js',
    './modules/kgen-12345-stable-countdown.js',
    './modules/kgen-12345-motion-control.js',
    './modules/kgen-12345-install-check.js',
    './modules/kgen-12345-universe-elevator.js',
    './modules/kgen-12345-v10.26-autopilot-fix.js'
  ];

  function speak(msg){
    try{
      if(!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(msg);
      u.lang = 'zh-TW';
      u.rate = 1;
      window.speechSynthesis.speak(u);
    }catch(_e){}
  }

  function showBox(title, lines, ok){
    let box = document.getElementById('kgen-12345-install-check-box');
    if(!box){
      box = document.createElement('div');
      box.id = 'kgen-12345-install-check-box';
      box.style.cssText = [
        'position:fixed','left:10px','right:10px','top:10px','z-index:999999',
        'padding:12px','border:2px solid #ffcc00','border-radius:12px',
        'background:rgba(18,0,0,.94)','color:#ffd778','font-weight:900',
        'white-space:pre-wrap','font-size:12px','line-height:1.45',
        'box-shadow:0 0 28px rgba(255,204,0,.28)'
      ].join(';');
      document.body.appendChild(box);
    }
    box.textContent = title + '\n' + lines.join('\n');
    if(ok){
      box.style.display = 'none';
    }else{
      box.style.display = 'block';
    }
  }

  async function checkOne(path){
    try{
      const res = await fetch(path + (path.indexOf('?')>=0?'&':'?') + 'installCheck=' + Date.now(), {
        method:'HEAD',
        cache:'no-store'
      });
      if(res && res.ok) return true;
      // Some static hosts reject HEAD. Retry GET with Range fallback.
      const res2 = await fetch(path + (path.indexOf('?')>=0?'&':'?') + 'installCheck=' + Date.now(), {
        method:'GET',
        cache:'no-store',
        headers:{ 'Range':'bytes=0-0' }
      });
      return !!(res2 && res2.ok);
    }catch(_e){
      return false;
    }
  }

  async function run(){
    const missing = [];
    for(const file of REQUIRED_FILES){
      const ok = await checkOne(file);
      if(!ok) missing.push(file);
    }
    window.KGEN_12345_INSTALL_OK = missing.length === 0;
    window.KGEN_12345_INSTALL_REQUIRED_FILES = REQUIRED_FILES.slice();
    window.KGEN_12345_INSTALL_MISSING_FILES = missing.slice();

    if(missing.length){
      const title = '12345 INSTALL CHECK FAILED｜缺少必要檔案';
      showBox(title, missing, false);
      console.error('[KGEN 12345 INSTALL CHECK '+VERSION+'] missing:', missing);
      speak('悟空財神殿啟動檢查失敗。有必要檔案遺失，請查看畫面警告。');
      return false;
    }
    showBox('12345 INSTALL CHECK OK', [], true);
    console.log('[KGEN 12345 INSTALL CHECK '+VERSION+'] OK');
    return true;
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();


/* V10.24 manifest note: required asset names are fixed. Missing files display a warning and voice guidance. */
window.KGEN12345_REQUIRED_FILES_V1024 = [
  './assets/bull-front.png',
  './assets/bear-rear.png',
  './assets/heart.png',
  './assets/warp-core.png',
  './modules/kgen-12345-core.css',
  './modules/kgen-12345-version.js',
  './modules/kgen-12345-panel-router.js',
  './modules/kgen-12345-holy-cup.js',
  './modules/kgen-12345-stable-countdown.js',
  './modules/kgen-12345-motion-control.js',
  './modules/kgen-12345-install-check.js',
    './modules/kgen-12345-universe-elevator.js',
  './modules/kgen-12345-v10.26-autopilot-fix.js'
];
