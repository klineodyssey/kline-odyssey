/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: XYZ Plane Map
VERSION: 1.1.0
REVISION: 2026-09-09.LIVE-K-ORIGIN
PURPOSE: Present the 3D world through the active XZ / XY / YZ control plane. The map follows the joystick plane; the remaining axis is shown as signed depth. Live KX/KY/KZ market values define the absolute map origin while local world offsets remain unchanged.
*/

import {WORLD_OBJECTS} from './world-runtime.mjs';
import {install11520XyzMapNavigation} from './xyz-map-navigation-runtime.mjs';

const MODE_SPECS=Object.freeze({
  XZ:Object.freeze({h:'X',v:'Z',depth:'Y',normal:'KY'}),
  XY:Object.freeze({h:'X',v:'Y',depth:'Z',normal:'KZ'}),
  YZ:Object.freeze({h:'Y',v:'Z',depth:'X',normal:'KX'}),
});
const RANGE=34;
const overlays=new WeakMap();

const finite=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
export function planeSpec(mode='XZ'){return MODE_SPECS[mode]||MODE_SPECS.XZ}
export function projectPlanePoint(point={},center={},mode='XZ',{width=1,height=1,range=RANGE}={}){
  const s=planeSpec(mode),r=Math.max(Number.EPSILON,Math.abs(finite(range,RANGE)));
  const h=s.h.toLowerCase(),v=s.v.toLowerCase(),d=s.depth.toLowerCase();
  return {
    px:width/2+((finite(point[h])-finite(center[h]))/r)*(width/2),
    py:height/2-((finite(point[v])-finite(center[v]))/r)*(height/2),
    depth:finite(point[d])-finite(center[d]),
    h:s.h,v:s.v,depthAxis:s.depth,normal:s.normal,
  };
}

