/*
PRIMEFORGE_LIFE_HEADER_V1:
  CIVILIZATION_INFO:
    CIVILIZATION_ID: KGEN-PRIME-CIVILIZATION
    CIVILIZATION_NAME: KLINE ODYSSEY
    GALAXY: Internet
    PLANET: GitHub
    REPO: klineodyssey/kline-odyssey
    CHAIN_NETWORK: BNB Smart Chain
    SURVIVAL_RULE: 沒有質量，就沒有位置
  STRUCTURE_COORDINATE:
    ROOT_STRUCTURE: /K線西遊記
    CITY_STRUCTURE: /K線西遊記/temples/12345
    CURRENT_LIFE_COORDINATE: /modules/runtime-regeneration.js
  FILE_CERTIFICATE:
    FILE: runtime-regeneration.js
    PATH: /modules/runtime-regeneration.js
    PRODUCT_ID: KGEN-12345-HEART-UI
    LIFE_LAYER: ORGAN
    LIFE_TYPE: JavaScript Organ Lifeform
    VERSION: 12345-TEMPLE-V10.48.0-LIFE-STANDARD-REGENERATION
    BUILD: 20260525-V10.48.0-LIFE-STANDARD-REGENERATION
    BIRTH: 2026-05-25
    BASE_FROM: KGEN_12345_V10_47_1_LAYOUT_REAL_FIX_FULL_GITHUB_READY.zip
    UPGRADE_FROM: 12345-TEMPLE-V10.47.1-LAYOUT-REAL-FIX
    DEATH: ACTIVE
    GROWTH_STAGE: IMMORTAL_REGENERATION_STANDARDIZATION
  TAXONOMY:
    DOMAIN: KGENVERSE
    KINGDOM: FinancialLifeform
    PHYLUM: RuntimeOrganism
    CLASS: OrganRuntime
    ORDER: JavaScriptOrgan
    FAMILY: PrimeForgeLife
    GENUS: KGEN12345
    SPECIES: runtime-regeneration.js
    CELL: Function Cell Cluster
    ORGAN: Regeneration Organ
    DNA: JS-ORGAN-DNA
  IMMUNE_SYSTEM:
    VIRUS_SCAN: ENABLED
    HASH_VALIDATION: REQUIRED
    UNKNOWN_ORGAN_BLOCK: TRUE
    PATCH_DRIFT_BLOCK: TRUE
    VERSION_FILENAME_BLOCK: TRUE
    SELF_HEALING: ENABLED
  REGENERATION:
    EMBRYO_MODE: GZIP_BASE64
    CAN_REBUILD_FROM_EMBRYO: TRUE
    REJUVENATION: ENABLED
    IMMORTALITY_CLASS: WUKONG_LONGEVITY
  SECURITY_FINGERPRINT:
    FINAL_SHA256: FILLED_IN_SHA256SUMS

*/

