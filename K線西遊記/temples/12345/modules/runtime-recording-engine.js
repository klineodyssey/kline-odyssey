/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-recording-engine.js
VERSION: V10.40.3_MOBILE_LAYOUT_SAFE_ASSET_FIX
BUILD: 20260518-V10.40.3-MOBILE-LAYOUT-SAFE-ASSET-FIX
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip
RULE: Active JS/CSS stays in modules single layer. V9 recorder core restored.
*/

(function(){
  'use strict';
  if(window.__KGEN_V9_RECORDER_CORE_RESTORE__) return;
  window.__KGEN_V9_RECORDER_CORE_RESTORE__ = true;

  function $(id){ return document.getElementById(id); }
  function safeText(id, val){ const el=$(id); if(el) el.textContent=val; }
  function speak(msg){ try{ window.app && app.speak && app.speak(msg); }catch(_){} }
  function dl(blob, name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},1200); }

  function ensureExportCanvas(){
    let c=$('export-canvas');
    if(!c){ c=document.createElement('canvas'); c.id='export-canvas'; c.style.display='none'; document.body.appendChild(c); }
    return c;
  }
  function ensureRecInd(){
    let r=$('rec-ind');
    if(!r){ r=document.createElement('div'); r.id='rec-ind'; r.style.cssText='position:fixed;right:22px;bottom:408px;z-index:900;color:#ff4444;font-family:Orbitron,monospace;font-weight:900;text-shadow:0 0 10px #f44;display:none;'; document.body.appendChild(r); }
    return r;
  }

  function syncExportCanvas(){
    const cvs=ensureExportCanvas();
    const ctx=cvs.getContext('2d');
    cvs.width=720; cvs.height=720;
    const v=$('cam-view'), f=$('fairy-img');
    ctx.fillStyle='#000'; ctx.fillRect(0,0,720,720);
    try{
      if(window.app && app.isCam && v && v.readyState >= 2){
        if(app.camMode === 'user'){ ctx.translate(720,0); ctx.scale(-1,1); }
        ctx.drawImage(v,0,0,720,720); ctx.setTransform(1,0,0,1,0,0);
      }else if(f){ ctx.drawImage(f,0,0,720,720); }
    }catch(e){ ctx.fillStyle='#000'; ctx.fillRect(0,0,720,720); }
    const angle=($('steer-input-val')||{}).value || (($('ang-val')||{}).textContent||'0').replace('°','');
    const warp=($('warp-input-val')||{}).value || '0';
    const ga=(window.app&&app.gaLevel)||'600';
    ctx.fillStyle='#ffd778'; ctx.font='bold 30px sans-serif'; ctx.fillText('KGEN 12345 WUKONG HEART LOG',30,50);
    ctx.fillStyle='#00f2ff'; ctx.font='bold 22px monospace'; ctx.fillText('ANGLE '+angle+'°',30,85); ctx.fillText('WARP '+Math.round(Number(warp||0)*3)+'x',30,115); ctx.fillText('GA '+ga,30,145);
    const recMMSS=(window.app&&app.recMMSS)||'00:00'; ctx.fillStyle='#ff4444'; ctx.font='bold 26px monospace'; ctx.fillText('REC '+recMMSS,30,185);
    ctx.fillStyle='#fff'; ctx.font='bold 26px sans-serif'; ctx.shadowBlur=10; ctx.shadowColor='#000'; ctx.fillText((($('wish-label')||{}).textContent||'悟空心臟'),30,690); ctx.shadowBlur=0;
  }

  function startTimer(){
    const ind=ensureRecInd(); ind.style.display='block';
    window.app = window.app || {};
    app.recStartTs=performance.now();
    clearInterval(app.tInt); clearInterval(app.drawInt);
    app.tInt=setInterval(()=>{ const sec=Math.floor((performance.now()-app.recStartTs)/1000); const m=String(Math.floor(sec/60)).padStart(2,'0'), s=String(sec%60).padStart(2,'0'); app.recMMSS=m+':'+s; ind.textContent='REC '+app.recMMSS; },200);
    app.drawInt=setInterval(syncExportCanvas,33);
  }
  function stopTimer(){ clearInterval(window.app&&app.tInt); clearInterval(window.app&&app.drawInt); const ind=ensureRecInd(); ind.style.display='none'; }

  async function toggleRecV9(){
    const btn=$('rec-btn') || Array.from(document.querySelectorAll('button')).find(b=>/錄影|留影/.test(b.textContent||''));
    window.app = window.app || {};
    if(app.recorder && app.recorder.state === 'recording'){
      app.recorder.stop(); stopTimer();
      try{ clearInterval(app.bbSampleInt); app.bbStop && app.bbStop(); app.bbExportJSON && await app.bbExportJSON(); }catch(_){}
      if(btn) btn.textContent='🎥 五指山神殿留影錄影';
      speak('錄影結束，五指山神殿留影數據已封裝。');
      return;
    }
    if(!window.MediaRecorder){ alert('此瀏覽器不支援 MediaRecorder，請用 Chrome / Android 測試。'); return; }
    const cvs=ensureExportCanvas(); syncExportCanvas();
    const stream=cvs.captureStream ? cvs.captureStream(30) : null;
    if(!stream){ alert('此瀏覽器不支援 canvas captureStream，請用 Chrome。'); return; }
    let mime='video/webm;codecs=vp9';
    if(!MediaRecorder.isTypeSupported(mime)) mime='video/webm;codecs=vp8';
    if(!MediaRecorder.isTypeSupported(mime)) mime='video/webm';
    app.recorder=new MediaRecorder(stream,{mimeType:mime}); app.chunks=[];
    app.recorder.ondataavailable=e=>{ if(e.data && e.data.size) app.chunks.push(e.data); };
    app.recorder.onstop=()=>{ dl(new Blob(app.chunks,{type:'video/webm'}),'KGEN_12345_WUKONG_HEART_LOG.webm'); try{ stream.getTracks().forEach(t=>t.stop()); }catch(_){} };
    try{ app.bbStart && app.bbStart(); app.bbSample && app.bbSample(); app.bbSampleInt=setInterval(()=>app.bbSample && app.bbSample(),1000); }catch(_){}
    startTimer(); syncExportCanvas(); app.recorder.start();
    if(btn) btn.textContent='⏹️ 停止五指山誓約留影';
    speak('五指山神殿留影錄影開始，記錄演化數據。');
  }

  function bind(){
    window.app = window.app || {};
    app.syncExportCanvas=syncExportCanvas;
    app.toggleRec=toggleRecV9;
    document.querySelectorAll('button,a,[role="button"],.term-btn,.nav-btn').forEach(btn=>{
      if(btn.dataset.kgenV9RecBound) return;
      if(/錄影|留影|營幕錄影|螢幕錄影/.test(btn.textContent||'')){
        btn.dataset.kgenV9RecBound='1';
        btn.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); toggleRecV9(); }, true);
      }
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', bind); else bind();
  setInterval(bind,1800);
})();
