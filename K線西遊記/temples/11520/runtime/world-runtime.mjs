/*
KGEN_META
VERSION: 1.9.0
REVISION: 2026-09-21.PUBLIC-MARKET-K
STATUS: ACTIVE / SIMULATION-FIRST
LAST_UPDATED: 2026-09-21
UPDATED_BY: codex-gm-01
CHANGE_REASON: Feed normalized simulation K from complete public quote batches; preserve local XYZ, relative combat geometry, source-managed Life and settlement boundaries.
SOURCE_OF_TRUTH: TRUE
*/

import {createMarketLife,perceiveMarketLife,decideMarketLife,decideMarketLifeLifestyle,tickMarketLifeNeeds,travelMarketLife,advanceMarketLifeCycle,maybeGrowMarketLife,snapshotMarketLife,remember} from './market-life-runtime.mjs';
import {deriveMarketRelations,animationIntentForRelations} from './market-relation-runtime.mjs';
import {drainMarketLifeSourceEvents,installMarketLifeSourceListeners} from './market-life-source-runtime.mjs';
import {chaseStep,maybeMonsterHit,isHostileMonster} from './monster-aggression-runtime.mjs';

export const WORLD_RULES=Object.freeze({
  placeId:'11520',settlement:'KAIOS',
  worldBounds:Object.freeze({minX:-60,maxX:60,minZ:-60,maxZ:60,minY:0,maxY:40}),
  playerRadius:.45,meleeRange:2.2,monsterAggroRange:8,monsterAttackRange:1.55,
  monsterAttackCooldownMs:1200,respawnMs:8000,marketLifeDecisionMs:1600,sourceSlots:24,
});

export const WORLD_OBJECTS=Object.freeze([
  {id:'HOME-11520-001',type:'BUILDING',kind:'BUILDING',name:'花果山民宅',x:-7,y:0,z:7,radius:2.2,halfX:2.2,halfZ:2.2,lifeId:'LIFE-BUILDING-11520-HOME-001'},
  {id:'ATM-11520-001',type:'ATM',kind:'ATM',name:'行動 ATM 飛碟站',x:8,y:0,z:5,radius:1.4,halfX:1.4,halfZ:1.4,lifeId:'LIFE-ATM-11520-001'},
  {id:'SHOP-11520-001',type:'BUILDING',kind:'SHOP',name:'花果山市集',x:13,y:0,z:-10,radius:2.8,halfX:2.8,halfZ:2.8,lifeId:'LIFE-BUILDING-11520-SHOP-001'},
]);

const SCENIC_DESTINATIONS=Object.freeze([
  Object.freeze({id:'SCENIC-WATERFALL-11520',name:'水簾洞瀑布',x:-18,y:3,z:-16}),
  Object.freeze({id:'SCENIC-CLOUD-11520',name:'花果山雲海',x:4,y:14,z:-22}),
  Object.freeze({id:'SCENIC-RIDGE-11520',name:'取經山徑',x:24,y:2,z:18}),
]);

export const MONSTER_TEMPLATES=Object.freeze({
  STONE_APE:Object.freeze({species:'STONE_APE',name:'暗影猿',maxHp:120,attack:6,rewardKaios:12,speed:.018,intelligence:1,markets:['BTCUSDT'],capital:80,homeAxis:'KX',initialSide:1}),
  FIRE_WISP:Object.freeze({species:'FIRE_WISP',name:'火靈',maxHp:85,attack:4,rewardKaios:9,speed:.024,intelligence:2,markets:['ETHUSDT'],capital:65,homeAxis:'KY',initialSide:-1}),
  BULL_DEMON:Object.freeze({species:'BULL_DEMON',name:'牛魔王',maxHp:260,attack:12,rewardKaios:30,speed:.014,intelligence:6,markets:['BTCUSDT','ETHUSDT','BNBUSDT'],capital:320,homeAxis:'KX',initialSide:-1}),
});

const finite=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const copy=v=>JSON.parse(JSON.stringify(v));

