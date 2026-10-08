/* KGEN_META
VERSION: 1.2.0
REVISION: 2026-10-07.NAVIGATOR-RECONSTRUCTION-MOTION
PRODUCT_CONTEXT: V2.9.6
LAST_UPDATED: 2026-10-07
UPDATED_BY: dot / TEMPORARY_EXTERNAL_ENGINEERING_MAINTAINER / HUMAN_AUTHORIZED_2026_10_07
REVIEWED_BY: PENDING / Draft reconstruction checkpoint; no release approval
SOURCE_COMMIT: f7f67950418ebbb6f7a5a309a32d529232fcb3b6
TASK_ID: K11520-NAVIGATOR-RECONSTRUCTION-20261007
CHANGE_REASON: Reconstruct only the elapsed shared-C local motion delta using existing actor, coordinate and waypoint owners.
ANCESTOR: K線西遊記/temples/11520/runtime/spatial-coordinate-runtime.mjs @ f7f67950418ebbb6f7a5a309a32d529232fcb3b6; partial evidence blob 65350fe6569059212f7ccc5b911605a123c3dc5e
SOURCE_OF_TRUTH: TRUE
STATUS: ACTIVE
PURPOSE: Canonical 11520 XYZ/XZ world-coordinate conversions shared by joystick, HUD, maps, navigation and camera-facing logic.
*/

// Physics CURRENT §161: Moon anchor. Human K11520 calibration (2026-09-25):
// one LOCAL game spatial unit = one meter, not a market-normalized tick.
export const SPATIAL_CALIBRATION=Object.freeze({
  authority:'K11520_SIMULATION_SPATIAL_CALIBRATION',metersPerGameUnit:1,
  kmPerK:384400/16888,gameUnitsPerK:384400*1000/16888,
  source:'docs/physics/KGEN_Universe_Physics_Runtime_CURRENT.md#161',
});
function finiteSpatial(value){if(typeof value!=='number'||!Number.isFinite(value))throw new RangeError('INVALID_SPATIAL_VALUE');return Object.is(value,-0)?0:value}
// Physics CURRENT §§150–153, 169, 210. Scalar address only: never XYZ,
// an execution price conversion, a leverage phase or a movement instruction.
export const PRIME_GATE_ALPHA=5.11111;
export function signedUniverseAddress(x){
  finiteSpatial(x);
  if(x===0)return {kind:'ORIGIN',k:'ORIGIN',alpha:'ORIGIN',theta:'ORIGIN'};
  const m=Math.abs(x);let k=Math.floor(Math.log10(m));
  // Scientific notation also supports subnormal JS numbers (10**-324 is zero).
  const [coefficient,exponent]=m.toExponential().split('e');
  let alpha=k>=-323?m/10**k:Number(coefficient)*10**(Number(exponent)-k);
  // log10 may round to the neighboring integer immediately below a power of ten.
  if(alpha<1){k--;alpha*=10}else if(alpha>=10){k++;alpha/=10}
  return {kind:'SIGNED_UNIVERSE',k,alpha,theta:x<0?Math.PI:0};
}
export function formatUniverseAddress(address){
  if(address.kind==='ORIGIN')return 'K0 / ORIGIN';
  // Do not round a value just below 10 into a false next-layer boundary.
  const alpha=Math.min(9.999999,Math.floor(address.alpha*1e6)/1e6);
  return `k=${address.k} · α=${alpha} · θ=${address.theta===0?'0':'π'}`;
}
const converted=value=>finiteSpatial(value);
export const gameUnitsToMeters=value=>converted(finiteSpatial(value)*SPATIAL_CALIBRATION.metersPerGameUnit);
export const metersToGameUnits=value=>converted(finiteSpatial(value)/SPATIAL_CALIBRATION.metersPerGameUnit);
export const kmToK=value=>converted(finiteSpatial(value)/SPATIAL_CALIBRATION.kmPerK);
export const kToKm=value=>converted(finiteSpatial(value)*SPATIAL_CALIBRATION.kmPerK);
export const gameUnitsToK=value=>kmToK(gameUnitsToMeters(value)/1000);
export const kToGameUnits=value=>metersToGameUnits(kToKm(value)*1000);
export function localPositionToK(p){return Object.fromEntries(['x','y','z'].map(a=>[a,gameUnitsToK(p[a])]))}
export function formatGameDistanceK(value,{detail=false,compact=false}={}){
  const k=gameUnitsToK(value),text=k===0?'0':compact?k.toExponential(2):Number(k.toPrecision(6)).toLocaleString('en-US',{useGrouping:false,maximumSignificantDigits:6});
  return `${text}K${detail?` ≈ ${Number(gameUnitsToMeters(value).toPrecision(6))} m`:''}`;
}

