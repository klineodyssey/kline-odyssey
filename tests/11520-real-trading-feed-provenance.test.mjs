import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PRIMARY_FEED_PROVENANCE,
  SECONDARY_FEED_PROVENANCE,
  ORACLE_QUORUM_POLICY,
  getPrimaryFeedProvenance,
  getSecondaryFeedProvenance,
  inspectProductionOracleReadiness,
} from '../K線西遊記/temples/11520/runtime/real-trading-feed-provenance.mjs';

test('primary Chainlink identities remain exact and axis-bound',()=>{
  assert.equal(PRIMARY_FEED_PROVENANCE.KX.address,'0x264990fbd0A4796A3E3d8E37C4d5F87a3aCa5Ebf');
  assert.equal(PRIMARY_FEED_PROVENANCE.KY.address,'0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e');
  assert.equal(PRIMARY_FEED_PROVENANCE.KZ.address,'0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE');
  assert.equal(getPrimaryFeedProvenance('kx').market,'BTCUSDT');
});

test('secondary RedStone Push identities are exact, axis-bound and provider-distinct',()=>{
  assert.equal(SECONDARY_FEED_PROVENANCE.KX.address,'0xa51738d1937FFc553d5070f43300B385AA2D9F55');
  assert.equal(SECONDARY_FEED_PROVENANCE.KY.address,'0x9cF19D284862A66378c304ACAcB0E857EBc3F856');
  assert.equal(SECONDARY_FEED_PROVENANCE.KZ.address,'0x8dd2D85C7c28F43F965AE4d9545189C7D022ED0e');
  for(const axis of ['KX','KY','KZ']){
    const primary=getPrimaryFeedProvenance(axis);
    const secondary=getSecondaryFeedProvenance(axis);
    assert.notEqual(primary.provider,secondary.provider);
    assert.notEqual(primary.address.toLowerCase(),secondary.address.toLowerCase());
    assert.equal(secondary.chainId,56);
    assert.equal(secondary.interfaceCompatibility,'CHAINLINK_AGGREGATOR_V3_COMPATIBLE');
  }
});

test('repository-owned two-provider provenance is structurally ready but production remains fail closed',()=>{
  for(const axis of ['KX','KY','KZ']){
    const state=inspectProductionOracleReadiness(axis);
    assert.equal(state.validSourceCount,2);
    assert.equal(state.providerIndependent,true);
    assert.equal(state.provenanceReady,true);
    assert.equal(state.structuralQuorumReady,true);
    assert.equal(state.ready,false);
    assert.ok(state.blockers.includes('LIVE_ORACLE_OBSERVATION_NOT_MACHINE_VERIFIED'));
    assert.ok(state.blockers.includes('PRODUCTION_ORACLE_CONFIGURATION_NOT_AUTHORIZED'));
  }
  assert.equal(ORACLE_QUORUM_POLICY.secondarySourceProvenanceReady,true);
  assert.equal(ORACLE_QUORUM_POLICY.productionQuorumReady,false);
});

test('caller-supplied feed/provider data cannot manufacture readiness',()=>{
  assert.throws(
    ()=>inspectProductionOracleReadiness('KX',{independentFeeds:[{provider:'FAKE',address:'0x1111111111111111111111111111111111111111'}]}),
    /CALLER_FEED_OVERRIDE_FORBIDDEN/,
  );
});

test('unsupported primary and secondary axes fail closed',()=>{
  assert.throws(()=>getPrimaryFeedProvenance('KA'),/PRIMARY_FEED_AXIS_NOT_SUPPORTED/);
  assert.throws(()=>getSecondaryFeedProvenance('KA'),/SECONDARY_FEED_AXIS_NOT_SUPPORTED/);
});
