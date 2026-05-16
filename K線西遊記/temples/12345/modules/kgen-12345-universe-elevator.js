/* =========================================================
 KGEN 12345｜STANDARD MODULE｜UNIVERSE ELEVATOR + ORGAN SYNC
 PRODUCT_ID: KGEN-12345-HEART-UI
 VERSION: 12345-TEMPLE-V10.27.2-STABLE-ORGAN-RESTORE
 BUILD: 20260516-V10.27.2-STABLE-ORGAN-RESTORE
 BASE_FROM: V10.27_STABLE_ORGAN_CHECK + V10.26_PANEL_FIX + V10.25_UNIVERSE_ELEVATOR + V10.12_TRUE_ROTATION_DNA

 檔名治理：
 - 本檔固定路徑：/K線西遊記/temples/12345/modules/kgen-12345-universe-elevator.js
 - 禁止在 modules 根目錄使用 kgen-12345-v10.xx-*.js 作為正式載入檔。
 - 版本號只寫在本檔 header / kgen-12345-version.js / VERSION_GOVERNANCE。
 - 舊版本檔若需保存，放 modules/archive/，不可被 index.html 引用。

 本檔整合：
 - Universe Elevator 0~300
 - MOVE Y = 電梯 = 主圖 Y = warp-core Y
 - Panel hierarchy / right rule panel / map z-index
 - Amount input / holy cup / organ self-check
 ========================================================= */

/* ===== V10.25 core preserved ===== */
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


