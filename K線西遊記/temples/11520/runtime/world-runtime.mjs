/*
KGEN_META
VERSION: 1.2.0
REVISION: 2026-09-03.PRODUCT-STANDARD
STATUS: ACTIVE
LAST_UPDATED: 2026-09-03
UPDATED_BY: 界曜 / GPT-5.6 Sol
CHANGE_REASON: Preserve the formal XYZ world runtime while adding backwards-compatible product API aliases for standardized game-5d controls and QA.
SOURCE_OF_TRUTH: TRUE
*/

export const WORLD_RULES = Object.freeze({
  placeId: '11520', settlement: 'KAIOS',
  worldBounds: Object.freeze({ minX:-60,maxX:60,minZ:-60,maxZ:60,minY:0,maxY:40 }),
  playerRadius:.45, meleeRange:2.2, monsterAggroRange:8, monsterAttackRange:1.55,
  monsterAttackCooldownMs:1200, respawnMs:8000,
});

export const WORLD_OBJECTS = Object.freeze([
  { id:'HOME-11520-001', type:'BUILDING', kind:'BUILDING', name:'花果山民宅', x:-7,z:7,radius:2.2,halfX:2.2,halfZ:2.2,lifeId:'LIFE-BUILDING-11520-HOME-001' },
  { id:'ATM-11520-001', type:'ATM', kind:'ATM', name:'行動 ATM 飛碟站', x:8,z:5,radius:1.4,halfX:1.4,halfZ:1.4,lifeId:'LIFE-ATM-11520-001' },
  { id:'SHOP-11520-001', type:'BUILDING', kind:'SHOP', name:'花果山市集', x:13,z:-10,radius:2.8,halfX:2.8,halfZ:2.8,lifeId:'LIFE-BUILDING-11520-SHOP-001' },
]);

export const MONSTER_TEMPLATES = Object.freeze({
  STONE_APE:Object.freeze({species:'STONE_APE',name:'暗影猿',maxHp:120,attack:6,rewardKaios:12,speed:.018}),
  FIRE_WISP:Object.freeze({species:'FIRE_WISP',name:'火靈',maxHp:85,attack:4,rewardKaios:9,speed:.024}),
});

export function createWorldState(now=Date.now()){
  return {monsters:[
    spawnMonster('MON-11520-001','LIFE-MONSTER-11520-001','STONE_APE',6,-8),
    spawnMonster('MON-11520-002','LIFE-MONSTER-11520-002','FIRE_WISP',-13,-5),
    spawnMonster('MON-11520-003','LIFE-MONSTER-11520-003','STONE_APE',18,12),
  ],lastTick:now};
}
function spawnMonster(id,lifeId,key,x,z){const t=MONSTER_TEMPLATES[key];return{id,lifeId,...t,spawnX:x,spawnZ:z,x,y:0,z,hp:t.maxHp,state:'IDLE',lastAttackAt:0,defeatedAt:null}}
export function distance2D(a,b){return Math.hypot((a.x||0)-(b.x||0),(a.z||0)-(b.z||0))}
export function resolvePlayerMove(player,next){const bounded={x:Math.max(WORLD_RULES.worldBounds.minX,Math.min(WORLD_RULES.worldBounds.maxX,Number(next.x)||0)),y:Math.max(WORLD_RULES.worldBounds.minY,Math.min(WORLD_RULES.worldBounds.maxY,Number(next.y)||0)),z:Math.max(WORLD_RULES.worldBounds.minZ,Math.min(WORLD_RULES.worldBounds.maxZ,Number(next.z)||0))};const blocker=WORLD_OBJECTS.find(o=>distance2D(bounded,o)<o.radius+WORLD_RULES.playerRadius)||null;return blocker?{x:player.x,y:player.y,z:player.z,blocked:true,blocker}:{...bounded,blocked:false,blocker:null}}

// Backwards compatible: damage can be a number OR {damage, now}.
export function playerAttack(world,player,damage=24,now=Date.now()){
  if(damage&&typeof damage==='object'){now=Number(damage.now)||Date.now();damage=damage.damage??24}
  const alive=world.monsters.filter(m=>m.state!=='DEAD');const target=alive.sort((a,b)=>distance2D(player,a)-distance2D(player,b))[0]||null;const distance=target?distance2D(player,target):Infinity;
  if(!target||distance>WORLD_RULES.meleeRange)return{world,ok:false,hit:false,defeated:false,killed:false,reason:'OUT_OF_RANGE',rewardKaios:0,target,monster:target,distance};
  target.hp=Math.max(0,target.hp-Math.max(0,Number(damage)||0));target.state=target.hp===0?'DEAD':'AGGRO';
  if(target.hp===0){target.defeatedAt=now;return{world,ok:true,hit:true,defeated:true,killed:true,target,monster:target,distance,rewardKaios:target.rewardKaios}}
  return{world,ok:true,hit:true,defeated:false,killed:false,target,monster:target,distance,rewardKaios:0};
}

// Backwards compatible: now can be a number OR {now}.
export function tickWorld(world,player,now=Date.now()){
  if(now&&typeof now==='object')now=Number(now.now)||Date.now();
  const delta=Math.min(100,Math.max(0,now-(world.lastTick||now))),events=[];
  for(const m of world.monsters){
    if(m.state==='DEAD'){if(m.defeatedAt!==null&&now-m.defeatedAt>=WORLD_RULES.respawnMs){m.x=m.spawnX;m.z=m.spawnZ;m.hp=m.maxHp;m.state='IDLE';m.lastAttackAt=0;m.defeatedAt=null;events.push({type:'RESPAWN',monsterId:m.id,lifeId:m.lifeId})}continue}
    let dist=distance2D(player,m);m.state=dist<=WORLD_RULES.monsterAggroRange?'AGGRO':'IDLE';
    if(m.state==='AGGRO'&&dist>WORLD_RULES.monsterAttackRange){const dx=player.x-m.x,dz=player.z-m.z,len=Math.hypot(dx,dz)||1,step=Math.min(Math.max(0,dist-WORLD_RULES.monsterAttackRange),m.speed*delta);m.x+=dx/len*step;m.z+=dz/len*step;dist=distance2D(player,m)}
    if(dist<=WORLD_RULES.monsterAttackRange&&now-m.lastAttackAt>=WORLD_RULES.monsterAttackCooldownMs){m.lastAttackAt=now;events.push({type:'PLAYER_HIT',monsterId:m.id,lifeId:m.lifeId,damage:m.attack,distance:dist})}
  }
  world.lastTick=now;const playerDamage=events.filter(e=>e.type==='PLAYER_HIT').reduce((s,e)=>s+Number(e.damage||0),0);return{world,events,playerDamage};
}
export function serializeWorld(world){return JSON.parse(JSON.stringify(world))}
