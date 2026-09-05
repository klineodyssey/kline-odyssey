const TOKEN_DECIMALS = 18n;
const SCALE = 10n ** TOKEN_DECIMALS;

function units(value, code = 'INVALID_AMOUNT') {
  if (typeof value === 'bigint') return value;
  if (typeof value === 'number' && Number.isSafeInteger(value)) return BigInt(value) * SCALE;
  if (typeof value !== 'string' || !/^\d+(\.\d{1,18})?$/.test(value)) throw new Error(code);
  const [whole, fraction = ''] = value.split('.');
  return BigInt(whole) * SCALE + BigInt((fraction + '0'.repeat(18)).slice(0, 18));
}

function asToken(value) {
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

function bpsOf(amount, bps) {
  return (amount * BigInt(bps) + 9999n) / 10000n;
}

export class MobileAtmUfo {
  constructor({
    assetId = 'K8888-MOBILE-ATM-UFO-001',
    lifeId = 'LIFE-K8888-MOBILE-ATM-UFO-001',
    bankNode = 'K8888',
    marketNode = 'K11520',
    treasuryNode = 'K18888',
    replenisher = 'DIGITAL_ANT_0001',
    reserveFloor = '100',
    cashCapacity = '8000',
    kgenCapacity = '10000',
    advanceFeeBps = 100n,
    withdrawalFeeBps = 30n,
    depositFeeBps = 0n,
    exchangeSpreadBps = 250n,
    loanFeeBps = 150n,
    dailyLifeSupportFee = '1',
    fallbackWishRate = '800',
    fallbackWalkInRate = '500',
  } = {}) {
    this.assetId = assetId;
    this.lifeId = lifeId;
    this.bankNode = bankNode;
    this.marketNode = marketNode;
    this.treasuryNode = treasuryNode;
    this.replenisher = replenisher;
    this.reserveFloor = units(reserveFloor);
    this.cashCapacity = units(cashCapacity);
    this.kgenCapacity = units(kgenCapacity);
    this.advanceFeeBps = BigInt(advanceFeeBps);
    this.withdrawalFeeBps = BigInt(withdrawalFeeBps);
    this.depositFeeBps = BigInt(depositFeeBps);
    this.exchangeSpreadBps = BigInt(exchangeSpreadBps);
    this.loanFeeBps = BigInt(loanFeeBps);
    this.dailyLifeSupportFee = units(dailyLifeSupportFee);
    this.fallbackWishRate = units(fallbackWishRate);
    this.fallbackWalkInRate = units(fallbackWalkInRate);
    this.cash = 0n;
    this.kgenInventory = 0n;
    this.customerDeposits = new Map();
    this.loanReceivables = 0n;
    this.operatingRevenue = 0n;
    this.operatingExpense = 0n;
    this.taxAccrued = 0n;
    this.heartbeats = 0n;
    this.processed = new Set();
    this.ledger = [];
  }

  listingPacket() {
    return Object.freeze({
      venue: this.marketNode,
      assetId: this.assetId,
      lifeId: this.lifeId,
      assetClass: 'ORGAN_ROBOT_MOBILE_FINANCIAL_SERVICE_VEHICLE',
      tradable: 'CANDIDATE_PENDING_K11520_LISTING_AND_SETTLEMENT',
      settlementAsset: 'KAIOS',
      ownershipRule: 'PURCHASE_DOES_NOT_EQUAL_AUTOMATIC_ACTIVATION',
      requiredChecks: ['OWNERSHIP','POWER','COMPUTE','NETWORK','BANK_SERVICE_LICENSE','SETTLEMENT_RECEIPT'],
    });
  }

  heartbeat({ eventId, replayKey }) {
    requireText(eventId, 'EVENT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    this.processed.add(replayKey);
    this.heartbeats += 1n;
    const event = { type: 'ATM_HEARTBEAT', lifeId: this.lifeId, sequence: String(this.heartbeats), eventId, replayKey, status: 'LIFE_HEARTBEAT_RECORDED' };
    this.ledger.push(event);
    return event;
  }

  replenish({ actor, amount, receiptId, replayKey, source = 'K8888_ATM_INVENTORY' }) {
    requireText(actor, 'ACTOR_REQUIRED');
    if (actor !== this.replenisher) throw new Error('REPLENISHER_NOT_AUTHORIZED');
    requireText(receiptId, 'RECEIPT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const value = units(amount);
    if (this.cash + value > this.cashCapacity) throw new Error('ATM_CAPACITY_EXCEEDED');
    this.processed.add(replayKey);
    this.cash += value;
    const event = { type: 'REPLENISH', actor, source, amountKAIOS: asToken(value), receiptId, replayKey, status: 'VERIFIED_RECEIPT_REQUIRED_BY_CALLER_ADAPTER' };
    this.ledger.push(event);
    return event;
  }

  scoreDestination({ nodeId, verifiedDemand = 0, cashOutRate = 0, underserved = 0, safety = 100, travelCost = 0, exchangeDemand = 0, freightDemand = 0 }) {
    requireText(nodeId, 'NODE_REQUIRED');
    const demand = clampScore(verifiedDemand);
    const velocity = clampScore(cashOutRate);
    const access = clampScore(underserved);
    const safe = clampScore(safety);
    const cost = clampScore(travelCost);
    const exchange = clampScore(exchangeDemand);
    const freight = clampScore(freightDemand);
    const score = demand * 0.25 + velocity * 0.15 + access * 0.15 + exchange * 0.15 + freight * 0.15 + safe * 0.15 - cost * 0.2;
    return { nodeId, score: Math.round(Math.max(0, score) * 100) / 100 };
  }

  chooseDestination(candidates) {
    if (!Array.isArray(candidates) || candidates.length === 0) throw new Error('CANDIDATES_REQUIRED');
    const scored = candidates.map((c) => this.scoreDestination(c)).sort((a, b) => b.score - a.score || a.nodeId.localeCompare(b.nodeId));
    return { selected: scored[0], ranked: scored, status: 'ROUTE_RECOMMENDATION_ONLY' };
  }

  deposit({ customerId, asset, amount, eventId, replayKey }) {
    requireText(customerId, 'CUSTOMER_REQUIRED');
    requireText(eventId, 'EVENT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (!['KAIOS','KGEN'].includes(asset)) throw new Error('UNSUPPORTED_DEPOSIT_ASSET');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const principal = units(amount);
    const fee = bpsOf(principal, this.depositFeeBps);
    const credited = principal - fee;
    const key = `${customerId}:${asset}`;
    this.customerDeposits.set(key, (this.customerDeposits.get(key) || 0n) + credited);
    if (asset === 'KAIOS') this.cash += principal;
    else this.kgenInventory += principal;
    if (this.cash > this.cashCapacity) throw new Error('ATM_CAPACITY_EXCEEDED');
    if (this.kgenInventory > this.kgenCapacity) throw new Error('KGEN_CAPACITY_EXCEEDED');
    this.operatingRevenue += fee;
    this.processed.add(replayKey);
    const event = { type: 'CUSTOMER_DEPOSIT', customerId, asset, principal: asToken(principal), credited: asToken(credited), fee: asToken(fee), eventId, replayKey, status: 'DEPOSIT_ENTITLEMENT_PENDING_SETTLEMENT_RECEIPT' };
    this.ledger.push(event);
    return event;
  }

  withdraw({ customerId, amount, eventId, replayKey }) {
    requireText(customerId, 'CUSTOMER_REQUIRED');
    requireText(eventId, 'EVENT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const principal = units(amount);
    const fee = bpsOf(principal, this.withdrawalFeeBps);
    if (this.cash - principal < this.reserveFloor) return { status: 'HOLD_RESERVE_FLOOR', customerId, amountKAIOS: asToken(principal) };
    this.processed.add(replayKey);
    this.cash -= principal;
    this.operatingRevenue += fee;
    const event = { type: 'ATM_WITHDRAWAL', customerId, principalKAIOS: asToken(principal), feeKAIOS: asToken(fee), eventId, replayKey, status: 'ENTITLEMENT_PENDING_SETTLEMENT_RECEIPT' };
    this.ledger.push(event);
    return event;
  }

  quoteKgenToKaios({ wishedKaiosPerKgen = null, marketKaiosPerKgen = null, demandScore = 50 }) {
    const market = marketKaiosPerKgen == null ? null : units(marketKaiosPerKgen);
    const wished = wishedKaiosPerKgen == null ? null : units(wishedKaiosPerKgen);
    let reference;
    let source;
    if (market != null) {
      reference = market;
      source = 'VERIFIED_MARKET_REFERENCE';
    } else if (wished != null) {
      const floor = this.fallbackWalkInRate;
      const ceiling = this.fallbackWishRate;
      reference = wished < floor ? floor : wished > ceiling ? ceiling : wished;
      source = 'CUSTOMER_WISH_BOUNDED_BY_ATM_POLICY';
    } else {
      const demand = BigInt(Math.round(clampScore(demandScore)));
      reference = this.fallbackWalkInRate + ((this.fallbackWishRate - this.fallbackWalkInRate) * demand / 100n);
      source = 'ATM_DEMAND_CURVE_FALLBACK';
    }
    const payoutRate = reference * (10000n - this.exchangeSpreadBps) / 10000n;
    return { referenceKaiosPerKgen: asToken(reference), payoutKaiosPerKgen: asToken(payoutRate), quoteSource: source, spreadBps: String(this.exchangeSpreadBps), status: 'QUOTE_ONLY_NOT_SETTLED' };
  }

  exchangeKgenForKaios({ customerId, kgenAmount, wishedKaiosPerKgen = null, marketKaiosPerKgen = null, demandScore = 50, eventId, replayKey }) {
    requireText(customerId, 'CUSTOMER_REQUIRED');
    requireText(eventId, 'EVENT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const kgen = units(kgenAmount);
    const quote = this.quoteKgenToKaios({ wishedKaiosPerKgen, marketKaiosPerKgen, demandScore });
    const payoutRate = units(quote.payoutKaiosPerKgen);
    const payout = kgen * payoutRate / SCALE;
    if (this.cash - payout < this.reserveFloor) return { status: 'HOLD_ATM_LIQUIDITY', requiredKaios: asToken(payout) };
    if (this.kgenInventory + kgen > this.kgenCapacity) return { status: 'HOLD_KGEN_CAPACITY' };
    const referenceRate = units(quote.referenceKaiosPerKgen);
    const grossReference = kgen * referenceRate / SCALE;
    const spreadRevenue = grossReference - payout;
    this.processed.add(replayKey);
    this.cash -= payout;
    this.kgenInventory += kgen;
    this.operatingRevenue += spreadRevenue;
    const event = {
      type: 'KGEN_TO_KAIOS_EXCHANGE', customerId, kgenIn: asToken(kgen), kaiosOut: asToken(payout),
      referenceKaiosPerKgen: quote.referenceKaiosPerKgen, payoutKaiosPerKgen: quote.payoutKaiosPerKgen,
      quoteSource: quote.quoteSource, spreadRevenueKAIOS: asToken(spreadRevenue), eventId, replayKey,
      status: 'EXCHANGE_ENTITLEMENT_PENDING_DUAL_ASSET_SETTLEMENT_RECEIPT',
    };
    this.ledger.push(event);
    return event;
  }

  loan({ customerId, verifiedCreditId, principal, eventId, replayKey, maxPrincipal = '1000' }) {
    requireText(customerId, 'CUSTOMER_REQUIRED');
    requireText(verifiedCreditId, 'VERIFIED_CREDIT_ID_REQUIRED');
    requireText(eventId, 'EVENT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const value = units(principal);
    const cap = units(maxPrincipal);
    if (value > cap) return { status: 'HOLD_CREDIT_CAP', capKAIOS: asToken(cap) };
    if (this.cash - value < this.reserveFloor) return { status: 'HOLD_ATM_LIQUIDITY' };
    const fee = bpsOf(value, this.loanFeeBps);
    this.processed.add(replayKey);
    this.cash -= value;
    this.loanReceivables += value + fee;
    const event = { type: 'K8888_LOAN', lender: this.bankNode, customerId, verifiedCreditId, principalKAIOS: asToken(value), financeChargeKAIOS: asToken(fee), receivableKAIOS: asToken(value + fee), eventId, replayKey, status: 'CREDIT_ENTITLEMENT_PENDING_BANK_AND_SETTLEMENT_AUTHORITY' };
    this.ledger.push(event);
    return event;
  }

  payrollAdvance({ customerId, verifiedPayrollClaimId, verifiedNetSalary, requestedAmount, daysUntilPayday, maxAdvanceBps = 5000n, eventId, replayKey }) {
    requireText(customerId, 'CUSTOMER_REQUIRED');
    requireText(verifiedPayrollClaimId, 'VERIFIED_PAYROLL_CLAIM_REQUIRED');
    requireText(eventId, 'EVENT_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const salary = units(verifiedNetSalary);
    const principal = units(requestedAmount);
    if (!Number.isInteger(daysUntilPayday) || daysUntilPayday < 0 || daysUntilPayday > 31) throw new Error('ADVANCE_WINDOW_NOT_ELIGIBLE');
    const cap = salary * BigInt(maxAdvanceBps) / 10000n;
    if (principal > cap) return { status: 'HOLD_ADVANCE_CAP', capKAIOS: asToken(cap) };
    if (this.cash - principal < this.reserveFloor) return { status: 'HOLD_ATM_LIQUIDITY' };
    const serviceFee = bpsOf(principal, this.advanceFeeBps);
    this.processed.add(replayKey);
    this.cash -= principal;
    this.loanReceivables += principal + serviceFee;
    const event = { type: 'PAYROLL_ADVANCE', lender: this.bankNode, customerId, payrollClaimId: verifiedPayrollClaimId, principalKAIOS: asToken(principal), serviceFeeKAIOS: asToken(serviceFee), repaymentSource: 'VERIFIED_PAYROLL_SETTLEMENT', repaymentDue: 'ON_VERIFIED_PAYDAY_RECEIPT', eventId, replayKey, status: 'CREDIT_ENTITLEMENT_PENDING_BANK_AND_SETTLEMENT_AUTHORITY' };
    this.ledger.push(event);
    return event;
  }

  planFreight({ destinationNode, kaiosCargo, verifiedDemandScore, baseFreight = '50', distanceCost = '0', eventId }) {
    requireText(destinationNode, 'DESTINATION_REQUIRED');
    requireText(eventId, 'EVENT_REQUIRED');
    const cargo = units(kaiosCargo);
    const base = units(baseFreight);
    const cost = units(distanceCost);
    const demand = BigInt(Math.round(clampScore(verifiedDemandScore)));
    const demandPremium = base * demand / 100n;
    const freightRevenue = base + demandPremium;
    const projectedProfit = freightRevenue > cost ? freightRevenue - cost : -(cost - freightRevenue);
    return {
      destinationNode, cargoKAIOS: asToken(cargo), baseFreightKAIOS: asToken(base), demandPremiumKAIOS: asToken(demandPremium),
      distanceCostKAIOS: asToken(cost), projectedFreightRevenueKAIOS: asToken(freightRevenue),
      projectedProfitKAIOS: projectedProfit >= 0n ? asToken(projectedProfit) : `-${asToken(-projectedProfit)}`,
      eventId, status: projectedProfit > 0n ? 'PROFITABLE_ROUTE_CANDIDATE' : 'DO_NOT_ROUTE_UNLESS_STRATEGIC',
    };
  }

  chargeDailyLifeSupport({ dayId, replayKey }) {
    requireText(dayId, 'DAY_REQUIRED');
    requireText(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processed.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    if (this.operatingRevenue < this.dailyLifeSupportFee) return { status: 'HOLD_INSUFFICIENT_OPERATING_REVENUE', requiredKAIOS: asToken(this.dailyLifeSupportFee) };
    this.processed.add(replayKey);
    this.operatingRevenue -= this.dailyLifeSupportFee;
    this.operatingExpense += this.dailyLifeSupportFee;
    const event = { type: 'DAILY_LIFE_SUPPORT_EXPENSE', lifeId: this.lifeId, dayId, amountKAIOS: asToken(this.dailyLifeSupportFee), beneficiaryClass: 'VERIFIED_GOODS_OR_SERVICE_PROVIDER_REQUIRED', fixedPersonalWalletAllowed: false, taxTreatment: 'NOT_TAX_UNLESS_CANONICAL_TAX_POLICY_CLASSIFIES_IT', status: 'EXPENSE_ACCRUAL_PENDING_REAL_VENDOR_AND_RECEIPT' };
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
    const event = { type: 'TAX_ACCRUAL', policyId, destinationClass: 'K18888_CIVILIZATION_TREASURY_IF_POLICY_BOUND', amountKAIOS: asToken(tax), status: 'ACCRUED_NOT_PAID' };
    this.ledger.push(event);
    return event;
  }

  snapshot() {
    return {
      assetId: this.assetId,
      lifeId: this.lifeId,
      heartbeats: String(this.heartbeats),
      cashKAIOS: asToken(this.cash),
      kgenInventory: asToken(this.kgenInventory),
      reserveFloorKAIOS: asToken(this.reserveFloor),
      cashCapacityKAIOS: asToken(this.cashCapacity),
      operatingRevenueKAIOS: asToken(this.operatingRevenue),
      operatingExpenseKAIOS: asToken(this.operatingExpense),
      loanReceivablesKAIOS: asToken(this.loanReceivables),
      taxAccruedKAIOS: asToken(this.taxAccrued),
      replenisher: this.replenisher,
      bankNode: this.bankNode,
      marketNode: this.marketNode,
      entries: this.ledger.length,
    };
  }
}

export const MOBILE_ATM_UFO_CANON = Object.freeze({
  product: '行動ATM飛碟載具',
  lifeClass: 'AUTONOMOUS_FINANCIAL_SERVICE_ORGAN_ROBOT',
  ownerClass: 'PURCHASABLE_ORGAN_ROBOT_ASSET',
  bank: 'K8888',
  marketplace: 'K11520',
  settlementAsset: 'KAIOS',
  exchangeInputAsset: 'KGEN',
  replenisher: 'DIGITAL_ANT_0001',
  routePolicy: 'MOVE_TO_VERIFIED_DEMAND_NOT_FAKE_VOLUME',
  payrollPolicy: 'ADVANCE_ONLY_AGAINST_VERIFIED_PAYROLL_CLAIM',
  exchangePolicy: '500_TO_800_KAIOS_PER_KGEN_IS_FALLBACK_CANDIDATE_BAND_NOT_CANONICAL_PRICE',
  freightPolicy: 'MOVE_CASH_ONLY_WHEN_VERIFIED_DEMAND_AND_ROUTE_ECONOMICS_SUPPORT_IT',
  revenuePolicy: 'SPREAD_FEES_FREIGHT_TO_OPERATING_LEDGER_NOT_HUMAN_PERSONAL_WALLET',
  taxPolicy: 'K18888_ONLY_WHEN_CANONICAL_TAX_POLICY_EXISTS',
});
