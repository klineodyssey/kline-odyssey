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
