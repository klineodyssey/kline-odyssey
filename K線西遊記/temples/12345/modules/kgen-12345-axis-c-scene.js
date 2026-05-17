// KGEN 12345 Axis C Scene System
// VERSION: V10.37.7_AXIS_C_SCENE
// Warp/C is a universe floor selector, not XYZT movement.
(function(){
  'use strict';
  if(window.__KGEN_12345_AXIS_C_SCENE__) return;
  window.__KGEN_12345_AXIS_C_SCENE__ = true;
  const VERSION='V10.37.7_AXIS_C_SCENE';
  function clamp(n,min,max){ n=Number(n)||0; return Math.max(min,Math.min(max,n)); }
  function sceneName(level){
    if(level===0) return '靜止觀望';
    if(level===1) return '進場層';
    if(level<=55) return '低軌修行層';
    if(level<=144) return '花果山文明層';
    if(level<=233) return '五指山宇宙層';
    return '三百樓曲速文明層';
  }
  function apply(level){
    level=clamp(Math.round(level),0,300);
    document.body.dataset.kgenWarpScene=String(level);
    document.body.dataset.kgenWarpSceneName=sceneName(level);
    const label=document.getElementById('kgen-axis-c-scene-label') || document.querySelector('[data-kgen-axis-c-label]');
    if(label) label.textContent='Warp Scene '+level+'｜'+sceneName(level);
    return {level,name:sceneName(level)};
  }
  window.KGEN_AXIS_C_SCENE={VERSION,apply,sceneName};
  window.addEventListener('kgen:warp-scene-change', e=>apply(e.detail&&e.detail.level));
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>apply((window.KGEN_AXIS&&window.KGEN_AXIS.warp)||0)); else apply((window.KGEN_AXIS&&window.KGEN_AXIS.warp)||0);
})();
