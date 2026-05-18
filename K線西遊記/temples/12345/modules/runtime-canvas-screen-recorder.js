/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-canvas-screen-recorder.js
VERSION: V10.40.3_CANVAS_SCREEN_VISUAL_WARP_FULL
BUILD: 20260518-V10.40.3-CANVAS-SCREEN-VISUAL-WARP-FULL
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip
PURPOSE: Canvas screen recorder fallback, visual four-image binding, warp-core rail binding, Holy Cup layout.
RULE: Active JS/CSS stays in modules single layer. No modules/runtime folder.
*/

(function(){
  'use strict';
  if(window.__KGEN_CANVAS_SCREEN_RECORDER_V10403__) return;
  window.__KGEN_CANVAS_SCREEN_RECORDER_V10403__ = true;

  const $ = id => document.getElementById(id);
  const qsa = s => Array.from(document.querySelectorAll(s));
  const txt = el => (el && el.textContent || '').replace(/\s+/g,' ').trim();
  const isScreenBtn = b => /螢幕錄影|營幕錄影|全程錄影/.test(txt(b));
  const isRecBtn = b => /神殿留影錄影|五指山神殿留影|錄影/.test(txt(b));
  let rec = { recorder:null, chunks:[], stream:null, drawTimer:null, timer:null, start:0, mode:'' };

  function speak(m){ try{ window.app && app.speak && app.speak(m); }catch(_){} }
  function dl(blob,name){ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); }
  function ensureCanvas(){ let c=$('kgen-screen-export-canvas'); if(!c){ c=document.createElement('canvas'); c.id='kgen-screen-export-canvas'; c.style.display='none'; document.body.appendChild(c); } return c; }
  function ensureInd(){ let r=$('rec-ind'); if(!r){ r=document.createElement('div'); r.id='rec-ind'; document.body.appendChild(r); } r.style.cssText='position:fixed;right:18px;bottom:408px;z-index:200000;color:#ff4444;font-family:Orbitron,monospace;font-weight:900;text-shadow:0 0 10px #f44;display:none;'; return r; }
  function firstImg(){ return $('fairy-img') || $('core-img') || document.querySelector('#core-window img,img[data-kgen-core]'); }

  function drawPanel(ctx, x, y, w, h, title, lines){
    ctx.save(); ctx.globalAlpha=.88; ctx.fillStyle='rgba(0,0,0,.72)'; ctx.strokeStyle='rgba(255,215,120,.5)'; ctx.lineWidth=1; round(ctx,x,y,w,h,12); ctx.fill(); ctx.stroke(); ctx.globalAlpha=1; ctx.fillStyle='#ffd778'; ctx.font='bold 15px sans-serif'; ctx.fillText(title,x+12,y+22); ctx.fillStyle='#dffbff'; ctx.font='bold 12px sans-serif'; lines.slice(0,5).forEach((l,i)=>ctx.fillText(String(l).slice(0,42),x+12,y+44+i*18)); ctx.restore();
  }
  function round(ctx,x,y,w,h,r){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); }

  function drawScreenCanvas(){
    const c=ensureCanvas(); const ctx=c.getContext('2d');
    const W=720,H=1280; c.width=W; c.height=H;
    ctx.fillStyle='#000'; ctx.fillRect(0,0,W,H);
    // background canvas
    try{ const bg=$('galaxy-bg'); if(bg) ctx.drawImage(bg,0,0,W,H); }catch(_){ }
    // star fallback
    ctx.fillStyle='rgba(0,242,255,.75)'; for(let i=0;i<160;i++){ const x=(Math.sin(i*987.1)+1)*W/2, y=(Math.cos(i*321.7)+1)*H/2; ctx.fillRect(x,y,(i%5)+1,(i%5)+1); }
    // top header simplified
    const version=(($('ver-st')||{}).textContent||'KGEN 12345').replace('VERSION ','');
    ctx.fillStyle='#ffd778'; ctx.font='bold 22px sans-serif'; ctx.fillText('KGEN 12345 五指山悟空財神殿',18,42);
    ctx.fillStyle='#00f2ff'; ctx.font='bold 11px monospace'; ctx.fillText(version.slice(0,74),18,64);
    // market panels snapshot text
    drawPanel(ctx,18,88,282,150,'悟空心臟引擎',[
      '方向 '+(($('ke-side')||{}).textContent||'--')+' / 角度 '+(($('ke-angle')||{}).textContent||'--'),
      'Open '+(($('ke-open')||{}).textContent||'--')+' High '+(($('ke-high')||{}).textContent||'--'),
      'Low '+(($('ke-low')||{}).textContent||'--')+' Close '+(($('ke-close')||{}).textContent||'--'),
      (($('ke-live-symbol')||{}).textContent||'')+' '+(($('ke-live-price')||{}).textContent||'')
    ]);
    drawPanel(ctx,420,88,280,150,'GA / Festival',[
      'FITNESS '+(($('f-val')||{}).textContent||'--'),
      'WARP '+(($('warp-txt')||{}).textContent||'--'),
      'C '+(window.KGEN_WARP_LEVEL||0)+' / 300'
    ]);
    // central image
    const img=firstImg();
    if(img){ try{ ctx.save(); ctx.translate(W/2,565); const deg=parseFloat((($('ang-val')||{}).textContent||'0').replace('°',''))||0; ctx.rotate(deg*Math.PI/180); ctx.beginPath(); ctx.arc(0,0,185,0,Math.PI*2); ctx.clip(); ctx.drawImage(img,-185,-185,370,370); ctx.restore(); ctx.strokeStyle='#ffd778'; ctx.lineWidth=8; ctx.beginPath(); ctx.arc(W/2,565,190,0,Math.PI*2); ctx.stroke(); }catch(_){ } }
    // warp rail
    ctx.save(); const railX=642, railY=365, railH=420; ctx.strokeStyle='#ffd778'; ctx.lineWidth=4; round(ctx,railX,railY,32,railH,8); ctx.stroke(); const cLvl=Math.max(0,Math.min(300,Number(window.KGEN_WARP_LEVEL||((($('warp-input-val')||{}).value||0)*3)))); const p=cLvl/300; ctx.fillStyle='rgba(255,180,0,.85)'; ctx.fillRect(railX+4,railY+railH-(railH*p),24,railH*p); ctx.fillStyle='#00f2ff'; ctx.shadowBlur=18; ctx.shadowColor='#00f2ff'; ctx.fillRect(railX-12,railY+railH-(railH*p)-12,56,24); ctx.shadowBlur=0; ctx.fillStyle='#ffd778'; ctx.font='bold 18px monospace'; ctx.fillText('WARP '+Math.round(cLvl)+'/300',560,830); ctx.restore();
    // bottom state
    const angle=(($('ang-val')||{}).textContent||'0°'); const label=(($('wish-label')||{}).textContent||'悟空心臟'); const recTime=window.KGEN_REC_MMSS||'00:00';
    ctx.fillStyle='#00f2ff'; ctx.font='bold 48px monospace'; ctx.textAlign='center'; ctx.fillText(angle,W/2,1038); ctx.font='bold 14px sans-serif'; ctx.fillText(label,W/2,1080); ctx.fillStyle='#ff4444'; ctx.font='bold 22px monospace'; ctx.fillText('REC '+recTime,W/2,1120); ctx.textAlign='left';
  }
  function startTimer(){ const ind=ensureInd(); ind.style.display='block'; rec.start=performance.now(); clearInterval(rec.timer); clearInterval(rec.drawTimer); rec.timer=setInterval(()=>{ const sec=Math.floor((performance.now()-rec.start)/1000); const m=String(Math.floor(sec/60)).padStart(2,'0'), s=String(sec%60).padStart(2,'0'); window.KGEN_REC_MMSS=m+':'+s; ind.textContent='REC '+window.KGEN_REC_MMSS; },200); rec.drawTimer=setInterval(drawScreenCanvas,33); }
  function stopTimer(){ clearInterval(rec.timer); clearInterval(rec.drawTimer); const ind=ensureInd(); ind.style.display='none'; }
  function stop(){ if(rec.recorder && rec.recorder.state==='recording'){ rec.recorder.stop(); } }
  function chooseMime(){ let m='video/webm;codecs=vp9'; if(!MediaRecorder.isTypeSupported(m)) m='video/webm;codecs=vp8'; if(!MediaRecorder.isTypeSupported(m)) m='video/webm'; return m; }
  function startCanvasRecorder(mode){
    if(!window.MediaRecorder){ alert('此瀏覽器不支援 MediaRecorder，請用 Chrome。'); return; }
    if(rec.recorder && rec.recorder.state==='recording'){ stop(); return; }
    const c=ensureCanvas(); drawScreenCanvas(); const stream=c.captureStream ? c.captureStream(30) : null;
    if(!stream){ alert('此瀏覽器不支援 canvas captureStream，請用 Chrome。'); return; }
    rec.mode=mode||'canvas'; rec.stream=stream; rec.chunks=[]; rec.recorder=new MediaRecorder(stream,{mimeType:chooseMime()});
    rec.recorder.ondataavailable=e=>{ if(e.data&&e.data.size) rec.chunks.push(e.data); };
    rec.recorder.onstop=()=>{ stopTimer(); try{stream.getTracks().forEach(t=>t.stop());}catch(_){} dl(new Blob(rec.chunks,{type:'video/webm'}),'KGEN_12345_SCREEN_CANVAS_LOG.webm'); setButtons(false); speak('錄影完成，檔案開始下載。'); };
    startTimer(); rec.recorder.start(); setButtons(true); speak('宇宙攝影錄影開始。手機 Chrome 使用 canvas 合成錄影，不再呼叫螢幕授權。');
  }
  function setButtons(on){ qsa('button,a,[role="button"],.term-btn,.nav-btn').forEach(b=>{ if(isScreenBtn(b)||isRecBtn(b)){ if(on) b.classList.add('kgen-recording-on'); else b.classList.remove('kgen-recording-on'); if(isScreenBtn(b)) b.innerHTML=on?'⏹️<br>停止錄影':'🎬<br>螢幕錄影'; } }); }
  window.KGEN_START_CANVAS_SCREEN_RECORDING=()=>startCanvasRecorder('screen-canvas');
  window.KGEN_STOP_CANVAS_SCREEN_RECORDING=stop;
  // Window capture fires before legacy document capture handlers.
  window.addEventListener('click',function(e){ const b=e.target && e.target.closest && e.target.closest('button,a,[role="button"],.term-btn,.nav-btn'); if(!b) return; if(isScreenBtn(b)){ e.preventDefault(); e.stopImmediatePropagation(); startCanvasRecorder('screen-canvas'); return false; } },true);
  function bind(){ qsa('button,a,[role="button"],.term-btn,.nav-btn').forEach(b=>{ if(b.__kgen10403Rec) return; if(isScreenBtn(b)){ b.__kgen10403Rec=1; b.onclick=null; } }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind(); setInterval(bind,1200);
})();
