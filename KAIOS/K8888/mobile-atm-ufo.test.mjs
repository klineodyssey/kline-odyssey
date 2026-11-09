import assert from 'node:assert/strict';
import { MobileAtmUfo, MOBILE_ATM_UFO_CANON } from './mobile-atm-ufo.mjs';

const atm = new MobileAtmUfo({
  reserveFloor: '100',
  cashCapacity: '12000',
  kgenCapacity: '1000',
  dailyLifeSupportFee: '1',
  withdrawalFeeBps: 30n,
  advanceFeeBps: 100n,
  exchangeSpreadBps: 250n,
  loanFeeBps: 150n,
});

assert.equal(MOBILE_ATM_UFO_CANON.bank, 'K8888');
assert.equal(MOBILE_ATM_UFO_CANON.marketplace, 'K11520');
assert.equal(MOBILE_ATM_UFO_CANON.replenisher, 'DIGITAL_ANT_0001');
assert.equal(MOBILE_ATM_UFO_CANON.lifeClass, 'AUTONOMOUS_FINANCIAL_SERVICE_ORGAN_ROBOT');

const listing = atm.listingPacket();
assert.equal(listing.settlementAsset, 'KAIOS');
assert.equal(listing.tradable, 'CANDIDATE_PENDING_K11520_LISTING_AND_SETTLEMENT');

const hb = atm.heartbeat({ eventId: 'hb-1', replayKey: 'hb-key-1' });
assert.equal(hb.status, 'LIFE_HEARTBEAT_RECORDED');
assert.equal(atm.snapshot().heartbeats, '1');

assert.throws(() => atm.replenish({ actor: 'OTHER', amount: '1000', receiptId: 'r1', replayKey: 'x1' }), /REPLENISHER_NOT_AUTHORIZED/);
const refill = atm.replenish({ actor: 'DIGITAL_ANT_0001', amount: '10000', receiptId: 'verified-refill-001', replayKey: 'refill-001' });
assert.equal(refill.amountKAIOS, '10000');

const deposit = atm.deposit({ customerId: 'PLAYER-D', asset: 'KAIOS', amount: '500', eventId: 'dep-1', replayKey: 'dep-key-1' });
assert.equal(deposit.status, 'DEPOSIT_ENTITLEMENT_PENDING_SETTLEMENT_RECEIPT');
assert.equal(deposit.credited, '500');

const route = atm.chooseDestination([
  { nodeId: 'K8888', verifiedDemand: 30, cashOutRate: 20, underserved: 20, safety: 95, travelCost: 2, exchangeDemand: 20, freightDemand: 20 },
  { nodeId: 'K11520', verifiedDemand: 90, cashOutRate: 80, underserved: 60, safety: 90, travelCost: 10, exchangeDemand: 90, freightDemand: 90 },
  { nodeId: 'K12345', verifiedDemand: 55, cashOutRate: 50, underserved: 70, safety: 90, travelCost: 5, exchangeDemand: 50, freightDemand: 60 },
]);
assert.equal(route.selected.nodeId, 'K11520');

const quoteWish = atm.quoteKgenToKaios({ wishedKaiosPerKgen: '800' });
assert.equal(quoteWish.referenceKaiosPerKgen, '800');
assert.equal(quoteWish.payoutKaiosPerKgen, '780');
assert.equal(quoteWish.quoteSource, 'CUSTOMER_WISH_BOUNDED_BY_ATM_POLICY');

const quoteWalkIn = atm.quoteKgenToKaios({ demandScore: 0 });
assert.equal(quoteWalkIn.referenceKaiosPerKgen, '500');
assert.equal(quoteWalkIn.payoutKaiosPerKgen, '487.5');

const exchange = atm.exchangeKgenForKaios({ customerId: 'PLAYER-X', kgenAmount: '1', wishedKaiosPerKgen: '800', eventId: 'fx-1', replayKey: 'fx-key-1' });
assert.equal(exchange.kgenIn, '1');
assert.equal(exchange.kaiosOut, '780');
assert.equal(exchange.spreadRevenueKAIOS, '20');
assert.equal(exchange.status, 'EXCHANGE_ENTITLEMENT_PENDING_DUAL_ASSET_SETTLEMENT_RECEIPT');
assert.equal(atm.snapshot().kgenInventory, '1');

const withdrawal = atm.withdraw({ customerId: 'PLAYER-001', amount: '100', eventId: 'cashout-001', replayKey: 'cashout-key-001' });
assert.equal(withdrawal.feeKAIOS, '0.3');

const loan = atm.loan({ customerId: 'BORROWER-1', verifiedCreditId: 'CREDIT-1', principal: '200', maxPrincipal: '500', eventId: 'loan-1', replayKey: 'loan-key-1' });
assert.equal(loan.principalKAIOS, '200');
assert.equal(loan.financeChargeKAIOS, '3');

const advance = atm.payrollAdvance({
  customerId: 'WORKER-001', verifiedPayrollClaimId: 'PAYROLL-CLAIM-20260905-001', verifiedNetSalary: '1000',
  requestedAmount: '400', daysUntilPayday: 5, eventId: 'advance-001', replayKey: 'advance-key-001',
});
assert.equal(advance.principalKAIOS, '400');
assert.equal(advance.serviceFeeKAIOS, '4');

const freightGood = atm.planFreight({ destinationNode: 'K11520', kaiosCargo: '800', verifiedDemandScore: 100, baseFreight: '50', distanceCost: '30', eventId: 'freight-1' });
assert.equal(freightGood.projectedFreightRevenueKAIOS, '100');
assert.equal(freightGood.projectedProfitKAIOS, '70');
assert.equal(freightGood.status, 'PROFITABLE_ROUTE_CANDIDATE');

const freightBad = atm.planFreight({ destinationNode: 'K99999', kaiosCargo: '800', verifiedDemandScore: 0, baseFreight: '50', distanceCost: '80', eventId: 'freight-2' });
assert.equal(freightBad.projectedProfitKAIOS, '-30');
assert.equal(freightBad.status, 'DO_NOT_ROUTE_UNLESS_STRATEGIC');

const life = atm.chargeDailyLifeSupport({ dayId: '2026-08-31', replayKey: 'life-20260831' });
assert.equal(life.status, 'EXPENSE_ACCRUAL_PENDING_REAL_VENDOR_AND_RECEIPT');
assert.equal(life.fixedPersonalWalletAllowed, false);

const tax = atm.accrueTax({ basisAmount: '100', taxBps: 500n, policyId: 'TEST-TAX-POLICY', replayKey: 'tax-001' });
assert.equal(tax.amountKAIOS, '5');
assert.equal(tax.destinationClass, 'K18888_CIVILIZATION_TREASURY_IF_POLICY_BOUND');

assert.throws(() => atm.withdraw({ customerId: 'PLAYER-001', amount: '1', eventId: 'x', replayKey: 'cashout-key-001' }), /REPLAY_BLOCKED/);

console.log('K8888_MOBILE_ATM_UFO_TEST=PASS');
