/* KGEN_META
VERSION: 2.3.0
STATUS: ACTIVE
PURPOSE: 11520 5D game main runtime using unbounded XYZ control intent, collision-constrained physical body, plane-aware maps, canonical XYZ world/entity navigation and 3D Life visuals. Signed-C rendering is delegated to its canonical runtime; game state exposes one direct canonical trade-side setter.
*/
import * as THREE from 'three';
import {GLTFLoader} from 'https://cdn.jsdelivr.net/npm/three@0.180.0/examples/jsm/loaders/GLTFLoader.js';
import {createWorldState,createKSpaceEncounter,resolvePlayerMove,tickWorld,WORLD_OBJECTS,updateKMarketReference,kMarketSnapshot,formatKCoordinate,kCombatSnapshot,attackKSpace,KSPACE_PHASES,KSPACE_SKILLS} from './world-runtime.mjs';
import {createKgenLedger,positionRisk,snapshot} from './kgen-margin-runtime.mjs';
import {normalizeSignedC,signedPositionSide,signedCFromLegacyMagnitude} from './kgen-margin-runtime.mjs';
import {createExecutionAdapter} from './real-trading-order-intent.mjs';
import {getWalletSession11520} from './wallet-game-bridge.mjs';
import {readPublicWalletIdentity,readPlayerSession,savePlayerSession,createSimulationPlayerStore} from './evm-wallet-runtime.mjs';
import {joystickToWorld,worldToNorthUpMap,northUpMapToWorld,worldHeading,formatGameDistanceK,localPositionToK} from './spatial-coordinate-runtime.mjs';
import {collectInspectableEntities,inspectMapPoint,waypointSummary} from './map-object-navigation-runtime.mjs';
import {createLifeVisual,syncLifeVisual} from './life-visual-runtime.mjs';
import {install11520ProductFixes} from './game-ui-product-fixes.mjs';
import {create11520CombatFx} from './combat-fx-runtime.mjs';
import {setWorldTarget3D,startWorldNavigation3D,stopWorldNavigation3D} from './xyz-map-navigation-runtime.mjs';
import {warpC,resolveCMode} from '../controls/nonlinear-controls.mjs';
import {fetchPublicMarketObservations,publicObservationStatus} from './public-market-quotes.mjs';

const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const AXIS_MARKETS=Object.freeze({KX:'BTCUSDT',KY:'ETHUSDT',KZ:'BNBUSDT'});
const MARKETS=Object.freeze(Object.values(AXIS_MARKETS));
const PLANE_TRADE_AXIS=Object.freeze({XZ:'KY',XY:'KZ',YZ:'KX'});
const ORGANS=[['world','🌍','主城世界'],['trade','⚔','K場交易'],['positions','📌','持倉'],['orders','🧾','委託'],['history','🕘','歷史'],['assets','💰','資產'],['records','📊','統計'],['market','📈','市場'],['character','🧍','角色'],['worldmap','🗺','世界地圖'],['atm','🛸','ATM'],['bag','🎒','背包'],['settings','⚙','設定'],['help','✨','客服/說明']];
const RAIL_ORGANS=ORGANS.filter(([id])=>id!=='bag');
const S={axis:'KX',axes:{KX:{market:'BTCUSDT',side:'多',lots:1,c:0,pos:null},KY:{market:'ETHUSDT',side:'多',lots:1,c:0,pos:null},KZ:{market:'BNBUSDT',side:'多',lots:1,c:0,pos:null}},quotes:{},kaios:1000,hp:100,xyz:{x:0,y:0,z:0},intentXYZ:{x:0,y:0,z:0},heading:0,camYaw:0,joy:{sx:0,sy:0,x:0,z:0},history:[],walletKgen:null,mapZoom:1.3,navTarget:null,navActive:false};
const restoredSession=readPlayerSession();if(restoredSession){S.xyz={...restoredSession.xyz};S.intentXYZ={...restoredSession.intentXYZ}}
let lastSessionSave=0,lastSessionSnapshot='';function persistPlayerSession(force=false){const now=Date.now(),snapshot=JSON.stringify([S.xyz,S.intentXYZ]);if(!force&&(snapshot===lastSessionSnapshot||now-lastSessionSave<750))return;lastSessionSave=now;lastSessionSnapshot=snapshot;savePlayerSession({xyz:S.xyz,intentXYZ:S.intentXYZ})}addEventListener('pagehide',()=>persistPlayerSession(true));addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')persistPlayerSession(true)});
const ledger=createKgenLedger(100),world=createWorldState();let pending=null,combatFx=null;
const playerStore=createSimulationPlayerStore({ledger});playerStore.activate(null);
world.journeyEnabled=true;createKSpaceEncounter(world);
const simulationExecution=createExecutionAdapter({ledger,productV1:true,beforeMutation:()=>playerStore.check(),afterMutation:()=>playerStore.save()});
function productEvent(event,details){try{playerStore.record(event,details)}catch{toast('另一頁已更新玩家紀錄，請重新載入')}const p=playerStore.snapshot();S.kaios=p.kaios;return p}
S.kaios=playerStore.snapshot().kaios;
setInterval(()=>{if(document.visibilityState==='visible')productEvent(null,{elapsedMs:10000})},10000);
globalThis.__K11520_PRODUCT__=Object.freeze({snapshot:()=>({...playerStore.snapshot(),mode:resolveCMode(combatSelection().c),execution:'SIMULATION',productionTrading:'NOT_ACTIVATED',crossMarket:crossMarketSnapshot(),marketEngine:marketEngineSnapshot()})});
let execution=simulationExecution,executionBusy=false,previewSequence=0,previewRequests=0;
const isTestnet=()=>execution.mode==='BSC_TESTNET';
const executionLabel=()=>isTestnet()?'BSC TESTNET · NO REAL VALUE':'SIMULATION';
async function executionAction(action){
  if(executionBusy)return {ok:false,reason:'ACTION_IN_PROGRESS'};
  executionBusy=true;renderWallet();
  try{return await action()}catch(error){return {ok:false,code:'ORDER_REJECTED',reason:/^[A-Z_]+$/.test(error?.message)?error.message:'WALLET_REQUEST_FAILED'}}
  finally{executionBusy=false;syncSimulationPositions();renderWallet();refreshSimulationSheet();renderAxes()}
}
// Journey remains playable offline. Its initial reference frame is explicitly
// WAIT, never a fabricated live price or execution observation.
const fmt=(n,d=4)=>Number(n||0).toLocaleString(undefined,{maximumFractionDigits:d});
function toast(t,combat=false){const el=$('#toast');if(!el)return;el.dataset.kspaceFeedback=String(combat);el.textContent=t;el.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>el.classList.remove('show'),1700)}
function axis(){return S.axes[S.axis]}function price(){return S.quotes[axis().market]||0}
function normalizeTradeSide(value){return /空|SHORT|SELL/i.test(String(value||''))?'空':'多'}
function setTradeSide(axisId,value){const id=String(axisId||'').toUpperCase(),target=S.axes[id];if(!target)return false;const next=normalizeTradeSide(value);if(target.side!==next){target.side=next;document.dispatchEvent(new CustomEvent('k11520:trade-side-change',{detail:{axis:id,side:next,source:'SIGNED_C'}}))}return true}
globalThis.__K11520_TRADE_DIRECTION_API__=Object.freeze({version:'1.0.0',authority:'GAME_STATE_SIDE',setSide:(axisId,side)=>setTradeSide(axisId,side),getSide:axisId=>S.axes[String(axisId||'').toUpperCase()]?.side||null,snapshot:()=>Object.fromEntries(Object.entries(S.axes).map(([k,v])=>[k,v.side]))});

