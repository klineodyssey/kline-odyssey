import test from 'node:test';
import assert from 'node:assert/strict';
import {lifePresentationState} from '../runtime/life-visual-runtime.mjs';
import {canonicalWorldItem,cargoItemFromLife} from '../runtime/world-item-visual-runtime.mjs';

test('Digital Ant in transit visibly carries cargo and works',()=>{
  const life={lifeId:'ANT-1',species:'DIGITAL_ANT',state:'OBSERVE',cargo:{cargoId:'CASH-1',amount:18,unit:'KAIOS'},mission:{status:'IN_TRANSIT'},marketLife:{lifestyle:{action:'WORK'}}};
  const p=lifePresentationState(life);
  const item=cargoItemFromLife(life),world=canonicalWorldItem(item,'ANT_CARGO');
  assert.equal(p.isAnt,true);assert.equal(p.working,true);assert.equal(p.carrying,true);assert.equal(p.waitingReceipt,false);assert.ok(p.scale>1);
  assert.equal(world.descriptor.shape,'CASH_BUNDLE');assert.equal(world.custody.custodyType,'ARMORED_CASH_CASE');
});

test('Digital Ant waiting for receipt changes custody to ATM cassette without changing cash identity',()=>{
  const transitLife={lifeId:'ANT-1',species:'DIGITAL_ANT',cargo:{cargoId:'CASH-1',amount:18,unit:'KAIOS'},mission:{status:'IN_TRANSIT'},marketLife:{lifestyle:{action:'WORK'}}};
  const waitingLife={...transitLife,mission:{status:'ARRIVED_AWAITING_RECEIPT'}};
  const p=lifePresentationState(waitingLife);
  const item=cargoItemFromLife(transitLife),ant=canonicalWorldItem(item,'ANT_CARGO'),atm=canonicalWorldItem(item,'ATM_UNLOAD');
  assert.equal(p.carrying,true);assert.equal(p.waitingReceipt,true);
  assert.equal(ant.identityKey,atm.identityKey);
  assert.equal(ant.custody.custodyType,'ARMORED_CASH_CASE');assert.equal(atm.custody.custodyType,'ATM_CASSETTE');
});

test('Market Life travel, rest and retirement are distinguishable',()=>{
  const travel=lifePresentationState({species:'BULL_DEMON',marketLife:{lifestyle:{action:'EXPLORE'}}});
  const rest=lifePresentationState({species:'BULL_DEMON',marketLife:{lifestyle:{action:'REST'}}});
  const retire=lifePresentationState({species:'BULL_DEMON',marketLife:{lifestyle:{action:'RETIRE'}}});
  assert.equal(travel.traveling,true);assert.ok(travel.pitch>0);
  assert.equal(rest.resting,true);assert.ok(rest.scale<1);
  assert.equal(retire.retired,true);assert.ok(retire.scale<1);
});

test('all canonical monsters and wild ecology species map to recognizable 3D archetypes',()=>{
  const expected={
    DIGITAL_ANT:'ANT',BULL_DEMON:'BULL_DEMON',STONE_APE:'APE',FIRE_WISP:'WISP',
    FISH:'FISH',SHRIMP:'SHRIMP',COW:'COW',SHEEP:'SHEEP',CHICKEN:'CHICKEN',DUCK:'DUCK',TREE:'TREE',FLOWER:'FLOWER'
  };
  for(const [species,archetype] of Object.entries(expected))assert.equal(creatureArchetypeForSpecies(species),archetype,`${species} must keep a dedicated silhouette`);
  assert.equal(new Set(Object.values(expected)).size,12,'canonical creature families must not collapse into one generic body');
});

test('runtime sync preserves the archetype-specific silhouette scale',()=>{
  const root={
    userData:{baseScale:.75,archetypeScale:1.18},
    visible:true,
    position:{set(){}},
    scale:{value:0,setScalar(value){this.value=value}},
    rotation:{x:0},
    getObjectByName(){return null},
  };
  syncLifeVisual(root,{species:'BULL_DEMON',state:'OBSERVE',x:1,y:0,z:2,marketLife:{lifestyle:{action:'WORK'}}});
  assert.ok(Math.abs(root.scale.value-(.75*1.18*1.03))<1e-12,'per-frame sync must retain Bull Demon silhouette scale');
});
