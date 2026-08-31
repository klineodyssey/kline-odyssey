const KAIOS_DECIMALS = 18n;
const SCALE = 10n ** KAIOS_DECIMALS;

function units(value) {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value) * SCALE;
  if (typeof value !== 'string' || !/^\d+(\.\d{1,18})?$/.test(value)) throw new Error('INVALID_KAIOS_AMOUNT');
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * SCALE + BigInt((fraction + '0'.repeat(18)).slice(0, 18));
}

function asKAIOS(value) {
  const whole = value / SCALE;
  const fraction = String(value % SCALE).padStart(18, '0').replace(/0+$/, '');
  return fraction ? `${whole}.${fraction}` : `${whole}`;
}

function requireText(value, code) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(code);
  return value.trim();
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

export class MobileAtmUfo {
  constructor({
    assetId = 'K8888-MOBILE-ATM-UFO-001',
    bankNode = 'K8888',
    marketNode = 'K11520',
    treasuryNode = 'K18888',
    replenisher = 'DIGITAL_ANT_0001',
    reserveFloor = '100',
    cashCapacity = '8000',
    advanceFeeBps = 100n,
    withdrawalFeeBps = 30n,
    dailyLifeSupportFee = '1',
  } = {}) {
    this.assetId = assetId;
    this.bankNode = bankNode;
    this.marketNode = marketNode;
    this.treasuryNode = treasuryNode;
    this.replenisher = replenisher;
    this.reserveFloor = units(reserveFloor);
    this.cashCapacity = units(cashCapacity);
    this.advanceFeeBps = BigInt(advanceFeeBps);
    this.withdrawalFeeBps = BigInt(withdrawalFeeBps);
    this.dailyLifeSupportFee = units(dailyLifeSupportFee);
    this.cash = 0n;
    this.operatingRevenue = 0n;
    this.taxAccrued = 0n;
    this.processed = new Set();
    this.ledger = [];
  }

  listingPacket() {
    return Object.freeze({
      venue: this.marketNode,
      assetId: this.assetId,
      assetClass: 'ORGAN_ROBOT_MOBILE_FINANCIAL_SERVICE_VEHICLE',
      tradable: 'CANDIDATE_PENDING_K11520_LISTING_AND_SETTLEMENT',
      settlementAsset: 'KAIOS',
      ownershipRule: 'PURCHASE_DOES_NOT_EQUAL_AUTOMATIC_ACTIVATION',
      requiredChecks: ['OWNERSHIP', 'POWER', 'COMPUTE', 'NETWORK', 'BANK_SERVICE_LICENSE', 'SETTLEMENT_RECEIPT'],
    });
  }

