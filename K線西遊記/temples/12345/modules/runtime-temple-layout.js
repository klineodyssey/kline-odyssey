/*
PRODUCT_ID: KGEN-12345-HEART-UI
MODULE: runtime-temple-layout.js
VERSION: V10.40.0_GITHUB_RELEASE_CLEAN
BUILD: 20260517-V10.40.0-GITHUB-RELEASE-CLEAN
BASE_FROM: KGEN_12345_V10_39_2_EXECUTION_MAP_GOVERNANCE_FULL.zip
RULE: GitHub release layer only keeps active files. Modules single-layer.
*/
(function(){
  "use strict";
  if (window.__KGEN_TEMPLE_LAYOUT__) return;
  window.__KGEN_TEMPLE_LAYOUT__ = true;
  const q=(s,r=document)=>Array.from(r.querySelectorAll(s));
  const tx=e=>(e&&e.textContent||"").replace(/\s+/g," ").trim();

  function findRulePanels(){
    return q("#right-rule-panel,#rule-panel,.deity-rule-panel,.rule-panel,#deity-rule-panel")
      .filter(e => /TempleHeart|Brain|神規|規則|對齊/.test(tx(e)));
  }
  function normalizeRightRule(){
    findRulePanels().forEach(p=>{
      p.classList.add("kgen-temple-right-rule-panel");
      p.dataset.kgenPanel="rightRule";
      if(!p.querySelector(".kgen-panel-close")){
        const b=document.createElement("button");
        b.type="button"; b.className="kgen-panel-close"; b.textContent="收合";
        b.style.cssText="position:sticky;top:0;float:right;z-index:3;border:1px solid rgba(255,215,120,.45);border-radius:999px;background:rgba(0,0,0,.55);color:#ffe28a;font-weight:900;font-size:12px;padding:4px 8px;margin:0 0 8px 8px;";
        b.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();p.style.display="none";p.dataset.kgenCollapsed="1";};
        p.prepend(b);
      }
    });
  }
  function bindRightRule(){
    q("button,a,[role='button'],.btn,.chip").forEach(btn=>{
      if(btn.dataset.kgenRightRuleBound) return;
      const t=tx(btn);
      if(!(t.includes("右側神規") || t==="神規" || t.includes("悟空神規"))) return;
      btn.dataset.kgenRightRuleBound="1";
      btn.addEventListener("click",ev=>{
        const panels=findRulePanels();
        if(!panels.length) return;
        ev.preventDefault(); ev.stopPropagation();
        panels.forEach(p=>{
          const hidden=p.dataset.kgenCollapsed==="1" || getComputedStyle(p).display==="none";
          p.style.display=hidden?"block":"none";
          p.dataset.kgenCollapsed=hidden?"0":"1";
        });
      },true);
    });
  }
  function findHoly(){
    return q("#holy-cup-modal,#holy-cup-check,.holy-cup-check,#cup-check-panel,.cup-check-panel,#cup-system,.cup-system")
      .filter(e=>/三聖盃|Holy|STEP/.test(tx(e)));
  }
  function normalizeHoly(){
    findHoly().forEach(p=>{
      p.dataset.kgenPanel="holyCupWorkflow";
      if(!p.querySelector(".kgen-holycup-local-toggle")){
        const b=document.createElement("button");
        b.type="button"; b.className="kgen-holycup-local-toggle"; b.textContent="收合";
        b.style.cssText="position:sticky;top:0;float:right;z-index:3;border:1px solid rgba(255,215,120,.45);border-radius:999px;background:rgba(0,0,0,.55);color:#ffe28a;font-weight:900;font-size:12px;padding:4px 8px;margin:0 0 6px 6px;";
        b.onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();document.documentElement.classList.add("kgen-holycup-collapsed");};
        p.prepend(b);
      }
    });
    if(!document.getElementById("kgen-holycup-tab")){
      const tab=document.createElement("button");
      tab.id="kgen-holycup-tab"; tab.type="button"; tab.textContent="三聖盃檢查";
      tab.onclick=()=>document.documentElement.classList.toggle("kgen-holycup-collapsed");
      document.body.appendChild(tab);
    }
  }
  function boot(){
    normalizeRightRule(); bindRightRule(); normalizeHoly();
    q("#kgen-heart-live-panel,.heart-console,.kgen-heart-console").forEach(e=>e.style.top="var(--kgen-safe-top)");
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
  setInterval(boot,1800);
})();
