import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackpack,backpackSnapshot} from '../runtime/backpack-runtime.mjs';
import {createWildEcology} from '../runtime/wild-ecology-source-runtime.mjs';
import {captureLifeToBackpack,releaseLifeFromBackpack,collectTreasureToBackpack,nearestCollectableLife} from '../runtime/living-world-inventory-runtime.mjs';
import {captureNearestLife,releaseItem} from '../runtime/living-world-browser-bridge.mjs';
import {gameUnitsToK} from '../runtime/spatial-coordinate-runtime.mjs';

test('browser capture uses local-meter authority, never converted K HUD text',()=>{
  const before={coords:globalThis.__K11520_WORLD_COORDS__,document:globalThis.document,backpack:globalThis.K11520Backpack};
  try{
    globalThis.document={getElementById:()=>({textContent:'LOCAL X 0.0001K · Y 0K · Z 0.0002K'})};
    delete globalThis.__K11520_WORLD_COORDS__;
    assert.equal(captureNearestLife().reason,'LOCAL_POSITION_NOT_READY');
    globalThis.K11520Backpack={get:()=>({items:[{itemId:'test',kind:'LIVING_CARGO',lifeId:'TEST'}]})};
    assert.equal(releaseItem('test').reason,'LOCAL_POSITION_NOT_READY');
    const api=globalThis.K11520LivingWorldInventory;
    const life=[...api.registry.values()].find(v=>v.active&&v.collectable);
    assert.ok(life);
    globalThis.__K11520_WORLD_COORDS__={physical:{x:life.x,y:life.y||0,z:life.z}};
    const nearest=api.nearest();
    assert.equal(nearest.ok,true);assert.equal(nearest.distance,0);
    assert.equal(nearest.distanceK,0);assert.equal(nearest.rangeK,gameUnitsToK(3.2));
    globalThis.__K11520_WORLD_COORDS__.physical.x=NaN;
    assert.equal(api.nearest().reason,'LOCAL_POSITION_NOT_READY');
  }finally{
    for(const [name,value] of [['__K11520_WORLD_COORDS__',before.coords],['document',before.document],['K11520Backpack',before.backpack]]){
      if(value===undefined)delete globalThis[name];else globalThis[name]=value;
    }
  }
});

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