/* ===== V10.26 panel/control patch merged into standard module ===== */
/* =========================================================
   KGEN 12345｜V10.26 UNIVERSE ELEVATOR CONTROL + PANEL FIX
   PRODUCT_ID: KGEN-12345-HEART-UI
   VERSION: 12345-TEMPLE-V10.26.0-UNIVERSE-ELEVATOR-CONTROL-PANEL-FIX
   BASE_FROM: V10.25_UNIVERSE_ELEVATOR_SYNC + V10.24_UI_STRUCTURE_SYNC + V10.12_TRUE_ROTATION_DNA

   修正重點：
   - 宇宙電梯不再只是顯示，正式控制主圖上下移動。
   - 左下 MOVE Y 與右側宇宙電梯同步，同一座標源。
   - 右側神規按鈕穩定可開合，panel header 縮小，內容捲動。
   - 宇宙地圖 / 地圖視窗提升到最上層，不被右側神規壓住。
   - 悟空心臟控制台右上新增收合 X，與上方收合按鈕同功能。
   - 底部 8 個主按鈕不被左側長面板蓋住。
   - 倒數重複行改成「宇宙節點冷卻 / 系統訊息」。

   天條：不改 V10.12 rotation math，只接管 X/Y 與 panel 層級。
========================================================= */
(function(){
  'use strict';
  const VERSION='V10.26.0';
  const $=id=>document.getElementById(id);
  const q=(sel,root=document)=>root.querySelector(sel);
  const qa=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const state=window.KGEN12345_V1026_STATE=Object.assign({
    x:0,
    y:0,
    elevator:20,
    angle:0,
    activeUntil:0,
    totalCollapsed:false
  }, window.KGEN12345_V1026_STATE||{});
  const ASSETS={
    warp:'./assets/warp-core.png',
    heart:'./assets/heart.png',
    bull:'./assets/bull-front.png',
    bear:'./assets/bear-rear.png'
  };

  function speak(msg){
    try{
      if(window.app && typeof window.app.speak==='function') return window.app.speak(msg);
      if(window.speak) return window.speak(msg);
      if('speechSynthesis' in window){
        speechSynthesis.cancel();
        const u=new SpeechSynthesisUtterance(String(msg||'')); u.lang='zh-TW'; u.rate=1; speechSynthesis.speak(u);
      }
    }catch(_e){}
  }
  function now(){return Date.now();}
  function active(ms){state.activeUntil=now()+(ms||700);}
  function isActive(){return now()<state.activeUntil;}
  function getAngle(){
    const s=$('steer-input-val');
    const v=s?parseFloat(s.value||'0'):state.angle;
    return Number.isFinite(v)?Math.round(v):0;
  }
  function isBull(){const d=getAngle(); return d>=-90 && d<=90;}
  function elevatorToPercent(e){return 4+(clamp(e,0,300)/300)*92;}
  function elevatorToMainY(e){
    e=clamp(e,0,300);
    // 0 = 底部，不撞中下橫桿；20 = 正常市場層；300 = 天花版神級宇宙。
    if(e<=20) return Math.round(((20-e)/20)*104);
    return Math.round(-((e-20)/280)*252);
  }
  function mainYToElevator(y){
    y=clamp(y,-252,104);
    if(y>=0) return Math.round(20-(y/104)*20);
    return Math.round(20+(-y/252)*280);
  }
  function dyToElevator(dy,max){
    const n=clamp((Number(dy)||0)/(Number(max)||1),-1,1);
    // 上推 = 高層宇宙；下拉 = 地表宇宙
    return n<0 ? 20+(-n)*280 : 20*(1-n);
  }

  function ensureStyle(){
    if($('kgen-v1026-style')) return;
    const st=document.createElement('style'); st.id='kgen-v1026-style';
    st.textContent=`
      :root{
        --kgen-v1026-main-x:0px;
        --kgen-v1026-main-y:0px;
        --kgen-v1026-elevator-percent:10.13%;
      }
      /* 只接管 X/Y 位移與既有旋轉變數，不重寫角度算法 */
      #core-anchor,
      #core-anchor.v72-character{
        transform:
          translate(calc(-50% + var(--kgen-v1026-main-x, 0px)), calc(-50% + var(--kgen-v1026-main-y, 0px)))
          scale(var(--k12345-core-scale, 1))
          rotate(var(--k12345-core-rotate, 0deg)) !important;
        transform-origin:50% 50%!important;
        will-change:transform!important;
        transition:transform .07s linear!important;
      }
      #core-window{animation:none!important; transform:none!important;}
      #fairy-img{transform:none!important; transition:opacity .18s ease!important;}

      .warp-engine{overflow:visible!important; z-index:260200!important;}
      .warp-engine::before{
        content:'宇宙電梯\\A UNIVERSE ELEVATOR\\A 專利座標軸｜0–300';
        white-space:pre; display:block; margin:0 auto 7px; padding:6px 7px;
        border:1px solid rgba(138,243,255,.48); border-radius:12px;
        background:rgba(0,0,0,.66); color:#8af3ff;
        font-family:Orbitron,'Noto Sans TC',sans-serif; font-size:10px; font-weight:900; line-height:1.28;
        text-align:center; text-shadow:0 0 10px rgba(138,243,255,.62);
      }
      #warp-rail-body{position:relative!important; overflow:visible!important; touch-action:none!important; cursor:ns-resize!important;}
      #warp-thumb{opacity:.10!important; filter:none!important; box-shadow:none!important;}
      #energy-fill{filter:none!important; box-shadow:none!important; opacity:.40!important;}
      #kgen-v1026-warp-core,
      #kgen-v1025-warp-core-layer,
      #kgen-12345-warp-core-layer{
        position:absolute!important; left:50%!important; bottom:var(--kgen-v1026-elevator-percent, 10%)!important;
        width:60px!important; height:60px!important; border-radius:50%!important; object-fit:cover!important;
        transform:translate(-50%,50%)!important; z-index:80!important; pointer-events:none!important;
        border:2px solid rgba(255,215,120,.75)!important; background:rgba(0,0,0,.55)!important;
        box-shadow:none!important; filter:none!important; transition:bottom .07s linear!important;
      }
      #kgen-v1026-elevator-scale{
        position:absolute!important; top:0; bottom:0; left:calc(100% + 12px); width:76px; z-index:82;
        pointer-events:none; font-family:Orbitron,'Noto Sans TC',sans-serif;
      }
      #kgen-v1026-elevator-scale .tick{position:absolute; left:0; transform:translateY(50%); display:flex; align-items:center; gap:5px; font-size:10px; font-weight:900; color:#ffd778; white-space:nowrap; text-shadow:0 0 8px #000;}
      #kgen-v1026-elevator-scale .tick:before{content:''; width:10px; height:1px; background:#ffd778; display:block;}
      #kgen-v1026-elevator-scale .major{color:#8af3ff; font-size:11px;}
      #kgen-v1026-elevator-scale .major:before{width:18px; background:#8af3ff;}
      #kgen-v1026-elevator-label{margin-top:7px!important; font-size:12px!important; font-weight:900!important; color:#ffd778!important; text-align:center!important; text-shadow:0 0 10px #000!important;}

      #kgen-heart-live-panel{
        max-height:calc(100vh - 205px)!important;
        overflow-y:auto!important;
        -webkit-overflow-scrolling:touch!important;
        padding-bottom:18px!important;
        z-index:260400!important;
      }
      #kgen-heart-live-panel .kgen-v1026-panel-x{top:8px!important;right:8px!important;}

      #coord-panel,.coord-panel,#right-info-panel,.right-info-panel,[data-kgen-right-panel='1']{
        width:min(438px, calc(100vw - 190px))!important;
        max-width:min(438px, calc(100vw - 190px))!important;
        max-height:calc(100vh - 230px)!important;
        overflow-y:auto!important;
        -webkit-overflow-scrolling:touch!important;
        font-size:12px!important; line-height:1.36!important;
        z-index:260450!important; box-sizing:border-box!important;
      }
      #coord-panel h1,#coord-panel h2,#coord-panel h3,#coord-panel .title,
      .coord-panel h1,.coord-panel h2,.coord-panel h3,.coord-panel .title,
      #right-info-panel h1,#right-info-panel h2,#right-info-panel h3,#right-info-panel .title,
      .right-info-panel h1,.right-info-panel h2,.right-info-panel h3,.right-info-panel .title{
        font-size:13px!important; line-height:1.22!important; margin:0 34px 6px 0!important;
      }
      .kgen-v1026-panel-x{
        position:absolute!important; top:8px!important; right:8px!important; z-index:2147483500!important;
        width:30px!important; height:30px!important; border-radius:50%!important;
        border:1px solid rgba(255,215,120,.66)!important; background:rgba(0,0,0,.82)!important;
        color:#ffe28a!important; font-weight:900!important; cursor:pointer!important; pointer-events:auto!important;
      }
      #kgen-v1026-total-collapse{
        position:fixed!important; top:10px!important; right:10px!important; z-index:2147483600!important;
        padding:8px 11px!important; border-radius:999px!important; border:1px solid rgba(255,215,120,.65)!important;
        background:rgba(0,0,0,.80)!important; color:#ffe28a!important; font-size:12px!important; font-weight:900!important;
        box-shadow:0 0 18px rgba(255,215,120,.18)!important; cursor:pointer!important; pointer-events:auto!important;
      }
      body.kgen-v1026-total-collapsed #kgen-heart-live-panel,
      body.kgen-v1026-total-collapsed #coord-panel,
      body.kgen-v1026-total-collapsed .coord-panel,
      body.kgen-v1026-total-collapsed #right-info-panel,
      body.kgen-v1026-total-collapsed .right-info-panel,
      body.kgen-v1026-total-collapsed #kline-engine-panel,
      body.kgen-v1026-total-collapsed #kline-chart-panel,
      body.kgen-v1026-total-collapsed .ga-matrix,
      body.kgen-v1026-total-collapsed .bet-live-panel,
      body.kgen-v1026-total-collapsed #board-panel{display:none!important;visibility:hidden!important;pointer-events:none!important;}

      /* 地圖永遠在最上層 */
      #guide-modal,.guide-modal,#map-modal,.map-modal,[id*='map' i],[class*='map' i],[id*='宇宙地圖'],[class*='universe-map']{
        z-index:2147483300!important;
      }
      [id*='map' i].open,[class*='map' i].open,[id*='map' i][style*='display: block'],[class*='map' i][style*='display: block']{
        z-index:2147483400!important;
      }

      /* 底部八個主按鈕不可被面板蓋住 */
      .bottom-controls,#bottom-controls,#kgen-v917-quick-dock,.quick-dock,.main-action-dock{
        z-index:260900!important; position:fixed!important; left:0!important; right:0!important; bottom:0!important;
        background:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.96))!important;
        padding-bottom:max(8px, env(safe-area-inset-bottom))!important;
      }
      body{padding-bottom:138px!important;}
      #kgen-v1026-node-status{margin:6px 0 8px; padding:7px 9px; border:1px solid rgba(138,243,255,.28); border-radius:10px; background:rgba(0,0,0,.34); color:#8af3ff; font-size:11px; line-height:1.4; font-weight:800;}

      @media(max-width:720px){
        .warp-engine{right:10px!important; bottom:318px!important; transform:scale(.92); transform-origin:right bottom;}
        #kgen-v1026-elevator-scale{left:calc(100% + 8px); width:58px;}
        #kgen-heart-live-panel{max-height:calc(100vh - 205px)!important;}
        #coord-panel,.coord-panel,#right-info-panel,.right-info-panel,[data-kgen-right-panel='1']{width:min(360px, calc(100vw - 166px))!important;max-width:min(360px, calc(100vw - 166px))!important;}
      }
    `;
    document.head.appendChild(st);
  }

  function applyTexture(){
    const img=$('fairy-img'); if(!img) return;
    const src=isActive()?ASSETS.heart:(isBull()?ASSETS.bull:ASSETS.bear);
    if(!img.getAttribute('src') || !img.getAttribute('src').includes(src.replace('./assets/',''))) img.setAttribute('src',src);
  }
  function applyCoordinate(){
    state.angle=getAngle();
    const y=elevatorToMainY(state.elevator);
    state.y=y;
    const percent=elevatorToPercent(state.elevator);
    const root=document.documentElement;
    root.style.setProperty('--kgen-v1026-main-x', Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1026-main-y', Math.round(y)+'px');
    root.style.setProperty('--kgen-v1026-elevator-percent', percent+'%');
    // also feed older modules so they do not fight the new source
    root.style.setProperty('--kgen-v1025-main-x', Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1025-main-y', Math.round(y)+'px');
    root.style.setProperty('--kgen-v1025-elevator-percent', percent+'%');
    root.style.setProperty('--k12345-core-x', Math.round(state.x)+'px');
    root.style.setProperty('--k12345-core-y', Math.round(y)+'px');
    root.style.setProperty('--k12345-core-rotate', state.angle+'deg');
    const fill=$('energy-fill'); if(fill) fill.style.height=(state.elevator/3)+'%';
    const thumb=$('warp-thumb'); if(thumb) thumb.style.bottom='calc('+(state.elevator/3)+'% - 17px)';
    const txt=$('warp-txt'); if(txt) txt.textContent='宇宙電梯 '+Math.round(state.elevator)+' / 300';
    const label=$('kgen-v1026-elevator-label'); if(label) label.textContent='宇宙電梯 '+Math.round(state.elevator)+' / 300｜Y '+Math.round(y);
    const xy=$('move-joystick-label'); if(xy) xy.textContent='X '+Math.round(state.x)+' / Y '+Math.round(y);
    const ss=$('k12345-slider-status'); if(ss) ss.textContent='CORE 方向 '+state.angle+'°｜'+(isBull()?'多方':'空方')+'｜X '+Math.round(state.x)+' / Y '+Math.round(y);
    applyTexture();
  }
  function setElevator(v,activity=true){
    state.elevator=clamp(v,0,300);
    if(activity) active(760);
    if(window.KGEN12345_UNIVERSE_COORDINATE_STATE) window.KGEN12345_UNIVERSE_COORDINATE_STATE.elevator=state.elevator;
    applyCoordinate();
  }
  function setXY(x,y,activity=true){
    state.x=clamp(x,-360,360);
    const e=mainYToElevator(y);
    if(activity) active(760);
    setElevator(e,false);
  }

  function ensureElevator(){
    const rail=$('warp-rail-body') || q('.warp-engine'); if(!rail) return;
    let core=$('kgen-v1026-warp-core') || $('kgen-v1025-warp-core-layer') || $('kgen-12345-warp-core-layer');
    if(!core){ core=document.createElement('img'); rail.appendChild(core); }
    core.id='kgen-v1026-warp-core'; core.src=ASSETS.warp; core.alt='宇宙電梯核心';
    let scale=$('kgen-v1026-elevator-scale');
    if(!scale){
      scale=document.createElement('div'); scale.id='kgen-v1026-elevator-scale';
      [0,20,50,100,150,200,250,300].forEach(v=>{const d=document.createElement('div'); d.className='tick '+((v===0||v===20||v===300)?'major':''); d.style.bottom=elevatorToPercent(v)+'%'; d.textContent=String(v); scale.appendChild(d);});
      rail.appendChild(scale);
    }
    let label=$('kgen-v1026-elevator-label');
    if(!label){ label=document.createElement('div'); label.id='kgen-v1026-elevator-label'; (q('.warp-engine')||rail).appendChild(label); }
  }
  function bindElevator(){
    const rail=$('warp-rail-body') || q('.warp-engine'); if(!rail || rail.dataset.kgenV1026Bound==='1') return;
    rail.dataset.kgenV1026Bound='1';
    let pointer=null;
    function fromClientY(clientY){
      const r=rail.getBoundingClientRect();
      const y=clamp(clientY-r.top,0,r.height);
      const e=(1-y/r.height)*300;
      setElevator(e,true);
    }
    rail.addEventListener('pointerdown',e=>{e.preventDefault();pointer=e.pointerId;try{rail.setPointerCapture(pointer)}catch(_e){} fromClientY(e.clientY); speak('宇宙電梯啟動。上下拖曳，主圖同步升降。');},{capture:true});
    rail.addEventListener('pointermove',e=>{if(pointer!==e.pointerId) return; e.preventDefault(); fromClientY(e.clientY);},{capture:true});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>rail.addEventListener(ev,()=>{pointer=null;}, {capture:true}));
    const input=$('warp-input-val');
    if(input && input.dataset.kgenV1026Bound!=='1'){
      input.dataset.kgenV1026Bound='1'; input.min='0'; input.max='100';
      input.addEventListener('input',()=>setElevator((parseFloat(input.value||'0')||0)*3,true),{capture:true});
      input.addEventListener('change',()=>setElevator((parseFloat(input.value||'0')||0)*3,true),{capture:true});
    }
  }
  function bindMove(){
    const old=$('move-joystick-wrap'); if(!old || old.dataset.kgenV1026Bound==='1') return;
    const clone=old.cloneNode(true); old.parentNode.replaceChild(clone,old);
    const wrap=$('move-joystick-wrap'), knob=$('move-joystick-knob'); if(!wrap) return;
    wrap.dataset.kgenV1026Bound='1';
    let pointer=null;
    function setKnob(dx,dy){ if(knob){knob.style.left=(40+dx)+'px'; knob.style.top=(40+dy)+'px';} }
    function apply(clientX,clientY){
      const r=wrap.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      let dx=clientX-cx, dy=clientY-cy;
      const max=Math.max(38,Math.min(r.width,r.height)*0.42);
      const len=Math.hypot(dx,dy)||1;
      if(len>max){dx=dx/len*max;dy=dy/len*max;}
      setKnob(dx,dy);
      state.x=Math.round(dx*2.2);
      state.elevator=dyToElevator(dy,max);
      active(780);
      if(window.KGEN12345_UNIVERSE_COORDINATE_STATE) window.KGEN12345_UNIVERSE_COORDINATE_STATE.elevator=state.elevator;
      applyCoordinate();
    }
    function stop(){ pointer=null; setKnob(0,0); active(260); applyCoordinate(); }
    wrap.addEventListener('pointerdown',e=>{e.preventDefault();pointer=e.pointerId;try{wrap.setPointerCapture(pointer)}catch(_e){} apply(e.clientX,e.clientY); speak('MOVE 啟動。前後控制宇宙電梯，左右控制 X 座標。');},{capture:true});
    wrap.addEventListener('pointermove',e=>{if(pointer!==e.pointerId) return; e.preventDefault(); apply(e.clientX,e.clientY);},{capture:true});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>wrap.addEventListener(ev,stop,{capture:true}));
  }

  function findRightPanel(){
    const direct=$('coord-panel')||q('.coord-panel')||$('right-info-panel')||q('.right-info-panel');
    if(direct) return direct;
    return qa('div,section,aside').find(el=>/神殿規則|Heart\s*\/\s*Brain|fortuneClaim|右側神規/.test(el.textContent||'') && el.getBoundingClientRect().width>100) || null;
  }
  function showRightPanel(on){
    const p=findRightPanel(); if(!p) return;
    p.dataset.kgenRightPanel='1';
    p.style.display=on?'block':'none';
    p.style.visibility=on?'visible':'hidden';
    p.style.pointerEvents=on?'auto':'none';
    p.style.position=p.style.position||'fixed';
    if(on) speak('右側神規已展開。'); else speak('右側神規已收合。');
  }
  function bindRightRuleButtons(){
    const btns=qa('button,a,div').filter(el=>{
      const t=(el.textContent||'').trim();
      return /右側神規|神規規則|神殿規則|Heart\s*\/\s*Brain/.test(t) && el.offsetParent!==null;
    });
    btns.forEach(b=>{
      if(b.dataset.kgenV1026RightRule==='1') return;
      b.dataset.kgenV1026RightRule='1';
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation(); const p=findRightPanel(); const hidden=!p || getComputedStyle(p).display==='none' || getComputedStyle(p).visibility==='hidden'; showRightPanel(hidden);},{capture:true});
    });
  }
  function ensureCloseButtons(){
    const heart=$('kgen-heart-live-panel');
    if(heart && !heart.querySelector('.kgen-v1026-heart-x')){
      if(getComputedStyle(heart).position==='static') heart.style.position='fixed';
      const b=document.createElement('button'); b.className='kgen-v1026-panel-x kgen-v1026-heart-x'; b.type='button'; b.textContent='×'; b.title='收合悟空心臟控制台';
      b.onclick=e=>{e.preventDefault();e.stopPropagation(); heart.style.display='none'; speak('悟空心臟控制台已收合。');};
      heart.appendChild(b);
    }
    const rp=findRightPanel();
    if(rp && !rp.querySelector('.kgen-v1026-right-x')){
      rp.dataset.kgenRightPanel='1';
      if(getComputedStyle(rp).position==='static') rp.style.position='fixed';
      const b=document.createElement('button'); b.className='kgen-v1026-panel-x kgen-v1026-right-x'; b.type='button'; b.textContent='×'; b.title='收合右側神規';
      b.onclick=e=>{e.preventDefault();e.stopPropagation(); showRightPanel(false);};
      rp.appendChild(b);
    }
    if(!$('kgen-v1026-total-collapse')){
      const b=document.createElement('button'); b.id='kgen-v1026-total-collapse'; b.type='button'; b.textContent='總收合'; b.title='一鍵收合 / 顯示所有視窗';
      b.onclick=()=>{state.totalCollapsed=!document.body.classList.contains('kgen-v1026-total-collapsed'); document.body.classList.toggle('kgen-v1026-total-collapsed',state.totalCollapsed); b.textContent=state.totalCollapsed?'顯示艙':'總收合'; speak(state.totalCollapsed?'所有視窗已收合。':'操作視窗已恢復。');};
      document.body.appendChild(b);
    }
  }
  function raiseMaps(){
    qa('[id*="map" i],[class*="map" i],#guide-modal,.guide-modal').forEach(el=>{
      el.style.zIndex='2147483400';
      if(/block|flex|grid/.test(el.style.display||'')) el.style.position=el.style.position||'fixed';
    });
  }
  function fixCountdownDuplicate(){
    const panel=$('kgen-heart-live-panel'); if(!panel) return;
    const nodes=qa('div,span,p',panel).filter(el=>/距跨年|跨年|229天|230天|倒數/.test((el.textContent||'').trim()));
    if(nodes.length>1){
      const last=nodes[nodes.length-1];
      if(last && last.id!=='kgen-v1026-node-status'){
        let box=$('kgen-v1026-node-status');
        if(!box){box=document.createElement('div'); box.id='kgen-v1026-node-status'; last.parentNode.insertBefore(box,last.nextSibling);}
        box.textContent='宇宙節點冷卻：等待 5/20 悟空生日、11/11 孤勇日、12/31 跨年倒數節點。';
        if(last!==box) last.style.display='none';
      }
    }
  }
  function bottomSafe(){
    const panel=$('kgen-heart-live-panel');
    if(panel){
      panel.style.maxHeight='calc(100vh - 205px)';
      panel.style.overflowY='auto';
      panel.style.paddingBottom='18px';
    }
  }
  function boot(){
    ensureStyle(); ensureElevator(); bindElevator(); bindMove(); bindRightRuleButtons(); ensureCloseButtons(); raiseMaps(); fixCountdownDuplicate(); bottomSafe();
    setElevator(state.elevator||20,false);
    active(200); applyCoordinate();
    setTimeout(()=>{state.activeUntil=0;applyCoordinate();},650);
    console.log('[KGEN 12345 '+VERSION+'] Universe Elevator Control Panel Fix loaded.');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  setInterval(()=>{state.angle=getAngle(); applyCoordinate(); bindRightRuleButtons(); ensureCloseButtons(); raiseMaps(); fixCountdownDuplicate(); bottomSafe();},220);
  window.KGEN12345_V1026_AUTOPILOT={version:VERSION,state,setElevator,setXY,showRightPanel,speak};
})();


