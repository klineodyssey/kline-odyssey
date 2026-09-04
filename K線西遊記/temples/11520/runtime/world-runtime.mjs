/*
KGEN_META
VERSION: 1.4.0
REVISION: 2026-09-04.PLAYABLE-MARKET-LIFE-RELATIONS
STATUS: ACTIVE
LAST_UPDATED: 2026-09-04
UPDATED_BY: 界曜 / GPT-5.6 Sol
CHANGE_REASON: Make KX/KY/KZ Market Life relationships visible and playable without rewriting the game shell.
SOURCE_OF_TRUTH: TRUE
*/

import {createMarketLife,perceiveMarketLife,decideMarketLife,advanceMarketLifeCycle,maybeGrowMarketLife,snapshotMarketLife,remember} from './market-life-runtime.mjs';
import {deriveMarketRelations,animationIntentForRelations} from './market-relation-runtime.mjs';

export const WORLD_RULES = Object.freeze({
  placeId:'11520',settlement:'KAIOS',
  worldBounds:Object.freeze({minX:-60,maxX:60,minZ:-60,maxZ:60,minY:0,maxY:40}),
  playerRadius:.45,meleeRange:2.2,monsterAggroRange:8,monsterAttackRange:1.55,
  monsterAttackCooldownMs:1200,respawnMs:8000,marketLifeDecisionMs:1600,
});

export const WORLD_OBJECTS = Object.freeze([
  {id:'HOME-11520-001',type:'BUILDING',kind:'BUILDING',name:'花果山民宅',x:-7,z:7,radius:2.2,halfX:2.2,halfZ:2.2,lifeId:'LIFE-BUILDING-11520-HOME-001'},
  {id:'ATM-11520-001',type:'ATM',kind:'ATM',name:'行動 ATM 飛碟站',x:8,z:5,radius:1.4,halfX:1.4,halfZ:1.4,lifeId:'LIFE-ATM-11520-001'},
  {id:'SHOP-11520-001',type:'BUILDING',kind:'SHOP',name:'花果山市集',x:13,z:-10,radius:2.8,halfX:2.8,halfZ:2.8,lifeId:'LIFE-BUILDING-11520-SHOP-001'},
]);

export const MONSTER_TEMPLATES = Object.freeze({
  STONE_APE:Object.freeze({species:'STONE_APE',name:'暗影猿',maxHp:120,attack:6,rewardKaios:12,speed:.018,intelligence:1,markets:['BTCUSDT'],capital:80,homeAxis:'KX',initialSide:1}),
  FIRE_WISP:Object.freeze({species:'FIRE_WISP',name:'火靈',maxHp:85,attack:4,rewardKaios:9,speed:.024,intelligence:2,markets:['ETHUSDT'],capital:65,homeAxis:'KY',initialSide:-1}),
  BULL_DEMON:Object.freeze({species:'BULL_DEMON',name:'牛魔王',maxHp:260,attack:12,rewardKaios:30,speed:.014,intelligence:6,markets:['BTCUSDT','ETHUSDT','BNBUSDT'],capital:320,homeAxis:'KX',initialSide:-1}),
});

export function createWorldState(now=Date.now()){
  return {monsters:[
    spawnMonster('MON-11520-001','LIFE-MONSTER-11520-001','STONE_APE',6,-8),
    spawnMonster('MON-11520-002','LIFE-MONSTER-11520-002','FIRE_WISP',-13,-5),
    spawnMonster('MON-11520-003','LIFE-MONSTER-11520-BULL-DEMON-001','BULL_DEMON',18,12),
  ],lastTick:now,lastMarketLifeTick:now};
}

function spawnMonster(id,lifeId,key,x,z){
  const t=MONSTER_TEMPLATES[key];
  const positions={[t.homeAxis]:{market:t.markets[0],side:t.initialSide,lots:key==='BULL_DEMON'?8:2,c:.001}};
  if(key==='BULL_DEMON'){
    positions.KY={market:'ETHUSDT',side:1,lots:5,c:.001};
    positions.KZ={market:'BNBUSDT',side:-1,lots:3,c:.001};
  }
  const marketLife=createMarketLife({lifeId,name:t.name,species:t.species,intelligence:t.intelligence,markets:t.markets,capital:t.capital,vitality:100,fear:key==='BULL_DEMON'?.48:.4,profitDrive:key==='BULL_DEMON'?.82:.65,positions});
  return{id,lifeId,...t,baseName:t.name,spawnX:x,spawnZ:z,x,y:0,z,hp:t.maxHp,state:'IDLE',lastAttackAt:0,defeatedAt:null,marketLife,marketRelation:null,visualMode:'OBSERVE'};
}