function renderAxes(){
  $('#axes').innerHTML=['KX','KY','KZ'].map(a=>{const x=S.axes[a],q=S.quotes[x.market],active=a===S.axis;return `<button type="button" class="axis panel ${active?'active':''}" data-axis="${a}" data-market-card="${a}" aria-current="${active?'true':'false'}" aria-label="查看 ${a} ${x.market.replace('USDT','/USDT')} 市場詳情"><div class="axisHead"><span>${a} 球膜軸</span><b>${q?'LIVE':'WAIT'}</b></div><span class="marketName">${x.market.replace('USDT','/USDT')}</span><span class="q">${q?'$'+fmt(q,q<10?5:2):'--'}</span><span class="pos">${x.pos?`${x.pos.side} ${x.pos.lots}口 · ${x.pos.c}C`:'空倉'}</span></button>`}).join('');
  $$('[data-market-card]').forEach(card=>card.onclick=()=>openMarketCard(card.dataset.marketCard));
  syncMarketKLabels();
}
function openMarketCard(axisId){const id=String(axisId||'').toUpperCase(),x=S.axes[id];if(!x)return;const q=S.quotes[x.market],p=x.pos;$('#sheetTitle').textContent=`${id} 市場｜${x.market.replace('USDT','/USDT')}`;$('#sheetBody').innerHTML=`<div class="card"><h3>${x.market.replace('USDT','/USDT')}</h3><p id="marketReferenceDetail" data-market-info-axis="${id}">參考價（非結算 Oracle）：${q?'$'+fmt(q,q<10?5:2):'WAIT'}</p><p>交易軸：${id===S.axis?'目前由三軸控制選中':'未選中；點市場卡不會改變交易軸'}</p><p>方向：${x.side}｜C ${x.c}｜${x.lots}口</p><p>持倉：${p?`${p.side} ${p.lots}口 @ ${fmt(p.entry,4)}`:'空倉'}</p><p class="muted">V1: |C| 0.001–1，0 fee，SIMULATION。免費 REST USDT 參考價不是 USD 結算 Oracle，不假設 USD=USDT。交易 authority 仍只由 XZ / XY / YZ 圖切換。</p></div>`;$('#sheet').classList.add('open')}
let quotePending=false,publicObservations={};
async function quotes(){
  if(quotePending)return;quotePending=true;
  try{
    publicObservations=await fetchPublicMarketObservations({symbols:MARKETS});
    const rows=Object.values(publicObservations),next=Object.fromEntries(rows.map(r=>[r.market,r.price]));
    if(rows.every(r=>!r.stale)){
      updateKMarketReference(world,next,Math.min(...rows.map(r=>r.updatedAt)));Object.assign(S.quotes,next);
      if(!isTestnet())for(const r of rows){const result=execution.observe({market:r.market,price:r.price,observedAt:r.updatedAt,sequence:r.sequence,now:Date.now()});if(result.ok)recordSimulationEvents(result.events)}
    }else world.kSpace.quoteFailed=true;
    syncSimulationPositions();if(pending&&!isTestnet())paintOrderPreview();
  }catch{world.kSpace.quoteFailed=true}
  finally{quotePending=false;if(pending&&!isTestnet())paintOrderPreview();renderAxes()}
}
function syncMarketKLabels(){
  if(!$('#marketKLabelsStyle')){const style=document.createElement('style');style.id='marketKLabelsStyle';style.textContent='.axis:has(.marketKValue) .universeFloorBadge{display:none!important}';document.head.append(style)}
  const market=kMarketSnapshot(world);
  for(const row of market.markets){
    const card=$(`[data-market-card="${row.axis}"]`);if(!card)continue;
    let label=card.querySelector('.marketKValue');if(!label){label=document.createElement('span');label.className='marketKValue';label.style.cssText='display:block;font:600 10px system-ui;color:#b9e7fa;white-space:nowrap';card.append(label)}
    label.textContent=`${row.axis} ${formatKCoordinate(row.k)} norm`;label.title=`Ni(P)=100×(P/${row.anchor}−1) · ${market.status} · ${new Date(market.receivedAt).toISOString()}`;
    card.querySelector('.axisHead b').textContent=market.status;
    const info=$('#marketReferenceDetail');if(info?.dataset.marketInfoAxis===row.axis)info.textContent=`${market.status} · $${row.price.toFixed(2)} · ${row.axis} ${formatKCoordinate(row.k)} norm`;
    const ref=$(`[data-k-reference="${row.axis}"]`);if(ref)ref.textContent=`${row.axis} ${row.symbol}: P=${row.price}, P0=${row.anchor}`;
  }
  const mode=resolveCMode(combatSelection().c),label=mode.mode==='MONSTER_MODE'?'取經 / MONSTER':mode.canTrade?'FREE TRADE · 0 FEE':'HIGH C LOCKED';
  $('#feed').textContent=`${label} · ${market.status==='LIVE'?'參考價 / SIM':'MARKET DATA STALE'}`;
  $('#feed').title='V1 · |C| 0.001–1 · SIMULATION ONLY · >1C production locked · 免費 REST 參考行情，非低延遲結算 Oracle';
  globalThis.__K11520_FREE_ORACLE__=Object.fromEntries(Object.entries(publicObservations).map(([m,o])=>[m,publicObservationStatus(o)]));
  globalThis.__K11520_MARKET_K__=market;
}
function controlState(){return globalThis.__K11520_3D_CONTROL__||globalThis.__K11520_JOYSTICK_XZXY__||null}
function tradeAxisForPlane(mode=controlState()?.mode||'XZ'){return PLANE_TRADE_AXIS[String(mode).toUpperCase()]||'KY'}
function syncTradeAxisFromPlane(){
  const next=tradeAxisForPlane();
  if(S.axis===next)return next;
  S.axis=next;syncControls();renderAxes();
  document.dispatchEvent(new CustomEvent('k11520:trade-axis-change',{detail:{axis:next,mode:controlState()?.mode||'XZ',market:S.axes[next].market,source:'PLANE_SWITCH'}}));
  return next;
}
globalThis.__K11520_TRADE_AXIS_API__=Object.freeze({version:'1.0.0',authority:'PLANE_NORMAL_AXIS',current:()=>syncTradeAxisFromPlane(),market:()=>axis().market,snapshot:()=>({axis:syncTradeAxisFromPlane(),market:axis().market,mode:controlState()?.mode||'XZ'})})
function controlVector(){const c=controlState(),v=c?.vector;if(v)return{x:Number(v.x)||0,y:Number(v.y)||0,z:Number(v.z)||0};return{x:S.joy.x,y:0,z:S.joy.z}}
function hud(){syncTradeAxisFromPlane();const s=execution.snapshot().wallet||{},c=controlState(),rail=c?.railAxis||'Y',ri=rail.toLowerCase();$('#topFree').textContent=s.free==null?'--':fmt(s.free,3);$('#topFree').previousElementSibling.textContent=isTestnet()?'TESTNET Brain Available':'KGEN Local Free';$('#topKaios').textContent=fmt(S.kaios,1);$('#topKaios').previousElementSibling.textContent='KAIOS LOCAL';$('#xyz').textContent=`LOCAL X ${formatGameDistanceK(S.intentXYZ.x)} · Y ${formatGameDistanceK(S.intentXYZ.y)} · Z ${formatGameDistanceK(S.intentXYZ.z)}`;$('#yRead').textContent=formatGameDistanceK(S.intentXYZ[ri],{compact:true});$('#hp').textContent=Math.max(0,Math.round(S.hp));$('#hpbar').style.width=Math.max(0,S.hp)+'%';$('#monsterList').innerHTML=world.monsters.filter(m=>m.state!=='DEAD'&&(m.name||m.baseName)).map(m=>`<div>${m.name||m.baseName} · ${Math.round(m.hp)}/${m.maxHp}</div>`).join('')||'<div class="muted">等待 Market Life</div>';const xyzNav=globalThis.__K11520_XYZ_MAP_NAVIGATION__;if(xyzNav?.target){const t=xyzNav.target,d=Math.hypot((t.x||0)-S.xyz.x,(t.y||0)-S.xyz.y,(t.z||0)-S.xyz.z);$('#navState').textContent=`${xyzNav.active?'XYZ 前往中':'XYZ 目標'} ${xyzNav.source||xyzNav.mode||''} · ${formatGameDistanceK(d)} · X ${formatGameDistanceK(t.x)} Y ${formatGameDistanceK(t.y)} Z ${formatGameDistanceK(t.z)}`}else if(S.navTarget){const w=waypointSummary(S.xyz,S.navTarget);$('#navState').textContent=`${S.navActive?'前往中':'目標'} ${w.direction} · ${formatGameDistanceK(w.distance)} · X ${formatGameDistanceK(w.targetX)} Z ${formatGameDistanceK(w.targetZ)}`}else $('#navState').textContent='雙指縮放 · 點圖選目標';globalThis.__K11520_WORLD_COORDS__={intent:{...S.intentXYZ},physical:{...S.xyz},physicalK:localPositionToK(S.xyz),distanceUnit:'METERS',mode:c?.mode||'XZ',unboundedIntent:true}}
function setThumb(el,t){el.style.top=(100-Math.max(0,Math.min(1,t))*100)+'%'}
function syncControls(){const a=axis();$('#lotsRead').textContent=`${a.lots}口`;setThumb($('#lotsThumb'),Math.min(1,a.lots/100));globalThis.__K11520_SIGNED_C_IMMERSIVE__?.api?.paintSignedC?.(S.axis);if(!controlState())setThumb($('#yThumb'),.5)}
function bindVertical(sel,fn){const el=$(sel);let pid=null;const calc=e=>{const r=el.getBoundingClientRect(),t=1-Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));fn(t);e.preventDefault()};el.addEventListener('pointerdown',e=>{pid=e.pointerId;try{el.setPointerCapture?.(pid)}catch{}calc(e)});el.addEventListener('pointermove',e=>{if(e.pointerId===pid)calc(e)});['pointerup','pointercancel'].forEach(ev=>el.addEventListener(ev,e=>{if(e.pointerId===pid)pid=null}))}
bindVertical('#lotsControl',t=>{axis().lots=Math.max(1,Math.round(t*100));syncControls()});bindVertical('#cControl',t=>{axis().c=warpC(t);syncControls()});

const joy=$('#joy'),knob=$('#knob');let joyPid=null;
function resetJoy(){S.joy.sx=0;S.joy.sy=0;S.joy.x=0;S.joy.z=0;knob.style.transform='translate(0,0)'}
function cancelNavigation(reason='手動控制'){if(S.navActive){S.navActive=false;toast(`${reason}：已停止自動導航`)}if(globalThis.__K11520_XYZ_MAP_NAVIGATION__?.active)stopWorldNavigation3D(`${reason}：XYZ 導航停止`)}
function joystickWorldVector(nx,screenNy){return joystickToWorld({nx,ny:-screenNy,camYaw:S.camYaw})}
function joyInput(e){const r=joy.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,dx=e.clientX-cx,dy=e.clientY-cy,dist=Math.hypot(dx,dy),travel=r.width/2*.68,k=Math.min(1,dist/travel),nx=dist?dx/dist:0,ny=dist?dy/dist:0;S.joy.sx=nx*k;S.joy.sy=ny*k;const v=joystickWorldVector(S.joy.sx,S.joy.sy);S.joy.x=v.x;S.joy.z=v.z;if(dist>4)S.heading=worldHeading(v);knob.style.transform=`translate(${nx*k*35}px,${ny*k*35}px)`;e.preventDefault()}
joy.addEventListener('pointerdown',e=>{if(e.target===knob)return;cancelNavigation();joyPid=e.pointerId;joy.setPointerCapture?.(joyPid);joyInput(e)});joy.addEventListener('pointermove',e=>{if(e.pointerId===joyPid)joyInput(e)});['pointerup','pointercancel'].forEach(ev=>joy.addEventListener(ev,e=>{if(e.pointerId===joyPid){joyPid=null;resetJoy()}}));
let lookPid=null,lx=0;$('#lookPad').addEventListener('pointerdown',e=>{lookPid=e.pointerId;lx=e.clientX;$('#lookPad').setPointerCapture?.(lookPid)});$('#lookPad').addEventListener('pointermove',e=>{if(e.pointerId===lookPid){S.camYaw-=(e.clientX-lx)*.008;lx=e.clientX;if(Math.hypot(S.joy.sx,S.joy.sy)>.02){const v=joystickWorldVector(S.joy.sx,S.joy.sy);S.joy.x=v.x;S.joy.z=v.z;S.heading=worldHeading(v)}}});['pointerup','pointercancel'].forEach(ev=>$('#lookPad').addEventListener(ev,e=>{if(e.pointerId===lookPid)lookPid=null}));
function moveManual(){const v=controlVector(),mag=Math.abs(v.x)+Math.abs(v.y)+Math.abs(v.z);if(mag<.02)return;S.xyz.y=Math.max(0,S.xyz.y);const speed=.10;S.intentXYZ={x:S.intentXYZ.x+v.x*speed,y:S.intentXYZ.y+v.y*speed,z:S.intentXYZ.z+v.z*speed};const next={x:S.xyz.x+v.x*speed,y:S.xyz.y+v.y*speed,z:S.xyz.z+v.z*speed};if(Math.abs(v.x)+Math.abs(v.z)>.02)S.heading=worldHeading({x:v.x,z:v.z});let blocked=false,blocker=null;if(next.y<0){blocked=true;blocker={name:'GROUND'}}else if(Math.abs(next.y)<4){const r=resolvePlayerMove(S.xyz,next);blocked=!!r.blocked;blocker=r.blocker||null}if(blocked){$('#collision').textContent=`BLOCKED · ${blocker?.name||'WORLD'} · BODY X ${formatGameDistanceK(S.xyz.x)} Y ${formatGameDistanceK(S.xyz.y)} Z ${formatGameDistanceK(S.xyz.z)}`}else{S.xyz=next;$('#collision').textContent='CLEAR'}}
function setWaypoint(x,z){S.navTarget={x,z};S.navActive=false;showWaypointAction();hud()}
function startNavigation(){if(!S.navTarget)return;S.navActive=true;$('#waypointAction')?.remove();toast('開始前往目標')}
function showWaypointAction(){document.getElementById('waypointAction')?.remove();if(!S.navTarget)return;const w=waypointSummary(S.xyz,S.navTarget),b=document.createElement('button');b.id='waypointAction';b.className='waypointAction';b.textContent=`前往 ${w.direction} · ${formatGameDistanceK(w.distance)}`;b.onclick=startNavigation;document.body.appendChild(b)}
function moveNavigation(){if(!S.navActive||!S.navTarget)return;const dx=S.navTarget.x-S.xyz.x,dz=S.navTarget.z-S.xyz.z,d=Math.hypot(dx,dz);if(d<.35){S.navActive=false;S.navTarget=null;toast('已到達目的地');return}const ux=dx/d,uz=dz/d,step=.085;S.heading=worldHeading({x:ux,z:uz});const direct=resolvePlayerMove(S.xyz,{x:S.xyz.x+ux*step,y:S.xyz.y,z:S.xyz.z+uz*step});if(!direct.blocked){S.xyz={x:S.xyz.x+ux*step,y:S.xyz.y,z:S.xyz.z+uz*step};S.intentXYZ={...S.xyz};$('#collision').textContent='NAV CLEAR';return}for(const p of[{x:-uz,z:ux},{x:uz,z:-ux}]){const r=resolvePlayerMove(S.xyz,{x:S.xyz.x+p.x*step,y:S.xyz.y,z:S.xyz.z+p.z*step});if(!r.blocked){S.xyz={x:S.xyz.x+p.x*step,y:S.xyz.y,z:S.xyz.z+p.z*step};S.intentXYZ={...S.xyz};S.heading=worldHeading(p);$('#collision').textContent='NAV DETOUR';return}}S.navActive=false;toast(`導航受阻：${direct.blocker?.name||'WORLD'}`)}

