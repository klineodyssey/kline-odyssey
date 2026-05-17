/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-universe-axis.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
(function(){
  "use strict";
  window.KGEN_UNIVERSE_AXIS = {
    version: "V10.39.0_RUNTIME_GOVERNANCE",
    X: { label: "X", name: "Reality Left Right", type: "space" },
    Y: { label: "Y", name: "Reality Up Down", type: "space" },
    Z: { label: "Z", name: "Long Short Mirror Axis", type: "market", plus: "+Z 多方", minus: "-Z 空方" },
    C: { label: "C", name: "Warp Elevator", type: "warp" },
    T: { label: "T", name: "Natural Time Flow", type: "time" },
    CT: { label: "CT", name: "Current Position Boundary", type: "boundary" }
  };

  function injectLabels() {
    if (document.getElementById("kgen-axis-labels")) return;
    const wrap = document.createElement("div");
    wrap.id = "kgen-axis-labels";
    wrap.innerHTML = `
      <div class="kgen-axis-badge kgen-axis-xy">XY｜真實平面</div>
      <div class="kgen-axis-badge kgen-axis-zp">+Z｜多方</div>
      <div class="kgen-axis-badge kgen-axis-zn">-Z｜空方</div>
      <div class="kgen-axis-badge kgen-axis-c">C｜曲速宇宙電梯</div>
      <div class="kgen-axis-badge kgen-axis-ct">CT｜現價宇宙邊界</div>
    `;
    document.body.appendChild(wrap);
  }

  function boot() { injectLabels(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
