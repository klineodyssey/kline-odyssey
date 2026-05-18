/*
 * KGEN 12345 UI Runtime
 * VERSION: V10.42.0_PROTO_STABILIZATION
 * PURPOSE:
 * - Restore bottom eight-button panel routing.
 * - Stabilize 2D Anti-Gravity prototype core.
 * - Static = bull/bear by theta phase; moving = heart.
 * - Warp core orb follows C0-C300 elevator thumb.
 * - No patch/hotfix/temp naming in runtime layer.
 */
(function(){
  'use strict';
  const VERSION = 'V10.42.0_PROTO_STABILIZATION';
  const ASSET = './assets/';
  const IMG = {
    bull: ASSET + 'bull-front.png',
    bear: ASSET + 'bear-rear.png',
    heart: ASSET + 'heart.png',
    warp: ASSET + 'warp-core.png'
  };
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  const norm180 = (deg)=>{ let d=Number(deg)||0; while(d>180)d-=360; while(d<-180)d+=360; return d; };
  const isBull = (deg)=>{ const d=norm180(deg); return d>=-90 && d<=90; };

  const state = {
    thetaY: 0,
    thetaZ: 0,
    warp: 0,
    moving: false,
    xy: {x:0,y:0},
    panels: {}
  };

  function log(msg){
    try{
      const toast = $('#toast');
      if(toast){ toast.textContent = msg; toast.classList && toast.classList.add('show'); setTimeout(()=>toast.classList&&toast.classList.remove('show'),1600); }
      console.log('[KGEN 12345 '+VERSION+'] '+msg);
    }catch(e){}
  }

  function injectStyle(){
    if($('#kgen-v10420-ui-runtime-style')) return;
    const style=document.createElement('style');
    style.id='kgen-v10420-ui-runtime-style';
    style.textContent=`
      :root{--kgen-gold:#ffd778;--kgen-cyan:#00f2ff;--kgen-panel:rgba(5,12,22,.88);}
      .footer-terminal{z-index:260!important;grid-template-columns:repeat(4,1fr)!important;padding:10px 12px!important;gap:8px!important;box-sizing:border-box!important;}
      .footer-terminal .term-btn{min-height:46px!important;padding:8px 4px!important;font-size:12px!important;line-height:1.18!important;border-radius:10px!important;}
      .footer-terminal .term-btn.kgen-panel-on{border-color:var(--kgen-gold)!important;box-shadow:0 0 16px rgba(255,215,120,.25), inset 0 0 14px rgba(255,215,120,.12)!important;color:var(--kgen-gold)!important;}
      .kgen-runtime-panel{position:fixed;z-index:245;display:none;box-sizing:border-box;max-height:42vh;overflow:auto;background:linear-gradient(180deg,rgba(10,18,30,.95),rgba(5,8,14,.92));border:1px solid rgba(255,215,120,.42);border-radius:16px;box-shadow:0 0 24px rgba(0,242,255,.18), inset 0 0 20px rgba(255,215,120,.08);backdrop-filter:blur(8px);color:#e9fbff;font-family:system-ui,'Noto Sans TC',sans-serif;}
      .kgen-runtime-panel.open{display:block;}
      .kgen-runtime-panel .rp-head{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid rgba(255,215,120,.22);font-weight:900;color:var(--kgen-gold);letter-spacing:.04em;}
      .kgen-runtime-panel .rp-close{background:rgba(255,255,255,.06);border:1px solid rgba(255,215,120,.35);color:var(--kgen-gold);border-radius:9px;padding:4px 8px;cursor:pointer;}
      .kgen-runtime-panel .rp-body{padding:10px 12px;font-size:12px;line-height:1.55;}
      .kgen-runtime-panel .rp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;}
      .kgen-runtime-panel .rp-action{border:1px solid rgba(0,242,255,.32);background:rgba(0,242,255,.07);color:#dffcff;border-radius:10px;padding:8px 6px;font-weight:800;cursor:pointer;}
      .kgen-runtime-panel .rp-action.gold{border-color:rgba(255,215,120,.45);background:rgba(255,215,120,.09);color:#ffe8a8;}
      #kgen-heart-panel{left:10px;bottom:82px;width:min(410px,calc(100vw - 20px));}
      #kgen-rules-panel{right:10px;bottom:82px;width:min(410px,calc(100vw - 20px));}
      #core-anchor{transition:transform .12s linear!important;will-change:transform!important;}
      #core-window{perspective:900px!important;transform-style:preserve-3d!important;overflow:visible!important;}
      #fairy-img,#kgen-core-sprite{transform-origin:50% 50%!important;will-change:transform,filter!important;transition:filter .18s ease, opacity .18s ease!important;object-fit:contain!important;}
      #fairy-img.kgen-heart,#kgen-core-sprite.kgen-heart{filter:drop-shadow(0 0 18px rgba(255,85,120,.95)) drop-shadow(0 0 30px rgba(255,215,120,.55))!important;}
      #fairy-img.kgen-bull,#kgen-core-sprite.kgen-bull{filter:drop-shadow(0 0 18px rgba(255,215,120,.82)) drop-shadow(0 0 26px rgba(0,242,255,.35))!important;}
      #fairy-img.kgen-bear,#kgen-core-sprite.kgen-bear{filter:drop-shadow(0 0 18px rgba(0,242,255,.85)) drop-shadow(0 0 26px rgba(155,90,255,.45))!important;}
      #kgen-warp-core-orb{position:absolute!important;left:50%!important;top:50%!important;width:44px!important;height:44px!important;transform:translate(-50%,-50%)!important;border-radius:50%!important;object-fit:cover!important;border:2px solid rgba(255,215,120,.9)!important;box-shadow:0 0 16px rgba(0,242,255,.95),0 0 24px rgba(255,215,120,.45)!important;z-index:55!important;pointer-events:none!important;}
      #warp-thumb{overflow:visible!important;}
      #v104-cup-compact,#v104-cup-panel,#v104-cup-result{max-width:min(360px,calc(100vw - 130px))!important;}
      .kgen-floating-tag,.floating-tag,.debug-tag,.module-tag{display:none!important;}
      @media(max-width:720px){
        .footer-terminal{grid-template-columns:repeat(4,1fr)!important;padding:7px!important;gap:5px!important;}
        .footer-terminal .term-btn{font-size:10px!important;min-height:40px!important;padding:6px 2px!important;}
        #kgen-heart-panel,#kgen-rules-panel{width:calc(100vw - 20px);left:10px!important;right:auto!important;bottom:72px;max-height:40vh;}
      }
    `;
    document.head.appendChild(style);
  }

  function ensurePanels(){
    if(!$('#kgen-heart-panel')){
      const p=document.createElement('section');
      p.id='kgen-heart-panel'; p.className='kgen-runtime-panel';
      p.innerHTML=`<div class="rp-head"><span>悟空心臟｜發財金儀式</span><button class="rp-close" data-close="heart">收合</button></div>
      <div class="rp-body">
        <div>順序：連錢包 → Approve → 三聖盃 → 發財金 / 心跳 / 呼吸 / 點燈 / 許願 / 還願。</div>
        <div class="rp-grid">
          <button class="rp-action gold" data-tab="wallet">連錢包</button>
          <button class="rp-action gold" data-tab="fortune">發財金</button>
          <button class="rp-action" data-tab="heartbeat">整點心跳</button>
          <button class="rp-action" data-tab="ignite">轉日呼吸</button>
          <button class="rp-action" data-tab="wish">許願</button>
          <button class="rp-action" data-tab="vow">還願</button>
          <button class="rp-action" data-tab="lamp">點燈</button>
          <button class="rp-action" data-tab="cup">三聖盃</button>
        </div>
      </div>`;
      document.body.appendChild(p);
    }
    if(!$('#kgen-rules-panel')){
      const p=document.createElement('section');
      p.id='kgen-rules-panel'; p.className='kgen-runtime-panel';
      p.innerHTML=`<div class="rp-head"><span>右側神規｜宇宙地圖資料</span><button class="rp-close" data-close="rules">收合</button></div>
      <div class="rp-body">
        <div><b>12345 五指山</b>：悟空財神殿原型機。</div>
        <div><b>CT Boundary</b>：宇宙生成界面，不是單純價格。</div>
        <div><b>Warp</b>：C0~C300 宇宙樓層選擇器。</div>
        <div><b>Gate</b>：5.11111 × 10^k 宇宙通道。</div>
        <hr style="border-color:rgba(255,215,120,.18)">
        <div style="word-break:break-all;font-size:11px;opacity:.9">KGEN：0xBA3d3810e58735cb6813bC1CDc5458C0d71432Be</div>
        <div style="word-break:break-all;font-size:11px;opacity:.9">Bank：0xfc522243e988a837700CaD600D6f030f5932681F</div>
      </div>`;
      document.body.appendChild(p);
    }
    document.addEventListener('click', function(e){
      const c=e.target.closest && e.target.closest('[data-close]');
      if(c){ togglePanel(c.dataset.close, false); }
      const a=e.target.closest && e.target.closest('[data-tab]');
      if(a){ openTab(a.dataset.tab); }
    }, true);
  }

  function togglePanel(which, force){
    const id = which==='rules' ? 'kgen-rules-panel' : 'kgen-heart-panel';
    const panel = $('#'+id); if(!panel) return;
    const open = force===undefined ? !panel.classList.contains('open') : !!force;
    panel.classList.toggle('open', open);
    $$('.footer-terminal .term-btn').forEach(b=>{
      const role=b.dataset.kgenRole;
      if((which==='heart' && role==='heart') || (which==='rules' && role==='rules')) b.classList.toggle('kgen-panel-on', open);
    });
    log((which==='rules'?'右側神規':'悟空心臟') + (open?'已展開':'已收合'));
  }

  function openTab(tab){
    try{
      if(tab==='wallet'){
        const f = window.smartConnect || (window.app&&window.app.connect) || window.connectWallet;
        if(typeof f==='function') return f.call(window.app||window);
      }
      if(window.templeSingleModal && typeof window.templeSingleModal.openTab==='function') return window.templeSingleModal.openTab(tab);
      if(window.templeOps && typeof window.templeOps[tab]==='function') return window.templeOps[tab]();
      log('開啟功能：'+tab);
    }catch(e){ log('功能入口已保留：'+tab); }
  }

  function bindFooter(){
    const ft=$('.footer-terminal'); if(!ft) return;
    const specs=[
      ['photo','📸','拍照',()=>{ try{ window.app&&app.capture&&app.capture(); }catch(e){} }],
      ['record','🎥','錄影',()=>{ try{ window.app&&app.toggleRec&&app.toggleRec(); }catch(e){} }],
      ['front','🤳','前鏡',()=>{ try{ window.app&&app.cam&&app.cam('user'); }catch(e){} }],
      ['back','🌌','後鏡',()=>{ try{ window.app&&app.cam&&app.cam('environment'); }catch(e){} }],
      ['heart','🫀','悟空心臟',()=>togglePanel('heart')],
      ['dual','🎬','雙鏡錄影',()=>{ try{ window.app&&app.toggleRec&&app.toggleRec(); }catch(e){ log('雙鏡錄影入口已保留'); } }],
      ['festival','🎋','規則活動',()=>{ togglePanel('heart',true); openTab('festival'); }],
      ['rules','🧭','右側神規',()=>togglePanel('rules')]
    ];
    ft.innerHTML='';
    specs.forEach(([role,icon,label,fn])=>{
      const b=document.createElement('button');
      b.type='button'; b.className='term-btn'+(role==='record'?' btn-rec':'')+(role==='heart'?' active-kgen':'');
      b.dataset.kgenRole=role;
      b.innerHTML=icon+'<br>'+label;
      b.addEventListener('click', function(ev){ev.preventDefault(); ev.stopPropagation(); fn();}, true);
      ft.appendChild(b);
    });
  }

  function coreImg(){
    const img = $('#kgen-core-sprite') || $('#fairy-img') || $('#core-window img') || $('#core-anchor img');
    if(img){ img.id = img.id || 'kgen-core-sprite'; img.crossOrigin='anonymous'; }
    return img;
  }
  function setCoreMode(mode){
    const img=coreImg(); if(!img) return;
    img.classList.remove('kgen-bull','kgen-bear','kgen-heart');
    if(mode==='heart') { img.src=IMG.heart; img.classList.add('kgen-heart'); }
    else if(mode==='bear') { img.src=IMG.bear; img.classList.add('kgen-bear'); }
    else { img.src=IMG.bull; img.classList.add('kgen-bull'); }
  }
  function applyCore(){
    const anchor=$('#core-anchor') || $('#core-window');
    const img=coreImg();
    const mode = state.moving ? 'heart' : (isBull(state.thetaY) ? 'bull' : 'bear');
    setCoreMode(mode);
    if(anchor){ anchor.style.transform = `translate3d(${state.xy.x}px, ${state.xy.y}px, 0)`; }
    if(img){
      img.style.transform = `rotateZ(${state.thetaZ}deg) rotateY(${state.thetaY}deg)`;
      img.dataset.kgenMode=mode;
      img.dataset.thetaY=String(state.thetaY);
      img.dataset.thetaZ=String(state.thetaZ);
    }
    const dir=$('#kc-dir'); if(dir) dir.textContent = `方向盤 → ${isBull(state.thetaY)?'多方K':'空方K'}｜θY ${Math.round(state.thetaY)}°`;
  }

  function bindDirection(){
    const candidates = $$('.steer-slider, input[type="range"], #direction-slider, #angle-slider').filter(el=>{
      const txt=(el.id+' '+el.className+' '+(el.getAttribute('aria-label')||'')).toLowerCase();
      return txt.includes('steer') || txt.includes('direction') || txt.includes('angle') || el.classList.contains('steer-slider');
    });
    const slider = candidates[0] || $('.steer-slider');
    if(slider){
      slider.min = slider.min || -180; slider.max = slider.max || 180;
      const upd=()=>{ const v=norm180(slider.value||0); state.thetaY=v; state.thetaZ=v; applyCore(); };
      slider.addEventListener('input', upd, true); slider.addEventListener('change', upd, true); upd();
    }
    $$('.wheel,.direction-wheel,#directionWheel,#dirWheel').forEach(w=>{
      let active=false;
      const move=(ev)=>{
        if(!active) return;
        const r=w.getBoundingClientRect();
        const x=(ev.clientX||0)-r.left-r.width/2, y=(ev.clientY||0)-r.top-r.height/2;
        const deg=norm180(Math.atan2(y,x)*180/Math.PI+90);
        state.thetaY=deg; state.thetaZ=deg; w.style.transform=`rotate(${deg}deg)`; applyCore();
      };
      w.addEventListener('pointerdown', ev=>{active=true; w.setPointerCapture&&w.setPointerCapture(ev.pointerId); move(ev);}, true);
      w.addEventListener('pointermove', move, true);
      w.addEventListener('pointerup', ()=>{active=false;}, true);
      w.addEventListener('pointercancel', ()=>{active=false;}, true);
    });
  }

  function bindJoystick(){
    const wrap=$('#move-joystick-wrap'); if(!wrap) return;
    const knob=$('#move-joystick-knob') || $('.joystick-knob', wrap);
    let active=false;
    function setFrom(ev){
      const r=wrap.getBoundingClientRect();
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      const dx=clamp((ev.clientX||cx)-cx, -42, 42), dy=clamp((ev.clientY||cy)-cy, -42, 42);
      state.xy.x=dx*1.35; state.xy.y=dy*1.35; state.moving=true;
      if(knob){ knob.style.transform=`translate(${dx}px, ${dy}px)`; }
      applyCore();
    }
    function reset(){
      active=false; state.xy.x=0; state.xy.y=0; state.moving=false;
      if(knob){ knob.style.transform='translate(0,0)'; }
      applyCore();
    }
    wrap.addEventListener('pointerdown', ev=>{active=true; wrap.setPointerCapture&&wrap.setPointerCapture(ev.pointerId); setFrom(ev);}, true);
    wrap.addEventListener('pointermove', ev=>{ if(active) setFrom(ev); }, true);
    wrap.addEventListener('pointerup', reset, true);
    wrap.addEventListener('pointercancel', reset, true);
  }

  function bindWarp(){
    const range=$('.warp-range') || $('#warp-range') || $('.warp-engine input[type="range"]');
    const thumb=$('#warp-thumb') || $('.warp-thumb');
    if(thumb && !$('#kgen-warp-core-orb')){
      const orb=document.createElement('img'); orb.id='kgen-warp-core-orb'; orb.src=IMG.warp; orb.alt='warp-core'; orb.crossOrigin='anonymous'; thumb.appendChild(orb);
    }
    function setWarp(v){
      state.warp=clamp(Number(v)||0,0,300);
      const pct=state.warp/300;
      if(thumb) thumb.style.bottom = `calc(${pct*100}% - 18px)`;
      const t=$('.warp-val-text') || $('#warp-val') || $('#warpValue');
      if(t) t.textContent = 'C' + Math.round(state.warp);
      const img=coreImg();
      if(img){ img.style.setProperty('--theta-x', (pct*32-6)+'deg'); }
    }
    if(range){
      range.min=0; range.max=300; range.step=1;
      range.addEventListener('input', ()=>setWarp(range.value), true);
      range.addEventListener('change', ()=>setWarp(range.value), true);
      setWarp(range.value||0);
    }else{ setWarp(state.warp); }
  }

  function fixHeaderAndCup(){
    const brand=$('.brand-block') || $('.brand-name') || $('#brand');
    if(brand && brand.closest){
      const box=brand.closest('.brand-block') || brand;
      box.style.marginTop='26px';
    }
    ['#v104-cup-compact','#v104-cup-panel','#v104-cup-result','#v714-cupbox'].forEach(sel=>{
      const el=$(sel); if(el){ el.style.zIndex='230'; el.style.maxWidth='360px'; }
    });
  }

  function boot(){
    injectStyle(); ensurePanels(); bindFooter(); bindDirection(); bindJoystick(); bindWarp(); fixHeaderAndCup(); applyCore();
    window.KGEN12345Runtime = Object.assign(window.KGEN12345Runtime||{}, {VERSION, state, applyCore, togglePanel, setCoreMode});
    log('V10.42.0 原型機穩定層已啟動');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot, {once:true}); else boot();
  setTimeout(boot, 900);
})();