const MAP_RANGE=34;
function mapView(canvas){return{centerX:S.xyz.x,centerZ:S.xyz.z,range:MAP_RANGE/S.mapZoom,width:canvas.width,height:canvas.height}}
function drawMap(canvas){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,view=mapView(canvas);ctx.clearRect(0,0,w,h);ctx.fillStyle='#07151d';ctx.fillRect(0,0,w,h);ctx.strokeStyle='#204355';for(let i=0;i<=8;i++){const x=i*w/8,y=i*h/8;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}for(const o of WORLD_OBJECTS){const p=worldToNorthUpMap(o,view);ctx.fillStyle='#9a6b35';ctx.fillRect(p.px-4,p.py-4,8,8)}for(const m of world.monsters){if(m.state==='DEAD'||!(m.name||m.baseName))continue;const p=worldToNorthUpMap(m,view);ctx.fillStyle=m.sourceManaged?'#f4d77f':'#78d4a8';ctx.beginPath();ctx.arc(p.px,p.py,4,0,Math.PI*2);ctx.fill()}if(S.navTarget){const p=worldToNorthUpMap(S.navTarget,view);ctx.strokeStyle='#68e4ff';ctx.beginPath();ctx.moveTo(w/2,h/2);ctx.lineTo(p.px,p.py);ctx.stroke();ctx.fillStyle='#68e4ff';ctx.beginPath();ctx.arc(p.px,p.py,5,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#65e798';ctx.beginPath();ctx.arc(w/2,h/2,5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff';ctx.beginPath();ctx.moveTo(w/2,h/2);ctx.lineTo(w/2+Math.sin(S.heading)*14,h/2-Math.cos(S.heading)*14);ctx.stroke()}
function showEntityInfo(entity){$('#sheetTitle').textContent='世界物件';$('#sheetBody').innerHTML=`<div class="card"><h3>${entity.objectName}</h3><p>OBJECT_TYPE：${entity.objectType}</p><p>LIFE_ID：${entity.lifeId||'NOT_ASSIGNED'}</p><p>X/Y/Z：${fmt(entity.x,2)} / ${fmt(entity.y,2)} / ${fmt(entity.z,2)}</p><p>功能：${entity.functionText}</p><p>互動：${entity.interactionText}</p><button class="btn" id="navToEntity">前往這裡</button></div>`;$('#sheet').classList.add('open');$('#navToEntity').onclick=()=>{cancelNavigation('切換世界目標');S.navTarget=null;document.getElementById('waypointAction')?.remove();setWorldTarget3D({x:entity.x,y:entity.y,z:entity.z},{mode:'WORLD',source:'WORLD_ENTITY'});$('#sheet').classList.remove('open');startWorldNavigation3D()}}
function mapTap(canvas,e){const r=canvas.getBoundingClientRect(),px=(e.clientX-r.left)/r.width*canvas.width,py=(e.clientY-r.top)/r.height*canvas.height,entities=collectInspectableEntities({objects:WORLD_OBJECTS,monsters:world.monsters}),hit=inspectMapPoint({px,py,view:mapView(canvas),entities});if(hit.kind==='ENTITY'){showEntityInfo(hit.entity);return}setWaypoint(hit.world.x,hit.world.z)}
function bindMap(canvas){const pointers=new Map();let pinchBase=null,moved=false;canvas.addEventListener('pointerdown',e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});canvas.setPointerCapture?.(e.pointerId);moved=false;if(pointers.size===2){const a=[...pointers.values()];pinchBase={dist:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),zoom:S.mapZoom}}e.preventDefault()});canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;const p=pointers.get(e.pointerId);if(Math.hypot(e.clientX-p.x,e.clientY-p.y)>4)moved=true;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&pinchBase){const a=[...pointers.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);S.mapZoom=Math.max(.65,Math.min(4,pinchBase.zoom*(d/pinchBase.dist)));drawAllMaps()}e.preventDefault()});const end=e=>{const wasPinch=pointers.size>1;if(!wasPinch&&!moved)mapTap(canvas,e);pointers.delete(e.pointerId);if(pointers.size<2)pinchBase=null;e.preventDefault()};canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',e=>pointers.delete(e.pointerId))}
const mini=$('#minimap');bindMap(mini);let fullMapCanvas=null;function drawAllMaps(){drawMap(mini);if(fullMapCanvas&&document.body.contains(fullMapCanvas))drawMap(fullMapCanvas)}

