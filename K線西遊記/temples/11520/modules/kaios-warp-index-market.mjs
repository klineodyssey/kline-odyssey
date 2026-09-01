// 11520 KAIOS Warp Index Market V1
// Frontend/domain candidate only. No private key, custody, autonomous chain write, or Mainnet settlement.

const BPS = 10_000n;
const ONE_E18 = 10n ** 18n;

export const WARP_MARKET_ID = "11520_KAIOS_WARP_INDEX_V1";
export const WARP_MARKET_STATUS = "PLAYABLE_LOCAL_CANDIDATE_NO_MAINNET_SETTLEMENT";

export const DEFAULT_WARP_SPEEDS = Object.freeze([
  "0.0000001",
  "0.000001",
  "0.00001",
  "0.0001",
  "0.001",
  "0.01",
  "0.1",
  "1",
  "10",
  "100",
  "1000"
]);

export const DEFAULT_INDEX_SYMBOLS = Object.freeze([
  "BTC/USDT",
  "BTC/BNB",
  "BTC/WBNB",
  "BTC/KGEN",
  "BTC/KAIOS",
  "BNB/USDT"
]);

function err(code, message) {
  const e = new Error(message || code);
  e.code = code;
  return e;
}

function finitePositive(n, code = "INVALID_NUMBER") {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) throw err(code);
  return v;
}

export function computePnlKaios({ entryIndex, currentIndex, direction, warpC, pointValueKaios = 1 }) {
  const entry = finitePositive(entryIndex, "INVALID_ENTRY_INDEX");
  const current = finitePositive(currentIndex, "INVALID_CURRENT_INDEX");
  const speed = finitePositive(warpC, "INVALID_WARP_SPEED");
  const pointValue = finitePositive(pointValueKaios, "INVALID_POINT_VALUE");
  const side = String(direction).toUpperCase();
  if (side !== "LONG" && side !== "SHORT") throw err("INVALID_DIRECTION");
  const delta = current - entry;
  const signed = side === "LONG" ? delta : -delta;
  return signed * speed * pointValue;
}

export function liquidationIndex({ entryIndex, direction, warpC, collateralKaios, maintenanceMarginBps = 500 }) {
  const entry = finitePositive(entryIndex, "INVALID_ENTRY_INDEX");
  const speed = finitePositive(warpC, "INVALID_WARP_SPEED");
  const collateral = finitePositive(collateralKaios, "INVALID_COLLATERAL");
  const mm = Number(maintenanceMarginBps);
  if (!Number.isFinite(mm) || mm < 0 || mm >= 10_000) throw err("INVALID_MAINTENANCE_MARGIN");
  const lossBudget = collateral * (1 - mm / 10_000);
  const points = lossBudget / speed;
  const side = String(direction).toUpperCase();
  if (side === "LONG") return Math.max(0, entry - points);
  if (side === "SHORT") return entry + points;
  throw err("INVALID_DIRECTION");
}

export class KaiosWarpIndexMarket {
  constructor({ maintenanceMarginBps = 500, maxWarpC = 1000, pointValueKaios = 1 } = {}) {
    this.maintenanceMarginBps = maintenanceMarginBps;
    this.maxWarpC = maxWarpC;
    this.pointValueKaios = pointValueKaios;
    this.accounts = new Map();
    this.positions = new Map();
    this.indexes = new Map();
    this.events = [];
    this.sequence = 0;
  }

  _account(playerId) {
    const id = String(playerId || "").trim();
    if (!id) throw err("PLAYER_REQUIRED");
    if (!this.accounts.has(id)) this.accounts.set(id, { deposited: 0, reserved: 0, realizedPnl: 0 });
    return this.accounts.get(id);
  }

  setIndex(symbol, price, evidence = {}) {
    const s = String(symbol || "").trim().toUpperCase();
    if (!s) throw err("SYMBOL_REQUIRED");
    const p = finitePositive(price, "INVALID_INDEX_PRICE");
    const record = {
      symbol: s,
      price: p,
      source: evidence.source || "EXTERNAL_REFERENCE_ORACLE",
      observedAt: evidence.observedAt || new Date().toISOString(),
      evidenceId: evidence.evidenceId || null,
      settlementAuthority: false
    };
    this.indexes.set(s, record);
    return record;
  }

  getIndex(symbol) {
    return this.indexes.get(String(symbol || "").trim().toUpperCase()) || null;
  }

  depositLocal(playerId, amountKaios, evidence = {}) {
    const amount = finitePositive(amountKaios, "INVALID_DEPOSIT");
    const a = this._account(playerId);
    a.deposited += amount;
    this._event("MARGIN_DEPOSIT_LOCAL", playerId, { amountKaios: amount, evidence });
    return this.snapshot(playerId);
  }

