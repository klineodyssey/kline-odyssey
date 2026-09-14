import './market-origin-wallet-layout-runtime.mjs';
import './mobile-signed-c-immersive-runtime.mjs';
/* KGEN_META
VERSION: 1.2.1
STATUS: ACTIVE
FORMAL_ORGAN_NAME: 11520 Mobile Action Rail Clearance Runtime
PURPOSE: Own modal layering and non-interactive notifications only. Coordinates belong to Mobile Control Layout. Report schema remains 1.2.0; implementation revision is separately exposed. No trading, wallet, chain, asset or authority mutation.
*/
const MOBILE_MAX=600;
const TOP_Z=12000;
const $=s=>document.querySelector(s);
function style(){
  let s=$('#k11520MobileActionRailClearance');
  if(!s){s=document.createElement('style');s.id='k11520MobileActionRailClearance'}
  s.textContent=`
#toast.toast{pointer-events:none!important}
#confirm.open,.sheet.open,.confirm.open{position:fixed!important;z-index:${TOP_Z}!important;isolation:isolate!important;box-shadow:0 24px 80px #000e!important}
#confirm.open .close,.sheet.open .close,.confirm.open .close{position:relative!important;z-index:2!important}
`;
  document.head.appendChild(s);
  return s;
}
function rect(el){if(!el)return null;const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function overlap(a,b){return !!a&&!!b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}
function enforceOpenSurfaceLayer(){for(const el of document.querySelectorAll('#confirm.open,.sheet.open,.confirm.open')){el.style.setProperty('position','fixed','important');el.style.setProperty('z-index',String(TOP_Z),'important');el.style.setProperty('isolation','isolate','important')}}
function report(){
  enforceOpenSurfaceLayer();
  const rail=rect($('#yControl')),dock=rect($('#dock')),c=rect($('#cControl')),lots=rect($('#lotsControl'));
  const openSurface=document.querySelector('#confirm.open,.sheet.open,.confirm.open');
  const surfaceZ=openSurface?Number(getComputedStyle(openSurface).zIndex)||0:0;
  const hudZ=Math.max(...['#dock','#backpackButton','#walletPanel','#chatHandle','#k11520HudCollapseAll'].map(sel=>{const el=$(sel);return el?(Number(getComputedStyle(el).zIndex)||0):0}));
  const out={version:'1.2.0',implementationVersion:'1.2.1',viewport:{width:innerWidth,height:innerHeight},rail,dock,c,lots,rightSafeGap:rail?innerWidth-rail.right:null,railDockOverlap:overlap(rail,dock),openSurfaceZ:surfaceZ,hudMaxZ:hudZ,actionSurfaceOnTop:!openSurface||surfaceZ>hudZ};
  out.ok=innerWidth>MOBILE_MAX||Boolean(rail&&c&&lots&&out.rightSafeGap>=48&&!out.railDockOverlap&&out.actionSurfaceOnTop);
  document.documentElement.dataset.k11520ActionRailClearance=out.ok?'PASS':'RED';
  globalThis.__K11520_ACTION_RAIL_CLEARANCE__=out;
  return out;
}
function apply(){style();enforceOpenSurfaceLayer();queueMicrotask(report);requestAnimationFrame(()=>{enforceOpenSurfaceLayer();report()});setTimeout(report,80);setTimeout(report,220);setTimeout(report,500);return report()}
export function install11520MobileActionRailClearance(){if(typeof document==='undefined')return null;const observer=new MutationObserver(mutations=>{const relevant=mutations.some(m=>(m.type==='attributes'&&(m.target.id==='confirm'||m.target.classList?.contains('sheet')||m.target.classList?.contains('confirm')))||(m.type==='childList'&&[...m.addedNodes].some(n=>n?.id==='k11520MobileControlLayout'||n?.id==='confirm'||n?.classList?.contains('sheet')||n?.classList?.contains('confirm'))));if(relevant)queueMicrotask(apply)});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});globalThis.__K11520_ACTION_RAIL_CLEARANCE_OBSERVER__?.disconnect?.();globalThis.__K11520_ACTION_RAIL_CLEARANCE_OBSERVER__=observer;document.addEventListener('click',e=>{if(e.target?.closest?.('#orderFire,#attack,.order,.attack')){queueMicrotask(apply);requestAnimationFrame(apply);setTimeout(apply,60)}},{capture:true});addEventListener('resize',apply,{passive:true});for(const delay of [0,180,480,900,1800])setTimeout(apply,delay);return apply()}
if(typeof document!=='undefined')install11520MobileActionRailClearance();