function combatSelection(){syncTradeAxisFromPlane();return {plane:controlState()?.mode||'XZ',c:globalThis.__K11520_SIGNED_C_IMMERSIVE__?.signedByAxis?.[S.axis]??0}}
function combatSnapshot(){return kCombatSnapshot(world,S.xyz,combatSelection())}
function attackFeedback(r){
  const reasons={NEUTRAL_PHASE:'0C 中性：調整 C 正負選部位',COOLDOWN:'技能冷卻中',OUT_OF_RANGE:'MISS · 超出範圍',OUTSIDE_SWEEP:'MISS · 目標在身後',NO_TARGET:'守衛已擊倒 · 點目標開始新練習',BODY_DISABLED:'部位已破壞 · 換軸或相位',INVALID_INPUT:'控制尚未就緒'};
  return r.hit?`${r.reason==='WEAK_POINT'?'WEAK POINT 弱點':r.reason==='BLOCKED_RESIST'?'BLOCKED 抵抗':'HIT 命中'} · ${r.hits.map(h=>`${h.body} −${h.damage}`).join(' / ')}${r.defeated?' · 擊倒 · KAIOS 戰利品記帳':''}`:reasons[r.reason]||'MISS';
}
function performCombat(skill){
  const r=attackKSpace(world,S.xyz,{...combatSelection(),skill,heading:S.heading,now:Date.now(),powerLevel:playerStore.snapshot().level}),audioFx=globalThis.__K11520_AUDIO_FX__;
  toast(attackFeedback(r),true);
  if(r.reason!=='COOLDOWN')audioFx?.play?.('attack');
  if(r.hit)audioFx?.play?.(r.reason==='WEAK_POINT'?'weak':'hit');
  if(r.defeated){productEvent('MONSTER_KILL');if(r.loot){const p=productEvent('LOOT_DROP',{reward:r.rewardKaios}),rewardLabel=p.owner==='guest'?'本機 KAIOS':'錢包綁定 KAIOS 待發放';audioFx?.play?.('loot');audioFx?.speak?.(`擊倒${r.loot.name||'妖怪'}，獲得 ${r.rewardKaios} KAIOS`);toast(`掉寶：${r.loot.name} ×${r.loot.quantity} · ${r.loot.rarity} / ${rewardLabel} +${r.rewardKaios} · Lv.${p.level}`,true)}}
  if(r.reason!=='COOLDOWN'){playAttack();const m=world.monsters.find(m=>m.id===world.kSpace?.targetId);combatFx?.trigger({variant:skill,heading:S.heading,target:r.hit&&m?{x:m.x,y:m.y,z:m.z}:null})}
  renderCombatTarget();return r;
}
$('#attack').onclick=()=>performCombat('slash');$('#skill').onclick=()=>performCombat('goldenRain');
$('#tradeSword').onclick=()=>performCombat('phantomAxe');
$('#dodge').onclick=()=>{cancelNavigation('閃避');const next={x:S.xyz.x+Math.sin(S.heading)*1.4,y:S.xyz.y,z:S.xyz.z+Math.cos(S.heading)*1.4},r=resolvePlayerMove(S.xyz,next);if(!r.blocked){S.xyz=next;S.intentXYZ={...S.xyz};toast('閃避')}};
$('#flat').onclick=closePos;$('#orderFire').onclick=openOrder;
const targetHud=document.createElement('button');targetHud.id='kspaceTarget';targetHud.className='panel';targetHud.type='button';targetHud.title='K-space 取經目標：點擊展開座標與六相部位';targetHud.hidden=true;document.body.appendChild(targetHud);
const monsterHud=document.querySelector('.monsterHud');if(monsterHud){monsterHud.style.cursor='pointer';monsterHud.title='點擊查看 K-space 六相戰鬥詳情';monsterHud.addEventListener('click',e=>{if(e.target.closest('details'))return;showCombatTarget()})}
const monsterGuide=document.createElement('div');monsterGuide.id='k11520MonsterGuide';monsterGuide.setAttribute('aria-live','polite');monsterGuide.style.cssText='position:fixed;z-index:520;left:50%;top:52%;transform:translate(-50%,-50%);pointer-events:none;max-width:min(76vw,330px);padding:7px 11px;border:1px solid #68e4ff88;border-radius:12px;background:#071018dd;color:#eafaff;font:800 12px/1.35 system-ui;text-align:center;box-shadow:0 8px 24px #0009';document.body.appendChild(monsterGuide);
function monsterScreenGuide(snapshot){
  const target=world.monsters.find(m=>m.id===world.kSpace?.targetId&&m.simulationCombat),rec=target&&lifeVisuals.get(target.id);
  if(!snapshot?.target||snapshot.target.state==='DEAD'){monsterGuide.textContent='擊倒！KAIOS 戰利品已記帳 · 下一隻 6 秒後出現';monsterGuide.style.display='block';return}
  if(!rec?.root){monsterGuide.textContent=`正在召喚 ${snapshot.target.name}…`;monsterGuide.style.display='block';return}
  const p=new THREE.Vector3();rec.root.getWorldPosition(p);p.y+=1.5;p.project(camera);
  const inFront=p.z>=-1&&p.z<=1,onScreen=inFront&&Math.abs(p.x)<=.88&&Math.abs(p.y)<=.78;
  if(onScreen){const phase=snapshot.selection?.body?` · 攻 ${snapshot.selection.body}`:' · 0C 自動取經';monsterGuide.textContent=`🎯 ${snapshot.target.name} · ${Math.round(snapshot.target.hp)}/${snapshot.target.maxHp}HP · ${snapshot.distance.toFixed(1)}m${phase}${snapshot.distance<=KSPACE_SKILLS.slash.radius?' · ⚔ 可攻擊':' · 靠近再攻擊'}`;monsterGuide.style.left=`${Math.max(18,Math.min(innerWidth-18,(p.x*.5+.5)*innerWidth))}px`;monsterGuide.style.top=`${Math.max(310,Math.min(innerHeight-245,(-p.y*.5+.5)*innerHeight-36))}px`;monsterGuide.style.transform='translate(-50%,-100%)';monsterGuide.style.display='block';return}
  const rel=snapshot.relative,angle=Math.atan2(rel.x,rel.z)-S.camYaw,side=Math.sin(angle),forward=Math.cos(angle);
  const arrow=forward<-.15?(side>=0?'↙':'↘'):(side>.22?'←':side<-.22?'→':'↑');
  monsterGuide.textContent=`${arrow} 怪物：${snapshot.target.name} · ${snapshot.distance.toFixed(1)}m · 用左下搖桿靠近`;
  monsterGuide.style.left='50%';monsterGuide.style.top='62%';monsterGuide.style.transform='translate(-50%,-50%)';monsterGuide.style.display='block';
}
function renderCombatTarget(){
  const s=combatSnapshot();if(!s?.target){targetHud.hidden=true;monsterGuide.style.display='none';return}targetHud.hidden=true;
  const t=s.target,body=s.selection?.body||'0C 取經',part=t.bodies[body],status=t.state==='DEAD'?'DEFEATED · 6s':body===t.exposed?'EXPOSED':body.slice(0,2)===t.exposed.slice(0,2)?'GUARDED':'RESIST';
  targetHud.textContent=`◎ ${t.name} · ${body}\n${s.distance.toFixed(1)}m · ${part?part.hp+'HP':t.hp+'HP'}\n${status} · 弱點 ${t.exposed} · XZ→KY / XY→KZ / YZ→KX ▾`;
  monsterScreenGuide(s);
  globalThis.__K11520_KSPACE_COMBAT__=s;
  const info=$('#combatKValues');if(info){const tuple=v=>['KX','KY','KZ'].map(a=>formatKCoordinate(v[a])).join(' / ');info.textContent=`PLAYER K（正規化）：${tuple(s.playerK)}\nMONSTER K（正規化）：${tuple(s.monsterK)}\nΔK（正規化）：${tuple(s.deltaK)}\nLOCAL XYZ (K)：${['x','y','z'].map(a=>formatGameDistanceK(s.playerLocal[a])).join(' / ')}\n局部相對位移 (K)：${['x','y','z'].map(a=>formatGameDistanceK(s.relative[a])).join(' / ')}\n${s.market.status}`}
}
function showCombatTarget(){
  const s=combatSnapshot(),t=s?.target;if(!t)return;
  const vec=(v,keys)=>keys.map(k=>`${k} ${Number(v[k]).toFixed(2)}`).join(' · ');
  $('#sheetTitle').textContent='TARGET LOCK · K-Guardian（模擬）';
  $('#sheetBody').innerHTML=`<div class="card"><b>距離 ${formatGameDistanceK(s.distance,{detail:true})} · ${s.selection?.body||'0C NEUTRAL'}</b><p>0C 取經：自動攻擊存活部位、掉落本機取經碎片；Plane 決定交易軸，C 正負選相位；靠近後攻擊。EXPOSED 弱點 ${t.exposed}。</p><p>Slash ${formatGameDistanceK(KSPACE_SKILLS.slash.radius)}：單部位<br>天罡金陣 ${formatGameDistanceK(KSPACE_SKILLS.goldenRain.radius)}：切面兩軸同相<br>盤古幻斧 ${formatGameDistanceK(KSPACE_SKILLS.phantomAxe.radius)}：前方半圓三軸同相</p><p id="combatKValues" style="white-space:pre-line">PLAYER K：${vec(s.playerK,['KX','KY','KZ'])}<br>MONSTER K：${vec(s.monsterK,['KX','KY','KZ'])}<br>市場 ΔK（正規化）：${vec(s.deltaK,['KX','KY','KZ'])}<br>LOCAL XYZ (K)：${['x','y','z'].map(a=>formatGameDistanceK(s.playerLocal[a])).join(' / ')}<br>局部相對位移 (K)：${['x','y','z'].map(a=>formatGameDistanceK(s.relative[a])).join(' / ')}</p><p>LOCAL：1 遊戲單位 = 1 公尺，依 CURRENT 換算 K。市場正規化不是公尺；未設定市場→物理 transform，不與 XYZ 直接相加。來源 ${s.source}<br>Ni(P)=100×(P/P0−1)，公開報價同步 K 基準（${s.market.status}），LOCAL XYZ 不變。</p>${Object.entries(s.reference).filter(([a])=>a!=='source').map(([a,v])=>`<div data-k-reference="${a}">${a} ${v.market}: P=${v.price}, P0=${v.anchor}</div>`).join('')}<p>${KSPACE_PHASES.map(id=>`${id}: ${t.bodies[id].hp}/${t.bodies[id].maxHp} ${id===t.exposed?'EXPOSED':''}`).join('<br>')}</p><button id="kspacePracticeReset" class="btn">重置模擬守衛（無獎勵）</button></div>`;
  $('#sheet').classList.add('open');$('#kspacePracticeReset').onclick=()=>{const m=world.monsters.find(m=>m.id===t.id);for(const b of Object.values(m.bodies))b.hp=b.maxHp;m.hp=Object.values(m.bodies).reduce((n,b)=>n+b.hp,0);m.rewardSuppressed=true;m.state='GUARD';world.kSpace.lastResult=null;renderCombatTarget();showCombatTarget()};
}
targetHud.onclick=showCombatTarget;
globalThis.__K11520_KSPACE_API__=Object.freeze({snapshot:combatSnapshot,simulationOnly:true});
setInterval(syncMarketKLabels,1000);
function marketEngineSnapshot(){
  const p=playerStore.snapshot(),market=kMarketSnapshot(world),rows=market.markets||[];
  const components=rows.map(r=>({axis:r.axis,market:r.symbol,k:Number(r.k)||0,pressure:Math.max(-100,Math.min(100,(Number(r.k)||0)*20))}));
  const score=components.length?components.reduce((sum,r)=>sum+r.pressure,0)/components.length:0;
  const state=score>10?'BULL_POWER':score<-10?'BEAR_POWER':'BALANCED';
  const nonNeutral=components.filter(r=>Math.abs(r.pressure)>=5),bull=nonNeutral.filter(r=>r.pressure>0).length,bear=nonNeutral.filter(r=>r.pressure<0).length;
  const alignment=nonNeutral.length===3&&bull===3?'ALL_BULL':nonNeutral.length===3&&bear===3?'ALL_BEAR':nonNeutral.length?'MIXED':'NEUTRAL';
  const strongest=components.slice().sort((a,b)=>Math.abs(b.pressure)-Math.abs(a.pressure))[0]||null;
  const features=['3_AXIS_SCORE',...(p.engineLevel>=2?['DOMINANT_MARKET']:[]),...(p.engineLevel>=3?['DIVERGENCE_SCAN']:[]),...(p.engineLevel>=4?['CROSS_MARKET_ALIGNMENT']:[])];
  return {level:p.engineLevel,engineXp:p.engineXp,nextEngineXp:p.nextEngineXp,score:Number(score.toFixed(2)),state,alignment,strongest,features,components,authority:'PLAYER_DECIDES_NO_AUTO_ORDER'};
}
function crossMarketSnapshot(){
  const x=execution.snapshot(),open=x.positions.filter(p=>p.status==='OPEN');
  const byAxis=Object.fromEntries(['KX','KY','KZ'].map(axis=>[axis,open.filter(p=>p.axis===axis).map(p=>({positionId:p.positionId,market:p.market,side:p.side,c:p.c,lots:p.lots,unrealizedPnl:Number(p.unrealizedPnl??0)}))]));
  return {settlementCurrency:'KGEN',sharedWallet:true,openPositions:open.length,byAxis,free:Number(x.wallet?.free??0),lockedMargin:Number(x.wallet?.lockedMargin??0),realizedPnl:Number(x.wallet?.realizedPnl??0),unrealizedPnl:Number(x.wallet?.unrealizedPnl??0)};
}
function syncSimulationPositions(){const exchange=execution.snapshot();for(const id of Object.keys(S.axes))S.axes[id].pos=exchange.positions.find(p=>p.axis===id&&p.status==='OPEN')||null;if(['assets','positions'].includes($('#sheetBody')?.dataset.simOrgan))refreshSimulationSheet()}
function recordSimulationEvents(events){for(const e of events){productEvent(e.kind==='FILL'?'TRADE_FILL':e.status==='LIQUIDATED'?'LIQUIDATION':e.kind==='SETTLEMENT'?'TRADE_CLOSE':'ERROR');const audioFx=globalThis.__K11520_AUDIO_FX__;audioFx?.play?.(e.status==='LIQUIDATED'?'liquidation':e.kind==='FILL'?'fill':e.kind==='SETTLEMENT'?'close':'hit');S.history.unshift({time:new Date(e.triggeredAt??Date.now()).toLocaleTimeString(),axis:e.axis||'',event:`${executionLabel()} ${e.status||e.kind} ${e.orderId||''}`});toast(`${executionLabel()} ${e.status||e.kind}｜${e.axis||''} ${e.c??''}C`)}if(events.length)refreshSimulationSheet()}
const escapeUI=value=>String(value??'--').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const receiptTime=value=>value==null?'--':new Date(value).toISOString();
function receiptRows(rows){return '<dl class="exchangeRows">'+rows.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+escapeUI(value)+'</dd></div>').join('')+'</dl>'}
function walletMetrics(w){if(!w)return '<p>尚未驗證鏈上帳戶 / UNVERIFIED</p>';const value=n=>n==null?'UNAVAILABLE':fmt(n,6);return receiptRows([['BRAIN TOTAL',value(w.total??w.principal??(w.free+w.lockedMargin))],['AVAILABLE',value(w.free)],['LOCKED MARGIN',value(w.lockedMargin)],['UNREALIZED PNL',value(w.unrealizedPnl)],['EQUITY',value(w.equity)],['REALIZED PNL',value(w.realizedPnl)],['PLAYER CLAIMABLE',w.claimableStatus==='UNSUPPORTED_LEGACY_DEPLOYMENT'?'此舊部署未支援':value(w.claimable)],['WITHDRAWABLE',value(w.withdrawable??(isTestnet()?null:w.free))]])}
function simulationOrganHTML(id){
  if(id==='records'){const p=playerStore.snapshot(),m=marketEngineSnapshot(),c=crossMarketSnapshot();return '<div class="card"><b>V1 玩家成長 / 跨市場紀錄</b>'+receiptRows([['PLAYER',p.owner],['PLAYER LEVEL','Lv.'+p.level+' · XP '+p.xp],['多空運算引擎','Lv.'+p.engineLevel+' · '+m.state+' · '+m.score+' · XP '+p.engineXp+(p.nextEngineXp==null?' · MAX':' / '+p.nextEngineXp)],['STORAGE',p.persistent?'LOCAL SAVED':'MEMORY ONLY'],['PLAY TIME',Math.round(p.playedMs/1000)+' s'],['取經碎片',p.loot],['KAIOS 獎勵',p.kaios],['KAIOS 待發放',p.claimableKaios],['KAIOS 狀態',p.kaiosRewardStatus],['KGEN 跨市場開倉',c.openPositions],['KGEN REALIZED PNL',c.realizedPnl],...Object.entries(p.events)])+'<p>交易結算幣為 KGEN。KAIOS 為打怪／運鈔遊戲獎勵；目前 wallet-bound claimable 仍是本機候選紀錄，未經授權不會自動送鏈。</p></div>'}
  if(id==='market'){const m=marketEngineSnapshot();return '<div class="card"><b>多空運算引擎 · Lv.'+m.level+'</b>'+receiptRows([['STATE',m.state],['CROSS-MARKET SCORE',m.score],['ENGINE XP',m.engineXp+(m.nextEngineXp==null?' · MAX':' / '+m.nextEngineXp)],['UNLOCKS',m.features.join(' · ')],['ALIGNMENT',m.level>=4?m.alignment:'Lv.4 解鎖'],['DOMINANT',m.level>=2&&m.strongest?m.strongest.axis+' '+m.strongest.market+' · '+fmt(m.strongest.pressure,2):'Lv.2 解鎖'],...m.components.map(r=>[r.axis+' '+r.market,fmt(r.pressure,2)+' · K '+fmt(r.k,4)])])+'<p class="muted">Lv.2 主導市場、Lv.3 分歧掃描、Lv.4 三市場一致性。只描述 BTC／ETH／BNB 動能，不自動下單；方向與 C 仍由玩家控制。</p></div>'}
  if(id==='atm'){const p=playerStore.snapshot();return '<div class="card"><b>KAIOS 運鈔 ATM</b>'+receiptRows([['PLAYER',p.owner],['KAIOS 已取得',p.kaios],['WALLET-BOUND CLAIMABLE',p.claimableKaios],['STATUS',p.kaiosRewardStatus]])+(p.owner==='guest'?'<p>先玩也可以；連上錢包後，新取得的 KAIOS 才會綁定到該玩家的 claimable 紀錄。</p>':'<p>錢包已綁定。正式 KAIOS 發放合約／地址與 Human 轉帳授權完成前，ATM 只保管 claimable 記錄，不送鏈。</p>')+'</div>'}
  const x=execution.snapshot(),w=x.wallet,tag=isTestnet()?'<p class="muted">BSC TESTNET 97 · NO REAL VALUE · 僅合約狀態／已確認收據，瀏覽器報價不結算。<br>MODEL: '+escapeUI(x.pnlModel||'UNVERIFIED')+(x.pnlModel==='NOTIONAL_RETURN_V1'?'（舊部署比例模型；不是新 ΔIndex 模型）':'')+'</p>':'<p class="muted">SIMULATION WALLET · 本頁模擬記帳，非鏈上 KGEN / Brain 資產。</p>';
  if(id==='assets'){const p=playerStore.snapshot(),c=crossMarketSnapshot();return tag+'<div class="card"><b>KGEN 跨市場結算</b>'+walletMetrics(w)+receiptRows([['SETTLEMENT CURRENCY','KGEN'],['OPEN POSITIONS',c.openPositions],['REALIZED PNL',c.realizedPnl],['UNREALIZED PNL',c.unrealizedPnl]])+(isTestnet()?'<hr>TEST TOKEN · NO REAL VALUE<br>'+escapeUI(w?.testTokenBalance??'UNVERIFIED'):'<hr>ON-CHAIN KGEN · READ ONLY<br>'+escapeUI(S.walletKgen??'未連線或尚未驗證'))+'</div><div class="card"><b>KAIOS 掉寶／運鈔獎勵</b>'+receiptRows([['LOCAL REWARD',p.kaios],['WALLET-BOUND CLAIMABLE',p.claimableKaios],['STATUS',p.kaiosRewardStatus]])+'<p class="muted">未部署／未授權 KAIOS 發放交易前，只記錄 claimable，不自動轉帳。</p></div>'}
  if(id==='orders')return tag+(x.orders.slice().reverse().map(o=>{
    const r=x.receipts.find(r=>r.orderId===o.orderId&&r.kind==='FILL');
    return '<div class="card"><b>'+o.orderId+' · '+(o.status==='PENDING'?'PENDING_TRIGGER':o.status)+'</b>'+receiptRows([['MARKET',o.market],['SIDE / C / LOTS',o.side+' / '+o.c+'C / '+o.lots],['CREATED AT',receiptTime(o.createdAt)],['TRIGGER',o.triggerPrice],...(r?[['FILLED AT',receiptTime(r.triggeredAt)],['OBSERVED / FILL',r.observedPrice+' / '+r.fillPrice],['POSITION ID',r.positionId],['RECEIPT ID',r.receiptId]]:[])])+(o.status==='PENDING'?'<p>WAITING FOR PRICE · 等待有效 Touch/Cross</p><button class="btn" data-sim-cancel="'+o.orderId+'">取消委託（'+executionLabel()+'）</button>':'')+'</div>';
  }).join('')||'<p>尚無委託</p>');
  if(id==='positions'){const c=crossMarketSnapshot();return tag+'<div class="card"><b>跨市場 KGEN 組合</b>'+receiptRows([['BTC / KX',c.byAxis.KX.length],['ETH / KY',c.byAxis.KY.length],['BNB / KZ',c.byAxis.KZ.length],['LOCKED KGEN',c.lockedMargin],['UNREALIZED PNL',c.unrealizedPnl],['REALIZED PNL',c.realizedPnl]])+'</div>'+(x.positions.slice().reverse().map(p=>{
    const risk=isTestnet()?{liquidationMark:p.liquidationPrice,pnl:p.unrealizedPnl}:positionRisk(p),r=x.receipts.find(r=>r.positionId===p.positionId&&r.kind==='SETTLEMENT');
return '<div class="card"><b>'+p.positionId+' · '+(p.status==='OPEN'?'POSITION OPEN':p.status==='LIQUIDATED'?'斷頭 / LIQUIDATED':p.status)+'</b>'+receiptRows([['MARKET',p.market],['SIDE / C / LOTS',p.side+' / '+p.c+'C / '+p.lots],['ENTRY / MARK',fmt(p.entry,6)+' / '+fmt(p.mark,6)],['LIQUIDATION',risk.liquidationMark==null?'UNAVAILABLE':fmt(Math.max(0,risk.liquidationMark),6)],['ΔINDEX',p.deltaIndex==null?'--':fmt(p.deltaIndex,8)],['POSITION EQUITY',p.equity==null?'--':fmt(p.equity,6)],['ORACLE TIME',receiptTime(p.observedAt)],['POSITION OBSERVATION SEQUENCE',p.observationSequence??'--'],['MARGIN',fmt(p.margin,6)],['UNREALIZED PNL',p.status==='OPEN'&&risk.pnl==null?'UNAVAILABLE':fmt(p.status==='OPEN'?risk.pnl:0,6)],...(r?[['REALIZED PNL',fmt(r.realizedPnl,6)],['SETTLED AT',receiptTime(r.settledAt)],['RECEIPT ID',r.receiptId]]:[])])+(p.status==='OPEN'?'<button class="btn" data-sim-close="'+p.positionId+'">CLOSE · 平倉（'+executionLabel()+'）</button>':'')+'</div>';
  }).join('')||'<p>尚無部位</p>');}
  if(id==='history')return tag+(isTestnet()?'<p>CHAIN RECEIPTS · 重新載入後由合約／events／receipts 恢復，不使用模擬帳本。</p>':'<p>ORDER / SETTLEMENT RECEIPTS · 依地址保存於本機；reload 恢復。非鏈上收據，可被本機修改；清除網站資料會刪除此模擬紀錄。</p>')+(x.receipts.slice().reverse().map(r=>{
    if(isTestnet()&&['Approval','MarginDeposited','MarginWithdrawn','TEST_TOKEN_MINT','SettlementClaimRecorded','SettlementClaimPaid'].includes(r.kind))return '<details class="card" data-receipt="'+escapeUI(r.receiptId)+'"><summary>'+escapeUI(r.kind)+' · '+escapeUI(r.status)+'</summary>'+receiptRows([['TX HASH',r.txHash],['BLOCK',r.block],['TIME',receiptTime(r.timestamp)],['CONTRACT',r.contract],['METHOD',r.method],['AMOUNT',r.amount??'--'],['CLAIM PAID',r.paid??'--'],['CLAIM REMAINING',r.remaining??'--'],['TX STATUS',r.transactionStatus]])+'</details>';
    const order=x.orders.find(o=>o.orderId===r.orderId),fill=x.receipts.find(f=>f.positionId===r.positionId&&f.kind==='FILL');
    const rows=[...(isTestnet()?[['TX HASH',r.txHash],['BLOCK',r.block],['CONTRACT',r.contract],['METHOD',r.method],['TX STATUS',r.transactionStatus||r.status]]:[]),['ORDER ID',r.orderId],['POSITION ID',r.positionId],['MARKET',r.market],['SIDE / C / LOTS',r.side+' / '+r.c+'C / '+r.lots],['CREATED AT',receiptTime(order?.createdAt)],['TRIGGERED AT',receiptTime(r.triggeredAt)],['TRIGGER / FILL',order?.triggerPrice+' / '+fill?.fillPrice],['PREVIOUS / OBSERVED',r.previousPrice+' / '+r.observedPrice]];
    if(r.kind==='FILL')rows.push(['WALLET BEFORE',r.walletBefore],['MARGIN LOCKED',r.marginLocked],['WALLET AFTER',r.walletAfter]);
    else rows.push(['SETTLED AT',receiptTime(r.settledAt)],['ENTRY / LIQUIDATION',r.entryPrice+' / '+r.liquidationTrigger],['SETTLEMENT / EXIT',r.settlementPrice],['MARGIN BEFORE / AFTER',r.marginBefore+' / '+r.marginAfter],['RAW / REALIZED PNL',fmt(r.rawPnl,6)+' / '+fmt(r.realizedPnl,6)],['BAD DEBT / GAP LOSS',fmt(r.badDebt,6)]);
    return '<details class="card" data-receipt="'+r.receiptId+'"><summary>'+r.receiptId+' · '+r.status+' · '+r.axis+'</summary>'+receiptRows(rows)+'<details><summary>原始 '+executionLabel()+' 收據 JSON</summary><pre class="receiptRaw">'+escapeUI(JSON.stringify(r,null,2))+'</pre></details></details>';
  }).join('')||'<p>尚無成交／結算收據</p>');
  return null;
}
function bindSimulationSheet(){
  $$('[data-sim-cancel]').forEach(b=>b.onclick=async()=>{const r=await executionAction(()=>execution.cancel(b.dataset.simCancel));toast(r.ok?executionLabel()+' 委託取消已確認':r.reason);refreshSimulationSheet()});
  $$('[data-sim-close]').forEach(b=>b.onclick=async()=>{const r=await executionAction(()=>execution.close(b.dataset.simClose));if(r.ok){if(r.receipt)recordSimulationEvents([r.receipt]);syncSimulationPositions();renderAxes()}else toast(r.reason);refreshSimulationSheet()});
}
function refreshSimulationSheet(){const id=$('#sheetBody')?.dataset.simOrgan;if(id&&$('#sheet').classList.contains('open')&&$('#sheetTitle').textContent===ORGANS.find(x=>x[0]===id)?.[2]){const body=$('#sheetBody'),html=simulationOrganHTML(id);if(body.innerHTML===html)return;const scroll=$('#sheet').scrollTop,open=[...body.querySelectorAll('[data-receipt][open]')].map(el=>el.dataset.receipt);body.innerHTML=html;for(const el of body.querySelectorAll('[data-receipt]'))el.open=open.includes(el.dataset.receipt);bindSimulationSheet();$('#sheet').scrollTop=scroll}}
globalThis.__K11520_SIMULATION_EXCHANGE__=Object.freeze({simulationOnly:true,snapshot:()=>simulationExecution.snapshot()});
globalThis.__K11520_EXECUTION__=Object.freeze({snapshot:()=>execution.snapshot()});
function orderInput(){const optional=id=>$(id)?.value.trim()?Number($(id).value):null;return {...pending,currentPrice:isTestnet()?execution.snapshot().observations[pending.market]?.price:S.quotes[pending.market],triggerPrice:Number($('#simulationTriggerPrice').value),stopPrice:optional('#simulationStopPrice'),takeProfitPrice:optional('#simulationTakeProfitPrice')}}
async function paintOrderPreview({background=false}={}){
  if(!pending||(background&&previewRequests>0))return;const sequence=++previewSequence,adapter=execution;if(!background)$('#confirmOrder').disabled=true;let p;previewRequests++;try{p=await adapter.preview(orderInput())}finally{previewRequests--}const el=$('#simulationOrderPreview');if(!pending||sequence!==previewSequence||adapter!==execution||!el)return;$('#confirmOrder').disabled=!p.ok||executionBusy;
  if(!p.ok){el.textContent=pending.axis+' '+pending.market+' · '+p.code+' · '+p.reason;return}
el.innerHTML=receiptRows([['AXIS',p.axis],['EXECUTION MODE',p.executionMode],['MARKET',p.market],['SIDE',p.side],['C / LEVERAGE / LOTS',p.c+'C / '+p.leverage+'× / '+p.lots],['CURRENT PRICE',p.currentPrice],['TRIGGER PRICE',p.triggerPrice],['REQUIRED MARGIN',p.requiredMargin+(isTestnet()?' tKGEN TEST':' KGEN')],['PnL MODEL',p.pnlModel||'NOTIONAL_RETURN_V1'],[p.pnlModel==='INDEX_DELTA_C_LOTS_V1'?'每 1 index point 變動':'每 1% 變動（舊部署）',fmt(p.lots*p.leverage/(p.pnlModel==='INDEX_DELTA_C_LOTS_V1'?1:100),6)+(isTestnet()?' tKGEN TEST':' KGEN')],['AVAILABLE',fmt(p.available,6)+(isTestnet()?' tKGEN TEST':' KGEN')],['EST. LIQUIDATION',fmt(p.estimatedLiquidationPrice,6)]])+(isTestnet()?'<small>TESTNET · NO REAL VALUE。風險與 liquidation threshold 來自鏈上設定。Oracle stale 時拒絕送出；不以 public browser quote 結算。</small>':'<small>模擬 isolated model：本金 = 口數；維持保證金與手續費為 0。PnL = ΔIndex × C × Lots；反向歸零 '+fmt(1/p.leverage,6)+' index points。跳空以 observed price 計算實際斷頭價。</small>');
}
function openOrder(){
  syncTradeAxisFromPlane();const a=axis(),p=isTestnet()?execution.snapshot().observations[a.market]?.price:price();pending=null;if(!p){toast('ORACLE_STALE · 行情未就緒');return}
  let c;try{const signed=globalThis.__K11520_SIGNED_C_IMMERSIVE__?.signedByAxis?.[S.axis];c=signed===undefined?signedCFromLegacyMagnitude(a.c,a.side):normalizeSignedC(signed)}catch{toast('ORDER_REJECTED · C 必須非 0 且介於 -100 與 +100');return}
  pending={axis:S.axis,market:a.market,lots:a.lots,c};
  $('#confirmOrder').textContent=isTestnet()?'Testnet：錢包確認下單':'建立模擬委託';
  $('#confirmBody').innerHTML='<div class="card" id="simulationOrderPreview" aria-live="polite"></div><div class="card"><label>TRIGGER · 觸發價格<input id="simulationTriggerPrice" type="number" min="0" step="any" value="'+p+'"></label><details><summary>選填停損 / 止盈</summary><label>停損價<input id="simulationStopPrice" type="number" min="0" step="any"></label><label>止盈價<input id="simulationTakeProfitPrice" type="number" min="0" step="any"></label></details></div><p class="bad">CONFIRM ORDER → PENDING_TRIGGER。PENDING 模擬委託；下一筆有效價格觸及／穿越才成交，不送鏈、不簽名。</p>';
  if(isTestnet()){$('#confirmBody details').hidden=true;$('#confirmBody .bad').textContent='BSC TESTNET 97 · NO REAL VALUE。CONFIRM ORDER → WALLET CONFIRM → TX → RECEIPT CONFIRMED；其後仍為 PENDING，只有 keeper 有效 observation 才能成交。'}
  for(const input of $$('#confirmBody input'))input.addEventListener('input',paintOrderPreview);
  paintOrderPreview();$('#confirm').classList.add('open');
}
$('#cancelOrder').onclick=$('#confirmX').onclick=()=>{pending=null;$('#confirm').classList.remove('open')};
$('#confirmOrder').onclick=async()=>{if(!pending||executionBusy)return;$('#confirmOrder').disabled=true;const input=orderInput();const r=await executionAction(()=>execution.submit(input));if(!r.ok){toast(r.code+' · '+r.reason);paintOrderPreview();return}productEvent('TRADE_OPEN');pending=null;$('#confirm').classList.remove('open');toast(executionLabel()+' '+(r.order?.orderId||r.orderId||'')+' PENDING_TRIGGER｜收據已確認');openOrgan('orders');renderAxes();hud()};
async function closePos(){const p=axis().pos;if(!p){toast(`${S.axis} 空倉`);return}const r=await executionAction(()=>execution.close(p.positionId));if(!r.ok){toast(r.reason);return}if(r.receipt)recordSimulationEvents([r.receipt]);syncSimulationPositions();renderAxes();hud()}