function inactiveSlot(index){
  const lifeId=`LIFE-SOURCE-SLOT-11520-${String(index+1).padStart(3,'0')}`;
  const marketLife=createMarketLife({lifeId,name:'INACTIVE SOURCE SLOT',species:'SOURCE_SLOT',intelligence:1,markets:[],capital:0,vitality:0,positions:{}});
  return {id:`MON-SOURCE-SLOT-${String(index+1).padStart(3,'0')}`,lifeId,sourceLifeId:null,sourceId:null,sourceManaged:false,sourceMeta:null,
    species:'SOURCE_SLOT',name:'',baseName:'',maxHp:100,attack:0,rewardKaios:0,speed:0,intelligence:1,markets:[],capital:0,
    spawnX:0,spawnY:0,spawnZ:0,x:0,y:0,z:0,hp:0,state:'DEAD',lastAttackAt:0,defeatedAt:null,marketLife,marketRelation:null,visualMode:'HIDDEN',mission:null,cargo:null,route:null};
}

export function createWorldState(now=Date.now()){
  installMarketLifeSourceListeners();
  const world={monsters:Array.from({length:WORLD_RULES.sourceSlots},(_,i)=>inactiveSlot(i)),lastTick:now,lastMarketLifeTick:now,sourceEvents:[]};
  applyMarketLifeSourceEvents(world,drainMarketLifeSourceEvents());
  return world;
}