/* ===== V10.27 organ self-check merged into standard module ===== */
/* =========================================================
 KGEN 12345｜V10.27 STABLE ORGAN SELF CHECK
 路徑：/K線西遊記/temples/12345/modules/kgen-12345-universe-elevator.js
 BASE_FROM: V10.26_UNIVERSE_ELEVATOR_CONTROL_PANEL_FIX + V10.12 TRUE ROTATION DNA
 目的：穩定金額輸入、三聖盃、宇宙電梯、MOVE Y 同步、Panel 層級與器官自檢。
 原則：不重寫 V10.12 rotation math；只做同步與防呆。
========================================================= */
(function(){
  'use strict';
  const VERSION='V10.27-STABLE-ORGAN-CHECK';
  const root=document.documentElement;
  const $=id=>document.getElementById(id);
  const qa=(s,base=document)=>Array.prototype.slice.call(base.querySelectorAll(s));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const state={x:0,elevator:20,angle:0,activeUntil:0,lastApply:0};
  const AMOUNT_KEY='kgen12345.sharedAmount.v1027';
  const OLD_AMOUNT_KEY='kgen12345.sharedAmount';
  const ASSETS={
    bull:'./assets/bull-front.png',
    bear:'./assets/bear-rear.png',
    heart:'./assets/heart.png',
    warp:'./assets/warp-core.png'
  };
  function speak(msg){
    try{ if(!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(String(msg||'')); u.lang='zh-TW'; u.rate=1; speechSynthesis.speak(u); }catch(_e){}
  }
  function log(msg){
    ['kh-log','bp-status','last-event','kgen-log','kgen-v1027-organ-status'].forEach(id=>{const el=$(id); if(el) el.textContent=String(msg||'');});
    try{console.log('[KGEN12345 '+VERSION+']',msg);}catch(_e){}
  }
  function getAmountValue(){
    try{return localStorage.getItem(AMOUNT_KEY)||localStorage.getItem(OLD_AMOUNT_KEY)||'8';}catch(_e){return '8';}
  }
  function sanitizeAmount(raw, finalClamp){
    let s=String(raw==null?'':raw).replace(/[０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0));
    s=s.replace(/[^0-9]/g,'');
    if(s.length>1) s=s.replace(/^0+(?=\d)/,'');
    if(!s) return finalClamp?'8':'';
    let n=parseInt(s,10);
    if(finalClamp){ n=clamp(n,1,888); return String(n); }
    if(n>888) return '888';
    return String(n);
  }
  function amountFields(){
    const sel=[
      '#kgen-12345-amount-input','.kgen-amount-input','#amt-in','#bet-amt-input','#kh-amount',
      '#fortune-amount','#v860-vow-amt','#v860-lamp-days','input[data-kgen-amount]'
    ].join(',');
    const seen=new Set();
    return qa(sel).filter(el=>{
      if(!el || seen.has(el)) return false; seen.add(el);
      if(el.readOnly) return false;
      const ph=(el.getAttribute('placeholder')||'')+(el.getAttribute('aria-label')||'')+(el.id||'');
      return /金額|KGEN|發財金|還願|點燈|amount|amt|天數|lamp|vow/i.test(ph);
    });
  }
  function setAllAmount(v, except){
    const clean=sanitizeAmount(v,false);
    try{localStorage.setItem(AMOUNT_KEY, clean||'8'); localStorage.setItem(OLD_AMOUNT_KEY, clean||'8');}catch(_e){}
    amountFields().forEach((f,i)=>{
      if(i>0 && f.id==='kgen-12345-amount-input') f.id='kgen-12345-amount-input-'+(i+1);
      if(f!==except && document.activeElement!==f) f.value=clean||'8';
    });
  }
  function bindAmountInputs(){
    const saved=getAmountValue();
    amountFields().forEach((f,i)=>{
      if(i>0 && f.id==='kgen-12345-amount-input') f.id='kgen-12345-amount-input-'+(i+1);
      f.type='text';
      f.inputMode='numeric';
      f.autocomplete='off';
      f.pattern='[0-9]*';
      f.setAttribute('data-kgen-amount','1');
      f.setAttribute('aria-label','輸入 KGEN 數量，供 Approve、fortuneClaim、vowTo、lightLamp 共用');
      if(!f.value) f.value=saved||'8';
      if(f.dataset.kgenV1027Amount==='1') return;
      f.dataset.kgenV1027Amount='1';
      const stop=e=>{ e.stopPropagation(); };
      ['pointerdown','mousedown','touchstart','click'].forEach(ev=>f.addEventListener(ev,stop,{capture:true}));
      f.addEventListener('focus',()=>{
        setTimeout(()=>{ try{ f.select(); }catch(_e){} },30);
        log('請輸入 KGEN 數量。這一格供 Approve、發財金、還願、點燈共用。');
      },{capture:true});
      f.addEventListener('input',()=>{
        const cur=sanitizeAmount(f.value,false);
        if(f.value!==cur) f.value=cur;
        setAllAmount(cur,f);
      },{capture:true});
      f.addEventListener('blur',()=>{
        const cur=sanitizeAmount(f.value,true);
        f.value=cur;
        setAllAmount(cur,f);
      },{capture:true});
    });
    const first=amountFields()[0];
    if(first && !$('kgen-v1027-amount-organ-note')){
      const note=document.createElement('div');
      note.id='kgen-v1027-amount-organ-note';
      note.className='kgen-v1027-amount-organ-note';
      note.textContent='金額輸入：Approve 授權、fortuneClaim 發財金、vowTo 還願、lightLamp 點燈共用。點進輸入框會全選，直接輸入 1～888，不會自動加 8。';
      first.insertAdjacentElement('afterend',note);
    }
  }
  function getAngle(){
    const input=$('steer-input-val');
    if(input) return clamp(parseFloat(input.value||'0')||0,-180,180);
    const txt=($('ang-val')&&$('ang-val').textContent)||'0';
    const m=txt.match(/-?\d+/); return m?clamp(parseFloat(m[0]),-180,180):0;
  }
  function elevatorToPercent(v){return 4+(clamp(v,0,300)/300)*92;}
  function elevatorToMainY(v){
    v=clamp(v,0,300);
    // 0 在底部、20 接近美觀位置、300 到天花板；主圖上下使用可見且不過度的 -160~160 px。
    return Math.round(((v-150)/150)*-160);
  }
  function mainYToElevator(y){ return clamp(150-(Number(y)||0)/160*150,0,300); }
  function dyToElevator(dy,max){
    const ratio=clamp(-dy/max,-1,1); // 往上 = 正 = 電梯上升
    return clamp(150+ratio*150,0,300);
  }
  function isOperating(){ return Date.now()<state.activeUntil; }
  function activate(ms=900){ state.activeUntil=Math.max(state.activeUntil, Date.now()+ms); }
  function isBull(){ const a=state.angle; return a>=-90 && a<=90; }
  function applyTexture(){
    const img=$('fairy-img'); if(!img) return;
    const src=isOperating()?ASSETS.heart:(isBull()?ASSETS.bull:ASSETS.bear);
    if(img.getAttribute('src')!==src) img.setAttribute('src',src);
  }
  function applyCoordinate(){
    state.angle=getAngle();
    const y=elevatorToMainY(state.elevator);
    const pct=elevatorToPercent(state.elevator);
    root.style.setProperty('--kgen-v1025-main-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1025-main-y',Math.round(y)+'px');
    root.style.setProperty('--kgen-v1026-main-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1026-main-y',Math.round(y)+'px');
    root.style.setProperty('--kgen-v1027-main-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1027-main-y',Math.round(y)+'px');
    root.style.setProperty('--k12345-core-x',Math.round(state.x)+'px');
    root.style.setProperty('--k12345-core-y',Math.round(y)+'px');
    root.style.setProperty('--k12345-core-rotate',state.angle+'deg');
    root.style.setProperty('--kgen-v1025-elevator-percent',pct+'%');
    root.style.setProperty('--kgen-v1026-elevator-percent',pct+'%');
    root.style.setProperty('--kgen-v1027-elevator-percent',pct+'%');
    const fill=$('energy-fill'); if(fill) fill.style.height=(state.elevator/3)+'%';
    const thumb=$('warp-thumb'); if(thumb) thumb.style.bottom='calc('+(state.elevator/3)+'% - 17px)';
    const input=$('warp-input-val'); if(input && document.activeElement!==input){input.min='0';input.max='100';input.value=String(Math.round(state.elevator/3));}
    ['warp-txt','kgen-v1026-elevator-label','kgen-v1027-elevator-label'].forEach(id=>{const el=$(id); if(el) el.textContent='宇宙電梯 '+Math.round(state.elevator)+' / 300｜Y '+Math.round(y);});
    const xy=$('move-joystick-label'); if(xy) xy.textContent='X '+Math.round(state.x)+' / Y '+Math.round(y)+' / 電梯 '+Math.round(state.elevator);
    const status=$('k12345-slider-status'); if(status) status.textContent='CORE 方向 '+state.angle+'°｜'+(isBull()?'多方':'空方')+'｜X '+Math.round(state.x)+' / Y '+Math.round(y)+'｜電梯 '+Math.round(state.elevator);
    const organ=$('kgen-v1027-organ-status'); if(organ) organ.textContent='器官自檢 OK｜Amount '+getAmountValue()+' KGEN｜Elevator '+Math.round(state.elevator)+'｜'+(isBull()?'多方':'空方');
    applyTexture();
  }
  function setElevator(v,activity=true){
    state.elevator=clamp(v,0,300);
    if(activity) activate(900);
    if(window.KGEN12345_UNIVERSE_COORDINATE_STATE) window.KGEN12345_UNIVERSE_COORDINATE_STATE.elevator=state.elevator;
    applyCoordinate();
  }
  function setXY(x,y,activity=true){
    state.x=clamp(x,-360,360);
    state.elevator=mainYToElevator(y);
    if(activity) activate(900);
    applyCoordinate();
  }
  function ensureElevator(){
    const rail=$('warp-rail-body') || document.querySelector('.warp-engine'); if(!rail) return;
    let core=$('kgen-v1027-warp-core') || $('kgen-v1026-warp-core') || $('kgen-v1025-warp-core-layer') || $('kgen-12345-warp-core-layer');
    if(!core){ core=document.createElement('img'); rail.appendChild(core); }
    core.id='kgen-v1027-warp-core'; core.src=ASSETS.warp; core.alt='宇宙電梯核心';
    let scale=$('kgen-v1027-elevator-scale') || $('kgen-v1026-elevator-scale') || $('kgen-v1025-elevator-scale');
    if(!scale){
      scale=document.createElement('div'); rail.appendChild(scale);
      [0,20,50,100,150,200,250,300].forEach(v=>{const d=document.createElement('div'); d.className='tick '+((v===0||v===20||v===300)?'major':''); d.style.bottom=elevatorToPercent(v)+'%'; d.textContent=String(v); scale.appendChild(d);});
    }
    scale.id='kgen-v1027-elevator-scale';
    let label=$('kgen-v1027-elevator-label') || $('kgen-v1026-elevator-label');
    if(!label){ label=document.createElement('div'); (document.querySelector('.warp-engine')||rail).appendChild(label); }
    label.id='kgen-v1027-elevator-label';
  }
  function bindElevator(){
    const rail=$('warp-rail-body') || document.querySelector('.warp-engine'); if(!rail || rail.dataset.kgenV1027Elevator==='1') return;
    rail.dataset.kgenV1027Elevator='1';
    let pointer=null;
    function fromY(clientY){ const r=rail.getBoundingClientRect(); const y=clamp(clientY-r.top,0,r.height); setElevator((1-y/r.height)*300,true); }
    rail.addEventListener('pointerdown',e=>{e.preventDefault(); e.stopPropagation(); pointer=e.pointerId; try{rail.setPointerCapture(pointer)}catch(_e){} fromY(e.clientY); speak('宇宙電梯啟動，主圖同步上下移動。');},{capture:true});
    rail.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return; e.preventDefault(); e.stopPropagation(); fromY(e.clientY);},{capture:true});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>rail.addEventListener(ev,()=>{pointer=null; activate(250);},{capture:true}));
    const input=$('warp-input-val');
    if(input && input.dataset.kgenV1027Elevator!=='1'){
      input.dataset.kgenV1027Elevator='1'; input.min='0'; input.max='100';
      input.addEventListener('input',()=>setElevator((parseFloat(input.value||'0')||0)*3,true),{capture:true});
      input.addEventListener('change',()=>setElevator((parseFloat(input.value||'0')||0)*3,true),{capture:true});
    }
  }
  function bindMove(){
    const wrap=$('move-joystick-wrap'), knob=$('move-joystick-knob'); if(!wrap || wrap.dataset.kgenV1027Move==='1') return;
    wrap.dataset.kgenV1027Move='1';
    let pointer=null;
    function setKnob(dx,dy){ if(knob){knob.style.left=(40+dx)+'px'; knob.style.top=(40+dy)+'px';} }
    function apply(clientX,clientY){
      const r=wrap.getBoundingClientRect(); const cx=r.left+r.width/2, cy=r.top+r.height/2;
      let dx=clientX-cx, dy=clientY-cy;
      const max=Math.max(38,Math.min(r.width,r.height)*0.42); const len=Math.hypot(dx,dy)||1;
      if(len>max){dx=dx/len*max; dy=dy/len*max;}
      setKnob(dx,dy); state.x=Math.round(dx*2.2); state.elevator=dyToElevator(dy,max); activate(900); applyCoordinate();
    }
    function stop(){pointer=null; setKnob(0,0); activate(240); applyCoordinate();}
    wrap.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();pointer=e.pointerId;try{wrap.setPointerCapture(pointer)}catch(_e){} apply(e.clientX,e.clientY); speak('MOVE 啟動，前後同步宇宙電梯，左右同步 X 座標。');},{capture:true});
    wrap.addEventListener('pointermove',e=>{if(pointer!==e.pointerId)return; e.preventDefault();e.stopPropagation(); apply(e.clientX,e.clientY);},{capture:true});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>wrap.addEventListener(ev,stop,{capture:true}));
  }
  function rightPanel(){
    return $('coord-panel')||document.querySelector('.coord-panel')||$('right-info-panel')||document.querySelector('.right-info-panel')||qa('div,section,aside').find(el=>/神殿規則|Heart\s*\/\s*Brain|fortuneClaim|右側神規/.test(el.textContent||'') && el.getBoundingClientRect().width>120) || null;
  }
  function setRightPanel(open){
    const p=rightPanel(); if(!p) return;
    p.dataset.kgenRightPanel='1';
    p.classList.toggle('kgen-v1027-panel-open',!!open);
    p.style.display=open?'block':'none'; p.style.visibility=open?'visible':'hidden'; p.style.pointerEvents=open?'auto':'none';
    if(open) speak('右側神規已展開。'); else speak('右側神規已收合。');
  }
  function bindPanelButtons(){
    qa('button,a,div').forEach(b=>{
      const t=(b.textContent||'').trim();
      if(!/右側神規|神規規則|神殿規則|Heart\s*\/\s*Brain/.test(t) || b.dataset.kgenV1027RightRule==='1') return;
      b.dataset.kgenV1027RightRule='1';
      b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const p=rightPanel();const open=!p || getComputedStyle(p).display==='none' || getComputedStyle(p).visibility==='hidden'; setRightPanel(open);},{capture:true});
    });
    const heart=$('kgen-heart-live-panel');
    if(heart && !heart.querySelector('.kgen-v1027-heart-x')){
      const b=document.createElement('button'); b.className='kgen-v1027-panel-x kgen-v1027-heart-x'; b.type='button'; b.textContent='×'; b.title='收合悟空心臟控制台';
      b.onclick=e=>{e.preventDefault();e.stopPropagation(); heart.style.display='none'; speak('悟空心臟控制台已收合。');}; heart.appendChild(b);
    }
    const rp=rightPanel();
    if(rp && !rp.querySelector('.kgen-v1027-right-x')){
      const b=document.createElement('button'); b.className='kgen-v1027-panel-x kgen-v1027-right-x'; b.type='button'; b.textContent='×'; b.title='收合右側神規';
      b.onclick=e=>{e.preventDefault();e.stopPropagation(); setRightPanel(false);}; rp.appendChild(b);
    }
    if(!$('kgen-v1027-total-collapse')){
      const b=document.createElement('button'); b.id='kgen-v1027-total-collapse'; b.type='button'; b.textContent='總收合'; b.title='一鍵收合 / 顯示所有視窗';
      b.onclick=()=>{const on=!document.body.classList.contains('kgen-v1027-total-collapsed');document.body.classList.toggle('kgen-v1027-total-collapsed',on);b.textContent=on?'顯示艙':'總收合'; speak(on?'所有視窗已收合。':'操作視窗已恢復。');};
      document.body.appendChild(b);
    }
  }
  function fixCountdownAndBottom(){
    const panel=$('kgen-heart-live-panel');
    if(panel){ panel.style.maxHeight='calc(100vh - 210px)'; panel.style.overflowY='auto'; panel.style.paddingBottom='96px'; }
    const nodes=panel?qa('div,span,p',panel).filter(el=>/距跨年|跨年|倒數|229天|230天/.test((el.textContent||'').trim())):[];
    if(nodes.length>1){
      const last=nodes[nodes.length-1];
      last.textContent='宇宙節點冷卻：5/20 悟空生日、11/11 孤勇日、12/31 跨年倒數；此欄為活動節點提醒。';
      last.style.display='block'; last.style.visibility='visible'; last.style.opacity='1';
    }
    const dock=$('kgen-v917-quick-dock')||document.querySelector('.bottom-controls')||document.querySelector('.quick-dock');
    if(dock){ dock.style.zIndex='2147483000'; dock.style.position=dock.style.position||'fixed'; }
  }
  function raiseMaps(){
    qa('[id*="map" i],[class*="map" i],#guide-modal,.guide-modal').forEach(el=>{el.style.zIndex='2147483400'; if(/block|flex|grid/.test(getComputedStyle(el).display)) el.style.position=el.style.position||'fixed';});
  }
  function organCheck(){
    const required=[['主圖','#fairy-img'],['宇宙電梯','#warp-rail-body'],['MOVE','#move-joystick-wrap'],['DRIVE','#wheel'],['方向橫桿','#steer-input-val'],['悟空心臟','#kgen-heart-live-panel'],['三聖盃','.kgen-cup-final'],['金額輸入','input[data-kgen-amount]']];
    const missing=required.filter(([_,sel])=>!document.querySelector(sel)).map(([n])=>n);
    let box=$('kgen-v1027-organ-status');
    if(!box){ box=document.createElement('div'); box.id='kgen-v1027-organ-status'; box.className='kgen-v1027-organ-status'; const p=$('kgen-heart-live-panel')||document.body; p.appendChild(box); }
    box.textContent=missing.length?'器官自檢：缺 '+missing.join('、'):'器官自檢 OK｜所有主要控制器在線';
    return missing;
  }
  function ensureStyle(){
    if($('kgen-v1027-stable-style')) return;
    const st=document.createElement('style'); st.id='kgen-v1027-stable-style';
    st.textContent=`
      :root{--kgen-v1027-main-x:0px;--kgen-v1027-main-y:0px;--kgen-v1027-elevator-percent:10.13%;}
      #core-anchor,#core-anchor.v72-character{transform:translate(calc(-50% + var(--kgen-v1027-main-x, var(--kgen-v1026-main-x,0px))), calc(-50% + var(--kgen-v1027-main-y, var(--kgen-v1026-main-y,0px)))) scale(var(--k12345-core-scale,1)) rotate(var(--k12345-core-rotate,0deg))!important; transform-origin:50% 50%!important; will-change:transform!important; transition:transform .045s linear!important;}
      #core-window{animation:none!important;}
      #fairy-img{transform:none!important; transition:opacity .12s ease!important;}
      .kgen-v1027-amount-organ-note{margin:6px 0 8px!important;padding:8px 10px!important;border:1px solid rgba(0,242,255,.35)!important;border-radius:10px!important;background:rgba(0,242,255,.08)!important;color:#9ff!important;font-size:12px!important;line-height:1.45!important;font-weight:800!important;}
      input[data-kgen-amount]{pointer-events:auto!important;user-select:text!important;-webkit-user-select:text!important;background:#05070b!important;color:#fff!important;border:1px solid rgba(255,215,120,.35)!important;border-radius:10px!important;padding:10px 12px!important;font-size:16px!important;}
      .warp-engine{overflow:visible!important;z-index:260200!important;}
      .warp-engine:before{content:'宇宙電梯\\A UNIVERSE ELEVATOR\\A 專利座標軸｜0–300';white-space:pre;display:block;margin:0 auto 7px;padding:6px 7px;border:1px solid rgba(138,243,255,.48);border-radius:12px;background:rgba(0,0,0,.66);color:#8af3ff;font-size:10px;font-weight:900;line-height:1.28;text-align:center;text-shadow:0 0 10px rgba(138,243,255,.62);}
      #warp-rail-body{position:relative!important;overflow:visible!important;touch-action:none!important;cursor:ns-resize!important;}
      #energy-fill{filter:none!important;box-shadow:none!important;opacity:.42!important;}
      #warp-thumb{opacity:.12!important;filter:none!important;box-shadow:none!important;}
      #kgen-v1027-warp-core,#kgen-v1026-warp-core,#kgen-v1025-warp-core-layer,#kgen-12345-warp-core-layer{position:absolute!important;left:50%!important;bottom:var(--kgen-v1027-elevator-percent,var(--kgen-v1026-elevator-percent,10%))!important;width:60px!important;height:60px!important;border-radius:50%!important;object-fit:cover!important;transform:translate(-50%,50%)!important;z-index:80!important;pointer-events:none!important;border:2px solid rgba(255,215,120,.75)!important;background:rgba(0,0,0,.55)!important;box-shadow:none!important;filter:none!important;transition:bottom .045s linear!important;}
      #kgen-v1027-elevator-scale,#kgen-v1026-elevator-scale,#kgen-v1025-elevator-scale{position:absolute!important;top:0!important;bottom:0!important;left:calc(100% + 12px)!important;width:76px!important;z-index:82!important;pointer-events:none!important;}
      #kgen-v1027-elevator-scale .tick{position:absolute;left:0;transform:translateY(50%);display:flex;align-items:center;gap:5px;font-size:10px;font-weight:900;color:#ffd778;white-space:nowrap;text-shadow:0 0 8px #000;}
      #kgen-v1027-elevator-scale .tick:before{content:'';width:10px;height:1px;background:#ffd778;display:block;}
      #kgen-v1027-elevator-scale .major{color:#8af3ff;font-size:11px;}
      #kgen-v1027-elevator-label{margin-top:7px!important;font-size:12px!important;font-weight:900!important;color:#ffd778!important;text-align:center!important;text-shadow:0 0 10px #000!important;}
      #kgen-heart-live-panel{max-height:calc(100vh - 210px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;padding-bottom:96px!important;z-index:260400!important;}
      #coord-panel,.coord-panel,#right-info-panel,.right-info-panel,[data-kgen-right-panel='1']{width:min(438px,calc(100vw - 190px))!important;max-width:min(438px,calc(100vw - 190px))!important;max-height:calc(100vh - 230px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;font-size:12px!important;line-height:1.36!important;z-index:260450!important;box-sizing:border-box!important;}
      #coord-panel h1,#coord-panel h2,#coord-panel h3,#coord-panel .title,.coord-panel h1,.coord-panel h2,.coord-panel h3,.coord-panel .title{font-size:13px!important;line-height:1.2!important;margin:0 32px 8px 0!important;padding:0!important;}
      .kgen-v1027-panel-x{position:absolute!important;top:8px!important;right:8px!important;z-index:2147483600!important;width:30px!important;height:30px!important;border-radius:50%!important;border:1px solid rgba(255,215,120,.65)!important;background:rgba(0,0,0,.72)!important;color:#ffe39a!important;font-weight:900!important;font-size:18px!important;line-height:1!important;}
      #kgen-v1027-total-collapse{position:fixed!important;right:12px!important;top:12px!important;z-index:2147483600!important;border:1px solid rgba(255,215,120,.65)!important;border-radius:999px!important;background:rgba(0,0,0,.78)!important;color:#ffe39a!important;font-weight:900!important;padding:8px 12px!important;}
      body.kgen-v1027-total-collapsed #kgen-heart-live-panel,body.kgen-v1027-total-collapsed #coord-panel,body.kgen-v1027-total-collapsed .coord-panel,body.kgen-v1027-total-collapsed #right-info-panel,body.kgen-v1027-total-collapsed .right-info-panel,body.kgen-v1027-total-collapsed #kline-engine-panel,body.kgen-v1027-total-collapsed #kline-chart-panel,body.kgen-v1027-total-collapsed .ga-matrix{display:none!important;}
      [id*='map' i],[class*='map' i],#guide-modal,.guide-modal{z-index:2147483400!important;}
      #kgen-v917-quick-dock,.bottom-controls,.quick-dock{z-index:2147483000!important;}
      .kgen-v1027-organ-status{margin-top:8px!important;padding:8px 10px!important;border:1px solid rgba(138,243,255,.35)!important;border-radius:10px!important;background:rgba(0,0,0,.42)!important;color:#9ff!important;font-size:12px!important;line-height:1.4!important;font-weight:900!important;}
      @media(max-width:760px){#coord-panel,.coord-panel,#right-info-panel,.right-info-panel,[data-kgen-right-panel='1']{width:min(330px,calc(100vw - 120px))!important;max-width:min(330px,calc(100vw - 120px))!important;}#kgen-v1027-elevator-scale{left:calc(100% + 6px)!important;width:58px!important;}.kgen-v1027-amount-organ-note{font-size:11px!important;}}
    `;
    document.head.appendChild(st);
  }
  function rafLoop(){
    applyCoordinate();
    requestAnimationFrame(rafLoop);
  }
  function boot(){
    ensureStyle(); bindAmountInputs(); ensureElevator(); bindElevator(); bindMove(); bindPanelButtons(); fixCountdownAndBottom(); raiseMaps(); organCheck(); setElevator(state.elevator,false); applyCoordinate();
    setTimeout(()=>{state.activeUntil=0;applyCoordinate();},800);
    log('V10.27 穩定器官自檢完成。');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',boot);
  setInterval(()=>{bindAmountInputs();ensureElevator();bindElevator();bindMove();bindPanelButtons();fixCountdownAndBottom();raiseMaps();organCheck();},900);
  requestAnimationFrame(rafLoop);
  window.KGEN12345_V1027_STABLE={version:VERSION,state,setElevator,setXY,getAmount:()=>sanitizeAmount(getAmountValue(),true),organCheck,speak};
})();