const dock=$('#dock');$('#dockToggle').onclick=()=>dock.classList.toggle('open');$('#rail').innerHTML=RAIL_ORGANS.map(([id,ic,n])=>`<button data-organ="${id}" title="${n}">${ic}</button>`).join('');$$('[data-organ]').forEach(b=>b.onclick=()=>openOrgan(b.dataset.organ));$('#sheetClose').onclick=()=>{$('#sheet').classList.remove('open');fullMapCanvas=null};
function openOrgan(id){$('#sheetTitle').textContent=ORGANS.find(x=>x[0]===id)?.[2]||id;const s=snapshot(ledger);let h='';const simulationHTML=simulationOrganHTML(id);$('#sheetBody').dataset.simOrgan=simulationHTML===null?'':id;if(simulationHTML!==null)h=simulationHTML;else if(id==='trade')h=`<div class="card"><h3>${S.axis} ${axis().market}</h3><button id="sideBtn" class="btn">方向：${axis().side}</button><p>口數 ${axis().lots}｜C ${axis().c}</p><p>本金 = 口數 × 1 KGEN</p></div>`;else if(id==='positions')h=['KX','KY','KZ'].map(a=>`<div class="card">${a}：${S.axes[a].pos?`${S.axes[a].pos.side} ${S.axes[a].pos.lots}口 ${S.axes[a].pos.c}C`:'空倉'}</div>`).join('');else if(id==='assets')h=`<div class="card">KGEN Local Free ${fmt(s.free,3)}<br>Locked ${fmt(s.lockedMargin,3)}<br>Verified Wallet ${S.walletKgen==null?'未連線':fmt(S.walletKgen,6)}</div>`;else if(id==='history')h=S.history.map(x=>`<div class="card">${x.time} · ${x.axis} · ${x.event}</div>`).join('')||'尚無歷史';else if(id==='character')h=`<div class="card">HP ${S.hp}/100<br>3D：${$('#charState').textContent}<br>控制座標：X ${formatGameDistanceK(S.intentXYZ.x)} / Y ${formatGameDistanceK(S.intentXYZ.y)} / Z ${formatGameDistanceK(S.intentXYZ.z)}<br>實體座標：X ${formatGameDistanceK(S.xyz.x)} / Y ${formatGameDistanceK(S.xyz.y)} / Z ${formatGameDistanceK(S.xyz.z)}</div>`;else if(id==='worldmap')h='<div class="mapHint">NORTH_UP。單點空白處先設定 waypoint；點建築/生命先看資料，再選導航。雙指縮放；手動碰 3D 遙桿會停止自動導航。</div><div class="mapStage"><canvas id="fullMap" width="900" height="700"></canvas></div>';else if(id==='help')h='<div class="card"><h3>3D 控制說明</h3>點左下圓盤中央圖循環 XZ／XY／YZ。圓盤控制所選兩軸；右下縱搖桿控制剩餘一軸：XZ+Y、XY+Z、YZ+X。XYZ 控制座標不設數值上限；地面或物件可擋住角色實體，但不會把控制座標重設。</div>';else h=`<div class="card">${ORGANS.find(x=>x[0]===id)?.[2]||id} 器官已啟用。</div>`;$('#sheetBody').innerHTML=h;bindSimulationSheet();$('#sheet').classList.add('open');dock.classList.remove('open');$('#sideBtn')?.addEventListener('click',()=>{setTradeSide(S.axis,axis().side==='多'?'空':'多');openOrgan('trade')});if(id==='worldmap'){fullMapCanvas=$('#fullMap');bindMap(fullMapCanvas);drawMap(fullMapCanvas)}}