  withdrawLocal(playerId, amountKaios) {
    const amount = finitePositive(amountKaios, "INVALID_WITHDRAW");
    const a = this._account(playerId);
    const available = this.availableKaios(playerId);
    if (amount > available) throw err("INSUFFICIENT_AVAILABLE_MARGIN");
    a.deposited -= amount;
    this._event("MARGIN_WITHDRAW_LOCAL", playerId, { amountKaios: amount });
    return this.snapshot(playerId);
  }

  equityKaios(playerId) {
    const a = this._account(playerId);
    let unrealized = 0;
    for (const p of this.positions.values()) {
      if (p.playerId !== String(playerId)) continue;
      if (p.status !== "OPEN") continue;
      const idx = this.getIndex(p.symbol);
      if (!idx) continue;
      unrealized += computePnlKaios({
        entryIndex: p.entryIndex,
        currentIndex: idx.price,
        direction: p.direction,
        warpC: p.warpC,
        pointValueKaios: this.pointValueKaios
      });
    }
    return a.deposited + a.realizedPnl + unrealized;
  }

  availableKaios(playerId) {
    const a = this._account(playerId);
    return Math.max(0, this.equityKaios(playerId) - a.reserved);
  }

  openPosition({ playerId, symbol, direction, warpC, collateralKaios }) {
    const idx = this.getIndex(symbol);
    if (!idx) throw err("INDEX_NOT_AVAILABLE");
    const speed = finitePositive(warpC, "INVALID_WARP_SPEED");
    if (speed > this.maxWarpC) throw err("WARP_EXCEEDS_CURRENT_SAFETY_CAP");
    const collateral = finitePositive(collateralKaios, "INVALID_COLLATERAL");
    if (collateral > this.availableKaios(playerId)) throw err("INSUFFICIENT_AVAILABLE_MARGIN");
    const side = String(direction).toUpperCase();
    if (side !== "LONG" && side !== "SHORT") throw err("INVALID_DIRECTION");
    const a = this._account(playerId);
    a.reserved += collateral;
    const id = `WARP-POS-${++this.sequence}`;
    const p = {
      positionId: id,
      playerId: String(playerId),
      symbol: idx.symbol,
      direction: side,
      warpC: speed,
      collateralKaios: collateral,
      entryIndex: idx.price,
      openedAt: new Date().toISOString(),
      liquidationIndex: liquidationIndex({
        entryIndex: idx.price,
        direction: side,
        warpC: speed,
        collateralKaios: collateral,
        maintenanceMarginBps: this.maintenanceMarginBps
      }),
      status: "OPEN",
      settlement: "LOCAL_SIMULATION_ONLY"
    };
    this.positions.set(id, p);
    this._event("POSITION_OPENED_LOCAL", playerId, p);
    return { ...p };
  }

  closePosition(positionId) {
    const p = this.positions.get(String(positionId));
    if (!p || p.status !== "OPEN") throw err("POSITION_NOT_OPEN");
    const idx = this.getIndex(p.symbol);
    if (!idx) throw err("INDEX_NOT_AVAILABLE");
    const pnl = computePnlKaios({
      entryIndex: p.entryIndex,
      currentIndex: idx.price,
      direction: p.direction,
      warpC: p.warpC,
      pointValueKaios: this.pointValueKaios
    });
    const boundedPnl = Math.max(-p.collateralKaios, pnl);
    const a = this._account(p.playerId);
    a.reserved = Math.max(0, a.reserved - p.collateralKaios);
    a.realizedPnl += boundedPnl;
    p.exitIndex = idx.price;
    p.realizedPnlKaios = boundedPnl;
    p.closedAt = new Date().toISOString();
    p.status = "CLOSED";
    this._event("POSITION_CLOSED_LOCAL", p.playerId, { ...p });
    return { ...p };
  }

  checkLiquidations() {
    const closed = [];
    for (const p of this.positions.values()) {
      if (p.status !== "OPEN") continue;
      const idx = this.getIndex(p.symbol);
      if (!idx) continue;
      const hit = p.direction === "LONG" ? idx.price <= p.liquidationIndex : idx.price >= p.liquidationIndex;
      if (hit) {
        const out = this.closePosition(p.positionId);
        out.status = "LIQUIDATED";
        p.status = "LIQUIDATED";
        closed.push(out);
      }
    }
    return closed;
  }

  snapshot(playerId) {
    const a = this._account(playerId);
    return {
      playerId: String(playerId),
      depositedKaios: a.deposited,
      reservedKaios: a.reserved,
      realizedPnlKaios: a.realizedPnl,
      equityKaios: this.equityKaios(playerId),
      availableKaios: this.availableKaios(playerId),
      settlement: "LOCAL_SIMULATION_ONLY",
      mainnetWrites: false
    };
  }

  _event(type, playerId, payload) {
    const e = { eventId: `WARP-EVT-${this.events.length + 1}`, type, playerId: String(playerId), at: new Date().toISOString(), payload };
    this.events.push(e);
    return e;
  }
}

export function formatKaios(value) {
  return `${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 8 })} KAIOS`;
}
