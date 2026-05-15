/*
 * KGEN 12345 XYZ State Engine
 * VERSION: V10.15.0
 * BUILD: 20260515-XYZ-MIRROR-RULE-FIX
 * PATH: /K線西遊記/temples/12345/modules/kgen-12345-xyz-state-engine.js
 *
 * 固定資產路徑（不可改名）：
 * /K線西遊記/temples/12345/assets/bull-front.png
 * /K線西遊記/temples/12345/assets/bear-rear.png
 * /K線西遊記/temples/12345/assets/warp-universe.png
 *
 * XYZ 定義：
 * X = 左右位移，只由左下 MOVE 控制。
 * Y = 上下位移 / 曲速同步，只由左下 MOVE 與右下 WARP 控制。
 * Z = 多空方向，只由右下 DRIVE 與中下 CORE 方向橫桿控制。
 *
 * 角度規則：0 度為 12 點鐘方向。
 * -90 到 +90 = 多方 = 後鏡看前方 = bull-front.png。
 * 其餘角度 = 空方 = 前鏡迎市場 = bear-rear.png。
 *
 * 重要：Z 不可改 X/Y，方向盤轉動不可移動圖位置；MOVE 放手不可自動回中央圖。
 */
(function(){
  'use strict';
  const VERSION = 'V10.15.0';
  const ASSETS = { bullFront:'./assets/bull-front.png', bearRear:'./assets/bear-rear.png', warpUniverse:'./assets/warp-universe.png' };
  const state = { x:0, joyY:0, warpY:0, z:0, side:'bull', mirror:'rear', orderActive:false, movePointerId:null };
  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);
  function clamp(n,min,max){ return Math.max(min, Math.min(max, Number(n)||0)); }
  function normalizeAngle(deg){ let a=Number(deg)||0; while(a>180)a-=360; while(a<-180)a+=360; return a; }
  function sideFromZ(deg){ const z=normalizeAngle(deg); return (z>=-90 && z<=90) ? 'bull' : 'bear'; }
  function mirrorFromSide(side){ return side === 'bull' ? 'rear' : 'front'; }
  function setImportant(el,prop,val){ if(el&&el.style) el.style.setProperty(prop,val,'important'); }
  function ensureImage(img,src){ if(img && img.getAttribute('src') !== src) img.setAttribute('src',src); }
  function getCoreImage(){ return $('fairy-img') || $('core-img') || qs('#core-anchor img') || qs('.core img') || qs('.planet-core img'); }
  function getCoreAnchor(){ return $('core-anchor') || qs('.core-anchor') || qs('.center-core') || qs('.planet-core'); }
  function getCoreWindow(){ return $('core-window') || qs('.core-window') || getCoreAnchor(); }
  function updateTextTargets(side, mirror){
    const angle=Math.round(state.z); const sideName=side==='bull'?'多':'空'; const mirrorName=mirror==='rear'?'後鏡':'前鏡';
    const label=$('wish-label');
    if(label) label.textContent = state.orderActive ? `${mirrorName}啟動｜${sideName}方世界線｜Z ${angle}°` : `${mirrorName}待命｜${sideName}方世界線｜Z ${angle}°`;
    const mini=$('mini-thumb');
    if(mini){ mini.style.backgroundImage=`url(${side==='bull'?ASSETS.bullFront:ASSETS.bearRear})`; mini.textContent=sideName; mini.setAttribute('data-kgen-mirror',mirror); mini.setAttribute('data-kgen-side',side); }
    const keSide=$('ke-side'); if(keSide) keSide.textContent=sideName;
    const kcDir=$('kc-dir'); if(kcDir) kcDir.textContent=`方向盤 → ${sideName}方｜${mirrorName}｜Z ${angle}°`;
    const angleReadout=$('ang-val'); if(angleReadout) angleReadout.textContent=`${angle}°`;
  }
  function applyVisualState(){
    const side=sideFromZ(state.z); const mirror=mirrorFromSide(side); state.side=side; state.mirror=mirror;
    const core=getCoreAnchor(); const coreWindow=getCoreWindow(); const img=getCoreImage(); const warpEngine=qs('.warp-engine'); const wheel=$('wheel'); const steer=$('steer-input-val');
    const y=state.joyY+state.warpY;
    if(core){ setImportant(core,'transform',`translate(-50%, -50%) translate(${state.x}px, ${y}px)`); core.style.setProperty('--kgen-xyz-x',`${state.x}px`); core.style.setProperty('--kgen-xyz-y',`${y}px`); core.setAttribute('data-kgen-side',side); core.setAttribute('data-kgen-mirror',mirror); core.setAttribute('data-kgen-order',state.orderActive?'on':'off'); }
    if(coreWindow){ setImportant(coreWindow,'rotate',`${state.z}deg`); coreWindow.setAttribute('data-kgen-side',side); coreWindow.setAttribute('data-kgen-mirror',mirror); }
    ensureImage(img, side==='bull'?ASSETS.bullFront:ASSETS.bearRear);
    if(img){ img.setAttribute('data-kgen-asset',side==='bull'?'bull-front.png':'bear-rear.png'); img.setAttribute('data-kgen-side',side); img.setAttribute('data-kgen-mirror',mirror); img.alt = side==='bull' ? '多方｜後鏡看前方｜12345 悟空財神殿' : '空方｜前鏡迎市場｜16888 後宇宙'; }
    if(warpEngine){ setImportant(warpEngine,'transform',`translateY(${y}px)`); warpEngine.setAttribute('data-kgen-warp-asset','warp-universe.png'); }
    const warpPreview=$('kgen-warp-universe-preview'); if(warpPreview) setImportant(warpPreview,'transform',`translate(-50%,-50%) translateY(${y}px)`);
    if(steer && String(steer.value)!==String(Math.round(state.z))) steer.value=String(Math.round(state.z));
    if(wheel) setImportant(wheel,'transform',`rotate(${state.z}deg)`);
    updateTextTargets(side,mirror);
    document.documentElement.setAttribute('data-kgen-xyz-side',side); document.documentElement.setAttribute('data-kgen-xyz-mirror',mirror);
  }
  function setZ(deg,order){ state.z=normalizeAngle(deg); if(order===true) state.orderActive=true; applyVisualState(); }
  function setXY(x,y){ state.x=clamp(x,-96,96); state.joyY=clamp(y,-96,96); applyVisualState(); }
  function setWarpByPercent(pct){ const p=clamp(pct,0,100); state.warpY=(50-p)*1.15; applyVisualState(); }
  function bindSteer(){ const steer=$('steer-input-val'); if(!steer||steer.dataset.kgenXyzBound==='1')return; steer.dataset.kgenXyzBound='1'; steer.addEventListener('input',()=>setZ(steer.value,false),{passive:true}); steer.addEventListener('change',()=>setZ(steer.value,true),{passive:true}); }
  function bindWarp(){ const warp=$('warp-input-val'); if(!warp||warp.dataset.kgenXyzBound==='1')return; warp.dataset.kgenXyzBound='1'; const update=()=>setWarpByPercent(warp.value); warp.addEventListener('input',update,{passive:true}); warp.addEventListener('change',update,{passive:true}); update(); }
  function bindMoveJoystick(){
    const wrap=$('move-joystick-wrap'); const knob=$('move-joystick-knob'); if(!wrap||!knob||wrap.dataset.kgenXyzBound==='1')return; wrap.dataset.kgenXyzBound='1';
    function fromPoint(clientX,clientY){ const r=wrap.getBoundingClientRect(); const cx=r.left+r.width/2; const cy=r.top+r.height/2; let dx=clientX-cx; let dy=clientY-cy; const max=38; const len=Math.hypot(dx,dy)||1; if(len>max){dx=dx/len*max; dy=dy/len*max;} knob.style.left=(40+dx)+'px'; knob.style.top=(40+dy)+'px'; setXY(dx*1.9,dy*1.9); }
    wrap.addEventListener('pointerdown',(e)=>{ state.movePointerId=e.pointerId; try{wrap.setPointerCapture(e.pointerId);}catch(_){} fromPoint(e.clientX,e.clientY); },{passive:false});
    wrap.addEventListener('pointermove',(e)=>{ if(state.movePointerId!==e.pointerId)return; fromPoint(e.clientX,e.clientY); },{passive:false});
    function release(e){ if(e&&state.movePointerId!==null&&e.pointerId!==state.movePointerId)return; state.movePointerId=null; knob.style.left='40px'; knob.style.top='40px'; applyVisualState(); }
    wrap.addEventListener('pointerup',release,{passive:true}); wrap.addEventListener('pointercancel',release,{passive:true});
  }
  function bindCameraButtons(){ document.addEventListener('click',(e)=>{ const b=e.target&&e.target.closest?e.target.closest('button'):null; if(!b)return; const t=(b.textContent||'').trim(); if(/後鏡/.test(t)) setZ(0,true); if(/前鏡/.test(t)) setZ(180,true); },true); }
  function patchApp(){
    if(!window.app||window.app.__kgenXyzPatchedV1015)return; window.app.__kgenXyzPatchedV1015=true;
    const oldApply=window.app.applySteer; if(typeof oldApply==='function'){ window.app.applySteer=function(v,silent){ const r=oldApply.call(this,v,silent); setZ(v,!silent); return r; }; }
    const oldWarp=window.app.updateWarp; if(typeof oldWarp==='function'){ window.app.updateWarp=function(v){ const r=oldWarp.call(this,v); setWarpByPercent(v); return r; }; }
    const oldCam=window.app.cam; if(typeof oldCam==='function'){ window.app.cam=function(mode){ state.orderActive=true; if(mode==='environment'||mode==='rear') setZ(0,true); else if(mode==='user'||mode==='front') setZ(180,true); return oldCam.call(this,mode); }; }
  }
  function injectWarpPreview(){ const rail=$('warp-rail-body'); if(!rail||$('kgen-warp-universe-preview'))return; const d=document.createElement('div'); d.id='kgen-warp-universe-preview'; d.setAttribute('aria-hidden','true'); d.style.cssText=['position:absolute','left:50%','top:50%','width:46px','height:46px','transform:translate(-50%,-50%)','border-radius:50%','background-image:url(./assets/warp-universe.png)','background-size:cover','background-position:center','opacity:.55','filter:drop-shadow(0 0 10px rgba(255,215,120,.8))','pointer-events:none','z-index:5'].join(';'); rail.appendChild(d); }
  function init(){ bindSteer(); bindWarp(); bindMoveJoystick(); bindCameraButtons(); patchApp(); injectWarpPreview(); const steer=$('steer-input-val'); state.z=normalizeAngle(steer?steer.value:state.z); applyVisualState(); console.log('[KGEN 12345 XYZ State Engine]',VERSION,'loaded'); }
  window.KGEN_12345_XYZ_ENGINE={version:VERSION,assets:ASSETS,state,setZ,setXY,setWarpByPercent,refresh:applyVisualState};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
  setTimeout(init,500); setTimeout(init,1500);
})();
