/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-panel-registry.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
(function(){
  "use strict";
  if (window.KGEN_PANEL_REGISTRY) return;

  const defs = {
    heartConsole:     { selector: "#kgen-heart-live-panel, .heart-console, .kgen-heart-console", z: 120 },
    holyCupModal:     { selector: "#holy-cup-modal, #holy-cup-check, .holy-cup-check, #cup-check-panel, .cup-check-panel", z: 1000 },
    rightGodRule:     { selector: "#right-rule-panel, #rule-panel, .right-rule-panel, .rule-panel, #deity-rule-panel, .deity-rule-panel", z: 520 },
    leftHeartPanel:   { selector: "#wukong-heart-panel, #heart-panel, .wukong-heart-panel, .heart-panel, #heart-engine-panel, .heart-engine-panel", z: 520 },
    festivalPanel:    { selector: "#festival-panel, .festival-panel, #festival-card, .festival-card, #daily-festival, .daily-festival", z: 500 },
    gaEvolution:      { selector: "#ga-evolution, .ga-evolution, #ga-card, .ga-card", z: 420 },
    heartEngine:      { selector: "#heart-engine, .heart-engine", z: 430 },
    heartChart:       { selector: "#heart-chart, .heart-chart, #wish-chart, .wish-chart", z: 430 }
  };

  function find(selector){
    return Array.from(document.querySelectorAll(selector)).filter(Boolean);
  }

  window.KGEN_PANEL_REGISTRY = {
    version: "V10.39.0_RUNTIME_GOVERNANCE",
    defs,
    get(key) {
      const def = defs[key];
      if (!def) return [];
      return find(def.selector);
    },
    keys() { return Object.keys(defs); }
  };
})();
