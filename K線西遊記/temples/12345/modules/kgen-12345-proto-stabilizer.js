
/*
KGEN 12345｜Prototype Stabilizer Runtime
VERSION: V10.42.2_PROTO_RUNTIME_STABILIZER
Purpose:
- Final 2D prototype stabilizer before true WebGL sphere line.
- Force bull/bear/heart assets into the central core.
- Restore rotateZ + rotateY phase logic through slider/wheel/buttons.
- Restore bottom eight button panel open/close behavior.
- Fix header spacing and Warp label pollution.
*/
(function(){
  'use strict';
  const VERSION='KGEN-12345-V10.42.2_PROTO_RUNTIME_STABILIZER';
  const ASSET={
    bull:'./assets/bull-front.png',
    bear:'./assets/bear-rear.png',
    heart:'./assets/heart.png',
    warp:'./assets/warp-core.png'
  };
  const $=(id)=>document.getElementById(id);
  const $$=(sel)=>Array.from(document.querySelectorAll(sel));
  const doc=document.documentElement;
  const state={theta:106,x:0,y:0,moving:false,warp:100,ready:false};
  let moveTimer=null;

  function norm(v){v=Number(v); if(!Number.isFinite(v)) v=0; while(v>180)v-=360; while(v<-180)v+=360; return Math.round(v);}
  function isBull(a){a=norm(a); return a>=-90 && a<=90;}
  function mode(){return state.moving?'heart':(isBull(state.theta)?'bull':'bear');}
  function core(){return $('core-window');}
  function img(){return $('fairy-img');}
  function touchHeart(ms=900){state.moving=true; render(); clearTimeout(moveTimer); moveTimer=setTimeout(()=>{state.moving=false; render();},ms);}
  function assetFor(){const m=mode(); return m==='heart'?ASSET.heart:(m==='bull'?ASSET.bull:ASSET.bear);}

  function injectCss(){
    if($('kgen-10422-proto-css')) return;
    const st=document.createElement('style'); st.id='kgen-10422-proto-css';
    st.textContent=`
:root{--proto-x:0px;--proto-y:0px;--proto-z:0deg;--kgen-bottom-safe:142px;}
/* Header must not hide version and should not cover the browser top bar. */
#brand-badge{top:42px!important;left:14px!important;z-index:540!important;}
.hud-top{top:68px!important;left:3%!important;width:94%!important;z-index:520!important;}
#ver-st{display:block!important;visibility:visible!important;color:#89f8ff!important;text-shadow:0 0 10px rgba(0,242,255,.65)!important;}
.resource-bars{top:176px!important;z-index:420!important;}
/* Central anti-gravity 2D core: image must be visible and rotate with theta. */
#core-anchor{position:fixed!important;left:50%!important;top:53%!important;width:min(380px,66vw)!important;height:min(380px,66vw)!important;z-index:86!important;transform:translate(-50%,-50%) translate3d(var(--proto-x),var(--proto-y),0)!important;will-change:transform!important;pointer-events:none!important;}
#core-window{position:relative!important;width:100%!important;height:100%!important;border-radius:50%!important;overflow:hidden!important;transform:rotateZ(var(--proto-z))!important;transform-origin:50% 50%!important;transition:transform .16s linear!important;background:#05070b center/cover no-repeat!important;border:10px double rgba(255,215,120,.9)!important;box-shadow:0 0 54px rgba(255,215,120,.32),0 0 92px rgba(0,242,255,.10),inset 0 0 48px rgba(0,0,0,.48)!important;pointer-events:auto!important;}
#fairy-img{position:absolute!important;inset:0!important;width:100%!important;height:100%!important;display:block!important;visibility:visible!important;opacity:1!important;object-fit:cover!important;object-position:center!important;border-radius:50%!important;z-index:2!important;transform:none!important;animation:none!important;filter:saturate(1.08) contrast(1.05) drop-shadow(0 0 16px rgba(255,215,120,.28))!important;}
#core-window::before{content:"";position:absolute;inset:0;border-radius:50%;z-index:4;pointer-events:none;background:radial-gradient(circle at 34% 22%,rgba(255,255,255,.52),transparent 17%),linear-gradient(120deg,rgba(255,255,255,.13),transparent 32%,rgba(0,0,0,.22) 74%);mix-blend-mode:screen;}
#wish-label{z-index:9!important;left:50%!important;right:auto!important;bottom:38px!important;transform:translateX(-50%)!important;width:max-content!important;max-width:82%!important;white-space:nowrap!important;text-align:center!important;font-size:clamp(12px,2.6vw,17px)!important;line-height:1.2!important;padding:6px 12px!important;border-radius:999px!important;background:rgba(0,0,0,.48)!important;border:1px solid rgba(255,215,120,.32)!important;text-shadow:0 0 12px #000,0 0 16px rgba(255,215,120,.36)!important;}
#cam-view,#mini-thumb{z-index:7!important;}
/* K-line panels: keep visible, no hidden modules/debug words. */
#kline-engine-panel,#kline-chart-panel,.ga-matrix{display:block!important;visibility:visible!important;opacity:1!important;}
[data-debug],.debug,.dev-only,.module-label,.modules-label,.kgen-warp-bad-label{display:none!important;}
/* Holy cup safe lane. */
#v104-cup-panel,#kgen-holy-cup-panel,.kgen-holy-cup-panel,#holy-cup-check,.holy-cup-check,#cup-check-panel,.cup-check-panel,#cup-system,.cup-system{position:fixed!important;left:50%!important;right:auto!important;top:auto!important;bottom:156px!important;transform:translateX(-50%) scale(.82)!important;transform-origin:bottom center!important;width:min(500px,calc(100vw - 160px))!important;max-height:96px!important;overflow:auto!important;z-index:235!important;}
/* Warp: cabin follows thumb; text stays under rail, no 300 pollution inside rail. */
.warp-engine{right:8px!important;bottom:262px!important;width:86px!important;z-index:210!important;overflow:visible!important;}
.warp-rail{overflow:visible!important;}
#warp-thumb{overflow:visible!important;display:flex!important;align-items:center!important;justify-content:center!important;z-index:46!important;}
#kgen-warp-core-orb,#kgen-ag2d-warp-core{width:50px!important;height:50px!important;border-radius:50%!important;object-fit:cover!important;border:2px solid rgba(255,215,120,.82)!important;box-shadow:0 0 18px rgba(0,242,255,.85),0 0 28px rgba(255,215,120,.38)!important;pointer-events:none!important;}
#kgen-warp-level-label{display:none!important;}
.warp-val-text{position:relative!important;display:block!important;margin-top:18px!important;font-size:12px!important;line-height:1.1!important;white-space:nowrap!important;text-align:center!important;color:#ffd56a!important;text-shadow:0 0 14px rgba(255,215,120,.55)!important;}
.warp-val-text::after{display:none!important;content:""!important;}
/* Bottom terminal remains eight buttons and is always clickable. */
.footer-terminal{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important;left:0!important;right:0!important;bottom:0!important;padding:8px 8px calc(9px + env(safe-area-inset-bottom,0px))!important;z-index:700!important;background:rgba(0,0,0,.92)!important;border-top:1px solid rgba(255,215,120,.34)!important;}
.footer-terminal .term-btn{min-height:42px!important;font-size:0!important;padding:6px 4px!important;border-radius:9px!important;display:flex!important;align-items:center!important;justify-content:center!important;flex-direction:column!important;gap:2px!important;pointer-events:auto!important;}
.footer-terminal .term-btn::before{content:attr(data-icon);font-size:16px!important;line-height:1!important;}
.footer-terminal .term-btn::after{content:attr(data-title);font-size:11px!important;line-height:1.1!important;font-weight:900!important;white-space:nowrap!important;}
.footer-terminal .term-btn.kgen-active{outline:1px solid rgba(255,215,120,.75)!important;box-shadow:inset 0 0 18px rgba(255,215,120,.18)!important;}
/* Unified popup panels for the bottom buttons. */
.kgen-proto-panel{position:fixed;left:10px;right:10px;bottom:calc(var(--kgen-bottom-safe) + 8px);z-index:760;display:none;max-height:250px;overflow:hidden;color:#f8f1d0;background:rgba(4,8,14,.96);border:1px solid rgba(255,215,120,.52);border-radius:16px;box-shadow:0 0 36px rgba(0,0,0,.72),0 0 22px rgba(255,215,120,.12);backdrop-filter:blur(10px);font-family:Arial,'Noto Sans TC',sans-serif;}
.kgen-proto-panel.open{display:block!important;}
.kgen-proto-head{display:flex;align-items:center;justify-content:space-between;padding:10px 12px;border-bottom:1px solid rgba(255,215,120,.25);color:#ffe39a;font-weight:900;}
.kgen-proto-head button{border:1px solid rgba(255,215,120,.38);border-radius:999px;background:rgba(0,0,0,.35);color:#ffe39a;padding:4px 10px;font-weight:900;}
.kgen-proto-body{padding:10px 12px;font-size:12px;line-height:1.55;max-height:198px;overflow:auto;}
.kgen-proto-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px;}
.kgen-proto-grid button{border:1px solid rgba(255,215,120,.34);border-radius:10px;background:rgba(0,242,255,.08);color:#fff3bd;padding:8px;font-weight:900;}
@media(max-width:720px){
  #brand-badge{top:40px!important;}
  .hud-top{top:68px!important;}
  .resource-bars{top:180px!important;}
  #core-anchor{top:53%!important;width:min(340px,78vw)!important;height:min(340px,78vw)!important;}
  #v104-cup-panel,#kgen-holy-cup-panel,.kgen-holy-cup-panel,#holy-cup-check,.holy-cup-check,#cup-check-panel,.cup-check-panel,#cup-system,.cup-system{bottom:150px!important;width:min(310px,calc(100vw - 126px))!important;max-height:88px!important;transform:translateX(-50%) scale(.78)!important;}
  .warp-engine{right:6px!important;bottom:252px!important;width:78px!important;}
  #kgen-warp-core-orb,#kgen-ag2d-warp-core{width:44px!important;height:44px!important;}
  .kgen-proto-panel{bottom:calc(var(--kgen-bottom-safe) + 5px);max-height:220px;}
}
`;
    document.head.appendChild(st);
  }

  function updateSrc(){
    const im=img(); const c=core(); const url=assetFor();
    if(c){c.style.setProperty('background-image',`url("${url}")`,'important'); c.classList.remove('kgen-phase-bull','kgen-phase-bear','kgen-phase-heart'); c.classList.add('kgen-phase-'+mode());}
    if(im){
      if(im.getAttribute('src')!==url) im.setAttribute('src',url);
      im.style.display='block'; im.style.visibility='visible'; im.style.opacity='1';
      im.onerror=function(){ this.onerror=null; this.src=ASSET.heart; if(c)c.style.setProperty('background-image',`url("${ASSET.heart}")`,'important'); };
    }
  }
  function render(){
    doc.style.setProperty('--proto-x',state.x+'px');
    doc.style.setProperty('--proto-y',state.y+'px');
    doc.style.setProperty('--proto-z',state.theta+'deg');
    const c=core(); if(c) c.style.setProperty('transform',`rotateZ(${state.theta}deg)`,'important');
    updateSrc();
    const m=mode();
    const wl=$('wish-label'); if(wl) wl.textContent=m==='heart'?'悟空心臟｜移動推進':(isBull(state.theta)?'XY 方向｜多方前鏡':'XY 方向｜空方後鏡');
    const side=$('ke-side'); if(side) side.textContent=m==='heart'?'心':(isBull(state.theta)?'多':'空');
    const angle=$('ke-angle'); if(angle) angle.textContent=String(state.theta);
    const av=$('ang-val'); if(av) av.textContent=state.theta+'°';
    const kd=$('kc-dir'); if(kd) kd.textContent=`方向盤 → ${m==='heart'?'心臟運行':(isBull(state.theta)?'多方K':'空方K')}`;
    const status=$('k12345-slider-status'); if(status) status.textContent=`CORE 方向 ${state.theta}°｜${isBull(state.theta)?'多方':'空方'}｜圖像自轉`;
  }
  function setTheta(v){state.theta=norm(v); const r=$('steer-input-val'); if(r && Number(r.value)!==state.theta) r.value=String(state.theta); render();}

  function bindSteer(){
    const r=$('steer-input-val');
    if(r && !r.dataset.kgen10422){r.dataset.kgen10422='1'; r.min='-180'; r.max='180'; r.step='1'; r.addEventListener('input',()=>setTheta(r.value),true); r.addEventListener('change',()=>setTheta(r.value),true);}
    const wheel=$('wheel');
    if(wheel && !wheel.dataset.kgen10422){wheel.dataset.kgen10422='1'; let active=false;
      const calc=(e)=>{const b=wheel.getBoundingClientRect(); const x=e.clientX-b.left-b.width/2; const y=e.clientY-b.top-b.height/2; const deg=norm(Math.atan2(y,x)*180/Math.PI+90); wheel.style.setProperty('transform',`rotate(${deg}deg)`,'important'); setTheta(deg);};
      wheel.addEventListener('pointerdown',e=>{active=true;try{wheel.setPointerCapture(e.pointerId);}catch(_){} calc(e); e.preventDefault();},true);
      wheel.addEventListener('pointermove',e=>{if(active){calc(e); e.preventDefault();}},true);
      ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>wheel.addEventListener(ev,()=>{active=false;},true));
    }
  }
  function bindJoystick(){
    const wrap=$('move-joystick-wrap'), knob=$('move-joystick-knob'); if(!wrap||!knob||wrap.dataset.kgen10422) return; wrap.dataset.kgen10422='1';
    let active=false;
    const move=(e)=>{const b=wrap.getBoundingClientRect(); const cx=b.left+b.width/2, cy=b.top+b.height/2; let dx=e.clientX-cx, dy=e.clientY-cy; const max=42, d=Math.hypot(dx,dy)||1; if(d>max){dx=dx/d*max;dy=dy/d*max;} knob.style.left=(40+dx)+'px'; knob.style.top=(40+dy)+'px'; state.x=Math.round(dx*1.55); state.y=Math.round(dy*1.55); state.moving=true; render();};
    const end=()=>{if(!active)return; active=false; knob.style.left='40px'; knob.style.top='40px'; state.x=0; state.y=0; touchHeart(280); render();};
    wrap.addEventListener('pointerdown',e=>{active=true;try{wrap.setPointerCapture(e.pointerId);}catch(_){} move(e); e.preventDefault();},true);
    wrap.addEventListener('pointermove',e=>{if(active){move(e); e.preventDefault();}},true);
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>wrap.addEventListener(ev,end,true));
  }

  function bindWarp(){
    const input=$('warp-input-val'), thumb=$('warp-thumb'), txt=$('warp-txt');
    if(thumb && !$('kgen-warp-core-orb')){const o=document.createElement('img'); o.id='kgen-warp-core-orb'; o.src=ASSET.warp; o.alt='warp-core'; thumb.appendChild(o);}
    if(input){input.min='0'; input.max='300'; input.step='1'; if(Number(input.value)<=100) input.value=String(Math.round(Number(input.value||0)*3)); if(!input.dataset.kgen10422){input.dataset.kgen10422='1'; input.addEventListener('input',()=>applyWarp(input.value),true); input.addEventListener('change',()=>applyWarp(input.value),true);}}
    applyWarp(input?input.value:state.warp); if(txt) txt.textContent='WARP '+Math.round(state.warp);
  }
  function applyWarp(v){state.warp=Math.max(0,Math.min(300,Math.round(Number(v)||0))); const pct=state.warp/300; const thumb=$('warp-thumb'); if(thumb) thumb.style.setProperty('bottom',`calc(${pct*100}% - 18px)`,'important'); const fill=$('energy-fill'); if(fill) fill.style.setProperty('height',(pct*100)+'%','important'); const txt=$('warp-txt'); if(txt) txt.textContent='WARP '+state.warp;}

  const panels={
    capture:{title:'拍照存證',body:'<p>保留神殿畫面存證。按下拍照會呼叫既有 app.capture()。</p>'},
    rec:{title:'錄影',body:'<p>神殿留影錄影控制。若瀏覽器限制螢幕錄影，保留 HUD / scene capture 模式。</p>'},
    bull:{title:'前鏡多方',body:'<p>將 θy / 方向相位切回多方前鏡。範圍：-90° ~ +90°。</p>'},
    bear:{title:'後鏡空方',body:'<p>將 θy / 方向相位切到空方後鏡。範圍：+90° ~ +180° 或 -180° ~ -90°。</p>'},
    heart:{title:'悟空心臟',body:'<p>發財金、點燈、還願、呼吸與 heartbeat 的核心操作窗。</p><div class="kgen-proto-grid"><button data-op="fortune">發財金</button><button data-op="heartbeat">心跳</button><button data-op="ignite">呼吸</button><button data-op="wish">許願</button><button data-op="vow">還願</button><button data-op="lamp">點燈</button></div>'},
    screen:{title:'螢幕錄影',body:'<p>錄影 / 截圖 / 影像模式集中控制。下一階段可接 V9 錄影核心。</p>'},
    rules:{title:'規則活動',body:'<p>節日活動、三聖盃流程、每日活動與規則說明集中在此。</p>'},
    map:{title:'右側神規',body:'<p>宇宙地圖、地址、Gate、Warp、CT、合約與地點資料集中在此。右側神規不是 Warp Panel。</p>'}
  };
  function ensurePanel(key){
    const def=panels[key]; let p=$('kgen-proto-panel-'+key); if(p) return p;
    p=document.createElement('section'); p.id='kgen-proto-panel-'+key; p.className='kgen-proto-panel';
    p.innerHTML=`<div class="kgen-proto-head"><span>${def.title}</span><button type="button" data-close="${key}">收合</button></div><div class="kgen-proto-body">${def.body}</div>`;
    document.body.appendChild(p);
    p.querySelector('[data-close]').addEventListener('click',()=>togglePanel(key,false),true);
    p.querySelectorAll('[data-op]').forEach(b=>b.addEventListener('click',()=>{touchHeart(1200); const op=b.dataset.op; try{ if(window.templeOps&&typeof window.templeOps[op]==='function') window.templeOps[op](); }catch(_){} },true));
    return p;
  }
  function togglePanel(key,force){Object.keys(panels).forEach(k=>{const p=ensurePanel(k); if(k!==key) p.classList.remove('open');}); const p=ensurePanel(key); const on=force===undefined?!p.classList.contains('open'):!!force; p.classList.toggle('open',on);}
  function bindFooter(){
    const f=document.querySelector('.footer-terminal'); if(!f) return;
    const btns=$$('.footer-terminal .term-btn, .footer-terminal button').slice(0,8);
    const cfg=[
      ['capture','📸','拍照',()=>{try{window.app&&window.app.capture&&window.app.capture();}catch(_){} }],
      ['rec','🎥','錄影',()=>{try{window.app&&window.app.toggleRec&&window.app.toggleRec();}catch(_){} }],
      ['bull','🐂','前鏡多方',()=>setTheta(0)],
      ['bear','🐻','後鏡空方',()=>setTheta(180)],
      ['heart','🫀','悟空心臟',()=>touchHeart(1200)],
      ['screen','🎬','螢幕錄影',()=>{}],
      ['rules','📜','規則活動',()=>{}],
      ['map','🛡️','右側神規',()=>{}]
    ];
    btns.forEach((b,i)=>{const c=cfg[i]; if(!c) return; b.dataset.icon=c[1]; b.dataset.title=c[2]; b.setAttribute('type','button'); if(!b.dataset.kgen10422){b.dataset.kgen10422='1'; b.addEventListener('click',e=>{e.preventDefault(); e.stopImmediatePropagation(); cfg[i][3](); togglePanel(cfg[i][0]); render();},true);}});
  }
  function cleanText(){
    try{const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT); const bad=[]; while(walker.nextNode()){const n=walker.currentNode; const t=(n.nodeValue||'').trim(); if(t==='modules'||/wukong_heart_v10_4\.png|central mirror/i.test(t)) bad.push(n);} bad.forEach(n=>n.nodeValue='');}catch(_){ }
  }
  function wrapOps(){
    const ops=['fortune','wish','vow','lamp','heartbeat','ignite','approve','cup'];
    if(!window.templeOps) return;
    ops.forEach(k=>{const old=window.templeOps[k]; if(typeof old==='function'&&!old.__kgen10422){const fn=function(){touchHeart(1200); return old.apply(this,arguments);}; fn.__kgen10422=true; window.templeOps[k]=fn;}});
  }
  function boot(){
    injectCss(); bindSteer(); bindJoystick(); bindWarp(); bindFooter(); wrapOps(); cleanText();
    const v=$('ver-st'); if(v) v.textContent='VERSION '+VERSION; document.title='KGEN 12345 五指山悟空財神殿｜'+VERSION;
    const r=$('steer-input-val'); state.theta=norm(r?r.value:state.theta); state.moving=false; render(); state.ready=true;
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',boot);
  setInterval(()=>{bindWarp(); bindFooter(); cleanText(); render();},900);
  window.KGEN_12345_PROTO_STABILIZER={VERSION,setTheta,touchHeart,applyWarp,state,assets:ASSET};
})();