  replenish({ actor, amount, receiptId, replayKey, source = 'K8888_ATM_INVENTORY' }) {
    requireText(actor, 'ACTOR_REQUIRED');
    if (actor !== this.replenisher) throw new Error('REPLENISHER_NOT_AUTHORIZED');
    requireText(receiptId, 'RECEIPT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const value = units(amount);
    if (value <= 0n) throw new Error('INVALID_AMOUNT');
    if (this.cash + value > this.cashCapacity) throw new Error('ATM_CAPACITY_EXCEEDED');
    this.processed.add(replayKey);
    this.cash += value;
    const event = { type: 'REPLENISH', actor, source, amountKAIOS: asKAIOS(value), receiptId, replayKey, status: 'VERIFIED_RECEIPT_REQUIRED_BY_CALLER_ADAPTER' };
    this.ledger.push(event);
    return event;
  }

  scoreDestination({ nodeId, verifiedDemand = 0, cashOutRate = 0, underserved = 0, safety = 100, travelCost = 0 }) {
    requireText(nodeId, 'NODE_REQUIRED');
    const demand = clampScore(verifiedDemand);
    const velocity = clampScore(cashOutRate);
    const access = clampScore(underserved);
    const safe = clampScore(safety);
    const cost = clampScore(travelCost);
    const score = demand * 0.35 + velocity * 0.25 + access * 0.25 + safe * 0.15 - cost * 0.2;
    return { nodeId, score: Math.round(Math.max(0, score) * 100) / 100 };
  }

  chooseDestination(candidates) {
    if (!Array.isArray(candidates) || candidates.length === 0) throw new Error('CANDIDATES_REQUIRED');
    const scored = candidates.map((c) => this.scoreDestination(c)).sort((a, b) => b.score - a.score || a.nodeId.localeCompare(b.nodeId));
    return { selected: scored[0], ranked: scored, status: 'ROUTE_RECOMMENDATION_ONLY' };
  }

  withdraw({ customerId, amount, eventId, replayKey }) {
    requireText(customerId, 'CUSTOMER_REQUIRED');
    requireText(eventId, 'EVENT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const principal = units(amount);
    if (principal <= 0n) throw new Error('INVALID_AMOUNT');
    const fee = (principal * this.withdrawalFeeBps + 9999n) / 10000n;
    if (this.cash - principal < this.reserveFloor) return { status: 'HOLD_RESERVE_FLOOR', customerId, amountKAIOS: asKAIOS(principal) };
    this.processed.add(replayKey);
    this.cash -= principal;
    this.operatingRevenue += fee;
    const event = {
      type: 'ATM_WITHDRAWAL', customerId, principalKAIOS: asKAIOS(principal), feeKAIOS: asKAIOS(fee),
      eventId, replayKey, status: 'ENTITLEMENT_PENDING_SETTLEMENT_RECEIPT',
    };
    this.ledger.push(event);
    return event;
  }

  payrollAdvance({
    customerId,
    verifiedPayrollClaimId,
    verifiedNetSalary,
    requestedAmount,
    daysUntilPayday,
    maxAdvanceBps = 5000n,
    eventId,
    replayKey,
  }) {
    requireText(customerId, 'CUSTOMER_REQUIRED');
    requireText(verifiedPayrollClaimId, 'VERIFIED_PAYROLL_CLAIM_REQUIRED');
    requireText(eventId, 'EVENT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const salary = units(verifiedNetSalary);
    const principal = units(requestedAmount);
    if (!Number.isInteger(daysUntilPayday) || daysUntilPayday < 0 || daysUntilPayday > 31) throw new Error('ADVANCE_WINDOW_NOT_ELIGIBLE');
    const cap = salary * BigInt(maxAdvanceBps) / 10000n;
    if (principal > cap) return { status: 'HOLD_ADVANCE_CAP', capKAIOS: asKAIOS(cap) };
    if (this.cash - principal < this.reserveFloor) return { status: 'HOLD_ATM_LIQUIDITY' };
    const serviceFee = (principal * this.advanceFeeBps + 9999n) / 10000n;
    this.processed.add(replayKey);
    this.cash -= principal;
    this.operatingRevenue += serviceFee;
    const event = {
      type: 'PAYROLL_ADVANCE',
      lender: this.bankNode,
      customerId,
      payrollClaimId: verifiedPayrollClaimId,
      principalKAIOS: asKAIOS(principal),
      serviceFeeKAIOS: asKAIOS(serviceFee),
      repaymentSource: 'VERIFIED_PAYROLL_SETTLEMENT',
      repaymentDue: 'ON_VERIFIED_PAYDAY_RECEIPT',
      eventId,
      replayKey,
      status: 'CREDIT_ENTITLEMENT_PENDING_BANK_AND_SETTLEMENT_AUTHORITY',
    };
    this.ledger.push(event);
    return event;
  }

  chargeDailyLifeSupport({ dayId, replayKey }) {
    requireText(dayId, 'DAY_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    if (this.operatingRevenue < this.dailyLifeSupportFee) return { status: 'HOLD_INSUFFICIENT_OPERATING_REVENUE', requiredKAIOS: asKAIOS(this.dailyLifeSupportFee) };
    this.processed.add(replayKey);
    this.operatingRevenue -= this.dailyLifeSupportFee;
    const event = {
      type: 'DAILY_LIFE_SUPPORT_EXPENSE',
      dayId,
      amountKAIOS: asKAIOS(this.dailyLifeSupportFee),
      beneficiaryClass: 'VERIFIED_GOODS_OR_SERVICE_PROVIDER_REQUIRED',
      fixedPersonalWalletAllowed: false,
      taxTreatment: 'NOT_TAX_UNLESS_CANONICAL_TAX_POLICY_CLASSIFIES_IT',
      status: 'EXPENSE_ACCRUAL_PENDING_REAL_VENDOR_AND_RECEIPT',
    };
    this.ledger.push(event);
    return event;
  }

  accrueTax({ basisAmount, taxBps, policyId, replayKey }) {
    requireText(policyId, 'CANONICAL_TAX_POLICY_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const basis = units(basisAmount);
    const bps = BigInt(taxBps);
    if (bps < 0n || bps > 10000n) throw new Error('INVALID_TAX_RATE');
    const tax = basis * bps / 10000n;
    this.processed.add(replayKey);
    this.taxAccrued += tax;
    const event = { type: 'TAX_ACCRUAL', policyId, destinationClass: 'K18888_CIVILIZATION_TREASURY_IF_POLICY_BOUND', amountKAIOS: asKAIOS(tax), status: 'ACCRUED_NOT_PAID' };
    this.ledger.push(event);
    return event;
  }

  snapshot() {
    return {
      assetId: this.assetId,
      cashKAIOS: asKAIOS(this.cash),
      reserveFloorKAIOS: asKAIOS(this.reserveFloor),
      cashCapacityKAIOS: asKAIOS(this.cashCapacity),
      operatingRevenueKAIOS: asKAIOS(this.operatingRevenue),
      taxAccruedKAIOS: asKAIOS(this.taxAccrued),
      replenisher: this.replenisher,
      bankNode: this.bankNode,
      marketNode: this.marketNode,
      entries: this.ledger.length,
    };
  }
}

export const MOBILE_ATM_UFO_CANON = Object.freeze({
  product: '行動ATM飛碟載具',
  ownerClass: 'PURCHASABLE_ORGAN_ROBOT_ASSET',
  bank: 'K8888',
  marketplace: 'K11520',
  settlementAsset: 'KAIOS',
  replenisher: 'DIGITAL_ANT_0001',
  routePolicy: 'MOVE_TO_VERIFIED_DEMAND_NOT_FAKE_VOLUME',
  payrollPolicy: 'ADVANCE_ONLY_AGAINST_VERIFIED_PAYROLL_CLAIM',
  revenuePolicy: 'SERVICE_FEES_TO_OPERATING_LEDGER_NOT_HUMAN_PERSONAL_WALLET',
  taxPolicy: 'K18888_ONLY_WHEN_CANONICAL_TAX_POLICY_EXISTS',
});
