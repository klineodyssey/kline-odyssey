/*
 * KGEN 12345 Motion Control Module
 * MODULE: kgen-12345-motion-control.js
 * VERSION: V10.22.0
 * BASE_FROM: KGEN_12345_V10_12_MOTION_CONTROL_PATCH_FULL_bundle
 * MERGE_POLICY: keep V10.12 rotation/motion math unchanged; add texture linkage + install-safe asset policy + V10.21 0-300 warp scale + idle texture fix
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
  const VERSION = 'V10.22.0';
  const state = {
    moveX: 0,
    moveY: 0,
    warpY: 0,
    side: 'long',
    maxMove: 70,
    coreMultiplier: 1.8,
    warpEngineMultiplier: 0.75,
    warpCoreMultiplier: 1.15,
    warpUpMax: 260,
    warpDownMax: 120,
    warpCenterX: 20,
    isMoveActive: false,
    isWarpActive: false,
    isSteerActive: false,
    warpTimer: null,
    steerTimer: null,
    lastTexture: '',
    activityTimer: null,
    lastActivityAt: 0
  };

  const ASSETS = {
    bull: './assets/bull-front.png',
    bear: './assets/bear-rear.png',
    heart: './assets/heart.png',
    warp: './assets/warp-core.png'
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
        transition: transform .06s linear;
        will-change: transform;
      }
      #fairy-img.kgen-motion-side{
        /* V10.21: image src switches only; do not transform this layer. Rotation remains on original core/window layer. */
        transform-origin:center center;
      }
      #warp-rail-body{
        position:relative !important;
        overflow:visible !important;
      }
      #kgen-12345-warp-core-layer{
        display:block;
        position:absolute;
        left:50%;
        bottom:var(--kgen-warp-core-bottom, 6%);
        width:58px;
        height:58px;
        object-fit:cover;
        border-radius:50%;
        border:2px solid rgba(255,215,120,.75);
        background:rgba(0,0,0,.50);
        box-shadow:none;
        transform:translate(-50%, 50%);
        transition: bottom .06s linear;
        pointer-events:none;
        z-index:34;
      }
      #kgen-12345-warp-scale{
        position:absolute;
        left:calc(100% + 10px);
        top:0;
        bottom:0;
        width:52px;
        pointer-events:none;
        z-index:36;
        font-family:Orbitron, system-ui, sans-serif;
      }
      #kgen-12345-warp-scale .warp-tick{
        position:absolute;
        left:0;
        transform:translateY(50%);
        display:flex;
        align-items:center;
        gap:4px;
        color:#ffd778;
        font-size:10px;
        font-weight:900;
        text-shadow:0 0 8px rgba(0,0,0,.95);
        white-space:nowrap;
      }
      #kgen-12345-warp-scale .warp-tick::before{
        content:'';
        width:9px;
        height:1px;
        background:rgba(255,215,120,.8);
        box-shadow:0 0 6px rgba(255,215,120,.35);
      }
      #kgen-12345-warp-scale .warp-tick.major{
        color:#8af3ff;
        font-size:11px;
      }
      #kgen-12345-warp-scale .warp-tick.major::before{
        width:15px;
        background:rgba(138,243,255,.95);
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


  function setMainTexture(src){
    const img = $('fairy-img');
    if(!img || !src) return;
    if(state.lastTexture === src) return;
    img.setAttribute('src', src);
    state.lastTexture = src;
  }

  function getDirectionTexture(){
    return state.side === 'long' ? ASSETS.bull : ASSETS.bear;
  }


  function scheduleIdleTexture(delay){
    if(state.activityTimer) clearTimeout(state.activityTimer);
    state.activityTimer = setTimeout(function(){
      // V10.21: if no new operation happened, return to bull/bear.
      state.isMoveActive = false;
      state.isWarpActive = false;
      state.isSteerActive = false;
      updateTextureLayer();
    }, delay || 650);
  }

  function markActivity(kind){
    state.lastActivityAt = Date.now();
    if(kind === 'move') state.isMoveActive = true;
    if(kind === 'warp') state.isWarpActive = true;
    if(kind === 'steer') state.isSteerActive = true;
    updateTextureLayer();
    // Any rotation / MOVE / WARP shows heart only while operating; never stays heart forever.
    scheduleIdleTexture(700);
  }

  function clearActivity(kind){
    if(kind === 'move') state.isMoveActive = false;
    if(kind === 'warp') state.isWarpActive = false;
    if(kind === 'steer') state.isSteerActive = false;
    if(!state.isMoveActive && !state.isWarpActive && !state.isSteerActive){
      if(state.activityTimer) clearTimeout(state.activityTimer);
    }
    updateTextureLayer();
  }

  function warpXToY(warpX){
    // 0x = lower floor, 20x = neutral beauty floor, 300x = ceiling.
    const x = clamp(Number(warpX)||0, 0, 300);
    if(x <= state.warpCenterX){
      return Math.round(((state.warpCenterX - x) / state.warpCenterX) * state.warpDownMax);
    }
    return Math.round(-((x - state.warpCenterX) / (300 - state.warpCenterX)) * state.warpUpMax);
  }

  function warpXToPercent(warpX){
    // V10.21: use full visible rail as a 0~300 universe elevator.
    // 0 = floor, 300 = ceiling. Add 6% safety padding so the circle never hits the bottom buttons.
    const x = clamp(Number(warpX)||0, 0, 300);
    return 6 + (x / 300) * 88;
  }

  function setWarpVisualByX(warpX, opts){
    opts = opts || {};
    const x = clamp(Number(warpX)||0, 0, 300);
    const raw = x / 3; // page range 0..100; label shows raw*3 = 0..300x
    const input = $('warp-input-val');
    if(input && opts.updateInput !== false){
      input.value = String(raw);
    }
    const fill = $('energy-fill');
    if(fill) fill.style.height = raw + '%';
    const thumb = $('warp-thumb');
    if(thumb) thumb.style.bottom = 'calc(' + raw + '% - 17px)';
    const txt = $('warp-txt');
    if(txt) txt.textContent = 'WARP ' + Math.round(x) + 'x';
    document.documentElement.style.setProperty('--kgen-warp-core-bottom', warpXToPercent(x) + '%');
  }

  function moveDyToWarpX(dy, max){
    const n = clamp((Number(dy)||0) / (Number(max)||1), -1, 1);
    // Up/forward (negative dy) climbs toward 300x. Down/backward descends toward 0x.
    if(n < 0) return state.warpCenterX + (-n) * (300 - state.warpCenterX);
    return state.warpCenterX * (1 - n);
  }

  function updateTextureLayer(){
    // V10.18 TRUE LINK MODE:
    // Do NOT touch rotation/transform math here.
    // Only switch the image src on the existing image layer.
    if(state.isMoveActive || state.isWarpActive || state.isSteerActive){
      setMainTexture(ASSETS.heart);
    }else{
      setMainTexture(getDirectionTexture());
    }
  }

  function ensureWarpScale(){
    const host = $('warp-rail-body') || qs('.warp-engine');
    if(!host || $('kgen-12345-warp-scale')) return;
    const scale = document.createElement('div');
    scale.id = 'kgen-12345-warp-scale';
    const ticks = [0,20,50,100,150,200,250,300];
    scale.innerHTML = ticks.map(function(v){
      const cls = (v===0 || v===20 || v===300) ? 'warp-tick major' : 'warp-tick';
      return '<div class="'+cls+'" style="bottom:'+warpXToPercent(v)+'%">'+v+'x</div>';
    }).join('');
    host.appendChild(scale);
  }

  function ensureWarpCoreLayer(){
    const host = $('warp-rail-body') || qs('.warp-engine');
    if(!host || $('kgen-12345-warp-core-layer')) return;
    const img = document.createElement('img');
    img.id = 'kgen-12345-warp-core-layer';
    img.src = ASSETS.warp;
    img.alt = 'KGEN Warp Core';
    img.setAttribute('aria-hidden','true');
    host.appendChild(img);
    ensureWarpScale();
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
    root.style.setProperty('--kgen-warp-engine-y', '0px');
    root.style.setProperty('--kgen-side-scale', state.side === 'long' ? '1' : '-1');

    if(core) core.classList.add('kgen-motion-ready');
    if(fairy) fairy.classList.add('kgen-motion-side');
    ensureWarpCoreLayer();
    ensureWarpScale();
    updateTextureLayer();

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
      // Do not dispatch steer events here; mirror buttons change side but should not trigger activity-heart mode.
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
      // Y = universe elevator. Forward/backward MOVE also drives the right WARP rail display.
      // Keep V10.12 image movement: MOVE controls X/Y. Do not double-add warpY here.
      state.warpY = 0;
      setWarpVisualByX(moveDyToWarpX(dy, max), { updateInput:true });
      markActivity('move');
      applyMotion();
    }

    function reset(){
      active = false;
      state.isMoveActive = false;
      pointerId = null;
      state.moveX = 0;
      state.moveY = 0;
      state.warpY = 0;
      setWarpVisualByX(state.warpCenterX, { updateInput:true });
      applyMotion();
    }

    wrap.addEventListener('pointerdown', function(e){
      active = true;
      state.isMoveActive = true;
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

    function warpInputToX(raw){
      // Existing UI range is 0..100 and label is WARP raw*3 = 0..300x.
      return clamp(Number(raw)||0, 0, 100) * 3;
    }

    function applyWarp(active){
      const raw = parseFloat(input.value || '0');
      const warpX = warpInputToX(raw);
      state.warpY = warpXToY(warpX);
      setWarpVisualByX(warpX, { updateInput:false });
      if(active){
        markActivity('warp');
        if(state.warpTimer) clearTimeout(state.warpTimer);
        state.warpTimer = setTimeout(function(){ clearActivity('warp'); applyMotion(); }, 520);
      }
      applyMotion();
    }
    input.addEventListener('input', function(){ applyWarp(true); }, { passive:true });
    input.addEventListener('change', function(){ applyWarp(true); }, { passive:true });
    applyWarp(false);
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
    function syncFromSteer(active){
      const v = parseFloat(steer.value || '0');
      state.side = (v >= -90 && v <= 90) ? 'long' : 'short';
      if(ang) ang.textContent = Math.round(v) + '°';
      // V10.21: only user rotation activity shows heart; page initialization must remain bull/bear.
      if(active){
        markActivity('steer');
        if(state.steerTimer) clearTimeout(state.steerTimer);
        state.steerTimer = setTimeout(function(){ clearActivity('steer'); applyMotion(); }, 520);
      }
      applyMotion();
    }
    steer.addEventListener('input', function(){ syncFromSteer(true); }, { passive:true });
    steer.addEventListener('change', function(){ syncFromSteer(true); }, { passive:true });
    syncFromSteer(false);
  }

  function init(){
    ensureStyle();
    bindMoveJoystick();
    bindWarp();
    bindSteer();
    bindMirrorButtons();
    applyMotion();
    setTimeout(function(){ state.isMoveActive=false; state.isWarpActive=false; state.isSteerActive=false; updateTextureLayer(); }, 900);
    log('initialized');
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();



  /* =========================================================
     V10.22 FINAL STABILIZER
     - Static state must show bull/bear, never heart.
     - Any MOVE / WARP / STEER operation temporarily shows heart.
     - MOVE Y drives WARP 0~300 elevator and visual rail.
     - No extra glowing WARP thumb/core.
  ========================================================= */
  (function installV1022FinalStabilizer(){
    let activeUntil = 0;
    function now(){return Date.now();}
    function currentDeg(){
      const el = $('steer-input-val');
      const v = el ? parseFloat(el.value||'0') : 0;
      return Number.isFinite(v) ? v : 0;
    }
    function sideFromDeg(v){ return (v >= -90 && v <= 90) ? 'long' : 'short'; }
    function forceTexture(active){
      const img = $('fairy-img'); if(!img) return;
      const src = active ? ASSETS.heart : (sideFromDeg(currentDeg())==='long' ? ASSETS.bull : ASSETS.bear);
      if(img.getAttribute('src') !== src) img.setAttribute('src',src);
      state.lastTexture = src;
    }
    function markFinalActivity(ms){ activeUntil = now() + (ms||720); forceTexture(true); }
    ['pointerdown','touchstart','mousedown','input','change'].forEach(function(ev){
      document.addEventListener(ev,function(e){
        const t=e.target;
        if(!t) return;
        const isMove = t.closest && t.closest('#move-joystick-wrap');
        const isSteer = t.id === 'steer-input-val';
        const isWarp = t.id === 'warp-input-val' || (t.closest && t.closest('#warp-rail-body'));
        if(isMove || isSteer || isWarp) markFinalActivity(isMove?900:650);
      },true);
    });
    ['pointerup','touchend','mouseup','pointercancel','touchcancel'].forEach(function(ev){
      document.addEventListener(ev,function(){ activeUntil = now() + 260; },true);
    });
    setInterval(function(){
      const active = now() < activeUntil;
      if(!active){
        state.isMoveActive=false; state.isWarpActive=false; state.isSteerActive=false;
      }
      forceTexture(active);
      // Keep WARP rail visual clean: use image and scale, no extra glow block.
      const ef=$('energy-fill'); if(ef){ ef.style.boxShadow='none'; ef.style.filter='none'; }
      const th=$('warp-thumb'); if(th){ th.style.boxShadow='none'; th.style.filter='none'; }
      const wc=$('kgen-12345-warp-core-layer'); if(wc){ wc.style.boxShadow='none'; wc.style.filter='none'; }
    },220);
  })();

  window.KGEN_12345_MOTION_CONTROL = {
    version: VERSION,
    assets: Object.assign({}, ASSETS),
    getState: function(){ return Object.assign({}, state); },
    setSide: setSide,
    applyMotion: applyMotion
  };
})();