function mode(){return globalThis.__K11520_3D_CONTROL__?.mode||globalThis.__K11520_WORLD_COORDS__?.mode||'XZ'}
function coords(){return globalThis.__K11520_WORLD_COORDS__?.physical||{x:0,y:0,z:0}}
function zoom(){return 1.3}
function axisQuote(axis){
  const text=document.querySelector(`[data-axis="${axis}"] .q`)?.textContent||'';
  const cleaned=String(text).replace(/[^0-9+\-.]/g,'');
  return finite(cleaned,0);
}
export function liveMarketOrigin(){return{x:axisQuote('KX'),y:axisQuote('KY'),z:axisQuote('KZ')}}
function absolutePoint(local={},origin=liveMarketOrigin()){
  return{x:finite(origin.x)+finite(local.x),y:finite(origin.y)+finite(local.y),z:finite(origin.z)+finite(local.z)};
}
function cleanLegacyMiniChrome(base){
  const wrap=base?.closest?.('.minimapWrap');if(!wrap)return;
  for(const n of [...wrap.children]){
    if(n===base||n.classList?.contains('k11520PlaneMapOverlay'))continue;
    n.style.setProperty('display','none','important');
    n.setAttribute('aria-hidden','true');
  }
  wrap.dataset.k11520PlaneMapChrome='clean';
}
function ensureOverlay(base){
  if(!base)return null;cleanLegacyMiniChrome(base);
  let c=overlays.get(base);
  if(c&&document.body.contains(c))return c;
  const parent=base.parentElement;if(!parent)return null;
  const ps=getComputedStyle(parent);if(ps.position==='static')parent.style.position='relative';
  c=document.createElement('canvas');c.className='k11520PlaneMapOverlay';c.width=base.width;c.height=base.height;
  Object.assign(c.style,{position:'absolute',pointerEvents:'none',zIndex:'4',borderRadius:'8px'});
  parent.appendChild(c);overlays.set(base,c);cleanLegacyMiniChrome(base);return c;
}
function placeOverlay(base,canvas){
  canvas.style.left=`${base.offsetLeft}px`;canvas.style.top=`${base.offsetTop}px`;
  canvas.style.width=`${base.clientWidth}px`;canvas.style.height=`${base.clientHeight}px`;
}
function depthLabel(n){const x=finite(n);return `${x>=0?'+':'−'}${Math.abs(x).toFixed(Math.abs(x)>=10?0:1)}`}
function quoteLabel(n){const x=finite(n);return Math.abs(x)>=1000?x.toFixed(1):Math.abs(x)>=10?x.toFixed(2):x.toFixed(4)}
function drawGrid(ctx,w,h){ctx.strokeStyle='#204355';ctx.lineWidth=1;for(let i=0;i<=8;i++){const x=i*w/8,y=i*h/8;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}}
function drawOverlay(base){
  cleanLegacyMiniChrome(base);
  const canvas=ensureOverlay(base);if(!canvas)return;placeOverlay(base,canvas);
  if(canvas.width!==base.width)canvas.width=base.width;if(canvas.height!==base.height)canvas.height=base.height;
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,m=mode(),spec=planeSpec(m),localCenter=coords(),origin=liveMarketOrigin(),center=absolutePoint(localCenter,origin),range=RANGE/zoom();
  ctx.clearRect(0,0,w,h);
  if(m!=='XZ'){ctx.fillStyle='#05121b';ctx.fillRect(0,0,w,h);drawGrid(ctx,w,h)}
  else{ctx.fillStyle='rgba(5,18,27,.78)';ctx.fillRect(0,0,w,42)}
  ctx.font='700 10px system-ui';ctx.textBaseline='top';ctx.fillStyle='#9eeeff';ctx.fillText(`${m} 切面 · ⟂ ${spec.normal}`,6,4);
  ctx.font='700 7px system-ui';ctx.fillStyle='#f1ca73';ctx.fillText(`原點 KX ${quoteLabel(origin.x)} · KY ${quoteLabel(origin.y)} · KZ ${quoteLabel(origin.z)}`,6,17);
  ctx.fillStyle='#d6ecf6';ctx.fillText(`${spec.depth} 絕對 ${quoteLabel(center[spec.depth.toLowerCase()])}`,6,29);
  if(m!=='XZ'){
    for(const o of WORLD_OBJECTS){
      const p=projectPlanePoint(absolutePoint(o,origin),center,m,{width:w,height:h,range});
      if(p.px<0||p.px>w||p.py<0||p.py>h)continue;
      const alpha=Math.max(.25,1-Math.min(1,Math.abs(p.depth)/range)*.7);
      ctx.globalAlpha=alpha;ctx.fillStyle=o.kind==='ATM'?'#9fdff0':'#b68a55';
      ctx.fillRect(p.px-4,p.py-4,8,8);ctx.globalAlpha=1;
      ctx.fillStyle=p.depth>=0?'#73e7a7':'#ff9d8b';ctx.font='700 7px system-ui';ctx.fillText(`${spec.depth}${depthLabel(p.depth)}`,p.px+5,p.py-5);
    }
    const ctl=globalThis.__K11520_3D_CONTROL__,v=ctl?.vector||{x:0,y:0,z:0},hAxis=spec.h.toLowerCase(),vAxis=spec.v.toLowerCase();
    ctx.fillStyle='#65e798';ctx.beginPath();ctx.arc(w/2,h/2,5,0,Math.PI*2);ctx.fill();
    const vx=finite(v[hAxis]),vy=finite(v[vAxis]);if(Math.abs(vx)+Math.abs(vy)>.03){ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(w/2,h/2);ctx.lineTo(w/2+vx*16,h/2-vy*16);ctx.stroke()}
    ctx.fillStyle='#9ca8b3';ctx.font='600 7px system-ui';ctx.fillText('點圖設定此切面 XYZ waypoint',6,h-12);
  }
  globalThis.__K11520_PLANE_MAP__={organ:'XYZ Plane Map',mode:m,hAxis:spec.h,vAxis:spec.v,depthAxis:spec.depth,normalAxis:spec.normal,marketOrigin:{...origin},localCenter:{...localCenter},center:{...center},originSemantics:'LIVE_KX_KY_KZ_PLUS_LOCAL_WORLD_OFFSET',dynamicPlane:true,threeDimensionalWorld:true,legacyMiniChromeHidden:true,planeWaypointNavigation:true};
}
function tick(){const bases=[document.querySelector('#minimap'),document.querySelector('#fullMap')].filter(Boolean);for(const b of bases)drawOverlay(b);requestAnimationFrame(tick)}
export function install11520PlaneMap(){install11520XyzMapNavigation();requestAnimationFrame(tick);return globalThis.__K11520_PLANE_MAP__||{organ:'XYZ Plane Map',dynamicPlane:true,planeWaypointNavigation:true}}
