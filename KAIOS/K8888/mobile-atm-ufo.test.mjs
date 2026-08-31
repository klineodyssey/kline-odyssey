import assert from 'node:assert/strict';
import { MobileAtmUfo, MOBILE_ATM_UFO_CANON } from './mobile-atm-ufo.mjs';

const atm = new MobileAtmUfo({
  reserveFloor: '100',
  cashCapacity: '8000',
  dailyLifeSupportFee: '1',
  withdrawalFeeBps: 30n,
  advanceFeeBps: 100n,
});

assert.equal(MOBILE_ATM_UFO_CANON.bank, 'K8888');
assert.equal(MOBILE_ATM_UFO_CANON.marketplace, 'K11520');
assert.equal(MOBILE_ATM_UFO_CANON.replenisher, 'DIGITAL_ANT_0001');

const listing = atm.listingPacket();
assert.equal(listing.settlementAsset, 'KAIOS');
assert.equal(listing.tradable, 'CANDIDATE_PENDING_K11520_LISTING_AND_SETTLEMENT');

assert.throws(() => atm.replenish({ actor: 'OTHER', amount: '1000', receiptId: 'r1', replayKey: 'x1' }), /REPLENISHER_NOT_AUTHORIZED/);
const refill = atm.replenish({ actor: 'DIGITAL_ANT_0001', amount: '5000', receiptId: 'verified-refill-001', replayKey: 'refill-001' });
assert.equal(refill.amountKAIOS, '5000');
assert.equal(atm.snapshot().cashKAIOS, '5000');

const route = atm.chooseDestination([
  { nodeId: 'K8888', verifiedDemand: 30, cashOutRate: 20, underserved: 20, safety: 95, travelCost: 2 },
  { nodeId: 'K11520', verifiedDemand: 90, cashOutRate: 80, underserved: 60, safety: 90, travelCost: 10 },
  { nodeId: 'K12345', verifiedDemand: 55, cashOutRate: 50, underserved: 70, safety: 90, travelCost: 5 },
]);
assert.equal(route.selected.nodeId, 'K11520');
assert.equal(route.status, 'ROUTE_RECOMMENDATION_ONLY');

const withdrawal = atm.withdraw({ customerId: 'PLAYER-001', amount: '100', eventId: 'cashout-001', replayKey: 'cashout-key-001' });
assert.equal(withdrawal.status, 'ENTITLEMENT_PENDING_SETTLEMENT_RECEIPT');
assert.equal(withdrawal.principalKAIOS, '100');
assert.equal(withdrawal.feeKAIOS, '0.3');

const advance = atm.payrollAdvance({
  customerId: 'WORKER-001',
  verifiedPayrollClaimId: 'PAYROLL-CLAIM-20260905-001',
  verifiedNetSalary: '1000',
  requestedAmount: '400',
  daysUntilPayday: 5,
  eventId: 'advance-001',
  replayKey: 'advance-key-001',
});
assert.equal(advance.status, 'CREDIT_ENTITLEMENT_PENDING_BANK_AND_SETTLEMENT_AUTHORITY');
assert.equal(advance.principalKAIOS, '400');
assert.equal(advance.serviceFeeKAIOS, '4');
assert.equal(advance.repaymentSource, 'VERIFIED_PAYROLL_SETTLEMENT');

const tooLarge = atm.payrollAdvance({
  customerId: 'WORKER-002',
  verifiedPayrollClaimId: 'PAYROLL-CLAIM-002',
  verifiedNetSalary: '1000',
  requestedAmount: '700',
  daysUntilPayday: 5,
  eventId: 'advance-002',
  replayKey: 'advance-key-002',
});
assert.equal(tooLarge.status, 'HOLD_ADVANCE_CAP');

assert.throws(() => atm.payrollAdvance({
  customerId: 'WORKER-003',
  verifiedPayrollClaimId: 'PAYROLL-CLAIM-003',
  verifiedNetSalary: '1000',
  requestedAmount: '100',
  daysUntilPayday: 32,
  eventId: 'advance-003',
  replayKey: 'advance-key-003',
}), /ADVANCE_WINDOW_NOT_ELIGIBLE/);

const life = atm.chargeDailyLifeSupport({ dayId: '2026-08-31', replayKey: 'life-20260831' });
assert.equal(life.status, 'EXPENSE_ACCRUAL_PENDING_REAL_VENDOR_AND_RECEIPT');
assert.equal(life.fixedPersonalWalletAllowed, false);
assert.equal(life.taxTreatment, 'NOT_TAX_UNLESS_CANONICAL_TAX_POLICY_CLASSIFIES_IT');

const tax = atm.accrueTax({ basisAmount: '100', taxBps: 500n, policyId: 'TEST-TAX-POLICY', replayKey: 'tax-001' });
assert.equal(tax.amountKAIOS, '5');
assert.equal(tax.status, 'ACCRUED_NOT_PAID');
assert.equal(tax.destinationClass, 'K18888_CIVILIZATION_TREASURY_IF_POLICY_BOUND');

assert.throws(() => atm.withdraw({ customerId: 'PLAYER-001', amount: '1', eventId: 'x', replayKey: 'cashout-key-001' }), /REPLAY_BLOCKED/);

console.log('K8888_MOBILE_ATM_UFO_TEST=PASS');