// Game reference coordinates, NOT Canon constants, a live oracle or settlement.
// One unit is one percentage point relative to the explicitly recorded anchor.
export const KSPACE_REFERENCE=Object.freeze({
  source:'SIMULATION_REFERENCE_V1',
  KX:Object.freeze({market:'BTCUSDT',anchor:100000,price:101000}),
  KY:Object.freeze({market:'ETHUSDT',anchor:4000,price:3980}),
  KZ:Object.freeze({market:'BNBUSDT',anchor:600,price:606}),
});
export const KSPACE_PHASES=Object.freeze(['KX+','KX-','KY+','KY-','KZ+','KZ-']);
export const KSPACE_SKILLS=Object.freeze({
  slash:Object.freeze({radius:2.2,damage:35,cooldownMs:350}),
  goldenRain:Object.freeze({radius:6,damage:22,cooldownMs:1400}),
  phantomAxe:Object.freeze({radius:4,damage:18,cooldownMs:1900}),
});
const K_AXES=['KX','KY','KZ'],XYZ=['x','y','z'];
const validVec=v=>v&&XYZ.every(k=>typeof v[k]==='number'&&Number.isFinite(v[k]));
export function normalizeKPrice(price,anchor){
  if(!Number.isFinite(price)||!Number.isFinite(anchor)||price<=0||anchor<=0)throw new RangeError('INVALID_K_REFERENCE');
  const k=100*(price/anchor-1);
  if(!Number.isFinite(k))throw new RangeError('K_OVERFLOW');
  return Object.is(k,-0)?0:k;
}
export function inverseKPrice(k,anchor){
  if(!Number.isFinite(k)||k<=-100||!Number.isFinite(anchor)||anchor<=0)throw new RangeError('INVALID_K_COORDINATE');
  const price=anchor*(1+k/100);if(!Number.isFinite(price)||price<=0)throw new RangeError('K_OVERFLOW');return price;
}
export function kPositionFromReference(reference=KSPACE_REFERENCE){
  if(typeof reference.source!=='string'||!reference.source)throw new RangeError('K_SOURCE_REQUIRED');
  return Object.fromEntries(K_AXES.map(a=>[a,normalizeKPrice(reference[a]?.price,reference[a]?.anchor)]));
}
export function formatKCoordinate(k){const n=Math.round(k*100)/100;return `${n>0?'+':''}${(Object.is(n,-0)?0:n).toFixed(2)}`}
// Public reference data affects this simulation only; never an execution oracle.
// Fixed anchors define units, NOT fallback prices. Production waits for a complete quote batch.
export function updateKMarketReference(world,quotes,receivedAt=Date.now()){
  if(!Number.isFinite(receivedAt)||receivedAt<0)throw new RangeError('INVALID_QUOTE_TIME');
  const reference={source:'BINANCE_PUBLIC_MARKET_DATA_ONLY'};
  for(const a of K_AXES){const {market,anchor}=KSPACE_REFERENCE[a];reference[a]={market,anchor,price:quotes?.[market]}}
  const next=kPositionFromReference(reference); // validate all three before mutating anything
  if(world.kSpace?.receivedAt>receivedAt)return false;
  if(!world.kSpace)createKSpaceEncounter(world,reference);
  const space=world.kSpace,previous=space.playerK;
  // Translate the shared market frame; preserve each entity's relative K and local XYZ.
  for(const m of world.monsters.filter(m=>m.simulationCombat&&m.kPosition))
    m.kPosition=Object.fromEntries(K_AXES.map(a=>[a,next[a]+(m.kPosition[a]-previous[a])]));
  space.reference=copy(reference);space.playerK=next;space.receivedAt=receivedAt;space.quoteFailed=false;
  return true;
}
export function kMarketSnapshot(world,now=Date.now()){
  const s=world.kSpace;if(!s||!Number.isFinite(s.receivedAt))return {status:'WAIT',receivedAt:null,markets:[]};
  const status=s.quoteFailed||now-s.receivedAt>15000?'STALE':'LIVE';
  const markets=K_AXES.map(axis=>{const v=s.reference[axis],k=s.playerK[axis];return {axis,symbol:v.market,price:v.price,anchor:v.anchor,k,
    // A scalar market has one axis intercept, not three invented independent coordinates.
    point:Object.fromEntries(K_AXES.map(a=>[a,a===axis?k:0]))}});
  return {status,receivedAt:s.receivedAt,source:s.reference.source,markets};
}
export function composeKWorld(k,local){
  if(!validVec(local)||!k||!K_AXES.every(a=>Number.isFinite(k[a])))throw new RangeError('INVALID_K_POSITION');
  const result=Object.fromEntries(XYZ.map((v,i)=>[v,k[K_AXES[i]]+local[v]]));
  if(!validVec(result))throw new RangeError('K_OVERFLOW');return result;
}
export function combatPhase(plane,c){
  const axis={XZ:'KY',XY:'KZ',YZ:'KX'}[plane];
  if(!axis||typeof c!=='number'||!Number.isFinite(c))return null;
  return {axis,sign:Math.sign(c)||0,body:c===0?null:axis+(c>0?'+':'-')};
}
export function createKSpaceEncounter(world,reference=KSPACE_REFERENCE){
  if(world.kSpace)return world.kSpace;
  const K=kPositionFromReference(reference);
  world.kSpace={reference:copy(reference),playerK:K,targetId:'SIM-K-GUARDIAN',lastAttackAt:null,lastResult:null};
  // A local practice entity is never a registered Life or a source settlement.
  const guardian={id:'SIM-K-GUARDIAN',lifeId:null,species:'STONE_APE',name:'K-Guardian · 模擬',baseName:'K-Guardian · 模擬',
    simulationCombat:true,sourceManaged:false,state:'GUARD',attack:0,rewardKaios:0,
    kPosition:{...K,KZ:K.KZ+1},localPosition:{x:0,y:0,z:6},x:0,y:0,z:7,
    hp:600,maxHp:600,exposed:'KY-',bodies:Object.fromEntries(KSPACE_PHASES.map(id=>[id,{hp:100,maxHp:100,defense:id==='KY-'?0:4}]))};
  // Render in the player's K-origin frame, using the same R=K+r as hit testing.
  const origin=composeKWorld(K,{x:0,y:0,z:0}),rendered=composeKWorld(guardian.kPosition,guardian.localPosition);
  for(const axis of XYZ)guardian[axis]=rendered[axis]-origin[axis];
  world.monsters.push(guardian);return world.kSpace;
}
export function kCombatSnapshot(world,player,{plane='XZ',c=0}={}){
  const space=world.kSpace;if(!space||!validVec(player))return null;
  const target=world.monsters.find(m=>m.id===space.targetId&&m.simulationCombat),selection=combatPhase(plane,c);
  const playerWorld=composeKWorld(space.playerK,player);
  const market=kMarketSnapshot(world);
  if(!target)return {simulationOnly:true,market,selection,playerK:copy(space.playerK),playerLocal:{...player},playerWorld,target:null};
  const targetWorld=composeKWorld(target.kPosition,target.localPosition);
  const deltaK=Object.fromEntries(K_AXES.map(a=>[a,target.kPosition[a]-space.playerK[a]]));
  const relative=Object.fromEntries(XYZ.map(a=>[a,targetWorld[a]-playerWorld[a]]));
  return {simulationOnly:true,market,source:space.reference.source,reference:copy(space.reference),playerK:copy(space.playerK),playerLocal:{...player},playerWorld,
    monsterK:copy(target.kPosition),monsterLocal:{...target.localPosition},monsterWorld:targetWorld,deltaK,relative,
    distance:Math.hypot(relative.x,relative.y,relative.z),selection,
    target:{id:target.id,name:target.baseName,hp:target.hp,maxHp:target.maxHp,state:target.state,exposed:target.exposed,bodies:copy(target.bodies)},
    lastResult:space.lastResult?copy(space.lastResult):null};
}
export function attackKSpace(world,player,{plane,c,skill='slash',now=Date.now(),heading=0}={}){
  const snapshot=kCombatSnapshot(world,player,{plane,c}),spec=KSPACE_SKILLS[skill],space=world.kSpace;
  const result={ok:false,hit:false,simulationOnly:true,rewardKaios:0,skill,body:snapshot?.selection?.body||null,hits:[],damage:0};
  const finish=reason=>{result.reason=reason;if(space)space.lastResult={...result,at:now};return result};
  if(!snapshot||!spec||!Number.isFinite(now)||!Number.isFinite(heading))return finish('INVALID_INPUT');
  if(!snapshot.target||snapshot.target.state==='DEAD')return finish('NO_TARGET');
  if(!snapshot.selection?.body)return finish('NEUTRAL_PHASE');
  if(space.lastAttackAt!==null&&now-space.lastAttackAt<space.cooldownMs)return finish('COOLDOWN');
  space.lastAttackAt=now;space.cooldownMs=spec.cooldownMs;
  if(snapshot.distance>spec.radius)return finish('OUT_OF_RANGE');
  const axis=snapshot.selection.axis,sign=snapshot.selection.sign>0?'+':'-';
  const target=world.monsters.find(m=>m.id===space.targetId);
  if(skill==='phantomAxe'){
    const v=snapshot.relative,horizontal=Math.hypot(v.x,v.z);
    if(horizontal>.001&&(Math.sin(heading)*v.x+Math.cos(heading)*v.z)/horizontal<0)return finish('OUTSIDE_SWEEP');
  }
  // Slash: exactly the chosen body. Rain: two tangent-plane axes, same phase.
  // Axe: three neighboring same-sign bodies in the forward semicircle.
  const ids=skill==='slash'?[snapshot.selection.body]:K_AXES.filter(a=>skill==='phantomAxe'||a!==axis).map(a=>a+sign);
  for(const id of ids){
    const body=target.bodies[id];if(body.hp<=0)continue;
    const state=id===target.exposed?'EXPOSED':id.slice(0,2)===target.exposed.slice(0,2)?'GUARDED':'RESIST';
    const multiplier=state==='EXPOSED'?1.5:state==='GUARDED'?.25:.75;
    const damage=Math.min(body.hp,Math.max(1,Math.round((spec.damage-body.defense)*multiplier)));
    body.hp-=damage;result.hits.push({body:id,damage,state});result.damage+=damage;
  }
  if(!result.hits.length)return finish('BODY_DISABLED');
  target.hp=Object.values(target.bodies).reduce((sum,b)=>sum+b.hp,0);
  if(!target.hp){target.state='DEAD';target.defeatedAt=now}
  result.ok=true;result.hit=true;result.defeated=target.state==='DEAD';
  return finish(result.hits.some(h=>h.state==='EXPOSED')?'WEAK_POINT':result.hits.every(h=>h.state==='GUARDED')?'BLOCKED_RESIST':'HIT');
}