// No implicit normalized-market → physical mapping exists. A future calibrated
// transform must supply dimensional physical K explicitly; never assume 1 tick=1m.
export function marketToPhysicalK(marketPosition,transform){
  if(typeof transform!=='function')throw new RangeError('MARKET_PHYSICAL_TRANSFORM_NOT_CONFIGURED');
  const result=transform(Object.freeze({...marketPosition}));
  if(result?.space!=='PHYSICAL_K')throw new RangeError('PHYSICAL_K_DIMENSION_REQUIRED');
  return {space:'PHYSICAL_K',x:finiteSpatial(result.x),y:finiteSpatial(result.y),z:finiteSpatial(result.z)};
}
export function composePhysicalK(origin,local){
  if(origin?.space!=='PHYSICAL_K')throw new RangeError('PHYSICAL_K_DIMENSION_REQUIRED');
  const r=localPositionToK(local);
  return Object.fromEntries(['x','y','z'].map(a=>[a,converted(finiteSpatial(origin[a])+r[a])]));
}

export const SPATIAL_RULES=Object.freeze({
  northAxis:'Z+',
  eastAxis:'X+',
  worldBounds:Object.freeze({minX:-60,maxX:60,minY:0,maxY:40,minZ:-60,maxZ:60}),
});

export function clampWorldPosition(p={}){
  const b=SPATIAL_RULES.worldBounds;
  return {
    x:Math.max(b.minX,Math.min(b.maxX,Number(p.x)||0)),
    y:Math.max(b.minY,Math.min(b.maxY,Number(p.y)||0)),
    z:Math.max(b.minZ,Math.min(b.maxZ,Number(p.z)||0)),
  };
}

// Canonical player control: screen-right increases world X, screen-left decreases X.
// ny up remains forward; camYaw=0 means forward is world Z+.
export function joystickToWorld({nx=0,ny=0,camYaw=0}={}){
  const rightX=Math.cos(camYaw),rightZ=-Math.sin(camYaw);
  const forwardX=-Math.sin(camYaw),forwardZ=Math.cos(camYaw);
  return {
    x:nx*rightX+ny*forwardX,
    z:nx*rightZ+ny*forwardZ,
  };
}

export function worldHeading({x=0,z=0}={}){
  return Math.atan2(Number(x)||0,Number(z)||0);
}

export function worldToNorthUpMap({x=0,z=0},{centerX=0,centerZ=0,range=34,width=1,height=1}={}){
  const safeRange=Math.max(Number.EPSILON,Math.abs(Number(range)||34));
  return {
    px:Number(width)/2+((Number(x)||0)-(Number(centerX)||0))/safeRange*Number(width)/2,
    py:Number(height)/2-((Number(z)||0)-(Number(centerZ)||0))/safeRange*Number(height)/2,
  };
}

export function northUpMapToWorld({px=0,py=0},{centerX=0,centerZ=0,range=34,width=1,height=1}={}){
  const w=Math.max(Number.EPSILON,Number(width)||1),h=Math.max(Number.EPSILON,Number(height)||1),r=Math.max(Number.EPSILON,Math.abs(Number(range)||34));
  return {
    x:(Number(centerX)||0)+(Number(px)/w-.5)*r*2,
    z:(Number(centerZ)||0)-((Number(py)/h-.5)*r*2),
  };
}

export function distanceXZ(a={},b={}){return Math.hypot((Number(a.x)||0)-(Number(b.x)||0),(Number(a.z)||0)-(Number(b.z)||0))}

export function bearingCardinal(from={},to={}){
  const dx=(Number(to.x)||0)-(Number(from.x)||0),dz=(Number(to.z)||0)-(Number(from.z)||0);
  if(Math.abs(dx)<1e-9&&Math.abs(dz)<1e-9)return'ARRIVED';
  const ns=dz>=0?'N':'S',ew=dx>=0?'E':'W';
  if(Math.abs(dx)<Math.abs(dz)*.35)return ns;
  if(Math.abs(dz)<Math.abs(dx)*.35)return ew;
  return ns+ew;
}

export function parseHudXYZ(text=''){
  const m=String(text).match(/X\s*(-?\d+(?:\.\d+)?)\s*[·|,]?\s*Y\s*(-?\d+(?:\.\d+)?)\s*[·|,]?\s*Z\s*(-?\d+(?:\.\d+)?)/i);
  return m?{x:Number(m[1]),y:Number(m[2]),z:Number(m[3])}:null;
}

