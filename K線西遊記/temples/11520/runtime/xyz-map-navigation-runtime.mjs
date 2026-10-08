/* KGEN_META
VERSION: 1.1.0
REVISION: 2026-10-07.NAVIGATOR-RECONSTRUCTION-MOTION
PRODUCT_CONTEXT: V2.9.6
LAST_UPDATED: 2026-10-07
UPDATED_BY: dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_07
REVIEWED_BY: PENDING / Draft reconstruction checkpoint; no release approval
SOURCE_COMMIT: f7f67950418ebbb6f7a5a309a32d529232fcb3b6
TASK_ID: K11520-NAVIGATOR-RECONSTRUCTION-20261007
CHANGE_REASON: Reconstruct only the elapsed shared-C local motion delta using existing actor, coordinate and waypoint owners.
ANCESTOR: K線西遊記/temples/11520/runtime/xyz-map-navigation-runtime.mjs @ f7f67950418ebbb6f7a5a309a32d529232fcb3b6; partial evidence blob 65350fe6569059212f7ccc5b911605a123c3dc5e
SOURCE_OF_TRUTH: TRUE
STATUS: ACTIVE
FORMAL_ORGAN_NAME: XYZ Plane Waypoint Navigation
PURPOSE: Let XZ / XY / YZ plane-map taps and direct 3D world/entity targets share one canonical XYZ waypoint authority while reusing the physical movement/collision engine. Navigation writes only the public XYZ control vector and never bypasses world collision.
*/

import {formatGameDistanceK,gameUnitsToK} from './spatial-coordinate-runtime.mjs';