export function distance2D(a,b){return Math.hypot((a.x||0)-(b.x||0),(a.z||0)-(b.z||0))}
export function resolvePlayerMove(player,next){const bounded={x:Math.max(WORLD_RULES.worldBounds.minX,Math.min(WORLD_RULES.worldBounds.maxX,Number(next.x)||0)),y:Math.max(WORLD_RULES.worldBounds.minY,Math.min(WORLD_RULES.worldBounds.maxY,Number(next.y)||0)),z:Math.max(WORLD_RULES.worldBounds.minZ,Math.min(WORLD_RULES.worldBounds.maxZ,Number(next.z)||0))};const blocker=WORLD_OBJECTS.find(o=>distance2D(bounded,o)<o.radius+WORLD_RULES.playerRadius)||null;return blocker?{x:player.x,y:player.y,z:player.z,blocked:true,blocker}:{...bounded,blocked:false,blocker:null}}

function sideFromText(v){const s=String(v||'');if(/多|LONG|BUY|\+/.test(s))return 1;if(/空|SHORT|SELL|−|-/.test(s))return-1;return 0}
function readPlayerAxesFromGame(){
  if(typeof document==='undefined')return {};
  const out={};
  for(const axis of ['KX','KY','KZ']){
    const card=document.querySelector(`[data-axis="${axis}"]`);if(!card)continue;
    const pos=card.querySelector('.pos')?.textContent||'';
    const market=card.querySelector('select')?.value?.replace('/','')||null;
    if(!market||/空倉/.test(pos))continue;
    const lots=Number(pos.match(/([\d.]+)口/)?.[1]||0),c=Number(pos.match(/([\d.]+(?:e[-+]?\d+)?)C/i)?.[1]||0);
    out[axis]={market,side:sideFromText(pos),lots,c,pnl:0};
  }
  return out;
}
function readQuotesFromGame(){
  if(typeof document==='undefined')return {};
  const out={};for(const axis of ['KX','KY','KZ']){const card=document.querySelector(`[data-axis="${axis}"]`);if(!card)continue;const market=card.querySelector('select')?.value?.replace('/','');const q=Number((card.querySelector('.q')?.textContent||'').replace(/[$,]/g,''));if(market&&Number.isFinite(q))out[market]=q}return out;
}

