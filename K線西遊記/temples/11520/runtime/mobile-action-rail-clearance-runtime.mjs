/* KGEN_META
VERSION: 1.2.0
STATUS: ACTIVE
FORMAL_ORGAN_NAME: 11520 Mobile Action Rail Clearance Runtime
PURPOSE: Keep the three bottom rails clear of the live right utility dock geometry and keep opened action/order/confirm surfaces above ordinary HUD organs. UI-only; no trading, wallet, chain, payment, treasury, governance, or secret mutation.
*/
const MOBILE_MAX=420;
const TOP_Z=12000;
const GAP=14;
const SPACING=50;
const $=s=>document.querySelector(s);

function style(){
  let s=$('#k11520MobileActionRailClearance');
  if(!s){s=document.createElement('style');s.id='k11520MobileActionRailClearance'}
  s.textContent=`
#confirm.open,.sheet.open,.confirm.open{position:fixed!important;z-index:${TOP_Z}!important;isolation:isolate!important;box-shadow:0 24px 80px #000e!important}
#confirm.open .close,.sheet.open .close,.confirm.open .close{position:relative!important;z-index:2!important}
@media(max-width:${MOBILE_MAX}px){#cControl,#lotsControl,#yControl,.controls .attack,.controls .order{right:auto!important}}
`;
  document.head.appendChild(s);
  return s;
}
function rect(el){if(!el)return null;const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function overlap(a,b){return !!a&&!!b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}
function enforceOpenSurfaceLayer(){for(const el of document.querySelectorAll('#confirm.open,.sheet.open,.confirm.open')){el.style.setProperty('position','fixed','important');el.style.setProperty('z-index',String(TOP_Z),'important');el.style.setProperty('isolation','isolate','important')}}
function placeMobileRails(){
  if(innerWidth>MOBILE_MAX)return;
  const dock=$('#dock'),rail=$('#yControl'),lots=$('#lotsControl'),c=$('#cControl');
  if(!dock||!rail||!lots||!c)return;
  const dr=dock.getBoundingClientRect(),rr=rail.getBoundingClientRect();
  const railLeft=Math.max(8,Math.min(innerWidth-rr.width-8,dr.left-rr.width-GAP));
  const lotsLeft=Math.max(8,railLeft-SPACING),cLeft=Math.max(8,lotsLeft-SPACING);
  rail.style.setProperty('left',`${railLeft}px`,'important');
  lots.style.setProperty('left',`${lotsLeft}px`,'important');
  c.style.setProperty('left',`${cLeft}px`,'important');
  const attack=$('.controls .attack'),order=$('.controls .order');
  if(attack)attack.style.setProperty('left',`${cLeft}px`,'important');
  if(order)order.style.setProperty('left',`${Math.min(lotsLeft+14,railLeft-46)}px`,'important');
}
function report(){
  enforceOpenSurfaceLayer();placeMobileRails();
  const rail=rect($('#yControl')),dock=rect($('#dock')),c=rect($('#cControl')),lots=rect($('#lotsControl'));
  const openSurface=document.querySelector('#confirm.open,.sheet.open,.confirm.open');
  const surfaceZ=openSurface?Number(getComputedStyle(openSurface).zIndex)||0:0;
  const hudZ=Math.max(...['#dock','#backpackButton','#walletPanel','#chatHandle','#k11520HudCollapseAll'].map(sel=>{const el=$(sel);return el?(Number(getComputedStyle(el).zIndex)||0):0}));
  const dockGap=rail&&dock?dock.left-rail.right:null;
  const out={version:'1.2.0',viewport:{width:innerWidth,height:innerHeight},rail,dock,c,lots,dockGap,railDockOverlap:overlap(rail,dock),openSurfaceZ:surfaceZ,hudMaxZ:hudZ,actionSurfaceOnTop:!openSurface||surfaceZ>hudZ};
  out.ok=innerWidth>MOBILE_MAX||Boolean(rail&&dock&&c&&lots&&dockGap>=GAP&&!out.railDockOverlap&&c.left>=0&&out.actionSurfaceOnTop);
  document.documentElement.dataset.k11520ActionRailClearance=out.ok?'PASS':'RED';
  globalThis.__K11520_ACTION_RAIL_CLEARANCE__=out;
  return out;
}
function apply(){style();enforceOpenSurfaceLayer();placeMobileRails();queueMicrotask(report);requestAnimationFrame(()=>{enforceOpenSurfaceLayer();placeMobileRails();report()});setTimeout(report,80);setTimeout(report,220);setTimeout(report,500);return report()}
export function install11520MobileActionRailClearance(){if(typeof document==='undefined')return null;const observer=new MutationObserver(()=>queueMicrotask(apply));observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});globalThis.__K11520_ACTION_RAIL_CLEARANCE_OBSERVER__?.disconnect?.();globalThis.__K11520_ACTION_RAIL_CLEARANCE_OBSERVER__=observer;document.addEventListener('click',e=>{if(e.target?.closest?.('#orderFire,#attack,.order,.attack,#dock')){queueMicrotask(apply);requestAnimationFrame(apply);setTimeout(apply,60)}},{capture:true});addEventListener('resize',apply,{passive:true});for(const delay of [0,180,480,900,1800])setTimeout(apply,delay);return apply()}
if(typeof document!=='undefined')install11520MobileActionRailClearance();