const walletSession=getWalletSession11520();
let deploymentManifest=null,testnetGate='CHECKING_DEPLOYMENT',chainRefreshBusy=false;
const executionPreferenceKey='k11520.execution-mode';
async function loadTestnetManifest(){
  try{
    const response=await fetch(new URL('../../../../docs/K11520_BSC_TESTNET_DEPLOYMENT_MANIFEST.json',import.meta.url),{cache:'no-store'});
    if(!response.ok)throw new Error('DEPLOYMENT_MANIFEST_UNAVAILABLE');
    const manifest=await response.json();
    if(manifest.status!=='DEPLOYED_CONFIG_VERIFIED'||manifest.chainId!==97||manifest.testOnly!==true)throw new Error('TESTNET_NOT_DEPLOYED_CONFIG_VERIFIED');
    deploymentManifest=manifest;testnetGate='TESTNET_AVAILABLE';
  }catch{testnetGate='TESTNET_NOT_DEPLOYED_CONFIG_VERIFIED'}
  renderWallet();
  try{if(deploymentManifest&&sessionStorage.getItem(executionPreferenceKey)==='BSC_TESTNET')await selectExecutionMode()}catch{}
}
async function testnetLibrary(){
  // Reuse the repository's pinned ethers library; no remote executable dependency.
  if(!globalThis.ethers){await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('../../../assets/ethers-5.7.2.umd.min.js',import.meta.url).href;script.onload=resolve;script.onerror=()=>reject(new Error('EVM_LIBRARY_UNAVAILABLE'));document.head.append(script)})}
  const e=globalThis.ethers,u=e.utils||e;
  return {Interface:u.Interface,keccak256:u.keccak256,parseUnits:(...args)=>BigInt(u.parseUnits(...args).toString()),formatUnits:u.formatUnits};
}
async function selectExecutionMode(){
  if(executionBusy)return;
  pending=null;++previewSequence;$('#confirm').classList.remove('open');
  if(isTestnet()){execution.dispose?.();execution=simulationExecution;try{sessionStorage.removeItem(executionPreferenceKey)}catch{}syncSimulationPositions();renderWallet();return}
  if(!deploymentManifest){toast(testnetGate);return}
  const r=await executionAction(async()=>{
    const candidate=createExecutionAdapter({ledger,deployment:{...deploymentManifest,mode:'BSC_TESTNET'},wallet:walletSession,ethereum:globalThis.ethereum,ethers:await testnetLibrary()});
    if(!candidate.enabled)return {ok:false,reason:'TESTNET_ADAPTER_BLOCKED'};
    execution=candidate;
    try{sessionStorage.setItem(executionPreferenceKey,'BSC_TESTNET')}catch{}
    await walletSession.refresh();
    // Selection performs reads only. Connect, chain switch, approve, deposit and order remain separate user actions.
    return await candidate.refresh();
  });
  if(!r.ok)toast(r.reason);renderWallet();
}
async function refreshTestnet(){if(!isTestnet()||executionBusy||chainRefreshBusy)return;chainRefreshBusy=true;try{await execution.refresh();syncSimulationPositions();renderWallet();if(pending)void paintOrderPreview({background:true})}finally{chainRefreshBusy=false}}
const retained=readPublicWalletIdentity();
if(retained){const el=document.createElement('p');el.id='walletRetained';el.textContent='上次公開地址（未驗證連線）：'+retained.address;$('#walletMsg').after(el)}
function renderWallet(value=walletSession.snapshot()){
  S.walletKgen=value.kgen;
  $('#wAddr').textContent=value.account||'DISCONNECTED';
  $('#wChain').textContent=value.chainId==null?'--':(value.chainId===97?'BSC TESTNET':value.network)+' · '+value.chainId;
  $('#wBnb').textContent=value.bnb??'--';$('#wKgen').textContent=value.kgen??'--';
  const chain=execution.snapshot();
  $('#wKgen').previousElementSibling.textContent=isTestnet()?'TEST TOKEN · NO REAL VALUE':'ON-CHAIN KGEN · READ ONLY';
  if(isTestnet())$('#wKgen').textContent=chain.wallet?.testTokenBalance??'UNVERIFIED';
  $('#walletMsg').textContent=isTestnet()?executionLabel()+' · '+chain.status+(value.chainId!==97?' · WRONG NETWORK — switch to 97':''):(value.status+(value.error?' · '+value.error:'')+'｜ON-CHAIN BALANCE · READ ONLY。交易與結算維持 SIMULATION。');
  const busy=executionBusy||['CONNECTING','READING'].includes(value.status);
  $('#walletConnect').disabled=busy;$('#walletRefresh').disabled=busy;
  $('#walletConnect').textContent=value.account?'重新連線':'Connect Wallet';
  $('#executionMode').disabled=busy||(!isTestnet()&&!deploymentManifest);$('#executionMode').textContent=isTestnet()?'返回 SIMULATION':'切換 BSC TESTNET 97';
  $('#testnetGate').textContent=isTestnet()?'TESTNET · NO REAL VALUE':testnetGate;
  $('#testnetActions').hidden=!isTestnet();
  for(const b of $$('#testnetActions button'))b.disabled=busy;
  $('#testnetSwitch').disabled=busy||value.chainId===97;
  const amount=Number($('#testnetAmount').value),w=chain.wallet,valid=Number.isFinite(amount)&&amount>0;
  let enough=false;try{enough=!!w&&BigInt(w.allowanceWei)>=BigInt(Math.ceil(amount*1e6))*10n**12n}catch{}
  $('#testnetAllowance').textContent=!w?'ALLOWANCE · UNVERIFIED':w.allowanceUnlimited?'ALLOWANCE · 永久授權已確認':`ALLOWANCE · ${fmt(w.allowance,6)} tKGEN`;
  $('#testnetApprove').disabled=busy||!w||(!$('#testnetUnlimited').checked&&!valid)||enough;
  $('#testnetApprove').textContent=enough?'授權足夠 · 無需重複 Approve':$('#testnetUnlimited').checked?'Approve 永久額度（需錢包確認）':'Approve 本次額度（需錢包確認）';
  $('#testnetDeposit').disabled=busy||!w||!valid||!enough||amount>w.testTokenBalance;
  $('#testnetWithdraw').disabled=busy||!w||!valid||amount>w.withdrawable;
  $('#testnetClaims').innerHTML=(chain.claims||[]).filter(c=>c.remaining>0).map(c=>`<button class="btn" data-claim="${escapeUI(c.key)}">清償 Claim #${escapeUI(c.positionId)} · ${fmt(c.remaining,6)}</button>`).join('');
  for(const b of $$('#testnetClaims button')){b.disabled=busy;b.onclick=async()=>{const r=await executionAction(()=>execution.claim(b.dataset.claim));toast(r.ok?'CLAIM PAID → BRAIN AVAILABLE · RECEIPT CONFIRMED':r.reason)}}
const summary=$('#walletSimulation');if(summary)summary.innerHTML='<b>'+executionLabel()+(isTestnet()?' · BRAIN ACCOUNT':' WALLET')+'</b>'+walletMetrics(chain.wallet)+(chain.capital?'<details><summary>Exchange Capital（非玩家本金）</summary>'+receiptRows([['FREE SETTLEMENT CAPITAL',fmt(chain.capital.settlementCapital,6)],['RESERVED LIABILITY',fmt(chain.capital.reservedSettlementLiability,6)],['ADMISSION CAPACITY',fmt(chain.capital.availableRiskCapacity,6)]])+'</details>':'')+(isTestnet()?receiptRows([['TEST TOKEN BALANCE',chain.wallet?.testTokenBalance??'UNVERIFIED'],['TX STATUS',chain.transaction?.status||chain.status],['TX HASH',chain.transaction?.txHash||'--']]):'');
  if($('#sheetBody')?.dataset.simOrgan==='assets')refreshSimulationSheet();
}
walletSession.subscribe(value=>{
  if(value.account||['DISCONNECTED','NO_WALLET'].includes(value.status)){
    if(playerStore.activate(value.account)){
      pending=null;$('#confirm').classList.remove('open');S.history=[];S.kaios=playerStore.snapshot().kaios;
      syncSimulationPositions();renderAxes();refreshSimulationSheet();if(!isTestnet())void quotes();
    }
  }
  renderWallet(value);if(isTestnet())void refreshTestnet();
});renderWallet();void walletSession.refresh();void loadTestnetManifest();
$('#walletConnect').onclick=()=>{$('#walletPanel').classList.remove('collapsed');return walletSession.connect()};
$('#walletRefresh').onclick=async()=>{await walletSession.refresh();await refreshTestnet()};
$('#executionMode').onclick=selectExecutionMode;
$('#testnetSwitch').onclick=async()=>{const r=await executionAction(()=>execution.switchChain());if(!r.ok)toast(r.reason);await walletSession.refresh()};
$('#testnetFaucet').onclick=async()=>{const r=await executionAction(()=>execution.faucet());toast(r.ok?'TEST ONLY FAUCET RECEIPT CONFIRMED':r.reason)};
for(const method of ['approve','deposit','withdraw'])$('#testnet'+method[0].toUpperCase()+method.slice(1)).onclick=async()=>{const amount=$('#testnetAmount').value;const r=await executionAction(()=>execution[method](amount,{unlimited:$('#testnetUnlimited').checked}));toast(r.ok?'TESTNET '+method.toUpperCase()+' RECEIPT CONFIRMED':r.reason)};
$('#testnetAmount').oninput=()=>renderWallet();$('#testnetUnlimited').onchange=()=>renderWallet();
for(const b of $$('[data-deposit-preset]'))b.onclick=()=>{$('#testnetAmount').value=b.dataset.depositPreset;renderWallet()};
$('#walletToggle').onclick=()=>{$('#walletPanel').classList.toggle('collapsed');renderWallet()};
setInterval(()=>{if(!$('#walletPanel').classList.contains('collapsed'))renderWallet()},1000);
setInterval(()=>void refreshTestnet(),5000);

