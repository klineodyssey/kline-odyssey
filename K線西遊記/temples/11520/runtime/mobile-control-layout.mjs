/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: Mobile Control Layout
PURPOSE: Final 390x844 HUD ownership for the 11520 3D controller. Keeps the XYZ plane disc, remaining-axis rail, C warp, lots, combat/order actions, wallet/backpack and dock separated without changing control semantics.
*/
const $=s=>document.querySelector(s);
const MOBILE_MAX=420;
let guard=null,timers=[];

function installStyle(){
  let s=$('#k11520MobileControlLayout');
  if(!s){s=document.createElement('style');s.id='k11520MobileControlLayout';document.head.appendChild(s)}
  s.textContent=`
@media(max-width:${MOBILE_MAX}px){
  .sliderDock{position:static!important;display:contents!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;transform:none!important;width:auto!important;height:auto!important;gap:0!important}
  #cControl,#lotsControl,#yControl{box-sizing:border-box!important;margin:0!important;transform:none!important;opacity:1!important;visibility:visible!important;pointer-events:auto!important}
  #cControl{position:fixed!important;left:170px!important;right:auto!important;top:auto!important;bottom:194px!important;width:44px!important;height:118px!important;z-index:456!important}
  #lotsControl{position:fixed!important;left:220px!important;right:auto!important;top:auto!important;bottom:194px!important;width:44px!important;height:118px!important;z-index:456!important}
  #yControl{position:fixed!important;left:auto!important;right:58px!important;top:auto!important;bottom:max(14px,env(safe-area-inset-bottom))!important;width:44px!important;height:132px!important;z-index:456!important;display:block!important}
  .controls{position:fixed!important;left:auto!important;right:56px!important;top:auto!important;bottom:146px!important;width:176px!important;height:42px!important;transform:none!important;z-index:460!important}
  .controls .skill,.controls .dodge,.controls .flat,.controls .tool{position:absolute!important;width:40px!important;height:40px!important;top:auto!important;bottom:0!important;border-radius:50%!important;font-size:11px!important}
  .controls .skill{right:0!important}.controls .flat{right:44px!important}.controls .dodge{right:88px!important}.controls .tool{right:132px!important}
  .controls .attack,.controls .order{position:fixed!important;top:auto!important;bottom:320px!important;width:54px!important;height:38px!important;border-radius:11px!important;font-size:9px!important;line-height:1.05!important;z-index:470!important}
  .controls .attack{left:170px!important;right:auto!important}.controls .order{left:228px!important;right:auto!important}
}
`;
}
function setImportant(el,key,value){if(el)el.style.setProperty(key,value,'important')}
function applyRail(){const el=$('#yControl');if(!el||innerWidth>MOBILE_MAX)return;for(const [k,v] of [['position','fixed'],['left','auto'],['right','58px'],['top','auto'],['bottom','max(14px, env(safe-area-inset-bottom))'],['width','44px'],['height','132px'],['display','block'],['transform','none'],['margin','0'],['z-index','456'],['opacity','1'],['visibility','visible'],['pointer-events','auto']])setImportant(el,k,v);el.dataset.k11520MobileLayout='remaining-axis-rail'}
function apply(){installStyle();applyRail();const report=measure();globalThis.__K11520_MOBILE_CONTROL_LAYOUT__=report;return report}
function overlap(a,b,pad=0){return !!a&&!!b&&a.left<b.right-pad&&a.right>b.left+pad&&a.top<b.bottom-pad&&a.bottom>b.top+pad}
function rect(sel){const e=$(sel);if(!e)return null;const r=e.getBoundingClientRect();return{x:r.x,y:r.y,left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function measure(){
  const report={viewport:{width:innerWidth,height:innerHeight},joy:rect('#joy'),axisRail:rect('#yControl'),warp:rect('#cControl'),lots:rect('#lotsControl'),attack:rect('#attack'),order:rect('#orderFire'),minimap:rect('.minimapWrap'),wallet:rect('#walletPanel'),backpack:rect('#backpackButton'),dock:rect('#dock')};
  report.overlaps={warpMinimap:overlap(report.warp,report.minimap),lotsMinimap:overlap(report.lots,report.minimap),warpLots:overlap(report.warp,report.lots),railDock:overlap(report.axisRail,report.dock),attackWarp:overlap(report.attack,report.warp),orderLots:overlap(report.order,report.lots)};
  report.ok=innerWidth>MOBILE_MAX||Object.values(report.overlaps).every(v=>!v);
  document.documentElement.dataset.k11520MobileControlLayout=report.ok?'PASS':'RED';
  return report;
}
function installGuard(){
  try{guard?.disconnect()}catch{}
  const rail=$('#yControl');if(rail){let busy=false;guard=new MutationObserver(()=>{if(busy||innerWidth>MOBILE_MAX)return;busy=true;applyRail();queueMicrotask(()=>{busy=false})});guard.observe(rail,{attributes:true,attributeFilter:['style','class']})}
  timers.forEach(clearTimeout);timers=[];for(const delay of [0,90,240,520,1100,1900,2600])timers.push(setTimeout(apply,delay));
}
export function install11520MobileControlLayout(){apply();installGuard();addEventListener('resize',apply,{passive:true});return globalThis.__K11520_MOBILE_CONTROL_LAYOUT__}
export function get11520MobileControlLayout(){return measure()}