function resetSlot(slot){
  const idx=Number(slot.id.match(/(\d+)$/)?.[1]||1)-1;
  Object.assign(slot,inactiveSlot(Math.max(0,idx)));
  return slot;
}

function findSourceSlot(world,lifeId){return world.monsters.find(m=>m.sourceManaged&&m.sourceLifeId===lifeId)||null}
function freeSourceSlot(world){return world.monsters.find(m=>!m.sourceManaged&&!m.simulationCombat&&m.state==='DEAD')||null}
function unionMarkets(current=[],incoming=[]){return [...new Set([...(current||[]),...(incoming||[])].filter(Boolean))]}

function hydrateSourceSlot(slot,event){
  const start={x:finite(event.x),y:finite(event.y),z:finite(event.z)};
  const ml=createMarketLife({lifeId:event.lifeId,name:event.name,species:event.species,intelligence:event.intelligence,markets:event.markets,capital:event.capital,vitality:event.vitality,positions:event.positions||{},fear:.4,profitDrive:.65,home:start,position:start,retirementReserve:event.meta?.retirementReserve||0,targetRetirementReserve:event.meta?.targetRetirementReserve||100});
  ml.strategy=event.strategy||'SOURCE_DRIVEN';
  Object.assign(slot,{lifeId:event.lifeId,sourceLifeId:event.lifeId,sourceId:event.sourceId,sourceManaged:true,sourceMeta:event.meta||{},species:event.species,name:event.name,baseName:event.name,
    maxHp:event.maxHp,attack:event.attack,rewardKaios:event.rewardKaios,speed:event.speed,intelligence:event.intelligence,markets:[...(event.markets||[])],capital:event.capital,
    spawnX:start.x,spawnY:start.y,spawnZ:start.z,x:start.x,y:start.y,z:start.z,hp:Math.max(0,event.maxHp*(event.vitality/100)),state:'OBSERVE',lastAttackAt:0,defeatedAt:null,
    marketLife:ml,marketRelation:null,visualMode:'OBSERVE',mission:event.mission||null,cargo:event.cargo||null,route:event.route||null});
  return slot;
}

