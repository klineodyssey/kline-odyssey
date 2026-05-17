// KGEN 12345 official motion control
(function(){
  "use strict";
  window.KGEN_AXIS = window.KGEN_AXIS || {x:0,y:0,z:0};
  window.KGEN_MOVE_XY = function(dx, dy){
    window.KGEN_AXIS.x += Number(dx) || 0;
    window.KGEN_AXIS.y += Number(dy) || 0;
    const core = document.getElementById("core-anchor");
    if (core) {
      core.style.transform = `translate(calc(-50% + ${window.KGEN_AXIS.x}px), calc(-50% + ${window.KGEN_AXIS.y}px))`;
    }
  };
})();
