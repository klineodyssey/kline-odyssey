import test from 'node:test';
import assert from 'node:assert/strict';
import {PRIMARY_FEED_PROVENANCE,ORACLE_QUORUM_POLICY,getPrimaryFeedProvenance,inspectProductionOracleReadiness} from '../K線西遊記/temples/11520/runtime/real-trading-feed-provenance.mjs';

test('primary BSC feed identities are exact and axis-bound',()=>{
  assert.equal(PRIMARY_FEED_PROVENANCE.KX.address,'0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf');
  assert.equal(PRIMARY_FEED_PROVENANCE.KY.address,'0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e');
  assert.equal(PRIMARY_FEED_PROVENANCE.KZ.address,'0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE');
  assert.equal(getPrimaryFeedProvenance('kx').market,'BTCUSDT');
  assert.equal(getPrimaryFeedProvenance('ky').market,'ETHUSDT');
  assert.equal(getPrimaryFeedProvenance('kz').market,'BNBUSDT');
});

test('one primary feed never satisfies the production 2-source quorum',()=>{
  for(const axis of ['KX','KY','KZ']){
    const state=inspectProductionOracleReadiness(axis);
    assert.equal(state.ready,false);
    assert.equal(state.validSourceCount,1);
    assert.equal(state.providerIndependent,false);
    assert.ok(state.blockers.includes('SECOND_INDEPENDENT_PRODUCTION_FEED_REQUIRED'));
    assert.ok(state.blockers.includes('ORACLE_PROVIDER_INDEPENDENCE_REQUIRED'));
  }
  assert.equal(ORACLE_QUORUM_POLICY.productionQuorumReady,false);
});

test('quorum becomes structurally ready only with a distinct address and provider',()=>{
  const state=inspectProductionOracleReadiness('KX',{independentFeeds:[{provider:'SECOND_PROVIDER_REVIEW_CANDIDATE',address:'0x1111111111111111111111111111111111111111'}]});
  assert.equal(state.ready,true);
  assert.equal(state.validSourceCount,2);
  assert.equal(state.providerIndependent,true);
  assert.deepEqual(state.blockers,[]);
});

test('unsupported axes fail closed',()=>assert.throws(()=>getPrimaryFeedProvenance('KA'),/PRIMARY_FEED_AXIS_NOT_SUPPORTED/));
