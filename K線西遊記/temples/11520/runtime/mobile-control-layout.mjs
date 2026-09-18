import './market-origin-wallet-layout-runtime.mjs';
/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: Mobile Control Layout
VERSION: 1.3.7
REVISION: 2026-09-17.MOBILE-UTILITY-AND-ENERGY-GEOMETRY
PURPOSE: Preserve approved HUD anchors across mobile widths; center the normal-axis energy rail in the mobile viewport, own its track/thumb horizontal geometry, place signed-C and positive lot rails to its right without overlap, preserve Market/Wallet utility-layout ownership, and measure actual market-card content before placing status. Thumb travel is presentation-only; no wallet identity, chain, payment, treasury or governance mutation.
*/
const $=s=>document.querySelector(s);
const MOBILE_MAX=600;
let booted=false,flowObserver=null,guard=null,timers=[],energyTimer=null,energyLabelGuard=null,collapseBound=false;
const thumbObservers=new WeakMap();
const hudCollapsed=()=>document.documentElement.classList.contains('k11520HudCollapsed');
function installStyle(){
  let s=$('#k11520MobileControlLayout');
  if(!s){s=document.createElement('style');s.id='k11520MobileControlLayout';document.head.appendChild(s)}
  const css=`
@media(max-width:${MOBILE_MAX}px){
  .hud-drawer-toggle,#yJoyV250{display:none!important;visibility:hidden!important;pointer-events:none!important}
  .top{left:6px!important;right:6px!important;height:58px!important;padding:7px 8px!important;gap:5px!important}
  .brand{min-width:0!important}.brand b{font-size:12px!important}
  .brand .hqLine{white-space:nowrap!important}
  html[data-k11520-layout-owner] .brand .brandMetaV250{font-size:8px!important;white-space:normal!important;flex-wrap:wrap!important;column-gap:4px!important;row-gap:1px!important;line-height:1.05!important}
  html[data-k11520-layout-owner] .brand .brandMetaV250>span{white-space:nowrap!important}
  .brand .hqDistrictV111{color:#f1ca73!important;font-weight:900!important}
  .pill{padding:5px 6px!important}.pill b{font-size:12px!important}
  .axes{top:70px!important;left:6px!important;right:6px!important;height:auto!important;min-height:104px!important;gap:4px!important;align-items:stretch!important;z-index:250!important}
  .axis{min-width:0!important;padding:5px!important}.axis select{font-size:8px!important;padding:5px 3px!important}.axis .q{font-size:12px!important}.axis .pos{font-size:7px!important}
  .universeFloorBadge{font-size:6px!important;overflow:hidden;text-overflow:ellipsis}
  #joy.joyWrap{left:14px!important;width:min(146px,calc(50vw - 44px))!important;height:min(146px,calc(50vw - 44px))!important;bottom:max(16px,env(safe-area-inset-bottom))!important}
  #joy{--guideSize:98px;--knobSize:62px}
  #cControl .track,#lotsControl .track{left:8px!important;right:8px!important;top:27px!important;bottom:24px!important;min-width:0!important}
  #yControl .track{left:50%!important;right:auto!important;top:27px!important;bottom:24px!important;width:26px!important;min-width:0!important;transform:translateX(-50%)!important;background:linear-gradient(to bottom,#123f32 0%,#123f32 49.5%,#2b343b 49.5%,#2b343b 50.5%,#4b2029 50.5%,#4b2029 100%)!important;box-shadow:inset 0 0 0 1px #ffffff0c!important}
  #k11520RealTradePreflight{right:58px!important;bottom:264px!important;max-width:190px!important}
  #cControl::after,#lotsControl::after{display:none!important}
  .tele,.monsterHud{top:var(--k11520-status-top,190px)!important;height:var(--k11520-status-height,108px)!important;padding:7px!important;font-size:7px!important}
  .tele{left:6px!important;width:calc(50% - 9px)!important}
  .monsterHud{right:6px!important;width:calc(50% - 9px)!important}
  html.k11520UtilitiesOpen .tele{width:calc(50% - 36px)!important}
  html.k11520UtilitiesOpen .monsterHud{right:60px!important;width:calc(50% - 36px)!important}
  .minimapWrap{top:var(--k11520-map-top,308px)!important;left:6px!important;width:116px!important;height:134px!important;padding:5px!important}.minimapWrap #minimap{width:104px!important;height:94px!important}
  #knob{will-change:transform!important}
  .sliderDock{position:static!important;display:contents!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:auto!important;height:auto!important;gap:0!important}
  #cControl,#lotsControl,#yControl{box-sizing:border-box!important;margin:0!important;transform:none!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;position:fixed!important;top:auto!important;bottom:max(28px,env(safe-area-inset-bottom))!important;width:42px!important;height:132px!important;z-index:456!important;display:block!important}
  #yControl{left:calc(50% - 21px)!important;right:auto!important}
  #cControl{left:calc(50% + 29px)!important;right:auto!important}
  #lotsControl{left:calc(50% + 79px)!important;right:auto!important}
  #cControl label,#lotsControl label,#yControl label{top:5px!important;font-size:7px!important;line-height:1.05!important;font-weight:900!important;white-space:nowrap!important;text-shadow:0 1px 2px #000!important}
  html[data-k11520-layout-owner] #cControl .read,html[data-k11520-layout-owner] #lotsControl .read,html[data-k11520-layout-owner] #yControl .read{bottom:4px!important;font-size:7px!important;line-height:1!important;font-weight:900!important;white-space:nowrap!important;text-shadow:0 1px 2px #000!important}
  #cControl .thumb,#lotsControl .thumb,#yControl .thumb{box-sizing:border-box!important;left:50%!important;width:34px!important;height:34px!important;min-width:34px!important;min-height:34px!important;max-width:34px!important;max-height:34px!important;aspect-ratio:1/1!important;flex:0 0 34px!important;flex-shrink:0!important;border-radius:50%!important;transform:translate(-50%,-50%)!important;overflow:hidden!important;top:calc(44px + var(--k11520-thumb-ratio,.5)*47px)!important}
  #yThumb{border:2px solid #f1ca73!important;background:#111 url('./assets/wukong-y-control.jpg') 38% 50%/cover no-repeat!important;box-shadow:0 0 0 2px #05080dcc,0 0 14px #f1ca7366!important}
  #yControl label:after{content:none!important;display:none!important}
  #yControl[data-energy-sign="nonnegative"] #yThumb{border-color:#65e798!important;box-shadow:0 0 0 2px #05080dcc,0 0 16px #65e79888!important}
  #yControl[data-energy-sign="negative"] #yThumb{border-color:#ff737a!important;box-shadow:0 0 0 2px #05080dcc,0 0 16px #ff737a88!important}
  #yControl[data-energy-sign="nonnegative"]{border-color:#65e79899!important;box-shadow:0 0 16px #65e79822!important}
  #yControl[data-energy-sign="negative"]{border-color:#ff737a99!important;box-shadow:0 0 16px #ff737a22!important}
  #yControl[data-energy-sign="nonnegative"] label,#yControl[data-energy-sign="nonnegative"] .read{color:#65e798!important}
  #yControl[data-energy-sign="negative"] label,#yControl[data-energy-sign="negative"] .read{color:#ff737a!important}
  html[data-k11520-layout-owner] .controls{position:fixed!important;left:auto!important;right:56px!important;top:auto!important;bottom:166px!important;width:176px!important;height:42px!important;transform:none!important;z-index:460!important}
  html[data-k11520-layout-owner] .controls .skill,html[data-k11520-layout-owner] .controls .dodge,html[data-k11520-layout-owner] .controls .flat,html[data-k11520-layout-owner] .controls .tool{position:absolute!important;width:40px!important;height:40px!important;top:auto!important;bottom:0!important;border-radius:50%!important;font-size:11px!important}
  .controls .skill{right:0!important}.controls .flat{right:44px!important}.controls .dodge{right:88px!important}.controls .tool{right:132px!important}
  html[data-k11520-layout-owner] .controls .attack,html[data-k11520-layout-owner] .controls .order{position:fixed!important;top:auto!important;bottom:212px!important;width:58px!important;height:40px!important;border-radius:12px!important;font-size:10px!important;line-height:1.05!important;z-index:470!important}
  html[data-k11520-layout-owner] .controls .attack{left:136px!important;right:auto!important}html[data-k11520-layout-owner] .controls .order{left:200px!important;right:auto!important}
  /* Utility geometry and styling are supplied by Market/Wallet Layout. */
  html:not(.k11520UtilitiesOpen) #walletPanel,html:not(.k11520UtilitiesOpen) #walletToggle,html:not(.k11520UtilitiesOpen) #chatHandle,html:not(.k11520UtilitiesOpen) #gameModeToggle,html:not(.k11520UtilitiesOpen) #bgmButton,html:not(.k11520UtilitiesOpen) #aiChatButton,html:not(.k11520UtilitiesOpen) #backpackButton,html:not(.k11520UtilitiesOpen) #k11520HudCollapseAll,html:not(.k11520UtilitiesOpen) #dock{display:none!important}
  html.k11520UtilitiesOpen #gameModeToggle{display:grid!important;visibility:visible!important;pointer-events:auto!important}
  body:has(#aiChatPanel.open,#gameChat.open,#backpackPanel.open,#k11520UiSettings.open,#sheet.open,#walletLaunchSheet.open) #k11520HudCollapseAll,body:has(#aiChatPanel.open,#gameChat.open,#backpackPanel.open,#k11520UiSettings.open,#sheet.open,#walletLaunchSheet.open) #k11520UtilityMaster{visibility:hidden!important;pointer-events:none!important}
  #dock.open .rail{right:58px!important}
  html.k11520HudCollapsed .top,html.k11520HudCollapsed .axes,html.k11520HudCollapsed .tele,html.k11520HudCollapsed .monsterHud,html.k11520HudCollapsed .minimapWrap,html.k11520HudCollapsed .joyWrap,html.k11520HudCollapsed #cControl,html.k11520HudCollapsed #lotsControl,html.k11520HudCollapsed #yControl,html.k11520HudCollapsed .controls,html.k11520HudCollapsed #walletPanel,html.k11520HudCollapsed #walletToggle,html.k11520HudCollapsed #chatHandle,html.k11520HudCollapsed #gameChat,html.k11520HudCollapsed .bagRelocatedV250,html.k11520HudCollapsed #backpackButton,html.k11520HudCollapsed #gameModeToggle,html.k11520HudCollapsed #aiChatButton,html.k11520HudCollapsed #bgmButton,html.k11520HudCollapsed #k11520UtilityMaster,html.k11520HudCollapsed .dock{display:none!important}
}
@media(max-width:380px){
  html[data-k11520-layout-owner] #k11520PlaneLabel{width:calc(100vw - 252px)!important}
}
`;
  if(s.textContent!==css)s.textContent=css;
}
function setImportant(el,key,value){if(el&&(el.style.getPropertyValue(key)!==value||el.style.getPropertyPriority(key)!=='important'))el.style.setProperty(key,value,'important')}
function applyRail(){
  if(innerWidth>MOBILE_MAX)return;
  globalThis.__K11520_AXIS_RAIL_GUARD__?.disconnect?.();
  const specs=[['#yControl','calc(50% - 21px)'],['#cControl','calc(50% + 29px)'],['#lotsControl','calc(50% + 79px)']];
  for(const [sel,left] of specs){const el=$(sel);if(!el)continue;if(hudCollapsed()){setImportant(el,'display','none');continue}for(const [k,v] of [['position','fixed'],['left',left],['right','auto'],['top','auto'],['bottom','max(28px, env(safe-area-inset-bottom))'],['width','42px'],['height','132px'],['display','block'],['transform','none'],['margin','0'],['z-index','456'],['opacity','1'],['visibility','visible'],['pointer-events','auto']])setImportant(el,k,v);el.dataset.k11520MobileLayout='center-normal-rail'}
}
function installThumbBounds(){
  for(const id of ['cThumb','lotsThumb','yThumb']){
    const el=$('#'+id);if(!el||thumbObservers.has(el))continue;
    const sync=()=>{
      const raw=el.style.top.trim();let ratio=.5;
      if(/^-?\d+(?:\.\d+)?%$/.test(raw))ratio=parseFloat(raw)/100;
      else if(/^-?\d+(?:\.\d+)?px$/.test(raw))ratio=parseFloat(raw)/(el.parentElement?.clientHeight||132);
      const next=String(Math.max(0,Math.min(1,ratio)));
      if(el.style.getPropertyValue('--k11520-thumb-ratio')!==next)el.style.setProperty('--k11520-thumb-ratio',next);
    };
    const observer=new MutationObserver(sync);observer.observe(el,{attributes:true,attributeFilter:['style']});thumbObservers.set(el,observer);sync();
  }
}
function applyRightOrgans(){/* Utility geometry/visibility is owned only by market-origin-wallet-layout-runtime. */}
function normalizeBrand(){
  const line=$('.brand .hqLine'),meta=$('.brand .brandMetaV250');if(!line||!meta)return false;
  const text=(line.textContent||'').replace(/\s+/g,' ').trim();
  if(text.includes('（華爾街）'))line.innerHTML='<span class="hqFlag" aria-hidden="true">🇺🇸</span><span>11520 花果山美國</span>';
  let district=meta.querySelector('.hqDistrictV111');if(!district){district=document.createElement('span');district.className='hqDistrictV111';district.textContent='（華爾街）';const clock=meta.querySelector('.brandClockV250');meta.insertBefore(district,clock||null)}
  return true;
}
function installEnergyRead(){
  const rail=$('#yControl');if(!rail)return false;
  const label=rail.querySelector('label'),out=rail.querySelector('.read');if(!label||!out)return false;
  const paint=()=>{
    const ctl=globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null;
    const axis=String(ctl?.railAxis||'Y').toUpperCase(),key=axis.toLowerCase();
    const world=globalThis.__K11520_WORLD_COORDS__||null;
    const raw=Number(world?.intent?.[key]??ctl?.rail?.value??0),v=Number.isFinite(raw)?raw:0;
    const sign=v<0?'negative':'nonnegative';rail.dataset.energySign=sign;
    const level=sign==='negative'?'負能階':'非負能階';
    const nextLabel=`${axis} 縱搖桿`;
    if(label.textContent!==nextLabel)label.textContent=nextLabel;
    const safe=Object.is(v,-0)?0:v;
    const nextRead=`${safe>0?'+':''}${safe.toFixed(1)}`;
    if(out.textContent!==nextRead)out.textContent=nextRead;
    const detail=`${axis} 縱搖桿 ${level} ${nextRead}`;
    rail.setAttribute('aria-label',detail);rail.title=detail;
  };
  paint();clearInterval(energyTimer);energyTimer=setInterval(paint,100);
  try{energyLabelGuard?.disconnect()}catch{}
  let repairing=false;
  energyLabelGuard=new MutationObserver(()=>{if(repairing)return;repairing=true;queueMicrotask(()=>{paint();repairing=false})});
  energyLabelGuard.observe(label,{childList:true,characterData:true,subtree:true});
  return true;
}
function installMasterCollapse(){
  let b=$('#k11520HudCollapseAll');if(!b){b=document.createElement('button');b.id='k11520HudCollapseAll';b.type='button';b.setAttribute('aria-label','總收合或展開 HUD');document.body.appendChild(b)}
  const sync=()=>{const collapsed=hudCollapsed();b.textContent=collapsed?'▣':'▤';b.title=collapsed?'展開全部 HUD':'總收合 HUD';b.setAttribute('aria-expanded',String(!collapsed));document.documentElement.dataset.k11520HudCollapsed=collapsed?'1':'0';applyRail();applyRightOrgans()};
  if(!collapseBound){b.addEventListener('click',()=>{document.documentElement.classList.toggle('k11520HudCollapsed');sync()});collapseBound=true}sync();return true;
}
function apply(){installStyle();document.documentElement.dataset.k11520LayoutOwner='mobile-control-layout';applyRail();installThumbBounds();applyRightOrgans();normalizeBrand();installEnergyRead();installMasterCollapse();syncStatusFlow();const report=measure();globalThis.__K11520_MOBILE_CONTROL_LAYOUT__=report;return report}
function overlap(a,b,pad=0){return !!a&&!!b&&a.left<b.right-pad&&a.right>b.left+pad&&a.top<b.bottom-pad&&a.bottom>b.top+pad}
function rect(sel){const e=$(sel);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function measure(){
  const report={version:'1.3.7',viewport:{width:innerWidth,height:innerHeight},joy:rect('#joy'),axisRail:rect('#yControl'),axisTrack:rect('#yControl .track'),axisThumb:rect('#yThumb'),warp:rect('#cControl'),lots:rect('#lotsControl'),attack:rect('#attack'),order:rect('#orderFire'),minimap:rect('.minimapWrap'),wallet:rect('#walletPanel'),backpack:rect('.bagRelocatedV250'),chat:rect('#chatHandle'),dock:rect('#dock'),marketHud:rect('.axes'),worldHud:rect('.tele'),lifeHud:rect('.monsterHud'),masterCollapse:rect('#k11520HudCollapseAll')};
  const compactNormal=innerWidth<=MOBILE_MAX&&!document.documentElement.classList.contains('k11520ImmersiveViewport')&&['.axes','.tele','.monsterHud','.minimapWrap'].every(sel=>{const e=$(sel);return !!e&&getComputedStyle(e).display==='none'});
  report.compactNormal=compactNormal;
  report.axisRailCentered=innerWidth>MOBILE_MAX||Boolean(report.axisRail&&Math.abs((report.axisRail.left+report.axisRail.width/2)-innerWidth/2)<2);
  report.axisEnergyGeometryAligned=innerWidth>MOBILE_MAX||Boolean(report.axisRail&&report.axisTrack&&report.axisThumb&&Math.abs((report.axisTrack.left+report.axisTrack.width/2)-(report.axisRail.left+report.axisRail.width/2))<1&&Math.abs((report.axisThumb.left+report.axisThumb.width/2)-(report.axisRail.left+report.axisRail.width/2))<1&&report.axisTrack.left>=report.axisRail.left&&report.axisTrack.right<=report.axisRail.right);
  report.threeRailAligned=innerWidth>MOBILE_MAX||Boolean(report.warp&&report.lots&&report.axisRail&&Math.abs(report.warp.top-report.lots.top)<2&&Math.abs(report.lots.top-report.axisRail.top)<2&&report.axisRail.right<=report.warp.left&&report.warp.right<=report.lots.left);
  report.equalWorldLifeWidth=innerWidth>MOBILE_MAX||compactNormal||Boolean(report.worldHud&&report.lifeHud&&Math.abs(report.worldHud.width-report.lifeHud.width)<2);
  report.statusBelowMarket=innerWidth>MOBILE_MAX||compactNormal||Boolean(report.marketHud&&report.worldHud&&report.lifeHud&&report.worldHud.top>=report.marketHud.bottom+8&&report.lifeHud.top>=report.marketHud.bottom+8);
  report.mapBelowStatus=innerWidth>MOBILE_MAX||compactNormal||Boolean(report.worldHud&&report.lifeHud&&report.minimap&&report.minimap.top>=Math.max(report.worldHud.bottom,report.lifeHud.bottom)+8);
  report.overlaps={joyRail:overlap(report.joy,report.axisRail),warpLots:overlap(report.warp,report.lots),lotsRail:overlap(report.lots,report.axisRail),warpRail:overlap(report.warp,report.axisRail),railDock:overlap(report.axisRail,report.dock),attackWarp:overlap(report.attack,report.warp),orderLots:overlap(report.order,report.lots),worldLife:overlap(report.worldHud,report.lifeHud),marketWorld:overlap(report.marketHud,report.worldHud),marketLife:overlap(report.marketHud,report.lifeHud),worldMap:overlap(report.worldHud,report.minimap),lifeMap:overlap(report.lifeHud,report.minimap),chatMaster:overlap(report.chat,report.masterCollapse)};
  report.collapsed=hudCollapsed();
  report.ok=innerWidth>MOBILE_MAX||(report.collapsed||report.axisRailCentered&&report.axisEnergyGeometryAligned&&report.threeRailAligned&&report.equalWorldLifeWidth&&report.statusBelowMarket&&report.mapBelowStatus&&Object.values(report.overlaps).every(v=>!v));
  document.documentElement.dataset.k11520MobileControlLayout=report.ok?'PASS':'RED';
  return report;
}
function installGuard(){
  try{guard?.disconnect()}catch{}
  const roots=[$('#yControl'),$('#cControl'),$('#lotsControl'),$('#walletPanel'),$('#chatHandle'),$('#aiChatButton'),$('#bgmButton'),$('.bagRelocatedV250'),$('#dock')].filter(Boolean);if(roots.length){let busy=false;guard=new MutationObserver(()=>{if(busy||innerWidth>MOBILE_MAX)return;busy=true;applyRail();applyRightOrgans();queueMicrotask(()=>{busy=false})});for(const root of roots)guard.observe(root,{attributes:true,attributeFilter:['style','class']})}
  timers.forEach(clearTimeout);timers=[];for(const delay of [0,90,240,520,1100,1900,2600])timers.push(setTimeout(apply,delay));
}
function syncStatusFlow(){
  if(innerWidth>MOBILE_MAX||hudCollapsed())return;
  const cards=[...document.querySelectorAll('#axes .axis')],hud=[$('.tele'),$('.monsterHud')].filter(Boolean);
  const bottom=Math.max(174,...cards.map(el=>el.getBoundingClientRect().bottom));
  const top=Math.max(190,Math.ceil(bottom+10));
  const height=Math.max(108,...hud.map(el=>{const r=el.getBoundingClientRect();return Math.ceil(Math.max(r.top,...[...el.children].map(c=>c.getBoundingClientRect().bottom))-r.top+9)}));
  for(const [key,value] of [['--k11520-status-top',`${top}px`],['--k11520-status-height',`${height}px`],['--k11520-map-top',`${top+height+10}px`]]){
    if(document.documentElement.style.getPropertyValue(key)!==value)document.documentElement.style.setProperty(key,value);
  }
}
export function install11520MobileControlLayout(){
  apply();
  if(booted)return globalThis.__K11520_MOBILE_CONTROL_LAYOUT__;
  booted=true;installGuard();addEventListener('resize',apply,{passive:true});
  if(typeof ResizeObserver==='function'){
    flowObserver=new ResizeObserver(()=>{syncStatusFlow();globalThis.__K11520_MOBILE_CONTROL_LAYOUT__=measure()});
    for(const el of [$('.axes'),$('.tele'),$('.monsterHud')].filter(Boolean))flowObserver.observe(el);
  }
  return globalThis.__K11520_MOBILE_CONTROL_LAYOUT__;
}
export function get11520MobileControlLayout(){return measure()}