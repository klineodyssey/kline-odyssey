/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-router-engine.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
(function(){
  "use strict";
  if (window.KGENRouter && window.KGENRouter.version === "V10.39.0_RUNTIME_GOVERNANCE") return;

  function panels(key) {
    return window.KGEN_PANEL_REGISTRY ? window.KGEN_PANEL_REGISTRY.get(key) : [];
  }

  const TOTAL_KEYS = ["gaEvolution", "heartEngine", "heartChart", "festivalPanel"];

  function open(key) {
    panels(key).forEach(el => window.KGEN_VISIBILITY.show(el));
    if (window.KGEN_RUNTIME_STATE) window.KGEN_RUNTIME_STATE.visibility[key] = "open";
  }

  function close(key) {
    panels(key).forEach(el => window.KGEN_VISIBILITY.hide(el));
    if (window.KGEN_RUNTIME_STATE) window.KGEN_RUNTIME_STATE.visibility[key] = "closed";
  }

  function toggle(key) {
    const found = panels(key);
    if (!found.length) return false;
    const hidden = found.every(el => el.dataset.kgenCollapsed === "1" || getComputedStyle(el).display === "none");
    found.forEach(el => hidden ? window.KGEN_VISIBILITY.show(el) : window.KGEN_VISIBILITY.hide(el));
    if (window.KGEN_RUNTIME_STATE) window.KGEN_RUNTIME_STATE.visibility[key] = hidden ? "open" : "closed";
    return true;
  }

  function closeAll() {
    TOTAL_KEYS.forEach(close);
    ensureReopenAnchor();
  }

  function openAll() {
    TOTAL_KEYS.forEach(open);
  }

  function ensureReopenAnchor() {
    if (document.getElementById("kgen-reopen-anchor")) return;
    const b = document.createElement("button");
    b.id = "kgen-reopen-anchor";
    b.type = "button";
    b.textContent = "展開神殿";
    b.style.cssText = "position:fixed;right:14px;top:86px;z-index:2000;border:1px solid rgba(255,215,120,.65);border-radius:999px;padding:8px 12px;background:rgba(0,0,0,.82);color:#ffe28a;font-weight:900;";
    b.addEventListener("click", openAll);
    document.body.appendChild(b);
  }

  function t(el) { return (el.textContent || "").replace(/\s+/g, " ").trim(); }

  function bindTextButtons() {
    document.querySelectorAll("button,a,[role='button'],.btn,.chip").forEach(el => {
      if (el.dataset.kgenRouterV10390) return;
      const text = t(el);
      let key = "";
      let action = "toggle";

      if (text.includes("總收合")) { key = "all"; action = "closeAll"; }
      else if (text.includes("總展開") || text.includes("總開合")) { key = "all"; action = "openAll"; }
      else if (text.includes("右側神規") || text === "神規" || text.includes("悟空神規")) key = "rightGodRule";
      else if (text.includes("悟空心臟") || text.includes("心臟圖譜") || text.includes("心臟圖普")) key = "leftHeartPanel";
      else if (text.includes("節日活動") || text.includes("520") || text.includes("1111") || text.includes("跨年")) key = "festivalPanel";
      else if (text.includes("三聖盃檢查") || text.includes("聖盃檢查")) key = "holyCupModal";

      if (!key) return;
      el.dataset.kgenRouterV10390 = "1";
      el.addEventListener("click", ev => {
        let ok = true;
        if (action === "closeAll") closeAll();
        else if (action === "openAll") openAll();
        else ok = toggle(key);
        if (ok) {
          ev.preventDefault();
          ev.stopPropagation();
        }
      }, true);
    });
  }

  window.KGENRouter = {
    version: "V10.39.0_RUNTIME_GOVERNANCE",
    open,
    close,
    toggle,
    closeAll,
    openAll,
    bindTextButtons,
    ensureReopenAnchor
  };

  function boot() {
    bindTextButtons();
    ensureReopenAnchor();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setInterval(boot, 1500);
})();
