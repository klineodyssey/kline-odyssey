/* KGEN_META
VERSION: 1.0.5
STATUS: ACTIVE
FORMAL_ORGAN_NAME: 11520 Mobile Action Rail Clearance Runtime
PURPOSE: Human-directed mobile safe-zone patch. Keeps the three bottom rails clear of the right utility rail and keeps opened action/order/confirm surfaces above ordinary HUD organs. UI-only; no trading, wallet, chain, payment, treasury, governance, or secret mutation.
*/
const MOBILE_MAX=420;
const ACTION_LAYER=65535;
const $=s=>document.querySelector(s);

function style(){
  let s=$('#k11520MobileActionRailClearance');
  if(!s){s=document.createElement('style');s.id='k11520MobileActionRailClearance'}
  s.textContent=`
#confirm.open,.sheet.open,.confirm.open{z-index:${ACTION_LAYER}!important;isolation:isolate!important;box-shadow:0 24px 80px #000e!important}
#confirm.open .close,.sheet.open .close,.confirm.open .close{position:relative!important;z-index:2!important}
@media(max-width:${MOBILE_MAX}px){
  #cControl{left:154px!important;right:auto!important}
  #lotsControl{left:204px!important;right:auto!important}
  #yControl{left:254px!important;right:auto!important}
  .controls .attack{left:154px!important;right:auto!important}
  .controls .order{left:218px!important;right:auto!important}
}
`;
  document.head.appendChild(s);
  return s;
}

function rect(el){if(!el)return null;const r=el.getBoundingClientRect();return{left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height}}
function overlap(a,b){return !!a&&!!b&&a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top}
function enforceOpenSurfaceLayer(){
  for(const el of document.querySelectorAll('#confirm.open,.sheet.open,.confirm.open')){
    el.style.setProperty('z-index',String(ACTION_LAYER),'important');
    el.style.setProperty('isolation','isolate','important');
  }
}
function report(){
  enforceOpenSurfaceLayer();
  const rail=rect($('#yControl')),dock=rect($('#dock')),c=rect($('#cControl')),lots=rect($('#lotsControl'));
  const openSurface=document.querySelector('#confirm.open,.sheet.open,.confirm.open');
  const surfaceZ=openSurface?Number(getComputedStyle(openSurface).zIndex)||0:0;
  const hudZ=Math.max(...['#dock','#backpackButton','#walletPanel','#chatHandle','#k11520HudCollapseAll'].map(sel=>{const el=$(sel);return el?(Number(getComputedStyle(el).zIndex)||0):0}));
  const out={version:'1.0.5',viewport:{width:innerWidth,height:innerHeight},rail,dock,c,lots,rightSafeGap:rail?innerWidth-rail.right:null,railDockOverlap:overlap(rail,dock),openSurfaceZ:surfaceZ,hudMaxZ:hudZ,actionSurfaceOnTop:!openSurface||surfaceZ>hudZ};
  out.ok=innerWidth>MOBILE_MAX||Boolean(rail&&c&&lots&&out.rightSafeGap>=80&&!out.railDockOverlap&&out.actionSurfaceOnTop);
  document.documentElement.dataset.k11520ActionRailClearance=out.ok?'PASS':'RED';
  globalThis.__K11520_ACTION_RAIL_CLEARANCE__=out;
  return out;
}
function apply(){style();enforceOpenSurfaceLayer();queueMicrotask(report);setTimeout(report,60);setTimeout(report,180);setTimeout(report,500);return report()}

export function install11520MobileActionRailClearance(){
  if(typeof document==='undefined')return null;
  const observer=new MutationObserver(mutations=>{const relevant=mutations.some(m=>(m.type==='attributes'&&(m.target.id==='confirm'||m.target.classList?.contains('sheet')||m.target.classList?.contains('confirm')))||(m.type==='childList'&&[...m.addedNodes].some(n=>n?.id==='k11520MobileControlLayout')));if(relevant)queueMicrotask(apply)});
  observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  globalThis.__K11520_ACTION_RAIL_CLEARANCE_OBSERVER__?.disconnect?.();
  globalThis.__K11520_ACTION_RAIL_CLEARANCE_OBSERVER__=observer;
  addEventListener('resize',apply,{passive:true});
  for(const delay of [0,180,480,900,1800])setTimeout(apply,delay);
  return apply();
}

if(typeof document!=='undefined')install11520MobileActionRailClearance();
