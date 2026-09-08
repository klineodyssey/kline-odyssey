import test from 'node:test';
import assert from 'node:assert/strict';
import {itemVisualDescriptor} from '../runtime/item-visual-runtime.mjs';

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
