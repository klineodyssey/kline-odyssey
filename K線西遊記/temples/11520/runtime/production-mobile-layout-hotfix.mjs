/* KGEN_META
VERSION: 1.0.0
STATUS: ACTIVE_FORWARD_ONLY_HOTFIX
FORMAL_ORGAN_NAME: 11520 Production Mobile Layout Hotfix
PURPOSE: Late mobile-only ownership layer for production. Removes legacy drawer pills, retires the duplicate legacy Y joystick, restores the canonical three-rail group, keeps chat on the right utility lane, and prevents the real-trading preflight from floating through the player scene. UI-only; no wallet, trading, chain, asset, signer, payment, treasury, governance, or private-key mutation.
*/
const $=s=>document.querySelector(s);
const MOBILE_MAX=420;

function ensureStyle(){
  let style=$('#k11520ProductionMobileLayoutHotfix');
  if(!style){style=document.createElement('style');style.id='k11520ProductionMobileLayoutHotfix';document.head.appendChild(style)}
  style.textContent=`
@media(max-width:${MOBILE_MAX}px){
  /* One mobile HUD owner only: old drawer pills caused K市場/座標/生命/地圖/參數 to float over the game. */
  .hud-drawer-toggle,#hudToggleAxes,#hudToggleTele,#hudToggleMonster,#hudToggleMap,#hudToggleParams{display:none!important;visibility:hidden!important;pointer-events:none!important;opacity:0!important}

  /* Legacy V250 Y joystick duplicates the current remaining-axis rail. */
  #yJoyV250{display:none!important;visibility:hidden!important;pointer-events:none!important}

  /* Stable top information hierarchy: market cards first, then World/Life, then minimap. */
  .axes{top:70px!important;left:6px!important;right:6px!important;height:104px!important}
  .tele,.monsterHud{top:190px!important;height:108px!important;overflow:hidden!important}
  .tele{left:6px!important;width:calc(50% - 9px)!important}
  .monsterHud{right:6px!important;width:calc(50% - 9px)!important}
  .minimapWrap{left:6px!important;top:308px!important;width:116px!important;height:134px!important}

  /* Canonical one-row rail group. No competing runtime may detach one rail. */
  #cControl,#lotsControl,#yControl{position:fixed!important;top:auto!important;bottom:max(28px,env(safe-area-inset-bottom))!important;width:42px!important;height:132px!important;right:auto!important;transform:none!important;margin:0!important;z-index:756!important;display:block!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}
  #cControl{left:166px!important}
  #lotsControl{left:216px!important}
  #yControl{left:266px!important}

  /* Attack/order stay above the rail group and do not cover the player joystick. */
  .controls .attack,.controls .order{position:fixed!important;top:auto!important;bottom:212px!important;width:58px!important;height:40px!important;z-index:770!important}
  .controls .attack{left:164px!important;right:auto!important}
  .controls .order{left:228px!important;right:auto!important}

  /* Chat belongs to the same right utility lane as wallet/music/AI/backpack. */
  #chatHandle{position:fixed!important;left:auto!important;right:5px!important;top:auto!important;bottom:350px!important;width:42px!important;min-width:42px!important;height:42px!important;border:1px solid #68e4ff66!important;border-radius:13px!important;z-index:9978!important}

  /* Keep the trading preflight readable but out of the central character/play field. */
  #k11520RealTradePreflight{position:fixed!important;right:58px!important;left:auto!important;top:auto!important;bottom:264px!important;z-index:780!important;max-width:190px!important}
  #k11520RealTradePreflight .state{max-width:190px!important}
}
`;
  return style;
}

function enforce(){
  if(typeof innerWidth==='number'&&innerWidth>MOBILE_MAX)return null;
  ensureStyle();
  for(const sel of ['.hud-drawer-toggle','#hudToggleAxes','#hudToggleTele','#hudToggleMonster','#hudToggleMap','#hudToggleParams','#yJoyV250']){
    for(const el of document.querySelectorAll(sel)){
      el.style.setProperty('display','none','important');
      el.style.setProperty('visibility','hidden','important');
      el.style.setProperty('pointer-events','none','important');
    }
  }
  const rails=[['#cControl','166px'],['#lotsControl','216px'],['#yControl','266px']];
  for(const [sel,left] of rails){const el=$(sel);if(!el)continue;for(const [k,v] of [['position','fixed'],['left',left],['right','auto'],['top','auto'],['bottom','max(28px, env(safe-area-inset-bottom))'],['width','42px'],['height','132px'],['transform','none'],['display','block'],['visibility','visible'],['opacity','1'],['pointer-events','auto'],['z-index','756']])el.style.setProperty(k,v,'important')}
  const chat=$('#chatHandle');if(chat){for(const [k,v] of [['position','fixed'],['left','auto'],['right','5px'],['top','auto'],['bottom','350px'],['width','42px'],['height','42px'],['z-index','9978']])chat.style.setProperty(k,v,'important')}
  document.documentElement.dataset.k11520ProductionMobileLayout='HOTFIX_V1';
  return true;
}

export function install11520ProductionMobileLayoutHotfix(){
  if(typeof document==='undefined')return null;
  ensureStyle();enforce();
  let busy=false;
  const observer=new MutationObserver(()=>{if(busy)return;busy=true;queueMicrotask(()=>{enforce();busy=false})});
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  globalThis.__K11520_PRODUCTION_MOBILE_LAYOUT_OBSERVER__?.disconnect?.();
  globalThis.__K11520_PRODUCTION_MOBILE_LAYOUT_OBSERVER__=observer;
  addEventListener('resize',enforce,{passive:true});
  for(const delay of [0,80,220,500,1000,1800,3000])setTimeout(enforce,delay);
  return true;
}

if(typeof document!=='undefined')install11520ProductionMobileLayoutHotfix();
