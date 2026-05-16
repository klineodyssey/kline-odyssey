// KGEN 12345 V10.36 World Axis Runtime
// 定義：左下 XY = 真實世界 1:1 座標；Z = 多空下單軸；右下 WARP = 超光速宇宙電梯/蟲洞樓層。
// XY 不回寫 WARP；WARP 不污染 XY；多空前後鏡只在下單多空時啟動。
(function(){
  'use strict';
  const VERSION='V10.36.0';
  const ASSETS={bull:'./assets/bull-front.png',bear:'./assets/bear-rear.png',heart:'./assets/heart.png',warp:'./assets/warp-core.png'};
  const $=id=>document.getElementById(id); const qs=s=>document.querySelector(s); const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  const state={x:0,y:0,warp:20,warpY:0,z:'idle',activeUntil:0};
  function ensureStyle(){
    if($('kgen-12345-world-axis-style'))return;
    const st=document.createElement('style'); st.id='kgen-12345-world-axis-style';
    st.textContent=`
      :root{--kgen-world-x:0px;--kgen-world-y:0px;--kgen-warp-floor-y:0px;--kgen-world-render-y:0px;--kgen-warp-core-bottom:10%;}
      #core-anchor,#core-anchor.v72-character{
        transform:translate(calc(-50% + var(--kgen-world-x)), calc(-50% + var(--kgen-world-y) + var(--kgen-warp-floor-y)))!important;
        will-change:transform!important;
      }
      #kgen-12345-world-axis-badge{position:fixed;left:18px;bottom:252px;z-index:100530;padding:6px 9px;border:1px solid rgba(255,215,120,.38);border-radius:10px;background:rgba(0,0,0,.55);color:#9ff;font-size:11px;font-weight:900;pointer-events:none;}
      #kgen-12345-warp-scale .warp-tick{font-size:10px!important;}
    `; document.head.appendChild(st);
  }
  function pct(w){w=clamp(w,0,300); return 6+(w/300)*88;}
  function warpToY(w){w=clamp(w,0,300); if(w<=20)return Math.round(((20-w)/20)*80); return Math.round(-((w-20)/(300-20))*260);}
  function apply(){
    const root=document.documentElement; state.warpY=warpToY(state.warp);
    root.style.setProperty('--kgen-world-x',Math.round(state.x)+'px');
    root.style.setProperty('--kgen-world-y',Math.round(state.y)+'px');
    root.style.setProperty('--kgen-warp-floor-y',Math.round(state.warpY)+'px');
    root.style.setProperty('--kgen-warp-core-bottom',pct(state.warp)+'%');
    const badge=$('kgen-12345-world-axis-badge'); if(badge) badge.textContent='XY 真實時空｜Z '+(state.z==='long'?'多方前鏡':state.z==='short'?'空方後鏡':'待下單')+'｜WARP '+Math.round(state.warp)+'x';
  }
  function setTexture(active){const img=$('fairy-img'); if(!img)return; const src=active?ASSETS.heart:(state.z==='short'?ASSETS.bear:ASSETS.bull); if(img.getAttribute('src')!==src)img.setAttribute('src',src)}
  function mark(ms){state.activeUntil=Date.now()+(ms||700); setTexture(true); setTimeout(()=>{if(Date.now()>=state.activeUntil)setTexture(false)},ms||700)}
  function setWarpVisual(w,updateInput){state.warp=clamp(w,0,300); const raw=state.warp/3; const input=$('warp-input-val'); if(input&&updateInput!==false)input.value=String(raw); const fill=$('energy-fill'); if(fill)fill.style.height=raw+'%'; const th=$('warp-thumb'); if(th){th.style.bottom='calc('+raw+'% - 17px)'; th.style.boxShadow='none'; th.style.filter='none'} const txt=$('warp-txt'); if(txt)txt.textContent='WARP '+Math.round(state.warp)+'x'; const wc=$('kgen-12345-warp-core-layer'); if(wc){wc.style.bottom=pct(state.warp)+'%';wc.style.boxShadow='none';wc.style.filter='none'} apply();}
  function ensureWarpCore(){const host=$('warp-rail-body')||qs('.warp-engine'); if(!host)return; let img=$('kgen-12345-warp-core-layer'); if(!img){img=document.createElement('img'); img.id='kgen-12345-warp-core-layer'; img.src=ASSETS.warp; img.alt='KGEN Warp Core'; host.appendChild(img)} let sc=$('kgen-12345-warp-scale'); if(!sc){sc=document.createElement('div'); sc.id='kgen-12345-warp-scale'; [0,20,50,100,150,200,250,300].forEach(v=>{const d=document.createElement('div'); d.className='warp-tick '+((v===0||v===20||v===300)?'major':''); d.style.bottom=pct(v)+'%'; d.textContent=v+'x'; sc.appendChild(d)}); host.appendChild(sc)}}
  function bindMove(){const wrap=$('move-joystick-wrap'); if(!wrap)return; let active=false,pid=null; function setFrom(e){const r=wrap.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2; let dx=e.clientX-cx,dy=e.clientY-cy; const max=Math.max(42,Math.min(r.width,r.height)*0.45); const len=Math.hypot(dx,dy)||1; if(len>max){dx=dx/len*max;dy=dy/len*max} state.x=Math.round(dx*2.15); state.y=Math.round(dy*2.15); mark(850); apply();}
    function stop(){active=false;pid=null; state.x=0; state.y=0; apply(); setTimeout(()=>setTexture(false),240)}
    wrap.addEventListener('pointerdown',e=>{active=true;pid=e.pointerId;try{wrap.setPointerCapture(pid)}catch(_){} setFrom(e);},{passive:false,capture:true});
    wrap.addEventListener('pointermove',e=>{if(active&&(pid===null||e.pointerId===pid))setFrom(e);},{passive:false,capture:true});
    ['pointerup','pointercancel','lostpointercapture'].forEach(ev=>wrap.addEventListener(ev,stop,{passive:true,capture:true}));
    document.querySelectorAll('#k12345-move-pad [data-kmove]').forEach(btn=>{btn.addEventListener('click',()=>{const p=(btn.getAttribute('data-kmove')||'0,0').split(',').map(Number); state.x+=(p[0]||0)*8; state.y+=(p[1]||0)*8; mark(650); apply();},true)});
    const home=$('k12345-move-home'); if(home)home.addEventListener('click',()=>{state.x=0;state.y=0;apply()},true);
  }
  function bindWarp(){const input=$('warp-input-val'); if(!input)return; function f(active){setWarpVisual((parseFloat(input.value||'0')||0)*3,false); if(active)mark(650)} input.addEventListener('input',()=>f(true),{passive:true,capture:true}); input.addEventListener('change',()=>f(true),{passive:true,capture:true}); f(false)}
  function activateMirror(side){state.z=side==='short'?'short':'long'; setTexture(false); const mode=state.z==='short'?'environment':'user'; try{ if(window.app&&typeof app.cam==='function') app.cam(mode); }catch(_){} apply();}
  function wrapOrders(){
    const tryWrap=()=>{ if(window.web3&&typeof web3.place==='function'&&!web3.place.__worldAxisWrapped){const old=web3.place.bind(web3); web3.place=function(side){activateMirror(Number(side)===1?'short':'long'); return old(side)}; web3.place.__worldAxisWrapped=true;} if(window.templeOps&&!window.templeOps.__worldAxisWrapped){['long','buy','up'].forEach(k=>{if(typeof templeOps[k]==='function'){const old=templeOps[k].bind(templeOps); templeOps[k]=function(){activateMirror('long');return old.apply(this,arguments)}}}); ['short','sell','down'].forEach(k=>{if(typeof templeOps[k]==='function'){const old=templeOps[k].bind(templeOps); templeOps[k]=function(){activateMirror('short');return old.apply(this,arguments)}}}); window.templeOps.__worldAxisWrapped=true;} };
    tryWrap(); setInterval(tryWrap,1500);
    document.addEventListener('click',e=>{const b=e.target&&e.target.closest&&e.target.closest('button'); if(!b)return; const t=(b.textContent||'').toLowerCase(); if(/下單|order|buy|up|多/.test(t)&&!/空|down|sell/.test(t)) activateMirror('long'); if(/空|down|sell/.test(t)) activateMirror('short');},true);
  }
  function boot(){ensureStyle(); ensureWarpCore(); if(!$('kgen-12345-world-axis-badge')){const d=document.createElement('div'); d.id='kgen-12345-world-axis-badge'; document.body.appendChild(d)} bindMove(); bindWarp(); wrapOrders(); setWarpVisual(20,true); setTexture(false); apply(); console.log('[KGEN_WORLD_AXIS '+VERSION+'] online')}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot); else boot(); window.addEventListener('load',apply);
  window.KGEN12345_WORLD_AXIS={version:VERSION,state,setWarpVisual,activateMirror,apply};
})();
