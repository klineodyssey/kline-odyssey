/*
KGEN_META
VERSION: 2.9.0
REVISION: 2026-10-01.GAMEPLAY-BOSS-LOOT
STATUS: ACTIVE / SIMULATION-FIRST
LAST_UPDATED: 2026-10-01
UPDATED_BY: codex-gm-01
CHANGE_REASON: Add local-only Boss phases and deterministic game loot; derive unlocks from Player Life while preserving local XYZ, market/source Life and settlement boundaries.
SOURCE_OF_TRUTH: TRUE
*/

import {createMarketLife,perceiveMarketLife,decideMarketLife,decideMarketLifeLifestyle,tickMarketLifeNeeds,travelMarketLife,advanceMarketLifeCycle,maybeGrowMarketLife,snapshotMarketLife,remember} from './market-life-runtime.mjs';
import {deriveMarketRelations,animationIntentForRelations} from './market-relation-runtime.mjs';
import {drainMarketLifeSourceEvents,installMarketLifeSourceListeners} from './market-life-source-runtime.mjs';
import {chaseStep,maybeMonsterHit,isHostileMonster} from './monster-aggression-runtime.mjs';
import {gameUnitsToK,localPositionToK,composePhysicalK} from './spatial-coordinate-runtime.mjs';
import {resolveCMode} from '../controls/nonlinear-controls.mjs';
import {GAMEPLAY_UNLOCKS} from './player-life-runtime.mjs';

// Browser-local teaching state only: never grants XP, loot, orders or wallet authority.
export function createJourneyTutorial({storage,returning=false}={}){
  if(storage===undefined){try{storage=globalThis.localStorage}catch{storage=null}}
  const key='k11520.journey.tutorial',steps=['MOVE','HIT','LOOT','PHASE','PREVIEW','DONE'];
  let saved;try{saved=JSON.parse(storage?.getItem(key)||'null')}catch{}
  let stage=steps.includes(saved?.stage)?saved.stage:returning?'DONE':'MOVE',planes=[],signs=[];
  const texts={MOVE:'序章 1/5 · 悟空落地！拉搖桿走近守關猿',HIT:'序章 2/5 · 2.2m 內按打怪，0C 也可戰鬥',LOOT:'序章 3/5 · 擊倒守關猿，收集本機掉寶',PHASE:'序章 4/5 · 切平面，試 C ±0.001',PREVIEW:'序章 5/5 · 開下單預覽，不需確認成交',DONE:''};
  const save=()=>{try{storage?.setItem(key,JSON.stringify({stage}))}catch{}};
  save(); // A first visit reloaded before moving must not be mistaken for a returning graduate.
  function event(type,data={}){
    const old=stage;
    if(stage==='MOVE'&&type==='MOVE'&&data.distance>=2)stage='HIT';
    else if(stage==='HIT'&&type==='HIT')stage='LOOT';
    else if(stage==='LOOT'&&type==='LOOT')stage='PHASE';
    else if(stage==='PHASE'&&type==='CONTROL'){
      if(['XZ','XY','YZ'].includes(data.plane)&&!planes.includes(data.plane))planes.push(data.plane);
      if(resolveCMode(data.c).canTrade&&!signs.includes(Math.sign(data.c)))signs.push(Math.sign(data.c));
      if(planes.length>=2&&signs.includes(1)&&signs.includes(-1))stage='PREVIEW';
    }else if(stage==='PREVIEW'&&type==='PREVIEW'&&resolveCMode(data.c).canTrade)stage='DONE';
    if(old!==stage)save();return old!==stage;
  }
  function replay(){stage='MOVE';planes=[];signs=[];save()}
  function skip(){stage='DONE';save()}
  return {event,replay,skip,snapshot:()=>({stage,hint:texts[stage],complete:stage==='DONE',scope:'LOCAL_TUTORIAL_NO_REWARD'})};
}

