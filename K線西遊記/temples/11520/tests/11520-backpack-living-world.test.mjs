import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackpack,backpackSnapshot} from '../runtime/backpack-runtime.mjs';
import {createWildEcology} from '../runtime/wild-ecology-source-runtime.mjs';
import {captureLifeToBackpack,releaseLifeFromBackpack,collectTreasureToBackpack,nearestCollectableLife} from '../runtime/living-world-inventory-runtime.mjs';

test('wild life can be captured into backpack and released to land with same LIFE_ID',()=>{
  const ecology=createWildEcology();
  const backpack=createBackpack({capacitySlots:24,capacityWeight:120});
  const life=ecology.lives.find(v=>v.species==='COW');
  const lifeId=life.lifeId;
  const captured=captureLifeToBackpack({ecology,backpack,lifeId,weightEach:8});
  assert.equal(captured.ok,true);
  assert.equal(life.state,'IN_BACKPACK');
  assert.equal(backpack.items[0].lifeId,lifeId);
  const released=releaseLifeFromBackpack({ecology,backpack,itemId:backpack.items[0].itemId,landId:'LAND-PLAYER-001',x:7,z:-4});
  assert.equal(released.ok,true);
  assert.equal(life.lifeId,lifeId);
  assert.equal(life.state,'PLAYER_OWNED');
  assert.equal(life.ownerLandId,'LAND-PLAYER-001');
  assert.equal(life.x,7);
  assert.equal(life.z,-4);
  assert.equal(backpack.items.length,0);
});

test('capture rolls life state back when backpack is overweight',()=>{
  const ecology=createWildEcology();
  const backpack=createBackpack({capacitySlots:2,capacityWeight:1});
  const life=ecology.lives.find(v=>v.species==='COW');
  const before={state:life.state,ownerLandId:life.ownerLandId};
  const result=captureLifeToBackpack({ecology,backpack,lifeId:life.lifeId,weightEach:8});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'BACKPACK_OVERWEIGHT');
  assert.equal(result.rolledBack,true);
  assert.deepEqual({state:life.state,ownerLandId:life.ownerLandId},before);
});

test('treasure stacks while living cargo occupies individual slots',()=>{
  const backpack=createBackpack();
  assert.equal(collectTreasureToBackpack({backpack,treasure:{name:'定海神針碎片',qty:2,weightEach:.1}}).ok,true);
  assert.equal(collectTreasureToBackpack({backpack,treasure:{name:'定海神針碎片',qty:3,weightEach:.1}}).ok,true);
  const snap=backpackSnapshot(backpack);
  assert.equal(snap.usedSlots,1);
  assert.equal(snap.items[0].qty,5);
});

test('nearest collectable life can be discovered by player XZ position',()=>{
  const ecology=createWildEcology();
  const target=ecology.lives.find(v=>v.species==='DUCK');
  const result=nearestCollectableLife(ecology,{x:target.x,z:target.z,maxDistance:.1});
  assert.equal(result.ok,true);
  assert.equal(result.life.lifeId,target.lifeId);
});