const scene=new THREE.Scene();scene.background=new THREE.Color(0x08110d);scene.fog=new THREE.FogExp2(0x08110d,.025);const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,500),renderer=new THREE.WebGLRenderer({canvas:$('#three'),antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));scene.add(new THREE.HemisphereLight(0xddeeff,0x223311,2.5));const sun=new THREE.DirectionalLight(0xffffff,2);sun.position.set(5,12,6);scene.add(sun);const ground=new THREE.Mesh(new THREE.PlaneGeometry(120,120),new THREE.MeshStandardMaterial({color:0x294f2d}));ground.rotation.x=-Math.PI/2;ground.userData.isGround=true;scene.add(ground);
for(let i=0;i<28;i++){const x=Math.sin(i*17.31)*22,z=Math.cos(i*9.71)*22;if(Math.abs(x)<4&&z>-10&&z<12)continue;const g=new THREE.Group(),tr=new THREE.Mesh(new THREE.CylinderGeometry(.12,.18,1.2,8),new THREE.MeshStandardMaterial({color:0x5c3920})),leaf=new THREE.Mesh(new THREE.ConeGeometry(.55,1.4,8),new THREE.MeshStandardMaterial({color:0x1e6b32}));tr.position.y=.6;leaf.position.y=1.7;g.add(tr,leaf);g.position.set(x,0,z);scene.add(g)}
for(const o of WORLD_OBJECTS){let mesh;if(o.kind==='ATM'){mesh=new THREE.Mesh(new THREE.SphereGeometry(.85,20,12),new THREE.MeshStandardMaterial({color:0x8fb9cf,metalness:.65,roughness:.3}));mesh.scale.y=.42;mesh.position.set(o.x,1.1,o.z)}else{mesh=new THREE.Mesh(new THREE.BoxGeometry(o.halfX*1.4,2.4,o.halfZ*1.4),new THREE.MeshStandardMaterial({color:o.kind==='SHOP'?0x806236:0x76563f}));mesh.position.set(o.x,1.2,o.z)}mesh.userData={worldObjectId:o.id,lifeId:o.lifeId};scene.add(mesh)}
const avatar=new THREE.Group();avatar.userData.isPlayer=true;scene.add(avatar);combatFx=create11520CombatFx(THREE,{scene,camera,avatar});let mixer=null,actions={},current='',fallbackBody=null;const fallback=()=>{if(mixer||fallbackBody)return;const b=new THREE.Mesh(new THREE.CapsuleGeometry(.25,.78,4,8),new THREE.MeshStandardMaterial({color:0x2f4050}));b.position.y=.72;avatar.add(b);fallbackBody=b;$('#charState').textContent='PRIMITIVE FALLBACK'};function pick(rx){return Object.keys(actions).find(n=>rx.test(n))}function play(kind){if(!mixer)return;const n=kind==='walk'?pick(/walk|run/i):kind==='attack'?pick(/attack|slash|sword/i):pick(/idle/i);if(!n||n===current)return;actions[current]?.fadeOut(.12);actions[n].reset().fadeIn(.12).play();current=n}function playAttack(){play('attack');setTimeout(()=>play('idle'),400)}const avatarDeadline=setTimeout(fallback,12000);new GLTFLoader().load('https://raw.githubusercontent.com/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0/main/addons/kaykit_character_pack_adventures/Characters/gltf/Knight.glb',g=>{clearTimeout(avatarDeadline);if(fallbackBody){avatar.remove(fallbackBody);fallbackBody.geometry.dispose();fallbackBody.material.dispose();fallbackBody=null}g.scene.scale.setScalar(.50);avatar.add(g.scene);mixer=new THREE.AnimationMixer(g.scene);g.animations.forEach(c=>actions[c.name]=mixer.clipAction(c));$('#charState').textContent='Knight 3D READY';play('idle')},undefined,()=>{clearTimeout(avatarDeadline);fallback()});
const lifeVisuals=new Map(),lifeVisualPending=new Set();async function ensureLifeVisual(m){if(m.state==='DEAD'||!(m.name||m.baseName))return null;const key=`${m.lifeId||m.id}|${m.species}`;const current=lifeVisuals.get(m.id);if(current?.key===key)return current.root;if(current){scene.remove(current.root);lifeVisuals.delete(m.id)}if(lifeVisualPending.has(m.id))return null;lifeVisualPending.add(m.id);try{const v=await createLifeVisual(THREE,{species:m.species,name:m.baseName||m.name,scale:.75});v.root.userData.worldMonsterId=m.id;v.root.userData.lifeId=m.lifeId||null;v.root.traverse?.(n=>{n.userData.worldMonsterId=m.id;n.userData.lifeId=m.lifeId||null});scene.add(v.root);lifeVisuals.set(m.id,{key,root:v.root,mode:v.mode});return v.root}finally{lifeVisualPending.delete(m.id)}}
function syncLifeVisuals(){renderCombatTarget();for(const m of [...world.monsters,...(world.ambientLife||[])]){const rec=lifeVisuals.get(m.id);if(m.state==='DEAD'||!(m.name||m.baseName)){if(rec)rec.root.visible=false;continue}if(!rec){void ensureLifeVisual(m);continue}const key=`${m.lifeId||m.id}|${m.species}`;if(rec.key!==key){void ensureLifeVisual(m);continue}syncLifeVisual(rec.root,m);if(m.simulationCombat)syncPhaseBody(rec.root,m)}}
function syncPhaseBody(root,m){
  if(!root.userData.phaseMarkers){
    const markers={};const offsets=[[-.8,1.2,0],[.8,1.2,0],[-.55,1.75,0],[.55,1.75,0],[-.55,.65,0],[.55,.65,0]];
    KSPACE_PHASES.forEach((id,i)=>{
      const color=[0x65dcff,0x65dcff,0xffd577,0xffd577,0xba93ff,0xba93ff][i];
      const orb=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.3}));orb.position.set(...offsets[i]);root.add(orb);
      const canvas=document.createElement('canvas');canvas.width=160;canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#071018';ctx.fillRect(0,0,160,64);ctx.font='bold 38px sans-serif';ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.fillText(id,80,46);
      const label=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(canvas),depthTest:true}));label.position.copy(orb.position);label.position.y+=.25;label.scale.set(.7,.28,1);root.add(label);markers[id]={orb,label};
    });root.userData.phaseMarkers=markers;
  }
  const selected=combatSnapshot()?.selection?.body;
  for(const [id,{orb,label}] of Object.entries(root.userData.phaseMarkers)){
    // The canonical world canvas is mirrored on X; undo that for readable text only.
    const mirrored=renderer.domElement.dataset.xVisualMirror==='1';label.material.map.repeat.x=mirrored?-1:1;label.material.map.offset.x=mirrored?1:0;
    const live=m.bodies[id].hp>0;orb.visible=live;label.material.opacity=live?1:.25;
    orb.scale.setScalar(id===selected?1.35:1);orb.material.emissiveIntensity=id===selected?1:id===m.exposed?.65:.12;
  }
}

