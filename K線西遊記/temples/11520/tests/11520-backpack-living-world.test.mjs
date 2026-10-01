import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackpack,backpackSnapshot,restoreBackpack,storeItem} from '../runtime/backpack-runtime.mjs';
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

const LOCAL_OWNER='KAIOS-P-'+'a'.repeat(32);
function savedBackpack(items=[]){return {...createBackpack({ownerId:LOCAL_OWNER}),items}}
const material=(itemId,name='wood')=>({itemId,kind:'MATERIAL',name,qty:1,weightEach:1,stackable:true});

test('backpack restore accepts same owner and isolates returned storage object',()=>{
  const value=savedBackpack([material('item-1')]),original=JSON.stringify(value);
  const restored=restoreBackpack(value,LOCAL_OWNER);restored.items[0].qty=2;
  assert.equal(JSON.stringify(value),original);assert.equal(restored.ownerId,LOCAL_OWNER);
  assert.throws(()=>restoreBackpack(value,'KAIOS-P-'+'b'.repeat(32)),/INVALID_BACKPACK_OWNER/);
});
test('backpack restore rejects duplicate item IDs and duplicate LIFE_ID',()=>{
  assert.throws(()=>restoreBackpack(savedBackpack([material('same'),material('same','stone')]),LOCAL_OWNER),/DUPLICATE/);
  const cow=id=>({itemId:id,kind:'LIVING_CARGO',species:'COW',lifeId:'COW-ONE',qty:1,weightEach:8});
  assert.throws(()=>restoreBackpack(savedBackpack([cow('cow-a'),cow('cow-b')]),LOCAL_OWNER),/DUPLICATE/);
});
test('backpack duplicate IDs cannot hide behind a merged stack during restore',()=>{
  // id-b is merged into id-a before the third item; original input IDs must
  // still be remembered for duplicate rejection.
  assert.throws(()=>restoreBackpack(savedBackpack([material('id-a'),material('id-b'),material('id-b','stone')]),LOCAL_OWNER),/DUPLICATE/);
});
test('backpack restore rejects non-finite, negative and over-limit quantities/weight',()=>{
  for(const qty of [0,-1,1.5,Infinity,NaN,1000001])assert.throws(()=>restoreBackpack(savedBackpack([{...material('bad'),qty}]),LOCAL_OWNER));
  for(const weightEach of [NaN,Infinity,-1])assert.throws(()=>restoreBackpack(savedBackpack([{...material('bad'),weightEach}]),LOCAL_OWNER));
  assert.throws(()=>restoreBackpack(savedBackpack([{...material('heavy'),weightEach:121}]),LOCAL_OWNER),/OVERWEIGHT/);
  assert.throws(()=>restoreBackpack(savedBackpack(Array.from({length:25},(_,i)=>material('slot-'+i))),LOCAL_OWNER),/INVALID_BACKPACK/);
});
test('restore requires stable item identity, living species and LIFE_ID',()=>{
  for(const item of [{kind:'MATERIAL',qty:1,weightEach:1},{...material('a'),itemId:''},{itemId:'cow',kind:'LIVING_CARGO',species:'COW',qty:1,weightEach:8},{itemId:'cow',kind:'LIVING_CARGO',lifeId:'cow-1',qty:1,weightEach:8}])assert.throws(()=>restoreBackpack(savedBackpack([item]),LOCAL_OWNER));
});
test('duplicate runtime insertion does not mutate valid backpack',()=>{
  const bag=createBackpack({ownerId:LOCAL_OWNER});storeItem(bag,material('id'));
  const before=JSON.stringify(bag);assert.equal(storeItem(bag,material('id')).reason,'DUPLICATE_ITEM');assert.equal(JSON.stringify(bag),before);
});
