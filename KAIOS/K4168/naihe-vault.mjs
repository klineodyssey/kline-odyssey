const ASSETS = new Set(['KGEN','KAIOS']);

function positiveAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error('INVALID_AMOUNT');
  return amount;
}

function assertAsset(asset) {
  if (!ASSETS.has(asset)) throw new Error('UNSUPPORTED_ASSET');
}

export class NaiheVault {
  constructor({
    nodeId = 'K4168',
    nodeName = '奈何橋',
    keeper = '孟婆',
    minimumReserve = { KGEN: 0, KAIOS: 0 },
    dailyOutflowCap = { KGEN: Infinity, KAIOS: Infinity },
  } = {}) {
    this.nodeId = nodeId;
    this.nodeName = nodeName;
    this.keeper = keeper;
    this.balance = { KGEN: 0, KAIOS: 0 };
    this.minimumReserve = { KGEN: Number(minimumReserve.KGEN || 0), KAIOS: Number(minimumReserve.KAIOS || 0) };
    this.dailyOutflowCap = { KGEN: Number(dailyOutflowCap.KGEN ?? Infinity), KAIOS: Number(dailyOutflowCap.KAIOS ?? Infinity) };
    this.usedOutflow = { KGEN: 0, KAIOS: 0 };
    this.processedKeys = new Set();
    this.ledger = [];
  }

  snapshot() {
    return {
      nodeId: this.nodeId,
      nodeName: this.nodeName,
      keeper: this.keeper,
      balance: { ...this.balance },
      minimumReserve: { ...this.minimumReserve },
      dailyOutflowCap: { ...this.dailyOutflowCap },
      usedOutflow: { ...this.usedOutflow },
      entries: this.ledger.length,
    };
  }

  deposit({ asset, amount, source, receiptId, replayKey }) {
    assertAsset(asset);
    amount = positiveAmount(amount);
    if (!source) throw new Error('SOURCE_REQUIRED');
    if (!receiptId) throw new Error('RECEIPT_REQUIRED');
    if (!replayKey) throw new Error('REPLAY_KEY_REQUIRED');
    if (this.processedKeys.has(replayKey)) throw new Error('REPLAY_BLOCKED');
    this.processedKeys.add(replayKey);
    this.balance[asset] += amount;
    const entry = {
      type: 'DEPOSIT',
      nodeId: this.nodeId,
      asset,
      amount,
      source,
      receiptId,
      replayKey,
      status: 'SETTLED_VERIFIED_RECEIPT',
    };
    this.ledger.push(entry);
    return entry;
  }

  requestDrink({ lifeId, asset, amount, purpose = 'LIFE_HYDRATION', eventId, replayKey }) {
    assertAsset(asset);
    amount = positiveAmount(amount);
    if (!lifeId) throw new Error('LIFE_ID_REQUIRED');
    if (!eventId) throw new Error('EVENT_ID_REQUIRED');
    if (!replayKey) throw new Error('REPLAY_KEY_REQUIRED');
    if (this.processedKeys.has(replayKey)) throw new Error('REPLAY_BLOCKED');

    const projected = this.balance[asset] - amount;
    const reserve = this.minimumReserve[asset];
    const used = this.usedOutflow[asset] + amount;
    if (projected < reserve) return { status: 'HOLD_MINIMUM_RESERVE', asset, amount, lifeId };
    if (used > this.dailyOutflowCap[asset]) return { status: 'HOLD_DAILY_OUTFLOW_CAP', asset, amount, lifeId };

    this.processedKeys.add(replayKey);
    this.balance[asset] = projected;
    this.usedOutflow[asset] = used;
    const entry = {
      type: 'DRINK',
      nodeId: this.nodeId,
      keeper: this.keeper,
      lifeId,
      asset,
      amount,
      purpose,
      eventId,
      replayKey,
      status: 'ENTITLEMENT_APPROVED_PENDING_SETTLEMENT_RECEIPT',
    };
    this.ledger.push(entry);
    return entry;
  }

  convertMatter({ lifeId, inputAsset, amount, eventId, replayKey, darkMatterRate = 1 }) {
    assertAsset(inputAsset);
    amount = positiveAmount(amount);
    const rate = Number(darkMatterRate);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error('INVALID_DARK_MATTER_RATE');
    const drink = this.requestDrink({
      lifeId,
      asset: inputAsset,
      amount,
      purpose: 'MATTER_TO_DARK_MATTER',
      eventId,
      replayKey,
    });
    if (!String(drink.status).startsWith('ENTITLEMENT_APPROVED')) return drink;
    const conversion = {
      type: 'DARK_MATTER_CONVERSION',
      nodeId: this.nodeId,
      keeper: this.keeper,
      lifeId,
      inputAsset,
      inputAmount: amount,
      darkMatterEntitlement: amount * rate,
      unit: 'DARK_MATTER_CREDIT',
      eventId,
      sourceReplayKey: replayKey,
      status: 'ENTITLEMENT_ONLY_PENDING_VERIFIED_CONVERSION_RECEIPT',
    };
    this.ledger.push(conversion);
    return conversion;
  }

  resetDailyOutflow() {
    this.usedOutflow = { KGEN: 0, KAIOS: 0 };
  }
}

export const K4168_CANON = Object.freeze({
  nodeId: 'K4168',
  nodeName: '奈何橋',
  vaultName: '奈何橋生命循環水庫',
  keeperNpc: '孟婆',
  waterAssets: ['KGEN', 'KAIOS'],
  fundingSourceClass: 'HUA_GUO_SHAN_APPROVED_PUBLIC_OR_DEVELOPMENT_SOURCE',
  conversionRule: 'NO_VERIFIED_RECEIPT_NO_SETTLED_DARK_MATTER',
  quote: '君不見，黃河之水天上來，奔流到海不復回。',
});