function updateSourceSlot(slot,event){
  slot.name=event.name||slot.name;slot.baseName=event.name||slot.baseName;slot.species=event.species||slot.species;
  if(Number.isFinite(Number(event.x)))slot.x=Number(event.x);if(Number.isFinite(Number(event.y)))slot.y=Number(event.y);if(Number.isFinite(Number(event.z)))slot.z=Number(event.z);
  slot.maxHp=event.maxHp||slot.maxHp;slot.attack=event.attack;slot.speed=event.speed;slot.rewardKaios=event.rewardKaios;slot.intelligence=event.intelligence;
  slot.hp=Math.max(0,slot.maxHp*(event.vitality/100));slot.state=event.vitality<=0?'DEAD':'OBSERVE';slot.mission=event.mission||slot.mission;slot.cargo=event.cargo||slot.cargo;slot.route=event.route||slot.route;slot.sourceMeta=event.meta||slot.sourceMeta;
  slot.markets=unionMarkets(slot.markets,event.markets);
  slot.marketLife.name=slot.baseName;slot.marketLife.species=slot.species;slot.marketLife.intelligence=slot.intelligence;slot.marketLife.capital=event.capital;slot.marketLife.vitality=event.vitality;slot.marketLife.positions=structuredClone(event.positions||{});slot.marketLife.strategy=event.strategy||slot.marketLife.strategy;
  slot.marketLife.marketDimensions=unionMarkets(slot.marketLife.marketDimensions,event.markets);
  slot.marketLife.world.position={x:slot.x,y:slot.y,z:slot.z};
  return slot;
}

export function applyMarketLifeSourceEvents(world,events=[]){
  const applied=[];
  for(const event of events){
    if(event.type==='DESPAWN'){
      const slot=findSourceSlot(world,event.lifeId);if(slot){const id=slot.id;resetSlot(slot);applied.push({type:'SOURCE_DESPAWNED',slotId:id,lifeId:event.lifeId,sourceId:event.sourceId,reason:event.reason})}continue;
    }
    let slot=findSourceSlot(world,event.lifeId);
    if(!slot&&event.type==='SPAWN'){slot=freeSourceSlot(world);if(!slot){applied.push({type:'SOURCE_REJECTED',lifeId:event.lifeId,reason:'NO_FREE_SOURCE_SLOT'});continue}hydrateSourceSlot(slot,event);applied.push({type:'SOURCE_SPAWNED',slotId:slot.id,lifeId:event.lifeId,sourceId:event.sourceId});continue}
    if(slot){updateSourceSlot(slot,event);applied.push({type:'SOURCE_UPDATED',slotId:slot.id,lifeId:event.lifeId,sourceId:event.sourceId});}
  }
  world.sourceEvents.push(...applied);world.sourceEvents=world.sourceEvents.slice(-256);return applied;
}

export function distance2D(a,b){return Math.hypot((a.x||0)-(b.x||0),(a.z||0)-(b.z||0))}
export function resolvePlayerMove(player,next){const bounded={x:Math.max(WORLD_RULES.worldBounds.minX,Math.min(WORLD_RULES.worldBounds.maxX,Number(next.x)||0)),y:Math.max(WORLD_RULES.worldBounds.minY,Math.min(WORLD_RULES.worldBounds.maxY,Number(next.y)||0)),z:Math.max(WORLD_RULES.worldBounds.minZ,Math.min(WORLD_RULES.worldBounds.maxZ,Number(next.z)||0))};const blocker=WORLD_OBJECTS.find(o=>distance2D(bounded,o)<o.radius+WORLD_RULES.playerRadius)||null;return blocker?{x:player.x,y:player.y,z:player.z,blocked:true,blocker}:{...bounded,blocked:false,blocker:null}}

