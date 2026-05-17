/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-zlayer-engine.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
(function(){
  "use strict";
  window.KGEN_PANEL_Z = {
    background: 1,
    chart: 10,
    panels: 100,
    floating: 500,
    modal: 1000,
    emergency: 2000
  };

  window.KGEN_ZLAYER = {
    set(el, level) {
      if (!el) return;
      const z = typeof level === "number" ? level : (window.KGEN_PANEL_Z[level] || 100);
      el.style.position = el.style.position || "relative";
      el.style.zIndex = String(z);
    }
  };
})();
