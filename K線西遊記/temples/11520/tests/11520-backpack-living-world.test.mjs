import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackpack,backpackSnapshot,restoreBackpack,storeItem,removeItem,BACKPACK_REWARD_RECEIPT_LIMIT} from '../runtime/backpack-runtime.mjs';
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

const reward=(id)=>({...material(id,'取經碎片'),rewardId:id,meta:{scope:'LOCAL_GAME_ONLY',rarity:'COMMON'}});
test('reward receipts survive stack merge, reload and item discard without a second inventory ledger',()=>{
  const bag=createBackpack({ownerId:LOCAL_OWNER});
  assert.equal(storeItem(bag,reward('kill:1:loot')).ok,true);
  assert.equal(storeItem(bag,reward('kill:2:loot')).ok,true);
  assert.equal(bag.items.length,1);assert.equal(bag.items[0].qty,2);
  assert.deepEqual(bag.rewardReceipts,['kill:1:loot','kill:2:loot']);
  assert.equal(storeItem(bag,reward('kill:2:loot')).reason,'REWARD_ALREADY_CLAIMED');
  const restored=restoreBackpack(JSON.parse(JSON.stringify(bag)),LOCAL_OWNER);
  assert.deepEqual(restored.rewardReceipts,bag.rewardReceipts);
  assert.equal(removeItem(restored,restored.items[0].itemId,2).ok,true);assert.equal(restored.items.length,0);
  for(const id of bag.rewardReceipts)assert.equal(storeItem(restored,reward(id)).reason,'REWARD_ALREADY_CLAIMED');
  assert.equal(storeItem(restored,reward('kill:3:loot')).ok,true);
  const second=restoreBackpack(restored,LOCAL_OWNER);assert.equal(second.rewardReceipts.length,3);
});

test('inventory receipt migration is compatible, bounded and fails closed without evicting replay protection',()=>{
  const legacy=savedBackpack([material('legacy')]);delete legacy.rewardReceipts;
  assert.deepEqual(restoreBackpack(legacy,LOCAL_OWNER).rewardReceipts,[]);
  for(const receipts of [null,{},['x','x'],[''],['<x>'],Array.from({length:10001},(_,i)=>'r'+i)]){
    // Missing legacy property is allowed; explicit null or malformed receipts are not.
    assert.throws(()=>restoreBackpack({...legacy,rewardReceipts:receipts},LOCAL_OWNER),/INVALID_REWARD_RECEIPTS/);
  }
  const full=createBackpack({ownerId:LOCAL_OWNER});full.rewardReceipts=Array.from({length:BACKPACK_REWARD_RECEIPT_LIMIT},(_,i)=>'reward:'+i);
  const before=JSON.stringify(full);assert.equal(storeItem(full,reward('new')).reason,'REWARD_RECEIPT_LIMIT');assert.equal(JSON.stringify(full),before);
  assert.equal(storeItem(full,reward('reward:0')).reason,'REWARD_ALREADY_CLAIMED');
  const overweight=createBackpack({ownerId:LOCAL_OWNER,capacityWeight:.1});assert.equal(storeItem(overweight,reward('failed')).reason,'BACKPACK_OVERWEIGHT');assert.deepEqual(overweight.rewardReceipts,[]);
});

test('backpack UI distinguishes persisted, session-only, corrupt and cross-player results',async()=>{
  const previous={storage:Object.getOwnPropertyDescriptor(globalThis,'localStorage'),life:globalThis.__K11520_PLAYER_LIFE__,api:globalThis.K11520Backpack};
  const data=new Map(),key=p=>`k11520.player:${p}:11520.backpack.v1`;let failWrites=false;
  const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>{if(failWrites)throw Error('QUOTA_EXCEEDED');data.set(k,v)},removeItem:k=>data.delete(k)};
  let active=LOCAL_OWNER,persistent=true;
  globalThis.__K11520_PLAYER_LIFE__={snapshot:()=>({player:{playerId:active},persistent})};
  Object.defineProperty(globalThis,'localStorage',{configurable:true,value:storage});
  try{
    const ui=await import('../runtime/backpack-ui.mjs?inventory-receipt-test');
    const saved=ui.addBackpackItem(reward('saved'));assert.equal(saved.ok,true);assert.equal(saved.persistent,true);assert.equal(saved.storageStatus,'READY');
    failWrites=true;const session=ui.addBackpackItem(reward('session'));assert.equal(session.ok,true);assert.equal(session.persistent,false);assert.equal(session.storageStatus,'SESSION_ONLY');
    assert.equal(JSON.parse(data.get(key(active))).items[0].qty,1,'failed write cannot be reported durable');
    assert.equal(ui.addBackpackItem(reward('session')).reason,'REWARD_ALREADY_CLAIMED');
    const second='KAIOS-P-'+'b'.repeat(32);active=second;persistent=false;
    assert.equal(ui.getBackpack().items.length,0);assert.equal(ui.getBackpack().rewardReceipts.length,0);
    assert.equal(ui.addBackpackItem(reward('saved')).ok,true,'different player has an isolated receipt namespace');
    assert.equal(ui.getBackpack().persistent,false);
    failWrites=false;persistent=true;active='KAIOS-P-'+'c'.repeat(32);data.set(key(active),'{corrupt');
    const corrupt=ui.addBackpackItem(reward('never'));assert.equal(corrupt.ok,false);assert.equal(corrupt.reason,'CORRUPT_SAVE');assert.equal(corrupt.persistent,false);
    assert.equal(ui.getBackpack().items.length,0);assert.equal(data.get(key(active)),'{corrupt','preserve corrupt original, do not overwrite');
  }finally{
    if(previous.storage)Object.defineProperty(globalThis,'localStorage',previous.storage);else delete globalThis.localStorage;
    for(const [k,v] of [['__K11520_PLAYER_LIFE__',previous.life],['K11520Backpack',previous.api]]){if(v===undefined)delete globalThis[k];else globalThis[k]=v}
  }
});
