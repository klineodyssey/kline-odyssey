/*
 * KGEN 12345 Motion Control Module
 * MODULE: kgen-12345-motion-control.js
 * VERSION: V10.12.0
 * BASE: V10.2 original temple + V10.11 module line
 *
 * Purpose:
 * 1) Left MOVE joystick keeps original behavior: X moves central core left/right, Y moves central core up/down.
 * 2) Left MOVE joystick Y also moves the right-bottom WARP engine up/down.
 * 3) WARP engine input moves central core only up/down; it never changes X.
 * 4) Front / rear mirror buttons set market side consistently with middle direction bar and right DRIVE wheel:
 *    - front mirror = LONG / 多
 *    - rear mirror = SHORT / 空
 * 5) Small visual labels reflect LONG / SHORT state without breaking camera / wallet / chain functions.
 *
 * Placement:
 * /K線西遊記/temples/12345/modules/kgen-12345-motion-control.js
 * Loaded by:
 * /K線西遊記/temples/12345/index.html
 */
(function(){
  'use strict';

  const MODULE = 'KGEN_12345_MOTION_CONTROL';
  const VERSION = 'V10.12.0';
  const state = {
    moveX: 0,
    moveY: 0,
    warpY: 0,
    side: 'long',
    maxMove: 70,
    coreMultiplier: 1.8,
    warpEngineMultiplier: 0.75,
    warpCoreMultiplier: 1.15
  };

  function $(id){ return document.getElementById(id); }
  function qs(sel){ return document.querySelector(sel); }
  function qsa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function log(msg){
    try{
      if(window.console) console.log('['+MODULE+' '+VERSION+'] '+msg);
    }catch(_e){}
  }

  function ensureStyle(){
    if($('kgen-12345-motion-control-style')) return;
    const style = document.createElement('style');
    style.id = 'kgen-12345-motion-control-style';
    style.textContent = `
      :root{
        --kgen-motion-x:0px;
        --kgen-motion-y:0px;
        --kgen-warp-y:0px;
        --kgen-warp-engine-y:0px;
        --kgen-side-scale:1;
      }
      #core-anchor{
        transform: translate(
          calc(-50% + var(--v72-move-x, 0px) + var(--kgen-motion-x, 0px)),
          calc(-50% + var(--v72-move-y, 0px) + var(--kgen-warp-y, 0px))
        ) !important;
        will-change: transform;
      }
      #core-anchor.v72-character{
        transform: translate(
          calc(-50% + var(--v72-move-x, 0px) + var(--kgen-motion-x, 0px)),
          calc(-50% + var(--v72-move-y, 0px) + var(--kgen-warp-y, 0px))
        ) !important;
      }
      .warp-engine{
        transform: translateY(var(--kgen-warp-engine-y, 0px)) !important;
        transition: transform .06s linear;
        will-change: transform;
      }
      #fairy-img.kgen-motion-side{
        transform: scaleX(var(--kgen-side-scale, 1));
        transform-origin:center center;
      }
      #mini-thumb.kgen-motion-badge::after,
      #core-window.kgen-motion-badge::after{
        content: attr(data-kgen-side);
        position:absolute;
        right:18px;
        bottom:18px;
        padding:4px 9px;
        border:1px solid rgba(255,215,120,.55);
        border-radius:999px;
        background:rgba(0,0,0,.72);
        color:#ffe39a;
        font-size:12px;
        font-weight:800;
        letter-spacing:.08em;
        box-shadow:0 0 14px rgba(255,215,120,.18);
        pointer-events:none;
        z-index:9;
      }
    `;
    document.head.appendChild(style);
  }

  function applyMotion(){
    const root = document.documentElement;
    const core = $('core-anchor');
    const fairy = $('fairy-img');
    const coreWindow = $('core-window');
    const mini = $('mini-thumb');

    root.style.setProperty('--kgen-motion-x', state.moveX + 'px');
    root.style.setProperty('--kgen-motion-y', state.moveY + 'px');
    root.style.setProperty('--kgen-warp-y', state.warpY + 'px');
    root.style.setProperty('--kgen-warp-engine-y', (state.moveY * state.warpEngineMultiplier) + 'px');
    root.style.setProperty('--kgen-side-scale', state.side === 'long' ? '1' : '-1');

    if(core) core.classList.add('kgen-motion-ready');
    if(fairy) fairy.classList.add('kgen-motion-side');

    const label = state.side === 'long' ? '多' : '空';
    if(coreWindow){
      coreWindow.classList.add('kgen-motion-badge');
      coreWindow.setAttribute('data-kgen-side', label);
    }
    if(mini){
      mini.classList.add('kgen-motion-badge');
      mini.setAttribute('data-kgen-side', label);
    }

    const wishLabel = $('wish-label');
    if(wishLabel){
      wishLabel.textContent = state.side === 'long' ? '悟空心臟・多方前行' : '悟空心臟・空方鏡界';
    }
  }

  function setSide(side, source){
    state.side = side === 'short' ? 'short' : 'long';
    const steer = $('steer-input-val');
    const ang = $('ang-val');
    if(steer){
      // 多空方向與中間方向橫桿一致：多用正角度，空用負角度。
      steer.value = state.side === 'long' ? '76' : '-76';
      try{ steer.dispatchEvent(new Event('input', { bubbles:true })); }catch(_e){}
      try{ steer.dispatchEvent(new Event('change', { bubbles:true })); }catch(_e){}
    }
    if(ang) ang.textContent = state.side === 'long' ? '76°' : '-76°';

    const wheel = $('wheel');
    if(wheel){
      wheel.style.transform = 'rotate(' + (state.side === 'long' ? '76deg' : '-76deg') + ')';
      wheel.setAttribute('data-kgen-side', state.side === 'long' ? '多' : '空');
    }
    applyMotion();
    log('side='+state.side+' source='+(source||'manual'));
  }

  function bindMoveJoystick(){
    const wrap = $('move-joystick-wrap');
    const knob = $('move-joystick-knob');
    if(!wrap || !knob) return false;

    // Do not remove original handlers. Add a late capture handler and keep our own variables.
    let active = false;
    let pointerId = null;

    function setFromClient(x,y){
      const rect = wrap.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      let dx = x - cx;
      let dy = y - cy;
      const len = Math.hypot(dx,dy) || 1;
      const max = state.maxMove;
      if(len > max){
        dx = dx / len * max;
        dy = dy / len * max;
      }
      state.moveX = Math.round(dx * state.coreMultiplier);
      state.moveY = Math.round(dy * state.coreMultiplier);
      applyMotion();
    }

    function reset(){
      active = false;
      pointerId = null;
      state.moveX = 0;
      state.moveY = 0;
      applyMotion();
    }

    wrap.addEventListener('pointerdown', function(e){
      active = true;
      pointerId = e.pointerId;
      try{ wrap.setPointerCapture(pointerId); }catch(_e){}
      setFromClient(e.clientX, e.clientY);
    }, { passive:false });

    wrap.addEventListener('pointermove', function(e){
      if(!active || (pointerId !== null && e.pointerId !== pointerId)) return;
      setFromClient(e.clientX, e.clientY);
    }, { passive:false });

    wrap.addEventListener('pointerup', reset, { passive:true });
    wrap.addEventListener('pointercancel', reset, { passive:true });
    wrap.addEventListener('lostpointercapture', reset, { passive:true });
    return true;
  }

  function bindWarp(){
    const input = $('warp-input-val');
    if(!input) return false;

    function applyWarp(){
      const raw = parseFloat(input.value || '50');
      const centered = clamp(raw, 0, 100) - 50;
      // range value high means energy upward; visual movement should be up = negative Y.
      state.warpY = Math.round(-centered * state.warpCoreMultiplier);
      applyMotion();
    }
    input.addEventListener('input', applyWarp, { passive:true });
    input.addEventListener('change', applyWarp, { passive:true });
    applyWarp();
    return true;
  }

  function bindMirrorButtons(){
    const buttons = qsa('button, .term-btn');
    buttons.forEach(function(btn){
      const text = (btn.textContent || '').trim();
      const old = btn.getAttribute('onclick') || '';
      if(text.indexOf('前鏡') !== -1 || old.indexOf("cam('user')") !== -1 || old.indexOf('cam("user")') !== -1){
        btn.addEventListener('click', function(){ setSide('long', 'front-mirror'); }, true);
      }
      if(text.indexOf('後鏡') !== -1 || old.indexOf("cam('environment')") !== -1 || old.indexOf('cam("environment")') !== -1){
        btn.addEventListener('click', function(){ setSide('short', 'rear-mirror'); }, true);
      }
    });

    // Wrap app.cam so camera calls also keep direction state consistent.
    const tryWrap = function(){
      if(!window.app || typeof window.app.cam !== 'function' || window.app.cam.__kgenMotionWrapped) return false;
      const original = window.app.cam.bind(window.app);
      const wrapped = function(mode){
        setSide(mode === 'environment' ? 'short' : 'long', 'app.cam');
        return original(mode);
      };
      wrapped.__kgenMotionWrapped = true;
      window.app.cam = wrapped;
      return true;
    };
    if(!tryWrap()){
      let tries = 0;
      const t = setInterval(function(){
        tries += 1;
        if(tryWrap() || tries > 30) clearInterval(t);
      }, 300);
    }
  }

  function bindSteer(){
    const steer = $('steer-input-val');
    const ang = $('ang-val');
    if(!steer) return;
    function syncFromSteer(){
      const v = parseFloat(steer.value || '0');
      state.side = (v >= -90 && v <= 90) ? 'long' : 'short';
      if(ang) ang.textContent = Math.round(v) + '°';
      applyMotion();
    }
    steer.addEventListener('input', syncFromSteer, { passive:true });
    steer.addEventListener('change', syncFromSteer, { passive:true });
    syncFromSteer();
  }

  function init(){
    ensureStyle();
    bindMoveJoystick();
    bindWarp();
    bindSteer();
    bindMirrorButtons();
    applyMotion();
    log('initialized');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.KGEN_12345_MOTION_CONTROL = {
    version: VERSION,
    getState: function(){ return Object.assign({}, state); },
    setSide: setSide,
    applyMotion: applyMotion
  };
})();
