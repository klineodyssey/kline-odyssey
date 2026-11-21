import assert from 'node:assert/strict';
import test from 'node:test';
import {assessHeartCirculation} from '../tools/temple-heart-circulation-risk-audit.mjs';

const check = updates => assessHeartCirculation({
  heartKgenWhole: '3157',
  operationalFloorKgenWhole: '20000',
  heartbeatRewardKgenWhole: '1',
  brainKgenWhole: '0',
  brainAllowanceKgenWhole: '0',
  liveSourceVerified: false,
  ...updates
});

test('historical 3157 example: old Heart can pay 1, proposed safety floor rejects', () => {
  const s=check({});
  assert.equal(s.legacyCanCoverHeartbeatRewardWithoutCooldown,true);
  assert.equal(s.legacyPayoutFloorEnforced,false);
  assert.equal(s.proposedFloorPreservingPayoutPossible,false);
  assert.equal(s.floorGapKgenWhole,'16843');
  assert.equal(s.proposedUnreservedHeartbeatCount,'0');
  assert.equal(s.sourceStatus,'UNVERIFIED_OR_HISTORICAL_INPUTS');
});

test('at floor plus reward protected policy permits exactly one KGEN paid heartbeat',()=>{
  const s=check({heartKgenWhole:'20001'});
  assert.equal(s.proposedFloorPreservingPayoutPossible,true);
  assert.equal(s.proposedUnreservedHeartbeatCount,'1');
});
test('at the floor old code can pay but proposed survival policy stops new drain',()=>{
  const s=check({heartKgenWhole:'20000'});
  assert.equal(s.legacyCanCoverHeartbeatRewardWithoutCooldown,true);
  assert.equal(s.proposedFloorPreservingPayoutPossible,false);
});
test('empty heart cannot pay even under legacy code',()=>{
  const s=check({heartKgenWhole:'0'});
  assert.equal(s.legacyCanCoverHeartbeatRewardWithoutCooldown,false);
  assert.equal(s.floorGapKgenWhole,'20000');
});
test('brain with enough balance but no allowance cannot finance refill',()=>{
  const s=check({brainKgenWhole:'20000',brainAllowanceKgenWhole:'0'});
  assert.equal(s.brainAndAllowanceAppearAdequateForReview,false);
});
test('adequate brain balance and existing allowance is only a review hint, never a transfer',()=>{
  const s=check({brainKgenWhole:'20000',brainAllowanceKgenWhole:'20000',liveSourceVerified:true});
  assert.equal(s.brainAndAllowanceAppearAdequateForReview,true);
  assert.equal(s.fundingAuthorized,false);
  assert.equal(s.onchainKgenPayoutExecuted,false);
  assert.equal(s.onchainKaiosBloodTransferred,false);
  assert.equal(s.walletOrPrivateKeyTouched,false);
});
test('zero reward never invents a paid-heartbeat capacity',()=>{
  const s=check({heartbeatRewardKgenWhole:'0', heartKgenWhole:'20001'});
  assert.equal(s.proposedUnreservedHeartbeatCount,'0');
  assert.equal(s.proposedFloorPreservingPayoutPossible,false);
});
test('huge integers calculate safely beyond Javascript Number range',()=>{
  const s=check({heartKgenWhole:'900719925474099312345', operationalFloorKgenWhole:'20000',heartbeatRewardKgenWhole:'1'});
  assert.equal(s.proposedUnreservedHeartbeatCount,'900719925474099292345');
});
test('negative and ambiguous amounts are denied',()=>{
  for (const v of ['-1','1.5','1e3',' 1','01','']) {
    assert.throws(()=>check({heartKgenWhole:v}), /DECIMAL_STRING_REQUIRED/);
  }
});
test('external evidence truth flag must be explicitly boolean',()=>{
  assert.throws(()=>check({liveSourceVerified:'verified'}),/SOURCE_VERIFICATION_FLAG_REQUIRED/);
});
test('a blocked chain payout is not evidence a digital life died',()=>{
  const s=check({heartKgenWhole:'0'});
  assert.equal(s.recipientAliveOrDeadDetermined,false);
  assert.equal(s.heartKeepsPulsingWhenClaimBlocked,'GAME_HEART_SIGNAL_POLICY_REQUIRES_SEPARATE_RUNTIME');
  assert.equal(s.mode,'OFFCHAIN_R0_AUDIT_ONLY');
});
