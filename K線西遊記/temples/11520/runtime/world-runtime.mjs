/*
KGEN_META
VERSION: 1.5.0
REVISION: 2026-09-04.SOURCE-DRIVEN-MARKET-LIFE
STATUS: ACTIVE
LAST_UPDATED: 2026-09-04
UPDATED_BY: 界曜 / GPT-5.6 Sol
CHANGE_REASON: Replace formal fixed monster spawning with pluggable Exchange Brain / Digital Ant Market Life source slots.
SOURCE_OF_TRUTH: TRUE
*/

import {createMarketLife,perceiveMarketLife,decideMarketLife,advanceMarketLifeCycle,maybeGrowMarketLife,snapshotMarketLife,remember} from './market-life-runtime.mjs';
import {deriveMarketRelations,animationIntentForRelations} from './market-relation-runtime.mjs';
import {drainMarketLifeSourceEvents,installMarketLifeSourceListeners} from './market-life-source-runtime.mjs';

export const WORLD_RULES=Object.freeze({
  placeId:'11520',settlement:'KAIOS',
  worldBounds:Object.freeze({minX:-60,maxX:60,minZ:-60,maxZ:60,minY:0,maxY:40}),
  playerRadius:.45,meleeRange:2.2,monsterAggroRange:8,monsterAttackRange:1.55,
  monsterAttackCooldownMs:1200,respawnMs:8000,marketLifeDecisionMs:1600,sourceSlots:24,
});

export const WORLD_OBJECTS=Object.freeze([
  {id:'HOME-11520-001',type:'BUILDING',kind:'BUILDING',name:'花果山民宅',x:-7,z:7,radius:2.2,halfX:2.2,halfZ:2.2,lifeId:'LIFE-BUILDING-11520-HOME-001'},
  {id:'ATM-11520-001',type:'ATM',kind:'ATM',name:'行動 ATM 飛碟站',x:8,z:5,radius:1.4,halfX:1.4,halfZ:1.4,lifeId:'LIFE-ATM-11520-001'},
  {id:'SHOP-11520-001',type:'BUILDING',kind:'SHOP',name:'花果山市集',x:13,z:-10,radius:2.8,halfX:2.8,halfZ:2.8,lifeId:'LIFE-BUILDING-11520-SHOP-001'},
]);

export const MONSTER_TEMPLATES=Object.freeze({
  STONE_APE:Object.freeze({species:'STONE_APE',name:'暗影猿',maxHp:120,attack:6,rewardKaios:12,speed:.018,intelligence:1,markets:['BTCUSDT'],capital:80,homeAxis:'KX',initialSide:1}),
  FIRE_WISP:Object.freeze({species:'FIRE_WISP',name:'火靈',maxHp:85,attack:4,rewardKaios:9,speed:.024,intelligence:2,markets:['ETHUSDT'],capital:65,homeAxis:'KY',initialSide:-1}),
  BULL_DEMON:Object.freeze({species:'BULL_DEMON',name:'牛魔王',maxHp:260,attack:12,rewardKaios:30,speed:.014,intelligence:6,markets:['BTCUSDT','ETHUSDT','BNBUSDT'],capital:320,homeAxis:'KX',initialSide:-1}),
});

function inactiveSlot(index){
  const lifeId=`LIFE-SOURCE-SLOT-11520-${String(index+1).padStart(3,'0')}`;
  const marketLife=createMarketLife({lifeId,name:'INACTIVE SOURCE SLOT',species:'SOURCE_SLOT',intelligence:1,markets:[],capital:0,vitality:0,positions:{}});
  return {id:`MON-SOURCE-SLOT-${String(index+1).padStart(3,'0')}`,lifeId,sourceLifeId:null,sourceId:null,sourceManaged:false,sourceMeta:null,
    species:'SOURCE_SLOT',name:'',baseName:'',maxHp:100,attack:0,rewardKaios:0,speed:0,intelligence:1,markets:[],capital:0,
    spawnX:0,spawnZ:0,x:0,y:0,z:0,hp:0,state:'DEAD',lastAttackAt:0,defeatedAt:null,marketLife,marketRelation:null,visualMode:'HIDDEN',mission:null,cargo:null,route:null};
}

