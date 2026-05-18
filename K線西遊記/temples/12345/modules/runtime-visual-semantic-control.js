/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-visual-semantic-control.js
VERSION: V10.40.3_CANVAS_SCREEN_VISUAL_WARP_FULL
BUILD: 20260518-V10.40.3-CANVAS-SCREEN-VISUAL-WARP-FULL
BASE_FROM: KGEN_12345_V10_40_2_V9_RECORDER_CORE_RESTORE_FULL.zip
PURPOSE: Canvas screen recorder fallback, visual four-image binding, warp-core rail binding, Holy Cup layout.
RULE: Active JS/CSS stays in modules single layer. No modules/runtime folder.
*/

(function(){
  'use strict';
  if(window.__KGEN_VISUAL_SEMANTIC_V10403__) return; window.__KGEN_VISUAL_SEMANTIC_V10403__=true;
  const ASSETS={ bull:'./assets/bull-front.png', bear:'./assets/bear-rear.png', heart:'./assets/heart.png', warp:'./assets/warp-core.png' };
  const role={ 'bull-front.png':'多方靜止主圖', 'bear-rear.png':'空方靜止主圖', 'heart.png':'MOVE / WARP 移動中暫態圖', 'warp-core.png':'右下曲速電梯艙' };
  window.KGEN_VISUAL_ROLE=role;
  const $=id=>document.getElementById(id);
  let valid={}, checked=false, defaultSrc='', motionTimer=null;
  function imgEl(){ return $('fairy-img') || $('core-img') || document.querySelector('#core-window img,img[data-kgen-core]'); }
  function checkAsset(url){ return new Promise(res=>{ const im=new Image(); im.onload=()=>res(im.naturalWidth>0&&im.naturalHeight>0); im.onerror=()=>res(false); im.src=url+'?v=10403&t='+(Date.now()%100000); }); }
  async function check(){ if(checked) return valid; checked=true; valid.bull=await checkAsset(ASSETS.bull); valid.bear=await checkAsset(ASSETS.bear); valid.heart=await checkAsset(ASSETS.heart); valid.warp=await checkAsset(ASSETS.warp); return valid; }
  function deg(){ const s=($('steer-input-val')||{}).value || (($('ang-val')||{}).textContent||'0').replace('°',''); return Math.max(-180,Math.min(180,Number(s)||0)); }
  function sideFromDeg(d){ return (d>=-90 && d<=90)?'bull':'bear'; }
  function setImg(mode){ const img=imgEl(); if(!img) return; if(!defaultSrc) defaultSrc=img.getAttribute('src')||''; const url=(mode==='heart')?ASSETS.heart:(mode==='bear')?ASSETS.bear:ASSETS.bull; if(valid[mode]) img.src=url; else if(mode==='heart' && valid.heart) img.src=ASSETS.heart; else if(defaultSrc) img.src=defaultSrc; document.documentElement.dataset.kgenMarketMode=mode; }
  function settle(){ const s=sideFromDeg(deg()); setImg(s); if(window.KGEN_RUNTIME_STATE&&window.KGEN_RUNTIME_STATE.universe) window.KGEN_RUNTIME_STATE.universe.Z=(s==='bear')?-1:1; }
  function motion(){ if(valid.heart) setImg('heart'); clearTimeout(motionTimer); motionTimer=setTimeout(settle,520); }
  window.KGEN_SET_MARKET_MODE=function(mode){ if(mode==='heart') motion(); else if(mode==='bear'||mode==='bull') setImg(mode); else settle(); };
  window.KGEN_STOP_HEART_MOTION=settle;
  function bind(){ check().then(()=>{ settle(); const steer=$('steer-input-val'); if(steer && !steer.__v10403Visual){ steer.__v10403Visual=1; steer.addEventListener('input',()=>{ motion(); },true); steer.addEventListener('change',settle,true); } const warp=$('warp-input-val'); if(warp && !warp.__v10403Visual){ warp.__v10403Visual=1; warp.addEventListener('input',()=>{ motion(); },true); warp.addEventListener('change',settle,true); } const move=$('move-joystick-wrap')||$('move-joystick-knob'); if(move && !move.__v10403Visual){ move.__v10403Visual=1; ['pointerdown','touchstart','mousedown'].forEach(ev=>move.addEventListener(ev,motion,true)); ['pointerup','touchend','mouseup'].forEach(ev=>window.addEventListener(ev,settle,true)); } }); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',bind); else bind(); setInterval(settle,2500);
})();
