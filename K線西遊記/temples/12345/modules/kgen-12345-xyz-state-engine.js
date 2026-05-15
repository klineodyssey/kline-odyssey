/*
 * KGEN 12345 XYZ State Engine
 * VERSION: V10.14.0
 * BUILD: 20260515-XYZ-JOYSTICK-ASSET-LINK
 * PATH: /K線西遊記/temples/12345/modules/kgen-12345-xyz-state-engine.js
 *
 * 固定資產路徑：
 * /K線西遊記/temples/12345/assets/bull-front.png
 * /K線西遊記/temples/12345/assets/bear-rear.png
 * /K線西遊記/temples/12345/assets/warp-universe.png
 *
 * XYZ 定義：
 * X = 左右位移
 * Y = 上下位移 / 曲速同步
 * Z = 多空方向。0 度為 12 點鐘方向；-90 到 +90 為多，其餘為空。
 */
(function(){
  'use strict';

  const VERSION = 'V10.14.0';
  const ASSETS = {
    bullFront: './assets/bull-front.png',
    bearRear: './assets/bear-rear.png',
    warpUniverse: './assets/warp-universe.png'
  };

  const state = {
    x: 0,
    joyY: 0,
    warpY: 0,
    z: 0,
    side: 'bull',
    camera: 'front',
    orderActive: false,
    movePointerId: null
  };

  const $ = (id) => document.getElementById(id);
  const qs = (sel) => document.querySelector(sel);

  function clamp(n, min, max){ return Math.max(min, Math.min(max, Number(n) || 0)); }

  function normalizeAngle(deg){
    let a = Number(deg) || 0;
    while(a > 180) a -= 360;
    while(a < -180) a += 360;
    return a;
  }

  function sideFromZ(deg){
    const z = normalizeAngle(deg);
    return (z >= -90 && z <= 90) ? 'bull' : 'bear';
  }

  function setImportant(el, prop, val){
    if(el && el.style) el.style.setProperty(prop, val, 'important');
  }

  function ensureImage(img, src){
    if(!img) return;
    const cur = img.getAttribute('src') || '';
    if(!cur.endsWith(src.replace('./','')) && cur !== src){
      img.setAttribute('src', src);
    }
  }

  function applyVisualState(){
    const side = sideFromZ(state.z);
    state.side = side;
    state.camera = side === 'bull' ? 'front' : 'rear';

    const core = $('core-anchor');
    const coreWindow = $('core-window');
    const img = $('fairy-img');
    const label = $('wish-label');
    const mini = $('mini-thumb');
    const warpEngine = qs('.warp-engine');
    const steer = $('steer-input-val');
    const angleReadout = $('ang-val');
    const wheel = $('wheel');
    const keSide = $('ke-side');
    const kcDir = $('kc-dir');

    const y = state.joyY + state.warpY;
    const coreTransform = `translate(-50%, -50%) translate(${state.x}px, ${y}px)`;
    setImportant(core, 'transform', coreTransform);
    if(core){
      core.style.setProperty('--kgen-xyz-x', `${state.x}px`);
      core.style.setProperty('--kgen-xyz-y', `${y}px`);
      core.setAttribute('data-kgen-side', side);
      core.setAttribute('data-kgen-camera', state.camera);
      core.setAttribute('data-kgen-order', state.orderActive ? 'on' : 'off');
    }

    if(coreWindow){
      setImportant(coreWindow, 'rotate', `${state.z}deg`);
      coreWindow.setAttribute('data-kgen-side', side);
      coreWindow.setAttribute('data-kgen-camera', state.camera);
    }

    ensureImage(img, side === 'bull' ? ASSETS.bullFront : ASSETS.bearRear);
    if(img){
      img.setAttribute('data-kgen-asset', side === 'bull' ? 'bull-front.png' : 'bear-rear.png');
      img.alt = side === 'bull' ? '12345 悟空財神殿多方前宇宙' : '16888 廣寒宮空方後宇宙';
    }

    if(label){
      if(side === 'bull'){
        label.textContent = state.orderActive ? '前鏡啟動｜多方物質能量 E=mc²' : '前宇宙｜多方待命';
      }else{
        label.textContent = state.orderActive ? '後鏡啟動｜空方反物質能量 E=mc²' : '後宇宙｜空方待命';
      }
    }

    if(mini){
      mini.style.backgroundImage = `url(${side === 'bull' ? ASSETS.bullFront : ASSETS.bearRear})`;
      mini.textContent = side === 'bull' ? '多' : '空';
      mini.setAttribute('data-kgen-camera', state.camera);
      mini.setAttribute('data-kgen-order', state.orderActive ? 'on' : 'off');
    }

    if(warpEngine){
      setImportant(warpEngine, 'transform', `translateY(${y}px)`);
      warpEngine.setAttribute('data-kgen-warp-asset', 'warp-universe.png');
    }

    if(steer && String(steer.value) !== String(Math.round(state.z))){
      steer.value = String(Math.round(state.z));
    }
    if(angleReadout) angleReadout.textContent = `${Math.round(state.z)}°`;
    if(wheel) setImportant(wheel, 'transform', `rotate(${state.z}deg)`);
    if(keSide) keSide.textContent = side === 'bull' ? '多' : '空';
    if(kcDir) kcDir.textContent = `方向盤 → ${side === 'bull' ? '多方K' : '空方K'}｜Z ${Math.round(state.z)}°`;

    document.documentElement.setAttribute('data-kgen-xyz-side', side);
    document.documentElement.setAttribute('data-kgen-xyz-camera', state.camera);
  }

  function setZ(deg, order){
    state.z = normalizeAngle(deg);
    if(order === true) state.orderActive = true;
    applyVisualState();
  }

  function setXY(x, y){
    state.x = clamp(x, -88, 88);
    state.joyY = clamp(y, -88, 88);
    applyVisualState();
  }

  function setWarpByPercent(pct){
    const p = clamp(pct, 0, 100);
    state.warpY = (50 - p) * 1.15;
    applyVisualState();
  }

  function bindSteer(){
    const steer = $('steer-input-val');
    if(!steer || steer.dataset.kgenXyzBound === '1') return;
    steer.dataset.kgenXyzBound = '1';
    steer.addEventListener('input', () => setZ(steer.value, false), {passive:true});
    steer.addEventListener('change', () => setZ(steer.value, true), {passive:true});
  }

  function bindWarp(){
    const warp = $('warp-input-val');
    if(!warp || warp.dataset.kgenXyzBound === '1') return;
    warp.dataset.kgenXyzBound = '1';
    const update = () => setWarpByPercent(warp.value);
    warp.addEventListener('input', update, {passive:true});
    warp.addEventListener('change', update, {passive:true});
    update();
  }

  function bindMoveJoystick(){
    const wrap = $('move-joystick-wrap');
    const knob = $('move-joystick-knob');
    if(!wrap || !knob || wrap.dataset.kgenXyzBound === '1') return;
    wrap.dataset.kgenXyzBound = '1';

    function fromPoint(clientX, clientY){
      const r = wrap.getBoundingClientRect();
      const cx = r.left + r.width/2;
      const cy = r.top + r.height/2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const max = 38;
      const len = Math.hypot(dx, dy) || 1;
      if(len > max){ dx = dx/len*max; dy = dy/len*max; }
      knob.style.left = (40 + dx) + 'px';
      knob.style.top  = (40 + dy) + 'px';
      setXY(dx * 1.9, dy * 1.9);
    }

    wrap.addEventListener('pointerdown', (e) => {
      state.movePointerId = e.pointerId;
      try{ wrap.setPointerCapture(e.pointerId); }catch(_){ }
      fromPoint(e.clientX, e.clientY);
    }, {passive:false});

    wrap.addEventListener('pointermove', (e) => {
      if(state.movePointerId !== e.pointerId) return;
      fromPoint(e.clientX, e.clientY);
    }, {passive:false});

    function reset(e){
      if(e && state.movePointerId !== null && e.pointerId !== state.movePointerId) return;
      state.movePointerId = null;
      knob.style.left = '40px';
      knob.style.top = '40px';
      setXY(0,0);
    }
    wrap.addEventListener('pointerup', reset, {passive:true});
    wrap.addEventListener('pointercancel', reset, {passive:true});
  }

  function bindCameraButtons(){
    document.addEventListener('click', (e) => {
      const b = e.target && e.target.closest ? e.target.closest('button') : null;
      if(!b) return;
      const t = (b.textContent || '').trim();
      if(/前鏡|前鏡多方|前鏡自拍/.test(t)) setZ(0, true);
      if(/後鏡|後鏡空方|後鏡巡禮/.test(t)) setZ(180, true);
    }, true);
  }

  function patchApp(){
    if(!window.app || window.app.__kgenXyzPatched) return;
    window.app.__kgenXyzPatched = true;

    const oldApply = window.app.applySteer;
    if(typeof oldApply === 'function'){
      window.app.applySteer = function(v, silent){
        const r = oldApply.call(this, v, silent);
        setZ(v, !silent);
        return r;
      };
    }

    const oldWarp = window.app.updateWarp;
    if(typeof oldWarp === 'function'){
      window.app.updateWarp = function(v){
        const r = oldWarp.call(this, v);
        setWarpByPercent(v);
        return r;
      };
    }

    const oldCam = window.app.cam;
    if(typeof oldCam === 'function'){
      window.app.cam = function(mode){
        state.orderActive = true;
        if(mode === 'user') setZ(0, true);
        if(mode === 'environment') setZ(180, true);
        return oldCam.call(this, mode);
      };
    }
  }

  function injectWarpPreview(){
    const rail = $('warp-rail-body');
    if(!rail || $('kgen-warp-universe-preview')) return;
    const d = document.createElement('div');
    d.id = 'kgen-warp-universe-preview';
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = [
      'position:absolute','left:50%','top:50%','width:46px','height:46px',
      'transform:translate(-50%,-50%)','border-radius:50%',
      'background-image:url(./assets/warp-universe.png)','background-size:cover','background-position:center',
      'opacity:.55','filter:drop-shadow(0 0 10px rgba(255,215,120,.8))','pointer-events:none','z-index:5'
    ].join(';');
    rail.appendChild(d);
  }

  function init(){
    bindSteer();
    bindWarp();
    bindMoveJoystick();
    bindCameraButtons();
    patchApp();
    injectWarpPreview();
    const steer = $('steer-input-val');
    state.z = normalizeAngle(steer ? steer.value : 0);
    applyVisualState();
    console.log('[KGEN 12345 XYZ State Engine]', VERSION, 'loaded');
  }

  window.KGEN_12345_XYZ_ENGINE = {
    version: VERSION,
    assets: ASSETS,
    state,
    setZ,
    setXY,
    setWarpByPercent,
    refresh: applyVisualState
  };

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init, {once:true});
  }else{
    init();
  }
  setTimeout(init, 500);
  setTimeout(init, 1500);
})();
