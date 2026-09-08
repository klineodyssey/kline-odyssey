import test from 'node:test';
import assert from 'node:assert/strict';
import {creatureArchetypeForSpecies,lifePresentationState} from '../runtime/life-visual-runtime.mjs';

test('Digital Ant in transit visibly carries cargo and works',()=>{
  const p=lifePresentationState({species:'DIGITAL_ANT',state:'OBSERVE',cargo:{amount:18,unit:'KAIOS'},mission:{status:'IN_TRANSIT'},marketLife:{lifestyle:{action:'WORK'}}});
  assert.equal(p.isAnt,true);assert.equal(p.working,true);assert.equal(p.carrying,true);assert.equal(p.waitingReceipt,false);assert.ok(p.scale>1);
});

test('Digital Ant waiting for receipt has a distinct receipt state',()=>{
  const p=lifePresentationState({species:'DIGITAL_ANT',cargo:{amount:18},mission:{status:'ARRIVED_AWAITING_RECEIPT'},marketLife:{lifestyle:{action:'WORK'}}});
  assert.equal(p.carrying,true);assert.equal(p.waitingReceipt,true);
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
