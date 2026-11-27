/* K11520 K280 sphere cross-section candidate — pure math, no wallet/network/side effects.
 * Human model: Z=0 is planet center plane, Z=R is northmost surface point.
 * XY movement at constant Z; elevator fixes XY and varies Z.
 * Nonnegative public XY uses a polar chart: X = planar radius, Y = azimuth
 * [0,2π), NOT two Cartesian lengths. Signed internal components are merely
 * local vectors and MUST NEVER switch a player into a mirror universe.
 * This adapter does not replace the existing playable XZ/Y world until
 * independent combat/map/joystick/visual validation succeeds.
 */
export const TAU = 2*Math.PI;
const finite=(n,label)=>{if(typeof n!=='number'||!Number.isFinite(n))throw new RangeError(label+'_MUST_BE_FINITE');return n};
const radius=(r)=>{finite(r,'RADIUS');if(r<=0)throw new RangeError('RADIUS_MUST_BE_POSITIVE');return r};
export const K_INDEX_KM=384400/16888;
export const K280_RADIUS_METERS=280*K_INDEX_KM*1000;
export function sphereMetrics(radiusMeters){
 const r=radius(radiusMeters);
 return Object.freeze({radiusMeters:r,circumferenceMeters:TAU*r,crossSectionAreaM2:Math.PI*r*r,surfaceAreaM2:4*Math.PI*r*r,volumeM3:4/3*Math.PI*r*r*r});
}
export function crossSectionAtZ(z,radiusMeters){
 const r=radius(radiusMeters),h=finite(z,'Z');
 if(h<0||h>r)throw new RangeError('OUTSIDE_POSITIVE_UNIVERSE_Z');
 const rr=Math.sqrt(Math.max(0,(r-h)*(r+h)));
 return Object.freeze({z:h,radiusMeters:rr,areaM2:Math.PI*rr*rr,circumferenceMeters:TAU*rr});
}
export function validatePositiveSphere({x,y,z},radiusMeters){
 const r=radius(radiusMeters),rr=finite(x,'X'),angle=finite(y,'Y'),h=finite(z,'Z');
 if(rr<0||angle<0||angle>=TAU||h<0||h>r)throw new RangeError('OUTSIDE_POSITIVE_SPHERE_CHART');
 const max=crossSectionAtZ(h,r).radiusMeters;
 if(rr>max+Math.max(1e-8,r*1e-12))throw new RangeError('OUTSIDE_SPHERE_CROSS_SECTION');
 return Object.freeze({x:rr,y:rr===0?0:angle,z:h});
}
export function toLocalCartesian(position,radiusMeters){
 const p=validatePositiveSphere(position,radiusMeters);
 return Object.freeze({east:p.x*Math.cos(p.y),north:p.x*Math.sin(p.y),up:p.z});
}
export function fromLocalCartesian({east,north,up},radiusMeters){
 const e=finite(east,'EAST'),n=finite(north,'NORTH'),z=finite(up,'UP');
 const x=Math.hypot(e,n),y=x===0?0:((Math.atan2(n,e)%TAU)+TAU)%TAU;
 return validatePositiveSphere({x,y,z},radiusMeters);
}
export function moveOnXY(position,{eastMeters=0,northMeters=0}={},radiusMeters){
 const p=validatePositiveSphere(position,radiusMeters),a=toLocalCartesian(p,radiusMeters);
 try{
  const next=fromLocalCartesian({east:a.east+finite(eastMeters,'EAST_DELTA'),north:a.north+finite(northMeters,'NORTH_DELTA'),up:a.up},radiusMeters);
  return Object.freeze({ok:true,position:next,blocked:false});
 }catch(e){if(e instanceof RangeError&&/OUTSIDE_SPHERE_CROSS_SECTION/.test(e.message))return Object.freeze({ok:false,position:p,blocked:true,reason:e.message});throw e}
}
export function moveElevatorZ(position,targetZ,radiusMeters){
 const p=validatePositiveSphere(position,radiusMeters);
 try{
  const next=validatePositiveSphere({x:p.x,y:p.y,z:finite(targetZ,'Z_TARGET')},radiusMeters);
  return Object.freeze({ok:true,position:next,blocked:false});
 }catch(e){if(e instanceof RangeError&&/^OUTSIDE_(POSITIVE_SPHERE_CHART|SPHERE_CROSS_SECTION)/.test(e.message))return Object.freeze({ok:false,position:p,blocked:true,reason:e.message});throw e}
}
// Explicit conversion to pre-existing Three.js local control (XZ floor, Y up).
// This is a signed LOCAL movement vector, not a mirror-universe position.
export function toLegacyLocalWorld(position,radiusMeters){
 const p=toLocalCartesian(position,radiusMeters);
 return Object.freeze({x:p.east,y:p.up,z:p.north});
}
export function fromLegacyLocalWorld(position,radiusMeters){
 return fromLocalCartesian({east:position.x,north:position.z,up:position.y},radiusMeters);
}
export function distanceInLocalWorld(a,b,radiusMeters){
 const x=toLocalCartesian(a,radiusMeters),y=toLocalCartesian(b,radiusMeters);
 return Math.hypot(x.east-y.east,x.north-y.north,x.up-y.up);
}
