// KAIOS warp/index position layer for the existing K11520 exchange.
// External prices are index evidence only. KAIOS is collateral/PnL settlement unit.

export const WARP_POLICY = Object.freeze({
  marketLayer: "K11520_EXISTING_EXCHANGE_DERIVATIVE_LAYER",
  pointValueKaios: 1,
  maxWarpCReview: 1000,
  maintenanceMarginBps: 500,
  settlementAsset: "KAIOS",
  externalIndexSettlementAuthority: false,
  productionCustody: "NOT_CONNECTED"
});

function fail(code) { const e = new Error(code); e.code = code; throw e; }
function positive(v, code) { const n = Number(v); if (!Number.isFinite(n) || n <= 0) fail(code); return n; }

export function pnlKaios({ entry, mark, direction, warpC, pointValueKaios = 1 }) {
  const e = positive(entry, "INVALID_ENTRY");
  const m = positive(mark, "INVALID_MARK");
  const c = positive(warpC, "INVALID_WARP");
  const pv = positive(pointValueKaios, "INVALID_POINT_VALUE");
  const side = String(direction).toUpperCase();
  if (!['LONG','SHORT'].includes(side)) fail("INVALID_DIRECTION");
  return (m - e) * (side === 'LONG' ? 1 : -1) * c * pv;
}

export function liquidationMark({ entry, direction, warpC, collateralKaios, maintenanceMarginBps = 500 }) {
  const e = positive(entry, "INVALID_ENTRY");
  const c = positive(warpC, "INVALID_WARP");
  const collateral = positive(collateralKaios, "INVALID_COLLATERAL");
  if (!Number.isInteger(Number(maintenanceMarginBps)) || maintenanceMarginBps < 0 || maintenanceMarginBps >= 10000) fail("INVALID_MAINTENANCE_MARGIN");
  const lossBudget = collateral * (1 - Number(maintenanceMarginBps) / 10000);
  const adversePoints = lossBudget / c;
  const side = String(direction).toUpperCase();
  if (side === 'LONG') return Math.max(0, e - adversePoints);
  if (side === 'SHORT') return e + adversePoints;
  fail("INVALID_DIRECTION");
}

export class WarpPositionBook {
  constructor(policy = WARP_POLICY) {
    this.policy = policy;
    this.margin = new Map();
    this.marks = new Map();
    this.positions = new Map();
    this.seq = 0;
  }
  setReferenceMark(symbol, price, evidence = {}) {
    const s = String(symbol || '').trim().toUpperCase(); if (!s) fail('SYMBOL_REQUIRED');
    const p = positive(price, 'INVALID_MARK');
    const record = Object.freeze({symbol:s, price:p, source:evidence.source || 'EXTERNAL_REFERENCE', observedAt:evidence.observedAt || new Date().toISOString(), settlementAuthority:false});
    this.marks.set(s, record); return record;
  }
  creditVerifiedKaios(playerId, amountKaios, receiptEvidence) {
    const id = String(playerId || '').trim(); if (!id) fail('PLAYER_REQUIRED');
    const n = positive(amountKaios, 'INVALID_MARGIN_CREDIT');
    if (!receiptEvidence || receiptEvidence.status !== 'VERIFIED_SETTLED' || receiptEvidence.asset !== 'KAIOS') fail('VERIFIED_KAIOS_RECEIPT_REQUIRED');
    const a = this.margin.get(id) || {balance:0,reserved:0,realized:0}; a.balance += n; this.margin.set(id,a); return this.snapshot(id);
  }
  creditReviewKaios(playerId, amountKaios) {
    const id = String(playerId || '').trim(); if (!id) fail('PLAYER_REQUIRED');
    const n = positive(amountKaios, 'INVALID_MARGIN_CREDIT');
    const a = this.margin.get(id) || {balance:0,reserved:0,realized:0}; a.balance += n; this.margin.set(id,a); return this.snapshot(id);
  }
  _acct(id) { const key=String(id||'').trim(); if(!key) fail('PLAYER_REQUIRED'); if(!this.margin.has(key)) this.margin.set(key,{balance:0,reserved:0,realized:0}); return this.margin.get(key); }
  equity(playerId) {
    const a=this._acct(playerId); let unreal=0;
    for(const p of this.positions.values()) if(p.playerId===String(playerId)&&p.status==='OPEN') { const mark=this.marks.get(p.symbol); if(mark) unreal+=pnlKaios({entry:p.entry,mark:mark.price,direction:p.direction,warpC:p.warpC}); }
    return a.balance+a.realized+unreal;
  }
  available(playerId) { const a=this._acct(playerId); return Math.max(0,this.equity(playerId)-a.reserved); }
  open({playerId,symbol,direction,warpC,collateralKaios}) {
    const mark=this.marks.get(String(symbol||'').toUpperCase()); if(!mark) fail('INDEX_NOT_AVAILABLE');
    const c=positive(warpC,'INVALID_WARP'); if(c>this.policy.maxWarpCReview) fail('WARP_EXCEEDS_REVIEW_CAP');
    const collateral=positive(collateralKaios,'INVALID_COLLATERAL'); if(collateral>this.available(playerId)) fail('INSUFFICIENT_KAIOS_MARGIN');
    const side=String(direction).toUpperCase(); if(!['LONG','SHORT'].includes(side)) fail('INVALID_DIRECTION');
    const a=this._acct(playerId); a.reserved+=collateral;
    const p={positionId:`K11520-WARP-${++this.seq}`,playerId:String(playerId),symbol:mark.symbol,direction:side,warpC:c,collateralKaios:collateral,entry:mark.price,liquidationMark:liquidationMark({entry:mark.price,direction:side,warpC:c,collateralKaios:collateral,maintenanceMarginBps:this.policy.maintenanceMarginBps}),status:'OPEN',openedAt:new Date().toISOString(),settlement:'KAIOS'};
    this.positions.set(p.positionId,p); return {...p};
  }
  close(positionId) {
    const p=this.positions.get(String(positionId)); if(!p||p.status!=='OPEN') fail('POSITION_NOT_OPEN'); const mark=this.marks.get(p.symbol); if(!mark) fail('INDEX_NOT_AVAILABLE');
    const raw=pnlKaios({entry:p.entry,mark:mark.price,direction:p.direction,warpC:p.warpC});
    const realized=Math.max(-p.collateralKaios,raw); const a=this._acct(p.playerId); a.reserved=Math.max(0,a.reserved-p.collateralKaios); a.realized+=realized;
    Object.assign(p,{exit:mark.price,realizedPnlKaios:realized,status:'CLOSED',closedAt:new Date().toISOString()}); return {...p};
  }
  liquidate() {
    const out=[]; for(const p of this.positions.values()) if(p.status==='OPEN') { const mark=this.marks.get(p.symbol); if(!mark) continue; const hit=p.direction==='LONG'?mark.price<=p.liquidationMark:mark.price>=p.liquidationMark; if(hit){const c=this.close(p.positionId); p.status='LIQUIDATED'; c.status='LIQUIDATED'; out.push(c);} } return out;
  }
  snapshot(playerId){const a=this._acct(playerId);return{playerId:String(playerId),kaiosBalance:a.balance,reservedKaios:a.reserved,realizedPnlKaios:a.realized,equityKaios:this.equity(playerId),availableKaios:this.available(playerId),productionCustody:this.policy.productionCustody};}
}
