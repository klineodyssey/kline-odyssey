/* KGEN_META
VERSION: 1.1.0
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
