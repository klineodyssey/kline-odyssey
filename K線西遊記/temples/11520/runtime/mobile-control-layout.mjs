/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: Mobile Control Layout
VERSION: 1.1.2
REVISION: 2026-09-09.HUMAN-3RAIL-HUD
PURPOSE: Human-directed 390x844 HUD ownership. Keeps C warp, lots and the active remaining XYZ axis as one bottom three-rail group; moves wallet/chat to the right organ rail; prevents market cards from covering world/life HUD; provides signed energy presentation and a tested master HUD collapse without changing XYZ or trading semantics.
*/
const $=s=>document.querySelector(s);
const MOBILE_MAX=420;
let guard=null,timers=[],energyTimer=null,collapseBound=false;

function installStyle(){
  let s=$('#k11520MobileControlLayout');
  if(!s){s=document.createElement('style');s.id='k11520MobileControlLayout';document.head.appendChild(s)}
  s.textContent=`
@media(max-width:${MOBILE_MAX}px){
  .brand .hqLine{white-space:nowrap!important}
  .brand .brandMetaV250{white-space:nowrap!important;gap:4px!important}
  .brand .hqDistrictV111{color:#f1ca73!important;font-weight:900!important}
  .axes{z-index:250!important}
  .tele,.monsterHud{top:190px!important;height:86px!important}
  .tele{left:6px!important;width:calc(50% - 9px)!important}
  .monsterHud{right:6px!important;width:calc(50% - 9px)!important}
  .minimapWrap{top:286px!important}

  .sliderDock{position:static!important;display:contents!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:auto!important;height:auto!important;gap:0!important}
  #cControl,#lotsControl,#yControl{box-sizing:border-box!important;margin:0!important;transform:none!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important;position:fixed!important;top:auto!important;bottom:max(16px,env(safe-area-inset-bottom))!important;width:44px!important;height:132px!important;z-index:456!important;display:block!important}
  #cControl{left:170px!important;right:auto!important}
  #lotsControl{left:218px!important;right:auto!important}
  #yControl{left:266px!important;right:auto!important}
  #yControl .track{background:linear-gradient(to bottom,#123f32 0%,#123f32 48%,#25313a 48%,#25313a 52%,#4b2029 52%,#4b2029 100%)!important;box-shadow:inset 0 0 0 1px #ffffff0c!important}
  #yControl[data-energy-sign="positive"]{border-color:#65e79899!important;box-shadow:0 0 16px #65e79822!important}
  #yControl[data-energy-sign="negative"]{border-color:#ff737a99!important;box-shadow:0 0 16px #ff737a22!important}
  #yControl[data-energy-sign="zero"]{border-color:#a77b3570!important}
  #yControl[data-energy-sign="positive"] #k11520EnergyRead{color:#65e798!important}
  #yControl[data-energy-sign="negative"] #k11520EnergyRead{color:#ff737a!important}
  #yControl[data-energy-sign="zero"] #k11520EnergyRead{color:#f1ca73!important}
  #k11520EnergyRead{position:absolute;left:-18px;right:-18px;bottom:-18px;text-align:center;font-size:8px;font-weight:900;white-space:nowrap;pointer-events:none;text-shadow:0 1px 2px #000}

  .controls{position:fixed!important;left:auto!important;right:56px!important;top:auto!important;bottom:158px!important;width:176px!important;height:42px!important;transform:none!important;z-index:460!important}
  .controls .skill,.controls .dodge,.controls .flat,.controls .tool{position:absolute!important;width:40px!important;height:40px!important;top:auto!important;bottom:0!important;border-radius:50%!important;font-size:11px!important}
  .controls .skill{right:0!important}.controls .flat{right:44px!important}.controls .dodge{right:88px!important}.controls .tool{right:132px!important}
  .controls .attack,.controls .order{position:fixed!important;top:auto!important;bottom:320px!important;width:54px!important;height:38px!important;border-radius:11px!important;font-size:9px!important;line-height:1.05!important;z-index:470!important}
  .controls .attack{left:170px!important;right:auto!important}.controls .order{left:228px!important;right:auto!important}

  #walletPanel{right:54px!important}
  #walletPanel.collapsed{right:5px!important;bottom:234px!important;width:42px!important;height:44px!important;padding:4px!important}
  #walletPanel.collapsed #walletToggle{width:32px!important;height:34px!important}
  #aiChatButton{right:5px!important;left:auto!important;bottom:134px!important;width:42px!important;height:42px!important}
  #bgmButton{right:5px!important;left:auto!important;bottom:184px!important;width:42px!important;height:42px!important}
  .bagRelocatedV250{right:5px!important;left:auto!important;bottom:84px!important}
  .dock,.dock.open{right:5px!important;left:auto!important}

  #k11520HudCollapseAll{position:fixed;z-index:3050;right:5px;top:286px;width:42px;height:42px;border-radius:13px;border:1px solid #68e4ff66;background:#101923ef;color:#dffaff;font:900 16px system-ui;display:grid;place-items:center;touch-action:manipulation}
  html.k11520HudCollapsed .top,
  html.k11520HudCollapsed .axes,
  html.k11520HudCollapsed .tele,
  html.k11520HudCollapsed .monsterHud,
  html.k11520HudCollapsed .minimapWrap,
  html.k11520HudCollapsed .joyWrap,
  html.k11520HudCollapsed #cControl,
  html.k11520HudCollapsed #lotsControl,
  html.k11520HudCollapsed #yControl,
  html.k11520HudCollapsed .controls,
  html.k11520HudCollapsed #walletPanel,
  html.k11520HudCollapsed .bagRelocatedV250,
  html.k11520HudCollapsed #aiChatButton,
  html.k11520HudCollapsed #bgmButton,
  html.k11520HudCollapsed .dock{display:none!important}
}
`;
}
function setImportant(el,key,value){if(el)el.style.setProperty(key,value,'important')}
function applyRail(){
  if(innerWidth>MOBILE_MAX)return;
  const specs=[['#cControl','170px'],['#lotsControl','218px'],['#yControl','266px']];
  for(const [sel,left] of specs){const el=$(sel);if(!el)continue;for(const [k,v] of [['position','fixed'],['left',left],['right','auto'],['top','auto'],['bottom','max(16px, env(safe-area-inset-bottom))'],['width','44px'],['height','132px'],['display','block'],['transform','none'],['margin','0'],['z-index','456'],['opacity','1'],['visibility','visible'],['pointer-events','auto']])setImportant(el,k,v);el.dataset.k11520MobileLayout='three-rail-group'}
}
function applyRightOrgans(){
  if(innerWidth>MOBILE_MAX)return;
  const wallet=$('#walletPanel');
  if(wallet){setImportant(wallet,'position','fixed');setImportant(wallet,'left','auto');setImportant(wallet,'top','auto');if(wallet.classList.contains('collapsed')){for(const [k,v] of [['right','5px'],['bottom','234px'],['width','42px'],['height','44px'],['padding','4px']])setImportant(wallet,k,v)}else{setImportant(wallet,'right','54px');setImportant(wallet,'bottom','206px')}}
  const organs=[['#aiChatButton','134px'],['#bgmButton','184px'],['.bagRelocatedV250','84px']];
  for(const [sel,bottom] of organs){const el=$(sel);if(!el)continue;setImportant(el,'position','fixed');setImportant(el,'left','auto');setImportant(el,'right','5px');setImportant(el,'bottom',bottom);if(sel!==' .bagRelocatedV250'){setImportant(el,'width','42px');setImportant(el,'height','42px')}}
  const dock=$('#dock');if(dock){setImportant(dock,'left','auto');setImportant(dock,'right','5px')}
}
function normalizeBrand(){
  const line=$('.brand .hqLine'),meta=$('.brand .brandMetaV250');if(!line||!meta)return false;
  const text=(line.textContent||'').replace(/\s+/g,' ').trim();
  if(text.includes('（華爾街）'))line.innerHTML='<span class="hqFlag" aria-hidden="true">🇺🇸</span><span>11520 花果山美國</span>';
  let district=meta.querySelector('.hqDistrictV111');if(!district){district=document.createElement('span');district.className='hqDistrictV111';district.textContent='（華爾街）';const clock=meta.querySelector('.brandClockV250');meta.insertBefore(district,clock||null)}
  return true;
}
function installEnergyRead(){
  const rail=$('#yControl');if(!rail)return false;
  let out=$('#k11520EnergyRead');if(!out){out=document.createElement('div');out.id='k11520EnergyRead';rail.appendChild(out)}
  const paint=()=>{
    const ctl=globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null;
    const axis=String(ctl?.railAxis||'Y').toUpperCase(),key=axis.toLowerCase();
    const world=globalThis.__K11520_WORLD_COORDS__||null;
    const raw=Number(world?.intent?.[key]??ctl?.rail?.value??0),v=Number.isFinite(raw)?raw:0;
    const sign=v>0.0001?'positive':v<-0.0001?'negative':'zero';rail.dataset.energySign=sign;
    out.textContent=`${axis} 能階 ${v>0?'+':''}${v.toFixed(1)}`;
  };
  paint();clearInterval(energyTimer);energyTimer=setInterval(paint,100);return true;
}
function installMasterCollapse(){
  let b=$('#k11520HudCollapseAll');if(!b){b=document.createElement('button');b.id='k11520HudCollapseAll';b.type='button';b.setAttribute('aria-label','總收合或展開 HUD');document.body.appendChild(b)}
  const sync=()=>{const collapsed=document.documentElement.classList.contains('k11520HudCollapsed');b.textContent=collapsed?'▣':'▤';b.title=collapsed?'展開全部 HUD':'總收合 HUD';b.setAttribute('aria-expanded',String(!collapsed));document.documentElement.dataset.k11520HudCollapsed=collapsed?'1':'0'};
  if(!collapseBound){b.addEventListener('click',()=>{document.documentElement.classList.toggle('k11520HudCollapsed');sync()});collapseBound=true}sync();return true;
}
function apply(){installStyle();applyRail();applyRightOrgans();normalizeBrand();installEnergyRead();installMasterCollapse();const report=measure();globalThis.__K11520_MOBILE_CONTROL_LAYOUT__=report;return report}
function overlap(a,b,pad=0){return !!a&&!!b&&a.left<b.right-pad&&a.right>b.left+pad&&a.top<b.bottom-pad&&a.bottom>b.top+pad}
function rect(sel){const e=$(sel);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function measure(){
  const report={viewport:{width:innerWidth,height:innerHeight},joy:rect('#joy'),axisRail:rect('#yControl'),warp:rect('#cControl'),lots:rect('#lotsControl'),attack:rect('#attack'),order:rect('#orderFire'),minimap:rect('.minimapWrap'),wallet:rect('#walletPanel'),backpack:rect('.bagRelocatedV250'),chat:rect('#aiChatButton'),dock:rect('#dock'),worldHud:rect('.tele'),lifeHud:rect('.monsterHud'),masterCollapse:rect('#k11520HudCollapseAll')};
  report.threeRailAligned=innerWidth>MOBILE_MAX||Boolean(report.warp&&report.lots&&report.axisRail&&Math.abs(report.warp.top-report.lots.top)<2&&Math.abs(report.lots.top-report.axisRail.top)<2&&report.warp.right<=report.lots.left&&report.lots.right<=report.axisRail.left);
  report.equalWorldLifeWidth=innerWidth>MOBILE_MAX||Boolean(report.worldHud&&report.lifeHud&&Math.abs(report.worldHud.width-report.lifeHud.width)<2);
  report.overlaps={warpLots:overlap(report.warp,report.lots),lotsRail:overlap(report.lots,report.axisRail),warpRail:overlap(report.warp,report.axisRail),railDock:overlap(report.axisRail,report.dock),attackWarp:overlap(report.attack,report.warp),orderLots:overlap(report.order,report.lots),worldLife:overlap(report.worldHud,report.lifeHud)};
  report.collapsed=document.documentElement.classList.contains('k11520HudCollapsed');
  report.ok=innerWidth>MOBILE_MAX||(report.threeRailAligned&&report.equalWorldLifeWidth&&Object.values(report.overlaps).every(v=>!v));
  document.documentElement.dataset.k11520MobileControlLayout=report.ok?'PASS':'RED';
  return report;
}
function installGuard(){
  try{guard?.disconnect()}catch{}
  const roots=[$('#yControl'),$('#cControl'),$('#lotsControl'),$('#walletPanel'),$('#aiChatButton'),$('#bgmButton'),$('.bagRelocatedV250'),$('#dock')].filter(Boolean);if(roots.length){let busy=false;guard=new MutationObserver(()=>{if(busy||innerWidth>MOBILE_MAX)return;busy=true;applyRail();applyRightOrgans();queueMicrotask(()=>{busy=false})});for(const root of roots)guard.observe(root,{attributes:true,attributeFilter:['style','class']})}
  timers.forEach(clearTimeout);timers=[];for(const delay of [0,90,240,520,1100,1900,2600])timers.push(setTimeout(apply,delay));
}
export function install11520MobileControlLayout(){apply();installGuard();addEventListener('resize',apply,{passive:true});return globalThis.__K11520_MOBILE_CONTROL_LAYOUT__}
export function get11520MobileControlLayout(){return measure()}