export const WORLD_RULES=Object.freeze({
  placeId:'11520',settlement:'KGEN',tradeSettlement:'KGEN',lootCurrency:'KAIOS',
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
// V2.9 local game configuration. No token, financial reward or trading authority.
export const JOURNEY_ENCOUNTER_PROFILES=Object.freeze(Object.fromEntries(Object.entries({
  GUARDIAN:{name:'取經守關猿',level:1,unlock:'SLASH',hp:120,tier:'COMMON',reward:5,boss:false,training:false,weakPoints:['KY-','KX+','KZ-']},
  COURIER:{name:'KAIOS 運鈔妖',level:3,unlock:'STRONG_MONSTERS',hp:180,tier:'RARE',reward:8,boss:false,training:false,weakPoints:['KX+','KZ-','KY+']},
  MARKET_BOSS:{name:'三市場魔王',level:5,unlock:'BOSS',hp:300,tier:'EPIC',reward:20,boss:true,training:false,weakPoints:['KX+','KY-','KZ+']},
  TREND_BOSS:{name:'趨勢龍王 · GA600 訓練',level:6,unlock:'HISTORICAL_TRAINING',hp:360,tier:'EPIC',reward:20,boss:true,training:true,regime:'TREND',weakPoints:['KX+','KY+','KZ+']},
  CRASH_BOSS:{name:'風暴牛魔 · GA600 訓練',level:7,unlock:'HISTORICAL_TRAINING',hp:420,tier:'EPIC',reward:24,boss:true,training:true,regime:'CRASH',weakPoints:['KX-','KY-','KZ-']},
  RANGE_BOSS:{name:'六相星龜 · GA600 訓練',level:8,unlock:'HISTORICAL_TRAINING',hp:480,tier:'LEGENDARY',reward:25,boss:true,training:true,regime:'RANGE',weakPoints:['KY+','KX-','KZ+']},
}).map(([id,p])=>{const gate=GAMEPLAY_UNLOCKS.find(u=>u.id===p.unlock);return [id,Object.freeze({...p,id,minPlayerLevel:gate.playerLevel,minEngineLevel:gate.engineLevel,weakPoints:Object.freeze(p.weakPoints),scope:'GAME_TRAINING_ONLY'})]})));
export const GAME_LOOT_TABLE=Object.freeze([
  Object.freeze({itemId:'journey-fragment',name:'取經碎片',rarity:'COMMON',weight:55}),
  Object.freeze({itemId:'phase-crystal',name:'六相晶石',rarity:'UNCOMMON',weight:25}),
  Object.freeze({itemId:'wukong-mark',name:'悟空戰紋',rarity:'RARE',weight:12}),
  Object.freeze({itemId:'heart-fragment',name:'Heart Fragment',rarity:'EPIC',weight:6}),
  Object.freeze({itemId:'ga600-core-fragment',name:'GA600 Core Fragment',rarity:'LEGENDARY',weight:2}),
]);
export const GA600_GAME_TRAINING=Object.freeze({scope:'GAME_TRAINING_ONLY',fullEngine:'NOT_INTEGRATED',
  dataSource:'SYNTHETIC_REGIME_GAME_PROFILES_NOT_HISTORICAL_PERFORMANCE',
  disclaimer:'遊戲訓練，不代表歷史績效、未來績效或投資建議。',realTradingAuthority:false});
function lootHash(seed){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619)>>>0;return h}
export function selectJourneyLoot(seed,profileId='GUARDIAN',{playerLevel=1,engineLevel=1}={}){
  const p=JOURNEY_ENCOUNTER_PROFILES[profileId];if(!p)throw new RangeError('UNKNOWN_ENCOUNTER');
  const rare=GAMEPLAY_UNLOCKS.find(u=>u.id==='RARE_ENCOUNTERS');
  const rareUnlocked=Number.isFinite(playerLevel)&&Number.isFinite(engineLevel)&&playerLevel>=rare.playerLevel&&engineLevel>=rare.engineLevel;
  const table=rareUnlocked?(p.boss?GAME_LOOT_TABLE:p.id==='COURIER'?GAME_LOOT_TABLE.slice(0,3):GAME_LOOT_TABLE.slice(0,2)):GAME_LOOT_TABLE.slice(0,2);
  let roll=lootHash(`${profileId}:${seed}`)%table.reduce((sum,item)=>sum+item.weight,0),selected=table[0];
  for(const item of table){if(roll<item.weight){selected=item;break}roll-=item.weight}
  const {weight,...item}=selected;return {...item,quantity:1,kind:'GAME_ITEM',localOnly:true,noRealValue:true,tokenized:false};
}
function journeyEvent(world,type,target,now,extra={},queued=true){
  const event={type,monsterId:target.id,encounterId:target.encounterId,profileId:target.profileId,at:now,simulationOnly:true,...extra};
  if(queued)world.journeyEvents=[...(world.journeyEvents||[]),event].slice(-64);return event;
}
export function drainJourneyEvents(world){const events=world.journeyEvents||[];world.journeyEvents=[];return events}
function configureJourneyEncounter(world,target,profileId,now){
  const p=JOURNEY_ENCOUNTER_PROFILES[profileId],sequence=(world.journeyEncounterSequence||0)+1;
  world.journeyEncounterSequence=sequence;
  world.journeySessionId??=globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random().toString(36).slice(2)}`;
  Object.assign(target,{profileId,encounterId:`${world.journeySessionId}:${sequence}`,name:p.name,baseName:p.name,level:p.level,
    journeyTier:p.tier,rewardKaios:p.reward,state:'GUARD',hp:p.hp,maxHp:p.hp,rewardSuppressed:false,rewardClaimed:false,defeatedAt:null,
    boss:p.boss,training:p.training,phase:1,rage:false,lowHp:false,exposed:p.weakPoints[0],lastBossAttackAt:now});
  for(const [id,b] of Object.entries(target.bodies)){b.hp=b.maxHp=p.hp/6;b.defense=id===target.exposed?0:4}
  journeyEvent(world,p.boss?'BOSS_SPAWN':'MONSTER_DETECTED',target,now,{level:p.level});
  return target;
}
export function selectJourneyEncounter(world,player,{profileId='GUARDIAN',playerLevel=1,engineLevel=1,now=Date.now()}={}){
  const p=JOURNEY_ENCOUNTER_PROFILES[profileId],target=world.monsters.find(m=>m.simulationCombat);
  if(!world.journeyEnabled||!world.kSpace||!target||!validVec(player)||!Number.isFinite(now)||!p)return {ok:false,reason:'INVALID_ENCOUNTER'};
  if(!Number.isFinite(playerLevel)||!Number.isFinite(engineLevel)||playerLevel<p.minPlayerLevel||engineLevel<p.minEngineLevel)return {ok:false,reason:'PROGRESSION_LOCKED'};
  // Explicit training selection never changes the 24 financial source slots.
  configureJourneyEncounter(world,target,profileId,now);
  target.localPosition={x:player.x,y:player.y,z:player.z+7};Object.assign(target,target.localPosition);
  world.kSpace.targetId=target.id;world.kSpace.lastAttackAt=null;world.kSpace.lastResult=null;
  return {ok:true,encounterId:target.encounterId,profileId,training:p.training,scope:'GAME_TRAINING_ONLY'};
}
function advanceBoss(world,target,now){
  if(!target.boss||target.hp<=0)return [];
  const events=[],ratio=target.hp/target.maxHp,next=ratio<=1/3?3:ratio<=2/3?2:1,p=JOURNEY_ENCOUNTER_PROFILES[target.profileId];
  if(next>target.phase){target.phase=next;target.exposed=p.weakPoints[next-1];
    if(!target.bodies[target.exposed]?.hp)target.exposed=KSPACE_PHASES.find(id=>target.bodies[id].hp>0)||target.exposed;
    for(const [id,b] of Object.entries(target.bodies))b.defense=id===target.exposed?0:4;
    events.push(journeyEvent(world,'BOSS_PHASE_CHANGE',target,now,{phase:next,weakPoint:target.exposed},false));}
  if(ratio<=1/3&&!target.rage){target.rage=true;events.push(journeyEvent(world,'BOSS_RAGE',target,now,{},false))}
  if(ratio<=.18&&!target.lowHp){target.lowHp=true;events.push(journeyEvent(world,'BOSS_LOW_HP',target,now,{},false))}
  return events;
}
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
  // Compatibility name; only explicitly tagged PHYSICAL_K origins may compose.
  return composePhysicalK(k,local);
}
export function combatPhase(plane,c){
  const axis={XZ:'KY',XY:'KZ',YZ:'KX'}[plane];
  if(!axis||typeof c!=='number'||!Number.isFinite(c))return null;
  return {axis,sign:Math.sign(c)||0,body:c===0?null:axis+(c>0?'+':'-')};
}
export function createKSpaceEncounter(world,reference=KSPACE_REFERENCE,player={x:0,y:0,z:0}){
  if(world.kSpace)return world.kSpace;
  const K=kPositionFromReference(reference);
  world.kSpace={reference:copy(reference),playerK:K,targetId:'SIM-K-GUARDIAN',lastAttackAt:null,lastResult:null};
  // A local practice entity is never a registered Life or a source settlement.
  const guardian={id:'SIM-K-GUARDIAN',lifeId:null,species:'STONE_APE',name:'取經守關猿',baseName:'取經守關猿',
    simulationCombat:true,sourceManaged:false,state:'GUARD',attack:0,rewardKaios:5,journeyTier:'COMMON',lootName:'取經碎片',
    kPosition:{...K,KZ:K.KZ+1},localPosition:{x:player.x,y:player.y,z:player.z+7},x:player.x,y:player.y,z:player.z+7,
    hp:600,maxHp:600,exposed:'KY-',bodies:Object.fromEntries(KSPACE_PHASES.map(id=>[id,{hp:100,maxHp:100,defense:id==='KY-'?0:4}]))};
  // Keep the first journey encounter close enough to be immediately visible.
  for(const axis of XYZ)guardian[axis]=guardian.localPosition[axis];
  if(world.journeyEnabled){guardian.hp=guardian.maxHp=120;for(const b of Object.values(guardian.bodies))b.hp=b.maxHp=20}
  const ambient=[
    {id:'SIM-JOURNEY-APE-2',species:'STONE_APE',name:'暗影猿',x:-1.6,z:.5,hp:120,rewardKaios:5,exposed:'KX+'},
    {id:'SIM-JOURNEY-WISP-1',species:'FIRE_WISP',name:'火靈',x:1.4,z:0,hp:90,rewardKaios:4,exposed:'KY-'},
    {id:'SIM-JOURNEY-WISP-2',species:'FIRE_WISP',name:'火靈',x:-1.6,z:3,hp:90,rewardKaios:4,exposed:'KZ+'},
    {id:'SIM-JOURNEY-APE-3',species:'STONE_APE',name:'暗影猿',x:2,z:5,hp:120,rewardKaios:5,exposed:'KX-'}
  ].map((m,i)=>({id:m.id,lifeId:null,species:m.species,name:m.name,baseName:m.name,simulationCombat:false,ambientJourney:true,sourceManaged:false,state:'ROAM',attack:0,rewardKaios:m.rewardKaios,speed:.004+(i*.001),journeyTier:'COMMON',lootName:'取經碎片',spawnX:player.x+m.x,spawnY:player.y,spawnZ:player.z+m.z,x:player.x+m.x,y:player.y,z:player.z+m.z,hp:m.hp,maxHp:m.hp,exposed:m.exposed,visualMode:'ROAM',roamPhase:i*.9}));
  world.monsters.push(guardian);world.ambientLife=ambient;world.journeyAmbient=ambient.map(m=>m.id);
  if(world.journeyEnabled)configureJourneyEncounter(world,guardian,'GUARDIAN',world.lastTick||0);
  return world.kSpace;
}
export function kCombatSnapshot(world,player,{plane='XZ',c=0}={}){
  const space=world.kSpace;if(!space||!validVec(player))return null;
  const target=world.monsters.find(m=>m.id===space.targetId&&m.simulationCombat),selection=combatPhase(plane,c);
  const playerWorld=localPositionToK(player);
  const market=kMarketSnapshot(world);
  if(!target)return {simulationOnly:true,market,selection,playerK:copy(space.playerK),playerLocal:{...player},playerWorld,target:null};
  const targetWorld=localPositionToK(target.localPosition);
  const deltaK=Object.fromEntries(K_AXES.map(a=>[a,target.kPosition[a]-space.playerK[a]]));
  const relative=Object.fromEntries(XYZ.map(a=>[a,target.localPosition[a]-player[a]]));
  const distance=Math.hypot(relative.x,relative.y,relative.z);
  return {simulationOnly:true,market,source:space.reference.source,reference:copy(space.reference),playerK:copy(space.playerK),playerLocal:{...player},playerWorld,
    monsterK:copy(target.kPosition),monsterLocal:{...target.localPosition},monsterWorld:targetWorld,deltaK,relative,
    distance,distanceK:gameUnitsToK(distance),relativePhysicalK:localPositionToK(relative),
    worldSpace:'PHYSICAL_K',distanceSpace:'LOCAL_METERS',marketSpace:'MARKET_NORMALIZED',marketPhysicalTransform:'NOT_CONFIGURED',selection,
    target:{id:target.id,name:target.baseName,hp:target.hp,maxHp:target.maxHp,state:target.state,exposed:target.exposed,bodies:copy(target.bodies),phaseRule:'XZ→KY · XY→KZ · YZ→KX',selectedBody:selection?.body||null,
      encounterId:target.encounterId||null,profileId:target.profileId||null,level:target.level||1,boss:!!target.boss,training:!!target.training,phase:target.phase||1,rage:!!target.rage,lowHp:!!target.lowHp},
    lastResult:space.lastResult?copy(space.lastResult):null};
}
export function attackKSpace(world,player,{plane,c,skill='slash',now=Date.now(),heading=0,powerLevel=1}={}){
  const snapshot=kCombatSnapshot(world,player,{plane,c}),spec=KSPACE_SKILLS[skill],space=world.kSpace;
  const result={ok:false,hit:false,simulationOnly:true,rewardKaios:0,skill,body:snapshot?.selection?.body||null,hits:[],damage:0,events:[],rewardId:null};
  const finish=reason=>{result.reason=reason;if(space)space.lastResult={...result,at:now};return result};
  if(!snapshot||!spec||!Number.isFinite(now)||!Number.isFinite(heading))return finish('INVALID_INPUT');
  if(!snapshot.target||snapshot.target.state==='DEAD')return finish('NO_TARGET');
  const journey=world.journeyEnabled&&resolveCMode(c).mode==='MONSTER_MODE';
  if(!snapshot.selection?.body&&!journey)return finish('NEUTRAL_PHASE');
  if(space.lastAttackAt!==null&&now-space.lastAttackAt<space.cooldownMs)return finish('COOLDOWN');
  space.lastAttackAt=now;space.cooldownMs=spec.cooldownMs;
  if(snapshot.distanceK>gameUnitsToK(spec.radius))return finish('OUT_OF_RANGE');
  const axis=snapshot.selection.axis,sign=snapshot.selection.sign>0?'+':'-';
  const target=world.monsters.find(m=>m.id===space.targetId);
  if(skill==='phantomAxe'){
    const v=snapshot.relative,horizontal=Math.hypot(v.x,v.z);
    if(horizontal>.001&&(Math.sin(heading)*v.x+Math.cos(heading)*v.z)/horizontal<0)return finish('OUTSIDE_SWEEP');
  }
  // Slash: exactly the chosen body. Rain: two tangent-plane axes, same phase.
  // Axe: three neighboring same-sign bodies in the forward semicircle.
  const availableBodies=KSPACE_PHASES.filter(id=>target.bodies[id].hp>0);
  const ids=journey?availableBodies.slice(0,skill==='slash'?1:skill==='goldenRain'?2:3):skill==='slash'?[snapshot.selection.body]:K_AXES.filter(a=>skill==='phantomAxe'||a!==axis).map(a=>a+sign);
  for(const id of ids){
    const body=target.bodies[id];if(body.hp<=0)continue;
    const state=id===target.exposed?'EXPOSED':id.slice(0,2)===target.exposed.slice(0,2)?'GUARDED':'RESIST';
    const multiplier=state==='EXPOSED'?1.5:state==='GUARDED'?.25:.75;
    const level=Math.max(1,Math.min(10,Math.floor(Number(powerLevel)||1))),powerMultiplier=1+Math.min(.45,(level-1)*.05);
    const damage=Math.min(body.hp,Math.max(1,Math.round((spec.damage-body.defense)*multiplier*powerMultiplier)));
    body.hp-=damage;result.hits.push({body:id,damage,state});result.damage+=damage;
  }
  if(!result.hits.length)return finish('BODY_DISABLED');
  target.hp=Object.values(target.bodies).reduce((sum,b)=>sum+b.hp,0);
  result.events.push(...advanceBoss(world,target,now));
  if(!target.hp){target.state='DEAD';target.defeatedAt=now;
    if(world.journeyEnabled&&!target.rewardSuppressed&&!target.rewardClaimed){
      target.rewardClaimed=true;const p=JOURNEY_ENCOUNTER_PROFILES[target.profileId||'GUARDIAN'];
      result.rewardKaios=Math.max(1,Number(target.rewardKaios)||5);result.rewardId=`journey:${target.encounterId}`;
      result.loot=selectJourneyLoot(target.encounterId,p.id,{playerLevel:world.playerLevel,engineLevel:world.engineLevel});
      result.events.push(journeyEvent(world,target.boss?'BOSS_DEFEAT':'MONSTER_DEFEAT',target,now,{rewardId:result.rewardId},false));
    }
  }
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
  const guardian=world.journeyEnabled&&world.monsters.find(m=>m.simulationCombat);
  if(guardian?.state==='DEAD'&&now-guardian.defeatedAt>=6000){
    const cycle=(world.journeyCycle||0)+1;world.journeyCycle=cycle;
    const angle=cycle*Math.PI/3;
    guardian.localPosition={x:player.x+Math.sin(angle)*5,y:player.y,z:player.z+Math.cos(angle)*5};
    const boss=cycle>0&&cycle%5===0,courier=!boss&&cycle>0&&cycle%3===0;
    let profileId=boss?'MARKET_BOSS':courier?'COURIER':'GUARDIAN';
    const level=Number(world.playerLevel)||1,engineLevel=Number(world.engineLevel)||1,profile=JOURNEY_ENCOUNTER_PROFILES[profileId];
    // Progress is projected by the sole Player Life authority; no profile means
    // level 1 rather than silently unlocking harder content for a new guest.
    if(level<profile.minPlayerLevel||engineLevel<profile.minEngineLevel)profileId='GUARDIAN';
    configureJourneyEncounter(world,guardian,profileId,now);Object.assign(guardian,guardian.localPosition);
    world.kSpace.lastAttackAt=null;
  }
  for(const m of world.ambientLife||[]){if(m.state==='DEAD')continue;const phase=(now*.00035)+(m.roamPhase||0),radius=.65;m.x=m.spawnX+Math.sin(phase)*radius;m.z=m.spawnZ+Math.cos(phase*.83)*radius;m.y=Math.max(0,m.spawnY+(m.species==='FIRE_WISP'?1.1+.45*Math.sin(phase*1.7):0));m.localPosition={x:m.x,y:m.y,z:m.z}}
  const events=drainJourneyEvents(world);events.push(...applyMarketLifeSourceEvents(world,drainMarketLifeSourceEvents()));const playerAxes=readPlayerAxesFromGame(),quotes=readQuotesFromGame();
  if(guardian?.boss&&guardian.state!=='DEAD'&&validVec(player)){
    const distance=Math.hypot(guardian.x-player.x,guardian.y-player.y,guardian.z-player.z),cooldown=guardian.rage?850:1400;
    if(distance<=2.4&&now-guardian.lastBossAttackAt>=cooldown){
      guardian.lastBossAttackAt=now;
      events.push({type:'PLAYER_HIT',monsterId:guardian.id,encounterId:guardian.encounterId,damage:guardian.rage?12:7,
        phase:guardian.phase,reason:guardian.rage?'BOSS_RAGE_STRIKE':'BOSS_STRIKE',simulationOnly:true});
    }
  }
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