export function createWorldState(now=Date.now()){
  installMarketLifeSourceListeners();
  const world={monsters:Array.from({length:WORLD_RULES.sourceSlots},(_,i)=>inactiveSlot(i)),lastTick:now,lastMarketLifeTick:now,sourceEvents:[]};
  applyMarketLifeSourceEvents(world,drainMarketLifeSourceEvents());
  return world;
}

function resetSlot(slot){
  const idx=Number(slot.id.match(/(\d+)$/)?.[1]||1)-1;
  Object.assign(slot,inactiveSlot(Math.max(0,idx)));
  return slot;
}

function findSourceSlot(world,lifeId){return world.monsters.find(m=>m.sourceManaged&&m.sourceLifeId===lifeId)||null}
function freeSourceSlot(world){return world.monsters.find(m=>!m.sourceManaged&&m.state==='DEAD')||null}

function hydrateSourceSlot(slot,event){
  const ml=createMarketLife({lifeId:event.lifeId,name:event.name,species:event.species,intelligence:event.intelligence,markets:event.markets,capital:event.capital,vitality:event.vitality,positions:event.positions||{},fear:.4,profitDrive:.65});
  ml.strategy=event.strategy||'SOURCE_DRIVEN';
  Object.assign(slot,{lifeId:event.lifeId,sourceLifeId:event.lifeId,sourceId:event.sourceId,sourceManaged:true,sourceMeta:event.meta||{},species:event.species,name:event.name,baseName:event.name,
    maxHp:event.maxHp,attack:event.attack,rewardKaios:event.rewardKaios,speed:event.speed,intelligence:event.intelligence,markets:[...(event.markets||[])],capital:event.capital,
    spawnX:event.x,spawnZ:event.z,x:event.x,y:event.y,z:event.z,hp:Math.max(0,event.maxHp*(event.vitality/100)),state:'OBSERVE',lastAttackAt:0,defeatedAt:null,
    marketLife:ml,marketRelation:null,visualMode:'OBSERVE',mission:event.mission||null,cargo:event.cargo||null,route:event.route||null});
  return slot;
}

