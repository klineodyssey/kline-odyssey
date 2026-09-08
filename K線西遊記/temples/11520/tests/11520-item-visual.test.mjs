import test from 'node:test';
import assert from 'node:assert/strict';
import {itemVisualDescriptor} from '../runtime/item-visual-runtime.mjs';
import {WORLD_ITEM_CONTEXTS,assertSameCanonicalItemIdentity,canonicalWorldItem,cargoItemFromLife} from '../runtime/world-item-visual-runtime.mjs';

test('11520 item visual identity uses distinct 3D shapes for core item families',()=>{
  const cases=[
    [{kind:'TREASURE',name:'火眼晶石',treasureClass:'RARE'},'CRYSTAL'],
    [{kind:'MATERIAL',name:'玄鐵'},'INGOT'],
    [{kind:'FOOD',name:'蟠桃'},'FOOD'],
    [{kind:'MATERIAL',name:'KGEN 貨筒',meta:{cargoKind:'KGEN'}},'KGEN_CYLINDER'],
    [{kind:'MATERIAL',name:'KAIOS 現鈔',meta:{cargoKind:'CASH',unit:'KAIOS'}},'CASH_BUNDLE'],
    [{kind:'LIVING_CARGO',name:'花果山牛',species:'COW',lifeId:'LIFE-COW-1'},'LIFE_CRATE'],
  ];
  const shapes=cases.map(([item,shape])=>{const d=itemVisualDescriptor(item);assert.equal(d.shape,shape);assert.ok(d.label);return d.shape});
  assert.equal(new Set(shapes).size,cases.length,'core item families must remain visually distinguishable');
});

test('living cargo descriptor preserves species identity',()=>{
  const cow=itemVisualDescriptor({kind:'LIVING_CARGO',name:'牛一號',species:'COW'});
  const fish=itemVisualDescriptor({kind:'LIVING_CARGO',name:'魚一號',species:'FISH'});
  assert.equal(cow.label,'COW');assert.equal(fish.label,'FISH');assert.notEqual(cow.label,fish.label);
});

test('one item keeps one canonical 3D identity across ground, backpack, ant cargo and ATM unload',()=>{
  const item={itemId:'KAIOS-CASH-001',kind:'MATERIAL',name:'KAIOS 現鈔',qty:88,meta:{cargoKind:'CASH',unit:'KAIOS'}};
  const proof=assertSameCanonicalItemIdentity(item);
  assert.equal(proof.ok,true);
  assert.deepEqual(proof.states.map(x=>x.context),WORLD_ITEM_CONTEXTS);
  assert.ok(proof.states.every(x=>x.descriptor.shape==='CASH_BUNDLE'));
  assert.equal(new Set(proof.states.map(x=>x.identityKey)).size,1);
});

test('context changes custody/presentation only, never item geometry identity',()=>{
  const item={itemId:'KGEN-CYL-001',kind:'MATERIAL',name:'KGEN 貨筒',meta:{cargoKind:'KGEN'}};
  const ground=canonicalWorldItem(item,'GROUND_DROP');
  const ant=canonicalWorldItem(item,'ANT_CARGO');
  const atm=canonicalWorldItem(item,'ATM_UNLOAD');
  assert.equal(ground.descriptor.shape,'KGEN_CYLINDER');
  assert.equal(ground.identityKey,ant.identityKey);
  assert.equal(ant.identityKey,atm.identityKey);
  assert.notEqual(ground.context,ant.context);
});

test('live Digital Ant cargo derives the same canonical item identity used by the world item runtime',()=>{
  const life={lifeId:'LIFE-DIGITAL-ANT-QA',species:'DIGITAL_ANT',cargo:{cargoId:'CARGO-QA-1',amount:88,unit:'KAIOS'},mission:{status:'IN_TRANSIT'}};
  const item=cargoItemFromLife(life);
  const ant=canonicalWorldItem(item,'ANT_CARGO');
  const atm=canonicalWorldItem(item,'ATM_UNLOAD');
  assert.equal(item.itemId,'CARGO-QA-1');
  assert.equal(ant.descriptor.shape,'CASH_BUNDLE');
  assert.equal(ant.identityKey,atm.identityKey);
});
