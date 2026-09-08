/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: XYZ Plane Waypoint Navigation
PURPOSE: Let XY / YZ plane-map taps create real 3D waypoints while reusing the canonical physical movement/collision engine. XZ keeps the legacy map navigator; non-XZ routes steer by writing the public XYZ control vector only and never bypass world collision.
*/

const MODE_SPECS=Object.freeze({
  XZ:Object.freeze({h:'x',v:'z',depth:'y'}),
  XY:Object.freeze({h:'x',v:'y',depth:'z'}),
  YZ:Object.freeze({h:'y',v:'z',depth:'x'}),
});
const RANGE=34/1.3;
const ARRIVAL=.38;
let nav={active:false,target:null,mode:null,startedAt:0,lastDistance:null};
let actionButton=null;

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
function mode(){return globalThis.__K11520_3D_CONTROL__?.mode||globalThis.__K11520_WORLD_COORDS__?.mode||'XZ'}
function physical(){return globalThis.__K11520_WORLD_COORDS__?.physical||{x:0,y:0,z:0}}
function control(){return globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null}
function toast(text){const t=document.querySelector('#toast');if(!t)return;t.textContent=text;t.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>t.classList.remove('show'),1400)}
function fmt(n){return finite(n).toFixed(1)}

export function planePointToWorld({px,py,width,height,center,mode:plane='XZ',range=RANGE}={}){
  const spec=MODE_SPECS[plane]||MODE_SPECS.XZ,c={x:finite(center?.x),y:finite(center?.y),z:finite(center?.z)};
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
function publish(){globalThis.__K11520_XYZ_MAP_NAVIGATION__={organ:'XYZ Plane Waypoint Navigation',active:nav.active,target:nav.target?{...nav.target}:null,mode:nav.mode,startedAt:nav.startedAt,legacyXZPreserved:true,collisionAuthority:'game-5d-main.moveManual'}}
function stop(reason=null){nav.active=false;clearVector();actionButton?.remove();actionButton=null;if(reason)toast(reason);publish()}
function start(){if(!nav.target)return;nav.active=true;nav.startedAt=Date.now();actionButton?.remove();actionButton=null;toast(`XYZ 導航 ${nav.mode} 開始`);publish()}
function showAction(){actionButton?.remove();actionButton=document.createElement('button');actionButton.id='xyzWaypointAction';actionButton.className='waypointAction';const p=nav.target;actionButton.textContent=`前往 ${nav.mode} · X ${fmt(p.x)} Y ${fmt(p.y)} Z ${fmt(p.z)}`;actionButton.onclick=start;document.body.appendChild(actionButton)}
function setTarget(target,plane){nav={active:false,target:{x:finite(target.x),y:Math.max(0,finite(target.y)),z:finite(target.z)},mode:plane,startedAt:0,lastDistance:null};clearVector();showAction();toast(`${plane} waypoint 已設定`);publish()}
function mapCanvasFromEventTarget(target){if(!(target instanceof Element))return null;if(target.matches?.('#minimap,#fullMap'))return target;return target.closest?.('#minimap,#fullMap')||null}
function intercept(e){const plane=mode();if(plane==='XZ')return;const canvas=mapCanvasFromEventTarget(e.target);if(!canvas)return;
  if(e.type==='pointerdown'){e.preventDefault();e.stopImmediatePropagation();return}
  if(e.type==='pointermove'){e.preventDefault();e.stopImmediatePropagation();return}
  if(e.type==='pointerup'){
    const r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)/Math.max(1,r.width)*canvas.width,py=(e.clientY-r.top)/Math.max(1,r.height)*canvas.height;
    setTarget(planePointToWorld({px,py,width:canvas.width,height:canvas.height,center:physical(),mode:plane}),plane);
    e.preventDefault();e.stopImmediatePropagation();
  }
}
function cancelOnManual(e){if(!nav.active)return;const t=e.target;if(t?.closest?.('#joy,#yControl,#yJoyV250'))stop('手動控制：XYZ 導航停止')}
function tick(){
  if(nav.active&&nav.target){const step=vectorToward3D(physical(),nav.target);nav.lastDistance=step.distance;if(step.arrived){stop('已到達 XYZ 目的地')}else setVector(step.vector);publish()}
  requestAnimationFrame(tick)
}
export function install11520XyzMapNavigation(){
  if(globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__)return globalThis.__K11520_XYZ_MAP_NAVIGATION__;
  globalThis.__K11520_XYZ_MAP_NAV_INSTALLED__=true;
  for(const type of ['pointerdown','pointermove','pointerup'])document.addEventListener(type,intercept,true);
  document.addEventListener('pointerdown',cancelOnManual,true);
  publish();requestAnimationFrame(tick);return globalThis.__K11520_XYZ_MAP_NAVIGATION__;
}