const MODE_SPECS=Object.freeze({
  XZ:Object.freeze({h:'x',v:'z',depth:'y'}),
  XY:Object.freeze({h:'x',v:'y',depth:'z'}),
  YZ:Object.freeze({h:'y',v:'z',depth:'x'}),
});
const RANGE=34/1.3;
const ARRIVAL=.38;
let nav={active:false,target:null,mode:null,source:null,startedAt:0,lastDistance:null};
let actionButton=null;

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
function mode(){return globalThis.__K11520_3D_CONTROL__?.mode||globalThis.__K11520_WORLD_COORDS__?.mode||'XZ'}
function physical(){return globalThis.__K11520_WORLD_COORDS__?.physical||{x:0,y:0,z:0}}
function control(){return globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null}
function toast(text){const t=document.querySelector('#toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1400)}

export function normalizeWorldTarget3D(target={},fallback=physical()){
  return{x:finite(target.x,finite(fallback?.x)),y:Math.max(0,finite(target.y,finite(fallback?.y))),z:finite(target.z,finite(fallback?.z))};
}
export function planePointToWorld({px,py,width,height,center,mode:plane='XZ',range=RANGE}={}){
  const spec=MODE_SPECS[plane]||MODE_SPECS.XZ,c=normalizeWorldTarget3D(center,{x:0,y:0,z:0});
  const w=Math.max(1,finite(width,1)),h=Math.max(1,finite(height,1)),r=Math.max(Number.EPSILON,Math.abs(finite(range,RANGE)));
  c[spec.h]+=((finite(px)-w/2)/(w/2))*r;
  c[spec.v]-=((finite(py)-h/2)/(h/2))*r;
  c.y=Math.max(0,c.y);
  return c;
}
export function vectorToward3D(from={},target={}){
  const dx=finite(target.x)-finite(from.x),dy=finite(target.y)-finite(from.y),dz=finite(target.z)-finite(from.z),distance=Math.hypot(dx,dy,dz);
  if(distance<=ARRIVAL)return{vector:{x:0,y:0,z:0},distance,arrived:true};
  return{vector:{x:dx/distance,y:dy/distance,z:dz/distance},distance,arrived:false};
}
function setVector(v){const c=control();if(!c)return false;c.vector={x:finite(v.x),y:finite(v.y),z:finite(v.z)};globalThis.__K11520_XYZ_NAV_VECTOR__={...c.vector};return true}
function clearVector(){setVector({x:0,y:0,z:0})}
function publish(){globalThis.__K11520_XYZ_MAP_NAVIGATION__={organ:'XYZ Plane Waypoint Navigation',active:nav.active,target:nav.target?{...nav.target}:null,mode:nav.mode,source:nav.source,startedAt:nav.startedAt,lastDistance:nav.lastDistance,lastDistanceK:nav.lastDistance===null?null:gameUnitsToK(nav.lastDistance),distanceSpace:'LOCAL_METERS',worldTargetAuthority:true,collisionAuthority:'game-5d-main.moveManual',motionStatus:nav.motionStatus||'IDLE',etaSeconds:nav.etaSeconds??null,etaStatus:nav.etaStatus||'WAIT',legacyXZPreserved:false,setWorldTarget:setWorldTarget3D,start:startWorldNavigation3D,stop:stopWorldNavigation3D}}
function stop(reason=null,status='CANCELLED',clearTarget=false){nav.active=false;nav.motionStatus=status;nav.etaStatus=status;nav.etaSeconds=status==='ARRIVED'?0:null;if(clearTarget)nav.target=null;clearVector();actionButton?.remove();actionButton=null;if(reason)toast(reason);publish()}
function start(){if(!nav.target)return false;nav.active=true;nav.startedAt=Date.now();nav.motionStatus='WAIT';nav.etaStatus='WAIT';nav.etaSeconds=null;actionButton?.remove();actionButton=null;toast(`XYZ 導航 ${nav.mode} 開始`);publish();return true}
function showAction(){actionButton?.remove();actionButton=document.createElement('button');actionButton.id='xyzWaypointAction';actionButton.className='waypointAction';const p=nav.target,d=vectorToward3D(physical(),p).distance;actionButton.textContent=`前往 ${nav.mode} · ${formatGameDistanceK(d)}`;actionButton.title=['LOCAL XYZ',...['x','y','z'].map(a=>`${a.toUpperCase()} ${formatGameDistanceK(p[a],{detail:true})}`)].join(' · ');actionButton.setAttribute('aria-label',`${actionButton.textContent}；${actionButton.title}`);actionButton.onclick=start;document.body.appendChild(actionButton)}
function setTarget(target,plane,source='PLANE_MAP'){nav={active:false,target:normalizeWorldTarget3D(target),mode:plane||mode(),source,startedAt:0,lastDistance:null};clearVector();showAction();toast(`${nav.mode} waypoint 已設定`);publish();return{...nav.target}}
export function setWorldTarget3D(target,{mode:targetMode='WORLD',source='WORLD'}={}){return setTarget(target,targetMode,source)}
export function startWorldNavigation3D(){return start()}
export function stopWorldNavigation3D(reason=null,{clearTarget=false}={}){stop(reason,'CANCELLED',clearTarget);return true}
function mapCanvasFromEventTarget(target){if(!(target instanceof Element))return null;if(target.matches?.('#minimap,#fullMap'))return target;return target.closest?.('#minimap,#fullMap')||null}
function intercept(e){const plane=mode();if(plane==='XZ')return;const canvas=mapCanvasFromEventTarget(e.target);if(!canvas||canvas.dataset.coordinateSpace==='K')return;
  if(e.type==='pointerdown'){e.preventDefault();e.stopImmediatePropagation();return}
  if(e.type==='pointermove'){e.preventDefault();e.stopImmediatePropagation();return}
  if(e.type==='pointerup'){
    const r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)/Math.max(1,r.width)*canvas.width,py=(e.clientY-r.top)/Math.max(1,r.height)*canvas.height;
    setTarget(planePointToWorld({px,py,width:canvas.width,height:canvas.height,center:physical(),mode:plane}),plane,'PLANE_MAP');
    e.preventDefault();e.stopImmediatePropagation();
  }
}
function cancelOnManual(e){if(!nav.active)return;const t=e.target;if(t?.closest?.('#joy,#yControl,#yJoyV250'))stop('手動控制：XYZ 導航停止')}
// The existing actor loop is the only movement clock. Navigation supplies a
// target and observes the committed collision result; it no longer races a
// second animation loop or the C presentation bridge by writing joystick state.
export function resolveLocalNavigationStep(from,next,{mode,source,resolveMove}={}){
  const direct=resolveMove(from,next);
  if(!direct.blocked||!direct.blocker?.id||mode!=='XZ'||source!=='PLANE_MAP'||Math.abs(next.y-from.y)>1e-10)return direct;
  const dx=next.x-from.x,dz=next.z-from.z,length=Math.hypot(dx,dz);if(length===0)return direct;
  // Preserve the old XZ route's perpendicular candidates without another
  // position writer or extra distance budget. The world resolver checks both.
  for(const direction of [{x:-dz/length,z:dx/length},{x:dz/length,z:-dx/length}]){
    const candidate={x:from.x+direction.x*length,y:from.y,z:from.z+direction.z*length},result=resolveMove(from,candidate);
    if(!result.blocked&&['x','y','z'].every(a=>Number.isFinite(result[a])&&Math.abs(result[a]-candidate[a])<1e-10))return{...result,detour:true};
  }
  return direct;
}
export function prepareLocalNavigationFrame(){return nav.active&&nav.target?{target:{...nav.target},startedAt:nav.startedAt,mode:nav.mode,source:nav.source}:null}
export function commitLocalNavigationFrame(result,{speedKPerSecond=null}={}){
  if(!nav.active||!nav.target)return;
  nav.lastDistance=Math.hypot(...['x','y','z'].map(a=>nav.target[a]-result.position[a]));
  nav.motionStatus=result.status;
  nav.etaStatus=result.status==='PAUSED'?'PAUSED':result.detour?'DETOUR':speedKPerSecond>0?'ESTIMATE':'WAIT';
  nav.etaSeconds=!result.detour&&speedKPerSecond>0?gameUnitsToK(nav.lastDistance)/speedKPerSecond:null;
  if(result.status==='ARRIVED'){nav.etaStatus='ARRIVED';nav.etaSeconds=0;stop('已到達 XYZ 目的地','ARRIVED')}
  else if(result.blocked){nav.etaStatus='BLOCKED';nav.etaSeconds=null;stop(`導航受阻：${result.blocker?.name||'WORLD'}`,'BLOCKED')}
  else publish();
}

export function install11520XyzMapNavigation(){
  if(globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__)return globalThis.__K11520_XYZ_MAP_NAVIGATION__;
  globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__=true;
  for(const type of ['pointerdown','pointermove','pointerup'])document.addEventListener(type,intercept,true);
  document.addEventListener('pointerdown',cancelOnManual,true);
  publish();return globalThis.__K11520_XYZ_MAP_NAVIGATION__;
}