/* =========================================================
 KGEN 12345｜V10.27.2 STABLE ORGAN RESTORE PATCH
 PRODUCT_ID: KGEN-12345-HEART-UI
 VERSION: 12345-TEMPLE-V10.27.2-STABLE-ORGAN-RESTORE
 BASE_FROM: V10.27.1_STANDARD_MODULES + V10.24_UI_STRUCTURE_SYNC + V10.12_TRUE_ROTATION_DNA

 修復重點：
 - 不刪 vowTo / lightLamp / makeWish；若被覆蓋則恢復顯示。
 - 金額欄不自動帶 8；操作者自行輸入。
 - 點入金額欄不跳開，手機可正常輸入。
 - 左下 XY MOVE 重新接管，Y 軸同步宇宙電梯與主圖上下。
 - 宇宙電梯拖動也同步主圖上下。
 ========================================================= */
(function(){
  'use strict';
  const VERSION='V10.27.2-STABLE-ORGAN-RESTORE';
  const AMOUNT_KEY='kgen12345.sharedAmount';
  const $=id=>document.getElementById(id);
  const qa=s=>Array.prototype.slice.call(document.querySelectorAll(s));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const root=document.documentElement;
  const state=window.KGEN12345_UNIVERSE_COORDINATE_STATE=Object.assign({x:0,elevator:20,angle:0,activeUntil:0},window.KGEN12345_UNIVERSE_COORDINATE_STATE||{});
  const ASSETS={bull:'./assets/bull-front.png',bear:'./assets/bear-rear.png',heart:'./assets/heart.png',warp:'./assets/warp-core.png'};

  function say(msg){try{if(window.app&&typeof app.speak==='function')return app.speak(msg); if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(msg||''));u.lang='zh-TW';speechSynthesis.speak(u);}}catch(_){}}
  function getAngle(){const input=$('steer-input-val'); if(input&&input.value!=='')return clamp(parseFloat(input.value),-180,180); const t=($('ang-val')&&$('ang-val').textContent)||'0'; const m=t.match(/-?\d+(\.\d+)?/); return m?clamp(parseFloat(m[0]),-180,180):0;}
  function isBull(){const a=getAngle(); return a>=-90&&a<=90;}
  function isActive(){return Date.now()<(state.activeUntil||0);}
  function active(ms){state.activeUntil=Date.now()+(ms||650);}
  function elevToY(v){v=clamp(v,0,300); return Math.round(((v-150)/150)*-160);}
  function yToElev(y){return clamp(150-(Number(y)||0)/160*150,0,300);}
  function pct(v){return 4+(clamp(v,0,300)/300)*92;}

  function applyTexture(){const img=$('fairy-img'); if(!img)return; const src=isActive()?ASSETS.heart:(isBull()?ASSETS.bull:ASSETS.bear); if(img.getAttribute('src')!==src)img.setAttribute('src',src);}
  function applyCoord(){
    state.angle=getAngle();
    const y=elevToY(state.elevator);
    root.style.setProperty('--kgen-v1027-main-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1027-main-y',Math.round(y)+'px');
    root.style.setProperty('--kgen-v1026-main-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1026-main-y',Math.round(y)+'px');
    root.style.setProperty('--kgen-v1025-main-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1025-main-y',Math.round(y)+'px');
    root.style.setProperty('--k12345-core-x',Math.round(state.x)+'px');
    root.style.setProperty('--k12345-core-y',Math.round(y)+'px');
    root.style.setProperty('--k12345-core-rotate',state.angle+'deg');
    root.style.setProperty('--kgen-v1027-elevator-percent',pct(state.elevator)+'%');
    const anchor=$('core-anchor');
    if(anchor){anchor.style.setProperty('transform',`translate(calc(-50% + ${Math.round(state.x)}px), calc(-50% + ${Math.round(y)}px)) scale(var(--k12345-core-scale,1)) rotate(${state.angle}deg)`,'important'); anchor.style.setProperty('transform-origin','50% 50%','important');}
    const fill=$('energy-fill'); if(fill)fill.style.height=(state.elevator/3)+'%';
    const thumb=$('warp-thumb'); if(thumb)thumb.style.bottom='calc('+(state.elevator/3)+'% - 17px)';
    const core=$('kgen-v1027-warp-core')||$('kgen-v1026-warp-core')||$('kgen-v1025-warp-core-layer')||$('kgen-12345-warp-core-layer');
    if(core){core.style.setProperty('bottom',pct(state.elevator)+'%','important'); core.style.setProperty('box-shadow','none','important'); core.style.setProperty('filter','none','important');}
    const lab=$('kgen-v1027-elevator-label')||$('kgen-v1026-elevator-label'); if(lab)lab.textContent='宇宙電梯 '+Math.round(state.elevator)+' / 300｜Y '+Math.round(y);
    const ml=$('move-joystick-label'); if(ml)ml.textContent='X '+Math.round(state.x)+' / Y '+Math.round(y)+' / 電梯 '+Math.round(state.elevator);
    const st=$('k12345-slider-status'); if(st)st.textContent='CORE 方向 '+state.angle+'°｜'+(isBull()?'多方':'空方')+'｜X '+Math.round(state.x)+' / Y '+Math.round(y)+'｜電梯 '+Math.round(state.elevator);
    applyTexture();
  }
  function setElev(v,activity){state.elevator=clamp(v,0,300); if(activity)active(850); applyCoord();}
  function setXY(x,y,activity){state.x=clamp(x,-360,360); state.elevator=yToElev(y); if(activity)active(850); applyCoord();}

  function amountFields(){
    const sel='#kgen-12345-amount-input,.kgen-amount-input,#kh-amount,#amt-in,#bet-amt-input,#fortune-amount,#v860-vow-amt,#v860-lamp-days,input[data-kgen-amount]';
    const seen=new Set();
    return qa(sel).filter(f=>f&&!seen.has(f)&&(seen.add(f)||true)&&!f.readOnly);
  }
  function clean(v){let s=String(v==null?'':v).replace(/[０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0)).replace(/[^0-9]/g,''); if(s.length>1)s=s.replace(/^0+(?=\d)/,''); if(s&&Number(s)>888)s='888'; return s;}
  function getAmount(){const f=amountFields().find(x=>String(x.value||'').trim()!==''); return clean(f?f.value:'');}
  function syncAmount(v,except){const c=clean(v); if(c){try{localStorage.setItem(AMOUNT_KEY,c)}catch(_){}}else{try{localStorage.removeItem(AMOUNT_KEY)}catch(_){}} amountFields().forEach(f=>{if(f!==except&&document.activeElement!==f)f.value=c;});}
  function bindAmount(){
    amountFields().forEach((f,i)=>{
      if(i>0&&f.id==='kgen-12345-amount-input')f.id='kgen-12345-amount-input-'+i;
      f.type='text'; f.inputMode='numeric'; f.autocomplete='off'; f.pattern='[0-9]*'; f.setAttribute('data-kgen-amount','1'); f.removeAttribute('value');
      f.placeholder=f.placeholder||'請輸入 KGEN 數量，例如 8、88、888';
      if(f.dataset.v10272Amount!=='1'){
        f.dataset.v10272Amount='1';
        ['pointerdown','mousedown','touchstart','click','dblclick'].forEach(ev=>f.addEventListener(ev,e=>{e.stopPropagation();},true));
        f.addEventListener('focus',e=>{e.stopPropagation(); setTimeout(()=>{try{f.select()}catch(_){}} ,60);},true);
        f.addEventListener('input',e=>{const c=clean(f.value); if(f.value!==c)f.value=c; syncAmount(c,f);},true);
        f.addEventListener('change',e=>{const c=clean(f.value); f.value=c; syncAmount(c,f);},true);
      }
    });
    const first=amountFields()[0];
    if(first&&!$('kgen-v10272-amount-note')){const n=document.createElement('div'); n.id='kgen-v10272-amount-note'; n.className='kgen-v1027-amount-organ-note'; n.textContent='金額由操作者自行輸入；Approve、fortuneClaim、vowTo、lightLamp 共用此數量。空白不會自動補 8。'; first.insertAdjacentElement('afterend',n);}
  }

  function restoreHeartActions(){
    const panel=$('kgen-heart-live-panel'); if(!panel)return;
    const actions=panel.querySelector('.kh-actions:last-of-type')||panel.querySelector('.kh-actions'); if(!actions)return;
    const defs=[['kh-fortune','fortuneClaim'],['kh-heartbeat','heartbeatClaim'],['kh-ignite','igniteAndClaim'],['kh-festival1','5/20 悟空生日'],['kh-festival2','11/11 孤勇日'],['kh-newyear','12/31 倒數'],['kh-vow','vowTo 還願'],['kh-lamp','lightLamp 點燈'],['kh-wishbtn','makeWish 許願上鏈']];
    defs.forEach(([id,label])=>{let b=$(id); if(!b){b=document.createElement('button'); b.type='button'; b.id=id; b.textContent=label; if(id==='kh-wishbtn')b.className='kh-gold'; actions.appendChild(b);} b.style.display=''; b.style.visibility='visible'; b.style.pointerEvents='auto';});
    const amt=$('kh-amount'); if(amt){amt.value=clean(amt.value); amt.placeholder='輸入 KGEN 數量：Approve / 發財金 / 還願 / 點燈共用';}
    if(!$('kh-wish')){const w=document.createElement('input'); w.id='kh-wish'; w.placeholder='許願文字或 0x bytes32 hash'; actions.parentNode.insertBefore(w, actions);}
    const wish=$('kh-wish'); if(wish){wish.style.display=''; wish.style.visibility='visible'; wish.style.pointerEvents='auto';}
    const sel=$('kh-vow-option'); if(sel){sel.style.display=''; sel.style.visibility='visible'; sel.style.pointerEvents='auto';}
  }

  function bindMoveStable(){
    const wrap=$('move-joystick-wrap'), knob=$('move-joystick-knob'); if(!wrap||!knob||wrap.dataset.v10272Move==='1')return; wrap.dataset.v10272Move='1';
    let pid=null;
    function setKnob(dx,dy){knob.style.left=(40+dx)+'px'; knob.style.top=(40+dy)+'px';}
    function apply(clientX,clientY){const r=wrap.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=clientX-cx,dy=clientY-cy;const max=Math.max(38,Math.min(r.width,r.height)*.42);const len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max;}setKnob(dx,dy);state.x=Math.round(dx*2.2);state.elevator=clamp(150+clamp(-dy/max,-1,1)*150,0,300);active(900);applyCoord();}
    function stop(){pid=null;setKnob(0,0);active(240);applyCoord();}
    wrap.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();pid=e.pointerId;try{wrap.setPointerCapture(pid)}catch(_){}apply(e.clientX,e.clientY);},true);
    wrap.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;e.preventDefault();e.stopPropagation();apply(e.clientX,e.clientY);},true);
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>wrap.addEventListener(ev,stop,true));
  }
  function bindElevStable(){
    const rail=$('warp-rail-body')||document.querySelector('.warp-engine'); if(!rail||rail.dataset.v10272Elev==='1')return; rail.dataset.v10272Elev='1';
    let pid=null; function from(clientY){const r=rail.getBoundingClientRect();const y=clamp(clientY-r.top,0,r.height);setElev((1-y/r.height)*300,true)}
    rail.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();pid=e.pointerId;try{rail.setPointerCapture(pid)}catch(_){}from(e.clientY);},true);
    rail.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;e.preventDefault();e.stopPropagation();from(e.clientY);},true);
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>rail.addEventListener(ev,()=>{pid=null;active(240);},true));
  }
  function protectButtons(){const p=$('kgen-heart-live-panel'); if(p){p.style.maxHeight='calc(100vh - 210px)';p.style.overflowY='auto';p.style.paddingBottom='120px';} const dock=$('kgen-v917-quick-dock')||document.querySelector('.bottom-controls')||document.querySelector('.quick-dock'); if(dock){dock.style.zIndex='2147483000';dock.style.pointerEvents='auto';}}
  function style(){if($('kgen-v10272-style'))return;const s=document.createElement('style');s.id='kgen-v10272-style';s.textContent=`input[data-kgen-amount],#kh-amount,#kgen-12345-amount-input{pointer-events:auto!important;touch-action:manipulation!important;user-select:text!important;-webkit-user-select:text!important;position:relative!important;z-index:2147482000!important;}#move-joystick-wrap{pointer-events:auto!important;touch-action:none!important;z-index:2147482100!important;}#kgen-heart-live-panel .kh-actions button{display:block!important;visibility:visible!important;pointer-events:auto!important;}#kh-wish,#kh-vow-option{display:block!important;visibility:visible!important;pointer-events:auto!important;}`;document.head.appendChild(s);}
  function boot(){style();bindAmount();restoreHeartActions();bindMoveStable();bindElevStable();protectButtons();applyCoord();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
  setInterval(boot,1000); setInterval(applyCoord,120);
  window.KGEN12345_V10272_STABLE={version:VERSION,getAmount,setElevator:setElev,setXY,restoreHeartActions};
})();


