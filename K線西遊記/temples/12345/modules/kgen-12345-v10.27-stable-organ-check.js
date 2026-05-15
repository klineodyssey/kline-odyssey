/* =========================================================
 KGEN 12345｜V10.27 STABLE ORGAN SELF CHECK
 路徑：/K線西遊記/temples/12345/modules/kgen-12345-v10.27-stable-organ-check.js
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