function updateSourceSlot(slot,event){
  slot.name=event.name||slot.name;slot.baseName=event.name||slot.baseName;slot.species=event.species||slot.species;slot.x=event.x;slot.y=event.y;slot.z=event.z;
  slot.maxHp=event.maxHp||slot.maxHp;slot.attack=event.attack;slot.speed=event.speed;slot.rewardKaios=event.rewardKaios;slot.intelligence=event.intelligence;
  slot.hp=Math.max(0,slot.maxHp*(event.vitality/100));slot.state=event.vitality<=0?'DEAD':'OBSERVE';slot.mission=event.mission||slot.mission;slot.cargo=event.cargo||slot.cargo;slot.route=event.route||slot.route;slot.sourceMeta=event.meta||slot.sourceMeta;
  slot.marketLife.name=slot.baseName;slot.marketLife.species=slot.species;slot.marketLife.intelligence=slot.intelligence;slot.marketLife.capital=event.capital;slot.marketLife.vitality=event.vitality;slot.marketLife.positions=structuredClone(event.positions||{});slot.marketLife.strategy=event.strategy||slot.marketLife.strategy;
  for(const m of event.markets||[])slot.marketLife.marketDimensions.add(m);
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
function refreshMarketRelation(m,playerAxes){const rel=deriveMarketRelations({playerAxes,lifePositions:m.marketLife.positions||{}});m.marketRelation=rel;const intent=animationIntentForRelations(rel);m.visualMode=intent.state;const axes=['KX','KY','KZ'].map(a=>`${a}${sideLabel(rel.byAxis[a].lifeSide)}${relationLabel(rel.byAxis[a].relation)}`).join(' ');m.name=`${m.baseName}｜${axes}｜${m.marketLife.strategy}`;return rel}

// NUCLEAR-TEST FALLBACK ONLY. Source-managed Market Life requires source/market settlement.
export function playerAttack(world,player,damage=24,now=Date.now()){
  if(damage&&typeof damage==='object'){now=Number(damage.now)||Date.now();damage=damage.damage??24}
  const alive=world.monsters.filter(m=>m.state!=='DEAD'&&m.sourceManaged),target=alive.sort((a,b)=>distance2D(player,a)-distance2D(player,b))[0]||null,distance=target?distance2D(player,target):Infinity;
  if(!target||distance>WORLD_RULES.meleeRange)return{world,ok:false,hit:false,defeated:false,killed:false,reason:'OUT_OF_RANGE',rewardKaios:0,target,monster:target,distance};
  if(target.sourceManaged)return{world,ok:false,hit:false,defeated:false,killed:false,reason:'SOURCE_SETTLEMENT_REQUIRED',rewardKaios:0,target,monster:target,distance};
  return{world,ok:false,hit:false,defeated:false,killed:false,reason:'FORMAL_MARKET_SETTLEMENT_REQUIRED',rewardKaios:0,target,monster:target,distance};
}

export function tickMarketLives(world,{playerAxes={},quotes={},now=Date.now(),random=null,availableMarkets=[]}={}){
  const events=[];
  for(const m of world.monsters){
    if(!m.sourceManaged||m.state==='DEAD')continue;
    if(m.sourceManaged){const rel=refreshMarketRelation(m,playerAxes);events.push({type:'SOURCE_MANAGED_MARKET_LIFE',monsterId:m.id,lifeId:m.lifeId,sourceId:m.sourceId,relations:rel,positions:m.marketLife.positions,strategy:m.marketLife.strategy});continue}
    advanceMarketLifeCycle(m.marketLife,{now});
    const perception=perceiveMarketLife(m.marketLife,{playerAxes,quotes,now}),d=decideMarketLife(m.marketLife,perception,{random:random||(()=>seeded(m.lifeId,now))});
    applyDecisionToPositions(m.marketLife,d,perception);remember(m.marketLife,{at:now,type:'DECISION',action:d.action,reason:d.reason,positions:m.marketLife.positions});const growth=maybeGrowMarketLife(m.marketLife,{availableMarkets}),rel=refreshMarketRelation(m,playerAxes);
    events.push({type:'MARKET_LIFE_DECISION',monsterId:m.id,lifeId:m.lifeId,name:m.baseName,decision:d,relations:rel,positions:m.marketLife.positions,markets:[...m.marketLife.marketDimensions],grown:growth.grown,unlockedMarket:growth.unlockedMarket||null});
  }
  world.lastMarketLifeTick=now;return{world,events};
}

export function tickWorld(world,player,now=Date.now()){
  if(now&&typeof now==='object')now=Number(now.now)||Date.now();
  const events=[];events.push(...applyMarketLifeSourceEvents(world,drainMarketLifeSourceEvents()));const playerAxes=readPlayerAxesFromGame();
  if(now-(world.lastMarketLifeTick||0)>=WORLD_RULES.marketLifeDecisionMs){const ml=tickMarketLives(world,{playerAxes,quotes:readQuotesFromGame(),now,availableMarkets:['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT']});events.push(...ml.events)}
  for(const m of world.monsters){if(!m.sourceManaged||m.state==='DEAD')continue;refreshMarketRelation(m,playerAxes)}
  world.lastTick=now;return{world,events,playerDamage:0};
}

export function getMarketLifeSnapshot(world){return world.monsters.filter(m=>m.sourceManaged).map(m=>({monsterId:m.id,name:m.baseName,sourceId:m.sourceId,relation:m.marketRelation,visualMode:m.visualMode,mission:m.mission,cargo:m.cargo,route:m.route,life:snapshotMarketLife(m.marketLife)}))}
export function serializeWorld(world){return JSON.parse(JSON.stringify(world))}