/* =========================================================
 KGEN 12345｜V10.27.3 STABLE MIRROR ORDER RESTORE PATCH
 PRODUCT_ID: KGEN-12345-HEART-UI
 VERSION: 12345-TEMPLE-V10.27.3-MIRROR-ORDER-STABLE
 BUILD: 20260516-V10.27.3-MIRROR-ORDER-STABLE
 BASE_FROM: V10.27.2_STABLE_ORGAN_RESTORE + V10.12_TRUE_ROTATION_DNA

 修復重點：
 - 金額欄不再自動帶 8；操作者自行輸入。
 - 手機點入金額欄不跳開，可正常輸入。
 - 恢復/保護 makeWish 許願、vowTo 還願、lightLamp 點燈「下單」按鈕。
 - 左下 XY MOVE 重新接管，X/Y 同步控制主圖；Y 同步宇宙電梯。
 - 宇宙電梯拖動也同步主圖上下與 warp-core。
 - 下單與多空切換啟動前鏡/後鏡狀態；多方前鏡、空方後鏡。
 - 右上訊息 20 視窗可收合；語音對應訊息紀錄，不再串到其他功能。
 - 右側神規按鈕穩定開合；面板標題縮小，地圖永遠在上層。
 - 總收合按鈕下移，不遮擋 509 席位文字。
 - 曲速刻度只保留一組 0~300。
 ========================================================= */
