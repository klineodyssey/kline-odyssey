const GAS_ASSET = 'BNB';
const ID_ASSETS = new Set(['KGEN', 'KAIOS']);

function amountOf(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0) throw new Error('INVALID_AMOUNT');
  return amount;
}

function positiveAmount(value) {
  const amount = amountOf(value);
  if (amount <= 0) throw new Error('INVALID_AMOUNT');
  return amount;
}

function required(value, code) {
  if (!value) throw new Error(code);
  return value;
}

export class NaiheLifeReservoir {
  constructor({
    reservoirId = 'K4168-RESERVOIR',
    bridgeId = 'K4168',
    bridgeName = '奈何橋',
    keeper = '孟婆',
    minimumReserveBNB = 0,
    dailyOutflowCapBNB = Infinity,
    targetActivationBNB = 0.00005,
    maxActivationBNB = 0.0001,
  } = {}) {
    this.reservoirId = reservoirId;
    this.bridgeId = bridgeId;
    this.bridgeName = bridgeName;
    this.keeper = keeper;
    this.balanceBNB = 0;
    this.minimumReserveBNB = amountOf(minimumReserveBNB);
    this.dailyOutflowCapBNB = Number(dailyOutflowCapBNB);
    this.targetActivationBNB = positiveAmount(targetActivationBNB);
    this.maxActivationBNB = positiveAmount(maxActivationBNB);
    if (this.maxActivationBNB < this.targetActivationBNB) throw new Error('INVALID_ACTIVATION_LIMITS');
    this.usedOutflowBNB = 0;
    this.processedKeys = new Set();
    this.previousLifeMemory = new Map();
    this.ledger = [];
  }

  snapshot() {
    return {
      reservoirId: this.reservoirId,
      bridgeId: this.bridgeId,
      bridgeName: this.bridgeName,
      keeper: this.keeper,
      soupAsset: GAS_ASSET,
      balanceBNB: this.balanceBNB,
      minimumReserveBNB: this.minimumReserveBNB,
      dailyOutflowCapBNB: this.dailyOutflowCapBNB,
      usedOutflowBNB: this.usedOutflowBNB,
      targetActivationBNB: this.targetActivationBNB,
      entries: this.ledger.length,
    };
  }