// A single elapsed clock for the existing local actor. Hidden, resumed,
// owner-switched and long suspended frames do not accumulate catch-up travel.
export function advanceLocalMotionClock(previous,now,{visible=true,ownerKey=null}={}){
  const valid=Number.isFinite(now),delta=valid&&Number.isFinite(previous?.now)?(now-previous.now)/1000:0;
  const active=valid&&visible&&previous?.visible&&previous.ownerKey===ownerKey&&delta>=0&&delta<=.25;
  return Object.freeze({now:valid?now:null,visible:!!visible,ownerKey,elapsedSeconds:active?delta:0,status:!visible?'HIDDEN':active?'ACTIVE':'RESET'});
}

// LOCAL_METERS is an existing render/collision coordinate frame. Converting
// physical K speed here does not place a UniverseMap scalar point in XYZ.
export function integrateLocalMotion({position,vector={x:0,y:0,z:0},target=null,elapsedSeconds=0,speedKPerSecond=null,resolveMove}={}){
  const axes=['x','y','z'],valid=p=>p&&axes.every(a=>typeof p[a]==='number'&&Number.isFinite(p[a]));
  if(!valid(position))throw new RangeError('INVALID_LOCAL_POSITION');
  let current={...position},distanceMoved=0,blocked=false,blocker=null,substeps=0,detour=false;
  const base={position:current,intentDelta:{x:0,y:0,z:0},distanceMoved:0,distanceMovedK:0,observedSpeedKPerSecond:0,inputThrottle:0,blocked:false,blocker:null,substeps:0};
  if(typeof speedKPerSecond!=='number'||!Number.isFinite(speedKPerSecond)||speedKPerSecond<0||speedKPerSecond>.1)return{...base,status:'SPEED_UNAVAILABLE'};
  if(speedKPerSecond===0)return{...base,status:'PAUSED'};
  if(!Number.isFinite(elapsedSeconds)||elapsedSeconds<0||elapsedSeconds>.25||typeof resolveMove!=='function')return{...base,status:'FRAME_UNAVAILABLE'};
  if(target!==null&&!valid(target)||!valid(vector))return{...base,status:'INPUT_UNAVAILABLE'};
  const raw=target?Object.fromEntries(axes.map(a=>[a,target[a]-position[a]])):vector,length=Math.hypot(raw.x,raw.y,raw.z);
  if(length===0||(!target&&length<.02))return{...base,status:target?'ARRIVED':'IDLE'};
  const throttle=target?1:Math.min(1,length),budget=kToGameUnits(speedKPerSecond)*elapsedSeconds*throttle;
  const travel=target?Math.min(length,budget):budget,direction=Object.fromEntries(axes.map(a=>[a,raw[a]/length]));
  const intentDelta=Object.fromEntries(axes.map(a=>[a,direction[a]*travel]));
  // World obstacles have finite radius. <=.25 local-unit sweeps prevent the
  // high-C actor from jumping over them; the resolver remains sole authority.
  const steps=Math.ceil(travel/.25);
  for(let i=0;i<steps;i++){
    const amount=Math.min(.25,travel-i*.25),next=Object.fromEntries(axes.map(a=>[a,current[a]+direction[a]*amount]));
    const result=resolveMove(current,next);substeps++;
    if(!valid(result)){blocked=true;blocker={name:'INVALID_COLLISION_RESULT'};break}
    if(result.blocked){blocked=true;blocker=result.blocker||{name:'WORLD'};break}
    const moved=Math.hypot(...axes.map(a=>result[a]-current[a]));
    if(moved>amount+1e-8){blocked=true;blocker={name:'INVALID_COLLISION_DISPLACEMENT'};break}
    current=Object.fromEntries(axes.map(a=>[a,result[a]]));distanceMoved+=moved;detour=detour||result.detour===true;
    if(!result.detour&&axes.some(a=>Math.abs(current[a]-next[a])>1e-8)){blocked=true;blocker={name:'WORLD_BOUNDARY'};break}
  }
  const distanceMovedK=gameUnitsToK(distanceMoved),arrived=target&&Math.hypot(...axes.map(a=>target[a]-current[a]))<1e-8;
  return{position:current,intentDelta,distanceMoved,distanceMovedK,inputThrottle:throttle,observedSpeedKPerSecond:elapsedSeconds>0?distanceMovedK/elapsedSeconds:0,blocked,blocker,substeps,detour,status:blocked?'BLOCKED':arrived?'ARRIVED':detour?'DETOUR':distanceMoved>0?'MOVING':'IDLE'};
}