(function(){
  'use strict';
  const VERSION='V10.27.3-MIRROR-ORDER-STABLE';
  const $=id=>document.getElementById(id);
  const qa=s=>Array.prototype.slice.call(document.querySelectorAll(s));
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
  const root=document.documentElement;
  const state=window.KGEN12345_UNIVERSE_COORDINATE_STATE=Object.assign({x:0,elevator:20,angle:0,activeUntil:0,orderMode:null,mirrorActive:false},window.KGEN12345_UNIVERSE_COORDINATE_STATE||{});
  const ASSETS={bull:'./assets/bull-front.png',bear:'./assets/bear-rear.png',heart:'./assets/heart.png',warp:'./assets/warp-core.png'};

  function say(msg){try{if(window.app&&typeof app.speak==='function')return app.speak(msg); if(window.speak)return window.speak(msg); if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(String(msg||''));u.lang='zh-TW';u.rate=1;speechSynthesis.speak(u);}}catch(_){} }
  function log(msg){try{console.log('[KGEN 12345 '+VERSION+'] '+msg); const el=$('kh-log')||$('bp-status'); if(el) el.textContent=String(msg||'');}catch(_){} }
  function text(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function getAngle(){const input=$('steer-input-val'); if(input&&input.value!=='')return clamp(parseFloat(input.value),-180,180); const t=($('ang-val')&&$('ang-val').textContent)||'0'; const m=t.match(/-?\d+(\.\d+)?/); return m?clamp(parseFloat(m[0]),-180,180):0;}
  function setAngle(a){a=clamp(a,-180,180); state.angle=a; const input=$('steer-input-val'); if(input&&String(input.value)!==String(a)){input.value=String(a); input.dispatchEvent(new Event('input',{bubbles:true})); input.dispatchEvent(new Event('change',{bubbles:true}));} }
  function isBull(){const a=getAngle(); return a>=-90&&a<=90;}
  function isActive(){return Date.now()<(state.activeUntil||0);}
  function active(ms){state.activeUntil=Date.now()+(ms||700);}
  function pct(v){return 4+(clamp(v,0,300)/300)*92;}
  function elevToY(v){v=clamp(v,0,300); return Math.round(((v-150)/150)*-160);}
  function yToElev(y){return clamp(150-(Number(y)||0)/160*150,0,300);}

  function setMainTexture(){const img=$('fairy-img'); if(!img)return; const src=isActive()?ASSETS.heart:(isBull()?ASSETS.bull:ASSETS.bear); if(img.getAttribute('src')!==src)img.setAttribute('src',src);}
  function setMirror(mode, reason){
    state.orderMode = mode || (isBull()?'bull':'bear');
    state.mirrorActive = true;
    document.body.setAttribute('data-kgen-mirror', state.orderMode);
    const label = $('kgen-v10273-mirror-status') || createMirrorStatus();
    const bull = state.orderMode==='bull';
    if(label) label.textContent = bull ? '前鏡啟動｜多方鏡' : '後鏡啟動｜空方鏡';
    say((bull?'多方前鏡':'空方後鏡')+'已啟動。');
    log((reason||'下單鏡頭')+'：'+(bull?'多方前鏡':'空方後鏡'));
  }
  function createMirrorStatus(){
    const box=document.createElement('div'); box.id='kgen-v10273-mirror-status'; box.textContent='前後鏡待命';
    box.style.cssText='position:fixed;right:128px;bottom:96px;z-index:2147483200;border:1px solid rgba(255,215,120,.55);border-radius:999px;background:rgba(0,0,0,.72);color:#ffe08a;font-weight:900;font-size:12px;padding:6px 10px;pointer-events:none;text-shadow:0 0 8px #000;';
    document.body.appendChild(box); return box;
  }
  function applyCoord(){
    state.angle=getAngle();
    const y=elevToY(state.elevator);
    root.style.setProperty('--kgen-v1027-main-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1027-main-y',Math.round(y)+'px');
    root.style.setProperty('--kgen-v1026-main-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1026-main-y',Math.round(y)+'px');
    root.style.setProperty('--kgen-v1025-main-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-v1025-main-y',Math.round(y)+'px');
    root.style.setProperty('--k12345-core-x',Math.round(state.x)+'px');
    root.style.setProperty('--k12345-core-y',Math.round(y)+'px');
    root.style.setProperty('--k12345-core-rotate',state.angle+'deg');
    root.style.setProperty('--kgen-v1027-elevator-percent',pct(state.elevator)+'%');
    const anchor=$('core-anchor');
    if(anchor){anchor.style.setProperty('transform',`translate(calc(-50% + ${Math.round(state.x)}px), calc(-50% + ${Math.round(y)}px)) scale(var(--k12345-core-scale,1)) rotate(${state.angle}deg)`,'important'); anchor.style.setProperty('transform-origin','50% 50%','important');}
    const fill=$('energy-fill'); if(fill)fill.style.height=(state.elevator/3)+'%';
    const thumb=$('warp-thumb'); if(thumb)thumb.style.bottom='calc('+(state.elevator/3)+'% - 17px)';
    const core=$('kgen-v1027-warp-core')||$('kgen-v1026-warp-core')||$('kgen-v1025-warp-core-layer')||$('kgen-12345-warp-core-layer');
    if(core){core.style.setProperty('bottom',pct(state.elevator)+'%','important'); core.style.setProperty('box-shadow','none','important'); core.style.setProperty('filter','none','important');}
    const lab=$('kgen-v1027-elevator-label')||$('kgen-v1026-elevator-label'); if(lab)lab.textContent='宇宙電梯 '+Math.round(state.elevator)+' / 300｜Y '+Math.round(y);
    const ml=$('move-joystick-label'); if(ml)ml.textContent='X '+Math.round(state.x)+' / Y '+Math.round(y)+' / 電梯 '+Math.round(state.elevator);
    const st=$('k12345-slider-status'); if(st)st.textContent='CORE 方向 '+state.angle+'°｜'+(isBull()?'多方':'空方')+'｜X '+Math.round(state.x)+' / Y '+Math.round(y)+'｜電梯 '+Math.round(state.elevator);
    setMainTexture();
  }
  function setElev(v,activity){state.elevator=clamp(v,0,300); if(activity)active(900); applyCoord();}

  function amountFields(){
    const sel='#kgen-12345-amount-input,.kgen-amount-input,#kh-amount,#amt-in,#bet-amt-input,#fortune-amount,#v860-vow-amt,#v860-lamp-days,input[data-kgen-amount]';
    const seen=new Set();
    return qa(sel).filter(f=>f&&f.tagName==='INPUT'&&!seen.has(f)&&(seen.add(f)||true));
  }
  function clean(v){let s=String(v==null?'':v).replace(/[０-９]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-0xFEE0)).replace(/[^0-9]/g,''); if(s.length>1)s=s.replace(/^0+(?=\d)/,''); if(s&&Number(s)>888)s='888'; return s;}
  function getAmount(){const f=amountFields().find(x=>String(x.value||'').trim()!==''); return clean(f?f.value:'');}
  function syncAmount(v,except){const c=clean(v); amountFields().forEach(f=>{if(f!==except&&document.activeElement!==f)f.value=c;});}
  function bindAmount(){
    amountFields().forEach(f=>{
      f.type='text'; f.inputMode='numeric'; f.autocomplete='off'; f.pattern='[0-9]*'; f.setAttribute('data-kgen-amount','1'); f.removeAttribute('readonly'); f.removeAttribute('disabled'); f.removeAttribute('value');
      f.placeholder=f.placeholder||'請輸入 KGEN 數量，例如 8、88、888';
      if(!f.dataset.kgenUserTouched && f.value==='8') f.value='';
      if(f.dataset.v10273Amount==='1') return;
      f.dataset.v10273Amount='1';
      ['pointerdown','mousedown','touchstart','click','dblclick'].forEach(ev=>f.addEventListener(ev,e=>{e.stopPropagation();},true));
      f.addEventListener('focus',e=>{e.stopPropagation(); f.dataset.kgenUserTouched='1'; setTimeout(()=>{try{f.select()}catch(_){}} ,80);},true);
      f.addEventListener('input',e=>{f.dataset.kgenUserTouched='1';const c=clean(f.value); if(f.value!==c)f.value=c; syncAmount(c,f);},true);
      f.addEventListener('change',e=>{const c=clean(f.value); f.value=c; syncAmount(c,f);},true);
    });
    const first=amountFields()[0];
    if(first&&!$('kgen-v10273-amount-note')){const n=document.createElement('div'); n.id='kgen-v10273-amount-note'; n.className='kgen-v1027-amount-organ-note'; n.textContent='金額由操作者自行輸入；Approve、fortuneClaim、vowTo、lightLamp 共用此數量。空白不會自動補 8。'; first.insertAdjacentElement('afterend',n);}  
  }

  function restoreHeartActions(){
    const panel=$('kgen-heart-live-panel'); if(!panel)return;
    let actions=panel.querySelector('.kh-actions:last-of-type')||panel.querySelector('.kh-actions');
    if(!actions){actions=document.createElement('div'); actions.className='kh-actions'; panel.appendChild(actions);}
    const defs=[['kh-fortune','fortuneClaim 發財金'],['kh-heartbeat','heartbeatClaim 心跳'],['kh-ignite','igniteAndClaim 呼吸'],['kh-festival1','5/20 悟空生日'],['kh-festival2','11/11 孤勇日'],['kh-newyear','12/31 倒數'],['kh-vow','vowTo 還願下單'],['kh-lamp','lightLamp 點燈下單'],['kh-wishbtn','makeWish 許願下單']];
    defs.forEach(([id,label])=>{let b=$(id); if(!b){b=document.createElement('button'); b.type='button'; b.id=id; actions.appendChild(b);} if(!text(b)||/vowTo|lightLamp|makeWish/.test(label)) b.textContent=label; b.style.display=''; b.style.visibility='visible'; b.style.pointerEvents='auto';});
    if(!$('kh-wish')){const w=document.createElement('input'); w.id='kh-wish'; w.placeholder='許願文字或 0x bytes32 hash'; actions.parentNode.insertBefore(w, actions);}    
    ['kh-wish','kh-vow-option'].forEach(id=>{const el=$(id); if(el){el.style.display=''; el.style.visibility='visible'; el.style.pointerEvents='auto';}});
  }

  function bindMoveStable(){
    const wrap=$('move-joystick-wrap'), knob=$('move-joystick-knob'); if(!wrap||!knob||wrap.dataset.v10273Move==='1')return; wrap.dataset.v10273Move='1';
    let pid=null;
    function centerKnob(){knob.style.left='30px'; knob.style.top='30px'; knob.style.transform='translate(0,0)';}
    function setKnob(dx,dy){knob.style.left='30px'; knob.style.top='30px'; knob.style.transform=`translate(${dx}px,${dy}px)`;}
    function apply(clientX,clientY){const r=wrap.getBoundingClientRect();const cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=clientX-cx,dy=clientY-cy;const max=Math.max(34,Math.min(r.width,r.height)*.36);const len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max;}setKnob(dx,dy);state.x=Math.round(dx*2.8);state.elevator=clamp(150+clamp(-dy/max,-1,1)*150,0,300);active(900);applyCoord();}
    function stop(){pid=null;centerKnob();active(260);applyCoord();}
    wrap.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();pid=e.pointerId;try{wrap.setPointerCapture(pid)}catch(_){}apply(e.clientX,e.clientY);},true);
    wrap.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;e.preventDefault();e.stopPropagation();apply(e.clientX,e.clientY);},true);
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>wrap.addEventListener(ev,stop,true));
  }
  function bindElevStable(){
    const rail=$('warp-rail-body')||document.querySelector('.warp-engine'); if(!rail||rail.dataset.v10273Elev==='1')return; rail.dataset.v10273Elev='1';
    let pid=null; function from(clientY){const r=rail.getBoundingClientRect();const y=clamp(clientY-r.top,0,r.height);setElev((1-y/r.height)*300,true)}
    rail.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();pid=e.pointerId;try{rail.setPointerCapture(pid)}catch(_){}from(e.clientY);},true);
    rail.addEventListener('pointermove',e=>{if(e.pointerId!==pid)return;e.preventDefault();e.stopPropagation();from(e.clientY);},true);
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>rail.addEventListener(ev,()=>{pid=null;active(260);},true));
  }

  function findButtonsByText(re){return qa('button,a,[role="button"],.btn,.pill').filter(el=>re.test(text(el)));}
  function bindMirrorOrders(){
    findButtonsByText(/多方|多頭|射線多|前鏡/).forEach(b=>{if(b.dataset.v10273MirrorBull==='1')return;b.dataset.v10273MirrorBull='1';b.addEventListener('click',()=>{setAngle(0);active(900);setMirror('bull','多方下單');},true);});
    findButtonsByText(/空方|空頭|後續空|後鏡/).forEach(b=>{if(b.dataset.v10273MirrorBear==='1')return;b.dataset.v10273MirrorBear='1';b.addEventListener('click',()=>{setAngle(180);active(900);setMirror('bear','空方下單');},true);});
    ['kh-fortune','kh-vow','kh-lamp','kh-wishbtn','kh-heartbeat','kh-ignite'].forEach(id=>{const b=$(id); if(b&&b.dataset.v10273Order!=='1'){b.dataset.v10273Order='1'; b.addEventListener('click',()=>{setMirror(isBull()?'bull':'bear','鏈上功能下單');},true);}});
  }

  function togglePanel(panel, show){if(!panel)return; const on=show==null?(panel.style.display==='none'||getComputedStyle(panel).display==='none'):show; panel.style.display=on?'block':'none'; panel.style.visibility=on?'visible':'hidden'; panel.style.pointerEvents=on?'auto':'none';}
  function ensurePanelClose(panel, label){if(!panel||panel.querySelector('.kgen-v10273-panel-close'))return; panel.style.position=panel.style.position||'relative'; const b=document.createElement('button'); b.type='button'; b.className='kgen-v10273-panel-close'; b.textContent='收合'; b.title='收合'+(label||'視窗'); b.onclick=(e)=>{e.preventDefault();e.stopPropagation();togglePanel(panel,false);say((label||'視窗')+'已收合。');}; panel.appendChild(b);}
  function bindRightPanels(){
    const rule=$('coord-panel')||document.querySelector('.coord-panel')||$('right-info-panel')||document.querySelector('.right-info-panel');
    if(rule){ensurePanelClose(rule,'右側神規'); rule.classList.add('kgen-v10273-right-panel');}
    findButtonsByText(/右側神規|神規|規則/).forEach(b=>{if(b.dataset.v10273Rule==='1')return;b.dataset.v10273Rule='1';b.addEventListener('click',e=>{if(!rule)return;e.preventDefault();e.stopPropagation();togglePanel(rule);say('右側神規控制台已切換。');},true);});
    // 訊息 20：只說明訊息紀錄，不再串到客服或其他功能。
    const msgPanel = $('kgen-message-panel')||$('kgen-v1027-message-panel')||findPanelByHeading(/訊息|紀錄/);
    if(msgPanel){ensurePanelClose(msgPanel,'訊息紀錄'); msgPanel.classList.add('kgen-v10273-message-panel');}
    findButtonsByText(/訊息紀錄|訊息|20/).forEach(b=>{if(b.dataset.v10273Msg==='1')return;b.dataset.v10273Msg='1';b.addEventListener('click',e=>{if(!/訊息|20/.test(text(b)))return; e.preventDefault();e.stopPropagation(); if(msgPanel)togglePanel(msgPanel); say('宇宙訊息紀錄已切換。這裡顯示操作、移動、曲速與神殿事件。');},true);});
  }
  function findPanelByHeading(re){return qa('div,section,aside').find(el=>re.test(text(el).slice(0,80)) && (el.offsetWidth>120||el.offsetHeight>80));}
  function raiseMap(){qa('#coord-modal,.coord-modal,[id*="map"],[class*="map"],[id*="Map"],[class*="Map"]').forEach(el=>{el.style.zIndex='2147483400';});}
  function cleanupScale(){
    qa('#kgen-v1025-elevator-scale,#kgen-v1026-elevator-scale,#kgen-v1027-elevator-scale').forEach((el,i)=>{ if(i>0) el.remove(); });
    const rail=$('warp-rail-body'); if(rail&&!$('kgen-v10273-elevator-scale')){const scale=document.createElement('div');scale.id='kgen-v10273-elevator-scale';scale.innerHTML='<div class="tick t300">300</div><div class="tick t250">250</div><div class="tick t200">200</div><div class="tick t150">150</div><div class="tick t100">100</div><div class="tick t50">50</div><div class="tick t0">0</div>'; rail.appendChild(scale);}  
  }
  function layoutFix(){
    ['kgen-v1025-total-collapse','kgen-v1026-total-collapse','kgen-v1027-total-collapse'].forEach(id=>{const b=$(id); if(b){b.style.top='46px'; b.style.right='10px'; b.style.zIndex='2147483600';}});
    const p=$('kgen-heart-live-panel'); if(p){p.style.maxHeight='calc(100vh - 205px)';p.style.overflowY='auto';p.style.paddingBottom='150px'; ensurePanelClose(p,'悟空控制台');}
    const dock=$('kgen-v917-quick-dock')||document.querySelector('.bottom-controls')||document.querySelector('.quick-dock'); if(dock){dock.style.zIndex='2147483100';dock.style.pointerEvents='auto';dock.style.position=dock.style.position||'fixed';}
  }
  function css(){if($('kgen-v10273-style'))return; const s=document.createElement('style'); s.id='kgen-v10273-style'; s.textContent=`
    input[data-kgen-amount],#kh-amount,#amt-in,#bet-amt-input,#kgen-12345-amount-input{pointer-events:auto!important;touch-action:manipulation!important;user-select:text!important;-webkit-user-select:text!important;position:relative!important;z-index:2147482500!important;}
    #move-joystick-wrap{pointer-events:auto!important;touch-action:none!important;z-index:2147482400!important;}
    #kgen-heart-live-panel .kh-actions button,#kh-wish,#kh-vow-option{display:block!important;visibility:visible!important;pointer-events:auto!important;}
    .kgen-v10273-panel-close{position:absolute!important;top:8px!important;right:8px!important;z-index:2147483500!important;border:1px solid rgba(255,215,120,.62)!important;border-radius:999px!important;background:rgba(0,0,0,.78)!important;color:#ffe39a!important;font-weight:900!important;font-size:11px!important;padding:5px 9px!important;pointer-events:auto!important;}
    .kgen-v10273-right-panel{max-height:44vh!important;overflow-y:auto!important;font-size:12px!important;line-height:1.38!important;}
    .kgen-v10273-right-panel h1,.kgen-v10273-right-panel h2,.kgen-v10273-right-panel h3,.kgen-v10273-right-panel .title{font-size:13px!important;line-height:1.25!important;margin-right:46px!important;}
    .kgen-v10273-message-panel{max-height:42vh!important;overflow-y:auto!important;}
    #kgen-v10273-elevator-scale{position:absolute;top:0;bottom:0;left:calc(100% + 10px);width:46px;pointer-events:none;z-index:80;font-family:Orbitron,'Noto Sans TC',sans-serif;}
    #kgen-v10273-elevator-scale .tick{position:absolute;left:0;transform:translateY(50%);font-size:10px;font-weight:900;color:#ffd978;text-shadow:0 0 8px #000;}
    #kgen-v10273-elevator-scale .tick:before{content:'';display:inline-block;width:10px;height:1px;background:#ffd978;margin-right:4px;vertical-align:middle;}
    #kgen-v10273-elevator-scale .t300{bottom:96%;} #kgen-v10273-elevator-scale .t250{bottom:80%;} #kgen-v10273-elevator-scale .t200{bottom:64%;} #kgen-v10273-elevator-scale .t150{bottom:50%;} #kgen-v10273-elevator-scale .t100{bottom:34%;} #kgen-v10273-elevator-scale .t50{bottom:18%;} #kgen-v10273-elevator-scale .t0{bottom:4%;}
    #kgen-v1025-elevator-scale,#kgen-v1026-elevator-scale,#kgen-v1027-elevator-scale{display:none!important;}
    body[data-kgen-mirror="bull"] #kgen-v10273-mirror-status{border-color:rgba(69,255,184,.75)!important;color:#9dffd8!important;}
    body[data-kgen-mirror="bear"] #kgen-v10273-mirror-status{border-color:rgba(255,120,120,.75)!important;color:#ffb2b2!important;}
  `; document.head.appendChild(s); }
  function boot(){css();bindAmount();restoreHeartActions();bindMoveStable();bindElevStable();bindMirrorOrders();bindRightPanels();cleanupScale();layoutFix();raiseMap();applyCoord();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
  window.addEventListener('load',boot);
  setInterval(boot,1200); setInterval(applyCoord,140);
  window.KGEN12345_V10273_STABLE={version:VERSION,state,getAmount,setElevator:setElev,setMirror,applyCoord};
})();


