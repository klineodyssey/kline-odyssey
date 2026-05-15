/* =========================================================
   KGEN 12345｜V10.25 UNIVERSE ELEVATOR SYNC
   PRODUCT_ID: KGEN-12345-HEART-UI
   VERSION: 12345-TEMPLE-V10.25.0-UNIVERSE-ELEVATOR-SYNC
   BASE_FROM: V10.24_UI_STRUCTURE_SYNC + V10.12_TRUE_ROTATION_DNA

   重要天條：
   - 不重寫原本 rotation math。
   - DRIVE / CORE 原本正常旋轉保持不動。
   - 本模組只做「宇宙電梯單一同步源」與 UI 階層修復。

   單一同步源：
   MOVE Y = Universe Elevator = WARP 0~300 = 主圖 Y = warp-core Y
========================================================= */
(function(){
  'use strict';
  const VERSION = 'V10.25.0';
  const ASSETS = {
    bull:'./assets/bull-front.png',
    bear:'./assets/bear-rear.png',
    heart:'./assets/heart.png',
    warp:'./assets/warp-core.png'
  };
  const $ = id => document.getElementById(id);
  const qs = sel => document.querySelector(sel);
  const qsa = sel => Array.prototype.slice.call(document.querySelectorAll(sel));
  const clamp = (v,min,max)=>Math.max(min, Math.min(max, Number(v)||0));
  const root = document.documentElement;
  const state = window.KGEN12345_UNIVERSE_COORDINATE_STATE = Object.assign({
    x:0,
    elevator:20,
    y:0,
    activeUntil:0,
    collapsed:false,
    lastDeg:null,
    lastCoreTransform:'',
    lastWheelTransform:''
  }, window.KGEN12345_UNIVERSE_COORDINATE_STATE||{});

  function now(){ return Date.now(); }
  function speak(msg){
    try{
      if(window.app && typeof window.app.speak==='function') return window.app.speak(msg);
      if(window.speak) return window.speak(msg);
      if('speechSynthesis' in window){
        const u=new SpeechSynthesisUtterance(msg); u.lang='zh-TW'; u.rate=1;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      }
    }catch(_e){}
  }
  function log(msg){ try{ console.log('[KGEN 12345 '+VERSION+'] '+msg); if(window.kgenLog) window.kgenLog('info',msg); }catch(_e){} }
  function currentDeg(){ const el=$('steer-input-val'); const v=el?parseFloat(el.value||'0'):0; return Number.isFinite(v)?v:0; }
  function isBull(){ const d=currentDeg(); return d>=-90 && d<=90; }
  function elevatorToPercent(v){ v=clamp(v,0,300); return 4 + (v/300)*92; }
  function elevatorToMainY(v){
    v=clamp(v,0,300);
    if(v<=20) return Math.round(((20-v)/20)*110);     // 0：下降到底部宇宙
    return Math.round(-((v-20)/(300-20))*265);        // 300：上升到天花版宇宙
  }
  function dyToElevator(dy,max){
    const n=Math.max(-1,Math.min(1,(Number(dy)||0)/(Number(max)||1)));
    return n<0 ? 20 + (-n)*(300-20) : 20*(1-n);
  }
  function setMainTexture(active){
    const img=$('fairy-img'); if(!img) return;
    const src = active ? ASSETS.heart : (isBull()?ASSETS.bull:ASSETS.bear);
    if(img.getAttribute('src')!==src) img.setAttribute('src',src);
  }
  function markActivity(ms){ state.activeUntil=now()+(ms||800); setMainTexture(true); }
  function isActive(){ return now()<state.activeUntil; }

  function ensureStyle(){
    if($('kgen-v1025-universe-elevator-style')) return;
    const st=document.createElement('style');
    st.id='kgen-v1025-universe-elevator-style';
    st.textContent = `
      :root{
        --kgen-v1025-main-x:0px;
        --kgen-v1025-main-y:0px;
        --kgen-v1025-core-rotate:var(--k12345-core-rotate, 0deg);
        --kgen-v1025-panel-w:min(438px, calc(100vw - 220px));
      }

      /* V10.25：主圖 X/Y 由宇宙座標源控制；旋轉仍使用原本 --k12345-core-rotate，不重寫 rotation math */
      #core-anchor,
      #core-anchor.v72-character{
        transform:
          translate(calc(-50% + var(--kgen-v1025-main-x, 0px)), calc(-50% + var(--kgen-v1025-main-y, 0px)))
          scale(var(--k12345-core-scale, 1))
          rotate(var(--k12345-core-rotate, 0deg)) !important;
        transform-origin:50% 50% !important;
        will-change:transform !important;
        transition:transform .065s linear !important;
      }
      #fairy-img{transform:none!important;}

      .warp-engine{overflow:visible!important; z-index:260200!important;}
      .warp-engine::before{
        content:'宇宙電梯\\A UNIVERSE ELEVATOR\\A 0–300 平行宇宙層';
        white-space:pre;
        display:block;
        margin:0 auto 8px auto;
        padding:6px 8px;
        border:1px solid rgba(138,243,255,.42);
        border-radius:12px;
        background:rgba(0,0,0,.62);
        color:#8af3ff;
        font-family:Orbitron, 'Noto Sans TC', sans-serif;
        font-size:10px;
        font-weight:900;
        line-height:1.35;
        text-shadow:0 0 10px rgba(138,243,255,.55);
      }
      #warp-rail-body{position:relative!important; overflow:visible!important;}
      #warp-thumb{opacity:.08!important; box-shadow:none!important; filter:none!important;}
      #energy-fill{box-shadow:none!important; filter:none!important; opacity:.42!important;}
      #kgen-12345-warp-core-layer,
      #kgen-v1025-warp-core-layer{
        position:absolute!important;
        left:50%!important;
        bottom:var(--kgen-v1025-elevator-percent, 10%)!important;
        width:64px!important;
        height:64px!important;
        object-fit:cover!important;
        border-radius:50%!important;
        border:2px solid rgba(255,215,120,.78)!important;
        background:rgba(0,0,0,.62)!important;
        transform:translate(-50%, 50%)!important;
        box-shadow:none!important;
        filter:none!important;
        z-index:45!important;
        pointer-events:none!important;
        transition:bottom .065s linear!important;
      }
      #kgen-v1025-elevator-scale{
        position:absolute;
        top:0; bottom:0;
        left:calc(100% + 12px);
        width:70px;
        pointer-events:none;
        z-index:48;
        font-family:Orbitron, 'Noto Sans TC', sans-serif;
      }
      #kgen-v1025-elevator-scale .tick{
        position:absolute;
        left:0;
        transform:translateY(50%);
        display:flex;
        align-items:center;
        gap:5px;
        font-size:10px;
        font-weight:900;
        color:#ffd778;
        text-shadow:0 0 8px #000;
        white-space:nowrap;
      }
      #kgen-v1025-elevator-scale .tick::before{content:'';display:block;width:10px;height:1px;background:#ffd778;}
      #kgen-v1025-elevator-scale .tick.major{color:#8af3ff;font-size:11px;}
      #kgen-v1025-elevator-scale .tick.major::before{width:18px;background:#8af3ff;}

      /* 右側神規：變成 drawer，header 縮小、內容自己捲動，不全螢幕撐開 */
      #coord-panel,.coord-panel,#right-info-panel,.right-info-panel{
        width:var(--kgen-v1025-panel-w)!important;
        max-width:var(--kgen-v1025-panel-w)!important;
        max-height:44vh!important;
        overflow-y:auto!important;
        -webkit-overflow-scrolling:touch!important;
        font-size:12px!important;
        line-height:1.42!important;
        z-index:260500!important;
        box-sizing:border-box!important;
      }
      #coord-panel h1,#coord-panel h2,#coord-panel h3,#coord-panel .title,
      .coord-panel h1,.coord-panel h2,.coord-panel h3,.coord-panel .title{
        font-size:13px!important;
        line-height:1.25!important;
        margin:0 32px 6px 0!important;
      }
      .kgen-v1025-close-btn{
        position:absolute!important;
        top:8px!important;
        right:8px!important;
        z-index:2147483500!important;
        width:28px!important;
        height:28px!important;
        border-radius:50%!important;
        border:1px solid rgba(255,215,120,.62)!important;
        background:rgba(0,0,0,.78)!important;
        color:#ffe28a!important;
        font-weight:900!important;
        cursor:pointer!important;
        pointer-events:auto!important;
      }
      #guide-modal,.guide-modal,[id*="map"],[class*="map"]{z-index:2147483300!important;}

      .kgen-v1025-amount-help{
        margin:6px 0 8px 0;
        padding:7px 9px;
        border:1px solid rgba(138,243,255,.24);
        border-radius:10px;
        background:rgba(0,0,0,.32);
        color:#dff;
        font-size:11px;
        line-height:1.45;
      }

      #kgen-v1025-total-collapse{
        position:fixed!important;
        top:10px!important;
        right:10px!important;
        z-index:2147483600!important;
        padding:8px 10px!important;
        border-radius:999px!important;
        border:1px solid rgba(255,215,120,.6)!important;
        background:rgba(0,0,0,.78)!important;
        color:#ffe28a!important;
        font-size:12px!important;
        font-weight:900!important;
        box-shadow:0 0 18px rgba(255,215,120,.18)!important;
        cursor:pointer!important;
        pointer-events:auto!important;
      }
      body.kgen-v1025-total-collapsed #kgen-heart-live-panel,
      body.kgen-v1025-total-collapsed #web3-panel,
      body.kgen-v1025-total-collapsed #coord-panel,
      body.kgen-v1025-total-collapsed .coord-panel,
      body.kgen-v1025-total-collapsed #right-info-panel,
      body.kgen-v1025-total-collapsed .right-info-panel,
      body.kgen-v1025-total-collapsed #kline-engine-panel,
      body.kgen-v1025-total-collapsed #kline-chart-panel,
      body.kgen-v1025-total-collapsed .ga-matrix,
      body.kgen-v1025-total-collapsed .bet-live-panel,
      body.kgen-v1025-total-collapsed #board-panel,
      body.kgen-v1025-total-collapsed #kgen-v917-quick-dock{
        display:none!important;
        visibility:hidden!important;
        pointer-events:none!important;
      }
      @media(max-width:720px){
        .warp-engine{right:8px!important; bottom:318px!important; transform:scale(.92); transform-origin:right bottom;}
        #kgen-v1025-elevator-scale{left:calc(100% + 8px); width:58px;}
        #coord-panel,.coord-panel,#right-info-panel,.right-info-panel{width:min(360px, calc(100vw - 170px))!important;max-width:min(360px, calc(100vw - 170px))!important;}
      }
    `;
    document.head.appendChild(st);
  }

  function setWarpVisual(elevator, updateInput){
    elevator=clamp(elevator,0,300);
    state.elevator=elevator;
    state.y=elevatorToMainY(elevator);
    const percent=elevatorToPercent(elevator);
    root.style.setProperty('--kgen-v1025-elevator-percent', percent+'%');
    root.style.setProperty('--kgen-v1025-main-y', state.y+'px');
    root.style.setProperty('--kgen-v1025-main-x', state.x+'px');

    const input=$('warp-input-val');
    // 保留舊內部 0~100 range；顯示上是 0~300。避免破壞舊模組事件。
    if(input && updateInput!==false){ input.min='0'; input.max='100'; input.value=String(elevator/3); }
    const fill=$('energy-fill'); if(fill) fill.style.height=(elevator/3)+'%';
    const thumb=$('warp-thumb'); if(thumb) thumb.style.bottom='calc('+(elevator/3)+'% - 17px)';
    const txt=$('warp-txt'); if(txt) txt.textContent='宇宙電梯 '+Math.round(elevator)+' / 300';
    const wc=$('kgen-v1025-warp-core-layer') || $('kgen-12345-warp-core-layer');
    if(wc) wc.style.bottom=percent+'%';
    setMainTexture(isActive());
  }

  function ensureElevator(){
    const host=$('warp-rail-body') || qs('.warp-engine');
    if(!host) return;
    let core=$('kgen-v1025-warp-core-layer') || $('kgen-12345-warp-core-layer');
    if(!core){
      core=document.createElement('img');
      core.id='kgen-v1025-warp-core-layer';
      core.src=ASSETS.warp;
      core.alt='宇宙電梯 Warp Core';
      host.appendChild(core);
    }else{
      core.id='kgen-v1025-warp-core-layer';
      core.src=ASSETS.warp;
    }
    let scale=$('kgen-v1025-elevator-scale');
    if(!scale){
      scale=document.createElement('div');
      scale.id='kgen-v1025-elevator-scale';
      [0,20,50,100,150,200,250,300].forEach(v=>{
        const d=document.createElement('div');
        d.className='tick '+((v===0||v===20||v===300)?'major':'');
        d.style.bottom=elevatorToPercent(v)+'%';
        d.textContent=v;
        scale.appendChild(d);
      });
      host.appendChild(scale);
    }
  }

  function bindMoveToElevator(){
    const wrap=$('move-joystick-wrap');
    if(!wrap) return;
    let active=false, pid=null;
    function apply(clientX, clientY){
      const r=wrap.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      let dx=clientX-cx, dy=clientY-cy;
      const max=Math.max(38, Math.min(r.width,r.height)*0.42);
      const len=Math.hypot(dx,dy)||1;
      if(len>max){ dx=dx/len*max; dy=dy/len*max; }
      state.x=Math.round(dx*1.75);
      const elevator=dyToElevator(dy,max);
      markActivity(980);
      setWarpVisual(elevator,true);
    }
    function stop(){
      active=false; pid=null;
      state.x=0;
      markActivity(260);
      setWarpVisual(20,true);
      setTimeout(()=>{state.activeUntil=0; setWarpVisual(20,true);},280);
    }
    wrap.addEventListener('pointerdown',e=>{active=true;pid=e.pointerId;try{wrap.setPointerCapture(pid)}catch(_e){} apply(e.clientX,e.clientY);},{passive:false,capture:true});
    wrap.addEventListener('pointermove',e=>{if(!active || (pid!==null && e.pointerId!==pid)) return; apply(e.clientX,e.clientY);},{passive:false,capture:true});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>wrap.addEventListener(ev,stop,{passive:true,capture:true}));
  }

  function bindWarpInput(){
    const input=$('warp-input-val'); if(!input) return;
    input.min='0'; input.max='100';
    function apply(active){
      const elevator=clamp((parseFloat(input.value||'0')||0)*3,0,300);
      if(active) markActivity(820);
      setWarpVisual(elevator,false);
    }
    input.addEventListener('input',()=>apply(true),{passive:true,capture:true});
    input.addEventListener('change',()=>apply(true),{passive:true,capture:true});
  }

  function bindActivity(){
    ['pointerdown','mousedown','touchstart','input','change','pointermove','touchmove'].forEach(ev=>{
      document.addEventListener(ev,e=>{
        const t=e.target; if(!t) return;
        const hit=(t.closest && (t.closest('#wheel-wrap')||t.closest('#wheel')||t.closest('.wheel-wrap')||t.closest('.steer-zone')||t.closest('#core-window')||t.closest('#move-joystick-wrap')||t.closest('#warp-rail-body')||t.closest('.warp-engine'))) || t.id==='steer-input-val' || t.id==='warp-input-val';
        if(hit) markActivity((ev==='pointermove'||ev==='touchmove')?430:880);
      },true);
    });
  }

  function ensurePanelCloseButtons(){
    const targets=[
      {el:$('kgen-heart-live-panel'), cls:'kgen-v1025-heart-close', action:()=>{ const p=$('kgen-heart-live-panel'); if(p) p.style.display='none'; speak('悟空心臟控制台已收合。'); }},
      {el:$('coord-panel')||qs('.coord-panel')||$('right-info-panel')||qs('.right-info-panel'), cls:'kgen-v1025-right-close', action:()=>{ document.body.classList.add('kgen-v920-right-info-collapsed','kgen-v919-right-info-collapsed','kgen-v918-right-info-collapsed'); speak('右側神規已收合。'); }}
    ];
    targets.forEach(t=>{
      if(!t.el || t.el.querySelector('.'+t.cls)) return;
      const b=document.createElement('button'); b.type='button'; b.className='kgen-v1025-close-btn '+t.cls; b.textContent='×'; b.title='收合';
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();t.action();});
      if(getComputedStyle(t.el).position==='static') t.el.style.position='fixed';
      t.el.appendChild(b);
    });
  }

  function ensureTotalCollapse(){
    if($('kgen-v1025-total-collapse')) return;
    const b=document.createElement('button');
    b.id='kgen-v1025-total-collapse';
    b.type='button';
    b.textContent='總收合';
    b.title='收合 / 顯示所有操作窗';
    b.addEventListener('click',()=>{
      state.collapsed=!document.body.classList.contains('kgen-v1025-total-collapsed');
      document.body.classList.toggle('kgen-v1025-total-collapsed',state.collapsed);
      b.textContent=state.collapsed?'顯示艙':'總收合';
      speak(state.collapsed?'所有操作窗已收合，進入宇宙沉浸模式。':'操作窗已恢復顯示。');
    });
    document.body.appendChild(b);
  }

  function ensureAmountHelp(){
    const input=$('bet-amt-input') || $('amount-input') || qs('input[inputmode="decimal"]');
    if(!input || $('kgen-v1025-amount-help')) return;
    const help=document.createElement('div');
    help.id='kgen-v1025-amount-help';
    help.className='kgen-v1025-amount-help';
    help.innerHTML='輸入 KGEN 數量：Approve 授權、發財金 fortuneClaim、還願 vowTo 共用。發財金建議 1～888；實際是否成功仍由 Heart 合約冷卻、血庫與名額判定。';
    input.parentNode.insertBefore(help,input);
    input.placeholder='輸入 KGEN 數量（Approve / 發財金 / 還願共用）';
    window.KGEN12345_GET_SHARED_AMOUNT = function(){
      const raw=(input.value||'').trim();
      const n=parseFloat(raw || '8');
      return Number.isFinite(n)&&n>0?n:8;
    };
  }

  function normalizeCountdownText(){
    // 不隱藏倒數，只固定顯示語意，避免同欄位閃爍看不懂。
    qsa('[id*="ny"],[class*="countdown"],[id*="count"]').forEach(el=>{
      const txt=(el.textContent||'').trim();
      if(!txt) return;
      if(/跨年|12\/31|新年|倒數/.test(txt)){
        el.style.animation='none'; el.style.transition='none'; el.style.opacity='1'; el.style.whiteSpace='nowrap';
        if(!/^跨年節點/.test(txt) && txt.length<32) el.setAttribute('title','跨年節點倒數資訊');
      }
    });
  }

  function monitor(){
    setInterval(()=>{
      // Keep rotation DNA: read angle from original slider and only mirror it into CSS var when present.
      const deg=currentDeg();
      root.style.setProperty('--k12345-core-rotate', deg+'deg');
      if(isActive()) setMainTexture(true); else setMainTexture(false);
      setWarpVisual(state.elevator,false);
      ensurePanelCloseButtons();
      normalizeCountdownText();
    },180);
  }

  function boot(){
    ensureStyle();
    ensureElevator();
    ensureTotalCollapse();
    ensureAmountHelp();
    bindMoveToElevator();
    bindWarpInput();
    bindActivity();
    setWarpVisual(20,true);
    ensurePanelCloseButtons();
    normalizeCountdownText();
    monitor();
    setTimeout(()=>{state.activeUntil=0; setMainTexture(false); setWarpVisual(20,true);},900);
    log('Universe Elevator Sync initialized.');
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.KGEN12345_V1025_UNIVERSE_ELEVATOR = {
    version:VERSION,
    state,
    setElevator:function(v){ markActivity(600); setWarpVisual(v,true); },
    collapse:function(on){ document.body.classList.toggle('kgen-v1025-total-collapsed', !!on); },
    speak
  };
})();
