import assert from 'node:assert/strict';
import {chaseStep,isHostileMonster,maybeMonsterHit} from '../runtime/monster-aggression-runtime.mjs';
import {createWorldState,applyMarketLifeSourceEvents,tickWorld} from '../runtime/world-runtime.mjs';

const hostile={id:'MON-QA',lifeId:'LIFE-MON-QA',species:'BULL_DEMON',state:'OBSERVE',attack:7,speed:.01,x:4,y:0,z:0,lastAttackAt:0,marketRelation:{byAxis:{KX:{relation:'OPPOSED'}}},marketLife:{world:{position:{x:4,y:0,z:0}}}};
assert.equal(isHostileMonster(hostile),true);
const chase=chaseStep(hostile,{x:0,y:0,z:0},{deltaMs:100,aggroRange:8,attackRange:1.55});
assert.equal(chase.state,'CHASE');
assert.ok(hostile.x<4,'hostile monster must move toward player');
hostile.x=1;hostile.marketLife.world.position={x:1,y:0,z:0};
const hit=maybeMonsterHit(hostile,{x:0,y:0,z:0},2000,{cooldownMs:1200,attackRange:1.55});
assert.equal(hit?.type,'PLAYER_HIT');
assert.equal(hit?.damage,7);
assert.equal(hit?.damageAsset,'KAIOS_HP');
assert.equal(hit?.simulationOnly,true);
assert.equal(maybeMonsterHit(hostile,{x:0,y:0,z:0},2500,{cooldownMs:1200,attackRange:1.55}),null,'cooldown must suppress repeat hit');

const ant={...hostile,species:'DIGITAL_ANT',lastAttackAt:0};
assert.equal(isHostileMonster(ant),false,'Digital Ant is not a hostile monster merely because attack is nonzero');

const world=createWorldState(0);
applyMarketLifeSourceEvents(world,[{type:'SPAWN',sourceId:'QA-MONSTER',lifeId:'LIFE-QA-BULL-ATTACK',name:'QA 牛魔王',species:'BULL_DEMON',intelligence:4,markets:['BTCUSDT'],capital:1,vitality:100,maxHp:100,attack:7,rewardKaios:0,speed:.01,positions:{KX:{market:'BTCUSDT',side:-1,lots:1,c:.001}},x:1,y:0,z:0}]);
const monster=world.monsters.find(m=>m.lifeId==='LIFE-QA-BULL-ATTACK');
monster.marketRelation={byAxis:{KX:{relation:'OPPOSED',lifeSide:-1,playerSide:1},KY:{relation:'NEUTRAL'},KZ:{relation:'NEUTRAL'}}};
const r=tickWorld(world,{x:0,y:0,z:0},2000);
const worldHit=r.events.find(e=>e.type==='PLAYER_HIT');
assert.ok(worldHit,'tickWorld must emit PLAYER_HIT when hostile monster is inside attack range');
assert.equal(worldHit.damage,7);
assert.equal(worldHit.damageAsset,'KAIOS_HP');
assert.equal(r.playerDamage,7);
assert.equal(monster.state,'ATTACK');
assert.equal(monster.visualMode,'ATTACK');

console.log('11520 monster aggression PASS: hostile monsters chase/attack with cooldown; Digital Ant remains non-hostile; damage is simulation-only KAIOS_HP');
