/* KGEN_META
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
let generation=0,preparedFrame=null;

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
function mode(){return globalThis.__K11520_3D_CONTROL__?.mode||globalThis.__K11520_WORLD_COORDS__?.mode||'XZ'}
function physical(){return globalThis.__K11520_WORLD_COORDS__?.physical||{x:0,y:0,z:0}}
function control(){return globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null}
function toast(text){const t=globalThis.document?.querySelector('#toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1400)}

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
const validPoint=p=>p&&['x','y','z'].every(a=>typeof p[a]==='number'&&Number.isFinite(p[a]));
// LOCAL XYZ distance uses only the established spatial calibration. A market
// price, financial K address or C sign is never a physical destination.
export function buildLocalNavigationPreview({position,target,speedKPerSecond=null}={}){
  const unavailable={distance:null,distanceK:null,etaSeconds:null,status:'UNAVAILABLE',distanceSpace:'LOCAL_METERS'};
  if(!validPoint(position)||!validPoint(target))return unavailable;
  const distance=Math.hypot(...['x','y','z'].map(a=>target[a]-position[a]));
  if(!Number.isFinite(distance))return unavailable;
  const distanceK=gameUnitsToK(distance);
  if(distance<=ARRIVAL)return{distance,distanceK,etaSeconds:0,status:'ARRIVED',distanceSpace:'LOCAL_METERS'};
  const eta=typeof speedKPerSecond==='number'&&Number.isFinite(speedKPerSecond)&&speedKPerSecond>0?distanceK/speedKPerSecond:null;
  return{distance,distanceK,etaSeconds:Number.isFinite(eta)&&eta>=0?eta:null,status:Number.isFinite(eta)&&eta>=0?'ESTIMATE':'WAIT',distanceSpace:'LOCAL_METERS'};
}
function setVector(v){const c=control();if(!c)return false;c.vector={x:finite(v.x),y:finite(v.y),z:finite(v.z)};globalThis.__K11520_XYZ_NAV_VECTOR__={...c.vector};return true}
function clearVector(){setVector({x:0,y:0,z:0})}
function publish(){globalThis.__K11520_XYZ_MAP_NAVIGATION__={organ:'XYZ Plane Waypoint Navigation',active:nav.active,target:nav.target?{...nav.target}:null,mode:nav.mode,source:nav.source,startedAt:nav.startedAt,lastDistance:nav.lastDistance,lastDistanceK:nav.lastDistance===null?null:gameUnitsToK(nav.lastDistance),distanceSpace:'LOCAL_METERS',legacyXZPreserved:false,worldTargetAuthority:true,collisionAuthority:'game-5d-main.moveManual',motionStatus:nav.motionStatus||'IDLE',etaSeconds:nav.etaSeconds??null,etaStatus:nav.etaStatus||'WAIT',setWorldTarget:setWorldTarget3D,start:startWorldNavigation3D,stop:stopWorldNavigation3D}}
function invalidateFrame(){generation++;preparedFrame=null}
function stop(reason=null,status='CANCELLED',clearTarget=false){invalidateFrame();nav.active=false;nav.motionStatus=status;nav.etaStatus=status;nav.etaSeconds=status==='ARRIVED'?0:null;if(clearTarget)nav.target=null;clearVector();actionButton?.remove();actionButton=null;if(reason)toast(reason);publish()}
function start(){if(!nav.target)return false;invalidateFrame();nav.active=true;nav.startedAt=Date.now();nav.motionStatus='WAIT';nav.etaStatus='WAIT';nav.etaSeconds=null;actionButton?.remove();actionButton=null;toast(`XYZ 導航 ${nav.mode} 開始`);publish();return true}
function showAction(){actionButton?.remove();if(!globalThis.document?.body)return;actionButton=document.createElement('button');actionButton.id='xyzWaypointAction';actionButton.className='waypointAction';const p=nav.target,d=vectorToward3D(physical(),p).distance;actionButton.textContent=`前往 ${nav.mode} · ${formatGameDistanceK(d)}`;actionButton.title=['LOCAL XYZ',...['x','y','z'].map(a=>`${a.toUpperCase()} ${formatGameDistanceK(p[a],{detail:true})}`)].join(' · ');actionButton.setAttribute('aria-label',`${actionButton.textContent}；${actionButton.title}`);actionButton.onclick=start;document.body.appendChild(actionButton)}
function setTarget(target,plane,source='PLANE_MAP'){invalidateFrame();nav={active:false,target:normalizeWorldTarget3D(target),mode:plane||mode(),source,startedAt:0,lastDistance:null};clearVector();showAction();toast(`${nav.mode} waypoint 已設定`);publish();return{...nav.target}}
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
// Main's existing actor loop is the single movement clock. These functions
// supply a target and observe its collision result without driving a second RAF.
export function resolveLocalNavigationStep(from,next,{mode,source,resolveMove}={}){
  if(!validPoint(from)||!validPoint(next)||typeof resolveMove!=='function')return{...from,blocked:true,blocker:{name:'INVALID_NAVIGATION_STEP'}};
  const direct=resolveMove(from,next);
  if(!direct?.blocked||!direct.blocker?.id||mode!=='XZ'||source!=='PLANE_MAP'||Math.abs(next.y-from.y)>1e-10)return direct;
  const dx=next.x-from.x,dz=next.z-from.z,length=Math.hypot(dx,dz);if(!Number.isFinite(length)||length===0)return direct;
  // Preserve the old XZ map's perpendicular candidates within the same swept
  // distance budget. Every candidate still passes through the world resolver.
  for(const direction of [{x:-dz/length,z:dx/length},{x:dz/length,z:-dx/length}]){
    const candidate={x:from.x+direction.x*length,y:from.y,z:from.z+direction.z*length},result=resolveMove(from,candidate);
    if(validPoint(result)&&!result.blocked&&['x','y','z'].every(a=>Math.abs(result[a]-candidate[a])<1e-10))return{...result,detour:true};
  }
  return direct;
}
export function prepareLocalNavigationFrame(){
  if(!nav.active||!nav.target)return null;
  preparedFrame=Object.freeze({generation,target:Object.freeze({...nav.target}),startedAt:nav.startedAt,mode:nav.mode,source:nav.source});
  return preparedFrame;
}
export function commitLocalNavigationFrame(result,{frame,speedKPerSecond=null}={}){
  if(!nav.active||!nav.target||frame!==preparedFrame||frame?.generation!==generation)return false;
  preparedFrame=null;
  if(!validPoint(result?.position)){stop('導航受阻：INVALID_LOCAL_POSITION','BLOCKED');return false}
  const preview=buildLocalNavigationPreview({position:result.position,target:nav.target,speedKPerSecond});
  if(preview.status==='UNAVAILABLE'){stop('導航受阻：INVALID_LOCAL_DISTANCE','BLOCKED');return false}
  nav.lastDistance=preview.distance;nav.motionStatus=result.status||'WAIT';
  if(result.blocked||result.status==='BLOCKED'){stop(`導航受阻：${result.blocker?.name||'WORLD'}`,'BLOCKED');return true}
  if(preview.status==='ARRIVED'){stop('已到達 XYZ 目的地','ARRIVED');return true}
  if(result.status==='ARRIVED'){stop('導航受阻：INVALID_ARRIVAL','BLOCKED');return false}
  const observed=Object.hasOwn(result,'observedSpeedKPerSecond')?result.observedSpeedKPerSecond:speedKPerSecond;
  const moving=buildLocalNavigationPreview({position:result.position,target:nav.target,speedKPerSecond:observed});
  nav.etaStatus=result.status==='PAUSED'?'PAUSED':result.detour?'DETOUR':result.status==='MOVING'?moving.status:'WAIT';
  nav.etaSeconds=nav.etaStatus==='ESTIMATE'?moving.etaSeconds:null;
  publish();return true;
}
export function install11520XyzMapNavigation(){
  if(globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__)return globalThis.__K11520_XYZ_MAP_NAVIGATION__;
  globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__=true;
  for(const type of ['pointerdown','pointermove','pointerup'])document.addEventListener(type,intercept,true);
  document.addEventListener('pointerdown',cancelOnManual,true);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')stop(null,'CANCELLED',true)});
  globalThis.addEventListener?.('pagehide',()=>stop(null,'CANCELLED',true));
  publish();return globalThis.__K11520_XYZ_MAP_NAVIGATION__;
}
