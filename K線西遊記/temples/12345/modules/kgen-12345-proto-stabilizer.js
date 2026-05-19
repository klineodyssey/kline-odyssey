
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
