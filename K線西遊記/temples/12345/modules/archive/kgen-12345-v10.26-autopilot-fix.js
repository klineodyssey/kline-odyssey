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
