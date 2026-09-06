/* KGEN_META
VERSION: 2.3.0
STATUS: ACTIVE
PURPOSE: Start a local degraded playable shell immediately, then hand over to the full 3D runtime when its external modules finish loading.
*/
import {install11520ProductFixes} from './game-ui-product-fixes.mjs';
import {joystickToWorld,worldHeading,worldToNorthUpMap} from './spatial-coordinate-runtime.mjs';

const $=s=>document.querySelector(s);
const S={xyz:{x:0,y:0,z:0},heading:0,camYaw:0,joy:{x:0,z:0},mapZoom:1.3};
let stopped=false,raf=0,joyPid=null,last=performance.now();
const ac=new AbortController(),signal=ac.signal;
const fmt=n=>Number(n||0).toFixed(1).replace(/\.0$/,'');
function toast(t){const el=$('#toast');if(!el)return;el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1400)}
function hud(){const xyz=$('#xyz'),yr=$('#yRead');if(xyz)xyz.textContent=`X ${fmt(S.xyz.x)} · Y ${fmt(S.xyz.y)} · Z ${fmt(S.xyz.z)}`;if(yr)yr.textContent=`Y ${fmt(S.xyz.y)}`}
function setThumb(el,t){if(el)el.style.top=(100-Math.max(0,Math.min(1,t))*100)+'%'}
function bindVertical(sel,fn){const el=$(sel);if(!el)return;let pid=null;const calc=e=>{const r=el.getBoundingClientRect(),t=1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));fn(t);e.preventDefault()};el.addEventListener('pointerdown',e=>{pid=e.pointerId;el.setPointerCapture?.(pid);calc(e)},{signal});el.addEventListener('pointermove',e=>{if(e.pointerId===pid)calc(e)},{signal});for(const ev of['pointerup','pointercancel'])el.addEventListener(ev,e=>{if(e.pointerId===pid)pid=null},{signal})}
function drawMap(){const c=$('#minimap');if(!c)return;const ctx=c.getContext('2d'),w=c.width,h=c.height,view={centerX:S.xyz.x,centerZ:S.xyz.z,range:34/S.mapZoom,width:w,height:h};ctx.clearRect(0,0,w,h);ctx.fillStyle='#07151d';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#204355';for(let i=0;i<=8;i++){const x=i*w/8,y=i*h/8;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}const p=worldToNorthUpMap(S.xyz,view);ctx.fillStyle='#65e798';ctx.beginPath();ctx.arc(p.px,p.py,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(p.px,p.py);ctx.lineTo(p.px+Math.sin(S.heading)*14,p.py-Math.cos(S.heading)*14);ctx.stroke()}
function move(dt){S.xyz.x+=S.joy.x*dt*5;S.xyz.z+=S.joy.z*dt*5;S.xyz.y=Math.max(0,Math.min(40,S.xyz.y));}
function loop(now){if(stopped)return;const dt=Math.min(.05,(now-last)/1000);last=now;move(dt);hud();drawMap();raf=requestAnimationFrame(loop)}
function bindJoy(){const joy=$('#joy'),knob=$('#knob');if(!joy||!knob)return;const reset=()=>{S.joy.x=0;S.joy.z=0;knob.style.transform='translate(0,0)'};const input=e=>{const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,d=Math.hypot(dx,dy),travel=r.width/2*.68,k=Math.min(1,d/travel),nx=d?dx/d:0,ny=d?dy/d:0,v=joystickToWorld({nx:nx*k,ny:-ny*k,camYaw:S.camYaw});S.joy.x=v.x;S.joy.z=v.z;if(d>4)S.heading=worldHeading(v);knob.style.transform=`translate(${nx*k*35}px,${ny*k*35}px)`;e.preventDefault()};joy.addEventListener('pointerdown',e=>{if(e.target===knob)return;joyPid=e.pointerId;joy.setPointerCapture?.(joyPid);input(e)},{signal});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPid)input(e)},{signal});for(const ev of['pointerup','pointercancel'])joy.addEventListener(ev,e=>{if(e.pointerId===joyPid){joyPid=null;reset()}},{signal})}
function bindFallbackButtons(){const say=(id,msg)=>$(id)?.addEventListener('click',()=>toast(msg),{signal});say('#attack','離線/弱網模式：戰鬥操作可用，3D 尚未接管');say('#skill','技能已觸發（degraded mode）');say('#dodge','閃避已觸發（degraded mode）');say('#tradeSword','交易劍已切換（模擬）');say('#orderFire','行情/3D 未就緒時不送真交易');say('#flat','目前無正式持倉需要平倉');}
function startFallback(){install11520ProductFixes();bindJoy();bindVertical('#yControl',t=>{S.xyz.y=Math.round(t*40*10)/10;setThumb($('#yThumb'),t)});bindVertical('#lotsControl',t=>{const n=Math.max(1,Math.round(t*100));if($('#lotsRead'))$('#lotsRead').textContent=`${n}口`;setThumb($('#lotsThumb'),t)});bindVertical('#cControl',t=>{const vals=[0,.000001,.00001,.0001,.001,.01,.1,1,10,100,1000],i=Math.round(t*(vals.length-1));if($('#cRead'))$('#cRead').textContent=`${vals[i]}C`;setThumb($('#cThumb'),t)});bindFallbackButtons();const char=$('#charState'),feed=$('#feed');if(char)char.textContent='2D PLAYABLE · 3D CONNECTING';if(feed)feed.textContent='DEGRADED · 等待外部 3D/行情';document.documentElement.dataset.k11520Bootstrap='DEGRADED_PLAYABLE';hud();drawMap();raf=requestAnimationFrame(loop);toast('11520 V2.3 本地可玩模式已啟動')}
export function stopFallback(){if(stopped)return;stopped=true;ac.abort();cancelAnimationFrame(raf);document.documentElement.dataset.k11520Bootstrap='FULL_3D';}

startFallback();
const full=import('./game-5d-main.mjs');
full.then(()=>{stopFallback();}).catch(err=>{const char=$('#charState'),feed=$('#feed');if(char)char.textContent='2D PLAYABLE · 3D OFFLINE';if(feed)feed.textContent='DEGRADED · 3D/CDN 無法載入';console.warn('11520 full 3D runtime unavailable; degraded mode remains playable',err)});