/*
VERSION: KGEN-12345-V10.42.3-PROTO-INTERACTION-LOCK
BUILD: 20260519-V10.42.3
BASE_FROM: V10.42.2 PROTO_RUNTIME_STABILIZER
CHANGELOG:
- Force bottom 8 buttons to real panel router actions.
- Restore core image state machine: static bull/bear, moving heart.
- Bind direction slider + right wheel to rotateZ and bull/bear judgement.
- Bind XY joystick with sane sensitivity and limited displacement.
- Bind Warp Elevator C0~C300 and remove stray cyan vertical line.
- Clean floating tags, header offset, duplicated bottom text.
*/
(function(){
  const VERSION='KGEN-12345-V10.42.3_PROTO_INTERACTION_LOCK';
  const $=(id)=>document.getElementById(id);
  const qsa=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const ASSET={bull:'./assets/bull-front.png',bear:'./assets/bear-rear.png',heart:'./assets/heart.png',warp:'./assets/warp-core.png'};
  const state={x:0,y:0,theta:76,mode:'static',warp:0,side:'bull'};
  let moveTimer=null;

  function injectStyle(){
    if($('kgen-v10423-style')) return;
    const css=`
      html,body{overflow:hidden!important;}
      .hud-top{top:24px!important;z-index:500!important;}
      .brand-section{transform:translateY(18px)!important;max-width:45vw!important;}
      .sys-st#ver-st,.sys-st#sys-clock{line-height:1.15!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      /* hide uncontrolled floating tags */
      .kgen-v10423-hidden-float{display:none!important;visibility:hidden!important;pointer-events:none!important;}
      .warp-engine{right:8px!important;bottom:262px!important;width:96px!important;z-index:620!important;}
      .warp-engine:before,.warp-engine:after,#wheel-wrap:before,#wheel-wrap:after,.wheel:before,.wheel:after{display:none!important;content:none!important;}
      .warp-rail{height:420px!important;width:30px!important;overflow:visible!important;}
      #energy-fill{left:0!important;right:0!important;width:100%!important;border-radius:0 0 6px 6px!important;}
      #warp-thumb{width:58px!important;height:58px!important;left:50%!important;margin-left:-29px!important;border-radius:50%!important;background:rgba(0,0,0,.32)!important;overflow:hidden!important;display:flex!important;align-items:center!important;justify-content:center!important;}
      #warp-thumb img{width:100%!important;height:100%!important;border-radius:50%!important;object-fit:cover!important;display:block!important;}
      .warp-val-text{font-size:16px!important;line-height:1.05!important;margin-top:10px!important;white-space:nowrap!important;text-align:center!important;}
      #warp-level-badge{font-size:10px!important;color:#ffe39a!important;text-shadow:0 0 8px #000!important;margin-top:2px!important;white-space:nowrap!important;}
      #core-anchor{position:fixed!important;top:50%!important;left:50%!important;width:min(380px,54vw)!important;height:min(380px,54vw)!important;z-index:80!important;will-change:transform!important;transform:translate(calc(-50% + var(--kgen-x,0px)),calc(-50% + var(--kgen-y,0px)))!important;}
      #core-window{width:100%!important;height:100%!important;border-radius:50%!important;overflow:hidden!important;transform:rotateZ(var(--kgen-theta,76deg))!important;transform-origin:50% 50%!important;transition:transform .08s linear!important;}
      #fairy-img{display:block!important;width:100%!important;height:100%!important;object-fit:cover!important;opacity:1!important;filter:contrast(1.04) saturate(1.08)!important;transform:none!important;}
      #wish-label{left:50%!important;right:auto!important;bottom:32px!important;transform:translateX(-50%)!important;font-size:15px!important;line-height:1.2!important;text-align:center!important;background:rgba(0,0,0,.48)!important;border:1px solid rgba(255,215,120,.38)!important;border-radius:14px!important;padding:6px 12px!important;white-space:nowrap!important;max-width:86%!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      #move-joystick-wrap{left:16px!important;bottom:170px!important;width:88px!important;height:88px!important;z-index:850!important;touch-action:none!important;pointer-events:auto!important;}
      #move-joystick-base{inset:12px!important;}
      #move-joystick-knob{width:34px!important;height:34px!important;left:27px!important;top:27px!important;pointer-events:none!important;}
      #move-joystick-label{font-size:9px!important;bottom:-18px!important;white-space:nowrap!important;}
      .steer-zone{bottom:126px!important;z-index:780!important;pointer-events:auto!important;}
      .angle-readout{font-size:44px!important;line-height:.9!important;pointer-events:none!important;}
      .steer-slider{width:86%!important;height:12px!important;pointer-events:auto!important;}
      #k12345-slider-status{bottom:104px!important;left:50%!important;transform:translateX(-50%)!important;max-width:82vw!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;font-size:11px!important;z-index:800!important;}
      #v104-cup-panel{left:50%!important;right:auto!important;bottom:166px!important;transform:translateX(-50%)!important;width:min(520px,58vw)!important;max-width:58vw!important;z-index:720!important;max-height:128px!important;overflow:hidden!important;padding:8px!important;}
      #v104-cup-panel .v104-cup-grid{grid-template-columns:1fr 12px 1fr 12px 1fr 12px 1.15fr!important;gap:4px!important;}
      #v104-cup-panel .v104-step{min-height:48px!important;padding:5px!important;}
      #v104-cup-panel .v104-step .title{font-size:9px!important;line-height:1.1!important;}
      #v104-cup-panel .v104-step .stat{font-size:9px!important;}
      #v104-cup-panel .v104-step button{font-size:9px!important;padding:4px!important;}
      #v104-cup-result{min-height:48px!important;font-size:10px!important;padding:5px!important;}
      .footer-terminal{grid-template-columns:repeat(4,1fr)!important;padding:8px 8px 10px!important;gap:6px!important;z-index:900!important;}
      .footer-terminal .term-btn,.footer-terminal button{min-height:46px!important;padding:7px 4px!important;font-size:12px!important;line-height:1.15!important;overflow:hidden!important;white-space:normal!important;}
      .kgen-v10423-panel{position:fixed;left:12px;right:12px;bottom:238px;z-index:950;max-height:46vh;overflow:auto;background:rgba(0,0,0,.86);border:1px solid rgba(255,215,120,.55);border-radius:14px;box-shadow:0 0 30px rgba(0,0,0,.65),0 0 16px rgba(0,245,255,.18);backdrop-filter:blur(8px);padding:12px;color:#fff;display:none;}
      .kgen-v10423-panel.open{display:block!important;}
      .kgen-v10423-head{display:flex;align-items:center;justify-content:space-between;color:#ffe39a;font-weight:900;margin-bottom:8px;border-bottom:1px solid rgba(255,215,120,.18);padding-bottom:7px;}
      .kgen-v10423-panel button{border:1px solid rgba(255,215,120,.38);border-radius:10px;background:rgba(255,215,120,.14);color:#ffe39a;font-weight:900;padding:6px 10px;}
      .kgen-v10423-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:12px;line-height:1.4;}
      .kgen-v10423-card{border:1px solid rgba(0,245,255,.22);background:rgba(0,40,48,.36);border-radius:10px;padding:8px;}
      @media(max-width:760px){
        .brand-section{max-width:48vw!important;transform:translateY(20px)!important;}
        #core-anchor{width:min(330px,56vw)!important;height:min(330px,56vw)!important;top:51%!important;}
        #v104-cup-panel{width:min(420px,58vw)!important;max-width:58vw!important;bottom:162px!important;}
        #v104-cup-panel .v104-step .title,#v104-cup-panel .v104-step button{display:none!important;}
        #v104-cup-panel .v104-step{min-height:36px!important;}
        #v104-cup-result small{display:none!important;}
        .warp-engine{bottom:268px!important;right:6px!important;}
        .warp-rail{height:370px!important;}
        .angle-readout{font-size:40px!important;}
      }
    `;
    const st=document.createElement('style'); st.id='kgen-v10423-style'; st.textContent=css; document.head.appendChild(st);
  }

  function txt(el){return (el&&el.textContent||'').replace(/\s+/g,' ').trim();}
  function isBull(a){a=((Number(a)||0)+540)%360-180; return a>=-90 && a<=90;}
  function setVersionText(){
    const ver=$('ver-st'); if(ver) ver.textContent='VERSION '+VERSION;
    document.querySelectorAll('body *').forEach(el=>{
      if(el.childElementCount>2) return;
      if(/V10\.42\.2|PROTO_RUNTIME_STABILIZER/.test(txt(el))) el.textContent=txt(el).replace(/KGEN-12345-V10\.42\.2_PROTO_RUNTIME_STABILIZER/g,VERSION).replace(/V10\.42\.2_PROTO_RUNTIME_STABILIZER/g,'V10.42.3_PROTO_INTERACTION_LOCK');
    });
  }
  function cleanFloatingTags(){
    qsa('button,div,span').forEach(el=>{
      const t=txt(el);
      if((t==='總收合' || t==='展開神殿' || t==='節日活動▼' || t==='節日活動') && !el.closest('.footer-terminal') && !el.closest('.data-box')){
        el.classList.add('kgen-v10423-hidden-float');
      }
      if(t.includes('三聖盃檢查') && !el.closest('#v104-cup-panel') && !el.closest('.footer-terminal')){
        el.classList.add('kgen-v10423-hidden-float');
      }
    });
  }
  function ensureWarpOrb(){
    const thumb=$('warp-thumb'); if(thumb && !thumb.querySelector('img')){ const img=document.createElement('img'); img.src=ASSET.warp; img.alt='warp-core'; thumb.appendChild(img); }
    let badge=$('warp-level-badge'); if(!badge && document.querySelector('.warp-engine')){ badge=document.createElement('div'); badge.id='warp-level-badge'; document.querySelector('.warp-engine').appendChild(badge); }
  }
  function applyCore(){
    const core=$('core-anchor'), win=$('core-window'), img=$('fairy-img'), label=$('wish-label');
    if(!core||!win||!img) return;
    core.style.setProperty('--kgen-x', state.x+'px'); core.style.setProperty('--kgen-y', state.y+'px');
    win.style.setProperty('--kgen-theta', state.theta+'deg');
    const bull=isBull(state.theta); state.side=bull?'bull':'bear';
    let src = state.mode==='heart' ? ASSET.heart : (bull ? ASSET.bull : ASSET.bear);
    if(!img.getAttribute('src') || !img.getAttribute('src').endsWith(src.replace('./',''))) img.src=src;
    if(label) label.textContent= state.mode==='heart' ? '悟空心臟｜移動推進' : (bull?'悟空鎮守五指山｜多方前行':'悟空鎮守五指山｜空方後鏡');
    const ang=$('ang-val'); if(ang) ang.textContent=Math.round(state.theta)+'°';
    const status=$('k12345-slider-status'); if(status) status.textContent='CORE 方向 '+Math.round(state.theta)+'°｜'+(bull?'多方':'空方')+'｜X '+Math.round(state.x)+' / Y '+Math.round(state.y)+'｜C '+Math.round(state.warp)+'/300';
    const ml=$('move-joystick-label'); if(ml) ml.textContent='X '+Math.round(state.x)+' / Y '+Math.round(state.y);
  }
  function setTheta(v){ state.theta=Math.max(-180,Math.min(180,Number(v)||0)); const r=$('steer-input-val'); if(r && String(r.value)!==String(Math.round(state.theta))) r.value=Math.round(state.theta); applyCore(); }
  function setMoving(active){ state.mode=active?'heart':'static'; clearTimeout(moveTimer); if(active){ moveTimer=setTimeout(()=>{state.mode='static'; applyCore();},700); } applyCore(); }
  function bindSlider(){
    const r=$('steer-input-val'); if(!r) return; r.min='-180'; r.max='180'; r.value=String(state.theta);
    ['input','change','pointermove','touchmove'].forEach(ev=>r.addEventListener(ev,()=>setTheta(r.value),{passive:true}));
    setTheta(r.value||76);
  }
  function bindWheel(){
    const wheel=$('wheel')||document.querySelector('.wheel'); const wrap=$('wheel-wrap'); if(!wheel) return;
    function calc(e){const p=e.touches?e.touches[0]:e; const rc=wheel.getBoundingClientRect(); const cx=rc.left+rc.width/2, cy=rc.top+rc.height/2; let deg=Math.atan2(p.clientY-cy,p.clientX-cx)*180/Math.PI; setTheta(deg); wheel.style.transform='rotate('+deg+'deg)';}
    ['pointerdown','pointermove','touchstart','touchmove'].forEach(ev=>wheel.addEventListener(ev,function(e){ if(ev.includes('move') && !(e.buttons||e.touches)) return; e.preventDefault(); calc(e); },{passive:false}));
    if(wrap) wrap.style.pointerEvents='auto';
  }
  function bindJoystick(){
    const wrap=$('move-joystick-wrap'), knob=$('move-joystick-knob'); if(!wrap||!knob) return;
    let active=false;
    function center(){ const r=wrap.getBoundingClientRect(); return {x:r.left+r.width/2,y:r.top+r.height/2,rad:Math.min(r.width,r.height)*0.34}; }
    function move(e){ const p=e.touches?e.touches[0]:e; const c=center(); let dx=p.clientX-c.x, dy=p.clientY-c.y; const len=Math.hypot(dx,dy)||1; if(len>c.rad){dx=dx/len*c.rad; dy=dy/len*c.rad;} knob.style.transform='translate('+dx+'px,'+dy+'px)'; state.x=Math.round(dx*1.35); state.y=Math.round(dy*1.35); setMoving(true); }
    function down(e){ active=true; e.preventDefault(); move(e); }
    function up(){ if(!active) return; active=false; knob.style.transform='translate(0,0)'; state.x=0; state.y=0; setMoving(false); }
    ['pointerdown','touchstart'].forEach(ev=>wrap.addEventListener(ev,down,{passive:false,capture:true}));
    ['pointermove','touchmove'].forEach(ev=>window.addEventListener(ev,e=>{if(active){e.preventDefault();move(e);}}, {passive:false,capture:true}));
    ['pointerup','pointercancel','touchend','touchcancel'].forEach(ev=>window.addEventListener(ev,up,{passive:true,capture:true}));
  }
  function applyWarp(){
    ensureWarpOrb(); const input=$('warp-input-val'), thumb=$('warp-thumb'), fill=$('energy-fill'), txtEl=$('warp-txt'), badge=$('warp-level-badge');
    let v=Number(input&&input.value||state.warp||0); v=Math.max(0,Math.min(300,v)); state.warp=v;
    const pct=v/300;
    if(fill) fill.style.height=(pct*100)+'%';
    if(thumb) thumb.style.bottom=`calc(${pct*100}% - 29px)`;
    if(txtEl) txtEl.textContent='WARP '+String(Math.round(v)).padStart(3,'0');
    if(badge) badge.textContent='C '+Math.round(v)+' / 300';
    // optional floor image: if future 301 frames exist, use them; otherwise keep active face.
    const floor=''+Math.round(v).toString().padStart(3,'0');
    const img=$('fairy-img');
    if(img && state.mode!=='heart') img.dataset.warpFloor=floor;
    applyCore();
  }
  function bindWarp(){ const input=$('warp-input-val'); if(input){ input.min='0'; input.max='300'; input.step='1'; input.value=String(Math.min(300, Number(input.value||0)*3)); ['input','change'].forEach(ev=>input.addEventListener(ev,applyWarp,{passive:true})); } applyWarp(); }
  function ensurePanel(id,title,body){
    let p=$(id); if(!p){ p=document.createElement('section'); p.id=id; p.className='kgen-v10423-panel'; document.body.appendChild(p); }
    p.innerHTML='<div class="kgen-v10423-head"><span>'+title+'</span><button type="button" data-close="'+id+'">收合</button></div>'+body;
    p.querySelector('[data-close]').onclick=()=>p.classList.remove('open'); return p;
  }
  function togglePanel(id){ qsa('.kgen-v10423-panel').forEach(p=>{if(p.id!==id)p.classList.remove('open')}); const p=$(id); if(p) p.classList.toggle('open'); }
  function buildPanels(){
    ensurePanel('kgen-v10423-heart-panel','悟空心臟｜發財金 / 點燈 / 還願','<div class="kgen-v10423-grid"><div class="kgen-v10423-card">流程：連接錢包 → 切換 BSC → Approve → 三聖盃 → fortuneClaim。</div><div class="kgen-v10423-card">功能：發財金、heartbeatClaim、igniteAndClaim、lightLamp、vowTo 還願。</div><div class="kgen-v10423-card">狀態：Heart 血庫 / Allowance / KGEN 餘額沿用鏈上讀值。</div><div class="kgen-v10423-card">提醒：本面板為原型機控制台，不修改合約規則。</div></div>');
    ensurePanel('kgen-v10423-right-panel','右側神規｜地址 / 地圖 / Gate / CT','<div class="kgen-v10423-grid"><div class="kgen-v10423-card">五指山 12345：悟空財神殿，主入口與發財金原型機。</div><div class="kgen-v10423-card">CT：宇宙生成界面；多方 +Z，空方 -Z。</div><div class="kgen-v10423-card">Warp：C0~C300 宇宙電梯樓層，warp-core 隨樓層移動。</div><div class="kgen-v10423-card">Gate：地圖通道、角色點位、後續可接東海龍宮 / 火焰山 / 牛魔王魔殿。</div></div>');
    ensurePanel('kgen-v10423-rules-panel','規則活動｜Festival / Heartbeat','<div class="kgen-v10423-grid"><div class="kgen-v10423-card">5/20 悟空生日、11/11 孤勇日、12/31 跨年倒數。</div><div class="kgen-v10423-card">Heartbeat 整點心跳；Ignite 跨日呼吸；Festival 節日活動。</div></div>');
  }
  function normalizeFooter(){
    const footer=document.querySelector('.footer-terminal'); if(!footer) return;
    let btns=qsa('button,.term-btn',footer); if(btns.length<8) return;
    btns=btns.slice(0,8);
    const labels=['📸<br><span>拍照</span>','🎥<br><span>錄影</span>','🐂<br><span>前鏡多方</span>','🐻<br><span>後鏡空方</span>','💚<br><span>悟空心臟</span>','🎬<br><span>螢幕錄影</span>','📜<br><span>規則活動</span>','🛡<br><span>右側神規</span>'];
    btns.forEach((b,i)=>{b.classList.add('term-btn'); b.innerHTML=labels[i]; b.onclick=null;});
    btns[0].addEventListener('click',()=>alert('拍照功能保留：可用手機截圖或後續接 canvas snapshot。'));
    btns[1].addEventListener('click',()=>alert('錄影功能保留：手機請用系統螢幕錄影，PC 可接 getDisplayMedia。'));
    btns[2].addEventListener('click',()=>{setTheta(0); state.mode='static'; applyCore();});
    btns[3].addEventListener('click',()=>{setTheta(180); state.mode='static'; applyCore();});
    btns[4].addEventListener('click',()=>togglePanel('kgen-v10423-heart-panel'));
    btns[5].addEventListener('click',()=>alert('螢幕錄影：若瀏覽器支援 getDisplayMedia，下一版接錄影核心；手機先用系統錄影。'));
    btns[6].addEventListener('click',()=>togglePanel('kgen-v10423-rules-panel'));
    btns[7].addEventListener('click',()=>togglePanel('kgen-v10423-right-panel'));
  }
  function layoutCleanup(){
    // Remove stray cyan guide lines near warp/right wheel caused by older pseudo/runtime layers.
    qsa('body *').forEach(el=>{
      const s=getComputedStyle(el); const r=el.getBoundingClientRect();
      if(r.height>180 && r.width<=3 && (s.backgroundColor.includes('0, 245')||s.borderLeftColor.includes('0, 245')||s.backgroundColor.includes('0, 255'))){ el.style.display='none'; }
    });
    cleanFloatingTags();
  }
  function init(){
    injectStyle(); setVersionText(); buildPanels(); normalizeFooter(); bindSlider(); bindWheel(); bindJoystick(); bindWarp(); layoutCleanup(); applyCore();
    setTimeout(()=>{normalizeFooter(); layoutCleanup(); applyWarp(); applyCore();},500);
    setInterval(()=>{cleanFloatingTags();},1500);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init); else init();
  window.addEventListener('load',init);
  window.KGEN_12345_V10423={VERSION,state,setTheta,applyCore,applyWarp};
})();
