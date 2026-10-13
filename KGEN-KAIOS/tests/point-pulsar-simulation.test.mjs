import assert from 'node:assert/strict';
import test from 'node:test';
import {observePointPulse, previewPulsarNutrition} from '../tools/point-pulsar-simulation.mjs';

const pulse = (pointId, periodSeconds, observedAtSeconds, phaseSeconds = 0) =>
  observePointPulse({pointId, periodSeconds, observedAtSeconds, phaseSeconds});

test('12345 and another point have independent, configurable pulse intervals', () => {
  const heart = pulse('12345', 3600, 5400);
  const cave = pulse('16888', 5400, 5400);
  assert.equal(heart.previousPulseAtSeconds, 3600);
  assert.equal(heart.nextPulseAtSeconds, 7200);
  assert.equal(cave.previousPulseAtSeconds, 5400);
  assert.equal(cave.nextPulseAtSeconds, 10800);
  assert.equal(cave.pulseDueAtObservation, true);
});

test('phase moves a cave pulse without changing another heart schedule', () => {
  const state = pulse('16888', 5400, 100, 120);
  assert.equal(state.previousPulseAtSeconds, null);
  assert.equal(state.nextPulseAtSeconds, 120);
  assert.equal(state.completedCycle, -1);
});

test('invalid and unsafe pulse parameters fail closed', () => {
  assert.throws(() => pulse('12345', 0, 20), /PERIOD/);
  assert.throws(() => pulse('12345', 3600, -1), /OBSERVED_AT/);
  assert.throws(() => pulse('12345', 3600, 20, 3600), /PHASE_OUTSIDE/);
  assert.throws(() => pulse('12345', 10, Number.MAX_SAFE_INTEGER), /OUT_OF_RANGE/);
});

const gift = overrides => previewPulsarNutrition({
  pointId: '12345',
  eventId: 'TEST_PULSE_001',
  availableVirtualKaiosWei: '1000',
  proposedVirtualKaiosWei: '100',
  contactChannelVerified: true,
  ...overrides
});

test('walletless but reachable life can receive only a virtual nutrition preview', () => {
  const p = gift({});
  assert.equal(p.recipientChannel, 'CONTACT_ONLY');
  assert.equal(p.sourceDeltaWei, '-100');
  assert.equal(p.recipientDeltaWei, '100');
  assert.equal(p.remainingReserveWei, '900');
  assert.equal(p.netCreatedWei, '0');
  assert.equal(p.onchainTransferAuthorized, false);
  assert.equal(p.receiptFinalized, false);
  assert.ok(Object.isFrozen(p));
});

test('verified-wallet route still never signs or transfers chain assets', () => {
  const p = gift({walletBindingVerified: true, contactChannelVerified: false});
  assert.equal(p.recipientChannel, 'WALLET_VERIFIED_EXTERNALLY');
  assert.equal(p.walletOrSecretAccessed, false);
  assert.equal(p.onchainTransferAuthorized, false);
});

test('no verified wallet and no authenticated contact cannot get simulated blood', () => {
  assert.throws(() => gift({contactChannelVerified: false}), /NO_VERIFIED_CONTACT/);
});

test('same event cannot be planned twice if the caller supplied durable event IDs', () => {
  assert.throws(() => gift({priorEventIds: ['TEST_PULSE_001']}), /PULSAR_EVENT_REPLAY/);
});

test('blood supply is finite and cannot be created from zero', () => {
  assert.throws(() => gift({proposedVirtualKaiosWei: '0'}), /ZERO_NUTRITION/);
  assert.throws(() => gift({proposedVirtualKaiosWei: '1001'}), /RESERVE_INSUFFICIENT/);
  assert.throws(() => gift({availableVirtualKaiosWei: '0'}), /RESERVE_INSUFFICIENT/);
});

test('floats, scientific notation and negative balances cannot enter virtual blood ledger', () => {
  assert.throws(() => gift({proposedVirtualKaiosWei: '1.1'}), /DECIMAL_STRING/);
  assert.throws(() => gift({proposedVirtualKaiosWei: '-5'}), /DECIMAL_STRING/);
  assert.throws(() => gift({proposedVirtualKaiosWei: '1e9'}), /DECIMAL_STRING/);
});

test('a second cave uses independent point and event IDs', () => {
  const a = gift({eventId:'POINT16888_01',pointId:'16888',walletBindingVerified:true});
  assert.equal(a.pointId,'16888');
  assert.equal(a.eventId,'POINT16888_01');
  assert.equal(a.status,'SIMULATION_PREVIEW_ONLY');
});

test('this prototype never grants a Life ID or formal employee identity', () => {
  const p=gift({});
  assert.equal(p.identityOrLifeIdIssued,false);
  assert.equal(p.asset,'VIRTUAL_KAIOS_BLOOD');
});
