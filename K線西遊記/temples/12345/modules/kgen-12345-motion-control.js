/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: kgen-12345-motion-control.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
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
