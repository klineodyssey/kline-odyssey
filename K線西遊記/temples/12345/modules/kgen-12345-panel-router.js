// KGEN 12345 Panel Router Repair
// VERSION: V10.37.6_PANEL_ROUTER_REPAIR
(function(){
  "use strict";
  if (window.__KGEN_12345_PANEL_ROUTER_REPAIR__) return;
  window.__KGEN_12345_PANEL_ROUTER_REPAIR__ = true;

  const RULES = [
    {key:"gaSystem", aliases:["總開合","總收合","總展開","展開","收合"], selectors:["#ga-card",".ga-card","#ga-evolution",".ga-evolution","#heart-engine",".heart-engine","#heart-chart",".heart-chart","#wish-chart",".wish-chart"]},
    {key:"festival", aliases:["節日活動","每日活動","520","1111","12/31","跨年"], selectors:["#festival-panel",".festival-panel","#festival-card",".festival-card","#daily-festival",".daily-festival","#festival-list",".festival-list"]},
    {key:"deityRules", aliases:["神規","悟空神規","右側神規","規則"], selectors:["#rule-panel",".rule-panel","#deity-rule-panel",".deity-rule-panel","#god-rule-panel",".god-rule-panel","#ga-rule-card",".ga-rule-card"]},
    {key:"wukongHeart", aliases:["悟空心臟","心臟圖","心臟引擎","心臟圖譜"], selectors:["#wukong-heart-panel",".wukong-heart-panel","#heart-panel",".heart-panel","#heart-engine-panel",".heart-engine-panel","#heart-map",".heart-map","#heart-canvas",".heart-canvas"]},
    {key:"holyCupCheck", aliases:["三聖盃檢查","三聖盃檢查系統","聖盃檢查"], selectors:["#holy-cup-check",".holy-cup-check","#cup-check-panel",".cup-check-panel","#cup-system",".cup-system"]}
  ];

  function text(el){ return (el && el.textContent || "").replace(/\s+/g," ").trim(); }
  function uniq(a){ const s=new Set(),o=[]; a.forEach(x=>{if(x&&!s.has(x)){s.add(x);o.push(x)}}); return o; }

  function findPanels(rule){
    let nodes = [];
    rule.selectors.forEach(sel=>{ try{ nodes.push(...document.querySelectorAll(sel)); }catch(e){} });
    rule.aliases.forEach(alias=>{
      document.querySelectorAll("div,section,aside,article").forEach(el=>{
        const t=text(el);
        if(!t || t.length>1600) return;
        if(t.includes(alias)){
          const p=el.closest("[id],.card,.panel,.hud-card,.glass,section,aside,article,div");
          if(p) nodes.push(p);
        }
      });
    });
    return uniq(nodes).filter(el=>!["BUTTON","A","INPUT","SELECT"].includes(el.tagName));
  }

  function findButtons(rule){
    const btns=[];
    document.querySelectorAll("button,a,[role='button'],.btn,.chip").forEach(el=>{
      const t=text(el);
      if(t && rule.aliases.some(a=>t.includes(a))) btns.push(el);
    });
    return uniq(btns);
  }

  function setCollapsed(el, yes){
    el.dataset.kgenCollapsed = yes ? "1" : "0";
    if(yes){
      if(!el.dataset.kgenOriginalDisplay) el.dataset.kgenOriginalDisplay=getComputedStyle(el).display||"block";
      el.style.display="none";
    }else{
      el.style.display = el.dataset.kgenOriginalDisplay && el.dataset.kgenOriginalDisplay !== "none" ? el.dataset.kgenOriginalDisplay : "";
    }
  }

  function toggle(rule){
    const panels=findPanels(rule);
    if(!panels.length) return;
    const yes = !(panels[0].dataset.kgenCollapsed === "1");
    panels.forEach(p=>setCollapsed(p,yes));
  }

  function bind(rule){
    findButtons(rule).forEach(btn=>{
      if(btn.dataset.kgenRouterBound===rule.key) return;
      btn.dataset.kgenRouterBound=rule.key;
      btn.addEventListener("click",()=>toggle(rule),true);
    });
  }

  function layoutCup(){
    const r=RULES.find(x=>x.key==="holyCupCheck");
    findPanels(r).forEach(p=>{
      p.style.position="relative";
      p.style.zIndex="30";
      p.style.marginTop="12px";
      p.style.marginBottom="14px";
      p.style.clear="both";
      p.style.maxWidth="100%";
    });
  }

  function boot(){ RULES.forEach(bind); layoutCup(); }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot); else boot();
  setInterval(boot,2000);

  window.KGEN_PANEL_ROUTER={VERSION:"V10.37.6_PANEL_ROUTER_REPAIR",rules:RULES,boot,toggle:function(key){const r=RULES.find(x=>x.key===key);if(r)toggle(r);}};
})();