function sideFromText(v){const s=String(v||'');if(/多|LONG|BUY|\+/.test(s))return 1;if(/空|SHORT|SELL|−|-/.test(s))return-1;return 0}
function readPlayerAxesFromGame(){if(typeof document==='undefined')return {};const out={};for(const axis of ['KX','KY','KZ']){const card=document.querySelector(`[data-axis="${axis}"]`);if(!card)continue;const pos=card.querySelector('.pos')?.textContent||'',market=card.querySelector('select')?.value?.replace('/','')||null;if(!market||/空倉/.test(pos))continue;const lots=Number(pos.match(/([\d.]+)口/)?.[1]||0),c=Number(pos.match(/([\d.]+(?:e[-+]?\d+)?)C/i)?.[1]||0);out[axis]={market,side:sideFromText(pos),lots,c,pnl:0}}return out}
function readQuotesFromGame(){if(typeof document==='undefined')return {};const out={};for(const axis of ['KX','KY','KZ']){const card=document.querySelector(`[data-axis="${axis}"]`);if(!card)continue;const market=card.querySelector('select')?.value?.replace('/',''),q=Number((card.querySelector('.q')?.textContent||'').replace(/[$,]/g,''));if(market&&Number.isFinite(q))out[market]=q}return out}

function seeded(lifeId,now){let h=2166136261;for(const c of String(lifeId))h=(h^c.charCodeAt(0))*16777619>>>0;h=(h^(Math.floor(now/5000)>>>0))*16777619>>>0;return(h%10000)/10000}
function targetAxisFromPerception(perception){return Object.entries(perception.visiblePlayerAxes||{}).sort((a,b)=>(Math.abs(Number(b[1].lots)||0)-Math.abs(Number(a[1].lots)||0)))[0]?.[0]||null}
function opposite(v){return Number(v)===1?-1:Number(v)===-1?1:0}
function applyDecisionToPositions(life,decision,perception){const entries=Object.entries(perception.visiblePlayerAxes||{}),target=targetAxisFromPerception(perception),p=target?perception.visiblePlayerAxes[target]:null;if(decision.action==='RETREAT'){life.positions={};return}if(decision.action==='REDUCE'){for(const x of Object.values(life.positions||{}))x.lots=Math.max(1,Math.floor((Number(x.lots)||1)*.5));return}if(!target||!p)return;if(decision.action==='FOLLOW')life.positions[target]={market:p.market,side:Number(p.side)||1,lots:Math.max(1,Math.round((Number(p.lots)||1)*.7)),c:Number(p.c)||.001};else if(decision.action==='OPPOSE')life.positions[target]={market:p.market,side:opposite(p.side)||-1,lots:Math.max(1,Math.round((Number(p.lots)||1)*.8)),c:Number(p.c)||.001};else if(decision.action==='HEDGE')life.positions[target]={market:p.market,side:opposite(p.side)||-1,lots:Math.max(1,Math.round((Number(p.lots)||1)*.35)),c:Number(p.c)||.001};else if(decision.action==='REALLOCATE'){const budget=Math.max(1,Math.round(Math.min(life.capital*.08,(Number(p.lots)||1)*1.25)));life.positions[target]={market:p.market,side:seeded(life.lifeId,perception.now)>.48?(Number(p.side)||1):(opposite(p.side)||-1),lots:budget,c:Number(p.c)||.001};if(entries.length>1){const [a,x]=entries.find(([a])=>a!==target)||[];if(a&&x)life.positions[a]={market:x.market,side:opposite(x.side)||-1,lots:Math.max(1,Math.round(budget*.45)),c:Number(x.c)||.001}}}}
function relationLabel(r){if(r==='ALIGNED')return'同行';if(r==='OPPOSED')return'對戰';return'中立'}
function sideLabel(v){return Number(v)>0?'+':Number(v)<0?'-':'0'}
function refreshMarketRelation(m,playerAxes){const rel=deriveMarketRelations({playerAxes,lifePositions:m.marketLife.positions||{}});m.marketRelation=rel;const intent=animationIntentForRelations(rel);m.visualMode=intent.state;const axes=['KX','KY','KZ'].map(a=>`${a}${sideLabel(rel.byAxis[a].lifeSide)}${relationLabel(rel.byAxis[a].relation)}`).join(' ');m.name=`${m.baseName}｜${axes}｜${m.marketLife.strategy}｜${m.marketLife.lifestyle?.action||'REST'}`;return rel}

