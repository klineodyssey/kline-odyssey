/*
KGEN 12345｜2D Anti-Gravity Decoration Engine
VERSION: V10.41.5_2D_ANTIGRAVITY_DECORATION
Purpose:
- Keep 12345 as an opening-ready temple, not a battle map.
- Build a stable 2D prototype of the Anti-Gravity Core before the next 3D Core Sphere line.
- XY joystick moves the whole core on Reality Plane.
- Bottom direction slider / wheel controls rotateZ on XY plane.
- Bull/Bear/Heart are visual states on the same core, not separate UI fragments.
- Warp-core is the elevator cabin, following the warp thumb.
*/
(function(){
  'use strict';
  const VERSION = 'V10.41.5_2D_ANTIGRAVITY_DECORATION';
  const ASSET = {
    bull: './assets/bull-front.png',
    bear: './assets/bear-rear.png',
    heart: './assets/heart.png',
    warp: './assets/warp-core.png'
  };
  const $ = (id)=>document.getElementById(id);
  const qsa = (s)=>Array.from(document.querySelectorAll(s));
  const root = document.documentElement;
  const state = { x:0, y:0, z:0, mode:'heart', moving:false, installed:false };

  function css(){
    if($('kgen-12345-2d-antigravity-style')) return;
    const st=document.createElement('style');
    st.id='kgen-12345-2d-antigravity-style';
    st.textContent = `
:root{
  --ag2d-x:0px;
  --ag2d-y:0px;
  --ag2d-z:0deg;
  --ag2d-glow:rgba(255,215,120,.34);
}
/* Header: leave version visible; temple sign moves down without touching bottom controls. */
.hud-top{top:42px!important;z-index:320!important;width:94%!important;left:3%!important;}
#brand-badge{top:22px!important;left:18px!important;z-index:340!important;}
#ver-st{display:block!important;visibility:visible!important;color:#8ff8ff!important;text-shadow:0 0 10px rgba(0,242,255,.55)!important;}

/* 2D Anti-Gravity Core: one visual engine, not broken flat images. */
#core-anchor{
  position:fixed!important;
  left:50%!important;
  top:52%!important;
  width:min(420px,62vw)!important;
  height:min(420px,62vw)!important;
  z-index:84!important;
  transform:translate(-50%,-50%) translate3d(var(--ag2d-x),var(--ag2d-y),0)!important;
  will-change:transform;
  pointer-events:none;
}
#core-window{
  position:relative!important;
  width:100%!important;
  height:100%!important;
  border-radius:50%!important;
  overflow:hidden!important;
  transform:rotateZ(var(--ag2d-z))!important;
  transform-origin:50% 50%!important;
  animation:none!important;
  background:
    radial-gradient(circle at 36% 28%, rgba(255,255,255,.95) 0%, rgba(255,235,160,.45) 13%, transparent 30%),
    radial-gradient(circle at 50% 52%, rgba(255,215,120,.23), rgba(0,0,0,.62) 72%),
    #05070b!important;
  border:12px double rgba(255,215,120,.88)!important;
  box-shadow:0 0 52px rgba(255,215,120,.32),0 0 92px rgba(0,242,255,.10),inset 0 0 52px rgba(0,0,0,.54)!important;
  pointer-events:auto;
}
#core-window::before{
  content:"";
  position:absolute;inset:0;border-radius:50%;z-index:5;pointer-events:none;
  background:
    radial-gradient(circle at 34% 24%, rgba(255,255,255,.45), transparent 17%),
    linear-gradient(120deg, rgba(255,255,255,.18), transparent 32%, rgba(0,0,0,.22) 70%);
  mix-blend-mode:screen;
}
#core-window::after{
  content:"XY / XZ / YZ";
  position:absolute;left:50%;bottom:14px;transform:translateX(-50%);z-index:9;
  padding:5px 10px;border-radius:999px;
  font-family:Orbitron,'Noto Sans TC',sans-serif;font-size:10px;font-weight:900;letter-spacing:.08em;
  color:#ffe8a9;background:rgba(0,0,0,.46);border:1px solid rgba(255,215,120,.28);
  text-shadow:0 0 12px rgba(255,215,120,.35);
}
#fairy-img{
  position:absolute!important;inset:0!important;width:100%!important;height:100%!important;
  object-fit:cover!important;object-position:center!important;display:block!important;visibility:visible!important;opacity:1!important;
  border-radius:50%!important;z-index:2!important;animation:none!important;transform:none!important;
  filter:saturate(1.08) contrast(1.04) drop-shadow(0 0 18px var(--ag2d-glow));
  transition:opacity .22s ease, filter .22s ease;
}
#cam-view,#mini-thumb{z-index:7!important;}
#wish-label{
  z-index:10!important;left:50%!important;bottom:44px!important;transform:translateX(-50%)!important;
  width:max-content;max-width:82%;text-align:center;font-size:16px!important;line-height:1.25!important;
  padding:6px 12px;border-radius:999px;background:rgba(0,0,0,.42);border:1px solid rgba(255,215,120,.25);
  text-shadow:0 0 14px #000,0 0 18px rgba(255,215,120,.36)!important;
}

/* Keep K-line HUD alive above the temple core. */
#kline-engine-panel,#kline-chart-panel{display:block!important;visibility:visible!important;opacity:1!important;z-index:130!important;}
#kline-chart-panel{top:326px!important;}
#kline-engine-panel{top:326px!important;}

/* Warp: do not move the rail. Only make the cabin follow the thumb and keep label single line. */
.warp-engine{right:8px!important;bottom:260px!important;top:auto!important;left:auto!important;transform:none!important;z-index:190!important;}
.warp-val-text{font-size:12px!important;white-space:nowrap!important;line-height:1.1!important;margin-top:18px!important;letter-spacing:.03em!important;}
#warp-thumb{overflow:visible!important;display:flex!important;align-items:center!important;justify-content:center!important;}
#kgen-ag2d-warp-core{
  width:58px;height:58px;border-radius:50%;object-fit:cover;display:block;pointer-events:none;
  filter:drop-shadow(0 0 16px rgba(255,215,120,.64)) drop-shadow(0 0 22px rgba(0,242,255,.22));
  transform:translateY(-2px);
}

/* Holy cup: safe lane between core and bottom direction bar; not tied to global collapse. */
#kgen-holy-cup-panel,.kgen-holy-cup-panel,#holy-cup-check,.holy-cup-check,#cup-check-panel,.cup-check-panel,#cup-system,.cup-system{
  position:fixed!important;left:50%!important;right:auto!important;bottom:164px!important;transform:translateX(-50%)!important;
  width:min(336px,64vw)!important;max-height:132px!important;overflow:auto!important;
  z-index:205!important;font-size:11px!important;line-height:1.35!important;
  border:1px solid rgba(255,215,120,.42)!important;border-radius:14px!important;
  background:rgba(5,8,14,.78)!important;backdrop-filter:blur(8px)!important;
  box-shadow:0 0 22px rgba(255,215,120,.12)!important;
}
#kgen-holy-cup-tab-v10402,#kgen-holycup-tab,#kgen-holy-cup-tab{
  position:fixed!important;left:auto!important;right:14px!important;top:296px!important;bottom:auto!important;transform:none!important;
  z-index:230!important;width:112px!important;text-align:center!important;white-space:nowrap!important;
  padding:6px 9px!important;font-size:11px!important;border-radius:999px!important;
}

/* Small floating labels: if they are just labels, collect them to the upper-right lane. */
.kgen-floating-tag,.kgen-mini-tag,.runtime-tag,.axis-tag{
  max-width:128px!important;min-height:0!important;font-size:10px!important;line-height:1.15!important;
  opacity:.86!important;overflow:hidden!important;text-overflow:ellipsis!important;
}

/* Panel windows restored but compact; bottom eight keys remain untouched. */
.kgen-left-heart-panel{left:12px!important;bottom:154px!important;width:min(300px,calc(100vw - 116px))!important;max-height:220px!important;z-index:214!important;}
.kgen-right-rule-panel{right:78px!important;bottom:154px!important;width:min(292px,calc(100vw - 116px))!important;max-height:220px!important;z-index:214!important;}
.kgen-v10402-panel{font-size:12px!important;}

/* Existing debug/module words should never be visible in the temple. */
[data-debug],.debug,.dev-only,.module-label,.modules-label{display:none!important;}

@media(max-width:720px){
  .hud-top{top:48px!important;}
  #brand-badge{top:22px!important;left:12px!important;font-size:11px!important;}
  #core-anchor{top:52%!important;width:min(330px,76vw)!important;height:min(330px,76vw)!important;}
  #kline-engine-panel,#kline-chart-panel{top:338px!important;max-height:160px!important;}
  #kgen-holy-cup-panel,.kgen-holy-cup-panel,#holy-cup-check,.holy-cup-check,#cup-check-panel,.cup-check-panel,#cup-system,.cup-system{bottom:148px!important;width:min(286px,58vw)!important;max-height:112px!important;}
  #kgen-holy-cup-tab-v10402,#kgen-holycup-tab,#kgen-holy-cup-tab{right:10px!important;top:332px!important;width:94px!important;font-size:10px!important;}
  .warp-val-text{font-size:11px!important;}
  #kgen-ag2d-warp-core{width:50px;height:50px;}
}
`;
    document.head.appendChild(st);
  }

  function angle(){
    const s=$('steer-input-val');
    let a=s?Number(s.value):state.z;
    if(!Number.isFinite(a)) a=0;
    a=Math.max(-180,Math.min(180,Math.round(a)));
    return a;
  }
  function side(a){ return (a>=-90 && a<=90) ? 'bull' : 'bear'; }
  function imgFor(){
    if(state.mode==='heart') return ASSET.heart;
    return side(angle())==='bull' ? ASSET.bull : ASSET.bear;
  }
  function setImage(){
    const img=$('fairy-img'); if(!img) return;
    const src=imgFor();
    if((img.getAttribute('src')||'')!==src) img.setAttribute('src',src);
    img.onerror=function(){
      this.onerror=null;
      if((this.getAttribute('src')||'')!==ASSET.heart) this.setAttribute('src',ASSET.heart);
    };
    img.style.display='block'; img.style.visibility='visible'; img.style.opacity='1';
  }
  function setMode(next){
    state.mode=next;
    if(next==='heart') root.style.setProperty('--ag2d-glow','rgba(255,92,120,.46)');
    else if(side(angle())==='bull') root.style.setProperty('--ag2d-glow','rgba(255,215,120,.42)');
    else root.style.setProperty('--ag2d-glow','rgba(0,242,255,.42)');
    setImage();
  }
  function label(){
    const a=angle();
    const l=$('wish-label');
    if(!l) return;
    if(state.mode==='heart') l.textContent='悟空心臟｜發財金儀式運行';
    else l.textContent = side(a)==='bull' ? 'XY 方向｜多方前鏡' : 'XY 方向｜空方後鏡';
  }
  function render(){
    root.style.setProperty('--ag2d-x', state.x+'px');
    root.style.setProperty('--ag2d-y', state.y+'px');
    root.style.setProperty('--ag2d-z', angle()+'deg');
    const core=$('core-window');
    if(core) core.style.setProperty('transform','rotateZ('+angle()+'deg)','important');
    const a=$('ang-val'); if(a) a.textContent=angle()+'°';
    const k=$('ke-angle'); if(k) k.textContent=angle();
    const ks=$('ke-side'); if(ks) ks.textContent=side(angle())==='bull'?'多':'空';
    label(); setImage();
  }

  function bindSteer(){
    const s=$('steer-input-val');
    if(s && !s.dataset.ag2dBound){
      s.dataset.ag2dBound='1';
      ['input','change'].forEach(ev=>s.addEventListener(ev,()=>{ if(!state.moving) setMode('phase'); render(); },{passive:true}));
    }
    const wheel=$('wheel');
    if(wheel && !wheel.dataset.ag2dBound){
      wheel.dataset.ag2dBound='1';
      ['pointerup','mouseup','touchend'].forEach(ev=>wheel.addEventListener(ev,()=>{ if(!state.moving) setMode('phase'); setTimeout(render,20); },{passive:true}));
    }
  }

  function bindJoystick(){
    const wrap=$('move-joystick-wrap');
    const knob=$('move-joystick-knob');
    if(!wrap || !knob || wrap.dataset.ag2dBound) return;
    wrap.dataset.ag2dBound='1';
    let active=false;
    function apply(clientX,clientY){
      const r=wrap.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      let dx=clientX-cx, dy=clientY-cy;
      const max=42;
      const dist=Math.hypot(dx,dy)||1;
      if(dist>max){dx=dx/dist*max;dy=dy/dist*max;}
      knob.style.left=(40+dx)+'px'; knob.style.top=(40+dy)+'px';
      state.x=Math.round(dx*1.8); state.y=Math.round(dy*1.8);
      state.moving=true; setMode('heart'); render();
    }
    function end(){
      if(!active) return;
      active=false; state.moving=false;
      knob.style.left='40px'; knob.style.top='40px';
      state.x=0; state.y=0;
      setTimeout(()=>{ if(!state.moving) setMode('phase'); render(); },260);
      render();
    }
    wrap.addEventListener('pointerdown',e=>{active=true;wrap.setPointerCapture&&wrap.setPointerCapture(e.pointerId);apply(e.clientX,e.clientY);e.preventDefault();},{passive:false});
    wrap.addEventListener('pointermove',e=>{if(active){apply(e.clientX,e.clientY);e.preventDefault();}},{passive:false});
    wrap.addEventListener('pointerup',end,{passive:true});
    wrap.addEventListener('pointercancel',end,{passive:true});
  }

  function warp(){
    const thumb=$('warp-thumb');
    if(thumb && !$('kgen-ag2d-warp-core')){
      const img=document.createElement('img');
      img.id='kgen-ag2d-warp-core';
      img.src=ASSET.warp;
      img.alt='warp-core';
      img.onerror=function(){ this.style.display='none'; };
      thumb.appendChild(img);
    }
    const input=$('warp-input-val'); const txt=$('warp-txt');
    const update=()=>{
      const v=input?Number(input.value||0):33;
      if(txt) txt.textContent='WARP '+String(Math.round(v*3)).padStart(3,'0');
    };
    if(input && !input.dataset.ag2dBound){input.dataset.ag2dBound='1';input.addEventListener('input',update,{passive:true});input.addEventListener('change',update,{passive:true});}
    update();
  }

  function createPanel(id,title,html,cls){
    let p=$(id);
    if(!p){
      p=document.createElement('div');p.id=id;p.className='kgen-v10402-panel '+cls;
      p.innerHTML='<b>'+title+'</b><button type="button" data-close="1" style="float:right">收合</button><div>'+html+'</div>';
      document.body.appendChild(p);
      p.querySelector('[data-close]').onclick=()=>{p.style.display='none';};
    }
    return p;
  }
  function panels(){
    const left=createPanel('kgen-left-heart-panel','左下｜悟空心臟','發財金、許願、還願、點燈、心跳與呼吸入口。','kgen-left-heart-panel');
    const right=createPanel('kgen-right-rule-panel','右下｜右側神規','TempleHeart / Brain 規則、冷卻、金額與血庫對齊。','kgen-right-rule-panel');
    if(!left.dataset.ag2dInit){left.dataset.ag2dInit='1';left.style.display='none';}
    if(!right.dataset.ag2dInit){right.dataset.ag2dInit='1';right.style.display='none';}
    qsa('button,.term-btn').forEach(b=>{
      const t=(b.textContent||'').trim();
      if(!b.dataset.ag2dHeart && /悟空心臟|心臟|發財金|許願|還願|點燈|心跳|呼吸/.test(t)){
        b.dataset.ag2dHeart='1';
        b.addEventListener('click',()=>{ left.style.display=(left.style.display==='none'||!left.style.display)?'block':'none'; },true);
      }
      if(!b.dataset.ag2dRule && /右側神規|神規|規則|Brain|TempleHeart/.test(t)){
        b.dataset.ag2dRule='1';
        b.addEventListener('click',()=>{ right.style.display=(right.style.display==='none'||!right.style.display)?'block':'none'; },true);
      }
    });
  }

  function clean(){
    try{
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      const kill=[];
      while(walker.nextNode()){
        const n=walker.currentNode; const t=(n.nodeValue||'').trim();
        if(t==='modules'||/wukong_heart_v10_4\.png|central mirror|broken image/i.test(t)) kill.push(n);
      }
      kill.forEach(n=>{n.nodeValue='';});
    }catch(_){ }
  }

  function version(){
    const ver=$('ver-st'); if(ver) ver.textContent='VERSION '+VERSION;
    document.title='KGEN 12345 五指山悟空財神殿｜'+VERSION;
  }

  function wrapOps(){
    const ops=window.templeOps||{};
    ['fortune','wish','vow','lamp','heartbeat','ignite','approve'].forEach(k=>{
      const old=ops[k];
      if(typeof old==='function' && !old.__ag2dWrapped){
        const fn=function(){ setMode('heart'); render(); setTimeout(()=>{setMode('phase');render();},1200); return old.apply(this,arguments); };
        fn.__ag2dWrapped=true; ops[k]=fn;
      }
    });
    window.templeOps=ops;
  }

  function boot(){
    css(); bindSteer(); bindJoystick(); warp(); panels(); clean(); version(); wrapOps();
    setMode('heart'); render();
    state.installed=true;
    window.KGEN_12345_2D_ANTIGRAVITY_ENGINE={VERSION,state,assets:ASSET,render,setMode,rule:'XY joystick moves core; bottom slider / wheel rotates Z axis; bull/bear are phase faces; heart is ritual face; warp-core follows the elevator thumb.'};
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',()=>{boot();setTimeout(boot,500);setTimeout(boot,1600);});
  setInterval(()=>{ if(state.installed){ warp(); bindJoystick(); bindSteer(); panels(); clean(); render(); } },1200);
})();