/*
FILE: modules/kgen-12345-divine-regeneration.js
PRODUCT_ID: KGEN-12345-HEART-UI
VERSION: 12345-TEMPLE-V10.44.2-FESTIVAL-HEART-CLOCK-RECORDING-SYNC
BUILD: 20260520-V10.44.2-FESTIVAL-HEART-CLOCK-RECORDING-SYNC
BASE_FROM: V10.44.0 PrimeForge Mother Runtime Growth
BORN: 2026-05-20
STATUS: ACTIVE
DNA: divine-regeneration / no-scar-rebuild / 12345-recorder-identity / festival-organ-cell
DEATH: NONE
PURPOSE: Adds no-scar self-healing for the recording organ and festival organ. Does not seize Warp, Sphere, wallet, or Heart contract nerves.
*/
(function(){
  'use strict';
  const VERSION='12345-TEMPLE-V10.44.2-FESTIVAL-HEART-CLOCK-RECORDING-SYNC';
  const BUILD='20260520-V10.44.2-FESTIVAL-HEART-CLOCK-RECORDING-SYNC';
  const IDENTITY={
    title:'KGEN 12345 五指山悟空財神殿',
    log:'KGEN 12345 WUKONG-TEMPLE-LOG',
    filename:'KGEN_12345_WUKONG_TEMPLE_RECORD',
    capture:'KGEN_12345_WUKONG_TEMPLE_CAPTURE'
  };
  const DNA={id:'DIVINE_REGENERATION_RECORDING_CELL',version:VERSION,build:BUILD,status:'ACTIVE'};
  window.KGEN_12345_DIVINE_REGENERATION = {VERSION,BUILD,DNA,IDENTITY};

  function $(id){return document.getElementById(id);}
  function say(msg){try{window.app&&window.app.speak&&window.app.speak(msg);}catch(_){}}
  function log(msg,type='info'){
    try{window.app&&window.app.toast&&window.app.toast(msg);}catch(_){ }
    const s=$('kgen-v902-left-status'); if(s) s.textContent=msg;
    console[type==='error'?'error':'log']('[KGEN V10.44.2]',msg);
  }
  function ensureHud(){
    let hud=$('kgen-v10441-rec-heal-hud');
    if(hud) return hud;
    hud=document.createElement('div');
    hud.id='kgen-v10441-rec-heal-hud';
    hud.innerHTML='<b>五指山錄影器官</b><div id="kgen-v10441-rec-msg">待命</div><div class="actions"><button id="kgen-v10441-rec-stop">停止並下載</button><button class="secondary" id="kgen-v10441-rec-close">關閉</button></div>';
    document.body.appendChild(hud);
    $('kgen-v10441-rec-close').onclick=()=>hud.classList.remove('show');
    $('kgen-v10441-rec-stop').onclick=()=>{ if(window.KGEN_12345_RECORDING && window.KGEN_12345_RECORDING.stop) window.KGEN_12345_RECORDING.stop(); };
    return hud;
  }
  function showHud(msg,showStop=true){
    const hud=ensureHud(); const t=$('kgen-v10441-rec-msg'); if(t) t.textContent=msg;
    const stop=$('kgen-v10441-rec-stop'); if(stop) stop.style.display=showStop?'inline-block':'none';
    hud.classList.add('show');
  }
  function hideHud(){const h=$('kgen-v10441-rec-heal-hud'); if(h) h.classList.remove('show');}

  const rec={stream:null, recorder:null, chunks:[], active:false, timer:null, mode:null, startedAt:0, elapsed:'00:00'};
  function fmtElapsed(ms){ const sec=Math.max(0,Math.floor((Number(ms)||0)/1000)); const h=Math.floor(sec/3600); const m=Math.floor((sec%3600)/60); const s=sec%60; return h>0 ? String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')+':'+String(s).padStart(2,'0') : String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); }
  function updateRecClock(){
    if(!rec.active) return;
    rec.elapsed=fmtElapsed(Date.now()-rec.startedAt);
    try{ if(window.app){ window.app.recMMSS=rec.elapsed; } }catch(_){}
    const msg=$('kgen-v10441-rec-msg'); if(msg) msg.textContent='錄影中｜'+rec.elapsed+'｜'+(rec.mode==='screen'?'螢幕錄影模式':'五指山神殿留影模式');
    const ind=$('rec-ind'); if(ind){ ind.style.display='block'; ind.textContent='REC '+rec.elapsed; }
    document.querySelectorAll('#rec-btn,.btn-rec').forEach(btn=>{ if(/錄影|停止|REC/.test(btn.textContent||'')) btn.textContent='⏹️ 停止錄影｜REC '+rec.elapsed; });
  }
  function chooseMime(){
    if(!window.MediaRecorder || !MediaRecorder.isTypeSupported) return '';
    const mimes=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'];
    return mimes.find(m=>MediaRecorder.isTypeSupported(m)) || '';
  }
  function setBtn(active){
    document.querySelectorAll('#rec-btn,.btn-rec').forEach(btn=>{
      btn.textContent=active?('⏹️ 停止錄影｜REC '+(rec.elapsed||'00:00')):'🎥 五指山神殿留影錄影';
      btn.classList.toggle('active-kgen',!!active);
    });
    document.body.classList.toggle('kgen-v10441-body-recording',!!active); if(!active){ const ind=$('rec-ind'); if(ind){ind.style.display='none'; ind.textContent='REC 00:00';} }
  }
  function stopTracks(){try{rec.stream&&rec.stream.getTracks().forEach(t=>t.stop());}catch(_){}}
  function stop(){
    try{ if(rec.recorder && rec.recorder.state==='recording'){ rec.recorder.stop(); return; } }catch(e){ log('停止錄影失敗：'+(e.message||e),'error'); }
    rec.active=false; setBtn(false); stopTracks(); showHud('目前沒有正在錄影。',false);
  }
  async function buildCanvasStream(){
    const canvas=$('export-canvas');
    if(!canvas) throw new Error('export-canvas missing');
    if(window.app && typeof window.app.syncExportCanvas==='function') window.app.syncExportCanvas();
    if(typeof canvas.captureStream!=='function') throw new Error('canvas.captureStream unsupported');
    return canvas.captureStream(30);
  }
  async function buildScreenStream(){
    if(!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) throw new Error('getDisplayMedia unsupported');
    return navigator.mediaDevices.getDisplayMedia({video:true,audio:true});
  }
  async function start(){
    if(rec.active) return stop();
    if(!window.MediaRecorder){
      showHud('此瀏覽器不支援網頁錄影。請啟用手機系統內建螢幕錄影；12345 身分標題已修正，不再顯示 16888。',false);
      say('此瀏覽器不支援網頁錄影，請使用手機系統內建螢幕錄影。');
      return;
    }
    let stream=null, mode='canvas';
    try{
      try{ stream=await buildCanvasStream(); mode='canvas'; }
      catch(canvasErr){ stream=await buildScreenStream(); mode='screen'; }
      const mime=chooseMime();
      rec.stream=stream; rec.chunks=[]; rec.mode=mode; rec.startedAt=Date.now();
      rec.recorder = mime ? new MediaRecorder(stream,{mimeType:mime}) : new MediaRecorder(stream);
      rec.recorder.ondataavailable=e=>{ if(e.data&&e.data.size) rec.chunks.push(e.data); };
      rec.recorder.onstop=()=>{
        try{clearInterval(rec.timer);}catch(_){ }
        stopTracks(); rec.active=false; setBtn(false);
        const blob=new Blob(rec.chunks,{type:'video/webm'});
        if(blob.size>0){
          const url=URL.createObjectURL(blob);
          const a=document.createElement('a');
          a.href=url; a.download=IDENTITY.filename+'_'+new Date().toISOString().replace(/[:.]/g,'-')+'.webm';
          document.body.appendChild(a); a.click();
          setTimeout(()=>{URL.revokeObjectURL(url); a.remove();},1600);
          showHud('錄影已完成並下載。',false);
          say('五指山錄影已完成。');
        }else{
          showHud('錄影資料為空。請改用手機系統內建錄影或更換支援 MediaRecorder 的瀏覽器。',false);
        }
      };
      rec.recorder.start(1000); rec.active=true; setBtn(true);
      rec.elapsed='00:00'; try{ if(window.app) window.app.recMMSS='00:00'; }catch(_){}
      rec.timer=setInterval(()=>{ updateRecClock(); if(window.app && rec.mode==='canvas' && typeof window.app.syncExportCanvas==='function') window.app.syncExportCanvas(); },250);
      updateRecClock();
      showHud('錄影中：'+(mode==='canvas'?'五指山神殿留影模式':'螢幕錄影模式')+'。再按一次錄影或按停止即可下載。',true);
      say('五指山神殿錄影開始。');
    }catch(e){
      rec.active=false; setBtn(false); stopTracks();
      showHud('錄影未啟動：'+(e&&e.message?e.message:e)+'。若瀏覽器限制，請用手機系統內建錄影。',false);
      say('錄影未啟動，可能是瀏覽器限制或使用者取消。');
    }
  }
  window.KGEN_12345_RECORDING={start,stop,rec,version:VERSION};

  function patchAppIdentity(){
    if(!window.app) return false;
    const app=window.app;
    const oldSync=app.syncExportCanvas&&app.syncExportCanvas.bind(app);
    app.syncExportCanvas=function(){
      const cvs=$('export-canvas'), ctx=cvs&&cvs.getContext&&cvs.getContext('2d');
      if(!cvs||!ctx){ return oldSync?oldSync():null; }
      cvs.width=720; cvs.height=720;
      const v=$('cam-view'), f=$('fairy-img');
      try{
        if(app.isCam && v){
          if(app.camMode==='user'){ctx.translate(720,0);ctx.scale(-1,1);} ctx.drawImage(v,0,0,720,720); ctx.setTransform(1,0,0,1,0,0);
        }else if(f){ctx.drawImage(f,0,0,720,720);} else {ctx.fillStyle='#000';ctx.fillRect(0,0,720,720);}
      }catch(_){ctx.fillStyle='#000';ctx.fillRect(0,0,720,720);}
      const angle=($('steer-input-val')||{}).value||'0';
      const warp=($('warp-input-val')||{}).value||'0';
      ctx.fillStyle='#ffd778';ctx.font='bold 30px Noto Sans TC';ctx.fillText(IDENTITY.log,30,50);
      ctx.fillStyle='#00f2ff';ctx.font='bold 22px Orbitron';ctx.fillText('ANGLE '+angle+'°',30,85);ctx.fillText('WARP '+Math.round(Number(warp||0)*3)+'x',30,115);ctx.fillText('GA '+(app.gaLevel||600),30,145);
      ctx.fillStyle='#ff4444';ctx.font='bold 26px Orbitron';ctx.fillText('REC '+(rec.elapsed||app.recMMSS||'00:00'),30,185);
      ctx.fillStyle='#fff';ctx.font='bold 26px Noto Sans TC';ctx.shadowBlur=10;ctx.shadowColor='#000';ctx.fillText(($('wish-label')||{}).innerText||'悟空心臟｜五指山',30,690);ctx.shadowBlur=0;
    };
    const oldCapture=app.capture&&app.capture.bind(app);
    app.capture=function(){
      const canvas=$('snap-canvas'), ctx=canvas&&canvas.getContext&&canvas.getContext('2d');
      if(!canvas||!ctx){return oldCapture?oldCapture():null;}
      canvas.width=1000;canvas.height=1000;
      const v=$('cam-view'), f=$('fairy-img');
      try{
        if(app.isCam && v){ if(app.camMode==='user'){ctx.translate(1000,0);ctx.scale(-1,1);} ctx.drawImage(v,0,0,1000,1000); ctx.setTransform(1,0,0,1,0,0); if(f)ctx.drawImage(f,750,50,200,200); }
        else if(f){ctx.drawImage(f,0,0,1000,1000);} else {ctx.fillStyle='#000';ctx.fillRect(0,0,1000,1000);}
      }catch(_){ctx.fillStyle='#000';ctx.fillRect(0,0,1000,1000);}
      ctx.fillStyle='#ffd778';ctx.font='bold 40px Noto Sans TC';ctx.fillText(IDENTITY.title,50,80);
      ctx.fillStyle='#ffcc00';ctx.font='24px Orbitron';ctx.fillText('EVO RANK: GA-'+(app.gaLevel||600)+' | '+new Date().toLocaleString(),50,120);
      ctx.fillStyle='#fff';ctx.font='bold 45px Noto Sans TC';ctx.shadowBlur=10;ctx.shadowColor='#000';ctx.fillText(($('wish-label')||{}).innerText||'悟空心臟｜五指山',70,930);ctx.shadowBlur=0;
      const link=document.createElement('a');link.download=IDENTITY.capture+'_'+Date.now()+'.png';link.href=canvas.toDataURL();link.click();
    };
    app.toggleRec=start;
    return true;
  }

  function patchButtons(){
    document.querySelectorAll('button,.term-btn').forEach(btn=>{
      const t=(btn.textContent||'').trim();
      if(/錄影/.test(t)){
        btn.onclick=function(e){e&&e.preventDefault&&e.preventDefault();e&&e.stopPropagation&&e.stopPropagation();start();return false;};
      }
    });
  }
  function patchFestival(){
    const panel=$('kgen-v102-festival-panel'); if(!panel) return;
    const h=panel.querySelector('h3'); if(!h) return;
    if(!h.dataset.v10441){
      h.dataset.v10441='1';
      h.onclick=()=>panel.classList.toggle('kgen-festival-collapsed');
      panel.classList.add('kgen-festival-collapsed');
    }
    const cd=$('kgen-v102-festival-countdown');
    if(cd && !cd.dataset.v10441){
      cd.dataset.v10441='1';
      let last='';
      const stable=()=>{
        const txt=(cd.textContent||'').replace(/\s+/g,' ').trim();
        const noSec=txt.replace(/\d+秒/g,'');
        if(noSec!==last){ last=noSec; cd.textContent=noSec; }
      };
      new MutationObserver(()=>setTimeout(stable,0)).observe(cd,{childList:true,characterData:true,subtree:true});
      stable();
    }
  }

  /* V10.44.2 Festival Heart Clock: one visible festival clock, old countdown nerves quarantined. */
  function pad(n){return String(n).padStart(2,'0');}
  function nextLocal(month,day,hour=0,min=0,sec=0){
    const now=new Date(); let y=now.getFullYear(); let d=new Date(y,month-1,day,hour,min,sec,0); if(d.getTime()<=now.getTime()) d=new Date(y+1,month-1,day,hour,min,sec,0); return d;
  }
  function fmtNoSeconds(ms){
    ms=Math.max(0,Number(ms)||0); const totalMin=Math.floor(ms/60000); const days=Math.floor(totalMin/1440); const hours=Math.floor((totalMin%1440)/60); const mins=totalMin%60;
    if(days>0) return days+'天 '+pad(hours)+'時 '+pad(mins)+'分';
    return pad(hours)+'時 '+pad(mins)+'分';
  }
  function renderFestivalHeart(){
    const cd=$('kgen-v102-festival-countdown'); if(!cd) return;
    const now=Date.now();
    const ny=nextLocal(12,31,23,59,59).getTime()-now;
    const d520=nextLocal(5,20,0,0,0).getTime()-now;
    const d1111=nextLocal(11,11,0,0,0).getTime()-now;
    const text='跨年 '+fmtNoSeconds(ny)+'｜520 '+fmtNoSeconds(d520)+'｜1111 '+fmtNoSeconds(d1111);
    if(cd.dataset.kgenStableText!==text){ cd.dataset.kgenStableText=text; cd.textContent=text; }
  }
  function quarantineOldCountdownNerves(){
    const keep=$('kgen-v102-festival-panel');
    const candidates=[];
    ['kgen-activity-countdowns','kh-ny-countdown','human-cd-520','human-cd-1111','human-cd-1231','cd-520','cd-1111','cd-1231','kgen-ny-countdown','v714-ny-count','kh-ny-slot'].forEach(id=>{const el=$(id); if(el) candidates.push(el);});
    document.querySelectorAll('.kh-ny-countdown,[class*="ny-count"],[class*="countdown"]').forEach(el=>{ const tx=(el.textContent||''); if(/跨年|520|1111|newYear|festival/i.test(tx) || /ny|countdown/i.test(el.id||'')) candidates.push(el); });
    Array.from(new Set(candidates)).forEach(el=>{
      if(!el || (keep && keep.contains(el))) return;
      el.dataset.kgenV10442Quarantined='1';
      el.style.display='none';
      el.style.animation='none'; el.style.transition='none'; el.style.opacity='1';
    });
  }
  let festivalTimer=null;
  function startFestivalHeartClock(){
    if(festivalTimer) clearInterval(festivalTimer);
    renderFestivalHeart(); quarantineOldCountdownNerves();
    festivalTimer=setInterval(()=>{ renderFestivalHeart(); quarantineOldCountdownNerves(); },1000);
  }

  function boot(){
    patchAppIdentity(); patchButtons(); patchFestival(); startFestivalHeartClock(); hideHud();
    log('V10.44.2 神級再生器官已啟動：錄影秒數同步、節日單心跳、舊倒數神經隔離。');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setTimeout(boot,800);
  setTimeout(boot,2200);
})();