function sourceDestinations(){return [...WORLD_OBJECTS.map(o=>({id:o.id,name:o.name,x:o.x,y:o.y||0,z:o.z})),...SCENIC_DESTINATIONS.map(copy)]}
function missionDestination(m){const id=m.mission?.destinationAtmId||m.mission?.destination?.atmId;if(!id)return null;const o=WORLD_OBJECTS.find(x=>x.id===id);return o?{id:o.id,name:o.name,x:o.x,y:o.y||0,z:o.z}:null}
function sourceJobs(m){const q=m.mission?.quote;const net=Number(q?.net);if(m.mission&&Number.isFinite(net)&&net>0)return[{jobId:m.mission.missionId||'SOURCE-JOB',expectedNet:net,destinationAtmId:m.mission.destinationAtmId||null}];return Array.isArray(m.sourceMeta?.jobs)?m.sourceMeta.jobs:[]}
function relationThreat(rel){const opposed=Object.values(rel?.byAxis||{}).filter(x=>x?.relation==='OPPOSED').length;return opposed/3}
function relationOpportunity(rel){const engaged=Object.values(rel?.byAxis||{}).filter(x=>x?.relation==='ALIGNED'||x?.relation==='OPPOSED').length;return engaged/3}
function syncSlotFromLife(m){const p=m.marketLife.world?.position;if(!p)return;m.x=finite(p.x,m.x);m.y=finite(p.y,m.y);m.z=finite(p.z,m.z);m.capital=m.marketLife.capital;}

export function tickSourceManagedLife(m,{playerAxes={},quotes={},now=Date.now(),deltaMs=16,makeDecision=true,random=null}={}){
  if(!m?.sourceManaged||m.state==='DEAD')return{ok:false,reason:'SOURCE_LIFE_INACTIVE'};
  const life=m.marketLife;advanceMarketLifeCycle(life,{now});
  const perception=perceiveMarketLife(life,{playerAxes,quotes,now});
  const marketDecision=decideMarketLife(life,perception,{random:random||(()=>seeded(life.lifeId,now))});
  applyDecisionToPositions(life,marketDecision,perception);
  const rel=refreshMarketRelation(m,playerAxes);
  const forcedDestination=missionDestination(m);
  let lifestyleDecision=null;
  if(forcedDestination&&['IN_TRANSIT','ASSIGNED','LOAD'].includes(String(m.mission?.status||''))){
    life.world.destination=forcedDestination;life.lifestyle.action='WORK';life.lifestyle.reason='ACTIVE_DELIVERY_MISSION';
    lifestyleDecision={lifeId:life.lifeId,action:'WORK',reason:'ACTIVE_DELIVERY_MISSION',destination:forcedDestination,now};
  }else if(makeDecision){
    lifestyleDecision=decideMarketLifeLifestyle(life,{jobs:sourceJobs(m),destinations:sourceDestinations(),marketOpportunity:relationOpportunity(rel),threat:relationThreat(rel),now,random:random||(()=>seeded(`${life.lifeId}:LIFESTYLE`,now))});
  }
  const action=life.lifestyle?.action||'REST';
  const traveling=Boolean(life.world.destination)&&['TRAVEL','EXPLORE','WORK'].includes(action);
  if(traveling){travelMarketLife(life,{deltaMs,speed:Math.max(.004,finite(m.speed,.01))});}
  tickMarketLifeNeeds(life,{deltaHours:Math.max(0,finite(deltaMs))/3600000,working:action==='WORK',traveling,resting:action==='REST'||action==='RETIRE',eating:action==='EAT',socializing:action==='SOCIAL'});
  syncSlotFromLife(m);
  if(['TRAVEL','EXPLORE','WORK','REST','RETIRE','EAT','SOCIAL'].includes(action)&&m.visualMode==='OBSERVE')m.visualMode=action;
  remember(life,{at:now,type:'WORLD_ACTIVITY',action,position:copy(life.world.position),destination:copy(life.world.destination)});
  return{ok:true,marketDecision,lifestyleDecision,action,relation:rel,position:copy(life.world.position),destination:copy(life.world.destination)};
}