/* =========================================================
KGEN 12345｜V10.30 MASTER STABLE FINAL STABILIZER
VERSION: 12345-TEMPLE-V10.30-MASTER-STABLE
BASE_FROM: V10.27.3 + V10.12 TRUE ROTATION DNA
========================================================= */
(function(){
  'use strict';
  const VERSION='12345-TEMPLE-V10.30-MASTER-STABLE';
  const BUILD='20260516-V10.30-MASTER-STABLE';
  const $=(id)=>document.getElementById(id);
  const qa=(s,root=document)=>Array.from(root.querySelectorAll(s));
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
  const root=document.documentElement;
  const state={x:0,elevator:20,lastAmount:'',orderActive:false};
  function speak(msg){try{ if(!msg||!speechSynthesis) return; speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(String(msg)); u.lang='zh-TW'; u.rate=1.03; speechSynthesis.speak(u);}catch(e){}}
  function status(msg){['kh-log','bp-status','w3-prog','kgen-v1030-status'].forEach(id=>{const e=$(id); if(e) e.textContent=String(msg||'');}); console.log('[KGEN12345 V10.30]',msg);}
  function syncVersion(){window.KGEN12345_BUILD=Object.assign({},window.KGEN12345_BUILD||{},{VERSION,BUILD,CHANGESET:'MASTER STABLE FINAL'}); const v=$('ver-st'); if(v) v.textContent='VERSION '+VERSION; qa('.sys-st').forEach(el=>{if((el.textContent||'').includes('VERSION')) el.textContent='VERSION '+VERSION;}); document.title='KGEN 12345 五指山悟空財神殿 V10.30 MASTER STABLE'; root.setAttribute('data-kgen12345-version',VERSION);}
  function amountInputs(){return Array.from(new Set(qa('input').filter(i=>{const id=(i.id||'').toLowerCase(), ph=(i.placeholder||'').toLowerCase(), nm=(i.name||'').toLowerCase(), type=(i.type||'').toLowerCase(); if(['range','checkbox','radio','button','submit'].includes(type)) return false; return /(^|-)amt|amount|kh-amount|amt-in|kgen/.test(id)||/kgen|amount|金額|數量/.test(ph)||/amount|amt/.test(nm);})));}
  function sanitize(v){v=String(v||'').replace(/[，,]/g,'.').replace(/[^0-9.]/g,''); const p=v.split('.'); if(p.length>2) v=p.shift()+'.'+p.join(''); if(v.startsWith('.')) v='0'+v; return v;}
  function setupAmountInputs(){amountInputs().forEach(i=>{i.type='text'; i.inputMode='decimal'; i.autocomplete='off'; i.setAttribute('data-kgen-user-owned','true'); i.placeholder='請自行輸入 KGEN 數量（不自動填 8）'; if(!i.dataset.kgenTouched && String(i.value||'').trim()==='8') i.value=''; ['pointerdown','mousedown','touchstart','click','focus','keydown','keyup'].forEach(ev=>i.addEventListener(ev,e=>{e.stopPropagation();},true)); i.addEventListener('focus',()=>{i.dataset.kgenTouched='1';},true); i.addEventListener('input',()=>{i.dataset.kgenTouched='1'; const c=sanitize(i.value); if(c!==i.value) i.value=c; state.lastAmount=c; amountInputs().forEach(o=>{if(o!==i && document.activeElement!==o) o.value=c;}); updateStatus();});});}
  function getAmount(){setupAmountInputs(); const active=document.activeElement; if(active&&amountInputs().includes(active)) return sanitize(active.value); return amountInputs().map(i=>sanitize(i.value)).find(Boolean)||state.lastAmount||'';}
  function clickByIdOrText(id,pats,label){let btn=id?$(id):null; if(!btn){btn=qa('button').find(b=>pats.some(p=>p.test((b.textContent||'')+' '+(b.id||''))));} if(btn){btn.click();return true;} status(label+'：找不到原始交易按鈕。'); speak(label+' 找不到交易按鈕。'); return false;}
  function ensureTempleOps(){const old=window.templeOps||{}; window.templeOps=Object.assign({},old,{approve:old.approve||(()=>clickByIdOrText('kh-approve',[/approve|授權/i],'Approve 授權')), cup:old.cup||(()=>{try{window.KGEN12345_HOLY_CUP&&KGEN12345_HOLY_CUP.tap&&KGEN12345_HOLY_CUP.tap();}catch(e){} status('三聖盃已請示。');}), fortune:old.fortune||(()=>clickByIdOrText('kh-fortune',[/fortuneClaim|發財金/],'fortuneClaim 發財金')), heartbeat:old.heartbeat||(()=>clickByIdOrText('kh-heartbeat',[/heartbeatClaim|整點心跳|心跳/],'heartbeatClaim 整點心跳')), ignite:old.ignite||(()=>clickByIdOrText('kh-ignite',[/igniteAndClaim|轉日呼吸|呼吸/],'igniteAndClaim 轉日呼吸')), vow:old.vow||(()=>clickByIdOrText('kh-vow',[/vowTo|還願/],'vowTo 還願')), lamp:old.lamp||(()=>clickByIdOrText('kh-lamp',[/lightLamp|點燈/],'lightLamp 點燈')), wish:old.wish||(()=>clickByIdOrText('kh-wishbtn',[/makeWish|許願/],'makeWish 許願'))});}
  function btn(label,fn,cls='term-btn'){const b=document.createElement('button'); b.type='button'; b.className=cls; b.textContent=label; b.style.cssText='padding:10px;border-radius:10px;pointer-events:auto;'; b.onclick=e=>{e.preventDefault();e.stopPropagation();fn();}; return b;}
  function ensureMasterDock(){const panel=$('web3-panel')||document.querySelector('[id*="heart-live"],[id*="web3"]'); if(!panel||$('kgen-v1030-master-dock')) return; const d=document.createElement('div'); d.id='kgen-v1030-master-dock'; d.style.cssText='margin-top:10px;padding:10px;border:1px solid rgba(255,215,120,.45);border-radius:12px;background:rgba(0,0,0,.38);display:grid;grid-template-columns:1fr 1fr;gap:8px;position:relative;z-index:5;'; d.innerHTML='<div style="grid-column:1/3;color:#ffd778;font-weight:900;">悟空控制台｜鏈上交易器官</div><div style="grid-column:1/3;color:#bff;font-size:12px;line-height:1.5;">金額由下方欄位自行輸入；系統不自動填 8，不會自動送交易。</div><input id="kh-amount-master" data-kgen-user-owned="true" inputmode="decimal" placeholder="請自行輸入 KGEN 數量" style="grid-column:1/3;padding:10px;border-radius:10px;border:1px solid rgba(255,215,120,.35);background:#050505;color:#fff;font-weight:900;pointer-events:auto;">'; d.appendChild(btn('Approve 授權',()=>templeOps.approve(),'term-btn active-kgen')); d.appendChild(btn('fortuneClaim 發財金',()=>templeOps.fortune(),'term-btn active-kgen')); d.appendChild(btn('heartbeatClaim 心跳',()=>templeOps.heartbeat())); d.appendChild(btn('igniteAndClaim 呼吸',()=>templeOps.ignite())); d.appendChild(btn('vowTo 還願下單',()=>templeOps.vow())); d.appendChild(btn('lightLamp 點燈下單',()=>templeOps.lamp())); const w=btn('makeWish 許願下單',()=>templeOps.wish(),'term-btn active-kgen'); w.style.gridColumn='1/3'; d.appendChild(w); const st=document.createElement('div'); st.id='kgen-v1030-status'; st.style.cssText='grid-column:1/3;color:#bff;font-size:12px;line-height:1.45;white-space:pre-wrap;'; st.textContent='MASTER STABLE：心跳、呼吸、許願、還願、點燈已保留。'; d.appendChild(st); const q=panel.querySelector('.quickstart-card'); if(q&&q.parentNode) q.parentNode.insertBefore(d,q.nextSibling); else panel.appendChild(d); setupAmountInputs();}
  function injectCss(){if($('kgen-v1030-master-stable-css')) return; const st=document.createElement('style'); st.id='kgen-v1030-master-stable-css'; st.textContent='#web3-panel,#kgen-heart-live-panel{max-height:calc(100vh - 210px)!important;overflow-y:auto!important;-webkit-overflow-scrolling:touch!important;bottom:185px!important}#bottom-dock,.bottom-dock,.bottom-nav,.footer-nav{z-index:100500!important}input[data-kgen-user-owned="true"]{pointer-events:auto!important;user-select:text!important;-webkit-user-select:text!important;touch-action:manipulation!important}#kgen-v1030-total-collapse{position:fixed;right:12px;top:88px;z-index:100900;padding:8px 11px;border:1px solid rgba(255,215,120,.7);border-radius:16px;background:rgba(0,0,0,.72);color:#ffd778;font-weight:900;font-size:12px;pointer-events:auto}.kgen-v1030-collapsed #web3-panel,.kgen-v1030-collapsed #kgen-heart-live-panel,.kgen-v1030-collapsed #right-rules-panel{display:none!important}.kgen-v1030-front-mirror{outline:2px solid rgba(95,245,255,.95)!important;box-shadow:0 0 22px rgba(95,245,255,.55)!important}.kgen-v1030-rear-mirror{outline:2px solid rgba(255,190,80,.95)!important;box-shadow:0 0 22px rgba(255,190,80,.55)!important}'; document.head.appendChild(st); if(!$('kgen-v1030-total-collapse')){const b=document.createElement('button'); b.id='kgen-v1030-total-collapse'; b.type='button'; b.textContent='總收合'; b.onclick=e=>{e.preventDefault();e.stopPropagation();document.body.classList.toggle('kgen-v1030-collapsed');b.textContent=document.body.classList.contains('kgen-v1030-collapsed')?'全部展開':'總收合';}; document.body.appendChild(b);}}
  function percent(v){return clamp(v,0,300)/300*100;} function yFrom(v){return (clamp(v,0,300)-20)*1.4;}
  function applyMove(){const e=clamp(state.elevator,0,300), y=Math.round(yFrom(e)), p=percent(e).toFixed(2); root.style.setProperty('--kgen-v1027-main-x',Math.round(state.x)+'px'); root.style.setProperty('--kgen-v1027-main-y',y+'px'); root.style.setProperty('--kgen-v1026-main-x',Math.round(state.x)+'px'); root.style.setProperty('--kgen-v1026-main-y',y+'px'); root.style.setProperty('--v72-move-x',Math.round(state.x)+'px'); root.style.setProperty('--v72-move-y',y+'px'); root.style.setProperty('--kgen-motion-x','0px'); root.style.setProperty('--kgen-warp-y','0px'); ['--kgen-v1027-elevator-percent','--kgen-v1026-elevator-percent','--kgen-v1025-elevator-percent'].forEach(k=>root.style.setProperty(k,p+'%')); const core=$('core-anchor'); if(core){core.style.setProperty('--v72-move-x',Math.round(state.x)+'px');core.style.setProperty('--v72-move-y',y+'px');} const k=$('move-joystick-knob'); if(k){k.style.left=(40+clamp(state.x/1.8,-38,38))+'px';k.style.top=(40+clamp((20-e)/280*38,-38,38))+'px';} ['kgen-v1027-elevator-value','kgen-v1026-elevator-value','warp-val','warp-label'].forEach(id=>{const el=$(id); if(el) el.textContent=String(Math.round(e));}); updateStatus();}
  function setupMoveJoystick(){const wrap=$('move-joystick-wrap'), knob=$('move-joystick-knob'); if(!wrap||!knob) return; let active=false,pid=null; function h(x,y){const r=wrap.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2; let dx=x-cx,dy=y-cy; const m=38,l=Math.hypot(dx,dy)||1; if(l>m){dx=dx/l*m;dy=dy/l*m;} state.x=dx*1.8; state.elevator=clamp(20+(-dy/m)*280,0,300); applyMove();} wrap.addEventListener('pointerdown',e=>{if(e.target&&/input|button|select|textarea/i.test(e.target.tagName))return; e.preventDefault();e.stopPropagation();active=true;pid=e.pointerId;try{wrap.setPointerCapture(pid)}catch(_){ }h(e.clientX,e.clientY);},true); wrap.addEventListener('pointermove',e=>{if(!active||e.pointerId!==pid)return; e.preventDefault();e.stopPropagation();h(e.clientX,e.clientY);},true); function up(e){if(pid!==null&&e&&e.pointerId!==pid)return;active=false;pid=null;} wrap.addEventListener('pointerup',up,true);wrap.addEventListener('pointercancel',up,true);wrap.addEventListener('lostpointercapture',up,true);}
  function setupElevatorRail(){const c=qa('[id*="elevator"],[id*="warp"],.universe-elevator,.warp-rail').filter(el=>{const t=((el.id||'')+' '+(el.className||'')+' '+(el.textContent||'')).toLowerCase();const r=el.getBoundingClientRect();return (t.includes('elevator')||t.includes('warp')||t.includes('宇宙電梯'))&&r.height>80&&r.width<240;})[0]||$('warp-input-val'); if(!c)return; function fromY(y){const r=c.getBoundingClientRect(); setElevator((1-clamp((y-r.top)/Math.max(1,r.height),0,1))*300);} ['pointerdown','pointermove'].forEach(ev=>c.addEventListener(ev,e=>{if(ev==='pointermove'&&e.buttons!==1)return;e.preventDefault();e.stopPropagation();fromY(e.clientY);},true));}
  function setElevator(v){state.elevator=clamp(v,0,300);applyMove();} function setXY(x,y){state.x=clamp(x,-180,180);state.elevator=clamp(y,0,300);applyMove();}
  function sideFromAngle(){const s=$('steer-input-val'), a=s?Number(s.value||0):0; return (a>=-90&&a<=90)?'多方':'空方';}
  function setupMirror(){const old=window.templeOps||{}; function activate(){const side=sideFromAngle();const core=$('core-window')||$('core-anchor'); if(core){core.classList.remove('kgen-v1030-front-mirror','kgen-v1030-rear-mirror');core.classList.add(side==='多方'?'kgen-v1030-front-mirror':'kgen-v1030-rear-mirror');} status('下單鏡頭啟動：'+(side==='多方'?'前鏡｜多方':'後鏡｜空方'));}
    ['fortune','heartbeat','ignite','vow','lamp','wish'].forEach(k=>{const fn=old[k]||window.templeOps?.[k]; if(typeof fn==='function') window.templeOps[k]=function(){activate();return fn.apply(this,arguments);};}); const s=$('steer-input-val'); if(s)s.addEventListener('input',activate);}
  function fixMessages(){qa('button').forEach(b=>{const t=b.textContent||''; if(/訊息|紀錄|20/.test(t)&&!b.dataset.k1030memo){b.dataset.k1030memo='1';b.addEventListener('click',()=>setTimeout(()=>speak('訊息紀錄已開啟，這裡只顯示紀錄，不會送交易。'),30),true);} if(/關閉|收合|×|X/.test(t)&&!b.dataset.k1030close){b.dataset.k1030close='1';b.addEventListener('click',()=>{const p=b.closest('[id],.modal,.panel,.drawer,.card'); if(p&&!/web3-panel|kgen-heart-live-panel/.test(p.id||'')){p.classList.remove('show','open','active');p.style.display='none';}},true);}});}
  function updateStatus(){const el=$('kgen-v1030-status'); if(el) el.textContent='MASTER STABLE｜Amount '+(getAmount()||'自行輸入')+' KGEN｜Elevator '+Math.round(state.elevator)+'｜X '+Math.round(state.x)+'｜'+sideFromAngle();}
  function init(){syncVersion();injectCss();ensureTempleOps();ensureMasterDock();setupAmountInputs();setupMoveJoystick();setupElevatorRail();setupMirror();fixMessages();applyMove();status('V10.30 MASTER STABLE 已啟動。');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init(); setTimeout(init,500);setTimeout(init,1600);setTimeout(init,3600);setInterval(()=>{syncVersion();setupAmountInputs();fixMessages();updateStatus();},2000);
  window.KGEN12345_MASTER_STABLE={version:VERSION,build:BUILD,state,setElevator,setXY,getAmount,setupAmountInputs,syncVersion};
})();


/* KGEN_V10371_C_PATCH */
(function(){
if(window.__KGEN_V10371_C_PATCH__) return;
window.__KGEN_V10371_C_PATCH__=true;
window.KGEN_SET_WARP_C=function(v){
 v=Math.max(0,Math.min(300,Number(v)||0));
 const txt=document.getElementById('warp-txt');
 if(txt){
  txt.textContent=v===0?'C 0｜觀望':`C ${v}｜第 ${v} 層宇宙`;
 }
 const img=document.getElementById('fairy-img');
 if(img){
  const fallback='./assets/heart.png';
  const n=String(v).padStart(3,'0');
  if(v===0){
   img.src=fallback;
  }else{
   img.onerror=function(){this.onerror=null;this.src=fallback;};
   img.src=`./scenes/floor_${n}.png`;
  }
 }
};
})();
