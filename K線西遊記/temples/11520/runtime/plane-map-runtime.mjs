/* KGEN_META
STATUS: ACTIVE
FORMAL_ORGAN_NAME: XYZ Plane Map
VERSION: 1.2.0
REVISION: 2026-09-21.KSPACE-MAP
PURPOSE: Project the existing combat K snapshot and local XYZ in separate views of the existing map. Presentation only; never derive game coordinates from display quotes or change combat authority.
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
let miniView='K';

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
// Compatibility export now reads normalized simulation coordinates, never UI prices.
export function liveMarketOrigin(){const k=globalThis.__K11520_KSPACE_API__?.snapshot?.()?.playerK;return{x:k?.KX??0,y:k?.KY??0,z:k?.KZ??0}}
function absolutePoint(local={},origin=liveMarketOrigin()){
  return{x:finite(origin.x)+finite(local.x),y:finite(origin.y)+finite(local.y),z:finite(origin.z)+finite(local.z)};
}
function cleanLegacyMiniChrome(base){
  const wrap=base?.closest?.('.minimapWrap');if(!wrap)return;
  for(const n of [...wrap.children]){
    if(n===base||n.classList?.contains('k11520PlaneMapOverlay')||n.id==='kspaceMapViews')continue;
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
function drawGrid(ctx,w,h){ctx.strokeStyle='#204355';ctx.lineWidth=1;for(let i=0;i<=8;i++){const x=i*w/8,y=i*h/8;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}}
export function kSpaceMapModel(snapshot,plane='XZ'){
  const spec=planeSpec(plane),axes=['KX','KY','KZ'];
  const valid=p=>p&&axes.every(a=>Number.isFinite(p[a]));
  if(!valid(snapshot?.playerK))return null;
  const player={...snapshot.playerK},monster=snapshot.target&&valid(snapshot.monsterK)?{...snapshot.monsterK}:null;
  const delta=monster?Object.fromEntries(axes.map(a=>[a,monster[a]-player[a]])):null;
  const sign=snapshot.selection?.sign===1?1:snapshot.selection?.sign===-1?-1:0;
  return {plane,h:'K'+spec.h,v:'K'+spec.v,normal:spec.normal,player,monster,delta,
    distance:delta?Math.hypot(...axes.map(a=>delta[a])):null,
    phase:spec.normal+(sign>0?'+':sign<0?'−':'0'),neutral:sign===0,
    targetId:monster?snapshot.target.id:null,local:{...snapshot.playerLocal},
    range:delta?Math.max(1,...axes.map(a=>Math.abs(delta[a])))*1.5:1.5};
}
export function projectKSpaceMap(model,width,height){
  const cx=width*.4,cy=height*.55,sx=width*.24/model.range,sy=height*.24/model.range;
  const point=k=>({x:cx+(k[model.h]-model.player[model.h])*sx,y:cy-(k[model.v]-model.player[model.v])*sy});
  return {player:point(model.player),monster:model.monster?point(model.monster):null,
    depthPlayer:cy,depthMonster:model.delta?cy-model.delta[model.normal]*sy:null,depthX:width-13};
}
function arrow(ctx,a,b){const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<1)return;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();const ux=dx/len,uy=dy/len;ctx.beginPath();ctx.moveTo(b.x,b.y);ctx.lineTo(b.x-ux*5+uy*3,b.y-uy*5-ux*3);ctx.lineTo(b.x-ux*5-uy*3,b.y-uy*5+ux*3);ctx.closePath();ctx.fill()}
function kMarker(ctx,p,monster){if(!p)return;ctx.fillStyle=monster?'#ffca69':'#60edff';ctx.strokeStyle='#06131c';ctx.lineWidth=1.5;ctx.beginPath();if(monster){ctx.moveTo(p.x,p.y-5);ctx.lineTo(p.x+5,p.y);ctx.lineTo(p.x,p.y+5);ctx.lineTo(p.x-5,p.y);ctx.closePath()}else ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();ctx.stroke()}
function paintKMap(canvas,model){
  const w=canvas.clientWidth||300,h=canvas.clientHeight||180,ratio=Math.min(3,globalThis.devicePixelRatio||1);
  if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio)}
  const ctx=canvas.getContext('2d');ctx.setTransform(ratio,0,0,ratio,0,0);ctx.fillStyle='#06131c';ctx.fillRect(0,0,w,h);
  ctx.font='bold 10px system-ui';ctx.textBaseline='top';ctx.fillStyle='#d5eaf7';
  if(!model){ctx.fillText('K-SPACE · 等待',4,4);canvas.setAttribute('aria-label','K-space unavailable');return}
  const p=projectKSpaceMap(model,w,h),large=w>180;
  ctx.fillStyle=model.neutral?'#c4cbd5':'#ffd27c';if(!large)ctx.fillText(`${model.phase} ${model.neutral?'中性':'相位'}`,4,2);
  ctx.strokeStyle='#537082';ctx.lineWidth=1;
  arrow(ctx,{x:8,y:p.player.y},{x:w*.71,y:p.player.y});arrow(ctx,{x:p.player.x,y:h-18},{x:p.player.x,y:21});
  ctx.fillStyle='#b8d5e9';ctx.fillText(model.h,w*.54,h-24);ctx.fillText(model.v,4,18);ctx.fillText(model.normal,w-25,large?15:2);
  ctx.setLineDash([2,2]);ctx.beginPath();ctx.moveTo(p.depthX,28);ctx.lineTo(p.depthX,h-18);ctx.stroke();ctx.setLineDash([]);
  if(p.monster){ctx.strokeStyle='#ffca69';ctx.fillStyle='#ffca69';arrow(ctx,p.player,p.monster);arrow(ctx,{x:p.depthX,y:p.depthPlayer},{x:p.depthX,y:p.depthMonster});kMarker(ctx,p.monster,true);kMarker(ctx,{x:p.depthX,y:p.depthMonster},true)}
  // Concentric circle/diamond truthfully show coincident planar points; the depth rail separates them.
  kMarker(ctx,p.player,false);kMarker(ctx,{x:p.depthX,y:p.depthPlayer},false);
  ctx.fillStyle='#60edff';ctx.fillText('P',p.player.x-12,p.player.y+2);
  if(p.monster){ctx.fillStyle='#ffca69';ctx.fillText('M',p.monster.x+6,p.monster.y-12)}
  ctx.fillStyle='#cde8ef';ctx.fillText(model.distance===null?'無 K 目標':`ΔK ${model.distance.toFixed(1)} Ku`,4,h-12);
  if(large){ctx.fillStyle='#60edff';ctx.fillText('● PLAYER',8,3);ctx.fillStyle='#ffca69';ctx.fillText('◆ MONSTER',100,3);ctx.fillStyle='#e6dbbb';ctx.fillText(`${model.phase} · ${model.neutral?'NO ATTACK PHASE':'ACTIVE'}`,w-170,3);ctx.fillStyle='#adc4d5';ctx.fillText('normal / depth',w-93,h-12)}
  canvas.setAttribute('aria-label',`K-space ${model.plane}: ${model.h} horizontal, ${model.v} vertical, ${model.normal} depth; ${model.phase}; ${model.targetId||'no target'}; delta ${model.distance??'unavailable'} Ku`);
}
const kNumber=n=>{const v=Math.round(n*10)/10;return `${v>0?'+':''}${Object.is(v,-0)?0:v.toFixed(1)}`};
function updateKDetails(model){
  const canvas=document.querySelector('#kspaceDetailMap');if(!canvas||!document.querySelector('#sheet.open'))return;
  paintKMap(canvas,model);const body=document.querySelector('#kspaceMapValues');if(!body)return;if(!model){body.textContent='K-space snapshot unavailable';return}
  const tuple=p=>p?['KX','KY','KZ'].map(a=>kNumber(p[a])).join(' / '):'—';
  const lines=[`PLAYER K: ${tuple(model.player)}`,`MONSTER K: ${tuple(model.monster)}`,`ΔK: ${tuple(model.delta)}`,`DIST: ${model.distance===null?'—':model.distance.toFixed(2)+' Ku'}`,`PLANE: ${model.plane} · NORMAL: ${model.normal}`,`ACTIVE: ${model.phase}${model.neutral?' / NEUTRAL / NO ATTACK PHASE':''}`,`TARGET: ${model.targetId||'NONE'}`,`LOCAL XYZ: ${['x','y','z'].map(a=>kNumber(finite(model.local[a]))).join(' / ')}`];
  body.textContent=lines.join('\n');
}
function showKDetails(){
  document.querySelector('#sheetTitle').textContent='K-SPACE · 市場座標';
  document.querySelector('#sheetBody').innerHTML='<p style="margin:0 0 8px">● PLAYER / ◆ MONSTER · KX / KY / KZ（Ku）</p><canvas id="kspaceDetailMap" style="display:block;width:100%;height:180px;border-radius:8px" role="img"></canvas><pre id="kspaceMapValues" style="font:13px/1.65 system-ui;white-space:pre-wrap;overflow-wrap:anywhere"></pre><p class="muted">K = 正規化模擬參考座標；LOCAL XYZ = 自主移動。箭頭為 Player → Monster，右側虛線為第三軸深度；不是原始報價或實際攻擊距離。</p><button id="kspaceShowLocal" class="btn" style="min-height:44px">切換 LOCAL XYZ 導航圖</button>';
  document.querySelector('#sheet').classList.add('open');
  document.querySelector('#kspaceShowLocal').onclick=()=>{miniView='XYZ';document.querySelector('#sheet').classList.remove('open')};
}
function ensureMapViews(base){
  const wrap=base.closest('.minimapWrap');if(!wrap)return;
  let views=document.querySelector('#kspaceMapViews');
  if(!views){views=document.createElement('div');views.id='kspaceMapViews';Object.assign(views.style,{position:'absolute',left:'5px',right:'5px',bottom:'3px',height:'44px',display:'flex',zIndex:'5'});
    for(const view of ['K','XYZ']){const b=document.createElement('button');b.type='button';b.id='kspaceView'+view;b.textContent=view==='K'?'K圖 ↗':'XYZ';b.setAttribute('aria-label',view==='K'?'K-space 地圖 / 展開':'LOCAL XYZ 導航圖');Object.assign(b.style,{width:'50%',minHeight:'44px',padding:'0',font:'bold 11px system-ui',background:'#102332',color:'#d4f1ff',border:'1px solid #3a5568',borderRadius:'6px'});b.onclick=()=>{if(view==='K'&&miniView==='K')showKDetails();miniView=view};views.append(b)}wrap.append(views);
    for(const event of ['pointerdown','pointermove','pointerup'])base.addEventListener(event,e=>{if(miniView!=='K')return;e.preventDefault();e.stopImmediatePropagation();if(event==='pointerup')showKDetails()},true);
    base.tabIndex=0;base.addEventListener('keydown',e=>{if(miniView==='K'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();showKDetails()}});
  }
  base.style.setProperty('height',`${Math.max(54,wrap.clientHeight-54)}px`,'important');
  for(const b of views.children){const selected=b.id==='kspaceView'+miniView;b.setAttribute('aria-pressed',String(selected));b.style.color=selected?'#ffdb90':'#d4f1ff'}
  base.dataset.coordinateSpace=miniView;base.setAttribute('aria-label',miniView==='K'?'K-space 玩家與怪物座標；點擊展開':'LOCAL XYZ waypoint 導航');
}
function drawOverlay(base){
  cleanLegacyMiniChrome(base);
  if(base.id==='minimap')ensureMapViews(base);
  const canvas=ensureOverlay(base);if(!canvas)return;placeOverlay(base,canvas);
  const snapshot=globalThis.__K11520_KSPACE_API__?.snapshot?.(),model=kSpaceMapModel(snapshot,mode());
  const m=mode(),spec=planeSpec(m),localCenter=coords(),origin=liveMarketOrigin(),center=absolutePoint(localCenter,origin),range=RANGE/zoom();
  globalThis.__K11520_PLANE_MAP__={organ:'XYZ Plane Map',mode:m,hAxis:spec.h,vAxis:spec.v,depthAxis:spec.depth,normalAxis:spec.normal,marketOrigin:{...origin},localCenter:{...localCenter},center:{...center},originSemantics:'NORMALIZED_K_PLUS_LOCAL_WORLD_OFFSET',dynamicPlane:true,threeDimensionalWorld:true,legacyMiniChromeHidden:true,planeWaypointNavigation:true};
  updateKDetails(model);
  if(base.id==='minimap')globalThis.__K11520_KSPACE_MAP__={...model,view:miniView,source:'COMBAT_SNAPSHOT',coordinateSpace:'NORMALIZED_K',localNavigationPreserved:true};
  if(base.id==='minimap'&&miniView==='K'){paintKMap(canvas,model);return}
  if(canvas.width!==base.width)canvas.width=base.width;if(canvas.height!==base.height)canvas.height=base.height;
  const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);
  if(m!=='XZ'){ctx.fillStyle='#05121b';ctx.fillRect(0,0,w,h);drawGrid(ctx,w,h)}
  else{ctx.fillStyle='rgba(5,18,27,.78)';ctx.fillRect(0,0,w,42)}
  ctx.font='700 10px system-ui';ctx.textBaseline='top';ctx.fillStyle='#9eeeff';ctx.fillText(`${m} 切面 · ⟂ ${spec.normal}`,6,4);
  ctx.font='700 10px system-ui';ctx.fillStyle='#f1ca73';ctx.fillText('LOCAL XYZ · 自主移動',6,17);
  ctx.fillStyle='#d6ecf6';ctx.fillText(`${spec.depth} ${depthLabel(localCenter[spec.depth.toLowerCase()])}`,6,29);
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
}
function tick(){const bases=[document.querySelector('#minimap'),document.querySelector('#fullMap')].filter(Boolean);for(const b of bases)drawOverlay(b);requestAnimationFrame(tick)}
export function install11520PlaneMap(){install11520XyzMapNavigation();requestAnimationFrame(tick);return globalThis.__K11520_PLANE_MAP__||{organ:'XYZ Plane Map',dynamicPlane:true,planeWaypointNavigation:true}}
