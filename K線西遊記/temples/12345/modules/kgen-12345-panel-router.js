// KGEN 12345 Panel Router Recovery
// VERSION: V10.38.0_GENESIS_520_PANEL_RECOVERY
(function(){
  "use strict";
  if (window.__KGEN_12345_PANEL_ROUTER_V10380__) return;
  window.__KGEN_12345_PANEL_ROUTER_V10380__ = true;

  const RULES = [
    {
      key:"all",
      buttonAliases:["總收合","總開合","總展開","展開","收合"],
      panelAliases:["GA EVOLUTION","GA Evolution","悟空心臟引擎","悟空心臟圖譜","悟空心臟圖普","心臟引擎","心臟圖譜"],
      selectors:["#ga-evolution",".ga-evolution","#ga-card",".ga-card","#heart-engine",".heart-engine","#heart-chart",".heart-chart","#wish-chart",".wish-chart"]
    },
    {
      key:"festival",
      buttonAliases:["節日活動","每日活動","520","1111","12/31","跨年"],
      panelAliases:["520","1111","12/31","跨年","節日活動","悟空生日"],
      selectors:["#festival-panel",".festival-panel","#festival-card",".festival-card","#daily-festival",".daily-festival","#festival-list",".festival-list"]
    },
    {
      key:"rightRule",
      buttonAliases:["右側神規","神規","悟空神規"],
      panelAliases:["右側神規","神規","Cosmic Rule","Rule"],
      selectors:["#rule-panel",".rule-panel","#deity-rule-panel",".deity-rule-panel","#god-rule-panel",".god-rule-panel","#right-rule-panel",".right-rule-panel"]
    },
    {
      key:"wukongHeart",
      buttonAliases:["悟空心臟","心臟圖","心臟引擎","心臟圖譜","心臟圖普"],
      panelAliases:["悟空心臟","悟空心臟引擎","悟空心臟圖譜","悟空心臟圖普","Heart Core","Heart Engine"],
      selectors:["#wukong-heart-panel",".wukong-heart-panel","#heart-panel",".heart-panel","#heart-engine-panel",".heart-engine-panel","#heart-map",".heart-map","#heart-canvas",".heart-canvas"]
    },
    {
      key:"holyCupCheck",
      buttonAliases:["三聖盃檢查","聖盃檢查"],
      panelAliases:["三聖盃檢查系統","Three Holy Grail Check System","STEP 1","STEP 2","STEP 3"],
      selectors:["#holy-cup-check",".holy-cup-check","#cup-check-panel",".cup-check-panel","#cup-system",".cup-system"]
    }
  ];

  const state = {};

  function norm(s){ return (s || "").replace(/\s+/g," ").trim(); }
  function txt(el){ return norm(el && el.textContent); }
  function uniq(list){
    const out=[], seen=new Set();
    list.forEach(el => {
      if (!el || seen.has(el)) return;
      seen.add(el); out.push(el);
    });
    return out;
  }

  function isTinyControl(el){
    const tag = (el.tagName || "").toUpperCase();
    return ["BUTTON","A","INPUT","SELECT","TEXTAREA"].includes(tag) || el.getAttribute("role")==="button";
  }

  function findButtons(rule){
    const btns = [];
    document.querySelectorAll("button,a,[role='button'],.btn,.chip,[onclick]").forEach(el=>{
      const t = txt(el);
      if (!t) return;
      if (rule.buttonAliases.some(a => t.includes(a))) btns.push(el);
    });
    return uniq(btns);
  }

  function findPanels(rule){
    let panels = [];
    rule.selectors.forEach(sel=>{
      try { panels.push(...document.querySelectorAll(sel)); } catch(e){}
    });

    rule.panelAliases.forEach(alias=>{
      document.querySelectorAll("div,section,aside,article,[id],[class]").forEach(el=>{
        if (isTinyControl(el)) return;
        const t = txt(el);
        if (!t || t.length > 2200) return;
        if (!t.includes(alias)) return;

        let p = el;
        for (let i=0; i<4 && p.parentElement; i++){
          const idc = (p.id || "") + " " + (p.className ? String(p.className) : "");
          if (/panel|card|hud|glass|box|section|wrap|engine|festival|rule|heart|ga/i.test(idc)) break;
          if (txt(p.parentElement).length > 2600) break;
          p = p.parentElement;
        }
        panels.push(p);
      });
    });

    panels = uniq(panels).filter(p => p && !isTinyControl(p));

    if (rule.key === "wukongHeart") {
      panels = panels.filter(p => {
        const t = txt(p);
        return !(t.includes("Wallet") && t.includes("Allowance") && t.includes("Heart 血庫"));
      });
    }

    return panels;
  }

  function show(el, yes){
    if (!el) return;
    el.dataset.kgenCollapsed = yes ? "0" : "1";
    if(!yes){
      if(!el.dataset.kgenOriginalDisplay) el.dataset.kgenOriginalDisplay = getComputedStyle(el).display || "block";
      el.style.display = "none";
      el.setAttribute("aria-hidden","true");
    }else{
      el.style.display = el.dataset.kgenOriginalDisplay && el.dataset.kgenOriginalDisplay !== "none" ? el.dataset.kgenOriginalDisplay : "";
      el.removeAttribute("aria-hidden");
    }
  }

  function toggle(rule){
    const panels = findPanels(rule);
    if (!panels.length) return false;
    const collapsed = panels.every(p => p.dataset.kgenCollapsed === "1" || getComputedStyle(p).display === "none");
    const nextShow = collapsed;
    panels.forEach(p => show(p, nextShow));
    state[rule.key] = nextShow ? "open" : "closed";
    return true;
  }

  function bind(rule){
    findButtons(rule).forEach(btn=>{
      const key = "kgenRouterBound_" + rule.key;
      if(btn.dataset[key]) return;
      btn.dataset[key] = "1";
      btn.addEventListener("click", function(ev){
        const ok = toggle(rule);
        if(ok){
          ev.preventDefault();
          ev.stopPropagation();
        }
      }, true);
    });
  }

  function fixTopEscapedButtons(){
    document.querySelectorAll("button,.btn,.chip,[role='button']").forEach(b=>{
      const r = b.getBoundingClientRect();
      const t = txt(b);
      if(r.top < 4 && (t.includes("展開") || t.includes("收合") || t.includes("總"))){
        b.style.top = "auto";
        b.style.transform = "none";
        b.style.marginTop = "6px";
        b.style.zIndex = "80";
      }
    });
  }

  function fixFestivalOverlap(){
    const rule = RULES.find(r=>r.key==="festival");
    findPanels(rule).forEach(p=>{
      p.style.position = "relative";
      p.style.zIndex = "70";
      p.style.marginBottom = "14px";
      p.style.maxHeight = "none";
      p.style.overflow = "visible";
    });
  }

  function fixHolyCupPosition(){
    const rule = RULES.find(r=>r.key==="holyCupCheck");
    findPanels(rule).forEach(p=>{
      p.style.position = "relative";
      p.style.zIndex = "40";
      p.style.marginTop = "12px";
      p.style.marginBottom = "16px";
      p.style.clear = "both";
      p.style.maxWidth = "100%";
    });
  }

  function boot(){
    RULES.forEach(bind);
    fixTopEscapedButtons();
    fixFestivalOverlap();
    fixHolyCupPosition();
  }

  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setInterval(boot, 1500);

  window.KGEN_PANEL_ROUTER = {
    VERSION:"V10.38.0_GENESIS_520_PANEL_RECOVERY",
    rules:RULES,
    state,
    boot,
    toggle:function(key){
      const rule = RULES.find(r=>r.key===key);
      return rule ? toggle(rule) : false;
    }
  };
})();