// NUCLEAR-TEST FALLBACK ONLY. Source-managed Market Life requires source/market settlement.
export function playerAttack(world,player,damage=24,now=Date.now()){
  if(damage&&typeof damage==='object'){now=Number(damage.now)||Date.now();damage=damage.damage??24}
  const alive=world.monsters.filter(m=>m.state!=='DEAD'&&m.sourceManaged),target=alive.sort((a,b)=>distance2D(player,a)-distance2D(player,b))[0]||null,distance=target?distance2D(player,target):Infinity;
  if(!target||distance>WORLD_RULES.meleeRange)return{world,ok:false,hit:false,defeated:false,killed:false,reason:'OUT_OF_RANGE',rewardKaios:0,target,monster:target,distance};
  if(target.sourceManaged)return{world,ok:false,hit:false,defeated:false,killed:false,reason:'SOURCE_SETTLEMENT_REQUIRED',rewardKaios:0,target,monster:target,distance};
  return{world,ok:false,hit:false,defeated:false,killed:false,reason:'FORMAL_MARKET_SETTLEMENT_REQUIRED',rewardKaios:0,target,monster:target,distance};
}

export function tickMarketLives(world,{playerAxes={},quotes={},now=Date.now(),random=null,availableMarkets=[],deltaMs=16}={}){
  const events=[];
  for(const m of world.monsters){
    if(!m.sourceManaged||m.state==='DEAD')continue;
    const activity=tickSourceManagedLife(m,{playerAxes,quotes,now,deltaMs,makeDecision:true,random});
    const growth=maybeGrowMarketLife(m.marketLife,{availableMarkets});
    events.push({type:'SOURCE_MANAGED_MARKET_LIFE',monsterId:m.id,lifeId:m.lifeId,sourceId:m.sourceId,relations:m.marketRelation,positions:m.marketLife.positions,strategy:m.marketLife.strategy,lifestyle:m.marketLife.lifestyle,world:m.marketLife.world,activity,grown:growth.grown,unlockedMarket:growth.unlockedMarket||null});
  }
  world.lastMarketLifeTick=now;return{world,events};
}

export function tickWorld(world,player,now=Date.now()){
  if(now&&typeof now==='object')now=Number(now.now)||Date.now();
  const previous=Number(world.lastTick)||now,deltaMs=Math.max(0,now-previous);
  const events=[];events.push(...applyMarketLifeSourceEvents(world,drainMarketLifeSourceEvents()));const playerAxes=readPlayerAxesFromGame(),quotes=readQuotesFromGame();
  if(now-(world.lastMarketLifeTick||0)>=WORLD_RULES.marketLifeDecisionMs){const ml=tickMarketLives(world,{playerAxes,quotes,now,deltaMs,availableMarkets:['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT']});events.push(...ml.events)}
  else for(const m of world.monsters){if(!m.sourceManaged||m.state==='DEAD')continue;tickSourceManagedLife(m,{playerAxes,quotes,now,deltaMs,makeDecision:false})}
  for(const m of world.monsters){
    if(!m.sourceManaged||m.state==='DEAD'||!isHostileMonster(m))continue;
    const aggression=chaseStep(m,player,{deltaMs,aggroRange:WORLD_RULES.monsterAggroRange,attackRange:WORLD_RULES.monsterAttackRange});
    if(aggression.state==='CHASE'||aggression.state==='ATTACK'){m.state=aggression.state;m.visualMode=aggression.state;events.push({type:'MONSTER_AGGRO',monsterId:m.id,lifeId:m.lifeId,state:aggression.state,distance:aggression.distance,conflictAxes:aggression.conflictAxes,simulationOnly:true})}
    const hit=maybeMonsterHit(m,player,now,{cooldownMs:WORLD_RULES.monsterAttackCooldownMs,attackRange:WORLD_RULES.monsterAttackRange});if(hit)events.push(hit);
  }
  const playerDamage=events.filter(e=>e.type==='PLAYER_HIT').reduce((n,e)=>n+Math.max(0,finite(e.damage)),0);
  world.lastTick=now;return{world,events,playerDamage};
}

export function getMarketLifeSnapshot(world){return world.monsters.filter(m=>m.sourceManaged).map(m=>({monsterId:m.id,name:m.baseName,sourceId:m.sourceId,relation:m.marketRelation,visualMode:m.visualMode,mission:m.mission,cargo:m.cargo,route:m.route,position:{x:m.x,y:m.y,z:m.z},lifestyle:m.marketLife.lifestyle,world:m.marketLife.world,life:snapshotMarketLife(m.marketLife)}))}
export function serializeWorld(world){return JSON.parse(JSON.stringify(world))}
