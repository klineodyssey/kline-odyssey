/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: Mobile Control Layout
PURPOSE: Final 390x844 HUD ownership for the 11520 3D controller. Keeps the XYZ plane disc, remaining-axis rail, C warp, lots, combat/order actions, wallet/backpack and dock separated without changing control semantics. Human-directed 2026-09-09 layout keeps Wall Street on the second brand row, moves world/life panels below market cards, aligns C/lots with the remaining-axis rail, adds signed energy presentation, relocates the wallet button to the right rail, and provides a verified master HUD collapse/restore switch.
*/
const $=s=>document.querySelector(s);
const MOBILE_MAX=420;
let guard=null,brandGuard=null,energyTimer=null,timers=[];

function installStyle(){
  let s=$('#k11520MobileControlLayout');
  if(!s){s=document.createElement('style');s.id='k11520MobileControlLayout';document.head.appendChild(s)}
  s.textContent=`
@media(max-width:${MOBILE_MAX}px){
  /* Header: keep the place name on row 1 and Wall Street on the metadata row. */
  .brand .hqLine{white-space:nowrap!important;font-size:12px!important}
  .brand .brandMetaV250{display:flex!important;align-items:center!important;gap:4px!important;font-size:8px!important;white-space:nowrap!important}
  #k11520DistrictLine{order:-1;color:#f1ca73!important;font-weight:900!important}

  /* Market cards stay where they are; world/life start only after the cards. */
  .tele,.monsterHud{top:208px!important;height:86px!important;padding:7px!important;font-size:7px!important;overflow:hidden!important}
  .tele{left:6px!important;width:calc(50% - 9px)!important}
  .monsterHud{right:6px!important;width:calc(50% - 9px)!important}
  .monsterHud details[open]{position:absolute;left:6px;right:6px;top:42px;max-height:126px;padding:5px;border-radius:8px;background:#071018f5;border:1px solid #68e4ff33;z-index:3}
  .monsterHud details[open] #monsterList{max-height:96px}
  .monsterHud summary{font-size:7px}#monsterList{max-height:42px;overflow:auto;font-size:6.5px;line-height:1.15}
  .minimapWrap{left:6px!important;top:306px!important;width:116px!important;height:134px!important;padding:5px!important}
  .minimapWrap #minimap{width:104px!important;height:94px!important}.minimapWrap small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  /* Bottom controller cluster: XYZ disc | C | lots | remaining-axis rail. */
  .sliderDock{position:static!important;display:contents!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:auto!important;height:auto!important;gap:0!important}
  #cControl,#lotsControl,#yControl{box-sizing:border-box!important;margin:0!important;transform:none!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}
  #cControl{position:fixed!important;left:166px!important;right:auto!important;top:auto!important;bottom:max(14px,env(safe-area-inset-bottom))!important;width:44px!important;height:132px!important;z-index:456!important}
  #lotsControl{position:fixed!important;left:214px!important;right:auto!important;top:auto!important;bottom:max(14px,env(safe-area-inset-bottom))!important;width:44px!important;height:132px!important;z-index:456!important}
  #yControl{position:fixed!important;left:auto!important;right:58px!important;top:auto!important;bottom:max(14px,env(safe-area-inset-bottom))!important;width:44px!important;height:132px!important;z-index:456!important;display:block!important}
  #yControl .read{opacity:0!important}
  #k11520SignedEnergy{position:absolute;z-index:12;left:-31px;right:-31px;bottom:2px;text-align:center;font:900 8px system-ui,"Noto Sans TC",sans-serif;white-space:nowrap;pointer-events:none;text-shadow:0 1px 3px #000}
  #yControl.energy-positive{border-color:#65e798!important;box-shadow:0 0 16px #65e79844!important}#yControl.energy-positive #k11520SignedEnergy{color:#65e798!important}
  #yControl.energy-negative{border-color:#ff737a!important;box-shadow:0 0 16px #ff737a44!important}#yControl.energy-negative #k11520SignedEnergy{color:#ff737a!important}
  #yControl.energy-zero #k11520SignedEnergy{color:#f1ca73!important}

  /* Action rows move down with the world/life stack, while staying clear of the controller cluster. */
  .controls{position:fixed!important;left:auto!important;right:56px!important;top:auto!important;bottom:154px!important;width:176px!important;height:42px!important;transform:none!important;z-index:460!important}
  .controls .skill,.controls .dodge,.controls .flat,.controls .tool{position:absolute!important;width:40px!important;height:40px!important;top:auto!important;bottom:0!important;border-radius:50%!important;font-size:11px!important}
  .controls .skill{right:0!important}.controls .flat{right:44px!important}.controls .dodge{right:88px!important}.controls .tool{right:132px!important}
  .controls .attack,.controls .order{position:fixed!important;top:auto!important;bottom:270px!important;width:54px!important;height:38px!important;border-radius:11px!important;font-size:9px!important;line-height:1.05!important;z-index:470!important}
  .controls .attack{left:170px!important;right:auto!important}.controls .order{left:228px!important;right:auto!important}

  /* Wallet quick button joins the right-side utility rail when collapsed. */
  #walletPanel.collapsed{right:5px!important;left:auto!important;bottom:238px!important;width:46px!important;height:46px!important;padding:4px!important}
  #walletPanel.collapsed #walletToggle{width:36px!important;height:36px!important}

  #hudMasterToggle{position:fixed;z-index:3300;right:5px;bottom:290px;width:42px;height:42px;border-radius:13px;border:1px solid #68e4ff66;background:#101923f2;color:#9eeeff;font:900 11px system-ui;display:grid;place-items:center;box-shadow:0 7px 20px #0009;touch-action:manipulation}
  html.k11520HudCollapsed #hudMasterToggle{bottom:max(10px,env(safe-area-inset-bottom));color:#f1ca73}
  html.k11520HudCollapsed .top,html.k11520HudCollapsed .axes,html.k11520HudCollapsed .tele,html.k11520HudCollapsed .monsterHud,html.k11520HudCollapsed .minimapWrap,html.k11520HudCollapsed .joyWrap,html.k11520HudCollapsed .controls,html.k11520HudCollapsed .sliderDock,html.k11520HudCollapsed #cControl,html.k11520HudCollapsed #lotsControl,html.k11520HudCollapsed #yControl,html.k11520HudCollapsed #yJoyV250,html.k11520HudCollapsed #walletPanel,html.k11520HudCollapsed #backpackButton,html.k11520HudCollapsed .bagRelocatedV250,html.k11520HudCollapsed #aiChatButton,html.k11520HudCollapsed #bgmButton,html.k11520HudCollapsed .dock,html.k11520HudCollapsed .waypointAction{display:none!important}
}
`;
}
function setImportant(el,key,value){if(el)el.style.setProperty(key,value,'important')}
function applyRail(){const el=$('#yControl');if(!el||innerWidth>MOBILE_MAX)return;for(const [k,v] of [['position','fixed'],['left','auto'],['right','58px'],['top','auto'],['bottom','max(14px, env(safe-area-inset-bottom))'],['width','44px'],['height','132px'],['display','block'],['transform','none'],['margin','0'],['z-index','456'],['opacity','1'],['visibility','visible'],['pointer-events','auto']])setImportant(el,k,v);el.dataset.k11520MobileLayout='remaining-axis-rail'}
function normalizeBrand(){if(innerWidth>MOBILE_MAX)return false;const line=$('.brand .hqLine'),meta=$('.brand .brandMetaV250');if(!line||!meta)return false;const place=line.querySelector('span:last-child');if(place&&/11520/.test(place.textContent||''))place.textContent='11520 花果山美國';let district=$('#k11520DistrictLine');if(!district){district=document.createElement('span');district.id='k11520DistrictLine';district.textContent='（華爾街）';meta.appendChild(district)}return true}
function installBrandGuard(){try{brandGuard?.disconnect()}catch{}const brand=$('.brand');if(!brand)return;let busy=false;brandGuard=new MutationObserver(()=>{if(busy)return;busy=true;normalizeBrand();queueMicrotask(()=>busy=false)});brandGuard.observe(brand,{childList:true,characterData:true,subtree:true})}
function signedEnergy(){const rail=$('#yControl'),raw=$('#yRead')?.textContent||'';if(!rail||innerWidth>MOBILE_MAX)return null;let out=$('#k11520SignedEnergy');if(!out){out=document.createElement('div');out.id='k11520SignedEnergy';rail.appendChild(out)}const axis=(raw.match(/\b([XYZ])\b/i)?.[1]||globalThis.__K11520_3D_CONTROL__?.railAxis||'Y').toUpperCase();const m=raw.match(/[-+]?\d+(?:\.\d+)?/),value=m?Number(m[0]):0;rail.classList.remove('energy-positive','energy-negative','energy-zero');if(value>0){rail.classList.add('energy-positive');out.textContent=`${axis} 正能階 +${Math.abs(value).toFixed(1)}`}else if(value<0){rail.classList.add('energy-negative');out.textContent=`${axis} 負能階 −${Math.abs(value).toFixed(1)}`}else{rail.classList.add('energy-zero');out.textContent=`${axis} 能階 0.0`}rail.dataset.k11520SignedEnergy=String(value);return{axis,value,state:value>0?'POSITIVE':value<0?'NEGATIVE':'ZERO'}}
function installSignedEnergy(){clearInterval(energyTimer);signedEnergy();energyTimer=setInterval(signedEnergy,120)}
function masterTargets(){return['.top','.axes','.tele','.monsterHud','.minimapWrap','.joyWrap','.controls','#cControl','#lotsControl','#yControl','#walletPanel','#backpackButton','#aiChatButton','#bgmButton','.dock'].map(s=>$(s)).filter(Boolean)}
function updateMasterButton(){const b=$('#hudMasterToggle'),collapsed=document.documentElement.classList.contains('k11520HudCollapsed');if(!b)return;b.textContent=collapsed?'展':'收';b.title=collapsed?'展開全部 HUD':'收合全部 HUD';b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',collapsed?'true':'false')}
function verifyMasterCollapse(){const root=document.documentElement,b=$('#hudMasterToggle');if(!b||innerWidth>MOBILE_MAX)return{ok:innerWidth>MOBILE_MAX,skipped:innerWidth>MOBILE_MAX};const was=root.classList.contains('k11520HudCollapsed');root.classList.add('k11520HudCollapsed');const hidden=masterTargets().map(el=>({id:el.id||el.className,hidden:getComputedStyle(el).display==='none'}));const buttonVisible=getComputedStyle(b).display!=='none'&&b.getBoundingClientRect().width>0;if(!was)root.classList.remove('k11520HudCollapsed');updateMasterButton();const report={ok:hidden.every(x=>x.hidden)&&buttonVisible,hidden,buttonVisible};root.dataset.k11520MasterCollapseQa=report.ok?'PASS':'RED';globalThis.__K11520_MASTER_COLLAPSE_QA__=report;return report}
function installMasterCollapse(){let b=$('#hudMasterToggle');if(!b){b=document.createElement('button');b.id='hudMasterToggle';b.type='button';document.body.appendChild(b);b.addEventListener('click',()=>{document.documentElement.classList.toggle('k11520HudCollapsed');updateMasterButton()})}updateMasterButton();return verifyMasterCollapse()}
function overlap(a,b,pad=0){return !!a&&!!b&&a.left<b.right-pad&&a.right>b.left+pad&&a.top<b.bottom-pad&&a.bottom>b.top+pad}
function rect(sel){const e=$(sel);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function measure(){
  const report={viewport:{width:innerWidth,height:innerHeight},joy:rect('#joy'),axisRail:rect('#yControl'),warp:rect('#cControl'),lots:rect('#lotsControl'),attack:rect('#attack'),order:rect('#orderFire'),minimap:rect('.minimapWrap'),world:rect('.tele'),life:rect('.monsterHud'),wallet:rect('#walletPanel'),backpack:rect('#backpackButton'),dock:rect('#dock'),master:rect('#hudMasterToggle'),signedEnergy:signedEnergy(),masterCollapseQa:globalThis.__K11520_MASTER_COLLAPSE_QA__||null};
  report.overlaps={warpMinimap:overlap(report.warp,report.minimap),lotsMinimap:overlap(report.lots,report.minimap),warpLots:overlap(report.warp,report.lots),railDock:overlap(report.axisRail,report.dock),attackWarp:overlap(report.attack,report.warp),orderLots:overlap(report.order,report.lots),worldLife:overlap(report.world,report.life)};
  report.equalWorldLifeWidth=!report.world||!report.life||Math.abs(report.world.width-report.life.width)<=2;
  report.ok=innerWidth>MOBILE_MAX||(Object.values(report.overlaps).every(v=>!v)&&report.equalWorldLifeWidth&&(report.masterCollapseQa?.ok!==false));
  document.documentElement.dataset.k11520MobileControlLayout=report.ok?'PASS':'RED';
  return report;
}
function apply(){installStyle();applyRail();normalizeBrand();signedEnergy();installMasterCollapse();const report=measure();globalThis.__K11520_MOBILE_CONTROL_LAYOUT__=report;return report}
function installGuard(){
  try{guard?.disconnect()}catch{}
  const rail=$('#yControl');if(rail){let busy=false;guard=new MutationObserver(()=>{if(busy||innerWidth>MOBILE_MAX)return;busy=true;applyRail();signedEnergy();queueMicrotask(()=>{busy=false})});guard.observe(rail,{attributes:true,attributeFilter:['style','class']})}
  installBrandGuard();installSignedEnergy();timers.forEach(clearTimeout);timers=[];for(const delay of [0,90,240,520,1100,1900,2600])timers.push(setTimeout(apply,delay));
}
export function install11520MobileControlLayout(){apply();installGuard();addEventListener('resize',apply,{passive:true});return globalThis.__K11520_MOBILE_CONTROL_LAYOUT__}
export function get11520MobileControlLayout(){return measure()}