  depositBNB({ amount, source, receiptId, replayKey }) {
    amount = positiveAmount(amount);
    required(source, 'SOURCE_REQUIRED');
    required(receiptId, 'RECEIPT_REQUIRED');
    required(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processedKeys.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    this.processedKeys.add(replayKey);
    this.balanceBNB += amount;
    const entry = { type: 'RESERVOIR_INFLOW', asset: GAS_ASSET, amount, source, receiptId, replayKey, status: 'SETTLED_VERIFIED_RECEIPT' };
    this.ledger.push(entry);
    return entry;
  }

  rememberLife({ lifeId, wallet, outcome, reason, evidenceId }) {
    required(lifeId, 'LIFE_ID_REQUIRED');
    required(wallet, 'WALLET_REQUIRED');
    const record = { lifeId, wallet, outcome, reason: reason || null, evidenceId: evidenceId || null };
    const history = this.previousLifeMemory.get(lifeId) || [];
    history.push(record);
    this.previousLifeMemory.set(lifeId, history);
    return record;
  }

  assessIdentity({
    lifeId,
    wallet,
    walletControlVerified,
    kgenBalance = 0,
    kaiosBalance = 0,
    civilizationActivity = 0,
    extractiveHistory = false,
    blacklistEvidence = null,
  }) {
    required(lifeId, 'LIFE_ID_REQUIRED');
    required(wallet, 'WALLET_REQUIRED');
    const kgen = amountOf(kgenBalance);
    const kaios = amountOf(kaiosBalance);
    const activity = amountOf(civilizationActivity);
    const previous = this.previousLifeMemory.get(lifeId) || [];
    const holdingEvidence = kgen > 0 || kaios > 0;
    const identityConfidence = [walletControlVerified, holdingEvidence, activity > 0, previous.length > 0].filter(Boolean).length;

    if (blacklistEvidence) {
      return { decision: 'DENY', reason: 'EVIDENCE_BOUND_BLACKLIST', identityConfidence, holdingEvidence, previousLifeRecords: previous.length };
    }
    if (extractiveHistory && activity === 0) {
      return { decision: 'QUARANTINE', reason: 'EXTERNAL_EXTRACTIVE_VISITOR_RISK', identityConfidence, holdingEvidence, previousLifeRecords: previous.length };
    }
    if (!walletControlVerified) {
      return { decision: 'DENY', reason: 'WALLET_CONTROL_NOT_VERIFIED', identityConfidence, holdingEvidence, previousLifeRecords: previous.length };
    }
    return { decision: 'ALLOW', reason: 'IDENTITY_AND_CONTROL_ACCEPTED', identityConfidence, holdingEvidence, previousLifeRecords: previous.length };
  }

  calculateActivationNeed({ currentBNB }) {
    const current = amountOf(currentBNB);
    if (current >= this.targetActivationBNB) return 0;
    return Math.min(this.targetActivationBNB - current, this.maxActivationBNB);
  }

  requestMengPoSoup({ lifeId, wallet, currentBNB, identity, employerSponsored = false, eventId, replayKey }) {
    required(eventId, 'EVENT_ID_REQUIRED');
    required(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processedKeys.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    if (!identity || identity.decision !== 'ALLOW') {
      return { status: 'DENIED_IDENTITY_GATE', lifeId, wallet, reason: identity?.reason || 'IDENTITY_REQUIRED' };
    }

    const amount = this.calculateActivationNeed({ currentBNB });
    if (amount === 0) return { status: 'NO_SOUP_NEEDED', lifeId, wallet, amountBNB: 0 };
    const projected = this.balanceBNB - amount;
    if (projected < this.minimumReserveBNB) return { status: 'HOLD_MINIMUM_RESERVE', lifeId, wallet, amountBNB: amount };
    if (this.usedOutflowBNB + amount > this.dailyOutflowCapBNB) return { status: 'HOLD_DAILY_OUTFLOW_CAP', lifeId, wallet, amountBNB: amount };

    this.processedKeys.add(replayKey);
    this.balanceBNB = projected;
    this.usedOutflowBNB += amount;
    const entry = {
      type: 'MENG_PO_SOUP',
      bridgeId: this.bridgeId,
      reservoirId: this.reservoirId,
      keeper: this.keeper,
      lifeId,
      wallet,
      asset: GAS_ASSET,
      amountBNB: amount,
      purpose: employerSponsored ? 'EMPLOYER_SPONSORED_GAS' : 'LIFE_MINIMUM_GAS',
      eventId,
      replayKey,
      status: 'ENTITLEMENT_APPROVED_PENDING_SETTLEMENT_RECEIPT',
    };
    this.ledger.push(entry);
    return entry;
  }

  convertMatter({ lifeId, materialType, materialAmount, eventId, replayKey, conversionRate = 1 }) {
    required(lifeId, 'LIFE_ID_REQUIRED');
    required(materialType, 'MATERIAL_TYPE_REQUIRED');
    required(eventId, 'EVENT_ID_REQUIRED');
    required(replayKey, 'REPLAY_KEY_REQUIRED');
    if (this.processedKeys.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    const amount = positiveAmount(materialAmount);
    const rate = positiveAmount(conversionRate);
    this.processedKeys.add(replayKey);
    const entry = {
      type: 'MATTER_TO_DARK_MATTER',
      keeper: this.keeper,
      lifeId,
      materialType,
      materialAmount: amount,
      darkMatterEntitlement: amount * rate,
      eventId,
      replayKey,
      status: 'ENTITLEMENT_ONLY_PENDING_VERIFIED_CONVERSION_RECEIPT',
    };
    this.ledger.push(entry);
    return entry;
  }

  resetDailyOutflow() {
    this.usedOutflowBNB = 0;
  }
}

export const K4168_CANON = Object.freeze({
  bridgeId: 'K4168',
  bridgeName: '奈何橋',
  reservoirId: 'K4168-RESERVOIR',
  reservoirRole: 'SEPARATE_FROM_BRIDGE',
  keeperNpc: '孟婆',
  soupAsset: 'BNB',
  identityAssets: [...ID_ASSETS],
  identityRule: 'LIFE_ID + WALLET_SIGNATURE + KGEN/KAIOS_HOLDING_HISTORY + CIVILIZATION_ACTIVITY',
  povertyRule: 'POVERTY_IS_NOT_FAILURE_AND_SOUP_IS_NOT_WEALTH_GRANT',
  workRule: 'NO_ASSET_LIFE_CAN_WORK_CREATE_SERVE_AND_EARN',
  conversionRule: 'NO_VERIFIED_RECEIPT_NO_SETTLED_DARK_MATTER',
  quote: '君不見，黃河之水天上來，奔流到海不復回。',
});