function seeded(lifeId,now){let h=2166136261;for(const c of String(lifeId))h=(h^c.charCodeAt(0))*16777619>>>0;h=(h^(Math.floor(now/5000)>>>0))*16777619>>>0;return(h%10000)/10000}
function targetAxisFromPerception(perception){return Object.entries(perception.visiblePlayerAxes||{}).sort((a,b)=>(Math.abs(Number(b[1].lots)||0)-Math.abs(Number(a[1].lots)||0)))[0]?.[0]||null}
function opposite(v){return Number(v)===1?-1:Number(v)===-1?1:0}
function applyDecisionToPositions(life,decision,perception){
  const entries=Object.entries(perception.visiblePlayerAxes||{});const target=targetAxisFromPerception(perception);const p=target?perception.visiblePlayerAxes[target]:null;
  if(decision.action==='RETREAT'){life.positions={};return}
  if(decision.action==='REDUCE'){for(const x of Object.values(life.positions||{}))x.lots=Math.max(1,Math.floor((Number(x.lots)||1)*.5));return}
  if(!target||!p)return;
  if(decision.action==='FOLLOW')life.positions[target]={market:p.market,side:Number(p.side)||1,lots:Math.max(1,Math.round((Number(p.lots)||1)*.7)),c:Number(p.c)||.001};
  else if(decision.action==='OPPOSE')life.positions[target]={market:p.market,side:opposite(p.side)||-1,lots:Math.max(1,Math.round((Number(p.lots)||1)*.8)),c:Number(p.c)||.001};
  else if(decision.action==='HEDGE')life.positions[target]={market:p.market,side:opposite(p.side)||-1,lots:Math.max(1,Math.round((Number(p.lots)||1)*.35)),c:Number(p.c)||.001};
  else if(decision.action==='REALLOCATE'){
    const budget=Math.max(1,Math.round(Math.min(life.capital*.08,(Number(p.lots)||1)*1.25)));
    life.positions[target]={market:p.market,side:seeded(life.lifeId,perception.now)>.48?(Number(p.side)||1):(opposite(p.side)||-1),lots:budget,c:Number(p.c)||.001};
    if(entries.length>1){const [a,x]=entries.find(([a])=>a!==target)||[];if(a&&x)life.positions[a]={market:x.market,side:opposite(x.side)||-1,lots:Math.max(1,Math.round(budget*.45)),c:Number(x.c)||.001}}
  }
}
function relationLabel(r){if(r==='ALIGNED')return'同行';if(r==='OPPOSED')return'對戰';return'中立'}
function sideLabel(v){return Number(v)>0?'+':Number(v)<0?'-':'0'}
function refreshMarketRelation(m,playerAxes){
  const rel=deriveMarketRelations({playerAxes,lifePositions:m.marketLife.positions||{}});m.marketRelation=rel;
  const intent=animationIntentForRelations(rel);m.visualMode=intent.state;
  const axes=['KX','KY','KZ'].map(a=>`${a}${sideLabel(rel.byAxis[a].lifeSide)}${relationLabel(rel.byAxis[a].relation)}`).join(' ');
  m.name=`${m.baseName}｜${axes}｜${m.marketLife.strategy}`;
  return rel;
}

// NUCLEAR-TEST FALLBACK ONLY. Formal Market Life outcome is market-settlement gated.
export function playerAttack(world,player,damage=24,now=Date.now()){
  if(damage&&typeof damage==='object'){now=Number(damage.now)||Date.now();damage=damage.damage??24}
  const alive=world.monsters.filter(m=>m.state!=='DEAD');const target=alive.sort((a,b)=>distance2D(player,a)-distance2D(player,b))[0]||null;const distance=target?distance2D(player,target):Infinity;
  if(!target||distance>WORLD_RULES.meleeRange)return{world,ok:false,hit:false,defeated:false,killed:false,reason:'OUT_OF_RANGE',rewardKaios:0,target,monster:target,distance};
  if(target.marketRelation?.overall==='ALIGNED')return{world,ok:false,hit:false,defeated:false,killed:false,reason:'ALIGNED_COMPANION',rewardKaios:0,target,monster:target,distance};
  target.hp=Math.max(0,target.hp-Math.max(0,Number(damage)||0));target.state=target.hp===0?'DEAD':'AGGRO';target.marketLife.vitality=Math.max(0,target.hp/target.maxHp*100);
  if(target.hp===0){target.defeatedAt=now;target.marketLife.state='DEAD';target.marketLife.lifecycle.diedAt=now;return{world,ok:true,hit:true,defeated:true,killed:true,target,monster:target,distance,rewardKaios:target.rewardKaios}}
  return{world,ok:true,hit:true,defeated:false,killed:false,target,monster:target,distance,rewardKaios:0};
}

export function tickMarketLives(world,{playerAxes={},quotes={},now=Date.now(),random=null,availableMarkets=[]}={}){
  const events=[];
  for(const m of world.monsters){
    advanceMarketLifeCycle(m.marketLife,{now});
    if(['DEAD','NAIHE','MENGPO_RECOVERY'].includes(m.marketLife.state)){events.push({type:'MARKET_LIFE_CYCLE',monsterId:m.id,lifeId:m.lifeId,state:m.marketLife.state});continue}
    const perception=perceiveMarketLife(m.marketLife,{playerAxes,quotes,now});
    const d=decideMarketLife(m.marketLife,perception,{random:random||(()=>seeded(m.lifeId,now))});
    applyDecisionToPositions(m.marketLife,d,perception);remember(m.marketLife,{at:now,type:'DECISION',action:d.action,reason:d.reason,positions:m.marketLife.positions});
    const growth=maybeGrowMarketLife(m.marketLife,{availableMarkets});const rel=refreshMarketRelation(m,playerAxes);
    events.push({type:'MARKET_LIFE_DECISION',monsterId:m.id,lifeId:m.lifeId,name:m.baseName,decision:d,relations:rel,positions:m.marketLife.positions,markets:[...m.marketLife.marketDimensions],grown:growth.grown,unlockedMarket:growth.unlockedMarket||null});
  }
  world.lastMarketLifeTick=now;return{world,events};
}

