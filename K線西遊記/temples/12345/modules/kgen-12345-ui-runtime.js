
/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-ui-runtime.js
VERSION: V10.41.2_TEMPLE_FRONT_REPAIR_OPENING_READY
BUILD: 20260518-V10.41.2-TEMPLE-FRONT-REPAIR-OPENING-READY
PURPOSE: 門面主圖、Warp core、基本儀式按鈕治理。戰鬥與 XYZ/C/T 變化暫不在開張門面啟用。
*/
(function(){
  'use strict';
  if(window.__KGEN_12345_UI_RUNTIME_V10412__) return;
  window.__KGEN_12345_UI_RUNTIME_V10412__=true;
  const VERSION='KGEN-12345-V10.41.2_TEMPLE_FRONT_REPAIR_OPENING_READY';
  const ASSET={bull:'./assets/bull-front.png', bear:'./assets/bear-rear.png', heart:'./assets/heart.png', warp:'./assets/warp-core.png'};
  const $=id=>document.getElementById(id);
  const state={visual:'bull', lastDirectional:'bull', moving:false};
  function setImage(mode, reason){
    mode = (mode==='bear'||mode==='heart'||mode==='warp') ? mode : 'bull';
    state.visual=mode;
    if(mode==='bull'||mode==='bear') state.lastDirectional=mode;
    const img=$('fairy-img'), core=$('core-window');
    if(img){
      const src=ASSET[mode] || ASSET.bull;
      if((img.getAttribute('src')||'')!==src) img.setAttribute('src',src);
      img.onerror=function(){ this.onerror=null; this.setAttribute('src', mode==='heart'?ASSET.bull:ASSET.heart); };
      img.alt='KGEN 12345 五指山悟空財神殿 '+mode;
    }
    if(core){
      core.classList.remove('kgen-front-bull','kgen-front-bear','kgen-front-heart','kgen-front-warp');
      core.classList.add('kgen-front-'+mode);
      core.style.setProperty('transform','none','important');
    }
    const wl=$('wish-label');
    if(wl){
      if(mode==='heart') wl.textContent='悟空心臟｜福緣循環中';
      else if(mode==='bear') wl.textContent='空方鏡像｜戰鬥模式未啟用';
      else wl.textContent='悟空鎮守五指山｜財神殿開張';
    }
    window.KGEN_12345_CURRENT_VISUAL={mode,reason:reason||'',asset:ASSET[mode]};
  }
  function angleToMode(){
    const s=$('steer-input-val');
    const a=s ? Number(s.value)||0 : 76;
    return (a>=-90 && a<=90) ? 'bull' : 'bear';
  }
  function bindSlider(){
    const s=$('steer-input-val');
    const out=$('ang-val');
    if(!s || s.dataset.openingVisualBound) return;
    s.dataset.openingVisualBound='1';
    const sync=()=>{
      const a=Number(s.value)||0;
      if(out) out.textContent=Math.round(a)+'°';
      if(!state.moving) setImage(angleToMode(),'angle');
      const core=$('core-window'); if(core) core.style.setProperty('transform','none','important');
    };
    s.addEventListener('input',sync,{passive:true});
    s.addEventListener('change',sync,{passive:true});
    sync();
  }
  function bindMoveHeart(){
    const joy=$('move-joystick-wrap') || $('move-joystick-knob');
    if(!joy || joy.dataset.openingHeartBound) return;
    joy.dataset.openingHeartBound='1';
    const on=()=>{ state.moving=true; setImage('heart','move'); };
    const off=()=>{ state.moving=false; setImage(angleToMode(),'move-release'); };
    ['pointerdown','touchstart','mousedown'].forEach(ev=>joy.addEventListener(ev,on,{passive:true}));
    ['pointerup','pointercancel','touchend','mouseup'].forEach(ev=>window.addEventListener(ev,off,{passive:true}));
  }
  function bindFooterActions(){
    document.querySelectorAll('.footer-terminal .term-btn').forEach(btn=>{
      if(btn.dataset.openingRuntimeBound) return;
      btn.dataset.openingRuntimeBound='1';
      btn.addEventListener('click',()=>{
        const t=(btn.textContent||'').trim();
        if(/空方/.test(t)) setImage('bear','button');
        else if(/多方/.test(t)) setImage('bull','button');
        else if(/心跳|呼吸|點燈|許願|還願|發財金|節日|連錢包/.test(t)) setImage('heart','ritual');
      },true);
    });
  }
  function ensureWarpCore(){
    const rail=$('warp-rail-body') || document.querySelector('.warp-rail');
    if(!rail) return;
    let img=$('kgen-warp-core-live');
    if(!img){
      img=document.createElement('img');
      img.id='kgen-warp-core-live';
      img.src=ASSET.warp;
      img.alt='warp-core';
      rail.appendChild(img);
    }
    img.onerror=function(){ this.style.display='none'; };
  }
  function syncWarpCore(){
    ensureWarpCore();
    const input=$('warp-input-val');
    const img=$('kgen-warp-core-live');
    const thumb=$('warp-thumb');
    const fill=$('energy-fill');
    if(!input || !img) return;
    const val=Math.max(0,Math.min(100,Number(input.value)||0));
    img.style.bottom='calc('+val+'% - 27px)';
    if(thumb) thumb.style.bottom='calc('+val+'% - 17px)';
    if(fill) fill.style.height=val+'%';
    const txt=$('warp-txt'); if(txt) txt.textContent='WARP '+Math.round(val*3)+'x';
  }
  function bindWarp(){
    const input=$('warp-input-val');
    if(input && !input.dataset.openingWarpBound){
      input.dataset.openingWarpBound='1';
      input.addEventListener('input',syncWarpCore,{passive:true});
      input.addEventListener('change',syncWarpCore,{passive:true});
    }
    const old=window.KGEN_SET_WARP_LEVEL;
    if(!window.__KGEN_12345_WARP_OVERRIDE_V10412__){
      window.__KGEN_12345_WARP_OVERRIDE_V10412__=true;
      window.KGEN_SET_WARP_LEVEL=function(level){
        try{ if(typeof old==='function') old(level); }catch(e){}
        const input=$('warp-input-val');
        if(input){ input.value=String(Math.max(0,Math.min(100,(Number(level)||0)/3))); }
        syncWarpCore();
      };
    }
    syncWarpCore();
  }
  function overrideApplySteer(){
    if(!window.app || window.app.__openingApplySteer) return;
    const old=window.app.applySteer;
    window.app.applySteer=function(v,silent){
      try{
        const s=$('steer-input-val'); if(s) s.value=String(v);
        const out=$('ang-val'); if(out) out.textContent=Math.round(Number(v)||0)+'°';
        const wheel=$('wheel'); if(wheel) wheel.style.transform='rotate('+(Number(v)||0)+'deg)';
        setImage(angleToMode(),'applySteer');
        const core=$('core-window'); if(core) core.style.setProperty('transform','none','important');
      }catch(e){ try{ return old && old.call(this,v,silent); }catch(_){} }
    };
    window.app.__openingApplySteer=true;
  }
  function boot(){
    document.body.classList.add('kgen-opening-ready');
    bindSlider(); bindMoveHeart(); bindFooterActions(); bindWarp(); overrideApplySteer();
    if(!state.visual || state.visual==='heart') setImage(angleToMode(),'boot');
    const core=$('core-window'); if(core) core.style.setProperty('transform','none','important');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
  window.addEventListener('load',()=>{boot(); setTimeout(boot,400); setTimeout(boot,1600);});
  setInterval(boot,2500);
  window.KGEN_12345_UI_RUNTIME={version:VERSION, setImage, assets:ASSET, openingMode:true};
})();
