// KGEN 12345 Panel Layout Router Hotfix
// VERSION: V10.37.7_PANEL_LAYOUT_ROUTER_HOTFIX
// BASE_FROM: V10.37.6_PANEL_ROUTER_REPAIR
// Purpose:
// 1) Total expand/collapse controls GA Evolution + Wukong Heart Engine + Wukong Heart Map only.
// 2) Right-side deity rules button controls coord-panel only.
// 3) Bottom Wukong Heart button controls Heart Universe Map, NOT the left-top Temple Heart console.
// 4) Festival 520/1111/NewYear panel is collapsed by default and no longer blocks buttons.
(function(){
  'use strict';
  if(window.__KGEN_12345_PANEL_LAYOUT_ROUTER_HOTFIX__) return;
  window.__KGEN_12345_PANEL_LAYOUT_ROUTER_HOTFIX__ = true;

  const VERSION = 'V10.37.7_PANEL_LAYOUT_ROUTER_HOTFIX';
  const $ = (id)=>document.getElementById(id);
  const qsa = (sel)=>Array.from(document.querySelectorAll(sel));
  const txt = (el)=>((el && el.textContent) || '').replace(/\s+/g,'').trim();

  const SELECTORS = {
    ga: ['.ga-matrix'],
    heartEngine: ['#kline-engine-panel'],
    heartMap: ['#kline-chart-panel'],
    rightRules: ['#coord-panel','.coord-panel','#right-info-panel','.right-info-panel','#v104-rules-panel'],
    festival: ['#kgen-v102-festival-panel','#v104-festival-panel','.festival-panel','#festival-panel'],
    templeConsole: ['#kgen-heart-live-panel'],
    templeConsoleButton: ['#kgen-heart-toggle']
  };

  function nodes(list){
    const out=[];
    list.forEach(s=>{ try{ out.push(...qsa(s)); }catch(_){} });
    return [...new Set(out)].filter(Boolean);
  }
  function setOpen(el, open){
    if(!el) return;
    el.dataset.kgenRouterOpen = open ? '1' : '0';
    if(open){
      el.style.display = el.dataset.kgenOriginalDisplay && el.dataset.kgenOriginalDisplay !== 'none' ? el.dataset.kgenOriginalDisplay : '';
      el.style.visibility = 'visible';
      el.style.pointerEvents = 'auto';
    }else{
      if(!el.dataset.kgenOriginalDisplay){
        const d = getComputedStyle(el).display;
        el.dataset.kgenOriginalDisplay = d && d !== 'none' ? d : 'block';
      }
      el.style.display = 'none';
      el.style.visibility = 'hidden';
      el.style.pointerEvents = 'none';
    }
  }
  function isOpen(el){
    if(!el) return false;
    return el.dataset.kgenRouterOpen === '1' || (getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
  }
  function setGroupOpen(group, open){ nodes(group).forEach(el=>setOpen(el, open)); }
  function toggleGroup(group){ const ns=nodes(group); const open=!(ns[0] && isOpen(ns[0])); setGroupOpen(group, open); return open; }

  function heartSystemPanels(){
    return nodes([...SELECTORS.ga, ...SELECTORS.heartEngine, ...SELECTORS.heartMap]);
  }
  function setHeartSystem(open){ heartSystemPanels().forEach(el=>setOpen(el, open)); }
  function setRightRules(open){
    document.body.classList.toggle('kgen-router-right-rules-collapsed', !open);
    nodes(SELECTORS.rightRules).forEach(el=>setOpen(el, open));
  }
  function toggleRightRules(){
    const p = nodes(SELECTORS.rightRules)[0];
    setRightRules(!(p && isOpen(p)));
  }
  function setHeartMap(open){ setGroupOpen(SELECTORS.heartMap, open); }
  function toggleHeartMap(){ return toggleGroup(SELECTORS.heartMap); }
  function setFestival(open){
    document.body.classList.toggle('kgen-router-festival-open', !!open);
    nodes(SELECTORS.festival).forEach(el=>setOpen(el, !!open));
    const b=$('kgen-router-festival-toggle'); if(b) b.textContent = open ? '節日活動 ▴' : '節日活動 ▾';
  }
  function toggleFestival(){
    const p = nodes(SELECTORS.festival)[0];
    setFestival(!(p && isOpen(p)));
  }
  function toggleTempleConsole(){
    const p = nodes(SELECTORS.templeConsole)[0];
    setGroupOpen(SELECTORS.templeConsole, !(p && isOpen(p)));
  }

  function ensureStyle(){
    if($('kgen-12345-v10377-router-style')) return;
    const css = document.createElement('style');
    css.id='kgen-12345-v10377-router-style';
    css.textContent = `
      :root{--kgen-router-safe-top:88px;--kgen-router-right:10px;}
      #kgen-v10377-total-router{
        position:fixed!important;right:10px!important;top:var(--kgen-router-safe-top)!important;z-index:2147483300!important;
        display:flex!important;gap:6px!important;align-items:center!important;pointer-events:auto!important;
      }
      #kgen-v10377-total-router button,#kgen-router-festival-toggle{
        min-width:auto!important;width:auto!important;max-width:120px!important;height:32px!important;padding:4px 8px!important;
        border-radius:12px!important;border:1px solid rgba(255,215,120,.58)!important;background:rgba(0,0,0,.78)!important;
        color:#ffd778!important;font-size:12px!important;font-weight:900!important;line-height:1!important;box-shadow:0 0 14px rgba(255,215,120,.15)!important;
        cursor:pointer!important;white-space:nowrap!important;pointer-events:auto!important;
      }
      #kgen-router-festival-dock{position:fixed!important;right:10px!important;top:126px!important;z-index:2147483290!important;pointer-events:auto!important;}
      #kgen-v102-festival-panel,#v104-festival-panel,.festival-panel,#festival-panel{
        position:fixed!important;right:10px!important;top:164px!important;left:auto!important;width:min(360px,calc(100vw - 20px))!important;
        max-height:42vh!important;overflow:auto!important;z-index:2147483280!important;box-sizing:border-box!important;pointer-events:auto!important;
      }
      #coord-panel,.coord-panel,#right-info-panel,.right-info-panel,#v104-rules-panel{z-index:2147483260!important;pointer-events:auto!important;}
      .ga-matrix{z-index:2147482500!important;pointer-events:auto!important;}
      #kline-engine-panel,#kline-chart-panel{z-index:2147482501!important;pointer-events:auto!important;}
      .footer-terminal{z-index:2147483400!important;pointer-events:auto!important;}
      .footer-terminal .term-btn,.footer-terminal button{pointer-events:auto!important;position:relative!important;z-index:2147483401!important;}
      body.kgen-router-right-rules-collapsed #coord-panel,
      body.kgen-router-right-rules-collapsed .coord-panel,
      body.kgen-router-right-rules-collapsed #right-info-panel,
      body.kgen-router-right-rules-collapsed .right-info-panel,
      body.kgen-router-right-rules-collapsed #v104-rules-panel{display:none!important;visibility:hidden!important;pointer-events:none!important;}
      @media(max-width:720px){
        :root{--kgen-router-safe-top:82px;}
        #kgen-v10377-total-router{left:10px!important;right:10px!important;top:82px!important;justify-content:flex-end!important;}
        #kgen-v10377-total-router button,#kgen-router-festival-toggle{font-size:11px!important;padding:4px 6px!important;height:30px!important;}
        #kgen-router-festival-dock{right:10px!important;top:118px!important;}
        #kgen-v102-festival-panel,#v104-festival-panel,.festival-panel,#festival-panel{top:154px!important;right:8px!important;left:8px!important;width:auto!important;max-height:40vh!important;}
      }
    `;
    document.head.appendChild(css);
  }

  function ensureTopRouter(){
    if(!$('kgen-v10377-total-router')){
      const d=document.createElement('div');
      d.id='kgen-v10377-total-router';
      d.innerHTML='<button id="kgen-router-total-open" type="button">總展開</button><button id="kgen-router-total-close" type="button">總收合</button>';
      document.body.appendChild(d);
    }
    const open=$('kgen-router-total-open'), close=$('kgen-router-total-close');
    if(open && !open.dataset.kgenRouterBound){ open.dataset.kgenRouterBound='1'; open.onclick=(e)=>{e.preventDefault();e.stopPropagation();setHeartSystem(true);return false;}; }
    if(close && !close.dataset.kgenRouterBound){ close.dataset.kgenRouterBound='1'; close.onclick=(e)=>{e.preventDefault();e.stopPropagation();setHeartSystem(false);return false;}; }
  }

  function ensureFestivalDock(){
    if(!$('kgen-router-festival-dock')){
      const d=document.createElement('div');
      d.id='kgen-router-festival-dock';
      d.innerHTML='<button id="kgen-router-festival-toggle" type="button">節日活動 ▾</button>';
      document.body.appendChild(d);
    }
    const b=$('kgen-router-festival-toggle');
    if(b && !b.dataset.kgenRouterBound){ b.dataset.kgenRouterBound='1'; b.onclick=(e)=>{e.preventDefault();e.stopPropagation();toggleFestival();return false;}; }
  }

  function closeButtonsInsidePanels(){
    // Give right rules panel a real close button if it has a title row.
    const p=nodes(SELECTORS.rightRules)[0];
    if(p && !$('kgen-router-right-rules-close')){
      const head=p.querySelector('.cp-title,.v104-head,.kh-head') || p.firstElementChild;
      if(head){
        const b=document.createElement('button');
        b.id='kgen-router-right-rules-close'; b.type='button'; b.textContent='收合';
        b.style.cssText='float:right;margin-left:8px;border:1px solid rgba(255,215,120,.55);border-radius:999px;background:rgba(0,0,0,.55);color:#ffd778;padding:3px 9px;font-weight:900;';
        b.onclick=(e)=>{e.preventDefault();e.stopPropagation();setRightRules(false);return false;};
        head.appendChild(b);
      }
    }
    nodes(SELECTORS.festival).forEach((p,i)=>{
      if(p.querySelector('[data-kgen-router-festival-close="1"]')) return;
      const head=p.querySelector('.v104-head,.kh-head,h3') || p.firstElementChild;
      if(head){
        const b=document.createElement('button');
        b.type='button'; b.textContent='收合'; b.dataset.kgenRouterFestivalClose='1';
        b.style.cssText='float:right;margin-left:8px;border:1px solid rgba(255,215,120,.55);border-radius:999px;background:rgba(0,0,0,.55);color:#ffd778;padding:3px 9px;font-weight:900;';
        b.onclick=(e)=>{e.preventDefault();e.stopPropagation();setFestival(false);return false;};
        head.appendChild(b);
      }
    });
  }

  function normalizeFooterButtons(){
    const footer=document.querySelector('.footer-terminal');
    if(!footer) return;
    const btns=[...footer.querySelectorAll('button,.term-btn')].slice(0,8);
    if(btns.length>=8){
      const labels=['📸<br>拍照','🎥<br>錄影','🌙<br>前鏡多方','🌌<br>後鏡空方','💚<br>悟空心臟','🎬<br>雙鏡錄影','📜<br>規則活動','🛡<br>右側神規'];
      btns.forEach((b,i)=>{ if(b.dataset.kgenRouterLabel!=='1'){ b.innerHTML=labels[i]; b.dataset.kgenRouterLabel='1'; } });
      btns[4].dataset.kgenRouterAction='heartMap';
      btns[6].dataset.kgenRouterAction='festival';
      btns[7].dataset.kgenRouterAction='rightRules';
    }
  }

  function bindTextButtons(){
    qsa('button,a,.term-btn,[role="button"]').forEach(b=>{
      const t=txt(b);
      if(!t) return;
      if(/總展開/.test(t)) b.dataset.kgenRouterAction='totalOpen';
      if(/總收合|總開合/.test(t)) b.dataset.kgenRouterAction='totalClose';
      if(/右側神規|右神神規/.test(t)) b.dataset.kgenRouterAction='rightRules';
      if(/規則活動/.test(t)) b.dataset.kgenRouterAction='festival';
      // Bottom Wukong Heart button means heart universe map. Top-left #kgen-heart-toggle remains Temple Heart console.
      if(b.id !== 'kgen-heart-toggle' && /悟空心臟/.test(t)) b.dataset.kgenRouterAction='heartMap';
      if(/520|1111|跨年活動|節日活動/.test(t) && !/領取|festivalClaim|newYearCountdownClaim/.test(t)) b.dataset.kgenRouterAction='festival';
    });
  }

  function routeAction(action, ev){
    if(!action) return false;
    if(ev){ ev.preventDefault(); ev.stopPropagation(); if(ev.stopImmediatePropagation) ev.stopImmediatePropagation(); }
    if(action==='totalOpen') setHeartSystem(true);
    else if(action==='totalClose') setHeartSystem(false);
    else if(action==='rightRules') toggleRightRules();
    else if(action==='festival') toggleFestival();
    else if(action==='heartMap') toggleHeartMap();
    else if(action==='templeConsole') toggleTempleConsole();
    return true;
  }

  function clickCapture(ev){
    const b=ev.target && ev.target.closest && ev.target.closest('button,a,.term-btn,[role="button"]');
    if(!b) return;
    const action=b.dataset && b.dataset.kgenRouterAction;
    if(action) return routeAction(action, ev);
  }

  function boot(){
    ensureStyle();
    ensureTopRouter();
    ensureFestivalDock();
    normalizeFooterButtons();
    bindTextButtons();
    closeButtonsInsidePanels();
    // Default: festival panel closed so it cannot block the upper buttons.
    if(!window.__KGEN_12345_ROUTER_DEFAULTS_DONE__){
      window.__KGEN_12345_ROUTER_DEFAULTS_DONE__=true;
      setFestival(false);
    }
  }

  window.addEventListener('click', clickCapture, true);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  setTimeout(boot,300); setTimeout(boot,1200); setTimeout(boot,2800);
  setInterval(boot,2500);

  window.KGEN_PANEL_ROUTER = {
    VERSION, boot, setHeartSystem, setRightRules, toggleRightRules, setFestival, toggleFestival, setHeartMap, toggleHeartMap, toggleTempleConsole
  };
})();
