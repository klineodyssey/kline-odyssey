// KGEN 12345 official motion control
// VERSION: V10.37.7_XY_NO_WARP_LINK
// XY = real-world plane. Z = bull/bear mirror. Warp/C = scene elevator only.
(function(){
  "use strict";
  window.KGEN_AXIS = window.KGEN_AXIS || {x:0,y:0,z:0,t:0,c:0,warp:0};
  function clamp(n,min,max){ n=Number(n)||0; return Math.max(min,Math.min(max,n)); }
  window.KGEN_MOVE_XY = function(dx, dy){
    window.KGEN_AXIS.x += Number(dx) || 0;
    window.KGEN_AXIS.y += Number(dy) || 0;
    const core = document.getElementById("core-anchor");
    if (core) {
      core.style.transform = `translate(calc(-50% + ${window.KGEN_AXIS.x}px), calc(-50% + ${window.KGEN_AXIS.y}px))`;
    }
    // IMPORTANT: XY never changes Warp/C. Warp is handled by KGEN_SET_WARP_SCENE only.
    return {x:window.KGEN_AXIS.x,y:window.KGEN_AXIS.y,z:window.KGEN_AXIS.z,warp:window.KGEN_AXIS.warp};
  };
  window.KGEN_SET_Z_MIRROR = function(z){
    window.KGEN_AXIS.z = clamp(z,-1,1);
    document.body.dataset.kgenZMirror = window.KGEN_AXIS.z >= 0 ? 'bull' : 'bear';
  };
  window.KGEN_SET_WARP_SCENE = function(level){
    const lv = clamp(Math.round(level),0,300);
    window.KGEN_AXIS.c = lv;
    window.KGEN_AXIS.warp = lv;
    document.body.dataset.kgenWarpScene = String(lv);
    window.dispatchEvent(new CustomEvent('kgen:warp-scene-change',{detail:{level:lv}}));
    return lv;
  };
})();
