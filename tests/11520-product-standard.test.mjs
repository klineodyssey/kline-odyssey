import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {requiredMargin,pnlForMove,positionRisk,maxAdversePoints} from '../K線西遊記/temples/11520/runtime/kgen-margin-runtime.mjs';
import {createWorldState,playerAttack,tickWorld,WORLD_RULES} from '../K線西遊記/temples/11520/runtime/world-runtime.mjs';

// KGEN canonical math.
assert.equal(requiredMargin({lots:1}),1);
assert.equal(requiredMargin({lots:100}),100);
assert.equal(pnlForMove({entry:100,mark:99,side:'多',lots:100,c:1}),-100);
assert.equal(maxAdversePoints(1),1);
assert.equal(maxAdversePoints(.001),1000);
const r=positionRisk({entry:100,mark:99,side:'多',lots:100,c:1});
assert.equal(r.principal,100);
assert.equal(r.pnl,-100);
assert.equal(r.remaining,0);
assert.equal(r.liquidated,true);

// World runtime backwards-compatible product API + kill gated reward + deterministic respawn.
const world=createWorldState(1000);
const player={x:world.monsters[0].x,y:0,z:world.monsters[0].z};
const hit=playerAttack(world,player,{damage:999,now:2000});
assert.equal(hit.ok,true);
assert.equal(hit.killed,true);
assert.equal(hit.monster.lifeId,'LIFE-MONSTER-11520-001');
assert.ok(hit.rewardKaios>0);
assert.equal(world.monsters[0].state,'DEAD');
const respawn=tickWorld(world,player,{now:2000+WORLD_RULES.respawnMs});
assert.equal(world.monsters[0].state,'IDLE');
assert.ok(respawn.events.some(e=>e.type==='RESPAWN'));

// Static product regression locks.
const here=path.dirname(fileURLToPath(import.meta.url));
const html=fs.readFileSync(path.join(here,'../K線西遊記/temples/11520/game-5d.html'),'utf8');
for(const marker of [
  'Knight.glb','GLTFLoader','AnimationMixer','內圈 XZ 移動','外圈旋轉',
  'walletConnect','KGEN verified','KX','KY','KZ','orderFire','confirmOrder',
  '主城世界','K場交易','持倉','委託','歷史','資產','統計','市場','背包','角色','世界地圖','ATM','設定','客服/說明'
]) assert.ok(html.includes(marker),`missing product marker: ${marker}`);
assert.ok(!html.includes('margin = lots / leverage'));
assert.ok(!html.includes('margin = lots / C'));

console.log('11520 standardized product invariants PASS');