function moveToward(m,target,delta,stopAt=1.8,mult=1){let dist=distance2D(target,m);if(dist<=stopAt)return dist;const dx=target.x-m.x,dz=target.z-m.z,len=Math.hypot(dx,dz)||1,step=Math.min(Math.max(0,dist-stopAt),m.speed*delta*mult);m.x+=dx/len*step;m.z+=dz/len*step;return distance2D(target,m)}
function companionMove(m,player,delta,index){const angle=(index%3-1)*.65,desired={x:player.x+Math.cos(angle)*2.2,z:player.z+Math.sin(angle)*2.2};moveToward(m,desired,delta,.3,.85);m.state='COMPANION'}
function opposedMove(m,player,delta){m.state='DUEL';moveToward(m,player,delta,WORLD_RULES.monsterAttackRange,1)}
function mixedMove(m,player,delta,index,now){m.state='TENSION';const a=now*.00035+index*2.1,desired={x:player.x+Math.cos(a)*3.2,z:player.z+Math.sin(a)*3.2};moveToward(m,desired,delta,.35,.75)}

export function tickWorld(world,player,now=Date.now()){
  if(now&&typeof now==='object')now=Number(now.now)||Date.now();
  const delta=Math.min(100,Math.max(0,now-(world.lastTick||now))),events=[];
  const playerAxes=readPlayerAxesFromGame();
  if(now-(world.lastMarketLifeTick||0)>=WORLD_RULES.marketLifeDecisionMs){const ml=tickMarketLives(world,{playerAxes,quotes:readQuotesFromGame(),now,availableMarkets:['BTCUSDT','ETHUSDT','BNBUSDT','SOLUSDT','XRPUSDT']});events.push(...ml.events)}
  world.monsters.forEach((m,index)=>{
    if(m.state==='DEAD'){
      advanceMarketLifeCycle(m.marketLife,{now});
      if(m.defeatedAt!==null&&now-m.defeatedAt>=WORLD_RULES.respawnMs){m.x=m.spawnX;m.z=m.spawnZ;m.hp=m.maxHp;m.state='IDLE';m.lastAttackAt=0;m.defeatedAt=null;m.marketLife.vitality=100;if(m.marketLife.state!=='ALIVE')m.marketLife.state='ALIVE';events.push({type:'RESPAWN_TEST_FALLBACK',monsterId:m.id,lifeId:m.lifeId})}
      return;
    }
    const rel=refreshMarketRelation(m,playerAxes);
    if(rel.overall==='ALIGNED'){companionMove(m,player,delta,index);return}
    if(rel.overall==='MIXED'){mixedMove(m,player,delta,index,now);return}
    if(rel.overall==='NEUTRAL'){m.state='OBSERVE';return}
    let dist=distance2D(player,m);if(dist<=WORLD_RULES.monsterAggroRange)dist=opposedMove(m,player,delta);
    else m.state='IDLE';
    if(dist<=WORLD_RULES.monsterAttackRange&&now-m.lastAttackAt>=WORLD_RULES.monsterAttackCooldownMs){m.lastAttackAt=now;events.push({type:'PLAYER_HIT_TEST_FALLBACK',monsterId:m.id,lifeId:m.lifeId,damage:m.attack,distance:dist,relation:'OPPOSED'})}
  });
  world.lastTick=now;const playerDamage=events.filter(e=>e.type==='PLAYER_HIT_TEST_FALLBACK').reduce((s,e)=>s+Number(e.damage||0),0);return{world,events,playerDamage};
}

export function getMarketLifeSnapshot(world){return world.monsters.map(m=>({monsterId:m.id,name:m.baseName,relation:m.marketRelation,visualMode:m.visualMode,life:snapshotMarketLife(m.marketLife)}))}
export function serializeWorld(world){return JSON.parse(JSON.stringify(world))}
