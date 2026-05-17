/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-visibility-engine.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
(function(){
  "use strict";
  window.KGEN_VISIBILITY = {
    show(el) {
      if (!el) return;
      el.dataset.kgenCollapsed = "0";
      el.style.display = el.dataset.kgenDisplayBeforeCollapse && el.dataset.kgenDisplayBeforeCollapse !== "none"
        ? el.dataset.kgenDisplayBeforeCollapse
        : "";
      el.removeAttribute("aria-hidden");
    },
    hide(el) {
      if (!el) return;
      if (!el.dataset.kgenDisplayBeforeCollapse) {
        el.dataset.kgenDisplayBeforeCollapse = getComputedStyle(el).display || "block";
      }
      el.dataset.kgenCollapsed = "1";
      el.style.display = "none";
      el.setAttribute("aria-hidden", "true");
    },
    toggle(el) {
      if (!el) return;
      const hidden = el.dataset.kgenCollapsed === "1" || getComputedStyle(el).display === "none";
      hidden ? this.show(el) : this.hide(el);
    }
  };
})();