function lifeCanvasHitPoints(lifeId){
  const monster=world.monsters.find(m=>String(m.lifeId||'')===String(lifeId||'')),visual=monster&&lifeVisuals.get(monster.id);
  if(!monster||!visual?.root?.visible)return Object.freeze([]);
  visual.root.updateWorldMatrix(true,true);
  const rect=renderer.domElement.getBoundingClientRect(),box=new THREE.Box3().setFromObject(visual.root);
  if(box.isEmpty())return Object.freeze([]);
  const projected=[];
  for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){
    const p=new THREE.Vector3(x,y,z).project(camera);
    if(Number.isFinite(p.x)&&Number.isFinite(p.y)&&Number.isFinite(p.z))projected.push({x:rect.left+(p.x+1)*rect.width/2,y:rect.top+(1-p.y)*rect.height/2});
  }
  if(!projected.length)return Object.freeze([]);
  const minX=Math.max(rect.left,Math.min(...projected.map(p=>p.x))),maxX=Math.min(rect.right,Math.max(...projected.map(p=>p.x)));
  const minY=Math.max(rect.top,Math.min(...projected.map(p=>p.y))),maxY=Math.min(rect.bottom,Math.max(...projected.map(p=>p.y)));
  if(maxX<minX||maxY<minY)return Object.freeze([]);
  const probeRaycaster=new THREE.Raycaster(),probePointer=new THREE.Vector2(),points=[];
  const routesToTarget=(clientX,clientY)=>{
    probePointer.x=((clientX-rect.left)/rect.width)*2-1;probePointer.y=-((clientY-rect.top)/rect.height)*2+1;
    probeRaycaster.setFromCamera(probePointer,camera);
    for(const hit of probeRaycaster.intersectObjects(scene.children,true)){
      if(ancestorData(hit.object,'isPlayer'))return false;
      const mid=ancestorData(hit.object,'worldMonsterId');if(mid!=null)return String(mid)===String(monster.id);
      if(ancestorData(hit.object,'worldObjectId')!=null)return false;
    }
    return false;
  };
  const physicalClientX=(raycastClientX)=>renderer.domElement.dataset.xVisualMirror==='1'
    ?rect.left+rect.width-(raycastClientX-rect.left)
    :raycastClientX;
  const centerX=(minX+maxX)/2,centerY=(minY+maxY)/2,candidates=[];
  const stepX=Math.max(2,(maxX-minX)/14),stepY=Math.max(2,(maxY-minY)/18);
  for(let y=minY+stepY/2;y<=maxY;y+=stepY)for(let x=minX+stepX/2;x<=maxX;x+=stepX)if(routesToTarget(x,y))candidates.push({clientX:physicalClientX(x),clientY:y,score:(x-centerX)**2+(y-centerY)**2});
  candidates.sort((a,b)=>a.score-b.score);
  for(const point of candidates.slice(0,24))points.push(Object.freeze({clientX:point.clientX,clientY:point.clientY,entityId:String(monster.id),lifeId:String(monster.lifeId||'')}));
  return Object.freeze(points);
}
function visibleLifeCanvasHitPoints(){
  for(const monster of world.monsters){
    if(monster.state==='DEAD'||!monster.lifeId)continue;
    const points=lifeCanvasHitPoints(monster.lifeId).filter(point=>document.elementFromPoint(point.clientX,point.clientY)===renderer.domElement);
    if(points.length)return points;
  }
  return Object.freeze([]);
}
globalThis.__K11520_WORLD_SELECTION_PROJECTION__=Object.freeze({lifeCanvasHitPoints,visibleLifeCanvasHitPoints});

const raycaster=new THREE.Raycaster(),tapPointer=new THREE.Vector2(),groundPlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);let worldTapStart=null;
function ancestorData(obj,key){let n=obj;while(n){if(n.userData&&n.userData[key]!=null)return n.userData[key];n=n.parent}return null}
function objectEntity(o){return{objectName:o.name||o.label||o.id||o.kind||'世界物件',objectType:o.kind||'WORLD_OBJECT',lifeId:o.lifeId||null,x:Number(o.x)||0,y:Number(o.y)||0,z:Number(o.z)||0,functionText:o.functionText||o.purpose||'11520 世界設施／物件',interactionText:o.interactionText||'查看、導航、接近後互動'}}
function monsterEntity(m){return{objectName:m.name||m.baseName||m.species||'Market Life',objectType:m.species||m.sourceType||'MARKET_LIFE',lifeId:m.lifeId||null,x:Number(m.x)||0,y:Number(m.y)||0,z:Number(m.z)||0,functionText:`Living World 生命 · HP ${Math.round(m.hp||0)}/${Math.round(m.maxHp||0)}`,interactionText:'查看、導航、接近後依生命規則互動／捕捉／戰鬥'}}
function emitWorldTapRoute(route,detail={}){renderer.domElement.dispatchEvent(new CustomEvent('k11520:world-tap',{detail:{route,...detail}}));return route}
function monsterAt(clientX,clientY){const rect=renderer.domElement.getBoundingClientRect(),radii=[0,6,12,18],samples=[];for(const radius of radii){if(!radius)samples.push([0,0]);else for(let i=0;i<8;i++){const angle=i*Math.PI/4;samples.push([Math.cos(angle)*radius,Math.sin(angle)*radius])}}for(const [dx,dy] of samples){const x=clientX+dx,y=clientY+dy;if(x<rect.left||x>rect.right||y<rect.top||y>rect.bottom)continue;tapPointer.x=((x-rect.left)/rect.width)*2-1;tapPointer.y=-((y-rect.top)/rect.height)*2+1;raycaster.setFromCamera(tapPointer,camera);for(const hit of raycaster.intersectObjects(scene.children,true)){if(ancestorData(hit.object,'isPlayer'))break;const mid=ancestorData(hit.object,'worldMonsterId');if(mid!=null)return world.monsters.find(item=>String(item.id)===String(mid))||null;if(ancestorData(hit.object,'worldObjectId')!=null)break}}return null}
function routeMonsterTap(m){if(!m||m.state==='DEAD')return null;if(m.simulationCombat){showCombatTarget();return emitWorldTapRoute('ENTITY',{entityType:'SIMULATION_TARGET',entityId:m.id})}showEntityInfo(monsterEntity(m));toast(`發現 ${m.name||m.baseName||m.species||'生命'}`);return emitWorldTapRoute('ENTITY',{entityType:'MONSTER',entityId:String(m.id),lifeId:String(m.lifeId||'')})}
function worldTapAt(clientX,clientY,latchedMonster=null){if(latchedMonster){const routed=routeMonsterTap(latchedMonster);if(routed)return routed}const rect=renderer.domElement.getBoundingClientRect();tapPointer.x=((clientX-rect.left)/rect.width)*2-1;tapPointer.y=-((clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(tapPointer,camera);const hits=raycaster.intersectObjects(scene.children,true);for(const hit of hits){if(ancestorData(hit.object,'isPlayer')){renderer.domElement.dispatchEvent(new CustomEvent('k11520:player-tap',{detail:{source:'WORLD_RAYCAST'}}));return emitWorldTapRoute('PLAYER')}const mid=ancestorData(hit.object,'worldMonsterId');if(mid!=null){const m=world.monsters.find(x=>String(x.id)===String(mid));const routed=routeMonsterTap(m);if(routed)return routed}const oid=ancestorData(hit.object,'worldObjectId');if(oid!=null){const o=WORLD_OBJECTS.find(x=>String(x.id)===String(oid));if(o){showEntityInfo(objectEntity(o));toast(`發現 ${o.name||o.label||o.kind||'物件'}`);return emitWorldTapRoute('ENTITY',{entityType:'WORLD_OBJECT',entityId:String(oid)})}}}
  let pointHit=hits.find(h=>ancestorData(h.object,'isGround'));let p=pointHit?.point;if(!p){const q=new THREE.Vector3();if(raycaster.ray.intersectPlane(groundPlane,q))p=q}if(p){cancelNavigation('切換世界目標');S.navTarget=null;document.getElementById('waypointAction')?.remove();setWorldTarget3D({x:p.x,y:p.y,z:p.z},{mode:'WORLD',source:'WORLD_GROUND'});startWorldNavigation3D();toast(`XYZ 前往 X ${fmt(p.x,1)} · Y ${fmt(p.y,1)} · Z ${fmt(p.z,1)}`);return emitWorldTapRoute('GROUND',{x:p.x,y:p.y,z:p.z})}toast('這裡沒有可到達目標');return emitWorldTapRoute('NONE')
}
renderer.domElement.addEventListener('pointerdown',e=>{worldTapStart={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),monster:monsterAt(e.clientX,e.clientY)}},{passive:true});renderer.domElement.addEventListener('pointerup',e=>{const s=worldTapStart;worldTapStart=null;if(!s||s.id!==e.pointerId)return;if(Math.hypot(e.clientX-s.x,e.clientY-s.y)>10||performance.now()-s.t>420)return;worldTapAt(e.clientX,e.clientY,s.monster)},{passive:true});renderer.domElement.addEventListener('pointercancel',()=>{worldTapStart=null},{passive:true});

function resize(){renderer.setSize(innerWidth,innerHeight,true);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()}addEventListener('resize',resize);resize();let last=performance.now();function frame(now){requestAnimationFrame(frame);const dt=Math.min(.04,(now-last)/1000);last=now;mixer?.update(dt);if(S.navActive)moveNavigation();else moveManual();persistPlayerSession();avatar.position.set(S.xyz.x,S.xyz.y,S.xyz.z);avatar.rotation.y=-S.heading;const ctl=controlState(),v=controlVector(),groundMode=(ctl?.mode||'XZ')==='XZ',moving=Math.abs(v.x)+Math.abs(v.y)+Math.abs(v.z)>.05;play((S.navActive||(groundMode&&moving))?'walk':'idle');const tr=tickWorld(world,S.xyz,Date.now());for(const e of tr.events)if(e.type==='PLAYER_HIT')S.hp=Math.max(0,S.hp-e.damage);syncLifeVisuals();const dist=8.5;camera.position.set(S.xyz.x+Math.sin(S.camYaw)*dist,S.xyz.y+4.2,S.xyz.z-Math.cos(S.camYaw)*dist);camera.lookAt(S.xyz.x-Math.sin(S.camYaw)*1.8,S.xyz.y+.8,S.xyz.z+Math.cos(S.camYaw)*1.8);combatFx?.tick(now,S.xyz);combatFx?.applyCameraShake(now);hud();drawAllMaps();renderer.render(scene,camera)}

renderAxes();syncControls();quotes();setInterval(quotes,5000);install11520ProductFixes();requestAnimationFrame(frame);$('#charState').textContent='3D LOADING';toast('11520 canonical runtime 已啟動');
